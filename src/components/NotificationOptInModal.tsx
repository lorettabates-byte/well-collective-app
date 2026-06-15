import { Bell, Sparkles } from "lucide-react";
import { subscribeToPush } from "../lib/push";
import { useApp } from "../store/AppContext";

interface NotificationOptInModalProps {
  onClose: () => void;
}

export default function NotificationOptInModal({ onClose }: NotificationOptInModalProps) {
  const { user, updateNotificationSettings } = useApp();

  const handleEnable = async () => {
    try {
      const subscribed = await subscribeToPush(user.email || user.name);
      updateNotificationSettings({
        pushEnabled: subscribed,
        weeklyTheme: true,
        dailyInspiration: true,
      });
    } catch {
      // ignore permission errors
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 animate-fade-in-up">
      <div className="relative w-full max-w-sm gradient-brand p-[1px] rounded-card animate-pop-in">
        <div className="bg-surface rounded-card p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full gradient-brand shadow-glow flex items-center justify-center">
            <Bell size={22} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-text">Stay inspired every day</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Get a weekly theme every Monday at 7am, plus a daily inspiration each morning at 7am to keep
            you motivated.
          </p>
          <div className="w-full flex items-center gap-2 bg-surface-2 border border-border rounded-card px-3 py-2.5 text-left">
            <Sparkles size={16} className="text-brand-light shrink-0" />
            <span className="text-xs text-text-muted">You can change this anytime in Notification Settings.</span>
          </div>
          <div className="flex gap-2 w-full mt-1">
            <button
              onClick={onClose}
              className="flex-1 text-sm font-semibold text-text-muted border border-border rounded-pill py-2.5"
            >
              Not Now
            </button>
            <button
              onClick={handleEnable}
              className="flex-1 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow"
            >
              Enable Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
