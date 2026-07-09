import { Award, Check, Feather, Gift, Heart, Sun, X, Zap } from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
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

/* ─── Card Graphic Illustrations ──────────────────────────────────────────── */

function BirthdayGraphic() {
  return (
    <svg viewBox="0 0 140 68" fill="none" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="35" cy="28" rx="16" ry="21" fill="white" fillOpacity="0.52"/>
      <ellipse cx="30" cy="19" rx="5" ry="7" fill="white" fillOpacity="0.18"/>
      <circle cx="35" cy="49" r="2.5" fill="white" fillOpacity="0.44"/>
      <path d="M35 51.5 Q33 59 41 64" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.32"/>
      <ellipse cx="70" cy="22" rx="20" ry="26" fill="white" fillOpacity="0.88"/>
      <ellipse cx="63" cy="13" rx="6" ry="9" fill="white" fillOpacity="0.18"/>
      <circle cx="70" cy="48" r="3" fill="white" fillOpacity="0.68"/>
      <path d="M70 51 L70 64" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.38"/>
      <ellipse cx="105" cy="30" rx="15" ry="20" fill="white" fillOpacity="0.52"/>
      <ellipse cx="100" cy="22" rx="4.5" ry="6" fill="white" fillOpacity="0.18"/>
      <circle cx="105" cy="50" r="2.5" fill="white" fillOpacity="0.44"/>
      <path d="M105 52.5 Q107 59 99 64" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.32"/>
      <path d="M41 64 Q70 68 99 64" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.28"/>
    </svg>
  );
}

function ThinkingGraphic() {
  return (
    <svg viewBox="0 0 140 68" fill="none" style={{ width: "100%", height: "100%" }}>
      <path d="M70 60 C50 50 4 40 4 20 C4 4 32 4 70 22 C108 4 136 4 136 20 C136 40 90 50 70 60 Z"
        fill="white" fillOpacity="0.80"/>
      <circle cx="14" cy="52" r="3.5" fill="white" fillOpacity="0.26"/>
      <circle cx="24" cy="63" r="2" fill="white" fillOpacity="0.20"/>
      <circle cx="126" cy="52" r="3.5" fill="white" fillOpacity="0.26"/>
      <circle cx="116" cy="63" r="2" fill="white" fillOpacity="0.20"/>
    </svg>
  );
}

function SayingHiGraphic() {
  const cx = 70, cy = 34;
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 - 90) * Math.PI / 180;
    const long = i % 2 === 0;
    return { x1: cx + Math.cos(a) * 20, y1: cy + Math.sin(a) * 20, x2: cx + Math.cos(a) * (long ? 38 : 28), y2: cy + Math.sin(a) * (long ? 38 : 28), long };
  });
  return (
    <svg viewBox="0 0 140 68" fill="none" style={{ width: "100%", height: "100%" }}>
      {rays.map((r, i) => (
        <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke="white" strokeWidth={r.long ? 3 : 1.8} strokeLinecap="round" strokeOpacity={r.long ? 0.72 : 0.48}/>
      ))}
      <circle cx={cx} cy={cy} r="17" fill="white" fillOpacity="0.88"/>
      <circle cx="63" cy="27" r="4.5" fill="white" fillOpacity="0.22"/>
    </svg>
  );
}

function CondolencesGraphic() {
  return (
    <svg viewBox="0 0 140 68" fill="none" style={{ width: "100%", height: "100%" }}>
      <path d="M70 68 Q52 52 28 42 Q15 36 10 22 Q26 26 44 40 Q58 50 70 68" fill="white" fillOpacity="0.40"/>
      <path d="M70 68 Q62 50 60 30 Q61 14 70 6 Q79 14 80 30 Q78 50 70 68" fill="white" fillOpacity="0.65"/>
      <path d="M70 68 Q88 52 112 42 Q125 36 130 22 Q114 26 96 40 Q82 50 70 68" fill="white" fillOpacity="0.40"/>
      <circle cx="70" cy="14" r="6" fill="white" fillOpacity="0.78"/>
      <circle cx="64" cy="20" r="5" fill="white" fillOpacity="0.56"/>
      <circle cx="76" cy="20" r="5" fill="white" fillOpacity="0.56"/>
      <circle cx="70" cy="6" r="5" fill="white" fillOpacity="0.56"/>
    </svg>
  );
}

