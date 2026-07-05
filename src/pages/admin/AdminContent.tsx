import { BadgeCheck, Download, ImageIcon, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { ContentBatchEntry } from "../../types";
import { formatDateLong } from "../../utils/format";
import ContentScheduleEditModal from "../../components/ContentScheduleEditModal";
import FutureContentSchedule from "../../components/admin/FutureContentSchedule";

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

async function syncContentSchedule(entries: ContentBatchEntry[]): Promise<boolean> {
  if (!API_URL) return false;
  const res = await fetch(`${API_URL}/api/content-schedule`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(entries),
  });
  return res.ok;
}

async function deleteContentScheduleEntry(date: string): Promise<void> {
  if (!API_URL) return;
  await fetch(`${API_URL}/api/content-schedule/${date}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

async function fetchContentSchedule(): Promise<ContentBatchEntry[] | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/api/content-schedule`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.entries as ContentBatchEntry[];
  } catch {
    return null;
  }
}

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildTemplate(days: number): ContentBatchEntry[] {
  const entries: ContentBatchEntry[] = [];
  const start = new Date();
  start.setDate(start.getDate() + 1);

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = toLocalISODate(date);
    const isMonday = date.getDay() === 1;

    const entry: ContentBatchEntry = {
      date: iso,
      dailyInspiration: {
        title: "Daily inspiration title",
        body: "Daily inspiration message that aligns with this week's theme.",
      },
      wellActivity: {
        title: "Well activity suggestion",
        description: "A short mental-health activity suggestion for today, e.g. take a bath, call a friend, read a book.",
      },
      recipe: {
        name: "Recipe name tied to weekly theme",
        description: "Short description of the recipe.",
        ingredients: ["Ingredient 1", "Ingredient 2", "Ingredient 3"],
        steps: ["Step 1", "Step 2", "Step 3"],
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=70",
      },
    };

    if (isMonday) {
      entry.weeklyTheme = {
        title: "This week's focus: theme title",
        body: "Description of this week's theme — daily inspirations, well activities, and recipes should align with this.",
      };
    }

    entries.push(entry);
  }

  return entries;
}

interface BackfillResult {
  date: string;
  name: string;
  verified: boolean;
}

interface DiversifyResult {
  date: string;
  name: string;
  image: string;
}

