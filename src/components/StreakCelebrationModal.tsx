import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Flame, X } from "lucide-react";

interface StreakCelebrationModalProps {
  days: number;
  label: string;
  onClose: () => void;
}

export default function StreakCelebrationModal({ days, label, onClose }: StreakCelebrationModalProps) {
  useEffect(() => {
    // Bigger, two-burst celebration than the small per-completion confetti —
    // this only fires on a milestone, so it should feel like a bigger deal.
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
    const second = setTimeout(
      () => confetti({ particleCount: 80, spread: 110, origin: { y: 0.5 }, angle: 60 }),
      200
    );
    const dismiss = setTimeout(onClose, 4000);
    return () => {
      clearTimeout(second);
      clearTimeout(dismiss);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-6"
      onClick={onClose}
    >
      <div
        className="relative gradient-brand p-[2px] rounded-card shadow-glow max-w-xs w-full animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface rounded-card p-6 flex flex-col items-center text-center gap-3">
          <button
            onClick={onClose}
            aria-label="Dismiss"
            className="absolute top-3 right-3 text-text-dim"
          >
            <X size={16} />
          </button>
          <div className="w-14 h-14 rounded-full gradient-brand shadow-glow flex items-center justify-center">
            <Flame size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-text">{days}-Day Streak!</h2>
          <p className="text-sm text-text-muted">
            You've kept up your {label} streak for {days} days in a row. Keep it going!
          </p>
        </div>
      </div>
    </div>
  );
}
