import { Award, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Info, RotateCcw, Share2, Star, TrendingUp, Trophy, HelpCircle } from "lucide-react";
import { todayISO } from "../utils/format";
import { cachedFetch } from "../utils/offlineCache";
import SectionIntroModal from "../components/SectionIntroModal";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import WellCupShareCard, { type SharePeriod, type ShareWinner } from "../components/WellCupShareCard";
import { fetchLeaderboard, type LeaderboardEntry } from "../utils/wellCup";
import { useApp } from "../store/AppContext";
import { useSectionTracking } from "../hooks/useSectionTracking";

function deriveMemberId(email: string): string {
  const lower = email.toLowerCase();
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = (hash << 5) - hash + lower.charCodeAt(i);
    hash |= 0;
  }
  return `m_${Math.abs(hash).toString(36)}`;
}

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface WinnerInfo {
  name: string;
  avatar: string | null;
  email?: string;
  total_points: number;
}

interface SpotlightInfo {
  name: string;
  avatar: string | null;
  email?: string;
  stat: string;
}

interface MyStats {
  bestDay: number;
  activeDaysThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  categoriesThisWeek: number;
}

function WinnerBanner({
  label,
  sublabel,
  winner,
  accent,
  empty,
  period,
  periodLabel,
}: {
  label: string;
  sublabel: string;
  winner: WinnerInfo | null;
  accent: string;
  empty: string;
  period: SharePeriod;
  periodLabel: string;
}) {
  const { user, memberBadges } = useApp();
  const [showShare, setShowShare] = useState(false);
  const winnerMoodStatus = winner?.email ? memberBadges[deriveMemberId(winner.email)]?.moodStatus : undefined;
  const isOwnWin = !!(winner?.email && user.email && winner.email.toLowerCase() === user.email.toLowerCase());
  return (
    <div className={`rounded-card px-4 py-3 border ${accent}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">{label}</p>
      {winner ? (
        <div className="flex items-center gap-3">
          <Avatar src={winner.avatar ?? ""} alt={winner.name} size={40} moodStatus={winnerMoodStatus} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text truncate">{winner.name}</p>
            <p className="text-xs text-text-muted">{sublabel} · {winner.total_points.toLocaleString()} pts</p>
          </div>
          <button
            onClick={() => setShowShare(true)}
            className="shrink-0 p-1.5 rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Share win"
          >
            <Share2 size={15} className="text-yellow-300" />
          </button>
          <Trophy size={18} className="shrink-0 text-yellow-400" />
        </div>
      ) : (
        <p className="text-xs text-text-dim italic">{empty}</p>
      )}
      {showShare && winner && (
        <WellCupShareCard
          winner={winner as ShareWinner}
          period={period}
          periodLabel={periodLabel}
          onClose={() => setShowShare(false)}
          isOwnWin={isOwnWin}
        />
      )}
    </div>
  );
}

function SpotlightBanner({
  label,
  description,
  winner,
  accent,
  icon: Icon,
  empty,
  shareLabel,
  period = "spotlight",
}: {
  label: string;
  description: string;
  winner: SpotlightInfo | null;
  accent: string;
  icon: React.ElementType;
  empty: string;
  shareLabel?: string;
  period?: SharePeriod;
}) {
  const navigate = useNavigate();
  const { memberBadges } = useApp();
  const [showShare, setShowShare] = useState(false);
  return (
    <div className={`rounded-card px-4 py-3 border ${accent}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} className="text-text-dim shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">{label}</p>
      </div>
      <p className="text-[10px] text-text-dim/70 mb-2 leading-snug">{description}</p>
      {winner ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => winner.email ? navigate(`/member/${deriveMemberId(winner.email)}`) : undefined}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            <Avatar src={winner.avatar ?? ""} alt={winner.name} size={36} moodStatus={winner.email ? memberBadges[deriveMemberId(winner.email)]?.moodStatus : undefined} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text truncate">{winner.name}</p>
              <p className="text-xs text-text-muted">{winner.stat}</p>
            </div>
          </button>
          {shareLabel && (
            <button
              onClick={() => setShowShare(true)}
              className="shrink-0 p-1.5 rounded-full bg-white/10 hover:bg-white/20"
              aria-label="Share spotlight"
            >
              <Share2 size={15} className="text-pink-300" />
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-text-dim italic">{empty}</p>
      )}
      {showShare && winner && shareLabel && (
        <WellCupShareCard
          winner={{ name: winner.name, avatar: winner.avatar, total_points: 0, stat: winner.stat }}
          period={period}
          periodLabel={shareLabel}
          onClose={() => setShowShare(false)}
        />
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


const ACTIVITY_META: Record<string, { emoji: string; label: string }> = {
  app_open:                 { emoji: "📱", label: "Opened the app" },
  forum_post:               { emoji: "✍️", label: "Posted in community" },
  forum_comment:            { emoji: "💬", label: "Commented in community" },
  class_watch:              { emoji: "🎥", label: "Completed a class" },
  cardio:                   { emoji: "🏃", label: "Completed cardio" },
  song_play:                { emoji: "🎵", label: "Listened to music" },
  blog_open:                { emoji: "📖", label: "Read the blog" },
  meal_log:                 { emoji: "🥗", label: "Logged a meal" },
  sleep_log:                { emoji: "😴", label: "Logged sleep" },
  breathwork:               { emoji: "🌬️", label: "Breathwork" },
  breathwork_extended:      { emoji: "🌬️", label: "Breathwork (extended)" },
  breathwork_calm_kit:      { emoji: "🌬️", label: "Calm kit" },
  stretching:               { emoji: "🧘", label: "Stretching" },
  resistance_training:      { emoji: "💪", label: "Resistance training" },
  well_activity:            { emoji: "⭐", label: "Well Activity" },
  event_attend:             { emoji: "📅", label: "Attended an event" },
  tribe_add:                { emoji: "🤝", label: "Added a tribe member" },
  tribe_cheer:              { emoji: "📣", label: "Sent a Tribe cheer" },
  tribe_card:               { emoji: "💌", label: "Sent a Tribe card" },
  tribe_challenge_complete: { emoji: "⚡", label: "Tribe challenge complete" },
  daily_challenge_accept:   { emoji: "🎯", label: "Accepted a daily challenge" },
  well_escape:              { emoji: "🌟", label: "Attended a WELL Escape" },
  login_streak_bonus:       { emoji: "🔥", label: "Login streak bonus" },
  steps:                    { emoji: "👣", label: "Step count" },
  tutorial_complete:        { emoji: "🎓", label: "Completed tutorial" },
  notifications_enabled:    { emoji: "🔔", label: "Enabled notifications" },
  add_to_homescreen:        { emoji: "📲", label: "Added to home screen" },
};

const POINTS_GUIDE: { emoji: string; label: string; pts: number | string }[] = [
  { emoji: "📱", label: "Open the app", pts: 5 },
  { emoji: "✍️", label: "Post in community", pts: 10 },
  { emoji: "💬", label: "Comment in community", pts: 5 },
  { emoji: "🎥", label: "Complete a class", pts: 20 },
  { emoji: "🏃", label: "Complete cardio", pts: 20 },
  { emoji: "🎵", label: "Listen to music", pts: 5 },
  { emoji: "📖", label: "Read the blog", pts: 5 },
  { emoji: "🥗", label: "Log a meal", pts: 10 },
  { emoji: "😴", label: "Log sleep", pts: 10 },
  { emoji: "🌬️", label: "Breathwork", pts: 15 },
  { emoji: "🧘", label: "Stretching", pts: 15 },
  { emoji: "💪", label: "Resistance training", pts: 20 },
  { emoji: "⭐", label: "Well Activity", pts: 15 },
  { emoji: "📅", label: "Attend an event", pts: 25 },
  { emoji: "🤝", label: "Add a tribe member", pts: 5 },
  { emoji: "📣", label: "Send a Tribe cheer", pts: 5 },
  { emoji: "💌", label: "Send a Tribe card", pts: 10 },
  { emoji: "⚡", label: "Complete a Tribe challenge with a friend", pts: 25 },
  { emoji: "🎯", label: "Accept a daily challenge", pts: 10 },
  { emoji: "🌟", label: "Attend a WELL Escape", pts: 100 },
  { emoji: "🔥", label: "Login streak milestone bonus", pts: "5–1,000" },
];

interface TodayActivity { type: string; points: number; count: number; }

export default function WellCup() {
  useSectionTracking("well-cup");
  const navigate = useNavigate();
  const { memberBadges, user } = useApp();
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [resetAt, setResetAt] = useState("");
  const [yesterday, setYesterday] = useState<WinnerInfo | null>(null);
  const [monthly, setMonthly] = useState<WinnerInfo | null>(null);
  const [yearly, setYearly] = useState<WinnerInfo | null>(null);
  const [yearResetAt, setYearResetAt] = useState("");
  const [mostImproved, setMostImproved] = useState<SpotlightInfo | null>(null);
  const [comeback, setComeback] = useState<SpotlightInfo | null>(null);
  const [luckyDraw, setLuckyDraw] = useState<SpotlightInfo | null>(null);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [view, setView] = useState<"top10" | "all">("top10");
  const [loadingAll, setLoadingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [todayActivities, setTodayActivities] = useState<TodayActivity[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayExpanded, setTodayExpanded] = useState(true);

  // WELL Check tracker data
  const today = todayISO();
  const workoutLog = user.workoutLog ?? [];
  const breathworkLog = user.breathworkLog ?? [];
  const wellActivityLog = user.wellActivityLog ?? [];
  const resistanceLog = user.resistanceLog ?? [];
  const stretchingLog = user.stretchingLog ?? [];
  const sleepDone = localStorage.getItem(`well-sleep-${today}`) === "1";
  const breathworkDone = breathworkLog.includes(today) || localStorage.getItem(`well-breathwork-marked-${today}`) === "1";
  const calmDone = localStorage.getItem(`well-calm-done-${today}`) === "1";
  const stretchDone = stretchingLog.includes(today) || localStorage.getItem(`well-stretching-${today}`) === "1";
  const workoutDone = workoutLog.includes(today) || resistanceLog.includes(today);
  const wellActDone = wellActivityLog.includes(today);
  const [hasMealsToday, setHasMealsToday] = useState(false);

  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/meals/today?email=${encodeURIComponent(user.email)}`)
      .then(r => r.ok ? r.json() : { meals: [] })
      .then(d => { if ((d.meals ?? []).length > 0) setHasMealsToday(true); })
      .catch(() => {});
  }, [user.email]);

  const CHECKIN_CATEGORIES = [
    { label: "Workout",    done: workoutDone },
    { label: "Sleep",      done: sleepDone },
    { label: "Nutrition",  done: hasMealsToday },
    { label: "Breathwork", done: breathworkDone },
    { label: "Stretching", done: stretchDone },
    { label: "Mindset",    done: wellActDone || calmDone },
  ];
  const checkinDone = CHECKIN_CATEGORIES.filter(c => c.done).length;
  const checkinPct = Math.round((checkinDone / CHECKIN_CATEGORIES.length) * 100);

  useEffect(() => {
    const empty = { leaderboard: [], resetAt: "" };
    Promise.all([
      cachedFetch(`${API_URL}/api/leaderboard?limit=10`, "leaderboard_10", empty),
      cachedFetch(`${API_URL}/api/leaderboard/yesterday`, "leaderboard_yesterday", null),
      cachedFetch(`${API_URL}/api/leaderboard/monthly`, "leaderboard_monthly", null),
      cachedFetch(`${API_URL}/api/leaderboard/yearly`, "leaderboard_yearly", null),
      cachedFetch(`${API_URL}/api/leaderboard/most-improved`, "leaderboard_improved", null),
      cachedFetch(`${API_URL}/api/leaderboard/comeback`, "leaderboard_comeback", null),
      cachedFetch(`${API_URL}/api/leaderboard/lucky-draw`, "leaderboard_lucky", null),
    ]).then(([lb, winnerRes, mon, yr, improved, cb, lucky]) => {
      const lbData = (lb.data ?? empty) as typeof empty;
      setAllEntries(lbData.leaderboard ?? []);
      setResetAt(lbData.resetAt ?? "");
      const winnerRaw = winnerRes.data as { winner?: WinnerInfo } | null;
      setYesterday(winnerRaw?.winner ?? null);
      const monData = mon.data as { leader?: WinnerInfo } | null;
      setMonthly(monData?.leader ?? null);
      const yrData = yr.data as { leader?: WinnerInfo; yearResetAt?: string } | null;
      setYearly(yrData?.leader ?? null);
      if (yrData?.yearResetAt) setYearResetAt(yrData.yearResetAt);
      const impData = improved.data as { leader?: WinnerInfo & { improvement?: number } } | null;
      if (impData?.leader) {
        const l = impData.leader;
        setMostImproved({ name: l.name, avatar: l.avatar, email: l.email, stat: `+${l.improvement} pts vs last week` });
      }
      const cbData = cb.data as { leader?: WinnerInfo & { this_week_pts?: number } } | null;
      if (cbData?.leader) {
        const l = cbData.leader;
        setComeback({ name: l.name, avatar: l.avatar, email: l.email, stat: `${l.this_week_pts} pts — back after a break` });
      }
      const luckyData = lucky.data as { leader?: WinnerInfo } | null;
      if (luckyData?.leader) {
        const l = luckyData.leader;
        setLuckyDraw({ name: l.name, avatar: l.avatar, email: l.email, stat: "This week's community spotlight" });
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/stats/me?email=${encodeURIComponent(user.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setMyStats(data); })
      .catch(() => {});
  }, [user.email]);

  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/activity/today?email=${encodeURIComponent(user.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setTodayActivities(data.activities ?? []);
        setTodayTotal(data.totalPoints ?? 0);
      })
      .catch(() => {});
  }, [user.email]);

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
      <SectionIntroModal sectionKey="well-cup" />

      <div className="px-4 pt-4 pb-8 flex flex-col gap-4">

        {/* Today's leader */}
        {!loading && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">Holding the Cup Today</p>
            {leader ? (
              <div className="rounded-card p-4 border border-yellow-400/40 flex items-center gap-3" style={{ background: "rgba(250,204,21,0.07)" }}>
                <div className="relative shrink-0">
                  <Avatar src={leader.avatar ?? ""} alt={leader.name} size={52} moodStatus={memberBadges[deriveMemberId(leader.email)]?.moodStatus} />
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

        {/* Rules */}
        <button
          onClick={() => setRulesExpanded(v => !v)}
          className="w-full flex items-center gap-2 text-left"
        >
          <HelpCircle size={14} className="text-brand-light shrink-0" />
          <span className="text-xs font-semibold text-brand-light flex-1">How the WELL Cup works</span>
          {rulesExpanded ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />}
        </button>
        {rulesExpanded && (
          <div className="rounded-card border border-brand-light/20 bg-brand-light/5 px-4 py-3 flex flex-col gap-2 -mt-2">
            {[
              { icon: "🏆", rule: "Earn points each day by logging activities — workouts, breathwork, meals, community posts, and more." },
              { icon: "📅", rule: "The daily winner is whoever has the most points at reset (1 AM ET / 10 PM PT / 7 AM Amsterdam). They earn the crown and a 1-day cooldown — so they can't win the very next day." },
              { icon: "📆", rule: "The monthly crown goes to the top earner of the month. Monthly winners sit out for the rest of that month so others can shine." },
              { icon: "🌟", rule: "The yearly crown celebrates the highest point total of the year. Yearly winners are honoured and step aside for that full year." },
              { icon: "💡", rule: "Cooldowns only apply to the crown — you can still earn points, climb the leaderboard, and support your tribe every single day." },
            ].map(({ icon, rule }, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-sm shrink-0">{icon}</span>
                <p className="text-xs text-text-muted leading-relaxed">{rule}</p>
              </div>
            ))}
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
              period="daily"
              periodLabel="Daily Winner"
            />
            <WinnerBanner
              label={`${monthName} Leader`}
              sublabel="Leading this month"
              winner={monthly}
              accent="border-purple-400/30 bg-purple-400/5"
              empty="No monthly leader yet — keep earning points!"
              period="monthly"
              periodLabel={`${monthName} Winner`}
            />
            <WinnerBanner
              label={`${year} Leader`}
              sublabel="Leading this year"
              winner={yearly}
              accent="border-brand-light/20 bg-brand/5"
              empty="No yearly leader yet — the year is just getting started!"
              period="yearly"
              periodLabel={`${year} WELL Crown`}
            />
          </div>
        )}

        {/* Spotlight awards — different dimensions, anyone can win */}
        {!loading && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">Spotlight Awards</p>
            <div className="flex flex-col gap-3">
              <SpotlightBanner
                label="Most Improved — This Week"
                description="Biggest points increase compared to last week. Consistently high scores can't win this — only growth can."
                winner={mostImproved}
                accent="border-sky-400/30 bg-sky-400/5"
                icon={TrendingUp}
                empty="Keep logging — this resets every Monday"
                shareLabel="Most Improved"
              />
              <SpotlightBanner
                label="Comeback Story — This Week"
                description="Highest points this week among members who were inactive last week. Always-active members can never qualify."
                winner={comeback}
                shareLabel="Comeback Story"
                period="comeback"
                accent="border-violet-400/30 bg-violet-400/5"
                icon={RotateCcw}
                empty="No returning members logged points yet this week"
              />
              <SpotlightBanner
                label="Weekly Spotlight"
                description="Each week we shine a light on a member of our community — celebrating who they are and the presence they bring, not just what they've achieved."
                winner={luckyDraw}
                accent="border-pink-400/30 bg-pink-400/5"
                icon={Star}
                empty="Earn 20+ pts this week — you could be this week's spotlight"
                shareLabel="Weekly Spotlight"
              />
            </div>
          </div>
        )}

        {/* Personal achievements — your own stats, no comparison */}
        {myStats && (
          <div className="glass-card rounded-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} className="text-brand-light shrink-0" />
              <p className="text-sm font-bold text-text">My Achievements</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-2 rounded-card px-3 py-2.5">
                <p className="text-[10px] text-text-dim mb-0.5">Personal Best Day</p>
                <p className="text-base font-extrabold text-text">{myStats.bestDay} <span className="text-xs font-normal text-text-dim">pts</span></p>
              </div>
              <div className="bg-surface-2 rounded-card px-3 py-2.5">
                <p className="text-[10px] text-text-dim mb-0.5">Active Days This Month</p>
                <p className="text-base font-extrabold text-text">{myStats.activeDaysThisMonth} <span className="text-xs font-normal text-text-dim">days</span></p>
              </div>
              <div className="bg-surface-2 rounded-card px-3 py-2.5">
                <p className="text-[10px] text-text-dim mb-0.5">Current Login Streak</p>
                <p className="text-base font-extrabold text-orange-300">{myStats.currentStreak} <span className="text-xs font-normal text-text-dim">days</span></p>
              </div>
              <div className="bg-surface-2 rounded-card px-3 py-2.5">
                <p className="text-[10px] text-text-dim mb-0.5">Activity Types This Week</p>
                <p className="text-base font-extrabold text-brand-light">{myStats.categoriesThisWeek} <span className="text-xs font-normal text-text-dim">/ 13</span></p>
              </div>
            </div>
            {myStats.longestStreak > 0 && (
              <p className="text-[10px] text-text-dim mt-2 text-center">Your longest streak ever: <span className="font-semibold text-text">{myStats.longestStreak} days</span></p>
            )}
          </div>
        )}

        {/* Prizes */}
        <div className="glass-card rounded-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-3">WELL Cup Prizes</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">🏆</span>
              <div>
                <p className="text-sm font-bold text-text">Monthly Winner</p>
                <p className="text-xs text-text-muted">Earn a free month of WELL Collective membership. Resets at midnight on the last day of each month.</p>
              </div>
            </div>
            <div className="w-full h-px bg-border" />
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">👑</span>
              <div>
                <p className="text-sm font-bold text-text">Yearly WELL Crown Winner</p>
                <p className="text-xs text-text-muted">
                  Win a free WELL ESCAPE — our exclusive retreat experience. The member with the most points by year-end wins.
                  {yearResetAt ? (() => {
                    const resetDate = new Date(yearResetAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                    return ` Leaderboard resets ${resetDate}.`;
                  })() : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Goal Tracker (WELL Check) */}
        <a href="/well-check" className="block glass-card rounded-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-brand-light" />
              <span className="text-[11px] font-bold text-text uppercase tracking-wide">Daily Goal Tracker</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-brand-light">{checkinDone}/{CHECKIN_CATEGORIES.length} done</span>
              <ChevronRight size={13} className="text-text-dim" />
            </div>
          </div>
          <div className="h-[3px] rounded-full mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-[3px] rounded-full gradient-brand transition-all duration-500" style={{ width: `${checkinPct}%` }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CHECKIN_CATEGORIES.map((c) => (
              <div key={c.label} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${c.done ? "bg-brand-light/15 border-brand-light/40 text-brand-light" : "bg-surface-2 border-border text-text-dim"}`}>
                <CheckCircle2 size={9} className={c.done ? "text-brand-light" : "text-text-dim/40"} />
                {c.label}
              </div>
            ))}
          </div>
        </a>

        {/* Today's points breakdown */}
        <div className="glass-card rounded-card p-4">
          <button
            onClick={() => setTodayExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Trophy size={14} className="text-yellow-400 shrink-0" />
              <span className="text-sm font-bold text-text">My points today</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-extrabold text-yellow-400">{todayTotal} pts</span>
              {todayExpanded ? <ChevronUp size={16} className="text-text-dim" /> : <ChevronDown size={16} className="text-text-dim" />}
            </div>
          </button>
          {todayExpanded && (
            <div className="mt-3 pt-3 border-t border-border">
              {todayActivities.length === 0 ? (
                <p className="text-xs text-text-dim text-center py-1">No points earned yet today — start logging!</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {todayActivities
                    .sort((a, b) => b.points - a.points)
                    .map((act) => {
                      const meta = ACTIVITY_META[act.type];
                      return (
                        <div key={act.type} className="flex items-center gap-2">
                          <span className="text-base w-6 text-center shrink-0">{meta?.emoji ?? "⚡"}</span>
                          <span className="text-xs text-text-muted flex-1">
                            {meta?.label ?? act.type.replace(/_/g, " ")}
                            {act.count > 1 && <span className="text-text-dim"> ×{act.count}</span>}
                          </span>
                          <span className="text-xs font-bold text-brand-light shrink-0">+{act.points}</span>
                        </div>
                      );
                    })}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-border">
                    <span className="text-xs font-bold text-text">Total</span>
                    <span className="text-sm font-extrabold text-yellow-400">{todayTotal} pts</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
                <button
                  onClick={() => navigate(`/member/${deriveMemberId(leader.email)}`)}
                  className="flex items-center gap-3 px-4 py-3 bg-yellow-400/5 w-full text-left"
                >
                  <span className="text-base w-5 shrink-0 text-center">🏆</span>
                  <Avatar src={leader.avatar ?? ""} alt={leader.name} size={34} moodStatus={memberBadges[deriveMemberId(leader.email)]?.moodStatus} />
                  <span className="text-sm font-bold text-yellow-300 flex-1 min-w-0 truncate">{leader.name}</span>
                  <span className="text-sm font-bold text-yellow-300 shrink-0">{leader.points} pts</span>
                </button>
              )}
              {rest.map((entry, i) => (
                <button
                  key={entry.email}
                  onClick={() => navigate(`/member/${deriveMemberId(entry.email)}`)}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left"
                >
                  <span className="text-xs text-text-dim w-5 shrink-0 text-center">{i + 2}</span>
                  <Avatar src={entry.avatar ?? ""} alt={entry.name} size={32} moodStatus={memberBadges[deriveMemberId(entry.email)]?.moodStatus} />
                  <span className="text-sm text-text flex-1 min-w-0 truncate font-medium">{entry.name}</span>
                  <span className="text-xs font-bold text-brand-light shrink-0">{entry.points} pts</span>
                </button>
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

        {/* Points guide */}
        <div className="glass-card rounded-card p-4">
          <button
            onClick={() => setGuideExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <Info size={14} className="text-brand-light shrink-0" />
              <span className="text-sm font-bold text-text">How are points earned?</span>
            </div>
            {guideExpanded ? <ChevronUp size={16} className="text-text-dim shrink-0" /> : <ChevronDown size={16} className="text-text-dim shrink-0" />}
          </button>
          {guideExpanded && (
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border">
              {POINTS_GUIDE.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-base w-6 text-center shrink-0">{item.emoji}</span>
                  <span className="text-xs text-text-muted flex-1">{item.label}</span>
                  <span className="text-xs font-bold text-brand-light shrink-0">+{item.pts}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
