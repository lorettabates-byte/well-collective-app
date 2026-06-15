import { Download, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { ContentBatchEntry } from "../../types";
import { formatDateLong } from "../../utils/format";

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

function buildTemplate(days: number): ContentBatchEntry[] {
  const entries: ContentBatchEntry[] = [];
  const start = new Date();
  start.setDate(start.getDate() + 1);

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
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

export default function AdminContent() {
  const { contentSchedule, importContentSchedule, removeContentEntry } = useApp();
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const sorted = [...contentSchedule].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <TopBar title="Content Schedule" subtitle="Bulk-upload weekly themes & daily content" showBack />
      <div className="px-4 pt-4 flex flex-col gap-4">
        <div className="glass-card rounded-card p-4">
          <h2 className="text-sm font-bold text-text mb-1.5">How it works</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Upload a month's (or year's) worth of content at once as JSON. Each entry is keyed by date
            (yyyy-mm-dd). The weekly theme is sent every Monday at 7am, and the daily inspiration, WELL
            Activity, and recipe are sent/applied automatically each day at 7am when the app is opened —
            keep daily content aligned with that week's theme.
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

        <div>
          <h2 className="text-sm font-bold text-text mb-3">Scheduled Days ({sorted.length})</h2>
          {sorted.length === 0 ? (
            <p className="text-sm text-text-muted">No content scheduled yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {sorted.map((entry) => (
                <div key={entry.date} className="flex items-center gap-3 glass-card rounded-card px-4 py-3">
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
                    onClick={() => handleRemove(entry.date)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0 text-red-400"
                    aria-label="Remove scheduled content"
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
