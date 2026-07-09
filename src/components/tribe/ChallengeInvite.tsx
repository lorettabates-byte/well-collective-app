import { Check, Dumbbell, Leaf, Salad, Wind, X, Zap } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { TRIBE_CHALLENGES } from "../../data/challenges";
import type { TribeChallenge } from "../../data/challenges";
import { useApp } from "../../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

const CATEGORY_ICONS: Record<TribeChallenge["category"], React.ReactNode> = {
  nutrition:    <Salad size={18} className="text-green-400" />,
  fitness:      <Dumbbell size={18} className="text-orange-400" />,
  mindfulness:  <Wind size={18} className="text-brand-light" />,
  wellness:     <Leaf size={18} className="text-teal-400" />,
};

const CATEGORY_COLORS: Record<TribeChallenge["category"], string> = {
  nutrition:   "bg-green-500/10 border-green-500/20",
  fitness:     "bg-orange-500/10 border-orange-500/20",
  mindfulness: "bg-brand-light/10 border-brand-light/20",
  wellness:    "bg-teal-500/10 border-teal-500/20",
};

interface Props {
  memberId: string;
  memberName: string;
  onClose: () => void;
}

export default function ChallengeInvite({ memberId, memberName, onClose }: Props) {
  const { user } = useApp();
  const [selected, setSelected] = useState<TribeChallenge | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!API_URL || !user.email || !selected) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/api/tribe/${memberId}/challenge-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, challengeId: selected.id, challengeTitle: selected.title }),
      });
      setSent(true);
      setTimeout(onClose, 1800);
    } catch {
      // no-op
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[500] flex flex-col">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl flex flex-col" style={{ maxHeight: "85dvh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-text">Invite to a Challenge</h2>
            <p className="text-xs text-text-muted">Pick one to start with {memberName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <X size={14} className="text-text-muted" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
          {TRIBE_CHALLENGES.map((challenge) => (
            <button
              key={challenge.id}
              onClick={() => setSelected(challenge)}
              className={`w-full text-left rounded-card border p-4 flex items-start gap-3 transition-colors ${
                selected?.id === challenge.id
                  ? "border-brand-light/40 bg-brand-light/5"
                  : `${CATEGORY_COLORS[challenge.category]} glass-card`
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${CATEGORY_COLORS[challenge.category]}`}>
                {CATEGORY_ICONS[challenge.category]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{challenge.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{challenge.description}</p>
                <span className="inline-block mt-1.5 text-[10px] font-bold text-text-dim uppercase tracking-wide">
                  {challenge.duration}
                </span>
              </div>
              {selected?.id === challenge.id && (
                <Zap size={16} className="text-brand-light shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* Sticky footer */}
        <div className="px-4 pt-3 pb-6 border-t border-border shrink-0" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}>
          {sent ? (
            <div className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-brand-light">
              <Check size={16} />
              Challenge invite sent to {memberName}!
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={!selected || sending}
              className="w-full gradient-brand text-white text-sm font-semibold rounded-pill py-3 disabled:opacity-40"
            >
              {sending ? "Sending…" : selected ? `Invite to ${selected.title}` : "Select a challenge above"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