function YouveGotThisGraphic() {
  return (
    <svg viewBox="0 0 140 68" fill="none" style={{ width: "100%", height: "100%" }}>
      <path d="M0 68 L55 26 L90 52 L125 18 L140 68 Z" fill="white" fillOpacity="0.22"/>
      <path d="M12 68 L70 8 L128 68 Z" fill="white" fillOpacity="0.58"/>
      <path d="M70 8 L57 34 L70 30 L83 34 Z" fill="white" fillOpacity="0.92"/>
      <path d="M70 1 L72.1 7.5 L79 7.5 L73.5 11.6 L75.6 18.1 L70 14 L64.4 18.1 L66.5 11.6 L61 7.5 L67.9 7.5 Z" fill="white" fillOpacity="0.96"/>
      <circle cx="22" cy="18" r="1.5" fill="white" fillOpacity="0.42"/>
      <circle cx="116" cy="14" r="1.5" fill="white" fillOpacity="0.42"/>
      <circle cx="38" cy="8" r="1" fill="white" fillOpacity="0.36"/>
      <circle cx="102" cy="7" r="1" fill="white" fillOpacity="0.36"/>
    </svg>
  );
}

function CongratsGraphic() {
  return (
    <svg viewBox="0 0 140 68" fill="none" style={{ width: "100%", height: "100%" }}>
      <line x1="70" y1="2" x2="70" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.48"/>
      <line x1="70" y1="54" x2="70" y2="66" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.48"/>
      <line x1="6" y1="34" x2="18" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.48"/>
      <line x1="122" y1="34" x2="134" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.48"/>
      <line x1="20" y1="8" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.38"/>
      <line x1="112" y1="8" x2="120" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.38"/>
      <line x1="20" y1="60" x2="28" y2="52" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.38"/>
      <line x1="112" y1="60" x2="120" y2="52" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.38"/>
      <path d="M26 22 L27.4 26 L31.5 26 L28.3 28.5 L29.6 32.5 L26 30 L22.4 32.5 L23.7 28.5 L20.5 26 L24.6 26 Z" fill="white" fillOpacity="0.42"/>
      <path d="M114 22 L115.4 26 L119.5 26 L116.3 28.5 L117.6 32.5 L114 30 L110.4 32.5 L111.7 28.5 L108.5 26 L112.6 26 Z" fill="white" fillOpacity="0.42"/>
      <path d="M26 46 L27.4 50 L31.5 50 L28.3 52.5 L29.6 56.5 L26 54 L22.4 56.5 L23.7 52.5 L20.5 50 L24.6 50 Z" fill="white" fillOpacity="0.32"/>
      <path d="M114 46 L115.4 50 L119.5 50 L116.3 52.5 L117.6 56.5 L114 54 L110.4 56.5 L111.7 52.5 L108.5 50 L112.6 50 Z" fill="white" fillOpacity="0.32"/>
      <path d="M70 10 L74.5 24.5 L90 24.5 L77.5 33.5 L82 48 L70 39 L58 48 L62.5 33.5 L50 24.5 L65.5 24.5 Z" fill="white" fillOpacity="0.88"/>
    </svg>
  );
}

const CARD_GRAPHICS: Record<string, ComponentType> = {
  birthday: BirthdayGraphic,
  "thinking-of-you": ThinkingGraphic,
  "just-saying-hi": SayingHiGraphic,
  condolences: CondolencesGraphic,
  "youve-got-this": YouveGotThisGraphic,
  congratulations: CongratsGraphic,
};

/* ---------- CardFace ---------- */
function CardFace({
  style,
  occasion,
  userName,
  animate,
}: {
  style: CardStyle;
  occasion: CardOccasion;
  userName: string;
  animate: boolean;
}) {
  const IconComponent = CARD_ICONS[occasion.icon];
  const GraphicComponent = CARD_GRAPHICS[occasion.id];
  const showConfetti = CONFETTI_OCCASIONS.has(occasion.id);

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
      {GraphicComponent && (
        <div className="relative z-10 mx-5 mt-5" style={{ height: 60 }}>
          <GraphicComponent />
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
          {style.message}
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
        <p className={`text-[10px] opacity-45 mt-0.5 ${style.textColor}`}>
          — from {userName || "you"}
        </p>
      </div>
    </div>
  );
}

/* ---------- Envelope ---------- */
function Envelope({
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
      {/* Body */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-b-xl border border-white/10 overflow-hidden"
        style={{ height: 130, background: "#1a2744", zIndex: 2 }}
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: "50%",
            background: "#162035",
            clipPath: "polygon(0 0, 100% 50%, 0 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0"
          style={{
            width: "50%",
            background: "#162035",
            clipPath: "polygon(100% 0, 0 50%, 100% 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: "50%",
            background: "#111a30",
            clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
          }}
        />
        <div
          className="absolute inset-x-6 top-0 h-5 rounded-b-md transition-opacity duration-300"
          style={{ background: cardColor, opacity: flapOpen ? 0.5 : 0 }}
        />
      </div>

      {/* Flap */}
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
                {stage === "viewing"
                  ? `Send to ${memberName}`
                  : stage === "done"
                  ? "Sent!"
                  : "Opening card…"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
