import { useState } from "react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import WordWell from "./WordWell";
import CalmFocus from "./CalmFocus";
import GratitudeMatch from "./GratitudeMatch";
import MindGardenPuzzle from "./MindGardenPuzzle";
import { logActivity } from "../../utils/wellCup";
import { useApp } from "../../store/AppContext";

const GAMES = [
  { id: "wordwell",   title: "WordWell",        tagline: "Guess the daily wellness word",       color: "#3b9eff", bg: "from-blue-900/40 to-indigo-900/30",   border: "border-blue-700/30" },
  { id: "calmfocus",  title: "Calm Focus",       tagline: "Memorize the symbol sequence",        color: "#f472b6", bg: "from-pink-900/30 to-purple-900/30",   border: "border-pink-700/30" },
  { id: "gratitude",  title: "Gratitude Match",  tagline: "Find pairs. Reflect on each gift.",   color: "#34d399", bg: "from-emerald-900/30 to-teal-900/30",  border: "border-emerald-700/30" },
  { id: "mindgarden", title: "Mind Garden",      tagline: "Slide tiles to reveal today's scene", color: "#fbbf24", bg: "from-amber-900/30 to-yellow-900/30", border: "border-amber-700/30" },
];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function todayGameIdx() {
  return Math.floor((Date.now() - new Date("2024-01-01").getTime()) / 86400000) % GAMES.length;
}

export default function BrainGameOfDay() {
  const { user } = useApp();
  const todayKey = todayISO();
  const game = GAMES[todayGameIdx()];

  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(() => {
    const raw = localStorage.getItem(`brain-game-done-${todayKey}`) ?? "";
    return new Set(raw ? raw.split(",") : []).has(game.id);
  });

  const markDone = async () => {
    if (done) return;
    setDone(true);
    const raw = localStorage.getItem(`brain-game-done-${todayKey}`) ?? "";
    const set = new Set(raw ? raw.split(",") : []);
    set.add(game.id);
    localStorage.setItem(`brain-game-done-${todayKey}`, [...set].join(","));
    if (user.email) {
      await logActivity(user.email, "brain_game", { game: game.id }).catch(() => {});
    }
  };

  const GameComponent = () => {
    const props = { onComplete: markDone, alreadyDone: done };
    if (game.id === "wordwell")   return <WordWell {...props} />;
    if (game.id === "calmfocus")  return <CalmFocus {...props} />;
    if (game.id === "gratitude")  return <GratitudeMatch {...props} />;
    if (game.id === "mindgarden") return <MindGardenPuzzle {...props} />;
    return null;
  };

  return (
    <div className="glass-card rounded-card p-4 mt-3 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <Brain size={14} className="text-brand-light shrink-0" />
        <span className="text-sm font-bold text-text">Brain Game of the Day</span>
        <span className="ml-auto text-[10px] font-semibold text-brand-light">+20 pts</span>
      </div>

      {/* Today's game card */}
      <div className={`rounded-card border overflow-hidden ${game.border} bg-gradient-to-r ${game.bg}`}>
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-3 text-left"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text">{game.title}</span>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ background: `${game.color}22`, color: game.color }}
              >
                Today
              </span>
              {done && <span className="text-[9px] font-semibold text-emerald-400 ml-auto">Done</span>}
            </div>
            <p className="text-[10px] text-text-dim mt-0.5">{game.tagline}</p>
          </div>
          {open ? <ChevronUp size={14} className="text-text-dim shrink-0" /> : <ChevronDown size={14} className="text-text-dim shrink-0" />}
        </button>

        {open && (
          <div className="px-3 pb-4 border-t border-white/5">
            <div className="mt-3">
              <GameComponent />
            </div>
          </div>
        )}
      </div>

      {/* See all link */}
      <Link
        to="/wellness?tab=activities#brain-games"
        className="flex items-center justify-center gap-1 mt-3 text-[11px] font-semibold text-text-dim hover:text-brand-light transition-colors"
      >
        See all 4 brain games
      </Link>
    </div>
  );
}
