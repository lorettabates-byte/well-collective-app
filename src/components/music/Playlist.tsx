import {
  ChevronDown,
  ChevronUp,
  FileText,
  GripVertical,
  Heart,
  ListMusic,
  Loader2,
  Lock,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMusicPlayer } from "../../store/MusicPlayerContext";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import type { Song, SongCategory } from "../../types";
import { formatSeconds } from "../../utils/format";
import { deleteDownload, downloadSong } from "../../utils/musicOffline";

const FAVORITES_KEY = "well-music-favorites";
const FAVORITES_ORDER_KEY = "well-music-favorites-order";
const ORDER_KEY = "well-music-order";
const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const FREE_SONG_COUNT = 5;

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

function loadFavoritesOrder(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_ORDER_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function saveFavoritesOrder(order: number[]) {
  localStorage.setItem(FAVORITES_ORDER_KEY, JSON.stringify(order));
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

interface DragHandleProps {
  song: Song;
  isPlaying: boolean;
  isDownloading?: boolean;
  onPlay: () => void;
  onFavorite: () => void;
}

function SortableFavoriteSong({ song, isPlaying, isDownloading, onPlay, onFavorite }: DragHandleProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing w-11 self-stretch flex items-center justify-center text-text-muted hover:text-brand-light touch-none select-none shrink-0">
        <GripVertical size={20} />
      </div>
      <button
        onClick={onPlay}
        className="w-8 h-8 rounded-full gradient-brand shadow-glow flex items-center justify-center shrink-0"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate">{song.title}</p>
      </div>
      <button
        onClick={onFavorite}
        aria-label="Unfavorite"
        className="w-8 h-8 flex items-center justify-center shrink-0 text-brand-light"
      >
        {isDownloading ? (
          <Loader2 size={16} className="animate-spin text-text-muted" />
        ) : (
          <Heart size={16} className="fill-brand-light" />
        )}
      </button>
    </div>
  );
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
  const { currentSong, isPlaying, progress, repeatMode, playAt, togglePlay, handleSkip, handleSeek, cycleRepeat } = useMusicPlayer();

  const [favorites, setFavorites] = useState<Set<number>>(() => loadFavorites());
  const [favoritesOrder, setFavoritesOrder] = useState<number[]>(() => loadFavoritesOrder());
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>(() => loadOrder());
  const [favoritesOnly, setFavoritesOnly] = useState(() => !!initialFavoritesOnly);
  const [lockedReason, setLockedReason] = useState<"play" | "download" | null>(null);
  const [lyricsSong, setLyricsSong] = useState<Song | null>(null);

  // Persist favorites to the server so they survive localStorage wipes (Safari ITP).
  const syncFavoritesToServer = useCallback((ids: number[]) => {
    if (!API_URL || !userEmail) return;
    fetch(`${API_URL}/api/members/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, name: "Member", favoriteSongIds: ids }),
    }).catch((err) => console.error("Failed to sync song favorites:", err));
  }, [userEmail]);

  // On mount, restore any server-saved favorites and merge with localStorage.
  useEffect(() => {
    if (!API_URL || !userEmail) return;
    fetch(`${API_URL}/api/members/me?email=${encodeURIComponent(userEmail)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const serverIds: number[] = data?.member?.favoriteSongIds ?? [];
        if (serverIds.length === 0) return;
        setFavorites((prev) => {
          const merged = new Set([...prev, ...serverIds]);
          if (merged.size === prev.size) return prev;
          saveFavorites(merged);
          return merged;
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

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

  const orderedSongs = order.map((id) => songs.find((s) => s.id === id)).filter((s): s is Song => !!s);
  const featuredSong = orderedSongs.find((s) => s.featured);
  const categoryFiltered = activeCategoryId
    ? orderedSongs.filter((s) => s.categoryIds?.includes(activeCategoryId))
    : orderedSongs;
  // Exclude featured song from the main list (it only appears in the featured section)
  const regularSongs = categoryFiltered.filter((s) => s.id !== featuredSong?.id);
  // In favorites view, include favorited songs from regularSongs + featured song if favorited
  const visibleSongs = favoritesOnly
    ? [
        ...regularSongs.filter((s) => favorites.has(s.id)),
        ...(featuredSong && favorites.has(featuredSong.id) ? [featuredSong] : []),
      ]
    : regularSongs;

  // Reorder favorites based on saved drag order
  const orderedVisibleSongs = useMemo(() => {
    if (!favoritesOnly || visibleSongs.length === 0) return visibleSongs;

    const songIds = visibleSongs.map((s) => s.id);
    const saved = favoritesOrder.filter((id) => songIds.includes(id));
    const missing = songIds.filter((id) => !saved.includes(id));
    const merged = [...saved, ...missing];

    const merged_map = new Map(visibleSongs.map((s) => [s.id, s]));
    return merged.map((id) => merged_map.get(id)!).filter(Boolean);
  }, [visibleSongs, favoritesOrder, favoritesOnly]);

  // In favorites view, play only the user's ordered favorites (featured song
  // is already included in orderedVisibleSongs if it was favorited).
  // In main view, always lead with the featured/Music Monday song.
  const playableSongs = favoritesOnly
    ? orderedVisibleSongs.filter((s) => !lockedSongIds.has(s.id))
    : [
        ...(featuredSong && !lockedSongIds.has(featuredSong.id) ? [featuredSong] : []),
        ...orderedVisibleSongs.filter((s) => !lockedSongIds.has(s.id)),
      ];

  const togglePlaySong = (song: Song) => {
    if (lockedSongIds.has(song.id)) {
      showLocked("play");
      return;
    }
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }
    const startIndex = playableSongs.findIndex((s) => s.id === song.id);
    playAt(playableSongs, startIndex, userEmail);
  };

  const handlePlayAll = () => {
    if (playableSongs.length === 0) return;
    const startIndex = currentSong
      ? Math.max(0, playableSongs.findIndex((s) => s.id === currentSong.id))
      : 0;
    playAt(playableSongs, startIndex, userEmail);
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Clean up from favorites order when unfavorited
        setFavoritesOrder((order) => order.filter((songId) => songId !== id));
        deleteDownload(id).catch((err) => console.error("Failed to delete offline song:", err));
      } else {
        next.add(id);
        // Auto-download favorited songs for offline playback — no-ops on
        // web, and any failure (bad connection, etc.) just leaves the song
        // streaming-only, so it's safe to fire and forget here.
        const song = songs.find((s) => s.id === id);
        if (song) {
          setDownloadingIds((prevIds) => new Set(prevIds).add(id));
          downloadSong(song)
            .catch((err) => console.error("Failed to download song for offline playback:", err))
            .finally(() =>
              setDownloadingIds((prevIds) => {
                const next = new Set(prevIds);
                next.delete(id);
                return next;
              })
            );
        }
      }
      saveFavorites(next);
      syncFavoritesToServer([...next]);
      return next;
    });
  };

  const handleDragEndFavorites = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Use the current display order (orderedVisibleSongs) as the source of
    // truth — the raw favoritesOrder state may be incomplete if songs were
    // recently favorited and never dragged before, causing indexOf to return
    // -1 and silently leaving the order unchanged.
    const ids = orderedVisibleSongs.map((s) => s.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    setFavoritesOrder(next);
    saveFavoritesOrder(next);
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

      {categories.length > 0 && !downloadsLocked && (
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
          <div className="w-full bg-surface rounded-card px-3 py-2.5 flex items-center gap-2.5">
            <button
              onClick={() => togglePlaySong(featuredSong)}
              className="w-9 h-9 rounded-full gradient-brand shadow-glow flex items-center justify-center shrink-0"
              aria-label={currentSong?.id === featuredSong.id && isPlaying ? "Pause" : "Play"}
            >
              {currentSong?.id === featuredSong.id && isPlaying ? (
                <Pause size={14} className="text-white" />
              ) : (
                <Play size={14} className="text-white" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wide text-brand-light">
                🎵 New This Week — Music Monday
              </span>
              <p className="text-sm font-semibold text-text truncate">{featuredSong.title}</p>
            </div>
            <button
              onClick={() => toggleFavorite(featuredSong.id)}
              aria-label={favorites.has(featuredSong.id) ? "Unfavorite" : "Favorite"}
              className="w-8 h-8 flex items-center justify-center shrink-0 text-brand-light"
            >
              {downloadingIds.has(featuredSong.id) ? (
                <Loader2 size={16} className="animate-spin text-text-muted" />
              ) : (
                <Heart size={16} className={favorites.has(featuredSong.id) ? "fill-brand-light" : ""} />
              )}
            </button>
            {featuredSong.lyrics && (
              <button
                onClick={() => setLyricsSong(featuredSong)}
                aria-label="View lyrics"
                className="w-8 h-8 flex items-center justify-center shrink-0 text-brand-light"
              >
                <FileText size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {favoritesOnly && visibleSongs.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">No favorites yet — tap the heart on a song.</p>
      )}

      {favoritesOnly && orderedVisibleSongs.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndFavorites}>
          <SortableContext items={orderedVisibleSongs.map((s) => s.id)}>
            <div className="flex flex-col gap-2.5">
              {orderedVisibleSongs.map((song) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <div key={song.id} className={`rounded-card px-3 py-3 ${isCurrent ? "gradient-brand p-[1px]" : ""}`}>
                    <div className={`${isCurrent ? "bg-surface rounded-[20px] px-2.5 py-2" : ""}`}>
                      <SortableFavoriteSong
                        song={song}
                        isPlaying={isCurrent && isPlaying}
                        isDownloading={downloadingIds.has(song.id)}
                        onPlay={() => togglePlaySong(song)}
                        onFavorite={() => toggleFavorite(song.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        visibleSongs.map((song, index) => {
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
                {downloadingIds.has(song.id) ? (
                  <Loader2 size={16} className="animate-spin text-text-muted" />
                ) : (
                  <Heart size={16} className={favorites.has(song.id) ? "fill-brand-light" : ""} />
                )}
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
        })
      )}

      {/* Spacer so the last songs in the list aren't hidden behind the fixed
          mini player below — without this, those rows would be unclickable. */}
      {currentSong && <div className="h-28" aria-hidden="true" />}

      {currentSong &&
        createPortal(
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-auto sm:max-w-[398px] z-30 glass-card rounded-card p-3 flex flex-col gap-2" style={{ border: "1px solid rgba(1, 145, 206, 0.35)", boxShadow: "0 0 0 1px rgba(1, 145, 206, 0.15), 0 8px 30px -10px rgba(1, 145, 206, 0.55)" }}>
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
              <span className="text-[10px] text-text-dim w-9 text-right">{formatSeconds(progress.current)}</span>
              <input
                type="range"
                min={0}
                max={progress.duration || 0}
                step={0.1}
                value={progress.current}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 accent-brand-blue"
              />
              <span className="text-[10px] text-text-dim w-9">{formatSeconds(progress.duration)}</span>
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
