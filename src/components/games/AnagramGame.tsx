import { useState, useEffect, useCallback, useRef } from "react";
import { isValidWord, ANAGRAM_SEEDS } from "../../data/wordList";

// Seeded shuffle so the same seed always produces the same letter order.
function seededShuffle(arr: string[], seed: number): string[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todaySeed(): number {
  const start = new Date("2024-01-01").getTime();
  return Math.floor((Date.now() - start) / 86400000);
}

function lettersForRound(round: number): string[] {
  const seed = todaySeed();
  // Each round steps forward through the seeds so letters are genuinely different
  const word = ANAGRAM_SEEDS[(seed + round) % ANAGRAM_SEEDS.length];
  return seededShuffle(word.split(""), seed * 31 + 7 + round * 97);
}

// Can this word be formed from the available letter pool?
function canForm(word: string, letters: string[]): boolean {
  const pool = [...letters];
  for (const ch of word) {
    const idx = pool.indexOf(ch);
    if (idx === -1) return false;
    pool.splice(idx, 1);
  }
  return true;
}

const TIME_LIMIT = 90;
const WIN_WORDS = 5;

interface Props { onComplete: (score?: number) => void; alreadyDone: boolean }

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function AnagramGame({ onComplete, alreadyDone }: Props) {
  const [round, setRound] = useState(() => Number(localStorage.getItem(`anagram-round-${todayKey()}`) ?? 0));
  const letters = lettersForRound(round);
  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [status, setStatus] = useState<"playing" | "won" | "lost">(alreadyDone ? "won" : "playing");
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(alreadyDone);

  // Persist round so closing/reopening the accordion keeps the same letters
  useEffect(() => {
    localStorage.setItem(`anagram-round-${todayKey()}`, String(round));
  }, [round]);

  const showMsg = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(""), 1500);
  };

  useEffect(() => {
    if (status !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setStatus("lost");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const currentWord = selected.map(i => letters[i]).join("");

  const submit = useCallback(() => {
    const word = currentWord.toUpperCase();
    if (word.length < 3) { showMsg("Need 3+ letters"); return; }
    if (found.includes(word)) { showMsg("Already found!"); setSelected([]); return; }
    if (!canForm(word, letters.map(l => l.toUpperCase()))) { showMsg("Not those letters"); setSelected([]); return; }
    if (!isValidWord(word)) { showMsg("Not a word"); setSelected([]); return; }

    const next = [...found, word];
    setFound(next);
    setSelected([]);
    showMsg(`+${word.length > 4 ? "2" : "1"} point${word.length > 4 ? "s" : ""}!`);

    if (next.length >= WIN_WORDS && !doneRef.current) {
      doneRef.current = true;
      clearInterval(timerRef.current!);
      setStatus("won");
      // Score: each word = 10 pts + bonus for longer words + time bonus
      const wordPts = next.reduce((sum, w) => sum + (w.length > 4 ? 15 : 10), 0);
      const timePts = Math.floor(timeLeft / 6);
      onComplete(wordPts + timePts);
    }
  }, [currentWord, found, letters, onComplete]);

  const toggleLetter = (i: number) => {
    if (status !== "playing") return;
    setSelected(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const clear = () => setSelected([]);

  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft > 30 ? "#3b9eff" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col gap-3">
      {/* Timer bar */}
      {status === "playing" && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${timerPct}%`, background: timerColor }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: timerColor, minWidth: "2.5rem", textAlign: "right" }}>
            {timeLeft}s
          </span>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className="text-center text-xs font-bold text-brand-light animate-pulse">{message}</div>
      )}

      {/* Status */}
      {status === "won" && (
        <div className="text-center py-2">
          <p className="text-sm font-bold text-emerald-400">Nice work! {found.length} words found.</p>
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={() => {
                setFound([]); setSelected([]); setTimeLeft(TIME_LIMIT);
                setStatus("playing"); setMessage(""); doneRef.current = alreadyDone;
              }}
              className="text-[10px] text-text-dim py-1.5 px-3 rounded-lg border border-border"
            >
              Same letters
            </button>
            <button
              onClick={() => {
                setRound(r => r + 1); setFound([]); setSelected([]);
                setTimeLeft(TIME_LIMIT); setStatus("playing"); setMessage("");
                doneRef.current = alreadyDone;
              }}
              className="text-[10px] text-text-dim py-1.5 px-3 rounded-lg border border-border"
            >
              New letters
            </button>
          </div>
        </div>
      )}
      {status === "lost" && (
        <div className="text-center py-2">
          <p className="text-sm font-bold text-amber-400">
            {found.length > 0 ? `Time's up! ${found.length} of ${WIN_WORDS} words.` : "Time's up. Give it another go!"}
          </p>
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={() => {
                setFound([]); setSelected([]); setTimeLeft(TIME_LIMIT);
                setStatus("playing"); setMessage(""); doneRef.current = alreadyDone;
              }}
              className="text-[10px] text-text-dim py-1.5 px-3 rounded-lg border border-border"
            >
              Same letters
            </button>
            <button
              onClick={() => {
                setRound(r => r + 1); setFound([]); setSelected([]);
                setTimeLeft(TIME_LIMIT); setStatus("playing"); setMessage("");
                doneRef.current = alreadyDone;
              }}
              className="text-[10px] text-text-dim py-1.5 px-3 rounded-lg border border-border"
            >
              New letters
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">Words found</span>
        <span className="text-xs font-bold text-text">{found.length} / {WIN_WORDS}</span>
      </div>

      {/* Found words */}
      {found.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {found.map(w => (
            <span key={w} className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              {w}
            </span>
          ))}
        </div>
      )}

      {/* Current word display */}
      <div className="flex items-center justify-center gap-1 min-h-[40px]">
        {currentWord.length > 0 ? (
          currentWord.split("").map((ch, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-text border border-brand-light/40"
              style={{ background: "rgba(1,145,206,0.15)" }}
            >
              {ch}
            </div>
          ))
        ) : (
          <span className="text-[10px] text-text-dim">Tap letters to build a word</span>
        )}
      </div>

      {/* Letter tiles */}
      <div className="flex flex-wrap justify-center gap-2">
        {letters.map((ch, i) => {
          const isSelected = selected.includes(i);
          return (
            <button
              key={i}
              onClick={() => toggleLetter(i)}
              disabled={status !== "playing"}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all select-none
                ${isSelected
                  ? "scale-95 text-white border border-brand-light/80"
                  : "text-text border border-border hover:border-brand-light/40"}
                ${status !== "playing" ? "opacity-40" : ""}
              `}
              style={{
                background: isSelected ? "rgba(1,145,206,0.35)" : "rgba(255,255,255,0.05)",
              }}
            >
              {ch.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      {status === "playing" && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={clear}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted border border-border"
          >
            Clear
          </button>
          <button
            onClick={submit}
            disabled={currentWord.length < 3}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-brand disabled:opacity-40"
          >
            Submit
          </button>
        </div>
      )}

      <p className="text-center text-[9px] text-text-dim">
        Find {WIN_WORDS}+ words from these letters · {status === "playing" ? `${WIN_WORDS - found.length} more to win` : ""}
      </p>
    </div>
  );
}
