import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { isValidWord } from "../../data/wordList";

const GRID_SIZE = 4;
const TIME_LIMIT = 120;
const WIN_WORDS = 6;

// Weighted English letter pool (common letters appear more)
const LETTER_POOL = "AAABBBCCDDDEEEEEEFFFGGGHHIIIIIJKLLLLMMMNNNNNOOOOOPPQRRRRRSSSSTTTTTUUUUVVWWXYYZ";

function todaySeed(): number {
  const start = new Date("2024-01-01").getTime();
  return Math.floor((Date.now() - start) / 86400000);
}

function seededRng(seed: number) {
  let s = (seed * 1664525 + 1013904223) & 0x7fffffff;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return (s >>> 0) / 0x7fffffff;
  };
}

const todayKey = () => new Date().toISOString().slice(0, 10);

function buildGrid(round = 0): string[][] {
  const rng = seededRng(todaySeed() * 13 + 5 + round * 7919);
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () =>
      LETTER_POOL[Math.floor(rng() * LETTER_POOL.length)]
    )
  );
}

function isAdjacent(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1 && (a[0] !== b[0] || a[1] !== b[1]);
}

function pathWord(path: [number, number][], grid: string[][]): string {
  return path.map(([r, c]) => grid[r][c]).join("");
}

const CELL_COLORS: Record<number, string> = {
  3: "#84D8FD",
  4: "#3b9eff",
  5: "#a78bfa",
  6: "#f472b6",
};
function wordColor(len: number): string {
  return CELL_COLORS[Math.min(len, 6)] ?? "#facc15";
}

interface Props { onComplete: (score?: number) => void; alreadyDone: boolean }

