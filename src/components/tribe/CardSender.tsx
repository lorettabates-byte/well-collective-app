import { Award, Check, Feather, Gift, Heart, Sun, X, Zap } from "lucide-react";
import type { LucideProps } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { createPortal } from "react-dom";
import { CARD_OCCASIONS } from "../../data/cards";
import type { CardOccasion, CardStyle } from "../../data/cards";
import { useApp } from "../../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

type Stage =
  | "sealed"
  | "opening"
  | "rising"
  | "viewing"
  | "sealing"
  | "closing"
  | "flying"
  | "done";

interface Props {
  memberId: string;
  memberName: string;
  defaultOccasion?: string;
  onClose: () => void;
}

const CARD_ICONS: Record<string, ComponentType<LucideProps>> = {
  Gift, Heart, Sun, Feather, Zap, Award,
};

/* Confetti dots for celebratory occasions */
const CONFETTI_COLORS = [
  "rgba(255,255,255,0.55)",
  "rgba(255,255,255,0.30)",
  "rgba(255,255,255,0.18)",
];
const CONFETTI_SEEDS = [
  { x: 82, y: 12, r: 4, c: 0 }, { x: 14, y: 22, r: 3, c: 1 },
  { x: 92, y: 38, r: 2, c: 2 }, { x: 6, y: 55, r: 3, c: 0 },
  { x: 75, y: 68, r: 4, c: 1 }, { x: 28, y: 80, r: 2, c: 2 },
  { x: 60, y: 8, r: 3, c: 0 },  { x: 42, y: 90, r: 4, c: 1 },
];

const CONFETTI_OCCASIONS = new Set(["birthday", "congratulations", "just-saying-hi"]);
const FLOWER_OCCASIONS = new Set(["thinking-of-you", "condolences", "youve-got-this"]);

const CONFETTI_FALL = [
  { x: 10, delay: 0,   dur: 2.0, color: "#f43f5e", size: 6 },
  { x: 25, delay: 0.3, dur: 2.5, color: "#facc15", size: 8 },
  { x: 40, delay: 0.7, dur: 1.8, color: "#60a5fa", size: 5 },
  { x: 55, delay: 0.1, dur: 2.2, color: "#34d399", size: 7 },
  { x: 70, delay: 0.5, dur: 2.8, color: "#a78bfa", size: 6 },
  { x: 85, delay: 0.9, dur: 2.0, color: "#fb7185", size: 9 },
  { x: 15, delay: 1.2, dur: 2.3, color: "#fde68a", size: 6 },
  { x: 48, delay: 1.5, dur: 1.9, color: "#f97316", size: 7 },
  { x: 65, delay: 0.4, dur: 2.6, color: "#f43f5e", size: 5 },
  { x: 30, delay: 0.8, dur: 2.1, color: "#a78bfa", size: 8 },
];

const PETAL_FALL = [
  { x: 12, delay: 0,   dur: 2.8, color: "#fda4af" },
  { x: 28, delay: 0.4, dur: 3.2, color: "#f9a8d4" },
  { x: 45, delay: 0.8, dur: 2.5, color: "#d8b4fe" },
  { x: 62, delay: 0.2, dur: 3.0, color: "#fbcfe8" },
  { x: 78, delay: 0.6, dur: 2.7, color: "#c4b5fd" },
  { x: 20, delay: 1.0, dur: 3.4, color: "#fda4af" },
  { x: 55, delay: 1.4, dur: 2.9, color: "#f9a8d4" },
  { x: 88, delay: 0.3, dur: 2.6, color: "#d8b4fe" },
];

/* ─── Card Graphic Illustrations ──────────────────────────────────────────── */

