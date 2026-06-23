import { ChevronDown, ChevronUp, Music, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { SOUND_ICON_OPTIONS, SoundIcon } from "../../data/soundIconMap";
import type { CustomPeacefulSound, Song } from "../../types";

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
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [sounds, setSounds] = useState<CustomPeacefulSound[]>([]);
  const [soundsLoading, setSoundsLoading] = useState(true);
  const [soundTitle, setSoundTitle] = useState("");
  const [soundIcon, setSoundIcon] = useState(SOUND_ICON_OPTIONS[0]);
  const [soundUrl, setSoundUrl] = useState("");
  const [soundStatus, setSoundStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
          sortOrder: songs.length,
        }),
      });
      if (res.ok) {
        setTitle("");
        setArtist("");
        setUrl("");
        setStatus({ type: "success", message: "Song added!" });
        fetchSongs();
      } else {
        const err = await res.json();
        setStatus({ type: "error", message: err.error || "Failed to add song" });
      }
    } catch {
      setStatus({ type: "error", message: "Failed to add song" });
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
            or Bunny.net, then paste the file's URL here. Songs appear in the app's Music → Playlist tab
            in the order you add them — members can favorite, reorder, and download songs from there too.
          </p>
        </div>

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
                <div key={song.id} className="glass-card rounded-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-brand-light">
                      <Music size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text truncate">{song.title}</p>
                      {song.artist && <p className="text-xs text-text-muted truncate">{song.artist}</p>}
                    </div>
                  </div>
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
              ))}
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
