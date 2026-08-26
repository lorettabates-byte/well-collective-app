import { useState, useEffect, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";

const WORDS = [
  "SLEEP","PEACE","VITAL","BLOOM","FOCUS","GRACE","ALIGN","RENEW","WHOLE","LIGHT",
  "TRUST","POWER","HEART","RELAX","WATER","AWARE","CLEAR","EARTH","FRESH","STILL",
  "BRAVE","INNER","ROOTS","SPARK","STRONG","CALM","SMILE","DANCE","BREATHE","FLOW",
].filter(w => w.length === 5);

function todayWord(): string {
  const start = new Date("2024-01-01").getTime();
  const day = Math.floor((Date.now() - start) / 86400000);
  return WORDS[day % WORDS.length];
}

type CellState = "empty" | "typing" | "correct" | "present" | "absent";
interface Cell { letter: string; state: CellState }
interface KeyState { [key: string]: "correct" | "present" | "absent" | undefined }

const ROWS = 6, COLS = 5;
const KEYBOARD = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

function makeGrid(): Cell[][] {
  return Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(null).map(() => ({ letter: "", state: "empty" as CellState }))
  );
}

function evalGuess(guess: string, answer: string): ("correct" | "present" | "absent")[] {
  const result: ("correct" | "present" | "absent")[] = Array(COLS).fill("absent");
  const answerArr = answer.split("");
  const used = Array(COLS).fill(false);
  for (let i = 0; i < COLS; i++) {
    if (guess[i] === answerArr[i]) { result[i] = "correct"; used[i] = true; }
  }
  for (let i = 0; i < COLS; i++) {
    if (result[i] === "correct") continue;
    const j = answerArr.findIndex((c, ci) => c === guess[i] && !used[ci]);
    if (j !== -1) { result[i] = "present"; used[j] = true; }
  }
  return result;
}

interface Props { onComplete: () => void; alreadyDone: boolean }

export default function WordWell({ onComplete, alreadyDone }: Props) {
  const answer = todayWord();
  const [grid, setGrid] = useState<Cell[][]>(makeGrid);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [keyStates, setKeyStates] = useState<KeyState>({});
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState("");

  const showMsg = (msg: string, dur = 2000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), dur);
  };

  const submitGuess = useCallback(() => {
    const guess = grid[currentRow].map(c => c.letter).join("");
    if (guess.length < COLS) {
      setShake(true); setTimeout(() => setShake(false), 500);
      showMsg("Need 5 letters"); return;
    }
    const states = evalGuess(guess, answer);
    setGrid(prev => prev.map((row, ri) =>
      ri === currentRow
        ? row.map((c, ci) => ({ ...c, state: states[ci] }))
        : row
    ));
    setKeyStates(prev => {
      const next = { ...prev };
      guess.split("").forEach((letter, i) => {
        const p = next[letter];
        const s = states[i];
        if (p !== "correct" && (s === "correct" || p !== "present")) next[letter] = s;
      });
      return next;
    });
    if (guess === answer) {
      setStatus("won");
      if (!alreadyDone) onComplete();
      showMsg(["Genius!", "Magnificent!", "Brilliant!", "Great!", "Good!", "Phew!"][currentRow] ?? "Nice!", 3000);
    } else if (currentRow === ROWS - 1) {
      setStatus("lost");
      showMsg(`The word was ${answer}`, 4000);
    } else {
      setCurrentRow(r => r + 1);
      setCurrentCol(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, currentRow, answer, alreadyDone, onComplete]);

  const pressKey = useCallback((key: string) => {
    if (status !== "playing") return;
    if (key === "ENTER") { submitGuess(); return; }
    if (key === "⌫" || key === "BACKSPACE") {
      if (currentCol === 0) return;
      setGrid(prev => prev.map((row, ri) =>
        ri === currentRow
          ? row.map((c, ci) => ci === currentCol - 1 ? { letter: "", state: "empty" as CellState } : c)
          : row
      ));
      setCurrentCol(c => c - 1);
      return;
    }
    if (!/^[A-Z]$/.test(key) || currentCol >= COLS) return;
    setGrid(prev => prev.map((row, ri) =>
      ri === currentRow
        ? row.map((c, ci) => ci === currentCol ? { letter: key, state: "typing" as CellState } : c)
        : row
    ));
    setCurrentCol(c => c + 1);
  }, [status, currentRow, currentCol, submitGuess]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => pressKey(e.key.toUpperCase());
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [pressKey]);

  const cellColor: Record<CellState, string> = {
    empty:   "bg-surface border-border",
    typing:  "bg-surface border-brand-blue",
    correct: "bg-emerald-700/80 border-emerald-600 text-white",
    present: "bg-amber-700/80 border-amber-600 text-white",
    absent:  "bg-surface-3 border-surface-3 text-text-dim",
  };
  const keyColor = (k: string) => {
    const s = keyStates[k];
    if (s === "correct") return "bg-emerald-700 text-white border-transparent";
    if (s === "present") return "bg-amber-700 text-white border-transparent";
    if (s === "absent")  return "bg-surface-3 text-text-dim border-transparent";
    return "bg-surface-2 text-text border border-border";
  };

  return (
    <div>
      <p className="text-[10px] text-text-dim text-center mb-3 uppercase tracking-widest">
        Guess the 5-letter wellness word
      </p>

      {/* Grid */}
      <div className="flex flex-col gap-1.5 mb-4">
        {grid.map((row, ri) => (
          <div key={ri} className={`flex gap-1.5 justify-center ${shake && ri === currentRow ? "animate-[shake_0.4s_ease]" : ""}`}>
            {row.map((cell, ci) => (
              <div key={ci} className={`w-11 h-11 border-2 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 ${cellColor[cell.state]}`}>
                {cell.letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Message */}
      <p className={`text-center text-xs font-semibold mb-3 h-4 ${status === "won" ? "text-emerald-400" : status === "lost" ? "text-red-400" : "text-text-muted"}`}>
        {message}
      </p>

      {/* Keyboard */}
      <div className="flex flex-col gap-1.5">
        {KEYBOARD.map((row, ri) => (
          <div key={ri} className="flex gap-1 justify-center">
            {row.map(key => (
              <button
                key={key}
                onPointerDown={e => { e.preventDefault(); pressKey(key); }}
                className={`h-10 rounded-md text-[11px] font-bold transition-all select-none ${key.length > 1 ? "px-2 min-w-[40px]" : "min-w-[26px]"} ${keyColor(key)}`}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {alreadyDone && status !== "won" && (
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 size={13} /> Points already earned today
        </div>
      )}
    </div>
  );
}
