import { useState, useEffect, useRef } from "react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import WordWell from "./WordWell";
import CalmFocus from "./CalmFocus";
import GratitudeMatch from "./GratitudeMatch";
import MindGardenPuzzle from "./MindGardenPuzzle";
import { logActivity } from "../../utils/wellCup";
import { useApp } from "../../store/AppContext";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function todayGameIdx() {
  return Math.floor((Date.now() - new Date("2024-01-01").getTime()) / 86400000) % 4;
}

// ── Rich visual preview panels ──────────────────────────────────────────────

const WordWellPreview = () => {
  const rows = [
    [{ l: "B", s: "absent" }, { l: "R", s: "absent" }, { l: "E", s: "present" }, { l: "A", s: "absent" }, { l: "T", s: "absent" }],
    [{ l: "W", s: "correct" }, { l: "H", s: "absent" }, { l: "O", s: "absent" }, { l: "L", s: "correct" }, { l: "E", s: "correct" }],
    [{ l: "W", s: "correct" }, { l: "E", s: "correct" }, { l: "L", s: "correct" }, { l: "L", s: "correct" }, { l: "S", s: "" }],
  ];
  const colors: Record<string, string> = {
    correct: "#22c55e", present: "#eab308", absent: "#374151",
  };
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((cell, ci) => (
            <div
              key={ci}
              className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold text-white"
              style={{ background: cell.s ? colors[cell.s] ?? "#1f2937" : "#111827", border: `1px solid ${cell.s ? "transparent" : "#374151"}` }}
            >
              {cell.l}
            </div>
          ))}
        </div>
      ))}
      <p className="text-[9px] text-text-dim mt-1 uppercase tracking-widest">Guess the wellness word</p>
    </div>
  );
};