const CARD_GRAPHICS: Record<string, string> = {
  "birthday/ocean":          "/card-icons/balloon-svgrepo-com.svg",
  "birthday/rose":           "/card-icons/birthday-cake-cake-svgrepo-com.svg",
  "birthday/midnight":       "/card-icons/birthday-cake-food-svgrepo-com.svg",
  "birthday/citrus":         "/card-icons/hat-svgrepo-com.svg",
  "birthday/lavender":       "/card-icons/party-popper-svgrepo-com.svg",
  "birthday/emerald":        "/card-icons/confetti-svgrepo-com.svg",

  "thinking-of-you/blue-mist":    "/card-icons/flower-svgrepo-com.svg",
  "thinking-of-you/warm-sunrise": "/card-icons/flowers-bouquet-svgrepo-com.svg",
  "thinking-of-you/soft-mauve":   "/card-icons/garlands-garland-svgrepo-com.svg",
  "thinking-of-you/garden":       "/card-icons/leaves-svgrepo-com.svg",

  "just-saying-hi/sunny":   "/card-icons/musical-note-music-and-multimedia-svgrepo-com.svg",
  "just-saying-hi/teal":    "/card-icons/mobile-phone-notification-svgrepo-com.svg",
  "just-saying-hi/coral":   "/card-icons/photo-camera-photograph-svgrepo-com.svg",
  "just-saying-hi/skyblue": "/card-icons/shopping-bag-svgrepo-com.svg",

  "condolences/gentle-grey":  "/card-icons/candle-svgrepo-com.svg",
  "condolences/soft-indigo":  "/card-icons/bird-svgrepo-com.svg",
  "condolences/ivory":        "/card-icons/tree-svgrepo-com.svg",
  "condolences/misty-rose":   "/card-icons/bushes-of-leaves-svgrepo-com.svg",

  "youve-got-this/fire":     "/card-icons/suit-vip-svgrepo-com.svg",
  "youve-got-this/electric": "/card-icons/bow-tie-svgrepo-com.svg",
  "youve-got-this/bold-red": "/card-icons/karaoke-sing-svgrepo-com.svg",
  "youve-got-this/gold":     "/card-icons/wine-svgrepo-com.svg",

  "congratulations/champagne": "/card-icons/crown-svgrepo-com.svg",
  "congratulations/rainbow":   "/card-icons/fireworks-rocket-svgrepo-com.svg",
  "congratulations/royal":     "/card-icons/cheers-svgrepo-com.svg",
  "congratulations/starlight": "/card-icons/star-svgrepo-com.svg",
};

