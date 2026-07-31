import { ChevronDown, ChevronUp, Pencil, Target, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLeaderboard, fetchYesterdayWinner, type LeaderboardEntry } from "../utils/wellCup";
import { useApp } from "../store/AppContext";

const GOAL_PRESETS = [100, 200, 300, 500];
const GOAL_KEY = "well-cup-personal-goal";

function deriveMemberId(email: string): string {
  const lower = email.toLowerCase();
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = (hash << 5) - hash + lower.charCodeAt(i);
    hash |= 0;
  }
  return `m_${Math.abs(hash).toString(36)}`;
}

function Avatar({ name, avatar, size = 32 }: { name: string; avatar: string | null; size?: number }) {
  if (avatar) {
    return (
      <img src={avatar} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
    );
  }
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full bg-brand/20 border border-brand-light/30 flex items-center justify-center shrink-0 text-brand-light font-bold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function Countdown({ resetAt }: { resetAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = new Date(resetAt).getTime() - Date.now();
      if (ms <= 0) { setTimeLeft("Resetting…"); return; }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setTimeLeft(`Resets in ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [resetAt]);
  return <span className="text-[10px] text-text-dim">{timeLeft}</span>;
}

type ViewState = "top5" | "top10" | "all";

export default function WellCupLeaderboard() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [resetAt, setResetAt] = useState("");
  const [yesterday, setYesterday] = useState<{ name: string; avatar: string | null; total_points: number } | null>(null);
  const [view, setView] = useState<ViewState>("top5");
  const [loadingAll, setLoadingAll] = useState(false);
  const [loading, setLoading] = useState(true);

  // Personal goal
  const [personalGoal, setPersonalGoal] = useState<number>(() => {
    const saved = localStorage.getItem(GOAL_KEY);
    return saved ? parseInt(saved, 10) : 200;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([fetchLeaderboard(10), fetchYesterdayWinner()])
      .then(([lb, winner]) => {
        setAllEntries(lb.leaderboard);
        setResetAt(lb.resetAt);
        setYesterday(winner);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editingGoal) inputRef.current?.focus();
  }, [editingGoal]);

  const saveGoal = (val: number) => {
    if (val > 0) {
      setPersonalGoal(val);
      localStorage.setItem(GOAL_KEY, String(val));
    }
    setEditingGoal(false);
    setCustomInput("");
  };

  const expandToAll = async () => {
    setLoadingAll(true);
    const { leaderboard } = await fetchLeaderboard("all");
    setAllEntries(leaderboard);
    setView("all");
    setLoadingAll(false);
  };

  if (loading) return null;

  // Find the current user's entry on the leaderboard
  const myEntry = user.email ? allEntries.find((e) => e.email === user.email) : undefined;
  const myPoints = myEntry?.points ?? 0;
  const myRank = myEntry ? allEntries.indexOf(myEntry) + 1 : null;
  const goalPct = Math.min(100, Math.round((myPoints / personalGoal) * 100));
  const goalMet = myPoints >= personalGoal;

  const displayed = view === "top5" ? allEntries.slice(0, 5)
    : view === "top10" ? allEntries.slice(0, 10)
    : allEntries;

  const [first, ...rest] = displayed;

  return (
    <div className="glass-card rounded-card p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-yellow-400" />
          <h2 className="text-sm font-bold text-text">WELL Cup</h2>
        </div>
        {resetAt && <Countdown resetAt={resetAt} />}
      </div>

      {/* Personal daily goal */}
      <div className={`rounded-card px-3 py-2.5 mb-3 border ${goalMet ? "border-brand-light/50 bg-brand/10" : "border-border bg-surface-2"}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Target size={12} className={goalMet ? "text-brand-light" : "text-text-dim"} />
            <span className="text-[11px] font-bold text-text uppercase tracking-wide">Your Daily Goal</span>
          </div>
          <div className="flex items-center gap-2">
            {myRank && (
              <span className="text-[10px] text-text-dim">#{myRank} on board</span>
            )}
            <button
              onClick={() => setEditingGoal((v) => !v)}
              className="text-text-dim"
              aria-label="Edit goal"
            >
              {editingGoal ? <ChevronUp size={13} /> : <Pencil size={11} />}
            </button>
          </div>
        </div>

        {editingGoal ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              {GOAL_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => saveGoal(p)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${personalGoal === p ? "gradient-brand text-white border-transparent shadow-glow" : "bg-surface border-border text-text-muted"}`}
                >
                  {p} pts
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="number"
                min={10}
                max={9999}
                placeholder="Custom…"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveGoal(parseInt(customInput, 10));
                  if (e.key === "Escape") { setEditingGoal(false); setCustomInput(""); }
                }}
                className="flex-1 text-xs bg-surface border border-border rounded-pill px-3 py-1.5 text-text placeholder:text-text-dim outline-none focus:border-brand-light/50"
              />
              <button
                onClick={() => customInput ? saveGoal(parseInt(customInput, 10)) : setEditingGoal(false)}
                className="text-xs font-semibold text-brand-light"
              >
                Set
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-1">
              <span className={`text-base font-extrabold leading-none ${goalMet ? "text-brand-light" : "text-text"}`}>
                {myPoints} <span className="text-xs font-normal text-text-dim">/ {personalGoal} pts</span>
              </span>
              {goalMet && <span className="text-[10px] font-bold text-brand-light">Goal reached!</span>}
            </div>
            <div className="h-[5px] rounded-full bg-surface overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${goalMet ? "gradient-brand shadow-glow" : "gradient-brand"}`}
                style={{ width: `${goalPct}%` }}
              />
            </div>
            {!goalMet && myPoints > 0 && (
              <p className="text-[10px] text-text-dim mt-1">{personalGoal - myPoints} pts to go — keep logging!</p>
            )}
            {myPoints === 0 && (
              <p className="text-[10px] text-text-dim mt-1">Log a meal, class, or check-in to start earning.</p>
            )}
          </>
        )}
      </div>

      {yesterday && (
        <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-card px-3 py-2 mb-3">
          <Trophy size={12} className="text-yellow-400 shrink-0" />
          <Avatar name={yesterday.name} avatar={yesterday.avatar} size={22} />
          <p className="text-xs text-text-dim truncate flex-1 min-w-0">
            <span className="font-semibold text-yellow-400">{yesterday.name}</span>
            <span> held the Cup yesterday · {yesterday.total_points} pts</span>
          </p>
        </div>
      )}

      {allEntries.length === 0 ? (
        <div className="py-3 text-center">
          <p className="text-xs font-semibold text-text mb-1">No points logged yet today</p>
          <p className="text-[11px] text-text-muted">Open the app, log a meal, watch a class — every action earns points. Be the first on the board!</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {first && (
              <button
                onClick={() => navigate(`/member/${deriveMemberId(first.email)}`)}
                className="flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/30 rounded-card px-3 py-2.5 w-full text-left"
              >
                <div className="relative shrink-0">
                  <Avatar name={first.name} avatar={first.avatar} size={40} />
                  <span className="absolute -top-1 -right-1 text-base leading-none">🏆</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-yellow-300 truncate">{first.name}</p>
                  <p className="text-[10px] text-yellow-400/70">Holding the WELL Cup</p>
                </div>
                <span className="text-sm font-bold text-yellow-300 shrink-0">{first.points} pts</span>
              </button>
            )}

            {rest.map((entry, i) => (
              <button
                key={entry.email}
                onClick={() => navigate(`/member/${deriveMemberId(entry.email)}`)}
                className={`flex items-center gap-3 px-1 w-full text-left ${entry.email === user.email ? "opacity-100" : ""}`}
              >
                <span className="text-xs text-text-dim w-4 shrink-0 text-center">{i + 2}</span>
                <Avatar name={entry.name} avatar={entry.avatar} size={30} />
                <span className={`text-xs font-semibold flex-1 min-w-0 truncate ${entry.email === user.email ? "text-brand-light" : "text-text"}`}>
                  {entry.name}{entry.email === user.email ? " (you)" : ""}
                </span>
                <span className="text-xs font-bold text-brand-light shrink-0">{entry.points} pts</span>
              </button>
            ))}
          </div>

          {/* Progressive expand buttons */}
          <div className="flex flex-col items-center gap-1 mt-3">
            {view === "top5" && allEntries.length > 5 && (
              <button
                onClick={() => setView("top10")}
                className="flex items-center gap-1 text-xs text-brand-light font-semibold"
              >
                <ChevronDown size={13} />
                Show top 10
              </button>
            )}
            {(view === "top5" || view === "top10") && allEntries.length > 10 && (
              <button
                onClick={expandToAll}
                disabled={loadingAll}
                className="text-xs text-text-dim font-semibold disabled:opacity-50"
              >
                {loadingAll ? "Loading…" : "See everyone"}
              </button>
            )}
            {view === "all" && allEntries.length > 10 && (
              <button onClick={() => setView("top5")} className="text-xs text-text-dim font-semibold">
                Show less
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
