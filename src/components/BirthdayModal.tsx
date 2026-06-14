import confetti from "canvas-confetti";
import { Gift, PartyPopper, X } from "lucide-react";
import { useEffect } from "react";
import { playBirthdayChime } from "../utils/sound";

export default function BirthdayModal({ name, onClose }: { name: string; onClose: () => void }) {
  useEffect(() => {
    playBirthdayChime();

    const colors = ["#01519D", "#0191CE", "#84D8FD", "#ffffff"];
    const duration = 2500;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        startVelocity: 35,
        spread: 70,
        ticks: 100,
        origin: { x: Math.random(), y: 0 },
        colors,
        zIndex: 100,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 animate-fade-in-up">
      <div className="relative w-full max-w-sm gradient-brand p-[1px] rounded-card">
        <div className="bg-surface rounded-card p-6 text-center animate-pop-in">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted"
            aria-label="Close"
          >
            <X size={14} />
          </button>

          <div className="w-14 h-14 mx-auto rounded-full gradient-brand shadow-glow flex items-center justify-center mb-3">
            <PartyPopper size={26} className="text-white" />
          </div>

          <h2 className="text-xl font-bold text-text mb-1">Happy Birthday, {name.split(" ")[0]}! 🎂</h2>
          <p className="text-sm text-text-muted mb-5">
            The whole WELL Collective is celebrating you today. Here's a little something from us:
          </p>

          <div className="flex flex-col gap-3">
            <div className="glass-card rounded-card p-4 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Gift size={18} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-text">$100 off a WELL Escape</p>
                <p className="text-xs text-text-muted">Treat yourself to a retreat on us 🌿</p>
              </div>
            </div>
            <div className="glass-card rounded-card p-4 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Gift size={18} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-text">$10 off anything</p>
                <p className="text-xs text-text-muted">at lorettabates.com</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-5 gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow"
          >
            Thank you! 💙
          </button>
        </div>
      </div>
    </div>
  );
}
