import { useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";

const TILES = [
  { bg: "from-emerald-800 to-teal-600",  symbol: "🌿" },
  { bg: "from-blue-800 to-cyan-600",     symbol: "🌊" },
  { bg: "from-purple-800 to-violet-600", symbol: "🌸" },
  { bg: "from-rose-800 to-pink-600",     symbol: "🌺" },
  { bg: "from-amber-800 to-yellow-600",  symbol: "🌻" },
  { bg: "from-green-800 to-lime-600",    symbol: "🍃" },
  { bg: "from-indigo-800 to-blue-600",   symbol: "🌙" },
  { bg: "from-pink-800 to-rose-600",     symbol: "🌷" },
];

function isSolved(tiles: number[]): boolean {
  return tiles.every((v, i) => v === i);
}

function canMove(pos: number, emptyPos: number): boolean {
  const r = Math.floor(pos / 3), c = pos % 3;
  const er = Math.floor(emptyPos / 3), ec = emptyPos % 3;
  return Math.abs(r - er) + Math.abs(c - ec) === 1;
}

function makeSolvable(): number[] {
  const tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  // Make some moves from solved state to guarantee solvability
  let empty = 8;
  for (let i = 0; i < 60; i++) {
    const adj = [empty - 3, empty + 3, empty - 1, empty + 1].filter(p => {
      if (p < 0 || p > 8) return false;
      if ((empty % 3 === 0 && p === empty - 1) || (empty % 3 === 2 && p === empty + 1)) return false;
      return true;
    });
    const next = adj[Math.floor(Math.random() * adj.length)];
    [tiles[empty], tiles[next]] = [tiles[next], tiles[empty]];
    empty = next;
  }
  return tiles;
}

interface Props { onComplete: () => void; alreadyDone: boolean }

export default function MindGardenPuzzle({ onComplete, alreadyDone }: Props) {
  const [tiles, setTiles] = useState<number[]>(makeSolvable);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const emptyPos = tiles.indexOf(8);

  const move = useCallback((pos: number) => {
    if (solved || !canMove(pos, emptyPos)) return;
    setTiles(prev => {
      const next = [...prev];
      [next[emptyPos], next[pos]] = [next[pos], next[emptyPos]];
      if (isSolved(next)) {
        setSolved(true);
        onComplete();
      }
      return next;
    });
    setMoves(m => m + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emptyPos, solved]);

  const stars = moves === 0 ? 3 : moves < 20 ? 3 : moves < 35 ? 2 : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-0.5">
          {[1, 2, 3].map(s => (
            <span key={s} className={`text-base ${s <= stars ? "text-yellow-400" : "text-border"}`}>★</span>
          ))}
        </div>
        <span className="text-xs text-text-muted">Moves: <b className="text-text">{moves}</b></span>
        <button
          onClick={() => { setTiles(makeSolvable()); setMoves(0); setSolved(false); }}
          className="text-[10px] text-brand-light border border-brand-blue/30 rounded-lg px-2.5 py-1"
        >
          Shuffle
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {tiles.map((val, pos) => {
          if (val === 8) {
            return <div key={pos} className="aspect-square rounded-xl bg-surface border border-border/30" />;
          }
          const tile = TILES[val];
          const movable = canMove(pos, emptyPos);
          return (
            <button
              key={pos}
              onClick={() => move(pos)}
              className={`aspect-square rounded-xl bg-gradient-to-br ${tile.bg} flex items-center justify-center text-3xl transition-all duration-150 ${movable && !solved ? "ring-2 ring-white/20 active:scale-95 cursor-pointer" : "cursor-default"}`}
            >
              {tile.symbol}
            </button>
          );
        })}
      </div>

      {solved ? (
        <div className="rounded-xl bg-emerald-900/30 border border-emerald-600/40 p-3">
          <p className="text-sm font-bold text-emerald-400 text-center">Garden revealed! +20 WELL Cup pts</p>
          <p className="text-xs text-text-muted text-center mt-1 italic">
            "A garden, like your wellbeing, grows one small act at a time."
          </p>
        </div>
      ) : (
        <p className="text-xs text-text-dim text-center">Slide tiles to complete the garden</p>
      )}

      {alreadyDone && !solved && (
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 size={13} /> Points already earned today
        </div>
      )}
    </div>
  );
}