/* ---------- CardFace ---------- */
export function CardFace({
  style,
  occasion,
  userName,
  animate,
  messageOverride,
}: {
  style: CardStyle;
  occasion: CardOccasion;
  userName: string;
  animate: boolean;
  messageOverride?: string;
}) {
  const IconComponent = CARD_ICONS[occasion.icon];
  const graphicSrc = CARD_GRAPHICS[`${occasion.id}/${style.id}`] ?? CARD_GRAPHICS[occasion.id];
  const showConfetti = CONFETTI_OCCASIONS.has(occasion.id);
  const showFlowers = FLOWER_OCCASIONS.has(occasion.id);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl relative select-none"
      style={{ background: style.bg }}
    >
      {/* Scalloped border inset */}
      <div
        className="absolute inset-1.5 rounded-xl pointer-events-none"
        style={{ border: "1.5px dashed rgba(255,255,255,0.18)" }}
      />

      {/* Top-right large decorative circle */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: "rgba(255,255,255,0.10)" }}
      />
      {/* Bottom-left circle */}
      <div
        className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: "rgba(0,0,0,0.07)" }}
      />

      {/* Confetti dots */}
      {showConfetti && CONFETTI_SEEDS.map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.r * 2,
            height: dot.r * 2,
            background: CONFETTI_COLORS[dot.c],
          }}
        />
      ))}

      {/* Animated confetti — falls through card when viewed */}
      {animate && showConfetti && (
        <>
          <style>{`
            @keyframes confettiFall {
              0% { top: -5%; opacity: 1; transform: rotate(0deg); }
              100% { top: 110%; opacity: 0.4; transform: rotate(720deg) translateX(10px); }
            }
          `}</style>
          {CONFETTI_FALL.map((p, i) => (
            <div
              key={i}
              className="absolute pointer-events-none rounded-sm"
              style={{
                left: `${p.x}%`,
                width: p.size,
                height: p.size + 4,
                background: p.color,
                animation: `confettiFall ${p.dur}s ${p.delay}s ease-in infinite`,
                zIndex: 15,
              }}
            />
          ))}
        </>
      )}

      {/* Flower petals — fall through card for supportive occasions */}
      {animate && showFlowers && (
        <>
          <style>{`
            @keyframes petalFallCW {
              0% { top: -5%; opacity: 0.9; transform: rotate(0deg); }
              50% { opacity: 0.7; transform: rotate(180deg) translateX(-8px); }
              100% { top: 110%; opacity: 0; transform: rotate(360deg) translateX(4px); }
            }
            @keyframes petalFallCCW {
              0% { top: -5%; opacity: 0.9; transform: rotate(0deg); }
              50% { opacity: 0.7; transform: rotate(-180deg) translateX(8px); }
              100% { top: 110%; opacity: 0; transform: rotate(-360deg) translateX(-4px); }
            }
          `}</style>
          {PETAL_FALL.map((p, i) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: `${p.x}%`,
                width: 10,
                height: 18,
                background: p.color,
                borderRadius: "50% 50% 50% 0",
                animation: `${i % 2 === 0 ? "petalFallCW" : "petalFallCCW"} ${p.dur}s ${p.delay}s ease-in infinite`,
                zIndex: 15,
              }}
            />
          ))}
        </>
      )}

      {/* Animated watermark icon */}
      {IconComponent && (
        <div
          className="absolute bottom-4 right-4 pointer-events-none"
          style={{
            opacity: 0.10,
            animation: animate ? "cardIconFloat 3s ease-in-out infinite" : "none",
          }}
        >
          <IconComponent size={52} strokeWidth={1.2} className="text-white" />
        </div>
      )}

      {/* Graphic illustration */}
      {graphicSrc && (
        <div className="relative z-10 mx-5 mt-5" style={{ height: 60 }}>
          <img src={graphicSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 px-6 pb-5 pt-2 flex flex-col gap-2.5">
        {/* Occasion label row */}
        <div className="flex items-center gap-1.5">
          {IconComponent && (
            <IconComponent
              size={13}
              strokeWidth={2.2}
              className={`${style.textColor} opacity-65 shrink-0`}
            />
          )}
          <p
            className={`text-[9px] font-black uppercase tracking-[0.22em] opacity-55 ${style.textColor}`}
          >
            {occasion.label}
          </p>
        </div>

        {/* Main message */}
        <p className={`text-[18px] font-bold leading-snug ${style.textColor}`}>
          {messageOverride ?? style.message}
        </p>

        {/* Divider */}
        <div className={`flex items-center gap-3 ${style.textColor}`}>
          <div className="h-px flex-1 bg-current opacity-15" />
          <IconComponent size={10} strokeWidth={2} className="opacity-25 shrink-0" />
          <div className="h-px flex-1 bg-current opacity-15" />
        </div>

        {/* Inspirational quote */}
        <p
          className={`text-[11px] leading-relaxed ${style.textColor} opacity-70`}
          style={{ fontStyle: "italic" }}
        >
          {style.quote}
        </p>

        {/* From line */}
        <p className={`text-[13px] font-semibold opacity-70 mt-1 ${style.textColor}`}>
          — from {userName || "you"}
        </p>
      </div>
    </div>
  );
}

/* ---------- Envelope ---------- */
export function Envelope({
  flapOpen,
  flapClosing,
  cardColor,
}: {
  flapOpen: boolean;
  flapClosing: boolean;
  cardColor: string;
}) {
  const flapTransform =
    flapOpen && !flapClosing ? "rotateX(-172deg)" : "rotateX(0deg)";
  return (
    <div className="relative w-full" style={{ height: 150, perspective: "700px" }}>
      {/* Envelope body — cream paper with diagonal fold lines */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-b-xl overflow-hidden"
        style={{ height: 130, background: "#f5f0e8", border: "1px solid #c9bda6", zIndex: 2 }}
      >
        {/* Left diagonal fold triangle */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: "50%",
            background: "#ede7d8",
            clipPath: "polygon(0 0, 100% 50%, 0 100%)",
          }}
        />
        {/* Right diagonal fold triangle */}
        <div
          className="absolute inset-y-0 right-0"
          style={{
            width: "50%",
            background: "#ede7d8",
            clipPath: "polygon(100% 0, 0 50%, 100% 100%)",
          }}
        />
        {/* Bottom fold triangle */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: "50%",
            background: "#e8e1d2",
            clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
          }}
        />
        {/* Wax seal */}
        <div
          className="absolute flex items-center justify-center font-bold text-white"
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "radial-gradient(circle at 38% 35%, #e11d48, #9f1239)",
            border: "1.5px solid #be123c",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            letterSpacing: "0.04em",
            zIndex: 5,
            opacity: flapOpen && !flapClosing ? 0.4 : 1,
            transition: "opacity 0.3s",
          }}
        >
          W
        </div>
        {/* Card color peek at top when flap is open */}
        <div
          className="absolute inset-x-6 top-0 h-5 rounded-b-md transition-opacity duration-300"
          style={{ background: cardColor, opacity: flapOpen ? 0.5 : 0 }}
        />
      </div>

      {/* Flap — cream paper triangle */}
      <div
        className="absolute inset-x-0 top-0 transition-transform ease-in-out"
        style={{
          height: 80,
          zIndex: flapOpen && !flapClosing ? 1 : 4,
          transformOrigin: "top center",
          transformStyle: "preserve-3d",
          transform: flapTransform,
          transitionDuration: flapClosing ? "500ms" : "600ms",
          background: "#ece6d8",
          border: "1px solid #c9bda6",
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
        }}
      />
    </div>
  );
}

