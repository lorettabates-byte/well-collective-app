import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

const WORDS = [
  "SLEEP","PEACE","VITAL","BLOOM","FOCUS","GRACE","ALIGN","RENEW","WHOLE","LIGHT",
  "TRUST","POWER","HEART","RELAX","WATER","AWARE","CLEAR","EARTH","FRESH","STILL",
  "BRAVE","NOURM","THRIVE","INNER","GLOW","ROOTS","SPARK","FLUEM","STRONG","CALM",
  "WELL","RISE","GROUN","SMILE","DANCE","BREATHE","DEEP","HEAL","OPEN","FLOW",
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

function evalGuess(guess: string, answer: string): CellState[] {
  const result: CellState[] = Array(COLS).fill("absent");
  const answerArr = answer.split("");
  const used = Array(COLS).fill(false);
  // correct pass
  for (let i = 0; i < COLS; i++) {
    if (guess[i] === answerArr[i]) { result[i] = "correct"; used[i] = true; }
  }
  // present pass
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
  const [grid, setGrid] = useState<Cell[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill({ letter: "", state: "empty" as CellState }))
  );
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [keyStates, setKeyStates] = useState<KeyState>({});
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState("");

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  const submitGuess = useCallback(() => {
    const guess = grid[currentRow].map(c => c.letter).join("");
    if (guess.length < COLS) { setShake(true); setTimeout(() => setShake(false), 500); showMsg("Not enough letters"); return; }
    const states = evalGuess(guess, answer);
    const newGrid = grid.map((row, ri) =>
      ri === currentRow ? row.map((c, ci) => ({ ...c, state: states[ci] })) : row
    );
    setGrid(newGrid);
    const newKeys = { ...keyStates };
    guess.split("").forEach((letter, i) => {
      const prev = newKeys[letter];
      const next = states[i];
      if (prev === "correct") return;
      if (next === "correct" || prev !== "correct") newKeys[letter] = next;
    });
    setKeyStates(newKeys);
    if (guess === answer) {
      setStatus("won");
      if (!alreadyDone) onComplete();
      showMsg(["Genius!", "Magnificent!", "Brilliant!", "Great!", "Good!", "Phew!"][currentRow] ?? "Nice!");
    } else if (currentRow === ROWS - 1) {
      setStatus("lost");
      showMsg(`The word was ${answer}`);
    } else {
      setCurrentRow(r => r + 1);
      setCurrentCol(0);
    }
  }, [grid, currentRow, keyStates, answer, alreadyDone, onComplete]);

  const pressKey = useCallback((key: string) => {
    if (status !== "playing") return;
    if (key === "ENTER") { submitGuess(); return; }
    if (key === "⌫" || key === "BACKSPACE") {
      if (currentCol === 0) return;
      const newGrid = grid.map((row, ri) =>
        ri === currentRow ? row.map((c, ci) => ci === currentCol - 1 ? { letter: "", state: "empty" as CellState } : c) : row
      );
      setGrid(newGrid);
      setCurrentCol(c => c - 1);
      return;
    }
    if (!/^[A-Z]$/.test(key) || currentCol >= COLS) return;
    const newGrid = grid.map((row, ri) =>
      ri === currentRow ? row.map((c, ci) => ci === currentCol ? { letter: key, state: "typing" as CellState } : c) : row
    );
    setGrid(newGrid);
    setCurrentCol(c => c + 1);
  }, [status, currentRow, currentCol, grid, submitGuess]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => pressKey(e.key.toUpperCase());
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pressKey]);

  const cellColor: Record<CellState, string> = {
    empty: "bg-surface border-border",
    typing: "bg-surface border-brand-blue",
    correct: "bg-emerald-700 border-emerald-600",
    present: "bg-amber-700 border-amber-600",
    absent: "bg-surface-3 border-surface-3 text-text-dim",
  };
  const keyColor: Record<string, string> = {
    correct: "bg-emerald-700 text-white",
    present: "bg-amber-700 text-white",
    absent: "bg-surface-3 text-text-dim",
  };

  return (
    <div>
      {/* Grid */}
      <div className="flex flex-col gap-1.5 mb-4">
        {grid.map((row, ri) => (
          <div key={ri} className={`flex gap-1.5 justify-center ${shake && ri === currentRow ? "animate-[shake_0.4s_ease]" : ""}`}>
            {row.map((cell, ci) => (
              <div key={ci} className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-base font-bold text-text transition-all ${cellColor[cell.state]}`}>
                {cell.letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Message */}
      <div className={`text-center text-xs font-semibold mb-3 h-4 transition-all ${status === "won" ? "text-emerald-400" : status === "lost" ? "text-red-400" : "text-text-muted"}`}>
        {message}
      </div>

      {/* Keyboard */}
      <div className="flex flex-col gap-1.5">
        {KEYBOARD.map((row, ri) => (
          <div key={ri} className="flex gap-1 justify-center">
            {row.map(key => (
              <button
                key={key}
                onClick={() => pressKey(key)}
                className={`h-11 rounded-md text-[11px] font-bold transition-all ${key.length > 1 ? "px-2 min-w-[42px]" : "min-w-[28px]"} ${keyStates[key] ? keyColor[keyStates[key]!] : "bg-surface-2 text-text border border-border"}`}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {alreadyDone && (
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 size={13} /> Points already earned today
        </div>
      )}
    </div>
  );
}
