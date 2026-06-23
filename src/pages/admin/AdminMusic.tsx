import { ChevronDown, ChevronUp, Music, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import type { Song } from "../../types";

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

  useEffect(() => {
    fetchSongs();
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
      </div>
    </div>
  );
}
