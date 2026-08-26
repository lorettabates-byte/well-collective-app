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

// WELL logo outline for card backs
const WellLogoBack = () => (
  <svg viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-5 opacity-30">
    <polyline points="2,4 7,20 12,8 17,20 22,4"/>
    <line x1="28" y1="4" x2="28" y2="20"/><line x1="28" y1="20" x2="38" y2="20"/>
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
      // matched — mark them, then trigger a gratitude prompt
      setCards(cs => cs.map(c => c.id === a.id || c.id === b.id ? { ...c, matched: true } : c));
      setPrompt(ALL_PAIRS[a.pairIdx].gratitude);
      setSelected([]);
      const matchedCount = cards.filter(c => c.matched).length + 2;
      if (matchedCount === cards.length) {
        setDone(true);
        if (!alreadyDone && !pointsEarned) {
          onComplete();
          setPointsEarned(true);
        }
      }
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
    if (!card || card.flipped || card.matched || selected.length >= 2) return;
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

          if (card.matched) {
            // Invisible placeholder — keeps layout stable
            return <div key={card.id} className="aspect-[3/4]" />;
          }

          return (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              className={`aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
                card.flipped
                  ? "border-brand-blue bg-surface-2"
                  : "border-border/60 bg-surface hover:border-brand-blue/40"
              }`}
            >
              {card.flipped ? (
                <>
                  <PairIcon className="w-7 h-7 text-brand-light" />
                  <span className="text-[7px] text-text-muted leading-tight text-center px-0.5">{pair.label}</span>
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
