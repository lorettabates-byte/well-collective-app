import { Mail, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const CLOSED_KEY = "well-unopened-card-closed";

interface UnopenedCard { id: number; occasionId: string; senderName: string; createdAt: string }

function firstName(name: string): string {
  return (name || "").trim().split(/\s+/)[0] || "a friend";
}

// "You have a card!" on Home for any card the member has not opened yet, so cards are
// found even when push notifications are off (Loretta, 2026-10-16). Closing it hides it
// until a newer card arrives; opening the card clears it for good.
export default function UnopenedCardBanner({ className = "" }: { className?: string }) {
  const { user } = useApp();
  const navigate = useNavigate();
  const [cards, setCards] = useState<UnopenedCard[]>([]);
  const [closedId, setClosedId] = useState<number>(() => {
    try { return Number(localStorage.getItem(CLOSED_KEY)) || 0; } catch { return 0; }
  });

  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/tribe/cards-unopened?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((d) => setCards((d.cards || []) as UnopenedCard[]))
      .catch(() => setCards([]));
  }, [user.email]);

  const newest = cards[0];
  if (!newest || newest.id <= closedId) return null;

  const close = () => {
    try { localStorage.setItem(CLOSED_KEY, String(newest.id)); } catch { /* hides for this visit */ }
    setClosedId(newest.id);
  };
  const others = cards.length - 1;

  return (
    <div className={`gradient-brand p-[1px] rounded-card animate-fade-in-up ${className}`}>
      <div className="bg-surface rounded-card p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full gradient-brand flex items-center justify-center shrink-0">
          <Mail size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text leading-snug">You have a card from {firstName(newest.senderName)}!</p>
          <p className="text-xs text-text-muted mt-0.5">
            {others > 0 ? `Plus ${others} more card${others > 1 ? "s" : ""} waiting for you.` : "Tap to open your envelope."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/tribe?card=${newest.id}`)}
          className="shrink-0 gradient-brand rounded-full px-4 py-2 text-sm font-bold text-white"
        >
          Open it
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="shrink-0 -mr-1 w-8 h-8 flex items-center justify-center rounded-full text-text-muted"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