export default function WordHunt({ onComplete, alreadyDone }: Props) {
  const [round, setRound] = useState(() => Number(localStorage.getItem(`wordhunt-round-${todayKey()}`) ?? 0));
  const grid = useMemo(() => buildGrid(round), [round]);
  const [path, setPath] = useState<[number, number][]>([]);
  const [found, setFound] = useState<string[]>([]);
  const foundRef = useRef<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [status, setStatus] = useState<"playing" | "won" | "lost">(alreadyDone ? "won" : "playing");
  const [flash, setFlash] = useState<"valid" | "invalid" | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const dragging = useRef(false);
  const doneRef = useRef(alreadyDone);
  const cellRefs = useRef<(HTMLButtonElement | null)[][]>(
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    localStorage.setItem(`wordhunt-round-${todayKey()}`, String(round));
  }, [round]);

  useEffect(() => {
    if (status !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          const f = foundRef.current;
          if (f.length >= WIN_WORDS) {
            // already handled in trySubmit
          } else {
            setStatus("lost");
            if (!doneRef.current) {
              doneRef.current = true;
              const wordPts = f.reduce((sum, w) => sum + w.length * 4, 0);
              onComplete(wordPts > 0 ? wordPts : undefined);
            }
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, onComplete, resetKey]);

  const trySubmit = useCallback((p: [number, number][]) => {
    setPath([]);
    dragging.current = false;
    if (p.length < 3) return;
    const word = pathWord(p, grid).toUpperCase();
    if (found.includes(word)) {
      setFlash("invalid"); setTimeout(() => setFlash(null), 500);
      return;
    }
    if (isValidWord(word)) {
      const next = [...found, word];
      foundRef.current = next;
      setFound(next);
      setFlash("valid"); setTimeout(() => setFlash(null), 500);
      if (next.length >= WIN_WORDS) {
        clearInterval(timerRef.current!);
        setStatus("won");
        if (!doneRef.current) {
          doneRef.current = true;
          const wordPts = next.reduce((sum, w) => sum + w.length * 4, 0);
          const timePts = Math.floor(timeLeft / 8);
          onComplete(wordPts + timePts);
        }
      }
    } else {
      setFlash("invalid"); setTimeout(() => setFlash(null), 500);
    }
  }, [found, grid, onComplete, timeLeft]);

  const cellAt = (x: number, y: number): [number, number] | null => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const el = cellRefs.current[r][c];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return [r, c];
        }
      }
    }
    return null;
  };

  const extendPath = (r: number, c: number) => {
    setPath(prev => {
      const last = prev[prev.length - 1];
      const inPath = prev.some(([pr, pc]) => pr === r && pc === c);
      if (inPath) return prev;
      if (!last || isAdjacent(last, [r, c])) return [...prev, [r, c]];
      return prev;
    });
  };

  // Mouse events
  const onMouseDown = (r: number, c: number) => {
    if (status !== "playing") return;
    dragging.current = true;
    setPath([[r, c]]);
  };
  const onMouseEnter = (r: number, c: number) => {
    if (!dragging.current || status !== "playing") return;
    extendPath(r, c);
  };
  const onMouseUp = () => {
    if (!dragging.current) return;
    trySubmit(path);
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent, r: number, c: number) => {
    if (status !== "playing") return;
    e.preventDefault();
    dragging.current = true;
    setPath([[r, c]]);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || status !== "playing") return;
    e.preventDefault();
    const touch = e.touches[0];
    const cell = cellAt(touch.clientX, touch.clientY);
    if (cell) extendPath(cell[0], cell[1]);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    trySubmit(path);
  };

  const pathIdx = (r: number, c: number) => path.findIndex(([pr, pc]) => pr === r && pc === c);

  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft > 30 ? "#3b9eff" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col gap-3" onMouseUp={onMouseUp}>
      {/* Timer */}
      {status === "playing" && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${timerPct}%`, background: timerColor }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: timerColor, minWidth: "2.5rem", textAlign: "right" }}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
        </div>
      )}

      {/* Current path word */}
      <div className="flex items-center justify-center min-h-[32px] gap-1">
        {path.length > 0 ? (
          <span
            className="text-sm font-bold tracking-widest transition-colors"
            style={{ color: flash === "valid" ? "#34d399" : flash === "invalid" ? "#f87171" : "#F3F8FC" }}
          >
            {pathWord(path, grid).toUpperCase()}
          </span>
        ) : (
          <span className="text-[10px] text-text-dim">
            {status === "playing" ? "Draw through letters to make words" : ""}
          </span>
        )}
      </div>

      {/* Status */}
      {status === "won" && (
        <div className="text-center py-1">
          <p className="text-sm font-bold text-emerald-400">You found {found.length} words!</p>
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={() => { foundRef.current = []; setFound([]); setPath([]); setTimeLeft(TIME_LIMIT); setStatus("playing"); setFlash(null); doneRef.current = alreadyDone; }}
              className="text-[10px] text-text-dim py-1.5 px-3 rounded-lg border border-border"
            >
              Same grid
            </button>
            <button
              onClick={() => { setRound(r => r + 1); foundRef.current = []; setFound([]); setPath([]); setTimeLeft(TIME_LIMIT); setStatus("playing"); setFlash(null); doneRef.current = alreadyDone; }}
              className="text-[10px] text-text-dim py-1.5 px-3 rounded-lg border border-border"
            >
              New grid
            </button>
          </div>
        </div>
      )}
      {status === "lost" && (
        <div className="text-center py-1">
          <p className="text-sm font-bold text-amber-400">Time's up! {found.length} of {WIN_WORDS} words.</p>
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={() => { foundRef.current = []; setFound([]); setPath([]); setTimeLeft(TIME_LIMIT); setStatus("playing"); setFlash(null); doneRef.current = alreadyDone; }}
              className="text-[10px] text-text-dim py-1.5 px-3 rounded-lg border border-border"
            >
              Same grid
            </button>
            <button
              onClick={() => { setRound(r => r + 1); foundRef.current = []; setFound([]); setPath([]); setTimeLeft(TIME_LIMIT); setStatus("playing"); setFlash(null); doneRef.current = alreadyDone; }}
              className="text-[10px] text-text-dim py-1.5 px-3 rounded-lg border border-border"
            >
              New grid
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div
        className="mx-auto select-none"
        style={{ touchAction: "none" }}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {grid.map((row, r) => (
          <div key={r} className="flex gap-2 mb-2">
            {row.map((letter, c) => {
              const idx = pathIdx(r, c);
              const inP = idx !== -1;
              return (
                <button
                  key={c}
                  ref={el => { cellRefs.current[r][c] = el; }}
                  onMouseDown={() => onMouseDown(r, c)}
                  onMouseEnter={() => onMouseEnter(r, c)}
                  onTouchStart={e => onTouchStart(e, r, c)}
                  className={`w-14 h-14 rounded-2xl text-base font-bold transition-all duration-100 select-none
                    ${inP ? "scale-95 text-white" : "text-text border border-border"}
                    ${status !== "playing" ? "cursor-default" : "cursor-pointer"}
                  `}
                  style={{
                    background: inP
                      ? flash === "valid" ? "#34d399" : flash === "invalid" ? "#f87171" : "rgba(1,145,206,0.4)"
                      : "rgba(255,255,255,0.06)",
                    border: inP ? "1.5px solid rgba(1,145,206,0.6)" : undefined,
                    position: "relative",
                  }}
                  disabled={status !== "playing"}
                >
                  {letter}
                  {inP && (
                    <span
                      className="absolute top-1 right-1.5 text-[8px] font-bold opacity-70"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {idx + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Found words */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">Found</span>
        <span className="text-xs font-bold text-text">{found.length} / {WIN_WORDS}</span>
      </div>
      {found.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {found.map(w => (
            <span
              key={w}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                color: wordColor(w.length),
                background: `${wordColor(w.length)}18`,
                borderColor: `${wordColor(w.length)}40`,
              }}
            >
              {w} <span className="opacity-60">({w.length})</span>
            </span>
          ))}
        </div>
      )}

      <p className="text-center text-[9px] text-text-dim">
        Connect adjacent letters · 3+ letter words · {WIN_WORDS} words to win
      </p>

      {status === "playing" && (
        <button
          onClick={() => { setResetKey(k => k + 1); setRound(r => r + 1); foundRef.current = []; setFound([]); setPath([]); setTimeLeft(TIME_LIMIT); setFlash(null); }}
          className="mx-auto block text-[9px] text-text-dim opacity-50 hover:opacity-80 transition-opacity"
        >
          Try a different grid
        </button>
      )}
    </div>
  );
}
