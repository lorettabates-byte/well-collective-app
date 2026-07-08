import { Bell, Calendar, CheckCircle2, ChevronRight, Flame, Gift, Info, MessageCircle, Music, Phone, Rss, Salad, Share2, Sparkles, Video, Waves, X } from "lucide-react";
import { fetchYesterdayWinner } from "../utils/wellCup";
import { logEvent, startSessionTracking } from "../utils/analytics";
import { useEffect, useState } from "react";
import WellCupShareCard from "../components/WellCupShareCard";
import WeeklyThemeBar from "../components/WeeklyThemeBar";
import { Link } from "react-router-dom";
import WellCupLeaderboard from "../components/WellCupLeaderboard";
import BirthdayModal from "../components/BirthdayModal";
import FeatureTourModal from "../components/FeatureTourModal";
import NotificationOptInModal from "../components/NotificationOptInModal";
import StreakHistoryModal from "../components/StreakHistoryModal";
import EventCard from "../components/events/EventCard";
import TribeActivityStrip from "../components/home/TribeActivityStrip";
import ThreadPreviewCard from "../components/community/ThreadPreviewCard";
import InspirationCard from "../components/inspiration/InspirationCard";
import SectionHeader from "../components/ui/SectionHeader";
import Avatar from "../components/ui/Avatar";
import { LOGO_URL } from "../components/layout/MobileShell";
import { useEventsFeed } from "../hooks/useEventsFeed";
import { useApp } from "../store/AppContext";
import { getTrialStatus, isActiveMember } from "../utils/trial";
import { todayISO } from "../utils/format";
import { getDailyPlan } from "../data/goalPlans";
import { getTrendingThreads } from "../utils/threadUtils";
import { useUnreadMessageCount } from "../hooks/useUnreadMessageCount";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

const QUICK_LINKS = [
  { to: "/community", label: "Community", icon: MessageCircle },
  { to: "/wellness", label: "Wellness", icon: Waves },
  { to: "/videos", label: "Classes", icon: Video },
  { to: "/music", label: "Music", icon: Music },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/inspirations", label: "Inspiration", icon: Sparkles },
  { to: "/nutrition", label: "Nutrition", icon: Salad },
  { to: "/blog", label: "Blog", icon: Rss },
];

