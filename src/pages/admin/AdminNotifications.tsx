import { Calendar, Check, Image as ImageIcon, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { AppNotificationType } from "../../types";
import { getAuthHeaders } from "../../utils/admin";
import { compressImage, MAX_PHOTO_BYTES } from "../../utils/compressImage";
import { timeAgo } from "../../utils/format";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

const TYPE_OPTIONS: { id: AppNotificationType; label: string }[] = [
  { id: "general", label: "General" },
  { id: "post", label: "New Post" },
  { id: "reply", label: "Reply" },
  { id: "mention", label: "Mention" },
  { id: "event", label: "New Event" },
  { id: "blog", label: "New Blog Post" },
];

// Where tapping the bell entry should land — without this, notifications
// sent from this form had no link at all, so tapping one (e.g. a "Note from
// Loretta") just marked it read and went nowhere.
const TYPE_LINKS: Record<AppNotificationType, string> = {
  general: "/inspirations",
  post: "/community",
  reply: "/community",
  mention: "/community",
  event: "/events",
  blog: "/blog",
  tribe: "/tribe",
};

import { useEffect } from "react";

export default function AdminNotifications() {
  const { notifications, sendNotification } = useApp();
  const [type, setType] = useState<AppNotificationType>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [photoError, setPhotoError] = useState("");
  const [sending, setSending] = useState(false);
  const [pushError, setPushError] = useState("");
  const [checkingBlog, setCheckingBlog] = useState(false);
  const [blogMessage, setBlogMessage] = useState("");
  const [checkingVideo, setCheckingVideo] = useState(false);
  const [videoMessage, setVideoMessage] = useState("");

  const [schedTitle, setSchedTitle] = useState("");
  const [schedBody, setSchedBody] = useState("");
  const [schedAt, setSchedAt] = useState("");
  const [scheduledItems, setScheduledItems] = useState<{ id: number; title: string; body: string; send_at: string }[]>([]);
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedMessage, setSchedMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editAt, setEditAt] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { loadScheduled(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadScheduled = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications/scheduled`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setScheduledItems(data.scheduled || []);
      }
    } catch { /* ignore */ }
  };

  const handleScheduleNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedTitle.trim() || !schedBody.trim() || !schedAt || !API_URL) return;
    setSchedSaving(true);
    setSchedMessage("");
    try {
      const res = await fetch(`${API_URL}/api/notifications/scheduled`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: schedTitle.trim(), body: schedBody.trim(), sendAt: schedAt }),
      });
      if (res.ok) {
        setSchedTitle("");
        setSchedBody("");
        setSchedAt("");
        setSchedMessage("Notification scheduled!");
        loadScheduled();
      } else {
        const err = await res.json().catch(() => ({}));
        setSchedMessage(err.error || "Failed to schedule");
      }
    } catch {
      setSchedMessage("Failed to schedule");
    } finally {
      setSchedSaving(false);
    }
  };

  const handleDeleteScheduled = async (id: number) => {
    if (!API_URL) return;
    try {
      await fetch(`${API_URL}/api/notifications/scheduled/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      loadScheduled();
    } catch { /* ignore */ }
  };

  const startEdit = (item: { id: number; title: string; body: string; send_at: string }) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditBody(item.body);
    // Convert UTC ISO to local datetime-local value
    const local = new Date(item.send_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    setEditAt(
      `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`
    );
  };

  const handleSaveEdit = async (id: number) => {
    if (!API_URL || !editTitle.trim() || !editBody.trim() || !editAt) return;
    setEditSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications/scheduled/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: editTitle.trim(), body: editBody.trim(), sendAt: editAt }),
      });
      if (res.ok) {
        setEditingId(null);
        loadScheduled();
      }
    } catch { /* ignore */ } finally {
      setEditSaving(false);
    }
  };

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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is too large — please choose an image smaller than 15MB.");
      e.target.value = "";
      return;
    }
    setPhotoError("");
    setImage(await compressImage(file, 1200, 0.85));
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    sendNotification(type, title.trim(), body.trim(), TYPE_LINKS[type]);

    if (API_URL) {
      setSending(true);
      setPushError("");
      try {
        const res = await fetch(`${API_URL}/api/notes`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ title: title.trim(), body: body.trim(), image }),
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
    setImage(undefined);
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
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Photo (optional)</label>
            {image ? (
              <div className="relative w-full">
                <img src={image} alt="" className="w-full max-h-44 object-cover rounded-card" />
                <button
                  type="button"
                  onClick={() => setImage(undefined)}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full bg-surface-2 border border-dashed border-border rounded-card px-4 py-3 text-sm text-text-muted cursor-pointer">
                <ImageIcon size={16} />
                Add a photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
            {photoError && <p className="text-xs text-red-400 mt-1.5">{photoError}</p>}
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

        {/* Schedule a future notification */}
        <form onSubmit={handleScheduleNotification} className="glass-card rounded-card p-4 flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-brand-light" />
            <h3 className="text-sm font-bold text-text">Schedule a Notification</h3>
          </div>
          <p className="text-xs text-text-muted -mt-1">Set a date &amp; time and it will send automatically.</p>
          <input
            value={schedTitle}
            onChange={(e) => setSchedTitle(e.target.value)}
            placeholder="Notification title"
            className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
          />
          <textarea
            value={schedBody}
            onChange={(e) => setSchedBody(e.target.value)}
            placeholder="Notification message"
            rows={2}
            className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
          />
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Send at (your local time)</label>
            <input
              type="datetime-local"
              value={schedAt}
              onChange={(e) => setSchedAt(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
            />
          </div>
          {schedMessage && (
            <p className={`text-xs ${schedMessage.includes("scheduled") ? "text-green-400" : "text-red-400"}`}>{schedMessage}</p>
          )}
          <button
            type="submit"
            disabled={!schedTitle.trim() || !schedBody.trim() || !schedAt || schedSaving}
            className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow disabled:opacity-50"
          >
            {schedSaving ? "Scheduling…" : "Schedule Notification"}
          </button>
          {scheduledItems.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border pt-3 mt-1">
              <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wide">Upcoming Scheduled</p>
              {scheduledItems.map((item) => (
                <div key={item.id} className="bg-surface-2 rounded-card px-3 py-2">
                  {editingId === item.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-brand-light"
                      />
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={2}
                        className="w-full bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-brand-light resize-none"
                      />
                      <input
                        type="datetime-local"
                        value={editAt}
                        onChange={(e) => setEditAt(e.target.value)}
                        className="w-full bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-brand-light"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={editSaving}
                          className="flex items-center gap-1 text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-1 disabled:opacity-50"
                        >
                          <Check size={12} />
                          {editSaving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-text-muted px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text truncate">{item.title}</p>
                        <p className="text-[11px] text-text-muted truncate">{item.body}</p>
                        <p className="text-[11px] text-brand-light mt-0.5">{new Date(item.send_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEdit(item)} className="text-text-muted p-1">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDeleteScheduled(item.id)} className="text-red-400 p-1">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
