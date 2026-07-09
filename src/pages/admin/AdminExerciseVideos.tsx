import { CheckCircle2, ChevronDown, ChevronRight, Loader2, Play, RefreshCw, Trash2, Video } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { getAuthHeaders } from "../../utils/admin";
import { RESISTANCE_EXERCISES, STRETCHES } from "../../data/workoutLibrary";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

const ALL_EXERCISES = [
  ...RESISTANCE_EXERCISES.map((e) => ({ name: e.name, category: "Resistance" })),
  ...STRETCHES.map((e) => ({ name: e.name, category: "Stretch" })),
];

interface SavedVideo {
  exercise_name: string;
  video_url: string;
  updated_at: string;
}

export default function AdminExerciseVideos() {
  const [saved, setSaved] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  const [searching, setSearching] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const [customUrls, setCustomUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved2, setSaved2] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/exercise-videos`, { headers: getAuthHeaders() });
      const d = await res.json() as { videos: SavedVideo[] };
      setSaved(new Map(d.videos.map((v) => [v.exercise_name, v.video_url])));
    } catch { /* keep empty */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = async (exerciseName: string) => {
    if (!API_URL) return;
    const term = (searchTerms[exerciseName] ?? exerciseName).trim();
    setSearching(exerciseName);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/exercise-videos/search?term=${encodeURIComponent(term)}`,
        { headers: getAuthHeaders() }
      );
      const d = await res.json() as { url: string | null };
      if (d.url) {
        setPreviewUrl(d.url);
        setPreviewName(exerciseName);
        setCustomUrls((prev) => ({ ...prev, [exerciseName]: d.url! }));
      } else {
        alert("No video found for that search term. Try a different term.");
      }
    } catch { alert("Search failed."); } finally {
      setSearching(null);
    }
  };

  const handleSave = async (exerciseName: string) => {
    const url = customUrls[exerciseName]?.trim();
    if (!url || !API_URL) return;
    setSaving(exerciseName);
    try {
      await fetch(`${API_URL}/api/admin/exercise-videos`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ exerciseName, videoUrl: url }),
      });
      setSaved((prev) => new Map(prev).set(exerciseName, url));
      setSaved2(exerciseName);
      setTimeout(() => setSaved2(null), 2000);
    } catch { alert("Save failed."); } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (exerciseName: string) => {
    if (!API_URL) return;
    setDeleting(exerciseName);
    try {
      await fetch(`${API_URL}/api/admin/exercise-videos`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ exerciseName }),
      });
      setSaved((prev) => { const m = new Map(prev); m.delete(exerciseName); return m; });
    } catch { alert("Delete failed."); } finally {
      setDeleting(null);
    }
  };

  const resistanceExercises = ALL_EXERCISES.filter((e) => e.category === "Resistance");
  const stretchExercises = ALL_EXERCISES.filter((e) => e.category === "Stretch");
  const setCount = saved.size;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Resistance Training": true,
    "Stretching": true,
  });

  const toggleSection = (label: string) =>
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <div>
      <TopBar title="Exercise Videos" subtitle="Set demo videos for each exercise" icon={Video} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4 pb-8">

        {/* Stats */}
        <div className="glass-card rounded-card px-4 py-3 mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Videos Assigned</p>
          <p className="text-lg font-bold text-brand-light">{loading ? "…" : `${setCount} / ${ALL_EXERCISES.length}`}</p>
        </div>

        {/* Video preview */}
        {previewUrl && (
          <div className="mb-6 glass-card rounded-card overflow-hidden">
            <div className="px-4 py-2 flex items-center justify-between border-b border-border">
              <p className="text-xs font-semibold text-text truncate">{previewName}</p>
              <button onClick={() => setPreviewUrl(null)} className="text-[11px] text-text-muted">Close</button>
            </div>
            <video src={previewUrl} controls autoPlay playsInline className="w-full max-h-52 bg-black" />
          </div>
        )}

        {[
          { label: "Resistance Training", items: resistanceExercises, assigned: resistanceExercises.filter((e) => saved.has(e.name)).length },
          { label: "Stretching", items: stretchExercises, assigned: stretchExercises.filter((e) => saved.has(e.name)).length },
        ].map(({ label, items, assigned }) => {
          const isOpen = openSections[label];
          return (
            <div key={label} className="mb-4">
              <button
                onClick={() => toggleSection(label)}
                className="w-full flex items-center justify-between py-2 mb-2"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown size={14} className="text-text-dim" /> : <ChevronRight size={14} className="text-text-dim" />}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">{label}</p>
                </div>
                <p className="text-[10px] text-text-muted">{assigned} / {items.length} assigned</p>
              </button>
              {isOpen ? (
                <div className="flex flex-col gap-3">
                  {items.map(({ name }) => {
                    const currentUrl = saved.get(name);
                    const isSaved2 = saved2 === name;
                    return (
                      <div key={name} className="glass-card rounded-card p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${currentUrl ? "bg-green-400" : "bg-border"}`} />
                          <p className="text-sm font-semibold text-text flex-1 min-w-0 truncate">{name}</p>
                          {currentUrl && (
                            <button
                              onClick={() => { setPreviewUrl(currentUrl); setPreviewName(name); }}
                              className="text-brand-light shrink-0"
                              title="Preview current video"
                            >
                              <Play size={14} />
                            </button>
                          )}
                          {currentUrl && (
                            <button
                              onClick={() => handleDelete(name)}
                              disabled={deleting === name}
                              className="text-red-400 shrink-0 disabled:opacity-40"
                              title="Remove assignment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Search term */}
                        <div className="flex gap-2 mb-2">
                          <input
                            value={searchTerms[name] ?? ""}
                            onChange={(e) => setSearchTerms((p) => ({ ...p, [name]: e.target.value }))}
                            placeholder={`Search term (e.g. "${name.toLowerCase()}")`}
                            className="flex-1 bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
                          />
                          <button
                            onClick={() => handleSearch(name)}
                            disabled={searching === name}
                            className="flex items-center gap-1 text-xs font-semibold bg-surface-2 border border-border text-text-muted rounded-card px-3 py-2 shrink-0 disabled:opacity-40"
                          >
                            {searching === name ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                            Find
                          </button>
                        </div>

                        {/* Manual URL */}
                        <div className="flex gap-2">
                          <input
                            value={customUrls[name] ?? ""}
                            onChange={(e) => setCustomUrls((p) => ({ ...p, [name]: e.target.value }))}
                            placeholder="Paste video URL directly..."
                            className="flex-1 bg-surface-2 border border-border rounded-card px-3 py-2 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
                          />
                          <button
                            onClick={() => handleSave(name)}
                            disabled={saving === name || !customUrls[name]?.trim()}
                            className="flex items-center gap-1 text-xs font-semibold gradient-brand text-white rounded-card px-3 py-2 shrink-0 disabled:opacity-40"
                          >
                            {isSaved2 ? <CheckCircle2 size={12} /> : saving === name ? <Loader2 size={12} className="animate-spin" /> : null}
                            {isSaved2 ? "Saved" : "Save"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
