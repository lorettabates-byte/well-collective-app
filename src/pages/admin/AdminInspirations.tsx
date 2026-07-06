import { Calendar, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import type { InspirationCadence } from "../../types";
import { getAuthHeaders } from "../../utils/admin";

// This form always posts through /api/notes, which shows up in the app as
// a "Note from Loretta" regardless of which tab is selected — so that's
// the default/primary option. The other tabs are kept for labeling intent
// only; daily/weekly automated content is actually driven by the Content
// Schedule page, not this form.
const CADENCE_OPTIONS: { id: InspirationCadence; label: string }[] = [
  { id: "note", label: "Note from Loretta" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "motivational", label: "Motivational" },
];

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface ServerNote {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  scheduledFor: string | null;
}

export default function AdminInspirations() {

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
  const [cadence, setCadence] = useState<InspirationCadence>("note");
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

  return (
    <div>
      <TopBar title="Inspirations" subtitle="Schedule daily content" showBack />
      <div className="px-4 pt-4 pb-32">

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
          <div className="mb-8 p-4 bg-brand/5 border border-brand-light/30 rounded-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-brand-light" />
              <h2 className="text-sm font-bold text-text">📅 Upcoming Inspirations ({upcoming.length})</h2>
            </div>
            <div className="flex flex-col gap-2.5">
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
          </div>
        )}

        {/* ── Published / past ──────────────────────────────────────── */}
        {published.length > 0 && (
          <details className="group mb-6">
            <summary className="cursor-pointer select-none flex items-center gap-2 mb-3 text-sm font-bold text-text-muted hover:text-text transition-colors">
              <span className="inline-block transition-transform group-open:rotate-90">▶</span>
              Published ({notesLoading ? "…" : published.length})
            </summary>
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
          </details>
        )}
      </div>
    </div>
  );
}
