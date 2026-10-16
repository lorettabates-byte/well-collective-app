import { Loader2, X } from "lucide-react";
import { createPortal } from "react-dom";
import WellCardEnvelope from "../cards/WellCardEnvelope";
import { WELCOME_OCCASION, resolveCard } from "../../data/greetingCards";
import "../cards/wellCard.css";

export interface ReceivedTribeCard {
  id: number;
  occasionId: string;
  /** Old cards (before 2026-10-16) only have styleId. */
  styleId: string;
  designId?: string | null;
  message: string;
  signature?: string | null;
  photo?: string | null;
  senderName: string;
  recipientName: string;
}

function firstName(name: string): string {
  return (name || "").trim().split(/\s+/)[0] || "";
}

export default function ReceivedCardModal({
  card,
  loading,
  onClose,
}: {
  card: ReceivedTribeCard | null;
  loading: boolean;
  onClose: () => void;
}) {
  const resolved = card ? resolveCard(card.occasionId, card.designId || card.styleId, !!card.photo) : null;
  const fromLoretta = resolved?.occasionId === WELCOME_OCCASION;
  const signature = card ? (card.signature?.trim() || firstName(card.senderName)) : "";

  return createPortal(
    <div className="fixed inset-0 z-[520] flex flex-col wc-root wc-backdrop" role="dialog" aria-label="Your card">
      <div
        className="flex items-center justify-between px-4 pb-3 shrink-0"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", borderBottom: "1px solid var(--wc-line)" }}
      >
        <div>
          <p className="text-[11px] uppercase" style={{ letterSpacing: ".3em", color: "var(--wc-sky)" }}>You got a card</p>
          <h2 style={{ fontFamily: "var(--wc-serif)", fontWeight: 500, fontSize: 26, margin: "2px 0 0" }}>
            {card ? `From ${card.senderName}` : "Opening your card..."}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ border: "1px solid rgba(255,255,255,.35)", background: "transparent", color: "#fff" }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
        <div className="mx-auto flex flex-col items-center justify-center gap-4 py-6 min-h-full" style={{ maxWidth: 980 }}>
          {loading ? (
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--wc-sky)" }} />
          ) : !card || !resolved ? (
            <p className="wc-note" style={{ fontSize: 15, textAlign: "center" }}>This card could not be opened.</p>
          ) : (
            <>
              <p className="wc-note" style={{ fontSize: 15, textAlign: "center" }}>
                Tap the WELL seal to open the envelope, then tap the card.
              </p>
              <WellCardEnvelope
                occasionId={resolved.occasionId}
                designId={resolved.designId}
                photo={card.photo}
                message={card.message}
                signature={signature}
                toLine={fromLoretta ? "For you, from Loretta" : "For you"}
              />
            </>
          )}
        </div>
      </div>

      {card && !loading && (
        <div
          className="px-4 pt-3 shrink-0 flex justify-center"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))", borderTop: "1px solid var(--wc-line)" }}
        >
          <button type="button" className="wc-btn wc-primary" onClick={onClose}>Close</button>
        </div>
      )}
    </div>,
    document.body
  );
}
