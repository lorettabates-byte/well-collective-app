import { ChevronDown, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../components/layout/TopBar";
import { fetchLeaderboard, fetchYesterdayWinner, type LeaderboardEntry } from "../utils/wellCup";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface WinnerInfo {
  name: string;
  avatar: string | null;
  total_points: number;
}

function MemberAvatar({ name, avatar, size = 36 }: { name: string; avatar: string | null; size?: number }) {
  if (avatar) return <img src={avatar} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-full bg-brand/20 border border-brand-light/30 flex items-center justify-center shrink-0 font-bold text-brand-light" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function WinnerBanner({
  label,
  sublabel,
  winner,
  accent,
  empty,
}: {
  label: string;
  sublabel: string;
  winner: WinnerInfo | null;
  accent: string;
  empty: string;
}) {
  return (
    <div className={`rounded-card px-4 py-3 border ${accent}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">{label}</p>
      {winner ? (
        <div className="flex items-center gap-3">
          <MemberAvatar name={winner.name} avatar={winner.avatar} size={40} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text truncate">{winner.name}</p>
            <p className="text-xs text-text-muted">{sublabel} · {winner.total_points.toLocaleString()} pts</p>
          </div>
          <Trophy size={18} className="shrink-0 text-yellow-400" />
        </div>
      ) : (
        <p className="text-xs text-text-dim italic">{empty}</p>
      )}
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

export default function WellCup() {
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [resetAt, setResetAt] = useState("");
  const [yesterday, setYesterday] = useState<WinnerInfo | null>(null);
  const [monthly, setMonthly] = useState<WinnerInfo | null>(null);
  const [yearly, setYearly] = useState<WinnerInfo | null>(null);
  const [view, setView] = useState<"top10" | "all">("top10");
  const [loadingAll, setLoadingAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchLeaderboard(10),
      fetchYesterdayWinner(),
      API_URL ? fetch(`${API_URL}/api/leaderboard/monthly`).then(r => r.ok ? r.json() : null) : Promise.resolve(null),
      API_URL ? fetch(`${API_URL}/api/leaderboard/yearly`).then(r => r.ok ? r.json() : null) : Promise.resolve(null),
    ]).then(([lb, winner, mon, yr]) => {
      setAllEntries(lb.leaderboard);
      setResetAt(lb.resetAt);
      setYesterday(winner);
      setMonthly(mon?.leader ?? null);
      setYearly(yr?.leader ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const expandToAll = async () => {
    setLoadingAll(true);
    const { leaderboard } = await fetchLeaderboard("all");
    setAllEntries(leaderboard);
    setView("all");
    setLoadingAll(false);
  };

  const displayed = view === "top10" ? allEntries.slice(0, 10) : allEntries;
  const [leader, ...rest] = displayed;

  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();

  return (
    <div>
      <TopBar title="WELL Cup" subtitle="Today's leaderboard & all-time champions" icon={Trophy} iconColor="#FACC15" showBack />

      <div className="px-4 pt-4 pb-8 flex flex-col gap-4">

        {/* Today's leader */}
        {!loading && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">Holding the Cup Today</p>
            {leader ? (
              <div className="rounded-card p-4 border border-yellow-400/40 flex items-center gap-3" style={{ background: "rgba(250,204,21,0.07)" }}>
                <div className="relative shrink-0">
                  <MemberAvatar name={leader.name} avatar={leader.avatar} size={52} />
                  <span className="absolute -top-1 -right-1 text-lg leading-none">🏆</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-yellow-300 truncate">{leader.name}</p>
                  <p className="text-xs text-yellow-400/70">Leading with {leader.points} pts</p>
                  {resetAt && <Countdown resetAt={resetAt} />}
                </div>
              </div>
            ) : (
              <div className="rounded-card p-4 border border-border text-center">
                <p className="text-xs text-text-muted">No one on the board yet — open the app, log an activity, be first! 🏆</p>
              </div>
            )}
          </div>
        )}

        {/* Yesterday / Monthly / Yearly */}
        {!loading && (
          <div className="flex flex-col gap-3">
            <WinnerBanner
              label="Yesterday's Cup Winner"
              sublabel="Won the Cup"
              winner={yesterday}
              accent="border-yellow-400/30 bg-yellow-400/5"
              empty="No winner recorded yet"
            />
            <WinnerBanner
              label={`${monthName} Leader`}
              sublabel="Leading this month"
              winner={monthly}
              accent="border-purple-400/30 bg-purple-400/5"
              empty="No monthly leader yet — keep earning points!"
            />
            <WinnerBanner
              label={`${year} Leader`}
              sublabel="Leading this year"
              winner={yearly}
              accent="border-brand-light/20 bg-brand/5"
              empty="No yearly leader yet — the year is just getting started!"
            />
          </div>
        )}

        {/* Full leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Today's Rankings</p>
            {resetAt && <Countdown resetAt={resetAt} />}
          </div>

          {loading ? (
            <div className="py-6 text-center"><p className="text-xs text-text-muted">Loading…</p></div>
          ) : allEntries.length === 0 ? (
            <div className="glass-card rounded-card py-6 text-center">
              <p className="text-xs font-semibold text-text mb-1">No points logged yet today</p>
              <p className="text-[11px] text-text-muted">Every action earns points. Be the first on the board!</p>
            </div>
          ) : (
            <div className="glass-card rounded-card divide-y divide-border">
              {leader && (
                <div className="flex items-center gap-3 px-4 py-3 bg-yellow-400/5">
                  <span className="text-base w-5 shrink-0 text-center">🏆</span>
                  <MemberAvatar name={leader.name} avatar={leader.avatar} size={34} />
                  <span className="text-sm font-bold text-yellow-300 flex-1 min-w-0 truncate">{leader.name}</span>
                  <span className="text-sm font-bold text-yellow-300 shrink-0">{leader.points} pts</span>
                </div>
              )}
              {rest.map((entry, i) => (
                <div key={entry.email} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs text-text-dim w-5 shrink-0 text-center">{i + 2}</span>
                  <MemberAvatar name={entry.name} avatar={entry.avatar} size={32} />
                  <span className="text-sm text-text flex-1 min-w-0 truncate font-medium">{entry.name}</span>
                  <span className="text-xs font-bold text-brand-light shrink-0">{entry.points} pts</span>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div className="flex flex-col items-center gap-2 mt-3">
              {view === "top10" && allEntries.length >= 10 && (
                <button onClick={expandToAll} disabled={loadingAll} className="flex items-center gap-1 text-xs text-brand-light font-semibold disabled:opacity-50">
                  <ChevronDown size={13} />
                  {loadingAll ? "Loading…" : "See everyone"}
                </button>
              )}
              {view === "all" && allEntries.length > 10 && (
                <button onClick={() => setView("top10")} className="text-xs text-text-dim font-semibold">Show less</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
