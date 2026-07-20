import { Calendar, ChevronDown, ChevronUp, FileText, GripVertical, Pause, Pencil, Play, Plus, RotateCcw, Tag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useMusicPlayer } from "../../store/MusicPlayerContext";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TopBar from "../../components/layout/TopBar";
import { SOUND_ICON_OPTIONS, SoundIcon } from "../../data/soundIconMap";
import type { CustomPeacefulSound, Song, SongCategory } from "../../types";
import { getAuthHeaders } from "../../utils/admin";
import { AMBIENT_SOUNDS } from "../../utils/ambientSounds";

// Wraps a single list row so it can be picked up and dragged (touch or
// mouse) via the grip handle exposed to children through dragHandleProps —
// only the handle is draggable so taps on play/edit/delete buttons inside
// the row still work normally.
function SortableItem({
  id,
  children,
}: {
  id: number;
  children: (dragHandleProps: { attributes: Record<string, unknown>; listeners: Record<string, unknown> }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({
        attributes: attributes as unknown as Record<string, unknown>,
        listeners: (listeners ?? {}) as unknown as Record<string, unknown>,
      })}
    </div>
  );
}

function DragHandle({ attributes, listeners }: { attributes: Record<string, unknown>; listeners: Record<string, unknown> }) {
  return (
    <button
      {...attributes}
      {...listeners}
      aria-label="Drag to reorder"
      className="text-text-dim shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
    >
      <GripVertical size={16} />
    </button>
  );
}

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

