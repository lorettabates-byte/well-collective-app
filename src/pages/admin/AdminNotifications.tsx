import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { AppNotificationType } from "../../types";
import { timeAgo } from "../../utils/format";

const TYPE_OPTIONS: { id: AppNotificationType; label: string }[] = [
  { id: "general", label: "General" },
  { id: "post", label: "New Post" },
  { id: "reply", label: "Reply" },
  { id: "mention", label: "Mention" },
  { id: "event", label: "New Event" },
  { id: "blog", label: "New Blog Post" },
];

export default function AdminNotifications() {
  const { notifications, sendNotification } = useApp();
  const [type, setType] = useState<AppNotificationType>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    sendNotification(type, title.trim(), body.trim());
    setTitle("");
    setBody("");
  };

  const recent = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <div>
      <TopBar title="Notifications" subtitle="Send push notifications" showBack />
      <div className="px-4 pt-4">
        <form onSubmit={handleSubmit} className="glass-card rounded-card p-4 flex flex-col gap-3 mb-6">
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Type</label>
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setType(option.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-pill transition-colors ${
                    type === option.id ? "gradient-brand text-white" : "bg-surface-2 text-text-muted border border-border"
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
              placeholder="Notification title"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message"
              rows={3}
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={!title.trim() || !body.trim()}
            className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow disabled:opacity-50"
          >
            Send Notification
          </button>
        </form>

        <h2 className="text-sm font-bold text-text mb-3">Recently Sent</h2>
        <div className="flex flex-col gap-2.5">
          {recent.map((notification) => (
            <div key={notification.id} className="glass-card rounded-card px-4 py-3">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">{notification.type}</span>
                <span className="text-[11px] text-text-dim">{timeAgo(notification.createdAt)}</span>
              </div>
              <p className="text-sm font-semibold text-text">{notification.title}</p>
              <p className="text-xs text-text-muted line-clamp-2">{notification.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
