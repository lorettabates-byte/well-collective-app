import { Trash2 } from "lucide-react";
import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { InspirationCadence } from "../../types";
import { timeAgo } from "../../utils/format";

const CADENCE_OPTIONS: { id: InspirationCadence; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "motivational", label: "Motivational" },
];

export default function AdminInspirations() {
  const { user, inspirations, addInspiration, deleteInspiration } = useApp();
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

  const sorted = [...inspirations].sort((a, b) => b.sentAt.localeCompare(a.sentAt));

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

        <h2 className="text-sm font-bold text-text mb-3">All Inspirations</h2>
        <div className="flex flex-col gap-2.5">
          {sorted.map((inspiration) => (
            <div key={inspiration.id} className="glass-card rounded-card px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">{inspiration.cadence}</span>
                  <span className="text-[11px] text-text-dim">{timeAgo(inspiration.sentAt)}</span>
                </div>
                <p className="text-sm font-semibold text-text">{inspiration.title}</p>
                <p className="text-xs text-text-muted line-clamp-2">{inspiration.body}</p>
              </div>
              <button
                onClick={() => deleteInspiration(inspiration.id)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0 text-red-400"
                aria-label="Delete inspiration"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
