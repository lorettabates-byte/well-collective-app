import { Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { ContentBatchEntry, InspirationCadence } from "../../types";
import { timeAgo } from "../../utils/format";

const CADENCE_OPTIONS: { id: InspirationCadence; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "motivational", label: "Motivational" },
];

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("adminToken");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function AdminInspirations() {
  const { user, inspirations, addInspiration, deleteInspiration, updateInspiration } = useApp();
  const [cadence, setCadence] = useState<InspirationCadence>("daily");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const sentAt = scheduleMode === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString();
    addInspiration({
      title: title.trim(),
      body: body.trim(),
      author: user.name,
      cadence,
      sentAt,
    });
    setTitle("");
    setBody("");
    setScheduledAt("");
  };

  // Weekly theme / WELL activity / recipe-or-workout for a specific day —
  // writes straight to the shared content schedule. Anything left blank for
  // a given day falls back to AI-generated content automatically.
  const [scheduleDate, setScheduleDate] = useState("");
  const [weeklyTitle, setWeeklyTitle] = useState("");
  const [weeklyBody, setWeeklyBody] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState("");
  const [recipeSteps, setRecipeSteps] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
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
        image: "",
      };
    }

    if (!entry.weeklyTheme && !entry.wellActivity && !entry.recipe) {
      setScheduleStatus({ type: "error", message: "Fill in at least one section before saving." });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/content-schedule`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify([entry]),
      });
      if (res.ok) {
        setScheduleStatus({ type: "success", message: `Saved for ${scheduleDate}.` });
        setWeeklyTitle("");
        setWeeklyBody("");
        setActivityTitle("");
        setActivityDescription("");
        setRecipeName("");
        setRecipeDescription("");
        setRecipeIngredients("");
        setRecipeSteps("");
      } else {
        const err = await res.json();
        setScheduleStatus({ type: "error", message: err.error || "Failed to save." });
      }
    } catch {
      setScheduleStatus({ type: "error", message: "Failed to reach the server." });
    }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const startEdit = (id: string, title: string, body: string) => {
    setEditingId(id);
    setEditTitle(title);
    setEditBody(body);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim() && editBody.trim()) {
      updateInspiration(id, { title: editTitle.trim(), body: editBody.trim() });
    }
    setEditingId(null);
  };

  const sorted = [...inspirations].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  const upcoming = sorted.filter((i) => new Date(i.sentAt) > new Date());
  const past = sorted.filter((i) => new Date(i.sentAt) <= new Date());

  return (
    <div>
      <TopBar title="Inspirations" subtitle="Schedule daily content" showBack />
      <div className="px-4 pt-4">
        <form onSubmit={handleSubmit} className="glass-card rounded-card p-4 flex flex-col gap-3 mb-6">
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Cadence</label>
            <div className="flex gap-2 flex-wrap">
              {CADENCE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCadence(option.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-pill transition-colors ${
                    cadence === option.id ? "gradient-brand text-white" : "bg-surface-2 text-text-muted border border-border"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Inspiration title"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the inspiration message..."
              rows={4}
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Schedule</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setScheduleMode("now")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-pill transition-colors ${
                  scheduleMode === "now" ? "gradient-brand text-white" : "bg-surface-2 text-text-muted border border-border"
                }`}
              >
                Send Now
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode("scheduled")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-pill transition-colors ${
                  scheduleMode === "scheduled" ? "gradient-brand text-white" : "bg-surface-2 text-text-muted border border-border"
                }`}
              >
                Schedule
              </button>
            </div>
            {scheduleMode === "scheduled" && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={!title.trim() || !body.trim()}
            className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow disabled:opacity-50"
          >
            {scheduleMode === "now" ? "Publish Inspiration" : "Schedule Inspiration"}
          </button>
        </form>

        <form onSubmit={handleScheduleSubmit} className="glass-card rounded-card p-4 flex flex-col gap-3 mb-6">
          <div>
            <h2 className="text-sm font-bold text-text mb-1">Weekly Theme, WELL Activity & Recipe/Workout</h2>
            <p className="text-xs text-text-muted">
              Pick a date and fill in whichever sections you want to set yourself. Anything left blank for that
              day is filled in automatically by AI.
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
              <input
                value={weeklyTitle}
                onChange={(e) => setWeeklyTitle(e.target.value)}
                placeholder="Theme title"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
              <textarea
                value={weeklyBody}
                onChange={(e) => setWeeklyBody(e.target.value)}
                placeholder="Theme description"
                rows={2}
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
              />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-[11px] font-semibold text-brand-light mb-2">WELL Activity</p>
            <div className="flex flex-col gap-2">
              <input
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="Activity title"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
              <textarea
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="Activity description"
                rows={2}
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
              />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-[11px] font-semibold text-brand-light mb-2">Recipe / Workout</p>
            <div className="flex flex-col gap-2">
              <input
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Name"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
              <textarea
                value={recipeDescription}
                onChange={(e) => setRecipeDescription(e.target.value)}
                placeholder="Description"
                rows={2}
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
              />
              <input
                value={recipeIngredients}
                onChange={(e) => setRecipeIngredients(e.target.value)}
                placeholder="Ingredients/equipment, comma separated"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
              <input
                value={recipeSteps}
                onChange={(e) => setRecipeSteps(e.target.value)}
                placeholder="Steps, comma separated"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          {scheduleStatus && (
            <p className={`text-xs ${scheduleStatus.type === "success" ? "text-brand-light" : "text-red-400"}`}>
              {scheduleStatus.message}
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

        {upcoming.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-text mb-3">📅 Upcoming ({upcoming.length})</h2>
            <div className="flex flex-col gap-2.5 mb-6">
              {upcoming.map((inspiration) => (
                <div key={inspiration.id} className="glass-card rounded-card px-4 py-3 border border-brand-blue/30">
                  {editingId === inspiration.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-blue"
                      />
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={3}
                        className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-blue resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(inspiration.id)} className="flex items-center gap-1 text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-1.5">
                          <Check size={12} /> Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-text-muted border border-border rounded-pill px-3 py-1.5">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">{inspiration.cadence}</span>
                          <span className="text-[11px] text-text-dim">{new Date(inspiration.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-sm font-semibold text-text">{inspiration.title}</p>
                        <p className="text-xs text-text-muted">{inspiration.body}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEdit(inspiration.id, inspiration.title, inspiration.body)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-brand-light" aria-label="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteInspiration(inspiration.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-red-400" aria-label="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="text-sm font-bold text-text mb-3">All Inspirations ({past.length})</h2>
        <div className="flex flex-col gap-2.5">
          {past.map((inspiration) => (
            <div key={inspiration.id} className="glass-card rounded-card px-4 py-3 flex items-start gap-3">
              {editingId === inspiration.id ? (
                <div className="flex flex-col gap-2 w-full">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-blue"
                  />
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className="w-full bg-surface-2 border border-border rounded-card px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-blue resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(inspiration.id)} className="flex items-center gap-1 text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-1.5">
                      <Check size={12} /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-text-muted border border-border rounded-pill px-3 py-1.5">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">{inspiration.cadence}</span>
                      <span className="text-[11px] text-text-dim">{timeAgo(inspiration.sentAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-text">{inspiration.title}</p>
                    <p className="text-xs text-text-muted line-clamp-2">{inspiration.body}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(inspiration.id, inspiration.title, inspiration.body)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-brand-light" aria-label="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteInspiration(inspiration.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-red-400" aria-label="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
