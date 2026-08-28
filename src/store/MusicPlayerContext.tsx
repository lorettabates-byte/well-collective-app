import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import type { Song } from "../types";
import { logActivity } from "../utils/wellCup";
import { getPlaybackUrl, isDownloaded } from "../utils/musicOffline";
import { NowPlaying } from "../plugins/NowPlaying";

type RepeatMode = "off" | "all" | "one";

interface MusicPlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: { current: number; duration: number };
  repeatMode: RepeatMode;
  playAt: (queue: Song[], index: number, userEmail?: string) => void;
  togglePlay: () => void;
  handleSkip: (direction: 1 | -1) => void;
  cycleRepeat: () => void;
  handleSeek: (value: number) => void;
  stop: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerState | null>(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Song[]>([]);
  const queueIndexRef = useRef(0);
  const repeatModeRef = useRef<RepeatMode>("off");
  repeatModeRef.current = repeatMode;
  const advancingRef = useRef(false);
  const handleEndedRef = useRef<() => void>(() => {});
  // Persists the last known user email across auto-advances so activity logging
  // continues working when handleEnded fires without a direct user interaction.
  const userEmailRef = useRef<string | undefined>(undefined);
  // Tracks whether audio was playing when the app went to the background (phone
  // call, lock screen, notification overlay) so we can auto-resume on return.
  const wasPlayingBeforeBackground = useRef(false);

  // Create the single Audio element once — it persists for the lifetime of
  // the provider and is never recreated, so playback survives navigation.
  if (!audioRef.current) {
    const audio = new Audio();
    audio.onended = () => handleEndedRef.current();
    audio.ontimeupdate = () =>
      setProgress({ current: audio.currentTime, duration: audio.duration || 0 });
    audio.onloadedmetadata = () =>
      setProgress({ current: audio.currentTime, duration: audio.duration || 0 });
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    // Network stall recovery: if audio stalls while playing, reload from the
    // same position after a short delay so the stream reconnects automatically.
    audio.onstalled = () => {
      setTimeout(() => {
        const a = audioRef.current;
        if (!a || a.paused || a.readyState >= 3) return;
        const t = a.currentTime;
        const src = a.src;
        a.src = src;
        a.currentTime = t;
        a.play().catch(() => {});
      }, 3000);
    };
    // On load error, retry once with the streaming URL in case a local offline
    // file was removed by the OS. If it still fails, advance to next track.
    audio.onerror = () => {
      const streaming = queueRef.current[queueIndexRef.current]?.url;
      if (streaming && audio.src !== streaming) {
        audio.src = streaming;
        audio.play().catch(() => handleEndedRef.current());
      } else {
        handleEndedRef.current();
      }
    };
    audioRef.current = audio;
  }

  // Updated every render so audio event handlers always see the latest state
  // without needing to be re-registered (avoids stale closures).
  handleEndedRef.current = () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setTimeout(() => { advancingRef.current = false; }, 600);

    if (repeatModeRef.current === "one") {
      const audio = audioRef.current!;
      audio.currentTime = 0;
      audio.play().catch(() => setIsPlaying(false));
      return;
    }
    const nextIndex = queueIndexRef.current + 1;
    if (nextIndex >= queueRef.current.length) {
      if (repeatModeRef.current === "all") {
        playAtInternal(queueRef.current, 0);
      } else {
        setIsPlaying(false);
      }
      return;
    }
    playAtInternal(queueRef.current, nextIndex);
  };

  async function playAtInternal(queue: Song[], index: number, userEmail?: string) {
    if (index < 0 || index >= queue.length) return;
    queueRef.current = queue;
    queueIndexRef.current = index;
    const song = queue[index];
    const audio = audioRef.current!;

    // Set streaming URL synchronously — no async gap between tracks keeps the
    // iOS audio session alive. Downloaded songs upgrade to the local path after.
    audio.src = song.url;
    let usingLocalFile = false;
    if (isDownloaded(song.id)) {
      const localUrl = await getPlaybackUrl(song);
      if (queueIndexRef.current !== index) return;
      // Only switch to local if it's actually a different (local) URL
      if (localUrl !== song.url) {
        audio.src = localUrl;
        usingLocalFile = true;
      }
    }

    audio.play().catch((err: unknown) => {
      console.warn("[Music] playback failed:", err);
      // If the local file failed (corrupted/moved), fall back to streaming
      if (usingLocalFile) {
        console.warn("[Music] local file failed, falling back to stream");
        audio.src = song.url;
        audio.play().catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    });
    setCurrentSong(song);
    setIsPlaying(true);

    const emailToLog = userEmail ?? userEmailRef.current;
    if (userEmail) userEmailRef.current = userEmail;
    if (emailToLog) logActivity(emailToLog, "song_play", { songId: song.id, title: song.title });

    const artworkUrl = "https://app.lorettabates.com/icons/icon-512-v2.png";

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist || "WELL Collective",
        album: "WELL Collective Playlist",
        artwork: [
          { src: artworkUrl, sizes: "512x512", type: "image/png" },
          { src: "https://app.lorettabates.com/icons/icon-192-v2.png", sizes: "192x192", type: "image/png" },
        ],
      });
      navigator.mediaSession.setActionHandler("play", () => {
        audioRef.current?.play().catch(() => {});
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        audioRef.current?.pause();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => handleSkip(1));
      navigator.mediaSession.setActionHandler("previoustrack", () => handleSkip(-1));
    }

    // On iOS native, WKWebView doesn't surface MediaSession artwork to the lock
    // screen. Call the native NowPlayingPlugin to set it via MPNowPlayingInfoCenter.
    // Pass duration so iOS can show the scrub bar; elapsed resets to 0 on new track.
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      const dur = audioRef.current?.duration;
      NowPlaying.setTrack({
        title: song.title,
        artist: song.artist || "WELL Collective",
        artworkUrl,
        duration: isFinite(dur ?? NaN) ? dur : undefined,
      }).catch(() => {});
    }
  }

  const playAt = (queue: Song[], index: number, userEmail?: string) => {
    playAtInternal(queue, index, userEmail);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  function handleSkip(direction: 1 | -1) {
    const nextIndex = queueIndexRef.current + direction;
    if (nextIndex < 0) return;
    if (nextIndex >= queueRef.current.length) {
      if (repeatModeRef.current === "all") playAtInternal(queueRef.current, 0);
      return;
    }
    playAtInternal(queueRef.current, nextIndex);
  }

  const cycleRepeat = () => {
    setRepeatMode((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"));
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setProgress((p) => ({ ...p, current: value }));
  };

  const stop = () => {
    audioRef.current?.pause();
    setCurrentSong(null);
    setIsPlaying(false);
    setProgress({ current: 0, duration: 0 });
    queueRef.current = [];
    queueIndexRef.current = 0;
  };

  // Auto-resume after phone calls, notification overlays, or lock screen.
  //
  // Three signal sources, ranked by reliability on iOS native:
  //
  // 1. Native AVAudioSession interruption events (most reliable for phone calls).
  //    The NowPlayingPlugin observes AVAudioSession.interruptionNotification and
  //    forwards interruptionBegan / interruptionEnded to JS. This fires even when
  //    the call is declined without backgrounding the app.
  //
  // 2. Capacitor document "pause" / "resume" events — fires when the app moves
  //    fully to/from background (home button, lock screen, switching apps).
  //
  // 3. visibilitychange — fallback for web / PWA.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 1. Native interruption events from NowPlayingPlugin
    let interruptionBeganSub: { remove: () => void } | null = null;
    let interruptionEndedSub: { remove: () => void } | null = null;
    let seekToSub: { remove: () => void } | null = null;
    let elapsedTimer: ReturnType<typeof setInterval> | null = null;

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      NowPlaying.addListener("interruptionBegan", () => {
        wasPlayingBeforeBackground.current = !audio.paused;
      }).then((sub) => { interruptionBeganSub = sub; });

      NowPlaying.addListener("interruptionEnded", ({ shouldResume }) => {
        if (shouldResume && wasPlayingBeforeBackground.current && audio.paused) {
          setTimeout(() => audio.play().catch(() => {}), 400);
        }
        wasPlayingBeforeBackground.current = false;
      }).then((sub) => { interruptionEndedSub = sub; });

      // Lock-screen scrub: user dragged the playhead — seek the audio element.
      NowPlaying.addListener("seekTo", ({ position }) => {
        audio.currentTime = position;
        setProgress((p) => ({ ...p, current: position }));
        NowPlaying.updateElapsed({ currentTime: position }).catch(() => {});
      }).then((sub) => { seekToSub = sub; });

      // Keep the lock-screen scrub bar in sync by pushing elapsed time every 5 s.
      // iOS auto-advances the displayed position using playbackRate, but needs a
      // fresh anchor whenever the rate or position changes significantly.
      elapsedTimer = setInterval(() => {
        if (!audio.paused && isFinite(audio.currentTime)) {
          NowPlaying.updateElapsed({ currentTime: audio.currentTime }).catch(() => {});
        }
      }, 5000);

      // Also update elapsed and duration on loadedmetadata (duration wasn't
      // known yet when setTrack was first called at the start of the track).
      const onMeta = () => {
        if (isFinite(audio.duration)) {
          NowPlaying.setTrack({
            title: queueRef.current[queueIndexRef.current]?.title ?? "",
            artist: queueRef.current[queueIndexRef.current]?.artist ?? "WELL Collective",
            artworkUrl: "https://app.lorettabates.com/icons/icon-512-v2.png",
            duration: audio.duration,
          }).catch(() => {});
        }
      };
      audio.addEventListener("loadedmetadata", onMeta);

      return () => {
        audio.removeEventListener("loadedmetadata", onMeta);
        if (elapsedTimer) clearInterval(elapsedTimer);
        interruptionBeganSub?.remove();
        interruptionEndedSub?.remove();
        seekToSub?.remove();
      };
    }

    // 2. Capacitor app lifecycle events (full background/foreground transitions)
    const onDocPause = () => {
      wasPlayingBeforeBackground.current = !audio.paused;
    };
    const onDocResume = () => {
      if (wasPlayingBeforeBackground.current && audio.paused) {
        setTimeout(() => audio.play().catch(() => {}), 400);
      }
      wasPlayingBeforeBackground.current = false;
    };

    // 3. visibilitychange fallback
    const onVisibility = () => {
      if (document.hidden) {
        wasPlayingBeforeBackground.current = !audio.paused;
      } else if (wasPlayingBeforeBackground.current && audio.paused) {
        setTimeout(() => audio.play().catch(() => {}), 400);
        wasPlayingBeforeBackground.current = false;
      }
    };

    document.addEventListener("pause", onDocPause);
    document.addEventListener("resume", onDocResume);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("pause", onDocPause);
      document.removeEventListener("resume", onDocResume);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Keep the native lock-screen play/pause indicator in sync, and anchor
  // elapsedPlaybackTime so the scrub bar position is correct after toggling.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;
    const currentTime = audioRef.current?.currentTime ?? 0;
    NowPlaying.setPlaybackState({ isPlaying, currentTime }).catch(() => {});
  }, [isPlaying]);

  return (
    <MusicPlayerContext.Provider
      value={{ currentSong, isPlaying, progress, repeatMode, playAt, togglePlay, handleSkip, cycleRepeat, handleSeek, stop }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}
