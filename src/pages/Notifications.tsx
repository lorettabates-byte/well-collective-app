import { AtSign, Bell, MessageCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import type { AppNotificationType } from "../types";
import { timeAgo } from "../utils/format";

const ICONS: Record<AppNotificationType, typeof Bell> = {
  post: MessageCircle,
  reply: MessageCircle,
  mention: AtSign,
  general: Sparkles,
};

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const hasUnread = notifications.some((n) => !n.read);

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
        {sorted.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">You're all caught up 🌿</p>
        ) : (
          sorted.map((notification) => {
            const Icon = ICONS[notification.type];
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

            if (notification.link) {
              return (
                <Link key={notification.id} to={notification.link} onClick={() => markNotificationRead(notification.id)}>
                  {content}
                </Link>
              );
            }

            return (
              <button key={notification.id} onClick={() => markNotificationRead(notification.id)} className="text-left">
                {content}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