const CalmFocusPreview = () => {
  const symbols = [
    { label: "Lotus", color: "#f472b6", svg: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="w-5 h-5"><path d="M16 26C16 26 8 20 8 14a6 6 0 0 1 8-4.2A6 6 0 0 1 24 14c0 6-8 12-8 12Z"/></svg> },
    { label: "Wave",  color: "#38bdf8", svg: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" className="w-5 h-5"><path d="M4 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 4 2"/><path d="M4 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 4 2" opacity=".5"/></svg> },
    { label: "Star",  color: "#fb923c", svg: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="w-5 h-5"><path d="M16 5l2 8 8 1-6 5.5 2 8L16 23l-6 4.5 2-8L6 14l8-1Z"/></svg> },
    { label: "Leaf",  color: "#34d399", svg: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" className="w-5 h-5"><path d="M24 6s0 12-8 18c-5 3-10 2-10 2s1-7 6-11c6-4 12-9 12-9Z" strokeLinejoin="round"/><path d="M6 26l8-8" strokeWidth="1.4"/></svg> },
  ];
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="flex items-center gap-2 mb-1">
        {[0, 1, 3].map(i => (
          <div key={i} className="w-10 h-10 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all"
            style={{ borderColor: `${symbols[i].color}55`, background: `${symbols[i].color}18`, color: symbols[i].color }}>
            {symbols[i].svg}
          </div>
        ))}
        <div className="w-10 h-10 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
          <span className="text-[10px] text-text-dim font-semibold">?</span>
        </div>
      </div>
      <div className="flex gap-1.5">
        {symbols.map((s, i) => (
          <div key={i} className="w-10 h-10 rounded-xl border border-border bg-surface flex flex-col items-center justify-center gap-0.5" style={{ color: s.color }}>
            {s.svg}
            <span className="text-[7px] text-text-dim uppercase tracking-wide leading-none">{s.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-text-dim uppercase tracking-widest">Memorize the sequence</p>
    </div>
  );
};

const GratitudeMatchPreview = () => {
  const pairs = [
    { color: "#f472b6", matched: true,  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5"><path d="M12 21s-7-5-7-10a5 5 0 0 1 7-4.47A5 5 0 0 1 19 11c0 5-7 10-7 10Z"/></svg> },
    { color: "#fbbf24", matched: false, svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg> },
    { color: "#34d399", matched: true,  svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5"><path d="M17 7s0 10-5 14c-3 2-6 1-6 1s1-5 4-7 7-8 7-8Z" strokeLinejoin="round"/><path d="M3 22l6-6" strokeWidth="1.2"/></svg> },
    { color: "#38bdf8", matched: false, svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5"><circle cx="9" cy="10" r="3"/><circle cx="15" cy="10" r="3"/><path d="M4 20c0-3 2-4 5-4h6c3 0 5 1 5 4" opacity=".7"/></svg> },
    { color: "#a78bfa", matched: false, svg: null },
    { color: "#fb923c", matched: false, svg: null },
  ];
  const wellBack = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="20 9 192 270" className="w-5 h-7 opacity-45">
      <defs>
        <clipPath id="gmp-c1"><path d="M 0 1.351562 L 103 1.351562 L 103 263 L 0 263 Z"/></clipPath>
        <clipPath id="gmp-c2"><path d="M 52 63 L 131 63 L 131 268.351562 L 52 268.351562 Z"/></clipPath>
        <clipPath id="gmp-c3"><path d="M 102 117 L 169.679688 117 L 169.679688 257 L 102 257 Z"/></clipPath>
        <clipPath id="gmp-c4"><rect x="0" width="170" y="0" height="269"/></clipPath>
      </defs>
      <g transform="matrix(1,0,0,1,42,9)">
        <g clipPath="url(#gmp-c4)">
          <g clipPath="url(#gmp-c1)"><path fill="#00529c" d="M 84.976562 0.160156 C 100.363281 25.625 119.875 68.1875 74.523438 118.039062 C 24.457031 173.039062 22.847656 234.09375 51.957031 262.667969 C 0.0664062 242.242188 -21.699219 172.449219 29.441406 107.585938 C 73.613281 51.515625 83.046875 27.285156 84.976562 0.160156 Z"/></g>
          <g clipPath="url(#gmp-c2)"><path fill="#0091d0" d="M 113.761719 63.738281 C 115.855469 87.429688 110.011719 108.925781 84.28125 137.925781 C 31.53125 197.375 48.203125 281.105469 107.597656 266.527344 C 79.5625 256.234375 70.398438 203.109375 103.203125 165.910156 C 139.707031 124.363281 135.207031 94.5625 113.761719 63.738281 Z"/></g>
          <g clipPath="url(#gmp-c3)"><path fill="#85dbff" d="M 144.960938 117.664062 C 144.90625 133.425781 144.53125 148.273438 120.140625 174.109375 C 83.851562 212.597656 111.617188 269.261719 134.453125 253.875 C 158.09375 237.902344 167.636719 213.726562 169.082031 182.957031 C 170.53125 152.132812 144.960938 117.664062 144.960938 117.664062 Z"/></g>
        </g>
      </g>
    </svg>
  );
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="grid grid-cols-4 gap-1.5">
        {[...pairs, ...pairs].slice(0, 8).map((p, i) => (
          <div
            key={i}
            className="w-9 aspect-[3/4] rounded-lg border-2 flex flex-col items-center justify-center gap-0.5"
            style={{
              borderColor: p.matched ? `${p.color}40` : "#374151",
              background: p.matched ? `${p.color}18` : "#111827",
              color: p.matched ? p.color : "#6b7280",
            }}
          >
            {p.matched && p.svg ? p.svg : p.svg === null ? wellBack : wellBack}
          </div>
        ))}
      </div>
      <p className="text-[9px] text-text-dim uppercase tracking-widest">Match pairs, reflect on gratitude</p>
    </div>
  );
};

const MindGardenPreview = () => {
  const tileColors = ["#2dd4a0","#38bdf8","#fbbf24","#f472b6","#a78bfa","#34d399","#fb923c","#60a5fa"];
  const layout = [0, 1, 2, 3, null, 4, 5, 6, 7];
  const icons = [
    <svg key="leaf" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4"><path d="M14 4s0 7-5 11c-3 2-6 1-6 1s1-4 4-6c3-2 7-6 7-6Z" strokeLinejoin="round"/><path d="M3 16l4-4" strokeWidth="1.2"/></svg>,
    <svg key="wave" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4"><path d="M2 8c2-2 3-2 5 0s3 2 5 0 3-2 5 0"/><path d="M2 13c2-2 3-2 5 0s3 2 5 0 3-2 5 0" opacity=".5"/></svg>,
    <svg key="sun"  viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4"><circle cx="10" cy="10" r="3"/><line x1="10" y1="3" x2="10" y2="5"/><line x1="10" y1="15" x2="10" y2="17"/><line x1="3" y1="10" x2="5" y2="10"/><line x1="15" y1="10" x2="17" y2="10"/></svg>,
    <svg key="heart" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4"><path d="M10 17s-7-5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 17 8c0 4-7 9-7 9Z" strokeLinejoin="round"/></svg>,
    <svg key="star" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="w-4 h-4"><path d="M10 3l1.5 5 5 .7-3.7 3.5 1 5L10 15l-3.8 2.2 1-5L3.5 8.7l5-.7Z"/></svg>,
    <svg key="plant" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4"><path d="M10 18V10M10 10c-1-2-3-3-5-2M10 10c1-2 3-3 5-2"/></svg>,
    <svg key="flower" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4"><path d="M14 7a3 3 0 1 0-8 0c0 4 4 8 4 8s4-4 4-8Z"/><circle cx="10" cy="7" r="1.5" opacity=".5"/></svg>,
    <svg key="reeds" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4"><path d="M5 4c1 2 1 4 0 6M10 3c1 2 1 5 0 8M15 4c1 2 1 4 0 6"/><path d="M3 17c4-2 10-2 14 0" opacity=".5"/></svg>,
  ];
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="grid grid-cols-3 gap-1">
        {layout.map((val, pos) => (
          val === null
            ? <div key={pos} className="w-10 h-10 rounded-lg bg-surface/20 border border-border/20" />
            : (
              <div key={pos} className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${tileColors[val]}18`, border: `1.5px solid ${tileColors[val]}44`, color: tileColors[val] }}>
                {icons[val]}
              </div>
            )
        ))}
      </div>
      <p className="text-[9px] text-text-dim uppercase tracking-widest">Slide tiles to match the goal</p>
    </div>
  );
};

const GAMES = [
  { id: "wordwell",   title: "WordWell",       tagline: "Guess the daily wellness word", color: "#3b9eff", bg: "from-blue-900/40 to-indigo-900/30",   border: "border-blue-700/30",   Preview: WordWellPreview },
  { id: "calmfocus",  title: "Calm Focus",      tagline: "Memorize the symbol sequence",  color: "#f472b6", bg: "from-pink-900/30 to-purple-900/30",   border: "border-pink-700/30",   Preview: CalmFocusPreview },
  { id: "gratitude",  title: "Gratitude Match", tagline: "Find pairs. Reflect.",           color: "#34d399", bg: "from-emerald-900/30 to-teal-900/30",  border: "border-emerald-700/30", Preview: GratitudeMatchPreview },
  { id: "mindgarden", title: "Mind Garden",     tagline: "Slide tiles to complete the puzzle", color: "#fbbf24", bg: "from-amber-900/30 to-yellow-900/30", border: "border-amber-700/30",  Preview: MindGardenPreview },
];

export default function BrainGameOfDay() {
  const { user } = useApp();
  const todayKey = todayISO();
  const game = GAMES[todayGameIdx()];
  const Preview = game.Preview;

  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(() => {
    const raw = localStorage.getItem(`brain-game-done-${todayKey}`) ?? "";
    return new Set(raw ? raw.split(",") : []).has(game.id);
  });
  const [showPts, setShowPts] = useState(false);
  // Ref guard prevents confetti from double-firing or firing from stale closures
  const celebratedRef = useRef(false);

  // Stop confetti canvas when navigating away — canvas-confetti renders into
  // document.body and persists across React Router navigation without this.
  useEffect(() => {
    return () => { confetti.reset(); };
  }, []);

  const markDone = async () => {
    // Confetti fires every time you win
    confetti({ particleCount: 90, spread: 65, origin: { y: 0.7 }, colors: [game.color, "#84D8FD", "#FFFFFF", "#34d399"] });

    // Points and tracking only once per day — check after firing confetti
    const raw = localStorage.getItem(`brain-game-done-${todayKey}`) ?? "";
    const existingSet = new Set(raw ? raw.split(",") : []);
    if (existingSet.has(game.id) || celebratedRef.current) return;
    celebratedRef.current = true;
    const isFirstToday = existingSet.size === 0;
    setDone(true);
    existingSet.add(game.id);
    localStorage.setItem(`brain-game-done-${todayKey}`, [...existingSet].join(","));
    if (isFirstToday) {
      setShowPts(true);
      setTimeout(() => setShowPts(false), 2200);
    }
    if (user.email) {
      await logActivity(user.email, "brain_game", { game: game.id }).catch(() => {});
    }
  };

  const props = { onComplete: markDone, alreadyDone: done };

  return (
    <div className="glass-card rounded-card p-4 mt-3 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <Brain size={14} className="text-brand-light shrink-0" />
        <span className="text-sm font-bold text-text">Brain Game of the Day</span>
        <span className="ml-auto text-[10px] font-semibold text-brand-light">+20 pts</span>
      </div>

      {/* Rich game card */}
      <div className={`rounded-card border overflow-hidden ${game.border} bg-gradient-to-br ${game.bg} relative`}>
        {/* +20 pts floating animation on win */}
        {showPts && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            style={{ animation: "brainWinFloat 2.2s ease-out forwards" }}
          >
            <span className="text-2xl font-bold text-emerald-400 drop-shadow-lg" style={{ textShadow: "0 0 20px rgba(52,211,153,0.6)" }}>
              +20 pts
            </span>
          </div>
        )}
        {/* Preview panel — always visible */}
        {!open && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text">{game.title}</span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: `${game.color}22`, color: game.color }}
                  >
                    Today
                  </span>
                  {done && <span className="text-[9px] font-semibold text-emerald-400">Done</span>}
                </div>
                <p className="text-[10px] text-text-dim mt-0.5">{game.tagline}</p>
              </div>
            </div>
            <Preview />
          </div>
        )}

        {/* Expand/collapse button */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 border-t border-white/5 text-xs font-semibold"
          style={{ color: game.color }}
        >
          {open ? (
            <><ChevronUp size={13} /> Close game</>
          ) : (
            <><span>Play now</span> <ChevronDown size={13} /></>
          )}
        </button>

        {open && (
          <div className="px-3 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-text">{game.title}</span>
                {done && <span className="text-[9px] font-semibold text-emerald-400 ml-2">Done</span>}
              </div>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ background: `${game.color}22`, color: game.color }}
              >
                Today
              </span>
            </div>
            {/* Direct rendering — not through an inline function — preserves game state */}
            {game.id === "wordwell"   && <WordWell {...props} />}
            {game.id === "calmfocus"  && <CalmFocus {...props} />}
            {game.id === "gratitude"  && <GratitudeMatch {...props} />}
            {game.id === "mindgarden" && <MindGardenPuzzle {...props} />}
          </div>
        )}
      </div>

      {/* See all link */}
      <Link
        to="/wellness?tab=activities#brain-games"
        className="flex items-center justify-center gap-1 mt-3 text-[11px] font-semibold text-text-dim hover:text-brand-light transition-colors"
      >
        See all 6 brain games
      </Link>
    </div>
  );
}
