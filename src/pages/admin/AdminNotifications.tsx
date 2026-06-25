import { Loader2 } from "lucide-react";
import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { AppNotificationType } from "../../types";
import { timeAgo } from "../../utils/format";

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
  const [sending, setSending] = useState(false);
  const [pushError, setPushError] = useState("");
  const [checkingBlog, setCheckingBlog] = useState(false);
  const [blogMessage, setBlogMessage] = useState("");
  const [checkingVideo, setCheckingVideo] = useState(false);
  const [videoMessage, setVideoMessage] = useState("");

  const handleCheckBlogPosts = async () => {
    if (!API_URL) return;
    setCheckingBlog(true);
    setBlogMessage("");
    try {
      const res = await fetch(`${API_URL}/api/blog/send-blog-notification`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setBlogMessage("✓ Blog posts checked. New posts will send notifications automatically.");
      } else {
        setBlogMessage("Check failed. New posts will still be detected within the hour.");
      }
    } catch {
      setBlogMessage("Check failed. New posts will still be detected within the hour.");
    } finally {
      setCheckingBlog(false);
    }
  };

  const handleCheckVideos = async () => {
    if (!API_URL) return;
    setCheckingVideo(true);
    setVideoMessage("");
    try {
      const res = await fetch(`${API_URL}/api/video/send-video-notification`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setVideoMessage("✓ Classes checked. New videos will send notifications automatically.");
      } else {
        setVideoMessage("Check failed. New classes will still be detected every 30 minutes.");
      }
    } catch {
      setVideoMessage("Check failed. New classes will still be detected every 30 minutes.");
    } finally {
      setCheckingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    sendNotification(type, title.trim(), body.trim());

    if (API_URL) {
      setSending(true);
      setPushError("");
      try {
        const res = await fetch(`${API_URL}/api/notes`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ title: title.trim(), body: body.trim() }),
        });
        if (!res.ok) {
          setPushError("Saved here, but the push notification failed to send.");
        }
      } catch {
        setPushError("Saved here, but the push notification failed to send.");
      } finally {
        setSending(false);
      }
    }

    setTitle("");
    setBody("");
  };

  const recent = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <div>
      <TopBar title="Notifications" subtitle="Send push notifications" showBack />
      <div className="px-4 pt-4">
        <div className="glass-card rounded-card p-4 flex flex-col gap-3 mb-4">
          <h3 className="text-sm font-bold text-text">Blog Notifications</h3>
          <p className="text-xs text-text-muted">Automatically checks every hour. Click to force a check now.</p>
          {blogMessage && (
            <p className={`text-xs ${blogMessage.startsWith("✓") ? "text-green-400" : "text-amber-400"}`}>
              {blogMessage}
            </p>
          )}
          <button
            onClick={handleCheckBlogPosts}
            disabled={checkingBlog}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white gradient-brand rounded-pill py-2.5 disabled:opacity-60"
          >
            {checkingBlog ? <Loader2 size={16} className="animate-spin" /> : "📝"}
            {checkingBlog ? "Checking…" : "Check for New Blog Posts"}
          </button>
        </div>

        <div className="glass-card rounded-card p-4 flex flex-col gap-3 mb-6">
          <h3 className="text-sm font-bold text-text">Class Notifications</h3>
          <p className="text-xs text-text-muted">Automatically checks every 30 minutes. Click to force a check now.</p>
          {videoMessage && (
            <p className={`text-xs ${videoMessage.startsWith("✓") ? "text-green-400" : "text-amber-400"}`}>
              {videoMessage}
            </p>
          )}
          <button
            onClick={handleCheckVideos}
            disabled={checkingVideo}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white gradient-brand rounded-pill py-2.5 disabled:opacity-60"
          >
            {checkingVideo ? <Loader2 size={16} className="animate-spin" /> : "🎥"}
            {checkingVideo ? "Checking…" : "Check for New Classes"}
          </button>
        </div>

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
          {pushError && <p className="text-xs text-red-400">{pushError}</p>}
          <button
            type="submit"
            disabled={!title.trim() || !body.trim() || sending}
            className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send Notification"}
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
