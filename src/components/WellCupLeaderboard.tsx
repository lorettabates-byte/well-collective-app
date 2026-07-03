import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchLeaderboard, fetchYesterdayWinner, type LeaderboardEntry } from "../utils/wellCup";

function Avatar({ name, avatar, size = 32 }: { name: string; avatar: string | null; size?: number }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

export default function WellCupLeaderboard() {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [resetAt, setResetAt] = useState("");
  const [yesterday, setYesterday] = useState<{ name: string; avatar: string | null; total_points: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLeaderboard(), fetchYesterdayWinner()])
      .then(([lb, winner]) => {
        setBoard(lb.leaderboard);
        setResetAt(lb.resetAt);
        setYesterday(winner);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (board.length === 0 && !yesterday) return null;

  const [first, ...rest] = board;

  return (
    <div className="glass-card rounded-card p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-yellow-400" />
          <h2 className="text-sm font-bold text-text">WELL Cup</h2>
        </div>
        {resetAt && <Countdown resetAt={resetAt} />}
      </div>

      {/* Yesterday's winner banner */}
      {yesterday && (
        <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-card px-3 py-2 mb-3">
          <Trophy size={14} className="text-yellow-400 shrink-0" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar name={yesterday.name} avatar={yesterday.avatar} size={24} />
            <p className="text-xs text-text-dim truncate">
              <span className="font-semibold text-yellow-400">{yesterday.name}</span> held the Cup yesterday
              <span className="text-text-dim"> · {yesterday.total_points} pts</span>
            </p>
          </div>
        </div>
      )}

      {board.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-2">No activity logged today yet — be the first!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Cup holder — top spot */}
          {first && (
            <div className="flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/30 rounded-card px-3 py-2.5">
              <div className="relative shrink-0">
                <Avatar name={first.name} avatar={first.avatar} size={40} />
                <span className="absolute -top-1 -right-1 text-base leading-none">🏆</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-yellow-300 truncate">{first.name}</p>
                <p className="text-[10px] text-yellow-400/70">Holding the WELL Cup</p>
              </div>
              <span className="text-sm font-bold text-yellow-300 shrink-0">{first.points} pts</span>
            </div>
          )}

          {/* 2nd–10th */}
          {rest.map((entry, i) => (
            <div key={entry.email} className="flex items-center gap-3 px-1">
              <span className="text-xs text-text-dim w-4 shrink-0 text-center">{i + 2}</span>
              <Avatar name={entry.name} avatar={entry.avatar} size={32} />
              <span className="text-xs font-semibold text-text flex-1 min-w-0 truncate">{entry.name}</span>
              <span className="text-xs font-bold text-brand-light shrink-0">{entry.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