export default function Home() {
  const { user, threads, inspirations, events, notifications, featuredEventId, currentWeeklyTheme } = useApp();
  const { events: liveEvents } = useEventsFeed();
  const unreadMessages = useUnreadMessageCount(user.email);
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const totalUnread = unreadNotifications + unreadMessages;

  // Most recent by sentAt, not just inspirations[0] — guards against the
  // array order ever drifting out of sync with actual send time, since this
  // card is supposed to reflect whichever came in last: today's scheduled
  // daily send or a one-off note from Loretta, resetting the moment either
  // arrives.
  const todaysInspiration = [...inspirations].sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
  const allUpcomingEvents = [...events, ...liveEvents]
    .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date));
  const featuredEvent = allUpcomingEvents.find((e) => e.id === featuredEventId);
  const upcomingEvents = [
    ...(featuredEvent ? [featuredEvent] : []),
    ...allUpcomingEvents.filter((e) => e.id !== featuredEventId),
  ].slice(0, 4);
  const latestThreads = getTrendingThreads(threads, 2, 1);

  const [showBirthday, setShowBirthday] = useState(false);
  const [showNotifOptIn, setShowNotifOptIn] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [winnerBanner, setWinnerBanner] = useState<{ name: string; avatar: string | null; total_points: number; win_date: string } | null>(null);
  const [showWinShare, setShowWinShare] = useState(false);
  const [streakBanner, setStreakBanner] = useState<{ streak: number; bonus: number } | null>(null);
  const [headerStreak, setHeaderStreak] = useState<number | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  useEffect(() => {
    if (!user.birthday) return;
    const now = new Date();
    const todayMD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (user.birthday !== todayMD) return;

    const key = `well-birthday-shown-${user.id}-${now.getFullYear()}-${todayMD}`;
    if (localStorage.getItem(key)) return;

    localStorage.setItem(key, "1");
    setShowBirthday(true);
  }, [user.birthday, user.id]);

  useEffect(() => {
    const key = "well-notifications-onboarding-v1";
    if (localStorage.getItem(key)) return;
    setShowNotifOptIn(true);
  }, []);

  const handleCloseNotifOptIn = () => {
    localStorage.setItem("well-notifications-onboarding-v1", "1");
    setShowNotifOptIn(false);
  };

  useEffect(() => {
    const key = "well-feature-tour-v2";
    if (localStorage.getItem(key)) return;
    setShowTour(true);
  }, []);

  // Track app open + start session timer
  useEffect(() => {
    if (!user.email) return;
    logEvent(user.email, "app_open");
    return startSessionTracking(user.email);
  }, [user.email]);

  // Fetch current streak (for the header pill + the once-per-day banner)
  // after a short delay so the app_open/streak update lands first.
  useEffect(() => {
    if (!user.email || !API_URL) return;
    const bannerKey = `well-streak-banner-${todayISO()}`;
    const timer = setTimeout(() => {
      fetch(`${API_URL}/api/streak?email=${encodeURIComponent(user.email!)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const s = data?.streak;
          if (!s) return;
          setHeaderStreak(s.current_streak);
          if (s.current_streak > 1 && !localStorage.getItem(bannerKey)) {
            setStreakBanner({ streak: s.current_streak, bonus: s.todays_bonus });
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [user.email]);

  const handleCloseTour = (_completed: boolean) => {
    localStorage.setItem("well-feature-tour-v2", "1");
    setShowTour(false);
  };

  // Check if this user won yesterday's WELL Cup (show banner once per win_date)
  useEffect(() => {
    if (!user.email) return;
    fetchYesterdayWinner().then((winner) => {
      if (!winner || winner.email !== user.email) return;
      const key = `well-cup-win-banner-${winner.win_date}`;
      if (localStorage.getItem(key)) return;
      setWinnerBanner(winner);
    }).catch(() => {});
  }, [user.email]);

  const trialStatus = getTrialStatus(user.trialEndsAt);
  const showTrialBanner = trialStatus.isActive && !isActiveMember() && !user.isAdmin;

  const today = todayISO();
  const breathworkLog = user.breathworkLog ?? [];
  const wellActivityLog = user.wellActivityLog ?? [];
  const resistanceLog = user.resistanceLog ?? [];
  const stretchingLog = user.stretchingLog ?? [];
  const [breathworkDone, setBreathworkDone] = useState(() => localStorage.getItem(`well-breathwork-marked-${todayISO()}`) === "1");
  const [sleepDone, setSleepDone] = useState(() => localStorage.getItem(`well-sleep-${todayISO()}`) === "1");
  const [calmDone] = useState(() => localStorage.getItem(`well-calm-done-${todayISO()}`) === "1");
  const [showActivityInfo, setShowActivityInfo] = useState(false);

  // Home WellCheck strip
  const [homeSteps, setHomeSteps] = useState<number | null>(null);
  const [homeStepsInput, setHomeStepsInput] = useState("");
  const [homeStepsSaving, setHomeStepsSaving] = useState(false);

  // Home Nutrition strip
  interface HomeMacros { calories: number; protein: number; carbs: number; fat: number; mealCount: number }
  const [homeMacros, setHomeMacros] = useState<HomeMacros | null>(null);

  // Home points (WELL Cup today)
  const [homePoints, setHomePoints] = useState<number | null>(null);

  const handleHomeStepsSave = async () => {
    const steps = parseInt(homeStepsInput, 10);
    if (!API_URL || !user.email || isNaN(steps) || steps < 0 || homeStepsSaving) return;
    setHomeStepsSaving(true);
    try {
      await fetch(`${API_URL}/api/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberEmail: user.email, steps }),
      });
      setHomeSteps(steps);
      setHomeStepsInput("");
    } catch { /* ignore */ } finally {
      setHomeStepsSaving(false);
    }
  };

  // Sync localStorage flags from server-restored AppContext logs
  useEffect(() => {
    if (!breathworkDone && breathworkLog.includes(today)) {
      localStorage.setItem(`well-breathwork-marked-${today}`, "1");
      setBreathworkDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breathworkLog]);

  useEffect(() => {
    if (!resistanceLog.includes(today)) return;
    localStorage.setItem(`well-resistance-${today}`, "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resistanceLog]);

  useEffect(() => {
    if (!stretchingLog.includes(today)) return;
    localStorage.setItem(`well-stretching-${today}`, "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stretchingLog]);

  // Check the server for today's sleep entry in case it was logged on another device.
  useEffect(() => {
    if (sleepDone || !API_URL || !user.email) return;
    fetch(`${API_URL}/api/sleep/today?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hours) {
          localStorage.setItem(`well-sleep-${today}`, "1");
          setSleepDone(true);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  // Fetch steps for home WellCheck strip
  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/steps/today?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.steps) setHomeSteps(d.steps); })
      .catch(() => {});
  }, [user.email]);

  // Fetch today's meals for home Nutrition strip
  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/meals/today?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : { meals: [] }))
      .then((d) => {
        const meals = d.meals as { estimated_calories?: number; estimated_protein_g?: number; estimated_carbs_g?: number; estimated_fat_g?: number }[];
        if (!meals.length) return;
        const totals = meals.reduce((acc, m) => ({
          calories: acc.calories + (m.estimated_calories ?? 0),
          protein: acc.protein + (m.estimated_protein_g ?? 0),
          carbs: acc.carbs + (m.estimated_carbs_g ?? 0),
          fat: acc.fat + (m.estimated_fat_g ?? 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        setHomeMacros({ ...totals, mealCount: meals.length });
      })
      .catch(() => {});
  }, [user.email]);

  // Fetch today's WELL Cup points for home widget
  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/activity/today?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.totalPoints != null) setHomePoints(d.totalPoints); })
      .catch(() => {});
  }, [user.email]);

  return (
    <div className="px-4 pb-6" style={{ paddingTop: `max(1.25rem, env(safe-area-inset-top))` }}>
      <div className="flex items-center justify-between mb-6">
        <img src={LOGO_URL} alt="WELL Collective" className="h-24" />
        <div className="flex items-center gap-3">
          {headerStreak != null && headerStreak > 0 && (
            <button
              onClick={() => setShowStreakModal(true)}
              className="flex items-center gap-1 h-9 px-2.5 rounded-full bg-surface-2 border border-border"
              aria-label={`${headerStreak}-day login streak — view details`}
            >
              <Flame size={15} className="text-orange-400" />
              <span className="text-xs font-bold text-orange-300">{headerStreak}</span>
            </button>
          )}
          <Link to="/notifications" className="relative w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 border border-border" title="Notifications & Messages">
            <Bell size={17} />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-brand text-[10px] flex items-center justify-center text-white font-bold">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </Link>
          <Link to="/profile">
            <Avatar src={user.avatar} alt={user.name} size={36} ring />
          </Link>
        </div>
      </div>

      {showStreakModal && user.email && (
        <StreakHistoryModal email={user.email} onClose={() => setShowStreakModal(false)} />
      )}

      {showTrialBanner && (
        <div className="gradient-brand p-[1px] rounded-card mb-4">
          <div className="bg-surface rounded-card p-3 flex items-center gap-2.5">
            <Gift size={18} className="text-brand-light shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text">Free Trial Active</p>
              <p className="text-[11px] text-text-muted">{trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? "s" : ""} remaining</p>
            </div>
          </div>
        </div>
      )}

      {/* Login streak banner */}
      {streakBanner && (
        <div className="rounded-card mb-4 border border-orange-400/40 overflow-hidden" style={{ background: "rgba(251,146,60,0.07)" }}>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-xl shrink-0">🔥</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-orange-300">{streakBanner.streak}-Day Login Streak!</p>
              <p className="text-xs text-orange-400/70">
                {streakBanner.bonus > 0
                  ? `+${streakBanner.bonus} bonus pts earned — keep it up!`
                  : "You're on a roll — keep coming back every day!"}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem(`well-streak-banner-${todayISO()}`, "1");
                setStreakBanner(null);
              }}
              className="shrink-0 text-text-dim p-1"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* WELL Cup winner banner */}
      {winnerBanner && (
        <div className="rounded-card mb-4 border border-yellow-400/40 overflow-hidden" style={{ background: "rgba(250,204,21,0.07)" }}>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-2xl shrink-0">🏆</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-yellow-300">You won the WELL Cup yesterday!</p>
              <p className="text-xs text-yellow-400/70">{winnerBanner.total_points.toLocaleString()} points — you led the entire leaderboard.</p>
            </div>
            <button
              onClick={() => setShowWinShare(true)}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-yellow-300 bg-yellow-400/10 border border-yellow-400/30 rounded-pill px-3 py-1.5"
            >
              <Share2 size={12} />
              Share
            </button>
            <button
              onClick={() => {
                localStorage.setItem(`well-cup-win-banner-${winnerBanner.win_date}`, "1");
                setWinnerBanner(null);
              }}
              className="shrink-0 text-text-dim p-1"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {showWinShare && winnerBanner && (
        <WellCupShareCard
          winner={{ name: user.name, avatar: user.avatar || null, total_points: winnerBanner.total_points }}
          period="daily"
          periodLabel="Yesterday's Winner"
          onClose={() => {
            setShowWinShare(false);
            localStorage.setItem(`well-cup-win-banner-${winnerBanner.win_date}`, "1");
            setWinnerBanner(null);
          }}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-1">Hi {user.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-text-muted">Welcome back to the WELL COLLECTIVE.</p>
      </div>

      {/* Combined WELL Check home widget */}
      {(() => {
        const wellActDone = wellActivityLog.includes(today);
        const bwDone = breathworkLog.includes(today) || breathworkDone;
        const stretchDone = stretchingLog.includes(today) || localStorage.getItem(`well-stretching-${today}`) === "1";
        const activityFlags = [
          bwDone,
          stretchDone,
          calmDone,
          wellActDone,
          sleepDone,
        ];
        const ACTIVITY_INFO = [
          { label: "Breathwork", desc: "Daily guided breathwork session logged in Wellness" },
          { label: "Stretching", desc: "Stretching routine completed in the Wellness workout tab" },
          { label: "Calm Toolkit", desc: "Any calm or anxiety tool completed (grounding, box breathing, body scan, worry dump, PMR, reframe, humming breath)" },
          { label: "Well Activity", desc: "Today's WELL activity completed in the Wellness activities tab" },
          { label: "Sleep", desc: "Sleep logged in the Wellness activities tab" },
        ];
        const doneCount = activityFlags.filter(Boolean).length;
        const pct = Math.round((doneCount / activityFlags.length) * 100);

        let sleepHours: number | null = null;
        try {
          const raw = localStorage.getItem(`well-sleep-data-${today}`);
          if (raw) sleepHours = (JSON.parse(raw) as { hours: number }).hours;
        } catch { /* ignore */ }

        const baselineTdee = (user.heightCm && user.weightKg && user.age) ? (() => {
          const base = (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * user.age);
          const bmr = user.gender === "male" ? base + 5 : user.gender === "female" ? base - 161 : base - 78;
          const stepKcal = homeSteps ? Math.round(homeSteps * user.weightKg * 0.00057) : 0;
          return Math.round(bmr * 1.2) + stepKcal;
        })() : null;

        return (
          <Link to="/well-check" className="block glass-card rounded-card p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-brand-light" />
                <span className="text-[11px] font-bold text-text uppercase tracking-wide">WELL Check</span>
                <button
                  onClick={(e) => { e.preventDefault(); setShowActivityInfo((v) => !v); }}
                  aria-label="What activities are tracked?"
                  className="text-text-dim ml-0.5"
                >
                  <Info size={12} />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-brand-light">{doneCount}/{activityFlags.length} done</span>
                <ChevronRight size={13} className="text-text-dim" />
              </div>
            </div>
            {showActivityInfo && (
              <div className="mb-3 bg-surface-2 border border-border rounded-card px-3 py-2.5 flex flex-col gap-1.5" onClick={(e) => e.preventDefault()}>
                <p className="text-[10px] font-bold text-text uppercase tracking-wide mb-0.5">Tracked Activities</p>
                {ACTIVITY_INFO.map((a, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${activityFlags[i] ? "bg-brand-light" : "bg-surface border border-border"}`} />
                    <div>
                      <span className="text-[10px] font-semibold text-text">{a.label}</span>
                      <span className="text-[10px] text-text-dim"> — {a.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="h-[3px] rounded-full mb-4" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-[3px] rounded-full gradient-brand transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>

            <div className="grid grid-cols-3 gap-x-3 gap-y-3 mb-3">
              <div>
                <p className="text-[10px] text-text-dim mb-0.5">Steps</p>
                <p className="text-sm font-bold text-text leading-none">
                  {homeSteps != null ? homeSteps.toLocaleString() : <span className="text-text-dim font-normal text-xs">—</span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-dim mb-0.5">Sleep</p>
                <p className="text-sm font-bold text-text leading-none">
                  {sleepHours != null ? `${sleepHours}h` : <span className="text-text-dim font-normal text-xs">—</span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-dim mb-0.5">Energy In</p>
                <p className="text-sm font-bold text-text leading-none">
                  {homeMacros ? `${Math.round(homeMacros.calories).toLocaleString()} kcal` : <span className="text-text-dim font-normal text-xs">—</span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-dim mb-0.5">Energy Out</p>
                <p className="text-sm font-bold text-text leading-none">
                  {baselineTdee != null ? `${baselineTdee.toLocaleString()} kcal` : <span className="text-text-dim font-normal text-xs">Add profile stats</span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-dim mb-0.5">Points Today</p>
                <p className="text-sm font-bold text-text leading-none">
                  {homePoints != null ? homePoints : <span className="text-text-dim font-normal text-xs">—</span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-dim mb-0.5">Activities</p>
                <p className="text-sm font-bold text-text leading-none">
                  {doneCount}<span className="text-text-dim font-normal text-xs">/{activityFlags.length} done</span>
                </p>
              </div>
            </div>

            {homeMacros && (
              <div className="flex gap-3 mb-3">
                <span className="text-[10px] text-text-dim">P <span className="text-text font-semibold">{Math.round(homeMacros.protein)}g</span></span>
                <span className="text-[10px] text-text-dim">C <span className="text-text font-semibold">{Math.round(homeMacros.carbs)}g</span></span>
                <span className="text-[10px] text-text-dim">F <span className="text-text font-semibold">{Math.round(homeMacros.fat)}g</span></span>
              </div>
            )}

            {homeSteps == null && (
              <div className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
                <input
                  type="number"
                  value={homeStepsInput}
                  onChange={(e) => setHomeStepsInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleHomeStepsSave()}
                  placeholder="Log today's steps…"
                  className="flex-1 min-w-0 bg-surface-2 border border-border rounded px-2 py-1.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                />
                <button
                  onClick={(e) => { e.preventDefault(); handleHomeStepsSave(); }}
                  disabled={homeStepsSaving || !homeStepsInput}
                  className="text-[10px] font-semibold text-white gradient-brand rounded px-3 py-1.5 shrink-0 disabled:opacity-40"
                >
                  {homeStepsSaving ? "…" : "Log"}
                </button>
              </div>
            )}
          </Link>
        );
      })()}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl gradient-brand shadow-glow flex items-center justify-center">
              <Icon size={20} className="text-white" />
            </div>
            <span className="text-[11px] text-text-muted text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      <a
        href="sms:+17863093356"
        className="flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow mb-6"
      >
        <Phone size={16} />
        Contact Loretta
      </a>

      <div className="mb-6">
        <SectionHeader title="WELL Cup" to="/well-cup" />
        <WellCupLeaderboard />
      </div>

      {user.goalsCompleted && user.goalPlan && (() => {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const plan = getDailyPlan(user.goalPlan, dayOfYear);
        return (
          <Link to="/wellness" className="block glass-card rounded-card p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-brand-light shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-light">Your Daily Plan</span>
              <ChevronRight size={13} className="ml-auto text-text-dim" />
            </div>
            <h3 className="text-base font-extrabold text-text leading-tight mb-0.5">{plan.title}</h3>
            <p className="text-xs text-brand-light font-semibold mb-2">{plan.focus}</p>
            <div className="flex flex-col gap-1.5 mb-3">
              {plan.tasks.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="text-brand-light shrink-0 mt-0.5" />
                  <p className="text-xs text-text-muted leading-tight">{t}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-dim italic leading-relaxed">"{plan.affirmation}"</p>
          </Link>
        );
      })()}

      <div className="mb-6">
        <WeeklyThemeBar theme={currentWeeklyTheme} />
      </div>

      {todaysInspiration && (
        <div className="mb-6">
          <SectionHeader title="Today's Inspiration" to="/inspirations" />
          <InspirationCard inspiration={todaysInspiration} compact />
        </div>
      )}

      {upcomingEvents.length > 0 && (
        <div className="mb-6">
          <SectionHeader title="Upcoming Events" to="/events" />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
        </div>
      )}

      <TribeActivityStrip />

      <div className="mb-6">
        <SectionHeader title="From the Community" to="/community" />
        <div className="flex flex-col gap-3">
          {latestThreads.map((thread) => (
            <ThreadPreviewCard key={thread.id} thread={thread} />
          ))}
        </div>
      </div>

      {showBirthday && <BirthdayModal name={user.name} email={user.email} onClose={() => setShowBirthday(false)} />}
      {!showBirthday && showTour && <FeatureTourModal userEmail={user.email} onClose={handleCloseTour} />}
      {!showBirthday && !showTour && showNotifOptIn && <NotificationOptInModal onClose={handleCloseNotifOptIn} />}
    </div>
  );
}
