import {
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Heart,
  ListMusic,
  Lock,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Song, SongCategory } from "../../types";
import { logActivity } from "../../utils/wellCup";

const FAVORITES_KEY = "well-music-favorites";
const ORDER_KEY = "well-music-order";
const FREE_SONG_COUNT = 5;

type RepeatMode = "off" | "all" | "one";

function loadFavorites(): Set<number> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

function saveFavorites(favorites: Set<number>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
}

function loadOrder(): number[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function saveOrder(order: number[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(order));
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Playlist({
  songs,
  categories = [],
  loading,
  downloadsLocked,
  initialFavoritesOnly,
  userEmail,
}: {
  songs: Song[];
  categories?: SongCategory[];
  loading: boolean;
  downloadsLocked?: boolean;
  initialFavoritesOnly?: boolean;
  userEmail?: string;
}) {
  const [favorites, setFavorites] = useState<Set<number>>(() => loadFavorites());
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>(() => loadOrder());
  const [favoritesOnly, setFavoritesOnly] = useState(() => !!initialFavoritesOnly);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [lockedReason, setLockedReason] = useState<"play" | "download" | null>(null);
  const [lyricsSong, setLyricsSong] = useState<Song | null>(null);

  const showLocked = (reason: "play" | "download") => {
    setLockedReason(reason);
    setTimeout(() => setLockedReason(null), 3000);
  };

  // Trial members get access to the first FREE_SONG_COUNT songs plus the
  // newest Monday release (featured song). Based on the canonical `songs`
  // order, not the user's custom reordering, so they can't bypass the lock
  // by dragging a later song to the top.
  const lockedSongIds = useMemo(() => {
    if (!downloadsLocked) return new Set<number>();

    // All songs after the first FREE_SONG_COUNT are locked by default
    const locked = new Set(songs.slice(FREE_SONG_COUNT).map((s) => s.id));

    // Except: the newest Monday release (featured) is also accessible
    const featuredSong = songs.find((s) => s.featured);
    if (featuredSong) {
      locked.delete(featuredSong.id);
    }

    return locked;
  }, [songs, downloadsLocked]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Song[]>([]);
  const queueIndexRef = useRef(0);
  const repeatModeRef = useRef<RepeatMode>("off");
  repeatModeRef.current = repeatMode;

  // Reconcile saved order with the current song list. If the server order
  // has changed (admin reordered), use the new server order and clear the
  // user's custom order. Otherwise, keep user's custom order and append new songs.
  useEffect(() => {
    if (songs.length === 0) return;
    const serverOrder = songs.map((s) => s.id);
    const saved = loadOrder();
    const ids = new Set(serverOrder);
    const savedFiltered = saved.filter((id) => ids.has(id));
    const missing = serverOrder.filter((id) => !saved.includes(id));

    // If server order changed (admin reordered), use server order
    if (JSON.stringify(savedFiltered) !== JSON.stringify(serverOrder.filter((id) => saved.includes(id)))) {
      setOrder(serverOrder);
      saveOrder(serverOrder);
    } else {
      // Otherwise use user's custom order
      const merged = [...savedFiltered, ...missing];
      setOrder(merged);
      saveOrder(merged);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs]);

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.onended = () => handleEnded();
      audio.ontimeupdate = () => setProgress({ current: audio.currentTime, duration: audio.duration || 0 });
      audio.onloadedmetadata = () => setProgress({ current: audio.currentTime, duration: audio.duration || 0 });
      // Keep the play/pause icon honest if playback is interrupted externally
      // (lock screen controls, a phone call, the browser backgrounding the tab).
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      audioRef.current = audio;
    }
    return () => {
      audioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update lock screen metadata via Media Session API
  useEffect(() => {
    if (!currentSong || !("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist || "WELL Collective",
      album: "WELL Collective Playlist",
    });

    navigator.mediaSession.setActionHandler("play", () => {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => handleSkip(1));
    navigator.mediaSession.setActionHandler("previoustrack", () => handleSkip(-1));
  }, [currentSong]);

  // Update playback state on lock screen
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  const orderedSongs = order.map((id) => songs.find((s) => s.id === id)).filter((s): s is Song => !!s);
  const categoryFiltered = activeCategoryId
    ? orderedSongs.filter((s) => s.categoryIds?.includes(activeCategoryId))
    : orderedSongs;
  const visibleSongs = favoritesOnly ? categoryFiltered.filter((s) => favorites.has(s.id)) : categoryFiltered;
  const playableSongs = visibleSongs.filter((s) => !lockedSongIds.has(s.id));
  const featuredSong = orderedSongs.find((s) => s.featured);

  function playAt(queue: Song[], index: number) {
    if (index < 0 || index >= queue.length) return;
    queueRef.current = queue;
    queueIndexRef.current = index;
    const song = queue[index];
    const audio = audioRef.current!;
    audio.src = song.url;
    audio.play();
    setCurrentSong(song);
    setIsPlaying(true);
    if (userEmail) logActivity(userEmail, "song_play", { songId: song.id, title: song.title });
  }

  function handleEnded() {
    if (repeatModeRef.current === "one") {
      const audio = audioRef.current!;
      audio.currentTime = 0;
      audio.play();
      return;
    }
    const nextIndex = queueIndexRef.current + 1;
    if (nextIndex >= queueRef.current.length) {
      if (repeatModeRef.current === "all") {
        playAt(queueRef.current, 0);
      } else {
        setIsPlaying(false);
      }
      return;
    }
    playAt(queueRef.current, nextIndex);
  }

  const togglePlaySong = (song: Song) => {
    if (lockedSongIds.has(song.id)) {
      showLocked("play");
      return;
    }
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }
    const startIndex = playableSongs.findIndex((s) => s.id === song.id);
    playAt(playableSongs, startIndex);
  };

  const handlePlayAll = () => {
    if (playableSongs.length === 0) return;
    playAt(playableSongs, 0);
  };

  const handleSkip = (direction: 1 | -1) => {
    const nextIndex = queueIndexRef.current + direction;
    if (nextIndex < 0) return;
    if (nextIndex >= queueRef.current.length) {
      if (repeatModeRef.current === "all") playAt(queueRef.current, 0);
      return;
    }
    playAt(queueRef.current, nextIndex);
  };

  const handleSeek = (value: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value;
    setProgress((p) => ({ ...p, current: value }));
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(next);
      return next;
    });
  };

  const moveSong = (id: number, direction: 1 | -1) => {
    setOrder((prev) => {
      const index = prev.indexOf(id);
      const swapWith = index + direction;
      if (index < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      saveOrder(next);
      return next;
    });
  };

  const cycleRepeat = () => {
    setRepeatMode((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"));
  };

  if (loading) {
    return <p className="text-sm text-text-muted text-center py-8">Loading songs...</p>;
  }

  if (songs.length === 0) {
    return <p className="text-sm text-text-muted text-center py-8">No songs uploaded yet — check back soon.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs text-text-muted mb-1">
        Motivational music curated by Loretta — the WELL Collective Playlist.
      </p>

      {lockedReason && (
        <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-card px-3 py-2.5 -mt-1">
          <Lock size={14} className="text-brand-light shrink-0" />
          <p className="text-xs text-text-muted">
            {lockedReason === "download"
              ? "Downloads are available to full members — upgrade to download songs."
              : "This song is part of full membership — upgrade to unlock the full playlist."}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handlePlayAll}
          className="flex-1 flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow"
        >
          <ListMusic size={16} />
          Play All
        </button>
        <button
          onClick={cycleRepeat}
          aria-label="Cycle repeat mode"
          className={`w-11 flex items-center justify-center rounded-pill border ${
            repeatMode !== "off" ? "gradient-brand border-transparent text-white" : "border-border text-text-muted"
          }`}
        >
          {repeatMode === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setFavoritesOnly(false)}
          className={`text-xs font-semibold rounded-pill py-2 ${
            !favoritesOnly ? "gradient-brand text-white" : "bg-surface-2 text-text-muted border border-border"
          }`}
        >
          All Songs
        </button>
        <button
          onClick={() => setFavoritesOnly(true)}
          className={`text-xs font-semibold rounded-pill py-2 ${
            favoritesOnly ? "gradient-brand text-white" : "bg-surface-2 text-text-muted border border-border"
          }`}
        >
          Favorites ({favorites.size})
        </button>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setActiveCategoryId(null)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-pill border ${
              activeCategoryId === null
                ? "gradient-brand text-white border-transparent"
                : "border-border text-text-muted"
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-pill border ${
                activeCategoryId === category.id
                  ? "gradient-brand text-white border-transparent"
                  : "border-border text-text-muted"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {featuredSong && !favoritesOnly && !activeCategoryId && (
        <div className="gradient-brand p-[1px] rounded-card">
          <button
            onClick={() => togglePlaySong(featuredSong)}
            className="w-full bg-surface rounded-card px-3 py-2.5 flex items-center gap-2.5 text-left"
          >
            <div className="w-9 h-9 rounded-full gradient-brand shadow-glow flex items-center justify-center shrink-0">
              {currentSong?.id === featuredSong.id && isPlaying ? (
                <Pause size={14} className="text-white" />
              ) : (
                <Play size={14} className="text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wide text-brand-light">
                🎵 New This Week — Music Monday
              </span>
              <p className="text-sm font-semibold text-text truncate">{featuredSong.title}</p>
            </div>
          </button>
        </div>
      )}

      {favoritesOnly && visibleSongs.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">No favorites yet — tap the heart on a song.</p>
      )}

      {visibleSongs.map((song, index) => {
        const isCurrent = currentSong?.id === song.id;
        const isLocked = lockedSongIds.has(song.id);
        return (
          <div
            key={song.id}
            className={`flex items-center gap-2 rounded-card px-3 py-3 ${
              isCurrent ? "gradient-brand p-[1px]" : ""
            } ${isLocked ? "opacity-50" : ""}`}
          >
            <div
              className={`flex items-center gap-2 flex-1 min-w-0 ${
                isCurrent ? "bg-surface rounded-[20px] px-2.5 py-2" : ""
              }`}
            >
              <button
                onClick={() => togglePlaySong(song)}
                aria-label={isLocked ? "Locked for trial members" : isCurrent && isPlaying ? "Pause" : "Play"}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  isLocked ? "bg-surface-2 border border-border" : "gradient-brand"
                }`}
              >
                {isLocked ? (
                  <Lock size={14} className="text-text-dim" />
                ) : isCurrent && isPlaying ? (
                  <Pause size={14} className="text-white" />
                ) : (
                  <Play size={14} className="text-white" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text truncate">{song.title}</p>
                {song.artist && <p className="text-xs text-text-muted truncate">{song.artist}</p>}
              </div>
              <button
                onClick={() => toggleFavorite(song.id)}
                aria-label={favorites.has(song.id) ? "Unfavorite" : "Favorite"}
                className="w-8 h-8 flex items-center justify-center shrink-0 text-brand-light"
              >
                <Heart size={16} className={favorites.has(song.id) ? "fill-brand-light" : ""} />
              </button>
              {song.lyrics && (
                <button
                  onClick={() => setLyricsSong(song)}
                  aria-label="View lyrics"
                  className="w-8 h-8 flex items-center justify-center shrink-0 text-brand-light"
                >
                  <FileText size={15} />
                </button>
              )}
              {downloadsLocked ? (
                <button
                  onClick={() => showLocked("download")}
                  aria-label="Download locked for trial members"
                  className="w-8 h-8 flex items-center justify-center shrink-0 text-text-dim"
                >
                  <Lock size={14} />
                </button>
              ) : (
                <a
                  href={song.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download"
                  className="w-8 h-8 flex items-center justify-center shrink-0 text-text-muted"
                >
                  <Download size={15} />
                </a>
              )}
              {!favoritesOnly && (
                <div className="flex flex-col shrink-0">
                  <button
                    onClick={() => moveSong(song.id, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="text-text-dim disabled:opacity-25"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveSong(song.id, 1)}
                    disabled={index === visibleSongs.length - 1}
                    aria-label="Move down"
                    className="text-text-dim disabled:opacity-25"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Spacer so the last songs in the list aren't hidden behind the fixed
          mini player below — without this, those rows would be unclickable. */}
      {currentSong && <div className="h-28" aria-hidden="true" />}

      {currentSong &&
        createPortal(
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-auto sm:max-w-[398px] z-30 glass-card rounded-card p-3 flex flex-col gap-2 shadow-glow">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-text truncate flex-1">{currentSong.title}</p>
              {currentSong.lyrics && (
                <button
                  onClick={() => setLyricsSong(currentSong)}
                  aria-label="View lyrics"
                  className="text-text-muted shrink-0"
                >
                  <FileText size={14} />
                </button>
              )}
              <button onClick={cycleRepeat} aria-label="Cycle repeat mode" className="text-text-muted shrink-0">
                {repeatMode === "one" ? (
                  <Repeat1 size={14} className="text-brand-light" />
                ) : (
                  <Repeat size={14} className={repeatMode === "all" ? "text-brand-light" : ""} />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-dim w-9 text-right">{formatTime(progress.current)}</span>
              <input
                type="range"
                min={0}
                max={progress.duration || 0}
                step={0.1}
                value={progress.current}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 accent-brand-blue"
              />
              <span className="text-[10px] text-text-dim w-9">{formatTime(progress.duration)}</span>
            </div>
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => handleSkip(-1)} aria-label="Previous" className="text-text">
                <SkipBack size={18} />
              </button>
              <button
                onClick={() => togglePlaySong(currentSong)}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center"
              >
                {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
              </button>
              <button onClick={() => handleSkip(1)} aria-label="Next" className="text-text">
                <SkipForward size={18} />
              </button>
            </div>
          </div>,
          document.getElementById("mobile-shell-frame") || document.body
        )}

      {lyricsSong &&
        createPortal(
          <div className="absolute inset-0 z-40 bg-black/60 flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-sm max-h-[70%] glass-card rounded-card p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text truncate">{lyricsSong.title}</h3>
                  {lyricsSong.artist && <p className="text-xs text-text-muted truncate">{lyricsSong.artist}</p>}
                </div>
                <button
                  onClick={() => setLyricsSong(null)}
                  aria-label="Close lyrics"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-sm text-text whitespace-pre-line overflow-y-auto leading-relaxed">
                {lyricsSong.lyrics}
              </p>
            </div>
          </div>,
          document.getElementById("mobile-shell-frame") || document.body
        )}
    </div>
  );
}