export default function AdminContent() {
  const { contentSchedule, importContentSchedule, removeContentEntry, updateContentEntry } = useApp();
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [syncing, setSyncing] = useState(true);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResults, setBackfillResults] = useState<BackfillResult[] | null>(null);
  const [backfillError, setBackfillError] = useState("");
  const [diversifying, setDiversifying] = useState(false);
  const [diversifyResults, setDiversifyResults] = useState<DiversifyResult[] | null>(null);
  const [diversifyError, setDiversifyError] = useState("");
  const [editingEntry, setEditingEntry] = useState<ContentBatchEntry | null>(null);

  useEffect(() => {
    fetchContentSchedule()
      .then((entries) => {
        if (entries) importContentSchedule(entries);
      })
      .finally(() => setSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadTemplate = () => {
    const entries = buildTemplate(30);
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "well-collective-content-template.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error("Expected a JSON array of entries.");
      for (const entry of parsed) {
        if (typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
          throw new Error(`Each entry needs a "date" in yyyy-mm-dd format. Found: ${JSON.stringify(entry.date)}`);
        }
      }
      importContentSchedule(parsed as ContentBatchEntry[]);
      setJsonText("");

      let synced = false;
      try {
        synced = await syncContentSchedule(parsed as ContentBatchEntry[]);
      } catch {
        synced = false;
      }

      setStatus({
        type: "success",
        message: synced
          ? `Scheduled ${parsed.length} day(s) of content and synced to the push backend.`
          : `Scheduled ${parsed.length} day(s) of content on this device. Push backend sync was not configured.`,
      });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Invalid JSON." });
    }
  };

  const handleRemove = (date: string) => {
    removeContentEntry(date);
    deleteContentScheduleEntry(date).catch(() => {});
  };

  const handleEditSaved = (updated: ContentBatchEntry) => {
    updateContentEntry(updated);
    setEditingEntry(null);
  };

  const handleBackfillNutrition = async () => {
    if (!API_URL) return;
    setBackfilling(true);
    setBackfillError("");
    setBackfillResults(null);
    try {
      const res = await fetch(`${API_URL}/api/recipes/backfill-nutrition`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Backfill request failed.");
      const data = await res.json();
      setBackfillResults(data.results || []);
    } catch (err) {
      setBackfillError(err instanceof Error ? err.message : "Backfill failed.");
    } finally {
      setBackfilling(false);
    }
  };

  const handleDiversifyPhotos = async () => {
    if (!API_URL) return;
    setDiversifying(true);
    setDiversifyError("");
    setDiversifyResults(null);
    try {
      const res = await fetch(`${API_URL}/api/recipes/diversify-photos`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Diversify request failed.");
      const data = await res.json();
      setDiversifyResults(data.results || []);
    } catch (err) {
      setDiversifyError(err instanceof Error ? err.message : "Diversify failed.");
    } finally {
      setDiversifying(false);
    }
  };

  const sorted = [...contentSchedule].sort((a, b) => a.date.localeCompare(b.date));
  const todayISO = toLocalISODate(new Date());
  const todayEntry = contentSchedule.find((e) => e.date === todayISO);
  const isMondayToday = new Date().getDay() === 1;

  // Separate future and past content
  const futureContent = sorted.filter((e) => e.date >= todayISO);
  const pastContent = sorted.filter((e) => e.date < todayISO);

  return (
    <div>
      <TopBar title="Content Schedule" subtitle="Bulk-upload weekly themes & daily content" showBack />
      <div className="px-4 pt-4 flex flex-col gap-4">
        <div
          className={`glass-card rounded-card p-4 border ${
            syncing ? "border-border" : todayEntry?.dailyInspiration ? "border-green-500/30" : "border-red-500/30"
          }`}
        >
          <h2 className="text-sm font-bold text-text mb-1.5">Today's push status — {formatDateLong(todayISO)}</h2>
          {syncing ? (
            <p className="text-xs text-text-dim">Checking the server's schedule...</p>
          ) : (
            <>
              <p className="text-xs text-text-muted">
                Daily Inspiration: {todayEntry?.dailyInspiration ? "✅ scheduled, will send at 7am" : "⚠️ not scheduled — nothing will send today"}
              </p>
              {isMondayToday && (
                <p className="text-xs text-text-muted mt-1">
                  Weekly Theme: {todayEntry?.weeklyTheme ? "✅ scheduled, will send at 7am" : "⚠️ not scheduled — nothing will send this Monday"}
                </p>
              )}
            </>
          )}
        </div>

        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-1.5">How it works</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Upload a month's (or year's) worth of content at once as JSON. Each entry is keyed by date
            (yyyy-mm-dd). The weekly theme is sent every Monday at 7am, and the daily inspiration is sent
            every day at 7am — those are pushed straight from this schedule by the server regardless of
            whether the app is open. Keep daily content (and the WELL Activity / recipe) aligned with
            that week's theme.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-text border border-border rounded-pill py-2.5 mt-3"
          >
            <Download size={16} />
            Download 30-Day Template
          </button>
        </div>

        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-1.5">Backfill Recipe Nutrition</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            One-time tool: looks up real USDA nutrition for past recipes that were generated before this
            feature existed, using their existing ingredient list. Safe to run more than once — it skips
            anything already verified.
          </p>
          <button
            onClick={handleBackfillNutrition}
            disabled={backfilling}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-brand rounded-pill py-2.5 mt-3 disabled:opacity-60"
          >
            {backfilling ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
            {backfilling ? "Looking up nutrition…" : "Backfill Past Recipes"}
          </button>
          {backfillError && <p className="text-xs text-red-400 mt-2">{backfillError}</p>}
          {backfillResults && (
            <div className="mt-3 flex flex-col gap-1.5">
              {backfillResults.length === 0 ? (
                <p className="text-xs text-text-muted">Nothing to backfill — every recipe already has verified nutrition.</p>
              ) : (
                backfillResults.map((r) => (
                  <p key={r.date} className="text-xs text-text-muted">
                    {r.verified ? "✅" : "⚠️"} {r.date} — {r.name}
                  </p>
                ))
              )}
            </div>
          )}
        </div>

        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-1.5">Diversify Recipe Photos</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            One-time tool: past recipes pick a photo by hashing their name within a category, so two
            recipes with the same name (or just bad luck) can land on the identical photo. Assigns each
            recent recipe a distinct photo, newest first.
          </p>
          <button
            onClick={handleDiversifyPhotos}
            disabled={diversifying}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-brand rounded-pill py-2.5 mt-3 disabled:opacity-60"
          >
            {diversifying ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
            {diversifying ? "Assigning photos…" : "Diversify Past Recipe Photos"}
          </button>
          {diversifyError && <p className="text-xs text-red-400 mt-2">{diversifyError}</p>}
          {diversifyResults && (
            <div className="mt-3 flex flex-col gap-1.5">
              {diversifyResults.length === 0 ? (
                <p className="text-xs text-text-muted">No recipes found to update.</p>
              ) : (
                diversifyResults.map((r) => (
                  <p key={r.date} className="text-xs text-text-muted">
                    ✅ {r.date} — {r.name}
                  </p>
                ))
              )}
            </div>
          )}
        </div>

        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-2">Upload JSON</h2>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste your content schedule JSON here..."
            rows={8}
            className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none font-mono"
          />
          {status && (
            <p className={`text-xs mt-2 ${status.type === "success" ? "text-brand-light" : "text-red-400"}`}>
              {status.message}
            </p>
          )}
          <button
            onClick={handleUpload}
            disabled={!jsonText.trim()}
            className="w-full flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 mt-3 shadow-glow disabled:opacity-50"
          >
            <Upload size={16} />
            Upload &amp; Schedule
          </button>
        </div>

        {/* Future content (prominently displayed) */}
        {futureContent.length > 0 && (
          <div className="mb-8">
            <FutureContentSchedule
              entries={futureContent}
              onEdit={setEditingEntry}
              onDelete={handleRemove}
              title="📅 Upcoming Content (Next 7+ Days)"
            />
          </div>
        )}

        {/* Past content (collapsible) */}
        {pastContent.length > 0 && (
          <div>
            <details className="group">
              <summary className="cursor-pointer select-none flex items-center gap-2 mb-3 text-sm font-bold text-text-muted hover:text-text transition-colors">
                <span className="inline-block transition-transform group-open:rotate-90">▶</span>
                Past Content ({pastContent.length})
              </summary>
              <div className="ml-4 flex flex-col gap-2.5">
                {pastContent.map((entry) => (
                  <div key={entry.date} className="flex items-center gap-3 glass-card rounded-card px-4 py-3 hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => setEditingEntry(entry)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{formatDateLong(entry.date)}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {entry.weeklyTheme && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-surface-3 text-brand-light rounded-pill px-2 py-0.5">
                            Weekly Theme
                          </span>
                        )}
                        {entry.dailyInspiration && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-surface-3 text-brand-light rounded-pill px-2 py-0.5">
                            Daily Inspiration
                          </span>
                        )}
                        {entry.wellActivity && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-surface-3 text-brand-light rounded-pill px-2 py-0.5">
                            Well Activity
                          </span>
                        )}
                        {entry.recipe && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-surface-3 text-brand-light rounded-pill px-2 py-0.5">
                            Recipe
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEntry(entry);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0 text-brand-light hover:bg-brand-light hover:text-white transition-colors"
                      aria-label="Edit scheduled content"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(entry.date);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0 text-red-400 hover:bg-red-400 hover:text-white transition-colors"
                      aria-label="Remove scheduled content"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {editingEntry && <ContentScheduleEditModal entry={editingEntry} onClose={() => setEditingEntry(null)} onSave={handleEditSaved} />}
      </div>
    </div>
  );
}
