import { useState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";

// SVG wellness icons as inline components
const SYMBOLS = [
  {
    id: "lotus", label: "Lotus", color: "#f472b6",
    svg: <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M24 38C24 38 12 30 12 21C12 15 17 10 24 10C31 10 36 15 36 21C36 30 24 38 24 38Z"/><path d="M24 38C24 38 10 35 8 24C8 18 13 14 18 16C20 17 22 19 24 22" strokeLinejoin="round"/><path d="M24 38C24 38 38 35 40 24C40 18 35 14 30 16C28 17 26 19 24 22" strokeLinejoin="round"/><path d="M24 38V26" strokeLinecap="round"/><path d="M18 42C18 42 20 39 24 38C28 39 30 42 30 42" strokeLinecap="round"/></svg>,
  },
  {
    id: "sun", label: "Sun", color: "#fbbf24",
    svg: <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="24" cy="24" r="8"/><line x1="24" y1="8" x2="24" y2="12"/><line x1="24" y1="36" x2="24" y2="40"/><line x1="8" y1="24" x2="12" y2="24"/><line x1="36" y1="24" x2="40" y2="24"/><line x1="13.5" y1="13.5" x2="16.3" y2="16.3"/><line x1="31.7" y1="31.7" x2="34.5" y2="34.5"/><line x1="34.5" y1="13.5" x2="31.7" y2="16.3"/><line x1="16.3" y1="31.7" x2="13.5" y2="34.5"/></svg>,
  },
  {
    id: "moon", label: "Moon", color: "#a78bfa",
    svg: <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M30 10C22 10 16 16 16 24C16 32 22 38 30 38C32 38 34 37.5 36 36.5C32 36.5 28 33 28 24C28 18 31 13 36 10.5C34 10.2 32 10 30 10Z"/></svg>,
  },
  {
    id: "wave", label: "Wave", color: "#38bdf8",
    svg: <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><path strokeWidth="2.2" d="M6 20C9 17 12 17 15 20C18 23 21 23 24 20C27 17 30 17 33 20C36 23 39 23 42 20"/><path strokeWidth="2.2" d="M6 27C9 24 12 24 15 27C18 30 21 30 24 27C27 24 30 24 33 27C36 30 39 30 42 27"/><path strokeWidth="1.8" d="M14 34C16.5 32 19 32 21 34C23 36 25 36 27 34C29 32 31.5 32 34 34"/></svg>,
  },
  {
    id: "leaf", label: "Leaf", color: "#34d399",
    svg: <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round"><path strokeWidth="2.2" d="M36 10C36 10 36 28 24 36C16 41 8 38 8 38C8 38 10 28 18 22C26 16 36 10 36 10Z" strokeLinejoin="round"/><path strokeWidth="1.8" d="M8 38L20 26"/><path strokeWidth="1.5" d="M25 15L16 28" opacity="0.5"/><path strokeWidth="1.5" d="M31 20L22 32" opacity="0.5"/></svg>,
  },
  {
    id: "star", label: "Star", color: "#fb923c",
    svg: <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M24 8L26.5 20.5L39 18L29 27L36 38L24 32L12 38L19 27L9 18L21.5 20.5Z"/></svg>,
  },
];

const TOTAL_ROUNDS = 5;

interface Props { onComplete: () => void; alreadyDone: boolean }

export default function CalmFocus({ onComplete, alreadyDone }: Props) {
  const [round, setRound] = useState(0);
  const [seqLen, setSeqLen] = useState(3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSeq, setUserSeq] = useState<number[]>([]);
  const [phase, setPhase] = useState<"showing" | "input" | "done">("showing");
  const [showIdx, setShowIdx] = useState(-1);
  const [slotStates, setSlotStates] = useState<("idle" | "lit" | "correct" | "wrong")[]>([]);
  const [result, setResult] = useState("");
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRound = (len: number) => {
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 6));
    setSequence(seq);
    setUserSeq([]);
    setPhase("showing");
    setResult("");
    setSlotStates(Array(len).fill("idle"));
    let i = 0;
    const show = () => {
      setShowIdx(i);
      i++;
      if (i < len) timerRef.current = setTimeout(show, 850);
      else timerRef.current = setTimeout(() => { setPhase("input"); setShowIdx(-1); }, 700);
    };
    timerRef.current = setTimeout(show, 500);
  };

  useEffect(() => {
    startRound(3);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tap = (symIdx: number) => {
    if (phase !== "input") return;
    const pos = userSeq.length;
    const expected = sequence[pos];
    const newUser = [...userSeq, symIdx];
    setUserSeq(newUser);
    if (symIdx === expected) {
      const ns = [...slotStates];
      ns[pos] = "correct";
      setSlotStates(ns);
      if (newUser.length === sequence.length) {
        setPhase("showing"); // lock input immediately — prevents spurious wrong taps
        const newScore = score + sequence.length * 10;
        setScore(newScore);
        if (round + 1 >= TOTAL_ROUNDS) {
          setPhase("done");
          setResult("All 5 rounds complete!");
          if (!alreadyDone) onComplete();
        } else {
          setResult("Perfect!");
          timerRef.current = setTimeout(() => {
            const nr = round + 1;
            const nl = seqLen + 1;
            setRound(nr);
            setSeqLen(nl);
            startRound(nl);
          }, 900);
        }
      }
    } else {
      const ns = [...slotStates];
      ns[pos] = "wrong";
      setSlotStates(ns);
      setResult("Not quite — restarting round");
      timerRef.current = setTimeout(() => startRound(seqLen), 1000);
    }
  };

  const slotBg: Record<string, string> = {
    idle: "border-border bg-surface",
    lit: "border-brand-light bg-blue-900/40 shadow-[0_0_12px_rgba(132,216,253,0.25)]",
    correct: "border-emerald-500 bg-emerald-900/30",
    wrong: "border-red-500 bg-red-900/30",
  };

  return (
    <div>
      {/* Round indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-text-muted uppercase tracking-widest">Round {round + 1} of {TOTAL_ROUNDS}</span>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < round ? "bg-brand-blue" : i === round ? "bg-brand-light shadow-[0_0_5px_rgba(132,216,253,0.6)]" : "bg-border"}`} />
          ))}
        </div>
      </div>

      {/* Sequence display */}
      <div className="mb-3">
        <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2">{phase === "showing" ? "Memorize this sequence" : "Now tap each symbol in order"}</p>
        <div className="flex gap-2 justify-center">
          {sequence.map((si, i) => (
            <div key={i} className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${slotBg[slotStates[i] ?? "idle"]} ${showIdx === i ? slotBg.lit : ""}`}>
              {(phase === "showing" || slotStates[i] === "correct" || slotStates[i] === "wrong") && (
                <div className="w-9 h-9" style={{ color: SYMBOLS[si].color }}>
                  {SYMBOLS[si].svg}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      <p className={`text-center text-xs font-semibold mb-3 h-4 ${result.includes("Perfect") || result.includes("complete") ? "text-emerald-400" : result ? "text-red-400" : ""}`}>
        {result}
      </p>

      {/* Input grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {SYMBOLS.map((sym, i) => (
          <button
            key={sym.id}
            onClick={() => tap(i)}
            disabled={phase !== "input"}
            className={`h-16 rounded-xl border border-border bg-surface flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${phase === "input" ? "hover:bg-surface-2 hover:border-brand-blue" : "opacity-50"}`}
          >
            <div className="w-9 h-9" style={{ color: sym.color }}>{sym.svg}</div>
            <span className="text-[9px] text-text-dim uppercase tracking-wide">{sym.label}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
        <span className="text-[10px] text-text-dim">Score</span>
        <span className="text-sm font-bold text-brand-light">{score}</span>
      </div>

      {alreadyDone && (
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 size={13} /> Points already earned today
        </div>
      )}
    </div>
  );
}
