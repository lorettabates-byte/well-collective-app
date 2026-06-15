import confetti from "canvas-confetti";
import { Check, Copy, Gift, Loader2, PartyPopper, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BIRTHDAY_STOREWIDE_POOL, BIRTHDAY_WELL_ESCAPE_POOL } from "../constants/birthdayCoupons";
import { playBirthdayChime } from "../utils/sound";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface ClaimState {
  status: "idle" | "loading" | "claimed" | "error";
  code?: string;
  error?: string;
  copied?: boolean;
}

function GiftOption({
  pool,
  title,
  subtitle,
  email,
}: {
  pool: string;
  title: string;
  subtitle: string;
  email?: string;
}) {
  const [state, setState] = useState<ClaimState>({ status: "idle" });

  const handleClaim = async () => {
    if (!API_URL || !email) {
      setState({ status: "error", error: "Unable to claim right now. Please try again later." });
      return;
    }

    setState({ status: "loading" });

    try {
      const res = await fetch(`${API_URL}/api/coupons/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({ status: "error", error: data.error || "Couldn't claim a code right now." });
        return;
      }

      setState({ status: "claimed", code: data.code });
    } catch {
      setState({ status: "error", error: "Couldn't reach the server. Please try again later." });
    }
  };

  const handleCopy = () => {
    if (!state.code) return;
    navigator.clipboard.writeText(state.code);
    setState((s) => ({ ...s, copied: true }));
    setTimeout(() => setState((s) => ({ ...s, copied: false })), 2000);
  };

  return (
    <div className="glass-card rounded-card p-4 text-left">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
          <Gift size={18} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text">{title}</p>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
      </div>

      {state.status === "idle" && (
        <button
          onClick={handleClaim}
          className="w-full mt-3 gradient-brand text-white text-xs font-semibold rounded-pill py-2.5 shadow-glow"
        >
          Get my code
        </button>
      )}

      {state.status === "loading" && (
        <div className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-text-muted py-2.5">
          <Loader2 size={14} className="animate-spin" />
          Generating your code...
        </div>
      )}

      {state.status === "claimed" && state.code && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 bg-surface-2 border border-border rounded-card px-3 py-2.5 text-center">
            <span className="text-sm font-bold tracking-widest text-brand-light">{state.code}</span>
          </div>
          <button
            onClick={handleCopy}
            aria-label="Copy code"
            className="w-10 h-10 shrink-0 rounded-card bg-surface-2 border border-border flex items-center justify-center text-text-muted"
          >
            {state.copied ? <Check size={16} className="text-brand-light" /> : <Copy size={16} />}
          </button>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-3">
          <p className="text-xs text-red-400 mb-2">{state.error}</p>
          <button
            onClick={handleClaim}
            className="w-full gradient-brand text-white text-xs font-semibold rounded-pill py-2.5 shadow-glow"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

export default function BirthdayModal({
  name,
  email,
  onClose,
}: {
  name: string;
  email?: string;
  onClose: () => void;
}) {
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
            The whole WELL Collective is celebrating you today. Pick a gift and we'll generate your code:
          </p>

          <div className="flex flex-col gap-3">
            <GiftOption
              pool={BIRTHDAY_WELL_ESCAPE_POOL}
              title="$100 off a WELL Escape"
              subtitle="Treat yourself to a retreat on us 🌿"
              email={email}
            />
            <GiftOption
              pool={BIRTHDAY_STOREWIDE_POOL}
              title="$10 off anything"
              subtitle="at lorettabates.com"
              email={email}
            />
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
