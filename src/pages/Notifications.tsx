import { AtSign, Bell, Calendar, MessageCircle, Rss, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import type { AppNotificationType } from "../types";
import { timeAgo } from "../utils/format";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface UnreadMessage {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

const ICONS: Record<AppNotificationType, typeof Bell> = {
  post: MessageCircle,
  reply: MessageCircle,
  mention: AtSign,
  general: Sparkles,
  event: Calendar,
  blog: Rss,
};

export default function Notifications() {
  const { user, notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const hasUnread = notifications.some((n) => !n.read);

  // Auto-clear the unread badge the moment the user opens this page
  useEffect(() => {
    markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  useEffect(() => {
    if (!API_URL || !user.email) return;
    // Fetch unread messages from API — this is a simplified fetch that gets count
    // In a real implementation, you'd need an endpoint that returns unread message details
    fetch(`${API_URL}/api/messages/unread-count?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.count > 0) {
          // Placeholder: show a generic unread messages notification
          // A more complete implementation would fetch the actual messages
          setUnreadMessages([]);
        }
      })
      .catch(() => {});
  }, [user.email]);

  return (
    <div>
      <TopBar
        title="Notifications"
        showBack
        right={
          hasUnread ? (
            <button onClick={markAllNotificationsRead} className="text-xs font-semibold text-brand-light">
              Mark all read
            </button>
          ) : undefined
        }
      />
      <div className="px-4 pt-4 flex flex-col gap-2.5">
        {sorted.length === 0 && unreadMessages.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">You're all caught up 🌿</p>
        ) : (
          <>
            {unreadMessages.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-2">Private Messages</p>
                {unreadMessages.map((msg) => (
                  <Link
                    key={msg.id}
                    to="/community"
                    className="flex items-start gap-3 rounded-card px-4 py-3.5 bg-brand-blue/10 border border-brand-light/20"
                  >
                    <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-brand-light">
                      <MessageCircle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{msg.senderName}</p>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{msg.body}</p>
                      <p className="text-[11px] text-text-dim mt-1">{timeAgo(msg.createdAt)}</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-brand-light shrink-0 mt-1.5" />
                  </Link>
                ))}
              </div>
            )}
            {sorted.map((notification) => {
              const Icon = ICONS[notification.type];
              const FALLBACK_LINKS: Record<AppNotificationType, string> = {
                post: "/community",
                reply: "/community",
                mention: "/community",
                general: "/inspirations",
                event: "/events",
                blog: "/blog",
              };
              const destination = notification.link ?? FALLBACK_LINKS[notification.type];
              const content = (
                <div
                  className={`flex items-start gap-3 rounded-card px-4 py-3.5 ${
                    notification.read ? "glass-card" : "bg-brand-blue/10 border border-brand-light/20"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-brand-light">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text">{notification.title}</p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notification.body}</p>
                    <p className="text-[11px] text-text-dim mt-1">{timeAgo(notification.createdAt)}</p>
                  </div>
                  {!notification.read && <span className="w-2 h-2 rounded-full bg-brand-light shrink-0 mt-1.5" />}
                </div>
              );

              return (
                <Link key={notification.id} to={destination} onClick={() => markNotificationRead(notification.id)}>
                  {content}
                </Link>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
