import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

const PAIRS = [
  { icon: "🌿", label: "Nature",     gratitude: "A walk in the fresh air" },
  { icon: "💙", label: "Connection", gratitude: "People who truly care about you" },
  { icon: "☀️", label: "Morning",    gratitude: "A new day full of possibility" },
  { icon: "🎶", label: "Music",      gratitude: "Songs that lift your spirit" },
  { icon: "🍃", label: "Rest",       gratitude: "Deep, peaceful sleep" },
  { icon: "✨", label: "Growth",     gratitude: "Who you are becoming" },
];

interface Card {
  id: number;
  pairIdx: number;
  icon: string;
  label: string;
  gratitude: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): Card[] {
  return shuffle(
    PAIRS.flatMap((p, pi) => [
      { id: pi * 2,     pairIdx: pi, icon: p.icon, label: p.label, gratitude: p.gratitude, flipped: false, matched: false },
      { id: pi * 2 + 1, pairIdx: pi, icon: p.icon, label: p.label, gratitude: p.gratitude, flipped: false, matched: false },
    ])
  );
}

interface Props { onComplete: () => void; alreadyDone: boolean }

export default function GratitudeMatch({ onComplete, alreadyDone }: Props) {
  const [cards, setCards] = useState<Card[]>(buildDeck);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (selected.length !== 2) return;
    const [a, b] = selected.map(id => cards.find(c => c.id === id)!);
    setMoves(m => m + 1);
    if (a.pairIdx === b.pairIdx) {
      setCards(cs => cs.map(c => c.id === a.id || c.id === b.id ? { ...c, matched: true } : c));
      setPrompt(`Reflect: "${a.gratitude}"`);
      setSelected([]);
      const matched = cards.filter(c => c.matched).length + 2;
      if (matched === cards.length) {
        setDone(true);
        if (!alreadyDone) onComplete();
      }
    } else {
      setTimeout(() => {
        setCards(cs => cs.map(c => c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c));
        setPrompt("");
        setSelected([]);
      }, 900);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const flip = (id: number) => {
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched || selected.length >= 2) return;
    setCards(cs => cs.map(c => c.id === id ? { ...c, flipped: true } : c));
    setSelected(s => [...s, id]);
  };

  const matched = cards.filter(c => c.matched).length / 2;

  return (
    <div>
      <div className="flex justify-between text-xs text-text-muted mb-3">
        <span>Pairs found: <b className="text-text">{matched} / {PAIRS.length}</b></span>
        <span>Moves: <b className="text-text">{moves}</b></span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className={`aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
              card.matched
                ? "border-emerald-600/40 bg-emerald-900/20 opacity-60"
                : card.flipped
                ? "border-brand-blue bg-surface-2"
                : "border-border bg-surface hover:border-brand-blue/50"
            }`}
          >
            {card.flipped || card.matched ? (
              <>
                <span className="text-xl leading-none">{card.icon}</span>
                <span className="text-[8px] text-text-muted leading-tight text-center px-0.5">{card.label}</span>
              </>
            ) : (
              <span className="text-lg text-border">✦</span>
            )}
          </button>
        ))}
      </div>

      <p className={`text-center text-xs italic min-h-[16px] transition-all ${prompt ? "text-brand-light" : "text-transparent"}`}>
        {prompt || "—"}
      </p>

      {done && (
        <div className="mt-3 rounded-xl bg-emerald-900/30 border border-emerald-600/40 p-3 text-center">
          <p className="text-sm font-bold text-emerald-400">All pairs found!</p>
          <p className="text-xs text-text-muted mt-0.5">+20 WELL Cup pts added</p>
        </div>
      )}

      {alreadyDone && !done && (
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 size={13} /> Points already earned today
        </div>
      )}

      <button
        onClick={() => { setCards(buildDeck()); setSelected([]); setMoves(0); setPrompt(""); setDone(false); }}
        className="mt-3 w-full text-[10px] text-text-dim py-1.5 rounded-lg border border-border"
      >
        New game
      </button>
    </div>
  );
}
