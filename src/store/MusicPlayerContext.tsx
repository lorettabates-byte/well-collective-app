import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import type { Song } from "../types";
import { logActivity } from "../utils/wellCup";
import { getPlaybackUrl, isDownloaded } from "../utils/musicOffline";

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
    if (isDownloaded(song.id)) {
      const localUrl = await getPlaybackUrl(song);
      if (queueIndexRef.current !== index) return;
      audio.src = localUrl;
    }

    audio.play().catch((err: unknown) => {
      console.warn("[Music] playback failed:", err);
      setIsPlaying(false);
    });
    setCurrentSong(song);
    setIsPlaying(true);

    const emailToLog = userEmail ?? userEmailRef.current;
    if (userEmail) userEmailRef.current = userEmail;
    if (emailToLog) logActivity(emailToLog, "song_play", { songId: song.id, title: song.title });

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist || "WELL Collective",
        album: "WELL Collective Playlist",
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

  return (
    <MusicPlayerContext.Provider
      value={{ currentSong, isPlaying, progress, repeatMode, playAt, togglePlay, handleSkip, cycleRepeat, handleSeek, stop }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}
