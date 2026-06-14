import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import type { NotificationSettings as NotificationSettingsType } from "../types";

const TOGGLES: { key: keyof NotificationSettingsType; label: string; description: string }[] = [
  {
    key: "community",
    label: "Community Activity",
    description: "New posts and updates from the community",
  },
  {
    key: "replies",
    label: "Replies",
    description: "When someone replies to your post or message",
  },
  {
    key: "mentions",
    label: "Mentions",
    description: "When someone mentions you directly",
  },
  {
    key: "general",
    label: "General Announcements",
    description: "Inspirations, events, and updates from WELL",
  },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${enabled ? "gradient-brand" : "bg-surface-3"}`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function NotificationSettings() {
  const { notificationSettings, updateNotificationSettings } = useApp();

  return (
    <div>
      <TopBar title="Notification Settings" showBack />
      <div className="px-4 pt-4 flex flex-col gap-2.5">
        {TOGGLES.map(({ key, label, description }) => (
          <div key={key} className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">{label}</p>
              <p className="text-xs text-text-muted mt-0.5">{description}</p>
            </div>
            <Toggle
              enabled={notificationSettings[key]}
              onToggle={() => updateNotificationSettings({ [key]: !notificationSettings[key] })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
