import { Calendar, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { ContentBatchEntry, InspirationCadence } from "../../types";

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

interface ServerNote {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  scheduledFor: string | null;
}

export default function AdminInspirations() {
  const { user } = useApp();

  // ── Server-backed loretta notes ──────────────────────────────────────────
  const [notes, setNotes] = useState<ServerNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);

  const fetchNotes = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/notes/admin`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes ?? []);
      }
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, []);

  // ── Add note form ────────────────────────────────────────────────────────
  const [cadence, setCadence] = useState<InspirationCadence>("daily");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !API_URL) return;
    const scheduledFor = scheduleMode === "scheduled" && scheduledAt
      ? new Date(scheduledAt).toISOString()
      : null;
    try {
      const res = await fetch(`${API_URL}/api/notes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: title.trim(), body: body.trim(), scheduledFor }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setTitle(""); setBody(""); setScheduledAt(""); setScheduleMode("now");
        setAddStatus(scheduledFor ? "Scheduled!" : "Published!");
        setShowAddForm(false);
        setTimeout(() => setAddStatus(null), 3000);
      } else {
        setAddStatus("Error saving.");
      }
    } catch {
      setAddStatus("Failed to reach server.");
    }
  };

  // ── Inline edit ──────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const startEdit = (note: ServerNote) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditBody(note.body);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim() || !editBody.trim() || !API_URL) return;
    const res = await fetch(`${API_URL}/api/notes/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title: editTitle.trim(), body: editBody.trim() }),
    });
    if (res.ok) {
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, title: editTitle.trim(), body: editBody.trim() } : n));
    }
    setEditingId(null);
  };

  const deleteNote = async (id: string) => {
    if (!API_URL) return;
    await fetch(`${API_URL}/api/notes/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const now = new Date();
  const upcoming = notes.filter((n) => n.scheduledFor && new Date(n.scheduledFor) > now);
  const published = notes.filter((n) => !n.scheduledFor || new Date(n.scheduledFor) <= now);

  // ── Weekly theme / WELL activity / recipe form ───────────────────────────
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
        setWeeklyTitle(""); setWeeklyBody(""); setActivityTitle(""); setActivityDescription("");
        setRecipeName(""); setRecipeDescription(""); setRecipeIngredients(""); setRecipeSteps("");
      } else {
        const err = await res.json();
        setScheduleStatus({ type: "error", message: err.error || "Failed to save." });
      }
    } catch {
      setScheduleStatus({ type: "error", message: "Failed to reach the server." });
    }
  };

  return (
    <div>
      <TopBar title="Inspirations" subtitle="Schedule daily content" showBack />
      <div className="px-4 pt-4 pb-8">

        {/* ── Add note ──────────────────────────────────────────────── */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow mb-6"
          >
            <Plus size={15} /> New Inspiration Post
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card rounded-card p-4 flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text">New Inspiration</h2>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-text-muted">Cancel</button>
            </div>

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
                  Schedule for Later
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

            {addStatus && <p className="text-xs text-brand-light">{addStatus}</p>}

            <button
              type="submit"
              disabled={!title.trim() || !body.trim()}
              className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow disabled:opacity-50"
            >
              {scheduleMode === "now" ? "Publish Now" : "Schedule"}
            </button>
          </form>
        )}

        {/* ── Upcoming (scheduled for future) ───────────────────────── */}
        {upcoming.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-brand-light" />
              <h2 className="text-sm font-bold text-text">Upcoming ({upcoming.length})</h2>
            </div>
            <div className="flex flex-col gap-2.5 mb-6">
              {upcoming.map((note) => (
                <div key={note.id} className="glass-card rounded-card px-4 py-3 border border-brand-blue/30">
                  {editingId === note.id ? (
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
                        <button onClick={() => saveEdit(note.id)} className="flex items-center gap-1 text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-1.5">
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
                          <span className="text-[11px] font-semibold text-brand-light">
                            Scheduled: {new Date(note.scheduledFor!).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-text">{note.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">{note.body}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEdit(note)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-brand-light" aria-label="Edit">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteNote(note.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-red-400" aria-label="Delete">
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

        {/* ── Published / past ──────────────────────────────────────── */}
        <h2 className="text-sm font-bold text-text mb-3">
          Published ({notesLoading ? "…" : published.length})
        </h2>
        <div className="flex flex-col gap-2.5 mb-6">
          {notesLoading && (
            <p className="text-xs text-text-muted py-4 text-center">Loading…</p>
          )}
          {!notesLoading && published.length === 0 && (
            <p className="text-xs text-text-muted py-4 text-center">No published inspirations yet.</p>
          )}
          {published.map((note) => (
            <div key={note.id} className="glass-card rounded-card px-4 py-3 flex items-start gap-3">
              {editingId === note.id ? (
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
                    <button onClick={() => saveEdit(note.id)} className="flex items-center gap-1 text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-1.5">
                      <Check size={12} /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-text-muted border border-border rounded-pill px-3 py-1.5">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-text-dim mb-0.5">
                      {new Date(note.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-sm font-semibold text-text">{note.title}</p>
                    <p className="text-xs text-text-muted line-clamp-2">{note.body}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(note)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-brand-light" aria-label="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteNote(note.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-red-400" aria-label="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── Weekly Theme / WELL Activity / Recipe ─────────────────── */}
        <form onSubmit={handleScheduleSubmit} className="glass-card rounded-card p-4 flex flex-col gap-3">
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
            <p className="text-[11px] font-semibold text-brand-light mb-2">Recipe / Workout</p>
            <div className="flex flex-col gap-2">
              <input value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="Name" className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue" />
              <textarea value={recipeDescription} onChange={(e) => setRecipeDescription(e.target.value)} placeholder="Description" rows={2} className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none" />
              <input value={recipeIngredients} onChange={(e) => setRecipeIngredients(e.target.value)} placeholder="Ingredients, comma separated" className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue" />
              <input value={recipeSteps} onChange={(e) => setRecipeSteps(e.target.value)} placeholder="Steps, comma separated" className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue" />
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
      </div>
    </div>
  );
}