/* ---------- Main ---------- */
export default function CardSender({
  memberId,
  memberName,
  defaultOccasion = "birthday",
  onClose,
}: Props) {
  const { user } = useApp();
  const [occasion, setOccasion] = useState<CardOccasion>(
    CARD_OCCASIONS.find((o) => o.id === defaultOccasion) ?? CARD_OCCASIONS[0]
  );
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>(
    occasion.styles[0]
  );
  const [stage, setStage] = useState<Stage>("sealed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };

  const playOpen = () => {
    clear();
    setStage("sealed");
    later(250, () => setStage("opening"));
    later(900, () => setStage("rising"));
    later(1550, () => setStage("viewing"));
  };

  useEffect(() => {
    playOpen();
    return clear;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    fetch(`${API_URL}/api/tribe/${memberId}/card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        occasionId: occasion.id,
        styleId: selectedStyle.id,
        message: selectedStyle.message,
      }),
    }).catch(() => {});

    later(3500, onClose);
  };

  const envelopeVisible = stage !== "done";
  const flapOpen = ["opening", "rising", "viewing", "sealing"].includes(stage);
  const flapClosing = stage === "closing" || stage === "flying";

  const cardY = (() => {
    if (stage === "sealed") return 130;
    if (stage === "opening") return 120;
    if (stage === "rising") return 20;
    if (stage === "viewing") return 0;
    if (stage === "sealing") return 80;
    return 130;
  })();

  const cardOpacity = ["sealed", "closing", "flying", "done"].includes(stage) ? 0 : 1;
  const cardScale = stage === "viewing" ? 1 : 0.88;
  const envelopeExitY = stage === "flying" ? -500 : 0;
  const envelopeExitRotate = stage === "flying" ? -10 : 0;

  return createPortal(
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes cardIconFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(4deg); }
        }
        @keyframes cardShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div className="fixed inset-0 z-[500] flex flex-col">
        <div
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={stage === "viewing" ? onClose : undefined}
        />

        <div
          className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl flex flex-col"
          style={{ maxHeight: "94dvh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
            <div>
              <h2 className="text-sm font-bold text-text">Send a Card</h2>
              <p className="text-xs text-text-muted">to {memberName}</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center"
            >
              <X size={14} className="text-text-muted" />
            </button>
          </div>

          {/* Scrollable area */}
          <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-5">
            {/* Occasion tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
              {CARD_OCCASIONS.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => handleOccasionChange(occ)}
                  disabled={stage !== "viewing" && stage !== "sealed"}
                  className={`shrink-0 text-xs font-semibold rounded-pill px-3 py-1.5 border transition-all ${
                    occasion.id === occ.id
                      ? "gradient-brand text-white border-transparent"
                      : "glass-card border-border text-text-muted"
                  }`}
                >
                  {occ.label}
                </button>
              ))}
            </div>

            {/* Animation scene */}
            {stage === "done" ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center shadow-glow">
                  <Check size={28} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-text">Card Sent!</p>
                  <p className="text-sm text-text-muted mt-1">
                    Your card is on its way to {memberName}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden" style={{ height: 340 }}>
                {/* Card */}
                <div
                  className="absolute left-2 right-2 transition-all ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{
                    top: cardY,
                    opacity: cardOpacity,
                    transform: `scale(${cardScale})`,
                    transitionDuration: ["rising", "viewing"].includes(stage)
                      ? "700ms"
                      : "500ms",
                    zIndex: ["rising", "viewing"].includes(stage) ? 10 : 2,
                    transformOrigin: "center bottom",
                  }}
                >
                  <CardFace
                    style={selectedStyle}
                    occasion={occasion}
                    userName={user.name}
                    animate={stage === "viewing"}
                  />
                </div>

                {/* Envelope */}
                {envelopeVisible && (
                  <div
                    className="absolute left-4 right-4 transition-all ease-in-out"
                    style={{
                      top: 155,
                      zIndex: 5,
                      transform: `translateY(${envelopeExitY}px) rotate(${envelopeExitRotate}deg)`,
                      opacity: stage === "flying" ? 0 : 1,
                      transitionDuration:
                        stage === "flying" ? "700ms" : "600ms",
                    }}
                  >
                    <Envelope
                      flapOpen={flapOpen}
                      flapClosing={flapClosing}
                      cardColor={selectedStyle.bg}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Style picker */}
            {stage !== "done" && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2.5">
                  Card Style
                </p>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                  {occasion.styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        if (stage === "viewing") setSelectedStyle(style);
                      }}
                      className="shrink-0 flex flex-col items-center gap-1.5"
                    >
                      <div
                        className="w-14 h-14 rounded-xl shadow-md transition-all duration-200"
                        style={{
                          background: style.bg,
                          outline:
                            selectedStyle.id === style.id
                              ? "2.5px solid rgba(1,145,206,0.9)"
                              : "2px solid transparent",
                          outlineOffset: "2px",
                          opacity: selectedStyle.id === style.id ? 1 : 0.6,
                          transform:
                            selectedStyle.id === style.id
                              ? "scale(1.1)"
                              : "scale(1)",
                        }}
                      />
                      <span
                        className={`text-[10px] font-medium ${
                          selectedStyle.id === style.id
                            ? "text-text"
                            : "text-text-dim"
                        }`}
                      >
                        {style.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          {stage !== "done" && (
            <div
              className="px-4 pt-3 border-t border-border shrink-0"
              style={{
                paddingBottom:
                  "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))",
              }}
            >
              <button
                onClick={handleSend}
                disabled={stage !== "viewing"}
                className="w-full gradient-brand text-white text-sm font-semibold rounded-pill py-3 disabled:opacity-40 transition-opacity"
              >
                {stage === "viewing" ? `Send to ${memberName}` : "Opening card…"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
