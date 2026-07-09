import { Award, Check, Feather, Gift, Heart, Sun, X, Zap } from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CARD_OCCASIONS } from "../../data/cards";
import type { CardOccasion, CardStyle } from "../../data/cards";
import { useApp } from "../../store/AppContext";

const CARD_ICONS: Record<string, ComponentType<LucideProps>> = {
  Gift, Heart, Sun, Feather, Zap, Award,
};

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

type Stage =
  | "sealed"   // envelope closed, card hidden
  | "opening"  // flap lifting up
  | "rising"   // card emerging from envelope
  | "viewing"  // card fully visible — interactive state
  | "sealing"  // send clicked: card descends back in
  | "closing"  // flap lowers
  | "flying"   // envelope shoots off screen
  | "done";    // success state

interface Props {
  memberId: string;
  memberName: string;
  defaultOccasion?: string;
  onClose: () => void;
}

/* ---------- sub-components ---------- */

function CardFace({ style, occasion, userName }: { style: CardStyle; occasion: CardOccasion; userName: string }) {
  const IconComponent = CARD_ICONS[occasion.icon];
  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl relative"
      style={{ background: style.bg, minHeight: 168 }}
    >
      {/* Top-right decorative circle */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
        style={{ background: "rgba(255,255,255,0.12)" }}
      />
      {/* Bottom-left decorative circle */}
      <div
        className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full"
        style={{ background: "rgba(0,0,0,0.08)" }}
      />
      {/* Large watermark icon */}
      {IconComponent && (
        <div className="absolute bottom-4 right-4 opacity-[0.13] pointer-events-none">
          <IconComponent size={56} strokeWidth={1.5} className="text-white" />
        </div>
      )}
      {/* Small accent dot cluster */}
      <div className="absolute top-4 left-5 flex gap-1 opacity-25">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-2 mb-3">
          {IconComponent && <IconComponent size={14} strokeWidth={2} className={`${style.textColor} opacity-70`} />}
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] opacity-55 ${style.textColor}`}>
            {occasion.label}
          </p>
        </div>
        <p className={`text-[18px] font-bold leading-snug mb-5 ${style.textColor}`}>
          {style.message}
        </p>
        <div className={`flex items-center gap-2 ${style.textColor}`}>
          <div className="h-px flex-1 bg-current opacity-20" />
          <p className="text-[11px] opacity-50">from {userName || "you"}</p>
        </div>
      </div>
    </div>
  );
}

function Envelope({ flapOpen, flapClosing, cardColor }: { flapOpen: boolean; flapClosing: boolean; cardColor: string }) {
  const flapTransform = flapOpen && !flapClosing ? "rotateX(-172deg)" : "rotateX(0deg)";
  return (
    <div className="relative w-full" style={{ height: 150, perspective: "700px" }}>
      {/* Envelope body */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-b-xl border border-white/10 overflow-hidden"
        style={{ height: 130, background: "#1a2744", zIndex: 2 }}
      >
        {/* Left flap fold */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: "50%",
            background: "#162035",
            clipPath: "polygon(0 0, 100% 50%, 0 100%)",
          }}
        />
        {/* Right flap fold */}
        <div
          className="absolute inset-y-0 right-0"
          style={{
            width: "50%",
            background: "#162035",
            clipPath: "polygon(100% 0, 0 50%, 100% 100%)",
          }}
        />
        {/* Bottom fold */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: "50%",
            background: "#111a30",
            clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
          }}
        />
        {/* Card color peek strip at top of envelope (visible when flap open) */}
        <div
          className="absolute inset-x-6 top-0 h-5 rounded-b-md transition-opacity duration-300"
          style={{ background: cardColor, opacity: flapOpen ? 0.5 : 0 }}
        />
      </div>

      {/* Envelope flap */}
      <div
        className="absolute inset-x-0 top-0 transition-transform ease-in-out"
        style={{
          height: 80,
          zIndex: flapOpen && !flapClosing ? 1 : 4,
          transformOrigin: "top center",
          transformStyle: "preserve-3d",
          transform: flapTransform,
          transitionDuration: flapClosing ? "500ms" : "600ms",
          background: "#1e3060",
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
        }}
      />
    </div>
  );
}

/* ---------- main component ---------- */

export default function CardSender({ memberId, memberName, defaultOccasion = "birthday", onClose }: Props) {
  const { user } = useApp();
  const [occasion, setOccasion] = useState<CardOccasion>(
    CARD_OCCASIONS.find((o) => o.id === defaultOccasion) ?? CARD_OCCASIONS[0]
  );
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>(occasion.styles[0]);
  const [stage, setStage] = useState<Stage>("sealed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (ms: number, fn: () => void) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };

  const playOpen = () => {
    clear();
    setStage("sealed");
    later(250, () => setStage("opening"));
    later(900, () => setStage("rising"));
    later(1550, () => setStage("viewing"));
  };

  useEffect(() => { playOpen(); return clear; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOccasionChange = (occ: CardOccasion) => {
    setOccasion(occ);
    setSelectedStyle(occ.styles[0]);
    playOpen();
  };

  const handleSend = async () => {
    if (stage !== "viewing" || !API_URL || !user.email) return;
    clear();
    setStage("sealing");
    later(600, () => setStage("closing"));
    later(1200, () => setStage("flying"));
    later(1900, () => setStage("done"));

    // Fire the API call without blocking the animation
    fetch(`${API_URL}/api/tribe/${memberId}/card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, occasionId: occasion.id, styleId: selectedStyle.id, message: selectedStyle.message }),
    }).catch(() => {/* no-op */});

    later(3500, onClose);
  };

  /* ---------- derived display state ---------- */
  const envelopeVisible = stage !== "done";
  const flapOpen = ["opening", "rising", "viewing", "sealing"].includes(stage);
  const flapClosing = stage === "closing" || stage === "flying";

  // Card y-offset relative to top of scene
  const cardY = (() => {
    if (stage === "sealed") return 110;
    if (stage === "opening") return 100;
    if (stage === "rising") return 20;
    if (stage === "viewing") return 0;
    if (stage === "sealing") return 70;
    return 110; // closing / flying / done: card hidden inside
  })();

  const cardOpacity = ["sealed", "closing", "flying", "done"].includes(stage) ? 0 : 1;
  const cardScale = stage === "viewing" ? 1 : 0.88;

  // Envelope exit: translate up when "flying"
  const envelopeExitY = stage === "flying" ? -500 : 0;
  const envelopeExitRotate = stage === "flying" ? -10 : 0;

  return createPortal(
    <div className="fixed inset-0 z-[500] flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={stage === "viewing" ? onClose : undefined} />

      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl flex flex-col" style={{ maxHeight: "92dvh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-text">Send a Card</h2>
            <p className="text-xs text-text-muted">to {memberName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <X size={14} className="text-text-muted" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-5">
          {/* Occasion tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {CARD_OCCASIONS.map((occ) => (
              <button
                key={occ.id}
                onClick={() => handleOccasionChange(occ)}
                disabled={stage !== "viewing" && stage !== "sealed"}
                className={`shrink-0 text-xs font-semibold rounded-pill px-3 py-1.5 border transition-all ${
                  occasion.id === occ.id ? "gradient-brand text-white border-transparent" : "glass-card border-border text-text-muted"
                }`}
              >
                {occ.label}
              </button>
            ))}
          </div>

          {/* Envelope + card animation scene */}
          {stage === "done" ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center shadow-glow">
                <Check size={28} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-text">Card Sent!</p>
                <p className="text-sm text-text-muted mt-1">Your card is on its way to {memberName}.</p>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden" style={{ height: 300 }}>
              {/* Card */}
              <div
                className="absolute left-4 right-4 transition-all ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  top: cardY,
                  opacity: cardOpacity,
                  transform: `scale(${cardScale})`,
                  transitionDuration: ["rising", "viewing"].includes(stage) ? "700ms" : "500ms",
                  zIndex: ["rising", "viewing"].includes(stage) ? 10 : 2,
                  transformOrigin: "center bottom",
                }}
              >
                <CardFace style={selectedStyle} occasion={occasion} userName={user.name} />
              </div>

              {/* Envelope */}
              {envelopeVisible && (
                <div
                  className="absolute left-4 right-4 transition-all ease-in-out"
                  style={{
                    top: 130,
                    zIndex: 5,
                    transform: `translateY(${envelopeExitY}px) rotate(${envelopeExitRotate}deg)`,
                    opacity: stage === "flying" ? 0 : 1,
                    transitionDuration: stage === "flying" ? "700ms" : "600ms",
                  }}
                >
                  <Envelope flapOpen={flapOpen} flapClosing={flapClosing} cardColor={selectedStyle.bg} />
                </div>
              )}
            </div>
          )}

          {/* Style picker */}
          {stage !== "done" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2.5">Card Style</p>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {occasion.styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => { if (stage === "viewing") setSelectedStyle(style); }}
                    className="shrink-0 flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-14 h-14 rounded-xl shadow-md transition-all duration-200"
                      style={{
                        background: style.bg,
                        outline: selectedStyle.id === style.id ? "2px solid rgba(1,145,206,0.8)" : "2px solid transparent",
                        outlineOffset: "2px",
                        opacity: selectedStyle.id === style.id ? 1 : 0.65,
                        transform: selectedStyle.id === style.id ? "scale(1.08)" : "scale(1)",
                      }}
                    />
                    <span className={`text-[10px] font-medium ${selectedStyle.id === style.id ? "text-text" : "text-text-dim"}`}>
                      {style.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky send footer */}
        {stage !== "done" && (
          <div className="px-4 pt-3 border-t border-border shrink-0" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}>
            <button
              onClick={handleSend}
              disabled={stage !== "viewing"}
              className="w-full gradient-brand text-white text-sm font-semibold rounded-pill py-3 disabled:opacity-40 transition-opacity"
            >
              {stage === "viewing" ? `Send to ${memberName}` : stage === "done" ? "Sent!" : "Opening card…"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
