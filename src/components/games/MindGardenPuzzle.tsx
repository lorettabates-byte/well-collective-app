import { useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";

// Elegant SVG tile icons — no emojis
type TileSVG = React.FC<{ className?: string; style?: React.CSSProperties }>;

const TILE_ICONS: TileSVG[] = [
  ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 6C22 6 22 20 14 26C8 30 4 28 4 28C4 28 6 21 12 17C18 13 22 6 22 6Z"/>
      <path d="M4 28L11 21"/><path d="M15 11L10 18" opacity=".4" strokeWidth="1.2"/>
      <path d="M19 15L14 21" opacity=".4" strokeWidth="1.2"/>
    </svg>
  ),
  ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 18C7 15 10 15 13 18C16 21 19 21 22 18C25 15 28 15 28 15"/>
      <path d="M4 23C7 20 10 20 13 23C16 26 19 26 22 23C25 20 28 20 28 20" opacity=".5"/>
      <path d="M8 13C10.5 11 13 11 15 13C17 15 19.5 15 22 13" opacity=".3"/>
    </svg>
  ),
  ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="16" cy="16" r="5"/>
      <line x1="16" y1="4" x2="16" y2="7"/><line x1="16" y1="25" x2="16" y2="28"/>
      <line x1="4" y1="16" x2="7" y2="16"/><line x1="25" y1="16" x2="28" y2="16"/>
      <line x1="7.8" y1="7.8" x2="9.9" y2="9.9"/><line x1="22.1" y1="22.1" x2="24.2" y2="24.2"/>
      <line x1="24.2" y1="7.8" x2="22.1" y2="9.9"/><line x1="9.9" y1="22.1" x2="7.8" y2="24.2"/>
    </svg>
  ),
  ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4C10 4 6 8 6 14c0 4 2 8 10 14 8-6 10-10 10-14 0-6-4-10-10-10Z"/>
      <path d="M16 10v8M12 14h8" strokeWidth="1.2" opacity=".5"/>
    </svg>
  ),
  ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 6l2.5 5.2 5.7.8-4.1 4 1 5.7L16 19l-5.1 2.7 1-5.7-4.1-4 5.7-.8Z"/>
    </svg>
  ),
  ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 6C16 10 14 14 14 18c0 3 1 5 2 8"/>
      <path d="M14 18c-2-2-5-3-8-2M14 18c2-2 5-3 8-2" opacity=".6"/>
      <ellipse cx="16" cy="8" rx="3.5" ry="2" opacity=".4"/>
    </svg>
  ),
  ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M22 10a6 6 0 1 0-12 0c0 6 6 12 6 12s6-6 6-12Z"/>
      <circle cx="16" cy="10" r="2.5" opacity=".5"/>
      <path d="M10 26h12" strokeWidth="1.4" opacity=".4"/>
      <path d="M16 22v4" opacity=".4"/>
    </svg>
  ),
  ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6c2 3 2 7 0 10M14 4c2 4 2 9 0 14M20 6c2 3 2 7 0 10M26 8c2 3 2 6 0 9"/>
      <path d="M4 26c6-4 18-4 24 0" opacity=".5"/>
    </svg>
  ),
];

const TILE_COLORS = [
  "#2dd4a0","#38bdf8","#fbbf24","#f472b6","#a78bfa","#34d399","#fb923c","#60a5fa",
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
  let empty = 8;
  for (let i = 0; i < 80; i++) {
    const adj = [empty - 3, empty + 3, empty - 1, empty + 1].filter(p => {
      if (p < 0 || p > 8) return false;
      if (empty % 3 === 0 && p === empty - 1) return false;
      if (empty % 3 === 2 && p === empty + 1) return false;
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

  const stars = moves === 0 ? 3 : moves < 25 ? 3 : moves < 45 ? 2 : 1;

  return (
    <div>
      {/* Goal preview + instructions */}
      <div className="flex items-start gap-3 mb-3">
        <div>
          <p className="text-[10px] text-text-dim mb-1 uppercase tracking-wider">Goal</p>
          <div className="grid grid-cols-3 gap-0.5 w-16">
            {[0,1,2,3,4,5,6,7].map(i => {
              const Icon = TILE_ICONS[i];
              return (
                <div key={i} className="w-5 h-5 rounded-sm flex items-center justify-center" style={{ background: `${TILE_COLORS[i]}22`, border: `1px solid ${TILE_COLORS[i]}44` }}>
                  <Icon className="w-3 h-3" style={{ color: TILE_COLORS[i] }} />
                </div>
              );
            })}
            <div className="w-5 h-5 rounded-sm bg-surface/30" />
          </div>
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-[10px] text-text-muted leading-relaxed">
            Tap any tile next to the empty space to slide it into place. Match the goal arrangement to win.
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            {[1,2,3].map(s => (
              <span key={s} className={`text-sm ${s <= stars ? "text-yellow-400" : "text-border"}`}>★</span>
            ))}
            <span className="text-[10px] text-text-dim ml-1">{moves} moves</span>
          </div>
        </div>
      </div>

      {/* Puzzle grid — touch-action: none prevents scroll conflict */}
      <div
        className="grid grid-cols-3 gap-1.5 mb-3 select-none"
        style={{ touchAction: "none" }}
      >
        {tiles.map((val, pos) => {
          if (val === 8) {
            return <div key={pos} className="aspect-square rounded-xl bg-surface/30 border border-border/20" />;
          }
          const Icon = TILE_ICONS[val];
          const color = TILE_COLORS[val];
          const movable = canMove(pos, emptyPos);
          return (
            <button
              key={pos}
              onPointerDown={e => { e.preventDefault(); move(pos); }}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-150 ${movable && !solved ? "active:scale-95" : "opacity-80"}`}
              style={{
                background: `${color}18`,
                border: `1.5px solid ${color}${movable && !solved ? "66" : "33"}`,
                boxShadow: movable && !solved ? `0 0 8px ${color}22` : "none",
              }}
            >
              <Icon className="w-8 h-8" style={{ color }} />
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onPointerDown={e => { e.preventDefault(); setTiles(makeSolvable()); setMoves(0); setSolved(false); }}
          className="text-[10px] text-brand-light border border-brand-blue/30 rounded-lg px-3 py-1"
        >
          Shuffle
        </button>
        {!solved && (
          <p className="text-[10px] text-text-dim italic">Slide tiles to match the goal</p>
        )}
      </div>

      {solved && (
        <div className="rounded-xl bg-emerald-900/30 border border-emerald-600/40 p-3 mt-3">
          <p className="text-sm font-bold text-emerald-400 text-center">Garden revealed! +20 WELL Cup pts</p>
          <p className="text-xs text-text-muted text-center mt-1 italic">
            "A garden, like your wellbeing, grows one small act at a time."
          </p>
        </div>
      )}

      {alreadyDone && !solved && (
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold">
          <CheckCircle2 size={13} /> Points already earned today
        </div>
      )}
    </div>
  );
}
