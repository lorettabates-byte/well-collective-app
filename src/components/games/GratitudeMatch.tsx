import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

const ALL_PAIRS = [
  { label: "Nature",      gratitude: "A walk in the fresh air" },
  { label: "Connection",  gratitude: "People who truly care about you" },
  { label: "Morning",     gratitude: "A new day full of possibility" },
  { label: "Music",       gratitude: "Songs that lift your spirit" },
  { label: "Rest",        gratitude: "Deep, peaceful sleep" },
  { label: "Growth",      gratitude: "Who you are becoming" },
  { label: "Kindness",    gratitude: "Small acts of kindness change everything" },
  { label: "Body",        gratitude: "The miracle of your body showing up for you" },
];

// SVG icons per pair — wellness-themed outlines
const PAIR_ICONS: React.FC<{ className?: string }>[] = [
  ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 28C16 28 6 21 6 14a7 7 0 0 1 10-6.32A7 7 0 0 1 26 14c0 7-10 14-10 14Z"/>
      <path d="M12 18c1-1.5 2.5-3 4-3s3 1.5 4 3" opacity=".5"/>
    </svg>
  ),
  ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="13" r="4"/><circle cx="21" cy="13" r="4"/>
      <path d="M5 27c0-4 3-6 6-6h10c3 0 6 2 6 6" opacity=".7"/>
    </svg>
  ),
  ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="16" cy="16" r="5"/>
      <line x1="16" y1="4" x2="16" y2="7"/><line x1="16" y1="25" x2="16" y2="28"/>
      <line x1="4" y1="16" x2="7" y2="16"/><line x1="25" y1="16" x2="28" y2="16"/>
      <line x1="7.8" y1="7.8" x2="9.9" y2="9.9"/><line x1="22.1" y1="22.1" x2="24.2" y2="24.2"/>
      <line x1="24.2" y1="7.8" x2="22.1" y2="9.9"/><line x1="9.9" y1="22.1" x2="7.8" y2="24.2"/>
    </svg>
  ),
  ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M9 18c0-3 2-5 3-8M16 26V14M23 18c0-3-2-5-3-8"/>
      <ellipse cx="16" cy="10" rx="6" ry="3"/>
      <path d="M10 26h12" strokeWidth="2"/>
    </svg>
  ),
  ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M16 4C10 4 6 8 6 14c0 4 2 8 10 14 8-6 10-10 10-14 0-6-4-10-10-10Z"/>
      <path d="M16 10v8M12 14h8" strokeWidth="1.4" opacity=".5"/>
    </svg>
  ),
  ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M16 6l2.5 5 5.5.8-4 3.9.9 5.4L16 18.5l-4.9 2.6.9-5.4L8 11.8l5.5-.8Z"/>
    </svg>
  ),
  ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M8 16s2-6 8-6 8 6 8 6-2 6-8 6-8-6-8-6Z"/>
      <circle cx="16" cy="16" r="2.5"/>
    </svg>
  ),
  ({ className }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 22c3-4 6-4 10-4s7 0 10 4"/>
      <path d="M6 17c3-4 6-4 10-4s7 0 10 4"/>
      <path d="M6 12c3-4 6-4 10-4s7 0 10 4"/>
    </svg>
  ),
];

// Real WELL logo (three-stroke flame mark) for card backs
const WellLogoBack = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="20 9 192 270" className="w-10 h-14 opacity-50">
    <defs>
      <clipPath id="wlb-c1"><path d="M 0 1.351562 L 103 1.351562 L 103 263 L 0 263 Z" clipRule="nonzero"/></clipPath>
      <clipPath id="wlb-c2"><path d="M 52 63 L 131 63 L 131 268.351562 L 52 268.351562 Z" clipRule="nonzero"/></clipPath>
      <clipPath id="wlb-c3"><path d="M 102 117 L 169.679688 117 L 169.679688 257 L 102 257 Z" clipRule="nonzero"/></clipPath>
      <clipPath id="wlb-c4"><rect x="0" width="170" y="0" height="269"/></clipPath>
    </defs>
    <g transform="matrix(1,0,0,1,42,9)">
      <g clipPath="url(#wlb-c4)">
        <g clipPath="url(#wlb-c1)">
          <path fill="#00529c" d="M 84.976562 0.160156 C 100.363281 25.625 119.875 68.1875 74.523438 118.039062 C 24.457031 173.039062 22.847656 234.09375 51.957031 262.667969 C 0.0664062 242.242188 -21.699219 172.449219 29.441406 107.585938 C 73.613281 51.515625 83.046875 27.285156 84.976562 0.160156 Z"/>
        </g>
        <g clipPath="url(#wlb-c2)">
          <path fill="#0091d0" d="M 113.761719 63.738281 C 115.855469 87.429688 110.011719 108.925781 84.28125 137.925781 C 31.53125 197.375 48.203125 281.105469 107.597656 266.527344 C 79.5625 256.234375 70.398438 203.109375 103.203125 165.910156 C 139.707031 124.363281 135.207031 94.5625 113.761719 63.738281 Z"/>
        </g>
        <g clipPath="url(#wlb-c3)">
          <path fill="#85dbff" d="M 144.960938 117.664062 C 144.90625 133.425781 144.53125 148.273438 120.140625 174.109375 C 83.851562 212.597656 111.617188 269.261719 134.453125 253.875 C 158.09375 237.902344 167.636719 213.726562 169.082031 182.957031 C 170.53125 152.132812 144.960938 117.664062 144.960938 117.664062 Z"/>
        </g>
      </g>
    </g>
  </svg>
);