export default function AdminMusic() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [editingLyricsId, setEditingLyricsId] = useState<number | null>(null);
  const [editingLyricsValue, setEditingLyricsValue] = useState("");
  const [savingLyrics, setSavingLyrics] = useState(false);

  const [editingSongId, setEditingSongId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingArtist, setEditingArtist] = useState("");
  const [editingUrl, setEditingUrl] = useState("");
  const [editingLyricsInline, setEditingLyricsInline] = useState("");
  const [savingSong, setSavingSong] = useState(false);
  const [saveSongError, setSaveSongError] = useState<string | null>(null);

  const [categories, setCategories] = useState<SongCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSongCategoryIds, setNewSongCategoryIds] = useState<number[]>([]);
  const [editingCategoriesId, setEditingCategoriesId] = useState<number | null>(null);
  const [editingCategoryIds, setEditingCategoryIds] = useState<number[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);

  const [queueExpanded, setQueueExpanded] = useState(true);
  const [playlistExpanded, setPlaylistExpanded] = useState(true);
  const [renamingCategoryId, setRenamingCategoryId] = useState<number | null>(null);
  const [renamingCategoryValue, setRenamingCategoryValue] = useState("");

  const [queuedSongs, setQueuedSongs] = useState<Song[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);

  const [sounds, setSounds] = useState<CustomPeacefulSound[]>([]);
  const [soundsLoading, setSoundsLoading] = useState(true);
  const [soundTitle, setSoundTitle] = useState("");
  const [soundIcon, setSoundIcon] = useState(SOUND_ICON_OPTIONS[0]);
  const [soundUrl, setSoundUrl] = useState("");
  const [soundStatus, setSoundStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit state for existing peaceful sounds
  const [editingSoundId, setEditingSoundId] = useState<number | null>(null);
  const [editSoundTitle, setEditSoundTitle] = useState("");
  const [editSoundIcon, setEditSoundIcon] = useState(SOUND_ICON_OPTIONS[0]);
  const [editSoundUrl, setEditSoundUrl] = useState("");
  const [editSoundSaving, setEditSoundSaving] = useState(false);

  const [hiddenBuiltins, setHiddenBuiltins] = useState<string[]>([]);
  const [hiddenLoading, setHiddenLoading] = useState(true);

  const { currentSong, isPlaying, repeatMode, playAt, togglePlay, handleSkip, cycleRepeat, stop } = useMusicPlayer();

  // A small drag distance threshold keeps taps on the handle from being
  // mistaken for drags, while still working smoothly with touch.
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const fetchHiddenBuiltins = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/settings/hidden-sounds`);
      if (res.ok) {
        const data = await res.json();
        setHiddenBuiltins(data.hidden || []);
      }
    } catch (err) {
      console.error("Fetch hidden sounds error:", err);
    } finally {
      setHiddenLoading(false);
    }
  };

  const saveHiddenBuiltins = async (hidden: string[]) => {
    setHiddenBuiltins(hidden);
    if (!API_URL) return;
    try {
      await fetch(`${API_URL}/api/settings/hidden-sounds`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ hidden }),
      });
    } catch (err) {
      console.error("Save hidden sounds error:", err);
    }
  };

  const handleHideBuiltin = (id: string) => saveHiddenBuiltins([...hiddenBuiltins, id]);
  const handleRestoreBuiltin = (id: string) => saveHiddenBuiltins(hiddenBuiltins.filter((h) => h !== id));

  const handleDeleteAllSounds = async () => {
    if (!confirm("Remove every peaceful sound (built-in and custom) from the app? You can restore the built-in ones later.")) {
      return;
    }
    await saveHiddenBuiltins(AMBIENT_SOUNDS.map((s) => s.id));
    if (API_URL) {
      await Promise.all(
        sounds.map((sound) => fetch(`${API_URL}/api/peaceful-sounds/${sound.id}`, { method: "DELETE", headers: getAuthHeaders() }))
      );
    }
    fetchSounds();
  };

  const fetchSongs = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/songs`);
      if (res.ok) {
        const data = await res.json();
        setSongs(data.songs);
      }
    } catch (err) {
      console.error("Fetch songs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/song-categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Fetch song categories error:", err);
    }
  };

  const fetchQueue = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/songs/queue`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setQueuedSongs(data.songs || []);
      }
    } catch (err) {
      console.error("Fetch song queue error:", err);
    } finally {
      setQueueLoading(false);
    }
  };

  const fetchSounds = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/peaceful-sounds`);
      if (res.ok) {
        const data = await res.json();
        setSounds(data.sounds);
      }
    } catch (err) {
      console.error("Fetch peaceful sounds error:", err);
    } finally {
      setSoundsLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
    fetchSounds();
    fetchHiddenBuiltins();
    fetchCategories();
    fetchQueue();
  }, []);

  const handleAdd = async () => {
    if (!title.trim() || !url.trim() || !API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/songs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim() || undefined,
          url: url.trim(),
          lyrics: lyrics.trim() || undefined,
          sortOrder: songs.length,
          categoryIds: newSongCategoryIds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const releaseDate = data.song?.releaseAt
          ? new Date(data.song.releaseAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })
          : null;
        setTitle("");
        setArtist("");
        setUrl("");
        setLyrics("");
        setNewSongCategoryIds([]);
        setStatus({
          type: "success",
          message: releaseDate
            ? `Queued! Goes live on Music Monday, ${releaseDate}.`
            : "Song added!",
        });
        fetchSongs();
        fetchQueue();
      } else {
        const err = await res.json();
        setStatus({ type: "error", message: err.error || "Failed to add song" });
      }
    } catch {
      setStatus({ type: "error", message: "Failed to add song" });
    }
  };

  const openSongEditor = (song: Song) => {
    if (editingSongId === song.id) {
      setEditingSongId(null);
      return;
    }
    setEditingSongId(song.id);
    setEditingTitle(song.title);
    setEditingArtist(song.artist || "");
    setEditingUrl(song.url);
    setEditingLyricsInline(song.lyrics || "");
    setEditingCategoryIds((song.categoryIds || []).map(Number));
    setEditingLyricsId(null);
    setEditingCategoriesId(null);
  };

  const handleSaveSong = async (song: Song) => {
    if (!API_URL || !editingTitle.trim() || !editingUrl.trim()) return;
    setSavingSong(true);
    setSaveSongError(null);
    try {
      const [res] = await Promise.all([
        fetch(`${API_URL}/api/songs/${song.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title: editingTitle.trim(),
            artist: editingArtist.trim() || undefined,
            url: editingUrl.trim(),
            lyrics: editingLyricsInline.trim() || undefined,
            sortOrder: song.sortOrder,
          }),
        }),
        fetch(`${API_URL}/api/songs/${song.id}/categories`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ categoryIds: editingCategoryIds }),
        }),
      ]);
      if (res.ok) {
        setEditingSongId(null);
        setSaveSongError(null);
        fetchSongs();
        fetchQueue();
      } else {
        const body = await res.json().catch(() => ({}));
        setSaveSongError(body.error || `Save failed (${res.status})`);
      }
    } catch (err) {
      console.error("Save song error:", err);
      setSaveSongError("Network error — check connection and try again.");
    } finally {
      setSavingSong(false);
    }
  };

  const openLyricsEditor = (song: Song) => {
    if (editingLyricsId === song.id) {
      setEditingLyricsId(null);
      return;
    }
    setEditingLyricsId(song.id);
    setEditingLyricsValue(song.lyrics || "");
  };

  const handleSaveLyrics = async (id: number) => {
    if (!API_URL) return;
    setSavingLyrics(true);
    try {
      const res = await fetch(`${API_URL}/api/songs/${id}/lyrics`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ lyrics: editingLyricsValue.trim() || undefined }),
      });
      if (res.ok) {
        setEditingLyricsId(null);
        fetchSongs();
      }
    } catch (err) {
      console.error("Save lyrics error:", err);
    } finally {
      setSavingLyrics(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!API_URL || !confirm("Delete this song?")) return;
    try {
      await fetch(`${API_URL}/api/songs/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      fetchSongs();
    } catch (err) {
      console.error("Delete song error:", err);
    }
  };

  const handleDragEndPlaylist = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = songs.findIndex((s) => s.id === active.id);
    const newIndex = songs.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || !API_URL) return;
    const reordered = arrayMove(songs, oldIndex, newIndex);
    setSongs(reordered);
    try {
      await fetch(`${API_URL}/api/songs/reorder`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: reordered.map((s) => s.id) }),
      });
    } catch (err) {
      console.error("Reorder songs error:", err);
      fetchSongs();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/song-categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (res.ok) {
        setNewCategoryName("");
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create category");
      }
    } catch (err) {
      console.error("Create category error:", err);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!API_URL || !confirm("Delete this category? Songs tagged with it will lose that tag.")) return;
    try {
      const res = await fetch(`${API_URL}/api/song-categories/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to delete category — it may still be in use.");
        return;
      }
      // Immediately remove from local state so it disappears right away
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      // Then refetch to ensure we're in sync with server
      fetchCategories();
      fetchSongs();
    } catch (err) {
      console.error("Delete category error:", err);
      alert("Failed to delete category. Please try again.");
    }
  };

  const startRenamingCategory = (id: number, currentName: string) => {
    setRenamingCategoryId(id);
    setRenamingCategoryValue(currentName);
  };

  const handleRenameCategory = async (id: number) => {
    if (!API_URL || !renamingCategoryValue.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/song-categories/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: renamingCategoryValue.trim() }),
      });
      if (res.ok) {
        setRenamingCategoryId(null);
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to rename category");
      }
    } catch (err) {
      console.error("Rename category error:", err);
    }
  };

  const openCategoryEditor = (song: Song) => {
    if (editingCategoriesId === song.id) {
      setEditingCategoriesId(null);
      return;
    }
    setEditingCategoriesId(song.id);
    setEditingCategoryIds((song.categoryIds || []).map(Number));
  };

  const toggleEditingCategory = (id: number) => {
    setEditingCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const toggleNewSongCategory = (id: number) => {
    setNewSongCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleDragEndQueue = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = queuedSongs.findIndex((s) => s.id === active.id);
    const newIndex = queuedSongs.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || !API_URL) return;
    const reordered = arrayMove(queuedSongs, oldIndex, newIndex);
    setQueuedSongs(reordered);
    try {
      await fetch(`${API_URL}/api/songs/queue/reorder`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: reordered.map((s) => s.id) }),
      });
      fetchQueue();
    } catch (err) {
      console.error("Reorder queue error:", err);
      fetchQueue();
    }
  };

  const handleReleaseNow = async (id: number, title: string) => {
    if (!API_URL || !confirm(`Release "${title}" right now instead of waiting for Monday?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/songs/${id}/release-now`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchSongs();
        fetchQueue();
      }
    } catch (err) {
      console.error("Release song now error:", err);
    }
  };

  const handleSaveCategories = async (songId: number) => {
    if (!API_URL) return;
    setSavingCategories(true);
    try {
      const res = await fetch(`${API_URL}/api/songs/${songId}/categories`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ categoryIds: editingCategoryIds }),
      });
      if (res.ok) {
        setEditingCategoriesId(null);
        fetchSongs();
      }
    } catch (err) {
      console.error("Save song categories error:", err);
    } finally {
      setSavingCategories(false);
    }
  };

  const handleAddSound = async () => {
    if (!soundTitle.trim() || !soundUrl.trim() || !API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/peaceful-sounds`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: soundTitle.trim(),
          icon: soundIcon,
          url: soundUrl.trim(),
          sortOrder: sounds.length,
        }),
      });
      if (res.ok) {
        setSoundTitle("");
        setSoundIcon(SOUND_ICON_OPTIONS[0]);
        setSoundUrl("");
        setSoundStatus({ type: "success", message: "Sound added!" });
        fetchSounds();
      } else {
        const err = await res.json();
        setSoundStatus({ type: "error", message: err.error || "Failed to add sound" });
      }
    } catch {
      setSoundStatus({ type: "error", message: "Failed to add sound" });
    }
  };

  const handleDeleteSound = async (id: number) => {
    if (!API_URL || !confirm("Delete this peaceful sound?")) return;
    try {
      await fetch(`${API_URL}/api/peaceful-sounds/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      fetchSounds();
    } catch (err) {
      console.error("Delete peaceful sound error:", err);
    }
  };

  const openEditSound = (sound: CustomPeacefulSound) => {
    setEditingSoundId(sound.id);
    setEditSoundTitle(sound.title);
    setEditSoundIcon(sound.icon || SOUND_ICON_OPTIONS[0]);
    setEditSoundUrl(sound.url);
  };

  const handleEditSound = async () => {
    if (!API_URL || !editingSoundId || editSoundSaving) return;
    setEditSoundSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/peaceful-sounds/${editingSoundId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: editSoundTitle, icon: editSoundIcon, url: editSoundUrl }),
      });
      if (res.ok) {
        setEditingSoundId(null);
        fetchSounds();
      }
    } catch (err) {
      console.error("Edit peaceful sound error:", err);
    } finally {
      setEditSoundSaving(false);
    }
  };

  const handleDragEndSounds = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sounds.findIndex((s) => s.id === active.id);
    const newIndex = sounds.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || !API_URL) return;
    const reordered = arrayMove(sounds, oldIndex, newIndex);
    setSounds(reordered);
    try {
      await fetch(`${API_URL}/api/peaceful-sounds/reorder`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: reordered.map((s) => s.id) }),
      });
    } catch (err) {
      console.error("Reorder peaceful sounds error:", err);
      fetchSounds();
    }
  };

  const handleSongPlay = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      const startIndex = queuedSongs.findIndex((s) => s.id === song.id);
      playAt(queuedSongs, startIndex >= 0 ? startIndex : 0);
    }
  };

  const playQueueAll = () => {
    if (queuedSongs.length === 0) return;
    const startIndex = currentSong
      ? Math.max(0, queuedSongs.findIndex((s) => s.id === currentSong.id))
      : 0;
    playAt(queuedSongs, startIndex);
  };

  return (
    <div>
      <TopBar title="Music" subtitle="Manage the WELL Collective Playlist" showBack />
      <div className={`px-4 pt-4 flex flex-col gap-4 ${currentSong ? "pb-24" : "pb-4"}`}>
        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-1.5">How it works</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Upload each song's audio file to your WordPress media library (WP Admin → Media → Add New)
            or Bunny.net, then paste the file's URL here. Every new song you add automatically queues for
            the next Music Monday and goes live on its own — no extra step needed. Tag it with one or more
            categories below so members can browse by theme.
          </p>
        </div>

        <div className="glass-card rounded-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-text">Song Categories</h2>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-pill px-3 py-1.5">
                {renamingCategoryId === category.id ? (
                  <>
                    <input
                      autoFocus
                      value={renamingCategoryValue}
                      onChange={(e) => setRenamingCategoryValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameCategory(category.id);
                        if (e.key === "Escape") setRenamingCategoryId(null);
                      }}
                      className="text-xs text-text bg-transparent outline-none w-24"
                    />
                    <button onClick={() => handleRenameCategory(category.id)} className="text-brand-light text-[10px] font-bold">Save</button>
                    <button onClick={() => setRenamingCategoryId(null)} className="text-text-dim"><X size={12} /></button>
                  </>
                ) : (
                  <>
                    <Tag size={11} className="text-brand-light" />
                    <button
                      onClick={() => startRenamingCategory(category.id, category.name)}
                      className="text-xs font-semibold text-text"
                    >
                      {category.name}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      aria-label={`Delete ${category.name}`}
                      className="text-text-dim"
                    >
                      <X size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="flex-1 bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim()}
              className="flex items-center gap-1.5 text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-2 disabled:opacity-50"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>

        {songs.some((s) => s.featured) && (
          <div className="gradient-brand p-[1px] rounded-card">
            <div className="bg-surface rounded-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-light mb-1.5">
                🎵 Current Song of the Week
              </p>
              {songs
                .filter((s) => s.featured)
                .map((s) => (
                  <p key={s.id} className="text-sm font-bold text-text">{s.title}</p>
                ))}
            </div>
          </div>
        )}

        {(queueLoading || queuedSongs.length > 0) && (
          <div className="glass-card rounded-card p-4 border border-brand-light/30">
            <button onClick={() => setQueueExpanded((v) => !v)} className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-brand-light" />
                <h2 className="text-sm font-bold text-text">Music Monday Queue</h2>
              </div>
              {queueExpanded ? <ChevronUp size={16} className="text-text-dim" /> : <ChevronDown size={16} className="text-text-dim" />}
            </button>
            {queueExpanded && (
              <>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={playQueueAll}
                    disabled={queuedSongs.length === 0}
                    className="flex-1 text-xs font-semibold px-3 py-1.5 rounded-pill bg-brand-light text-white disabled:opacity-50"
                  >
                    <Play size={12} className="inline mr-1" />
                    Play All
                  </button>
                  <button
                    onClick={cycleRepeat}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-pill transition-colors ${
                      repeatMode === "off"
                        ? "bg-surface-2 text-text-muted border border-border"
                        : repeatMode === "one"
                          ? "bg-brand-light text-white"
                          : "bg-brand text-white"
                    }`}
                  >
                    {repeatMode === "off" ? "Repeat: Off" : repeatMode === "one" ? "Repeat: 1" : "Repeat: All"}
                  </button>
                </div>
                {currentSong && (
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => handleSkip(-1)}
                      disabled={!queuedSongs.some(s => s.id === currentSong?.id) || queuedSongs.findIndex(s => s.id === currentSong?.id) <= 0}
                      className="flex-1 text-xs font-semibold px-3 py-1.5 rounded-pill bg-surface-2 border border-border text-text-muted disabled:opacity-25"
                      title="Previous song (queue only)"
                    >
                      ⏮ Back
                    </button>
                    <button
                      onClick={() => handleSkip(1)}
                      disabled={!queuedSongs.some(s => s.id === currentSong?.id) || queuedSongs.findIndex(s => s.id === currentSong?.id) >= queuedSongs.length - 1}
                      className="flex-1 text-xs font-semibold px-3 py-1.5 rounded-pill bg-surface-2 border border-border text-text-muted disabled:opacity-25"
                      title="Next song (queue only)"
                    >
                      Skip ⏭
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-text-muted mb-2">Releases automatically every Monday at 5pm.</p>
                {queueLoading ? (
                  <p className="text-xs text-text-muted">Loading...</p>
                ) : (
                  <DndContext
                sensors={dragSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndQueue}
              >
              <SortableContext items={queuedSongs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {queuedSongs.map((song) => (
                  <SortableItem key={song.id} id={song.id}>
                    {(dragHandleProps) => (
                  <div className="glass-card rounded-card p-2.5 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <DragHandle {...dragHandleProps} />
                      <div className="flex-1 min-w-0">
                        <p className="text-text font-semibold truncate">{song.title}</p>
                        {song.artist && <p className="text-text-dim truncate">{song.artist}</p>}
                      </div>
                      <span className="text-brand-light shrink-0 font-semibold">
                        {song.releaseAt &&
                          new Date(song.releaseAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                      </span>
                      <button
                        onClick={() => handleSongPlay(song)}
                        aria-label={currentSong?.id === song.id && isPlaying ? "Pause" : "Play"}
                        className={`w-7 h-7 flex items-center justify-center rounded-full shrink-0 ${
                          currentSong?.id === song.id
                            ? "btn-brand text-white"
                            : "border border-border text-text-dim"
                        }`}
                      >
                        {currentSong?.id === song.id && isPlaying ? <Pause size={12} /> : <Play size={12} />}
                      </button>
                      <button
                        onClick={() => openSongEditor(song)}
                        aria-label="Edit song"
                        className={`w-7 h-7 flex items-center justify-center rounded-full border shrink-0 ${
                          editingSongId === song.id
                            ? "border-brand-light text-brand-light"
                            : "border-border text-text-dim"
                        }`}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleReleaseNow(song.id, song.title)}
                        className="shrink-0 text-[11px] font-semibold text-brand-light border border-brand-light/40 rounded-pill px-2.5 py-1"
                      >
                        Push Now
                      </button>
                    </div>
                    {editingSongId === song.id && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-border">
                        <input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Song title"
                          className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                        />
                        <input
                          value={editingArtist}
                          onChange={(e) => setEditingArtist(e.target.value)}
                          placeholder="Artist (optional)"
                          className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                        />
                        <input
                          value={editingUrl}
                          onChange={(e) => setEditingUrl(e.target.value)}
                          placeholder="Audio file URL"
                          className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                        />
                        <textarea
                          value={editingLyricsInline}
                          onChange={(e) => setEditingLyricsInline(e.target.value)}
                          placeholder="Lyrics (optional)"
                          rows={5}
                          className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light resize-none"
                        />
                        {categories.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {categories.map((category) => (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => toggleEditingCategory(category.id)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-pill border ${
                                  editingCategoryIds.map(Number).includes(Number(category.id))
                                    ? "gradient-brand text-white border-transparent"
                                    : "border-border text-text-muted"
                                }`}
                              >
                                {category.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {saveSongError && (
                          <p className="text-xs text-red-400">{saveSongError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveSong(song)}
                            disabled={savingSong || !editingTitle.trim() || !editingUrl.trim()}
                            className="flex-1 gradient-brand text-white text-xs font-semibold rounded-pill py-2 disabled:opacity-50"
                          >
                            {savingSong ? "Saving…" : "Save Changes"}
                          </button>
                          <button
                            onClick={() => setEditingSongId(null)}
                            className="flex-1 bg-surface-2 border border-border text-text-muted text-xs font-semibold rounded-pill py-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                    )}
                  </SortableItem>
                ))}
              </div>
              </SortableContext>
              </DndContext>
                )}
              </>
            )}
          </div>
        )}

        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-3">Add a Song</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist (optional)"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Audio file URL (https://...mp3)"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Lyrics (optional)</label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Paste the song's lyrics here — members will be able to view them while listening."
                rows={5}
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light resize-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Categories</label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleNewSongCategory(category.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-pill border ${
                      newSongCategoryIds.includes(category.id)
                        ? "gradient-brand text-white border-transparent"
                        : "border-border text-text-muted"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!title.trim() || !url.trim()}
              className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Song
            </button>
          </div>
          {status && (
            <p className={`text-xs mt-2 ${status.type === "success" ? "text-brand-light" : "text-red-400"}`}>
              {status.message}
            </p>
          )}
        </div>

        <div>
          <button onClick={() => setPlaylistExpanded((v) => !v)} className="w-full flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-text">WELL Collective Playlist ({songs.length})</h2>
            {playlistExpanded ? <ChevronUp size={16} className="text-text-dim" /> : <ChevronDown size={16} className="text-text-dim" />}
          </button>
          {playlistExpanded && (loading ? (
            <p className="text-sm text-text-muted">Loading...</p>
          ) : songs.length === 0 ? (
            <p className="text-sm text-text-muted">No songs added yet.</p>
          ) : (
            <DndContext
              sensors={dragSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndPlaylist}
            >
            <SortableContext items={songs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {songs.map((song) => (
                <SortableItem key={song.id} id={song.id}>
                  {(dragHandleProps) => (
                <div className="glass-card rounded-card p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <DragHandle {...dragHandleProps} />
                      <button
                        onClick={() => handleSongPlay(song)}
                        aria-label={currentSong?.id === song.id && isPlaying ? "Pause" : "Play"}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          currentSong?.id === song.id
                            ? "btn-brand text-white"
                            : "bg-surface-2 border border-border text-brand-light"
                        }`}
                      >
                        {currentSong?.id === song.id && isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text truncate">{song.title}</p>
                        {song.artist && <p className="text-xs text-text-muted truncate">{song.artist}</p>}
                        {song.categoryIds.length > 0 && (
                          <p className="text-[10px] text-brand-light truncate mt-0.5">
                            {song.categoryIds
                              .map((id) => categories.find((c) => c.id === id)?.name)
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openSongEditor(song)}
                      aria-label="Edit song"
                      className={`w-8 h-8 flex items-center justify-center rounded-full border shrink-0 mr-1 ${
                        editingSongId === song.id
                          ? "bg-surface-2 border-brand-light text-brand-light"
                          : "bg-surface-2 border-border text-text-dim"
                      }`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => openCategoryEditor(song)}
                      aria-label="Edit categories"
                      className={`w-8 h-8 flex items-center justify-center rounded-full border shrink-0 mr-1 ${
                        song.categoryIds.length > 0
                          ? "bg-surface-2 border-brand-light text-brand-light"
                          : "bg-surface-2 border-border text-text-dim"
                      }`}
                    >
                      <Tag size={14} />
                    </button>
                    <button
                      onClick={() => openLyricsEditor(song)}
                      aria-label="Edit lyrics"
                      className={`w-8 h-8 flex items-center justify-center rounded-full border shrink-0 mr-1 ${
                        song.lyrics
                          ? "bg-surface-2 border-brand-light text-brand-light"
                          : "bg-surface-2 border-border text-text-dim"
                      }`}
                    >
                      <FileText size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(song.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-red-400 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {editingSongId === song.id && (
                    <div className="flex flex-col gap-2 pt-1 border-t border-border">
                      <input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        placeholder="Song title"
                        className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                      />
                      <input
                        value={editingArtist}
                        onChange={(e) => setEditingArtist(e.target.value)}
                        placeholder="Artist (optional)"
                        className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                      />
                      <input
                        value={editingUrl}
                        onChange={(e) => setEditingUrl(e.target.value)}
                        placeholder="Audio file URL"
                        className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                      />
                      <textarea
                        value={editingLyricsInline}
                        onChange={(e) => setEditingLyricsInline(e.target.value)}
                        placeholder="Lyrics (optional)"
                        rows={5}
                        className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light resize-none"
                      />
                      {categories.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => toggleEditingCategory(category.id)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-pill border ${
                                editingCategoryIds.map(Number).includes(Number(category.id))
                                  ? "gradient-brand text-white border-transparent"
                                  : "border-border text-text-muted"
                              }`}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveSong(song)}
                          disabled={savingSong || !editingTitle.trim() || !editingUrl.trim()}
                          className="flex-1 gradient-brand text-white text-xs font-semibold rounded-pill py-2 disabled:opacity-50"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingSongId(null)}
                          className="flex-1 bg-surface-2 border border-border text-text-muted text-xs font-semibold rounded-pill py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {editingCategoriesId === song.id && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2 flex-wrap">
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => toggleEditingCategory(category.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-pill border ${
                              editingCategoryIds.map(Number).includes(Number(category.id))
                                ? "gradient-brand text-white border-transparent"
                                : "border-border text-text-muted"
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveCategories(song.id)}
                          disabled={savingCategories}
                          className="flex-1 gradient-brand text-white text-xs font-semibold rounded-pill py-2 disabled:opacity-50"
                        >
                          Save Categories
                        </button>
                        <button
                          onClick={() => setEditingCategoriesId(null)}
                          className="flex-1 bg-surface-2 border border-border text-text-muted text-xs font-semibold rounded-pill py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {editingLyricsId === song.id && (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editingLyricsValue}
                        onChange={(e) => setEditingLyricsValue(e.target.value)}
                        placeholder="Paste lyrics for this song..."
                        rows={6}
                        className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveLyrics(song.id)}
                          disabled={savingLyrics}
                          className="flex-1 gradient-brand text-white text-xs font-semibold rounded-pill py-2 disabled:opacity-50"
                        >
                          Save Lyrics
                        </button>
                        <button
                          onClick={() => setEditingLyricsId(null)}
                          className="flex-1 bg-surface-2 border border-border text-text-muted text-xs font-semibold rounded-pill py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                  )}
                </SortableItem>
              ))}
            </div>
            </SortableContext>
            </DndContext>
          ))}
        </div>

        <div className="glass-card rounded-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-text">Built-in Peaceful Sounds</h2>
            <button
              onClick={handleDeleteAllSounds}
              className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 size={14} />
              Delete All Sounds
            </button>
          </div>
          {hiddenLoading ? (
            <p className="text-sm text-text-muted">Loading...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {AMBIENT_SOUNDS.map((sound) => {
                const isHidden = hiddenBuiltins.includes(sound.id);
                return (
                  <div key={sound.id} className="glass-card rounded-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-brand-light">
                        <SoundIcon icon={sound.icon} size={16} />
                      </div>
                      <p className="text-sm font-semibold text-text">{sound.label}</p>
                    </div>
                    <button
                      onClick={() => (isHidden ? handleRestoreBuiltin(sound.id) : handleHideBuiltin(sound.id))}
                      className={`text-sm font-semibold rounded-pill px-3 py-1.5 flex items-center gap-1.5 ${
                        isHidden
                          ? "bg-surface-2 text-brand-light border border-brand-light"
                          : "bg-surface-2 text-red-400 border border-border hover:border-red-400"
                      }`}
                    >
                      <RotateCcw size={14} />
                      {isHidden ? "Restore" : "Hide"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-1.5">Peaceful Sounds</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Upload your own looping ambient sound (rain, ocean, etc.) the same way as songs. It plays on a
            loop regardless of how long the file is, and shows up as a tile right alongside the built-in
            sounds, with the same volume and timer controls members already have.
          </p>
        </div>

        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-3">Add a Peaceful Sound</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={soundTitle}
              onChange={(e) => setSoundTitle(e.target.value)}
              placeholder="Sound title (e.g. Forest Stream)"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {SOUND_ICON_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSoundIcon(option)}
                    className={`w-10 h-10 flex items-center justify-center rounded-2xl bg-surface-2 border transition-colors ${
                      soundIcon === option ? "border-brand-light text-brand-light" : "border-border text-text-muted"
                    }`}
                  >
                    <SoundIcon icon={option} size={18} />
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={soundUrl}
              onChange={(e) => setSoundUrl(e.target.value)}
              placeholder="Audio file URL (https://...mp3)"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <button
              onClick={handleAddSound}
              disabled={!soundTitle.trim() || !soundUrl.trim()}
              className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Sound
            </button>
          </div>
          {soundStatus && (
            <p className={`text-xs mt-2 ${soundStatus.type === "success" ? "text-brand-light" : "text-red-400"}`}>
              {soundStatus.message}
            </p>
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold text-text mb-3">Custom Peaceful Sounds ({sounds.length})</h2>
          {soundsLoading ? (
            <p className="text-sm text-text-muted">Loading...</p>
          ) : sounds.length === 0 ? (
            <p className="text-sm text-text-muted">No custom sounds added yet.</p>
          ) : (
            <DndContext
              sensors={dragSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndSounds}
            >
            <SortableContext items={sounds.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {sounds.map((sound) => (
                <SortableItem key={sound.id} id={sound.id}>
                  {(dragHandleProps) => (
                <div className="glass-card rounded-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <DragHandle {...dragHandleProps} />
                      <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-brand-light">
                        <SoundIcon icon={sound.icon} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text truncate">{sound.title}</p>
                        <p className="text-[10px] text-text-dim truncate">{sound.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => editingSoundId === sound.id ? setEditingSoundId(null) : openEditSound(sound)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-brand-light"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteSound(sound.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {editingSoundId === sound.id && (
                    <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
                      <input
                        value={editSoundTitle}
                        onChange={(e) => setEditSoundTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-light"
                      />
                      <select
                        value={editSoundIcon}
                        onChange={(e) => setEditSoundIcon(e.target.value)}
                        className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-light"
                      >
                        {SOUND_ICON_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <input
                        value={editSoundUrl}
                        onChange={(e) => setEditSoundUrl(e.target.value)}
                        placeholder="Sound file URL"
                        className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-light"
                      />
                      <button
                        onClick={handleEditSound}
                        disabled={editSoundSaving || !editSoundTitle.trim()}
                        className="w-full gradient-brand text-white text-sm font-semibold rounded-pill py-2 disabled:opacity-40"
                      >
                        {editSoundSaving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
                  )}
                </SortableItem>
              ))}
            </div>
            </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Sticky mini-player */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full btn-brand text-white shrink-0"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text truncate">{currentSong.title}</p>
            {currentSong.artist && <p className="text-xs text-text-dim truncate">{currentSong.artist}</p>}
          </div>
          <button onClick={stop} aria-label="Close player" className="text-text-dim shrink-0 p-1">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
