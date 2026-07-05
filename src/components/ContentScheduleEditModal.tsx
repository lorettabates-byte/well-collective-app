import { Loader2, RefreshCw, Save, X } from "lucide-react";
import { useState } from "react";
import type { ContentBatchEntry } from "../types";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("adminToken");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    const fallbackKey = import.meta.env.VITE_ADMIN_API_KEY as string | undefined;
    if (fallbackKey) {
      headers["x-admin-key"] = fallbackKey;
    }
  }
  return headers;
}

interface ContentScheduleEditModalProps {
  entry: ContentBatchEntry;
  onClose: () => void;
  onSave: (updated: ContentBatchEntry) => void;
}

export default function ContentScheduleEditModal({ entry, onClose, onSave }: ContentScheduleEditModalProps) {
  const [data, setData] = useState<ContentBatchEntry>(JSON.parse(JSON.stringify(entry)));
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");

  const handleRegenerateRecipe = async () => {
    if (!data.recipe?.name?.trim() || !API_URL) {
      setError("Recipe name is required to regenerate");
      return;
    }
    setRegenerating(true);
    setError("");
    try {
      const currentRecipeName = data.recipe.name.trim();
      const regeneratePrompt = `Generate a completely different healthy recipe than "${currentRecipeName}". Pick a different cuisine, cooking method, or main ingredient. Make it something fresh and varied.`;
      const res = await fetch(`${API_URL}/api/recipes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion: regeneratePrompt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to regenerate recipe");
        return;
      }
      const newRecipe = await res.json();
      if (!newRecipe.name) {
        setError("Generated recipe missing name");
        return;
      }
      setData((d) => ({
        ...d,
        recipe: {
          ...d.recipe!,
          name: newRecipe.name,
          description: newRecipe.description,
          ingredients: newRecipe.ingredients || [],
          steps: newRecipe.steps || [],
        },
      }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate recipe");
    } finally {
      setRegenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (!API_URL) throw new Error("API URL not configured");
      const res = await fetch(`${API_URL}/api/content-schedule/${entry.date}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save changes");
      onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-6" onClick={onClose}>
      <div
        className="relative gradient-brand p-[1px] rounded-card shadow-glow max-w-2xl w-full animate-fade-in-up max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface rounded-t-card p-5 flex items-center justify-between shrink-0 border-b border-border">
          <h2 className="text-lg font-bold text-text">Edit Scheduled Content</h2>
          <button onClick={onClose} aria-label="Close" className="text-text-dim">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 pb-32 flex flex-col gap-4">
          <p className="text-sm text-text-muted">Date: {entry.date}</p>

          {/* Weekly Theme */}
          {data.weeklyTheme && (
            <div className="border border-border rounded-card p-4 bg-surface-2">
              <h3 className="text-sm font-bold text-text mb-3">Weekly Theme</h3>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Title</label>
                  <input
                    type="text"
                    value={data.weeklyTheme.title}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        weeklyTheme: { ...d.weeklyTheme!, title: e.target.value },
                      }))
                    }
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-light"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Description</label>
                  <textarea
                    value={data.weeklyTheme.body}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        weeklyTheme: { ...d.weeklyTheme!, body: e.target.value },
                      }))
                    }
                    rows={3}
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text resize-none focus:outline-none focus:border-brand-light"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Daily Inspiration */}
          {data.dailyInspiration && (
            <div className="border border-border rounded-card p-4 bg-surface-2">
              <h3 className="text-sm font-bold text-text mb-3">Daily Inspiration</h3>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Title</label>
                  <input
                    type="text"
                    value={data.dailyInspiration.title}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        dailyInspiration: { ...d.dailyInspiration!, title: e.target.value },
                      }))
                    }
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-light"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Message</label>
                  <textarea
                    value={data.dailyInspiration.body}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        dailyInspiration: { ...d.dailyInspiration!, body: e.target.value },
                      }))
                    }
                    rows={3}
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text resize-none focus:outline-none focus:border-brand-light"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Well Activity */}
          {data.wellActivity && (
            <div className="border border-border rounded-card p-4 bg-surface-2">
              <h3 className="text-sm font-bold text-text mb-3">Well Activity</h3>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Title</label>
                  <input
                    type="text"
                    value={data.wellActivity.title}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        wellActivity: { ...d.wellActivity!, title: e.target.value },
                      }))
                    }
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-light"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Description</label>
                  <textarea
                    value={data.wellActivity.description}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        wellActivity: { ...d.wellActivity!, description: e.target.value },
                      }))
                    }
                    rows={3}
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text resize-none focus:outline-none focus:border-brand-light"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recipe */}
          {data.recipe && (
            <div className="border border-border rounded-card p-4 bg-surface-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-text">Recipe</h3>
                <button
                  onClick={handleRegenerateRecipe}
                  disabled={regenerating}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-pill bg-surface border border-border text-text-muted hover:text-brand-light hover:border-brand-light disabled:opacity-50 transition-colors"
                  title="Generate a different recipe with the same name"
                >
                  <RefreshCw size={12} />
                  {regenerating ? "Generating…" : "Regenerate"}
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Name</label>
                  <input
                    type="text"
                    value={data.recipe.name}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        recipe: { ...d.recipe!, name: e.target.value },
                      }))
                    }
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-light"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Description</label>
                  <textarea
                    value={data.recipe.description}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        recipe: { ...d.recipe!, description: e.target.value },
                      }))
                    }
                    rows={2}
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text resize-none focus:outline-none focus:border-brand-light"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Photo</label>
                  {data.recipe.image && (
                    <img
                      src={data.recipe.image}
                      alt={data.recipe.name}
                      className="w-full h-32 object-cover rounded-card mb-2"
                    />
                  )}
                  <input
                    type="text"
                    value={data.recipe.image}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        recipe: { ...d.recipe!, image: e.target.value },
                      }))
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Ingredients (one per line)</label>
                  <textarea
                    value={data.recipe.ingredients?.join("\n") ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        recipe: { ...d.recipe!, ingredients: e.target.value.split("\n").filter((l) => l.trim()) },
                      }))
                    }
                    rows={3}
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text resize-none focus:outline-none focus:border-brand-light font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-dim block mb-1">Steps (one per line)</label>
                  <textarea
                    value={data.recipe.steps?.join("\n") ?? ""}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        recipe: { ...d.recipe!, steps: e.target.value.split("\n").filter((l) => l.trim()) },
                      }))
                    }
                    rows={3}
                    className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text resize-none focus:outline-none focus:border-brand-light font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-card px-3 py-2">{error}</p>}
        </div>

        <div className="bg-surface border-t border-border rounded-b-card p-4 flex gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 text-sm font-semibold text-text-muted border border-border rounded-pill py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
