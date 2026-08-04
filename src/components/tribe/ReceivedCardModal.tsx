import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CARD_OCCASIONS } from "../../data/cards";
import { CardFace, Envelope } from "./CardSender";

type Stage = "sealed" | "opening" | "rising" | "viewing";

export interface ReceivedTribeCard {
  id: number;
  occasionId: string;
  styleId: string;
  message: string;
  senderName: string;
  recipientName: string;
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
  const [stage, setStage] = useState<Stage>("sealed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStage("sealed");
    if (!card) return;
    timers.current.push(setTimeout(() => setStage("opening"), 300));
    timers.current.push(setTimeout(() => setStage("rising"), 950));
    timers.current.push(setTimeout(() => setStage("viewing"), 1650));
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [card]);

  const occasion = CARD_OCCASIONS.find((item) => item.id === card?.occasionId) ?? CARD_OCCASIONS[0];
  const style = occasion.styles.find((item) => item.id === card?.styleId) ?? occasion.styles[0];
  const flapOpen = ["opening", "rising", "viewing"].includes(stage);
  const cardY = stage === "sealed" ? 130 : stage === "opening" ? 120 : stage === "rising" ? 20 : 0;
  const cardOpacity = stage === "sealed" ? 0 : 1;
  const cardScale = stage === "viewing" ? 1 : 0.88;

  return createPortal(
    <>
      <style>{`
        @keyframes cardIconFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(4deg); }
        }
      `}</style>
      <div className="fixed inset-0 z-[520] flex flex-col bg-surface">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <div>
            <h2 className="text-sm font-bold text-text">You Received a Card</h2>
            <p className="text-xs text-text-muted">{card ? `from ${card.senderName}` : "Opening your card..."}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <X size={14} className="text-text-muted" />
          </button>
        </div>

        {/* Full-screen animation area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {loading ? (
            <Loader2 size={28} className="text-brand-light animate-spin" />
          ) : !card ? (
            <p className="text-sm text-text-muted text-center">This card could not be opened.</p>
          ) : (
            <div className="w-full max-w-sm relative" style={{ height: 420 }}>
              <div
                className="absolute left-2 right-2 transition-all ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  top: cardY,
                  opacity: cardOpacity,
                  transform: `scale(${cardScale})`,
                  transitionDuration: ["rising", "viewing"].includes(stage) ? "700ms" : "500ms",
                  zIndex: ["rising", "viewing"].includes(stage) ? 10 : 2,
                  transformOrigin: "center bottom",
                }}
              >
                <CardFace
                  style={style}
                  occasion={occasion}
                  userName={card.senderName}
                  animate={stage === "viewing"}
                  messageOverride={card.message}
                />
              </div>

              <div className="absolute left-4 right-4 transition-all ease-in-out" style={{ top: 200, zIndex: 5 }}>
                <Envelope flapOpen={flapOpen} flapClosing={false} cardColor={style.bg} />
              </div>
            </div>
          )}
        </div>

        {/* Close button at bottom */}
        {stage === "viewing" && card && (
          <div
            className="px-6 pb-6 shrink-0"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={onClose}
              className="w-full gradient-brand text-white text-sm font-semibold rounded-pill py-3"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
