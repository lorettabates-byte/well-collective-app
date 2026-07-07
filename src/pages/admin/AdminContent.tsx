import { BadgeCheck, ChefHat, Download, ImageIcon, Loader2, Pencil, Sparkles, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { ContentBatchEntry } from "../../types";
import { getAuthHeaders } from "../../utils/admin";
import { formatDateLong } from "../../utils/format";
import ContentScheduleEditModal from "../../components/ContentScheduleEditModal";
import FutureContentSchedule from "../../components/admin/FutureContentSchedule";
import { getAnotherRecipePhoto, getRecipePhotoByCategory } from "../../utils/recipePhotos";

interface GeneratedRecipeResponse {
  name?: string;
  description?: string;
  ingredients?: string[];
  steps?: string[];
}

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

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
  const [generatingWeek, setGeneratingWeek] = useState(false);
  const [generateWeekStatus, setGenerateWeekStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [broadcastThemeTitle, setBroadcastThemeTitle] = useState("");
  const [broadcastThemeBody, setBroadcastThemeBody] = useState("");
  const [broadcastingTheme, setBroadcastingTheme] = useState(false);
  const [broadcastThemeStatus, setBroadcastThemeStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const refreshSchedule = async () => {
    const entries = await fetchContentSchedule();
    if (entries) importContentSchedule(entries);
  };

  useEffect(() => {
    refreshSchedule().finally(() => setSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Add-a-day form: weekly theme / WELL activity / recipe ───────────────
  const [scheduleDate, setScheduleDate] = useState("");
  const [weeklyTitle, setWeeklyTitle] = useState("");
  const [weeklyBody, setWeeklyBody] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState("");
  const [recipeSteps, setRecipeSteps] = useState("");
  const [recipeImage, setRecipeImage] = useState("");
  const [addDayStatus, setAddDayStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [recipeSuggestion, setRecipeSuggestion] = useState("");
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

  // Each recipe section starts in edit mode (plain inputs) until a recipe has
  // been generated, at which point it flips to the "as it will actually post"
  // preview — matching the real Today's Recipe card — with a pencil to jump
  // back into editing that one section.
  const [recipeEditMode, setRecipeEditMode] = useState({
    image: true,
    name: true,
    description: true,
    ingredients: true,
    steps: true,
  });

  const toggleRecipeEdit = (field: keyof typeof recipeEditMode) => {
    setRecipeEditMode((m) => ({ ...m, [field]: !m[field] }));
  };

  const resetRecipeForm = () => {
    setRecipeName(""); setRecipeDescription(""); setRecipeIngredients(""); setRecipeSteps(""); setRecipeImage("");
    setRecipeEditMode({ image: true, name: true, description: true, ingredients: true, steps: true });
  };

  const handleGenerateRecipe = async () => {
    if (!recipeSuggestion.trim() || !API_URL) return;

    setGeneratingRecipe(true);
    try {
      const res = await fetch(`${API_URL}/api/recipes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion: recipeSuggestion.trim() }),
      });

      if (res.ok) {
        const data: GeneratedRecipeResponse = await res.json();
        setRecipeName(data.name || "");
        setRecipeDescription(data.description || "");
        setRecipeIngredients(data.ingredients?.join(", ") || "");
        setRecipeSteps(data.steps?.join(", ") || "");
        setRecipeSuggestion("");
        // Show the generated recipe the way it'll actually post — only the
        // photo still needs picking, since the generator doesn't supply one.
        setRecipeEditMode({ image: true, name: false, description: false, ingredients: false, steps: false });
        setAddDayStatus({ type: "success", message: `Recipe generated: ${data.name}` });
        setTimeout(() => setAddDayStatus(null), 3000);
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to generate recipe" }));
        setAddDayStatus({ type: "error", message: err.error || "Failed to generate recipe" });
      }
    } catch {
      setAddDayStatus({ type: "error", message: "Error reaching the server." });
    } finally {
      setGeneratingRecipe(false);
    }
  };

  const handleAddDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate || !API_URL) return;

    const entry: ContentBatchEntry = { date: scheduleDate };
    if (weeklyTitle.trim() && weeklyBody.trim()) {
      entry.weeklyTheme = { title: weeklyTitle.trim(), body: weeklyBody.trim() };
    }
    if (activityTitle.trim() && activityDescription.trim()) {
      entry.wellActivity = { title: activityTitle.trim(), description: activityDescription.trim() };
    }
    if (recipeName.trim() && recipeDescription.trim()) {
      entry.recipe = {
        name: recipeName.trim(),
        description: recipeDescription.trim(),
        ingredients: recipeIngredients.split(",").map((s) => s.trim()).filter(Boolean),
        steps: recipeSteps.split(",").map((s) => s.trim()).filter(Boolean),
        image: recipeImage.trim(),
      };
    }

    if (!entry.weeklyTheme && !entry.wellActivity && !entry.recipe) {
      setAddDayStatus({ type: "error", message: "Fill in at least one section before saving." });
      return;
    }

    try {
      const synced = await syncContentSchedule([entry]);
      if (synced) {
        setAddDayStatus({ type: "success", message: `Saved for ${scheduleDate}.` });
        setWeeklyTitle(""); setWeeklyBody(""); setActivityTitle(""); setActivityDescription("");
        resetRecipeForm();
        setScheduleDate("");
        await refreshSchedule();
      } else {
        setAddDayStatus({ type: "error", message: "Failed to save." });
      }
    } catch {
      setAddDayStatus({ type: "error", message: "Failed to reach the server." });
    }
  };

  const handleGenerateWeek = async () => {
    if (!API_URL) return;
    setGeneratingWeek(true);
    setGenerateWeekStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/content-schedule/generate-week`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await refreshSchedule();
        setGenerateWeekStatus({ type: "success", message: "Generated — check below for the next 7 days." });
      } else {
        setGenerateWeekStatus({ type: "error", message: "Failed to generate this week's content." });
      }
    } catch {
      setGenerateWeekStatus({ type: "error", message: "Failed to reach the server." });
    } finally {
      setGeneratingWeek(false);
    }
  };

  const handleBroadcastTheme = async (broadcast: boolean) => {
    if (!API_URL || !broadcastThemeTitle.trim() || !broadcastThemeBody.trim()) return;
    setBroadcastingTheme(true);
    setBroadcastThemeStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/content-schedule/broadcast-theme`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ title: broadcastThemeTitle.trim(), body: broadcastThemeBody.trim(), broadcast }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshSchedule();
        setBroadcastThemeStatus({
          type: "success",
          message: broadcast
            ? `Saved for ${data.monday} and push sent to all members!`
            : `Saved for ${data.monday}. No push sent.`,
        });
        setBroadcastThemeTitle("");
        setBroadcastThemeBody("");
      } else {
        const err = await res.json().catch(() => ({}));
        setBroadcastThemeStatus({ type: "error", message: err.error || "Failed to save." });
      }
    } catch {
      setBroadcastThemeStatus({ type: "error", message: "Failed to reach the server." });
    } finally {
      setBroadcastingTheme(false);
    }
  };

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

  const handleRegeneratePhoto = async (entry: ContentBatchEntry) => {
    if (!entry.recipe) return;
    const category = (entry.recipe as { imageCategory?: string }).imageCategory || "general_healthy";
    const currentImage = entry.recipe.image || getRecipePhotoByCategory(category, entry.recipe.name);
    const newImage = getAnotherRecipePhoto(category, currentImage);
    const updatedRecipe = { ...entry.recipe, image: newImage };

    updateContentEntry({ ...entry, recipe: updatedRecipe });
    const synced = await syncContentSchedule([{ date: entry.date, recipe: updatedRecipe }]);
    if (synced) await refreshSchedule();
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

        {/* ── Set & Broadcast This Week's Theme ────────────────────────── */}
        <div className="glass-card rounded-card p-4 border border-brand-light/20">
          <h2 className="text-sm font-bold text-text mb-1">Set This Week's Theme & Broadcast</h2>
          <p className="text-xs text-text-muted leading-relaxed mb-3">
            Use this when Monday's push already ran but no theme was scheduled. Saves to the DB for this week's Monday and immediately pushes to all members.
          </p>
          <div className="flex flex-col gap-2">
            <input
              value={broadcastThemeTitle}
              onChange={(e) => setBroadcastThemeTitle(e.target.value)}
              placeholder="Theme title (e.g. Power of Connection)"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
            />
            <textarea
              value={broadcastThemeBody}
              onChange={(e) => setBroadcastThemeBody(e.target.value)}
              placeholder="Theme description / body text"
              rows={2}
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleBroadcastTheme(false)}
                disabled={broadcastingTheme || !broadcastThemeTitle.trim() || !broadcastThemeBody.trim()}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-text border border-border rounded-pill py-2.5 disabled:opacity-60"
              >
                {broadcastingTheme ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Only
              </button>
              <button
                onClick={() => handleBroadcastTheme(true)}
                disabled={broadcastingTheme || !broadcastThemeTitle.trim() || !broadcastThemeBody.trim()}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-brand rounded-pill py-2.5 disabled:opacity-60"
              >
                {broadcastingTheme ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Save & Send Push
              </button>
            </div>
            {broadcastThemeStatus && (
              <p className={`text-xs ${broadcastThemeStatus.type === "success" ? "text-brand-light" : "text-red-400"}`}>
                {broadcastThemeStatus.message}
              </p>
            )}
          </div>
        </div>

        {/* ── Upcoming Content — moved to the top so it's the first thing
             visible, since previewing/editing ahead of time is the main
             reason to be on this page. ──────────────────────────────── */}
        <div className="glass-card rounded-card p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h2 className="text-sm font-bold text-text">Generate the Next 7 Days Now</h2>
          </div>
          <p className="text-xs text-text-muted leading-relaxed mb-3">
            Normally this runs automatically every morning at 5:30am ET, filling in a week of
            daily inspirations, recipes, and WELL activities ahead of time so you have days to
            preview and edit before anything posts. Use this button to run it immediately instead
            of waiting for the next scheduled run.
          </p>
          <button
            onClick={handleGenerateWeek}
            disabled={generatingWeek}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white gradient-brand rounded-pill py-2.5 disabled:opacity-60"
          >
            {generatingWeek ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generatingWeek ? "Generating…" : "Generate This Week Now"}
          </button>
          {generateWeekStatus && (
            <p className={`text-xs mt-2 ${generateWeekStatus.type === "success" ? "text-brand-light" : "text-red-400"}`}>
              {generateWeekStatus.message}
            </p>
          )}
        </div>

        {futureContent.length > 0 && (
          <FutureContentSchedule
            entries={futureContent}
            onEdit={setEditingEntry}
            onDelete={handleRemove}
            onRegeneratePhoto={handleRegeneratePhoto}
            title="📅 Upcoming Content (Next 7+ Days)"
          />
        )}

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

        {/* ── Weekly Theme / WELL Activity / Recipe ─────────────────── */}
        <form onSubmit={handleAddDaySubmit} className="glass-card rounded-card p-4 flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-bold text-text mb-1">Weekly Theme, WELL Activity & Recipe</h2>
            <p className="text-xs text-text-muted">
              Pick a date and fill in whichever sections you want. Anything left blank is filled automatically by AI.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Date</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-[11px] font-semibold text-brand-light mb-2">Weekly Theme</p>
            <div className="flex flex-col gap-2">
              <input value={weeklyTitle} onChange={(e) => setWeeklyTitle(e.target.value)} placeholder="Theme title" className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue" />
              <textarea value={weeklyBody} onChange={(e) => setWeeklyBody(e.target.value)} placeholder="Theme description" rows={2} className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none" />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-[11px] font-semibold text-brand-light mb-2">WELL Activity</p>
            <div className="flex flex-col gap-2">
              <input value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} placeholder="Activity title" className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue" />
              <textarea value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} placeholder="Activity description" rows={2} className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none" />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-[11px] font-semibold text-brand-light mb-2">Recipe</p>

            {/* Recipe Generator */}
            <div className="mb-3 p-3 bg-surface-2 border border-brand-light/20 rounded-card flex flex-col gap-2">
              <p className="text-xs text-text-muted">✨ Or suggest a food type and we'll generate a recipe for you</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recipeSuggestion}
                  onChange={(e) => setRecipeSuggestion(e.target.value)}
                  placeholder="e.g., 'Italian pasta', 'healthy breakfast', 'vegan dessert'"
                  className="flex-1 bg-surface border border-border rounded-card px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
                />
                <button
                  type="button"
                  onClick={handleGenerateRecipe}
                  disabled={generatingRecipe || !recipeSuggestion.trim()}
                  className="gradient-brand text-white text-sm font-semibold px-4 py-2 rounded-pill disabled:opacity-50 shrink-0"
                >
                  {generatingRecipe ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>

            {/* Recipe preview — mirrors the real "Today's Recipe" card members
                see, with a pencil on each section to edit it inline. */}
            <div className="glass-card rounded-card overflow-hidden border border-border">
              {/* Photo */}
              <div className="relative">
                {recipeEditMode.image ? (
                  <div className="p-3 bg-surface-2">
                    <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Image URL</label>
                    <input
                      value={recipeImage}
                      onChange={(e) => setRecipeImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-surface border border-border rounded-card px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                ) : recipeImage ? (
                  <img src={recipeImage} alt={recipeName} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-surface-2 flex items-center justify-center">
                    <ImageIcon size={28} className="text-text-dim" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => toggleRecipeEdit("image")}
                  aria-label="Edit photo"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <Pencil size={13} />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ChefHat size={16} className="text-brand-light" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">
                    Today's Recipe
                  </span>
                </div>

                {/* Name */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  {recipeEditMode.name ? (
                    <input
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      placeholder="Recipe name"
                      className="flex-1 bg-surface-2 border border-border rounded-card px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
                    />
                  ) : (
                    <h2 className="text-lg font-bold text-text flex-1">{recipeName || "Recipe name"}</h2>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleRecipeEdit("name")}
                    aria-label="Edit name"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-2 border border-border text-brand-light shrink-0"
                  >
                    <Pencil size={13} />
                  </button>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-2">
                    {recipeEditMode.description ? (
                      <textarea
                        value={recipeDescription}
                        onChange={(e) => setRecipeDescription(e.target.value)}
                        placeholder="Description"
                        rows={2}
                        className="flex-1 bg-surface-2 border border-border rounded-card px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
                      />
                    ) : (
                      <p className="text-sm text-text-muted leading-relaxed flex-1">
                        {recipeDescription || "Description"}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleRecipeEdit("description")}
                      aria-label="Edit description"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-2 border border-border text-brand-light shrink-0"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-text">Ingredients</h3>
                    <button
                      type="button"
                      onClick={() => toggleRecipeEdit("ingredients")}
                      aria-label="Edit ingredients"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-2 border border-border text-brand-light shrink-0"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                  {recipeEditMode.ingredients ? (
                    <textarea
                      value={recipeIngredients}
                      onChange={(e) => setRecipeIngredients(e.target.value)}
                      placeholder="Ingredients, comma separated"
                      rows={3}
                      className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
                    />
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {recipeIngredients.split(",").map((s) => s.trim()).filter(Boolean).map((ingredient, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-light mt-1.5 shrink-0" />
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Steps */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-text">Steps</h3>
                    <button
                      type="button"
                      onClick={() => toggleRecipeEdit("steps")}
                      aria-label="Edit steps"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-2 border border-border text-brand-light shrink-0"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                  {recipeEditMode.steps ? (
                    <textarea
                      value={recipeSteps}
                      onChange={(e) => setRecipeSteps(e.target.value)}
                      placeholder="Steps, comma separated"
                      rows={3}
                      className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
                    />
                  ) : (
                    <ol className="flex flex-col gap-2">
                      {recipeSteps.split(",").map((s) => s.trim()).filter(Boolean).map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-text-muted">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-2 border border-border text-[11px] font-bold text-brand-light shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </div>
          </div>

          {addDayStatus && (
            <p className={`text-xs ${addDayStatus.type === "success" ? "text-brand-light" : "text-red-400"}`}>
              {addDayStatus.message}
            </p>
          )}

          <button
            type="submit"
            disabled={!scheduleDate}
            className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow disabled:opacity-50"
          >
            Save for This Day
          </button>
        </form>

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
