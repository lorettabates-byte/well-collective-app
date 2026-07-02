import { Calendar, ChevronDown, ChevronUp, FileText, Music, Pencil, Plus, RotateCcw, Tag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { SOUND_ICON_OPTIONS, SoundIcon } from "../../data/soundIconMap";
import type { CustomPeacefulSound, Song, SongCategory } from "../../types";
import { AMBIENT_SOUNDS } from "../../utils/ambientSounds";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("adminToken");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

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
  const [savingSong, setSavingSong] = useState(false);

  const [categories, setCategories] = useState<SongCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSongCategoryIds, setNewSongCategoryIds] = useState<number[]>([]);
  const [editingCategoriesId, setEditingCategoriesId] = useState<number | null>(null);
  const [editingCategoryIds, setEditingCategoryIds] = useState<number[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);

  const [queuedSongs, setQueuedSongs] = useState<Song[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);

  const [sounds, setSounds] = useState<CustomPeacefulSound[]>([]);
  const [soundsLoading, setSoundsLoading] = useState(true);
  const [soundTitle, setSoundTitle] = useState("");
  const [soundIcon, setSoundIcon] = useState(SOUND_ICON_OPTIONS[0]);
  const [soundUrl, setSoundUrl] = useState("");
  const [soundStatus, setSoundStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [hiddenBuiltins, setHiddenBuiltins] = useState<string[]>([]);
  const [hiddenLoading, setHiddenLoading] = useState(true);

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
    setEditingLyricsId(null);
    setEditingCategoriesId(null);
  };

  const handleSaveSong = async (song: Song) => {
    if (!API_URL || !editingTitle.trim() || !editingUrl.trim()) return;
    setSavingSong(true);
    try {
      const res = await fetch(`${API_URL}/api/songs/${song.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: editingTitle.trim(),
          artist: editingArtist.trim() || undefined,
          url: editingUrl.trim(),
          lyrics: song.lyrics,
          sortOrder: song.sortOrder,
        }),
      });
      if (res.ok) {
        setEditingSongId(null);
        fetchSongs();
      }
    } catch (err) {
      console.error("Save song error:", err);
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

  const handleMove = async (id: number, direction: 1 | -1) => {
    const index = songs.findIndex((s) => s.id === id);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= songs.length || !API_URL) return;

    const reordered = [...songs];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
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
      await fetch(`${API_URL}/api/song-categories/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      fetchCategories();
      fetchSongs();
    } catch (err) {
      console.error("Delete category error:", err);
    }
  };

  const handleRenameCategory = async (id: number, currentName: string) => {
    if (!API_URL) return;
    const name = prompt("Rename category", currentName);
    if (!name?.trim() || name.trim() === currentName) return;
    try {
      const res = await fetch(`${API_URL}/api/song-categories/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
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
    setEditingCategoryIds(song.categoryIds || []);
  };

  const toggleEditingCategory = (id: number) => {
    setEditingCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const toggleNewSongCategory = (id: number) => {
    setNewSongCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleReorderQueue = async (fromIndex: number, direction: 1 | -1) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= queuedSongs.length) return;
    const reordered = [...queuedSongs];
    [reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]];
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

  const handleMoveSound = async (id: number, direction: 1 | -1) => {
    const index = sounds.findIndex((s) => s.id === id);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= sounds.length || !API_URL) return;

    const reordered = [...sounds];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
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

  return (
    <div>
      <TopBar title="Music" subtitle="Manage the WELL Collective Playlist" showBack />
      <div className="px-4 pt-4 flex flex-col gap-4">
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
              <div
                key={category.id}
                className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-pill px-3 py-1.5"
              >
                <Tag size={11} className="text-brand-light" />
                <button
                  onClick={() => handleRenameCategory(category.id, category.name)}
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
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar size={14} className="text-brand-light" />
              <h2 className="text-sm font-bold text-text">Music Monday Queue</h2>
            </div>
            <p className="text-[11px] text-text-muted mb-2">Releases automatically every Monday at 5pm.</p>
            {queueLoading ? (
              <p className="text-xs text-text-muted">Loading...</p>
            ) : (
              <div className="flex flex-col gap-2">
                {queuedSongs.map((song, index) => (
                  <div key={song.id} className="flex items-center gap-2 text-xs">
                    <div className="flex flex-col shrink-0">
                      <button
                        onClick={() => handleReorderQueue(index, -1)}
                        disabled={index === 0}
                        aria-label="Move earlier"
                        className="text-text-dim disabled:opacity-25"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleReorderQueue(index, 1)}
                        disabled={index === queuedSongs.length - 1}
                        aria-label="Move later"
                        className="text-text-dim disabled:opacity-25"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <span className="text-text font-semibold flex-1 min-w-0 truncate">{song.title}</span>
                    <span className="text-brand-light shrink-0 font-semibold">
                      {song.releaseAt &&
                        new Date(song.releaseAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                    </span>
                    <button
                      onClick={() => handleReleaseNow(song.id, song.title)}
                      className="shrink-0 text-[11px] font-semibold text-brand-light border border-brand-light/40 rounded-pill px-2.5 py-1"
                    >
                      Push Now
                    </button>
                  </div>
                ))}
              </div>
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
          <h2 className="text-sm font-bold text-text mb-3">WELL Collective Playlist ({songs.length})</h2>
          {loading ? (
            <p className="text-sm text-text-muted">Loading...</p>
          ) : songs.length === 0 ? (
            <p className="text-sm text-text-muted">No songs added yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {songs.map((song, index) => (
                <div key={song.id} className="glass-card rounded-card p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-brand-light">
                        <Music size={14} />
                      </div>
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
                    <div className="flex flex-col shrink-0 mr-1">
                      <button
                        onClick={() => handleMove(song.id, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                        className="text-text-dim disabled:opacity-25"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMove(song.id, 1)}
                        disabled={index === songs.length - 1}
                        aria-label="Move down"
                        className="text-text-dim disabled:opacity-25"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
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
                              editingCategoryIds.includes(category.id)
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
              ))}
            </div>
          )}
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
            <div className="flex flex-col gap-2">
              {sounds.map((sound, index) => (
                <div key={sound.id} className="glass-card rounded-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-brand-light">
                      <SoundIcon icon={sound.icon} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text truncate">{sound.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-col shrink-0 mr-1">
                    <button
                      onClick={() => handleMoveSound(sound.id, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="text-text-dim disabled:opacity-25"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveSound(sound.id, 1)}
                      disabled={index === sounds.length - 1}
                      aria-label="Move down"
                      className="text-text-dim disabled:opacity-25"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteSound(sound.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-red-400 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
