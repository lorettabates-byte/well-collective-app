import { useState } from "react";
import { BookOpen, Brain, ChevronDown, ChevronUp, Eye, Heart, LayoutGrid } from "lucide-react";
import WordWell from "./WordWell";
import CalmFocus from "./CalmFocus";
import GratitudeMatch from "./GratitudeMatch";
import MindGardenPuzzle from "./MindGardenPuzzle";
import { logActivity } from "../../utils/wellCup";
import { useApp } from "../../store/AppContext";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const GAMES = [
  {
    id: "wordwell",
    title: "WordWell",
    tagline: "Guess the daily 5-letter wellness word",
    color: "#3b9eff", bg: "from-blue-900/40 to-indigo-900/30", border: "border-blue-700/30",
    Icon: BookOpen,
  },
  {
    id: "calmfocus",
    title: "Calm Focus",
    tagline: "Memorize the symbol sequence. Stay present.",
    color: "#f472b6", bg: "from-pink-900/30 to-purple-900/30", border: "border-pink-700/30",
    Icon: Eye,
  },
  {
    id: "gratitude",
    title: "Gratitude Match",
    tagline: "Find pairs. Reflect on each gift.",
    color: "#34d399", bg: "from-emerald-900/30 to-teal-900/30", border: "border-emerald-700/30",
    Icon: Heart,
  },
  {
    id: "mindgarden",
    title: "Mind Garden",
    tagline: "Slide tiles to complete the garden.",
    color: "#fbbf24", bg: "from-amber-900/30 to-yellow-900/30", border: "border-amber-700/30",
    Icon: LayoutGrid,
  },
];

function todayGameIdx(): number {
  const start = new Date("2024-01-01").getTime();
  const day = Math.floor((Date.now() - start) / 86400000);
  return day % GAMES.length;
}

interface Props { initialOpen?: string }

export default function BrainGamesSection({ initialOpen }: Props) {
  const { user } = useApp();
  const todayKey = todayISO();
  const [openGame, setOpenGame] = useState<string | null>(initialOpen ?? null);
  const [doneTodaySet, setDoneTodaySet] = useState<Set<string>>(() => {
    const raw = localStorage.getItem(`brain-game-done-${todayKey}`) ?? "";
    return new Set(raw ? raw.split(",") : []);
  });

  const todayIdx = todayGameIdx();

  const markDone = async (gameId: string) => {
    if (doneTodaySet.has(gameId)) return;
    const newSet = new Set(doneTodaySet).add(gameId);
    setDoneTodaySet(newSet);
    localStorage.setItem(`brain-game-done-${todayKey}`, [...newSet].join(","));
    if (user.email) {
      await logActivity(user.email, "brain_game", { game: gameId }).catch(() => {});
    }
  };

  return (
    <div className="glass-card rounded-card p-4 mt-4" id="brain-games">
      <div className="flex items-center gap-2 mb-1 pb-2 border-b border-border">
        <Brain size={15} className="text-brand-light shrink-0" />
        <h3 className="text-sm font-bold text-text">Brain Games</h3>
        <span className="ml-auto text-[10px] text-text-dim">+20 pts per game · daily</span>
      </div>
      <p className="text-xs text-text-muted mb-3 mt-2">Daily mind challenges that sharpen focus, reduce stress, and earn WELL Cup points.</p>

      <div className="flex flex-col gap-2">
        {GAMES.map((game, i) => {
          const isToday = i === todayIdx;
          const isOpen = openGame === game.id;
          const done = doneTodaySet.has(game.id);
          const GameIcon = game.Icon;
          const props = { onComplete: () => markDone(game.id), alreadyDone: done };

          return (
            <div key={game.id} className={`rounded-card border overflow-hidden ${game.border} bg-gradient-to-r ${game.bg}`}>
              <button
                onClick={() => setOpenGame(isOpen ? null : game.id)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left"
              >
                <GameIcon size={14} style={{ color: game.color }} className="shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text">{game.title}</span>
                    {isToday && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${game.color}22`, color: game.color }}>
                        Today
                      </span>
                    )}
                    {done && (
                      <span className="text-[9px] font-semibold text-emerald-400 ml-auto">Done</span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-dim mt-0.5">{game.tagline}</p>
                </div>
                {isOpen ? <ChevronUp size={14} className="text-text-dim shrink-0" /> : <ChevronDown size={14} className="text-text-dim shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-3 pb-4 border-t border-white/5">
                  <div className="mt-3">
                    {/* Render game components directly — NOT via an inline function component.
                        Inline component definitions cause React to unmount/remount on every render,
                        losing all game state. Direct rendering keeps the component identity stable. */}
                    {game.id === "wordwell"   && <WordWell {...props} />}
                    {game.id === "calmfocus"  && <CalmFocus {...props} />}
                    {game.id === "gratitude"  && <GratitudeMatch {...props} />}
                    {game.id === "mindgarden" && <MindGardenPuzzle {...props} />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