interface Card {
  id: number; pairIdx: number;
  flipped: boolean; matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(pairCount: number): Card[] {
  return shuffle(
    Array.from({ length: pairCount }, (_, pi) => [
      { id: pi * 2,     pairIdx: pi, flipped: false, matched: false },
      { id: pi * 2 + 1, pairIdx: pi, flipped: false, matched: false },
    ]).flat()
  );
}

interface Props { onComplete: () => void; alreadyDone: boolean }

export default function GratitudeMatch({ onComplete, alreadyDone }: Props) {
  const [level, setLevel] = useState(1);
  const pairCount = level === 1 ? 6 : 8;
  const cols = pairCount === 6 ? 4 : 4;

  const [cards, setCards] = useState<Card[]>(() => buildDeck(6));
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [done, setDone] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(false);
  // IDs of cards in the brief "matched" celebration window — flipped but not yet hidden
  const [celebratingIds, setCelebratingIds] = useState<Set<number>>(new Set());

  // Start a new level
  const startLevel = (lvl: number) => {
    const pc = lvl === 1 ? 6 : 8;
    setCards(buildDeck(pc));
    setSelected([]);
    setMoves(0);
    setPrompt("");
    setDone(false);
    setLevel(lvl);
  };

  useEffect(() => {
    if (selected.length !== 2) return;
    const [a, b] = selected.map(id => cards.find(c => c.id === id)!);
    setMoves(m => m + 1);
    if (a.pairIdx === b.pairIdx) {
      // Show both cards flipped for 700ms before hiding them as matched
      setCelebratingIds(new Set([a.id, b.id]));
      setPrompt(ALL_PAIRS[a.pairIdx].gratitude);
      setSelected([]);
      setTimeout(() => {
        setCards(cs => cs.map(c => c.id === a.id || c.id === b.id ? { ...c, matched: true } : c));
        setCelebratingIds(new Set());
        const matchedCount = cards.filter(c => c.matched).length + 2;
        if (matchedCount === cards.length) {
          setDone(true);
          if (!alreadyDone && !pointsEarned) {
            onComplete();
            setPointsEarned(true);
          }
        }
      }, 700);
    } else {
      setTimeout(() => {
        setCards(cs => cs.map(c => c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c));
        setPrompt("");
        setSelected([]);
      }, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const flip = (id: number) => {
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched || selected.length >= 2 || celebratingIds.size > 0) return;
    setCards(cs => cs.map(c => c.id === id ? { ...c, flipped: true } : c));
    setSelected(s => [...s, id]);
  };

  const matchedPairs = cards.filter(c => c.matched).length / 2;
  const gridCols = cols === 4 ? "grid-cols-4" : "grid-cols-4";

  return (
    <div>
      <div className="flex justify-between text-xs text-text-muted mb-2">
        <span>Pairs found: <b className="text-text">{matchedPairs} / {pairCount}</b></span>
        <span className="text-[10px] text-brand-light font-semibold">Level {level}</span>
        <span>Moves: <b className="text-text">{moves}</b></span>
      </div>

      <div className={`grid ${gridCols} gap-2 mb-3`}>
        {cards.map(card => {
          const PairIcon = PAIR_ICONS[card.pairIdx];
          const pair = ALL_PAIRS[card.pairIdx];

          const isCelebrating = celebratingIds.has(card.id);

          if (card.matched) {
            // Invisible placeholder — keeps layout stable
            return <div key={card.id} className="aspect-[3/4]" />;
          }

          return (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              disabled={isCelebrating}
              className={`aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
                isCelebrating
                  ? "border-emerald-500 bg-emerald-900/30 shadow-[0_0_10px_rgba(52,211,153,0.35)]"
                  : card.flipped
                    ? "border-brand-blue bg-surface-2"
                    : "border-border/60 bg-surface hover:border-brand-blue/40"
              }`}
            >
              {(card.flipped || isCelebrating) ? (
                <>
                  <PairIcon className={`w-9 h-9 ${isCelebrating ? "text-emerald-400" : "text-brand-light"}`} />
                  <span className="text-[8px] text-text-muted leading-tight text-center px-0.5">{pair.label}</span>
                </>
              ) : (
                <WellLogoBack />
              )}
            </button>
          );
        })}
      </div>

      {/* Gratitude prompt */}
      {prompt ? (
        <p className="text-center text-[11px] italic text-brand-light min-h-[16px] mb-2">
          "{prompt}"
        </p>
      ) : (
        <div className="min-h-[16px] mb-2" />
      )}

      {done && (
        <div className="rounded-xl bg-emerald-900/30 border border-emerald-600/40 p-3 text-center">
          <p className="text-sm font-bold text-emerald-400">
            {level === 1 ? "Level 1 complete!" : "All pairs found!"}
          </p>
          {level === 1 ? (
            <button
              onClick={() => startLevel(2)}
              className="mt-2 text-xs font-semibold text-brand-light border border-brand-blue/40 rounded-full px-4 py-1"
            >
              Next level — 8 pairs
            </button>
          ) : (
            <p className="text-xs text-text-muted mt-0.5">+20 WELL Cup pts added</p>
          )}
        </div>
      )}

      {alreadyDone && !done && (
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 size={13} /> Points already earned today
        </div>
      )}

      <button
        onClick={() => startLevel(1)}
        className="mt-3 w-full text-[10px] text-text-dim py-1.5 rounded-lg border border-border"
      >
        New game
      </button>
    </div>
  );
}
