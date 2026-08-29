import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { AlertCircle, BellOff, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import TopBar from "../components/layout/TopBar";
import { subscribeToPush, unsubscribeFromPush } from "../lib/push";
import { useApp } from "../store/AppContext";
import type { NotificationSettings as NotificationSettingsType } from "../types";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

// Common timezones for the picker
const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Hong_Kong",
  "Australia/Sydney",
];

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
  {
    key: "weeklyTheme",
    label: "Weekly Theme",
    description: "Sent every Monday at 7am with this week's theme",
  },
  {
    key: "dailyInspiration",
    label: "Daily Inspiration",
    description: "Sent daily at 7am, following this week's theme",
  },
  {
    key: "newEvents",
    label: "New Events",
    description: "When a new event is added to the calendar",
  },
  {
    key: "newBlogs",
    label: "New Blog Posts",
    description: "When a new post is published to the blog",
  },
  {
    key: "newSongs",
    label: "New Songs",
    description: "When a new song drops on Music Monday",
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
  const { user, notificationSettings, updateNotificationSettings, updateProfile } = useApp();
  const [pushError, setPushError] = useState("");
  const [timezone, setTimezone] = useState(user.timezone || "America/New_York");
  const [notificationSchedule, setNotificationSchedule] = useState(
    user.notificationSchedule || { send7am: true, send3pm: false, send9pm: false }
  );
  const [quietEnabled, setQuietEnabled] = useState(!!(user.notifQuietStart && user.notifQuietEnd));
  const [quietStart, setQuietStart] = useState(user.notifQuietStart || "22:00");
  const [quietEnd, setQuietEnd] = useState(user.notifQuietEnd || "07:00");
  const [saving, setSaving] = useState(false);

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  const openSystemSettings = async () => {
    if (!isNative) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AppAny = App as any;
      if (platform === "android") {
        // Intent URI: opens the app's notification settings page directly on Android 8+
        await AppAny.openUrl({
          url: "intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S.android.provider.extra.APP_PACKAGE=com.wellcollective.app;end",
        });
      } else {
        // iOS uses the app-settings: scheme
        await AppAny.openUrl({ url: "app-settings:" });
      }
    } catch {
      // fallback: open general settings (should rarely happen)
      window.open("app-settings:", "_system");
    }
  };

  const handleTogglePush = async () => {
    setPushError("");
    if (notificationSettings.pushEnabled) {
      await unsubscribeFromPush();
      updateNotificationSettings({ pushEnabled: false });
      return;
    }

    // On Android native, Web Push (PushManager/service worker) is not available in
    // Capacitor's WebView. Instead, request the system notification permission via the
    // Notification API if it exists, then open settings if it's denied. We still set
    // pushEnabled=true when the user has granted the OS permission so they can
    // receive server-sent notifications (the app sends via Brevo/server-side).
    if (isNative && platform === "android") {
      if (typeof Notification === "undefined") {
        // WebView has no Notification API at all — send the user to settings
        setPushError("To enable notifications, go to your phone's Settings > Apps > WELL Collective > Notifications and turn them on.");
        openSystemSettings();
        return;
      }
      if (Notification.permission === "denied") {
        setPushError("Notifications are blocked. Go to Settings > Apps > WELL Collective > Notifications to enable them.");
        openSystemSettings();
        return;
      }
      // Try requesting permission — this may show the Android native dialog in newer WebViews
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        updateNotificationSettings({ pushEnabled: true });
      } else {
        setPushError("To enable notifications, go to your phone's Settings > Apps > WELL Collective > Notifications and turn them on.");
        openSystemSettings();
      }
      return;
    }

    // iOS native: Notification API absence means permission is fully blocked
    if (isNative && platform === "ios" && typeof Notification === "undefined") {
      setPushError("Go to Settings > WELL Collective > Notifications to enable them.");
      openSystemSettings();
      return;
    }
    try {
      const result = await subscribeToPush(user.email || user.name);
      updateNotificationSettings({ pushEnabled: result.success });
      if (!result.success && result.reason) {
        setPushError(result.reason);
        // If denied on iOS native, open Settings automatically
        if (isNative && platform === "ios" && typeof Notification !== "undefined" && Notification.permission === "denied") {
          openSystemSettings();
        }
      }
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const handleSaveTimezoneSettings = async () => {
    if (!user.email || !API_URL) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/members/notification-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          timezone,
          notificationSchedule,
          notifQuietStart: quietEnabled ? quietStart : null,
          notifQuietEnd: quietEnabled ? quietEnd : null,
        }),
      });

      if (res.ok) {
        updateProfile({
          notificationSchedule,
          ...(timezone !== user.timezone ? { timezone } : {}),
          notifQuietStart: quietEnabled ? quietStart : undefined,
          notifQuietEnd: quietEnabled ? quietEnd : undefined,
        });
      }
    } catch (err) {
      console.error("Failed to save timezone settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TopBar title="Notification Settings" showBack />
      <div className="px-4 pt-4 flex flex-col gap-2.5">
        {pushError && (
          <div className="flex flex-col gap-2 bg-red-500/10 border border-red-500/30 rounded-card p-3">
            <div className="flex gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{pushError}</p>
            </div>
            {isNative && platform === "android" && (
              <button
                onClick={openSystemSettings}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-300 underline"
              >
                <ExternalLink size={12} />
                Open Settings
              </button>
            )}
            {isNative && platform === "ios" && (
              <button
                onClick={openSystemSettings}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-300 underline"
              >
                <ExternalLink size={12} />
                Open Settings
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text">Push Notifications</p>
            <p className="text-xs text-text-muted mt-0.5">
              Allow WELL Collective to send notifications to this device
            </p>
          </div>
          <Toggle enabled={notificationSettings.pushEnabled} onToggle={handleTogglePush} />
        </div>

        {/* Timezone & Scheduled Notifications */}
        <div className="mt-2 mb-1">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Scheduled Notifications</p>
        </div>
        <div className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5">
          <Clock size={16} className="text-brand-light shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text mb-2">Your Timezone</p>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-light"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">7:00 AM</p>
              <p className="text-xs text-text-muted mt-0.5">Morning motivation</p>
            </div>
            <Toggle
              enabled={notificationSchedule.send7am || false}
              onToggle={() => setNotificationSchedule({ ...notificationSchedule, send7am: !notificationSchedule.send7am })}
            />
          </div>
          <div className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">3:00 PM</p>
              <p className="text-xs text-text-muted mt-0.5">Afternoon check-in</p>
            </div>
            <Toggle
              enabled={notificationSchedule.send3pm || false}
              onToggle={() => setNotificationSchedule({ ...notificationSchedule, send3pm: !notificationSchedule.send3pm })}
            />
          </div>
          <div className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">9:00 PM</p>
              <p className="text-xs text-text-muted mt-0.5">Evening reflection</p>
            </div>
            <Toggle
              enabled={notificationSchedule.send9pm || false}
              onToggle={() => setNotificationSchedule({ ...notificationSchedule, send9pm: !notificationSchedule.send9pm })}
            />
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="mt-2 mb-1">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Quiet Hours</p>
        </div>
        <div className="glass-card rounded-card px-4 py-3.5">
          <div className="flex items-center gap-3 mb-3">
            <BellOff size={16} className="text-brand-light shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">Do Not Disturb</p>
              <p className="text-xs text-text-muted mt-0.5">Silence all notifications during these hours</p>
            </div>
            <Toggle enabled={quietEnabled} onToggle={() => setQuietEnabled((v) => !v)} />
          </div>
          {quietEnabled && (
            <div className="flex items-center gap-3 mt-2 pt-3 border-t border-border">
              <div className="flex-1">
                <p className="text-xs text-text-muted mb-1">From</p>
                <select
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-light"
                >
                  {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`]).flat().map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-muted mb-1">Until</p>
                <select
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-light"
                >
                  {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`]).flat().map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSaveTimezoneSettings}
          disabled={saving}
          className="gradient-brand text-white text-sm font-semibold rounded-pill py-3 px-6 mt-2 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Timezone & Times"}
        </button>

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
