import { Bell, Calendar, CheckCircle2, ChevronRight, Flame, Gift, GripVertical, Info, MessageCircle, Music, Play, Rss, Salad, Share2, Sparkles, Video, Waves, X } from "lucide-react";

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

const ALL_QUICK_LINKS = [
  { id: "community",   to: "/community",    label: "Community",  icon: MessageCircle },
  { id: "wellness",    to: "/wellness",     label: "Wellness",   icon: Waves },
  { id: "videos",      to: "/videos",       label: "Classes",    icon: Video },
  { id: "music",       to: "/music",        label: "Music",      icon: Music },
  { id: "events",      to: "/events",       label: "Events",     icon: Calendar },
  { id: "inspirations",to: "/inspirations", label: "Inspiration",icon: Sparkles },
  { id: "nutrition",   to: "/nutrition",    label: "Nutrition",  icon: Salad },
  { id: "blog",        to: "/blog",         label: "Blog",       icon: Rss },
];

// Order the first 4 quick links by goal so the most relevant sections surface first.
// The remaining 4 keep their default order.
const GOAL_LINK_ORDER: Record<string, string[]> = {
  stress:    ["wellness", "music", "community", "inspirations"],
  energy:    ["wellness", "nutrition", "videos", "community"],
  strength:  ["videos", "wellness", "nutrition", "community"],
  weight:    ["nutrition", "wellness", "videos", "community"],
  rut:       ["inspirations", "videos", "community", "events"],
  community: ["community", "events", "inspirations", "videos"],
};

function getQuickLinks(goalPlan?: string) {
  const priority = goalPlan ? (GOAL_LINK_ORDER[goalPlan] ?? []) : [];
  const priorityLinks = priority
    .map((id) => ALL_QUICK_LINKS.find((l) => l.id === id))
    .filter(Boolean) as typeof ALL_QUICK_LINKS;
  const rest = ALL_QUICK_LINKS.filter((l) => !priority.includes(l.id));
  return [...priorityLinks, ...rest];
}

type SectionId = "daily-plan" | "well-cup" | "weekly-theme" | "inspiration" | "events" | "tribe" | "community";
const DEFAULT_SECTION_ORDER: SectionId[] = ["daily-plan", "well-cup", "weekly-theme", "inspiration", "events", "tribe", "community"];
// Section display names — used by Profile layout picker and future drag-handle labels
export const SECTION_LABELS: Record<SectionId, string> = {
  "daily-plan": "Daily Plan",
  "well-cup": "WELL Cup",
  "weekly-theme": "Weekly Theme",
  "inspiration": "Today's Inspiration",
  "events": "Upcoming Events",
  "tribe": "Tribe Activity",
  "community": "From the Community",
};

const GOAL_TAGLINES: Record<string, string> = {
  stress:    "Your calm toolkit is ready.",
  energy:    "Let's keep your energy high today.",
  strength:  "Build something stronger today.",
  weight:    "Every choice today is a step forward.",
  rut:       "One new thing can change everything.",
  community: "Your tribe is here for you.",
};

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
  const [showWalkthroughPrompt, setShowWalkthroughPrompt] = useState(
    () => !localStorage.getItem("well-walkthrough-seen-v1")
  );
  const [showWalkthroughVideo, setShowWalkthroughVideo] = useState(false);
  const [winnerBanner, setWinnerBanner] = useState<{ name: string; avatar: string | null; total_points: number; win_date: string } | null>(null);
  const [showWinShare, setShowWinShare] = useState(false);
  const [streakBanner, setStreakBanner] = useState<{ streak: number; bonus: number } | null>(null);
  const [headerStreak, setHeaderStreak] = useState<number | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  const resolveLayout = (raw: string): string => ({ dashboard: "exercise", together: "community" }[raw] ?? raw);
  const [homeLayout, setHomeLayout] = useState(() => resolveLayout(localStorage.getItem("well-home-layout") ?? "classic"));
  useEffect(() => {
    const onLayoutChange = () => setHomeLayout(resolveLayout(localStorage.getItem("well-home-layout") ?? "classic"));
    const onOrderChange = () => setSectionOrder(readSectionOrder());
    window.addEventListener("well-layout-changed", onLayoutChange);
    window.addEventListener("well-section-order-changed", onOrderChange);
    return () => {
      window.removeEventListener("well-layout-changed", onLayoutChange);
      window.removeEventListener("well-section-order-changed", onOrderChange);
    };
  }, []);

  const [showFocusPicker, setShowFocusPicker] = useState(false);
  const [focusBigIds, setFocusBigIds] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("well-focus-shortcuts-v1");
      if (s) return JSON.parse(s) as string[];
    } catch { /* ignore */ }
    return [];
  });

  const readSectionOrder = (): SectionId[] => {
    try {
      const saved = localStorage.getItem("well-section-order-v1");
      if (saved) {
        const parsed = JSON.parse(saved) as SectionId[];
        if (Array.isArray(parsed) && parsed.length === DEFAULT_SECTION_ORDER.length) return parsed;
      }
    } catch { /* ignore */ }
    return DEFAULT_SECTION_ORDER;
  };

  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(readSectionOrder);
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState<SectionId | null>(null);

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
  const workoutLog = user.workoutLog ?? [];
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

  // Home Nutrition strip
  interface HomeMacros { calories: number; protein: number; carbs: number; fat: number; mealCount: number }
  const [homeMacros, setHomeMacros] = useState<HomeMacros | null>(null);

  // Home points (WELL Cup today)
  const [homePoints, setHomePoints] = useState<number | null>(null);


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

  const WALKTHROUGH_URL = "https://iframe.mediadelivery.net/play/411422/626e2fdf-027e-47b9-beb8-78d92a70113a";

  return (
    <div className="px-4 pb-6" style={{ paddingTop: `max(1.25rem, env(safe-area-inset-top))` }}>

      {/* Full-screen in-app walkthrough video */}
      {showWalkthroughVideo && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setShowWalkthroughVideo(false)}
        >
          <button
            onClick={() => setShowWalkthroughVideo(false)}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
          <div
            className="h-full"
            style={{ aspectRatio: "9/16", maxWidth: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={WALKTHROUGH_URL}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}
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
        <p className="text-sm text-text-muted">
          {user.goalPlan && GOAL_TAGLINES[user.goalPlan]
            ? GOAL_TAGLINES[user.goalPlan]
            : "Welcome back to the WELL COLLECTIVE."}
        </p>
      </div>

      {/* One-time walkthrough video prompt */}
      {showWalkthroughPrompt && (
        <div className="glass-card rounded-card p-4 mb-4 flex items-center gap-3">
          <button
            onClick={() => {
              setShowWalkthroughVideo(true);
              localStorage.setItem("well-walkthrough-seen-v1", "1");
              setShowWalkthroughPrompt(false);
            }}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center shrink-0 shadow-glow">
              <Play size={16} className="text-white ml-0.5" fill="white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text">New here? Watch the walkthrough</p>
              <p className="text-xs text-text-muted">Loretta walks you through everything in the app</p>
            </div>
          </button>
          <button
            onClick={() => {
              localStorage.setItem("well-walkthrough-seen-v1", "1");
              setShowWalkthroughPrompt(false);
            }}
            className="shrink-0 text-text-dim p-1"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Combined WELL Check home widget */}
      {(() => {
        const wellActDone = wellActivityLog.includes(today);
        const bwDone = breathworkLog.includes(today) || breathworkDone;
        const stretchDone = stretchingLog.includes(today) || localStorage.getItem(`well-stretching-${today}`) === "1";
        const workoutDone = workoutLog.includes(today) || resistanceLog.includes(today);

        // 6 WELL Check entry categories — drives the progress bar
        const CHECKIN_CATEGORIES = [
          { label: "Workout",    done: workoutDone,                       desc: "Any cardio, resistance, or class counted in Wellness" },
          { label: "Sleep",      done: sleepDone,                          desc: "Sleep hours & quality logged in Wellness → Activities" },
          { label: "Nutrition",  done: homeMacros != null,                 desc: "At least one meal logged in Nutrition today" },
          { label: "Breathwork", done: bwDone,                             desc: "Guided breathwork session completed in Wellness" },
          { label: "Stretching", done: stretchDone,                        desc: "Stretching routine completed in Wellness → Workout" },
          { label: "Mindset",    done: wellActDone || calmDone,            desc: "Daily WELL Activity or any Calm Toolkit tool completed" },
        ];
        const checkinDone = CHECKIN_CATEGORIES.filter((c) => c.done).length;
        const pct = Math.round((checkinDone / CHECKIN_CATEGORIES.length) * 100);

        let sleepHours: number | null = null;
        try {
          const raw = localStorage.getItem(`well-sleep-data-${today}`);
          if (raw) sleepHours = (JSON.parse(raw) as { hours: number }).hours;
        } catch { /* ignore */ }

        const exerciseCals = (() => {
          try { return parseInt(localStorage.getItem(`well-exercise-cals-${today}`) ?? "0", 10) || 0; } catch { return 0; }
        })();
        const baselineTdee = (user.heightCm && user.weightKg && user.age) ? (() => {
          const base = (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * user.age);
          const bmr = user.gender === "male" ? base + 5 : user.gender === "female" ? base - 161 : base - 78;
          const stepKcal = homeSteps ? Math.round(homeSteps * user.weightKg * 0.00057) : 0;
          const tdee = Math.round(bmr * 1.2) + stepKcal + exerciseCals;
          return (tdee >= 800 && tdee <= 4500) ? tdee : null;
        })() : null;

        return (
          <Link to="/well-check" className="block glass-card rounded-card p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-brand-light" />
                <span className="text-[11px] font-bold text-text uppercase tracking-wide">WELL Check</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-brand-light">{checkinDone}/{CHECKIN_CATEGORIES.length} categories</span>
                <button
                  onClick={(e) => { e.preventDefault(); setShowActivityInfo((v) => !v); }}
                  aria-label="What does this track?"
                  className="text-text-dim"
                >
                  <Info size={12} />
                </button>
                <ChevronRight size={13} className="text-text-dim" />
              </div>
            </div>
            {showActivityInfo && (
              <div className="mb-3 bg-surface-2 border border-border rounded-card px-3 py-2.5 flex flex-col gap-1.5" onClick={(e) => e.preventDefault()}>
                <p className="text-[10px] font-bold text-text uppercase tracking-wide mb-0.5">6 Daily Categories</p>
                {CHECKIN_CATEGORIES.map((c) => (
                  <div key={c.label} className="flex gap-2 items-start">
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${c.done ? "bg-brand-light" : "bg-surface border border-border"}`} />
                    <div>
                      <span className="text-[10px] font-semibold text-text">{c.label}</span>
                      <span className="text-[10px] text-text-dim"> — {c.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="h-[3px] rounded-full mb-4" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-[3px] rounded-full gradient-brand transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>

            <div className="grid grid-cols-3 gap-x-3 gap-y-3 mb-3">
              {/* Col 1 top — Energy In (Nutrition) */}
              <div>
                <p className="text-[10px] text-text-dim mb-1">Energy In <span className="text-text-dim/60">(Nutrition)</span></p>
                {homeMacros ? (
                  <p className="text-base font-bold text-text leading-none">{Math.round(homeMacros.calories).toLocaleString()} <span className="text-xs font-normal text-text-dim">kcal</span></p>
                ) : (
                  <p className="text-xs text-text-dim leading-tight">No meals logged</p>
                )}
              </div>
              {/* Col 2 top — Sleep */}
              <div>
                <p className="text-[10px] text-text-dim mb-1">Sleep</p>
                {sleepDone ? (
                  <p className="text-base font-bold text-brand-light leading-none flex items-center gap-1">
                    <CheckCircle2 size={12} className="shrink-0" />
                    {sleepHours != null ? `${sleepHours}h` : "Logged"}
                  </p>
                ) : (
                  <p className="text-xs text-text-dim leading-tight">Not logged</p>
                )}
              </div>
              {/* Col 3 top — Mindset */}
              <div>
                <p className="text-[10px] text-text-dim mb-1">Mindset</p>
                {(wellActDone || calmDone) ? (
                  <p className="text-base font-bold text-brand-light leading-none flex items-center gap-1">
                    <CheckCircle2 size={12} className="shrink-0" /> Done
                  </p>
                ) : (
                  <p className="text-xs text-text-dim leading-tight">Not completed</p>
                )}
              </div>
              {/* Col 1 bottom — Energy Out (BMR + activity) */}
              <div>
                <p className="text-[10px] text-text-dim mb-1">Energy Out <span className="text-text-dim/60">{exerciseCals > 0 ? "(BMR + activity)" : "(BMR)"}</span></p>
                {baselineTdee != null ? (
                  <p className="text-base font-bold text-text leading-none">{baselineTdee.toLocaleString()} <span className="text-xs font-normal text-text-dim">kcal</span></p>
                ) : (
                  <p className="text-xs text-text-dim leading-tight">Add profile stats</p>
                )}
              </div>
              {/* Col 2 bottom — Breathwork */}
              <div>
                <p className="text-[10px] text-text-dim mb-1">Breathwork</p>
                {bwDone ? (
                  <p className="text-base font-bold text-brand-light leading-none flex items-center gap-1">
                    <CheckCircle2 size={12} className="shrink-0" /> Done
                  </p>
                ) : (
                  <p className="text-xs text-text-dim leading-tight">Not logged</p>
                )}
              </div>
              {/* Col 3 bottom — Points Today */}
              <div>
                <p className="text-[10px] text-text-dim mb-1">Points Today</p>
                <p className="text-base font-bold text-yellow-300 leading-none">
                  {homePoints != null ? homePoints : <span className="text-text-dim font-normal text-xs">—</span>}
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

          </Link>
        );
      })()}

      {(() => {
        const links = getQuickLinks(user.goalPlan);

        if (homeLayout === "focus") {
          const effectiveBigIds = focusBigIds.length === 4 ? focusBigIds : links.slice(0, 4).map((l) => l.id);
          const bigLinks = links.filter((l) => effectiveBigIds.includes(l.id));
          const smallLinks = links.filter((l) => !effectiveBigIds.includes(l.id));

          const toggleFocusSection = (id: string) => {
            setFocusBigIds((prev) => {
              const cur = prev.length === 4 ? prev : links.slice(0, 4).map((l) => l.id);
              if (cur.includes(id)) return cur.filter((x) => x !== id);
              if (cur.length < 4) return [...cur, id];
              return cur;
            });
          };

          const saveFocusPicker = () => {
            const cur = focusBigIds.length > 0 ? focusBigIds : effectiveBigIds;
            localStorage.setItem("well-focus-shortcuts-v1", JSON.stringify(cur));
            setShowFocusPicker(false);
          };

          if (showFocusPicker) {
            const pickerIds = focusBigIds.length > 0 ? focusBigIds : effectiveBigIds;
            const remaining = 4 - pickerIds.length;
            return (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-text">Choose your 4 featured sections</p>
                  <button
                    onClick={saveFocusPicker}
                    disabled={pickerIds.length !== 4}
                    className="text-xs font-semibold text-brand-light disabled:opacity-40"
                  >
                    {pickerIds.length === 4 ? "Done" : `${remaining} more to go`}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {links.map(({ id, label, icon: Icon }) => {
                    const selected = pickerIds.includes(id);
                    const disabled = !selected && pickerIds.length >= 4;
                    return (
                      <button
                        key={id}
                        onClick={() => toggleFocusSection(id)}
                        disabled={disabled}
                        className={`flex flex-col items-center gap-1.5 transition-opacity ${disabled ? "opacity-30" : ""}`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative shadow-glow ${selected ? "gradient-brand" : "bg-surface-2 border border-border"}`}>
                          <Icon size={22} className={selected ? "text-white" : "text-text-dim"} />
                          {selected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-light border border-surface flex items-center justify-center">
                              <CheckCircle2 size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] text-center leading-tight ${selected ? "text-brand-light font-semibold" : "text-text-muted"}`}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div className="mb-6">
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={() => {
                    if (focusBigIds.length === 0) setFocusBigIds(effectiveBigIds);
                    setShowFocusPicker(true);
                  }}
                  className="text-[11px] font-semibold text-brand-light border border-brand-light/40 rounded-pill px-3 py-1.5"
                >
                  Choose your 4
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {bigLinks.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="flex flex-col items-center justify-center gap-3 glass-card rounded-card py-6">
                    <div className="w-14 h-14 rounded-2xl gradient-brand shadow-glow flex items-center justify-center">
                      <Icon size={28} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold text-text">{label}</span>
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {smallLinks.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl gradient-brand shadow-glow flex items-center justify-center opacity-80">
                      <Icon size={18} className="text-white" />
                    </div>
                    <span className="text-[10px] text-text-muted text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        if (homeLayout === "flow") {
          // Two-column pill rows: icon left, label right — easier to scan and tap
          return (
            <div className="grid grid-cols-2 gap-2 mb-6">
              {links.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className="flex items-center gap-3 glass-card rounded-pill px-4 py-3">
                  <div className="w-9 h-9 rounded-xl gradient-brand shadow-glow flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-text leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          );
        }

        if (homeLayout === "exercise") {
          // Compact 4×2 grid — all 8 at a glance, performance-dashboard feel
          return (
            <div className="mb-6">
              {(workoutLog.includes(today) || resistanceLog.includes(today)) && (
                <div className="flex items-center gap-2 mb-3 px-1">
                  <CheckCircle2 size={13} className="text-brand-light shrink-0" />
                  <span className="text-[11px] text-brand-light font-semibold">Workout logged today — great work!</span>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {links.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl gradient-brand shadow-glow flex items-center justify-center">
                      <Icon size={18} className="text-white" />
                    </div>
                    <span className="text-[10px] text-text-muted text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        if (homeLayout === "nutrition") {
          // Nutrition-forward: macro summary nudge + horizontal icon scroll
          const hasTracked = homeMacros != null;
          return (
            <div className="mb-6">
              <div className={`flex items-center gap-3 rounded-card px-3 py-2.5 mb-3 border ${hasTracked ? "border-brand-light/30 bg-brand-light/5" : "border-border bg-surface-2"}`}>
                <Salad size={16} className={hasTracked ? "text-brand-light shrink-0" : "text-text-dim shrink-0"} />
                {hasTracked && homeMacros ? (
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="font-bold text-text">{Math.round(homeMacros.calories).toLocaleString()} kcal</span>
                    <span className="text-text-dim">P <span className="text-text font-semibold">{Math.round(homeMacros.protein)}g</span></span>
                    <span className="text-text-dim">C <span className="text-text font-semibold">{Math.round(homeMacros.carbs)}g</span></span>
                    <span className="text-text-dim">F <span className="text-text font-semibold">{Math.round(homeMacros.fat)}g</span></span>
                  </div>
                ) : (
                  <span className="text-[11px] text-text-dim">No meals logged yet today — tap Nutrition to start</span>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {links.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="shrink-0 flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl gradient-brand shadow-glow flex items-center justify-center">
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className="text-[10px] text-text-muted text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        if (homeLayout === "inspire") {
          // Single horizontal scroll strip — minimal, clean, inspiration-forward
          return (
            <div className="mb-6">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {links.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="shrink-0 flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl gradient-brand shadow-glow flex items-center justify-center">
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className="text-[10px] text-text-muted text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        if (homeLayout === "community") {
          // Community-first: top 4 shown as full-width pill cards with gradient border
          const top4 = links.slice(0, 4);
          const bottom4 = links.slice(4);
          return (
            <div className="mb-6">
              <div className="flex flex-col gap-2 mb-3">
                {top4.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="flex items-center gap-4 gradient-brand p-[1px] rounded-card">
                    <div className="flex items-center gap-4 bg-surface rounded-card px-4 py-3 w-full">
                      <div className="w-10 h-10 rounded-xl gradient-brand shadow-glow flex items-center justify-center shrink-0">
                        <Icon size={20} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold text-text">{label}</span>
                      <ChevronRight size={14} className="ml-auto text-text-dim" />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {bottom4.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl gradient-brand shadow-glow flex items-center justify-center opacity-70">
                      <Icon size={18} className="text-white" />
                    </div>
                    <span className="text-[10px] text-text-muted text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        // Classic (default)
        return (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl gradient-brand shadow-glow flex items-center justify-center">
                  <Icon size={26} className="text-white" />
                </div>
                <span className="text-[11px] text-text-muted text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        );
      })()}

      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setEditMode((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-light border border-brand-light/40 rounded-pill px-3 py-1.5"
        >
          <GripVertical size={12} />
          {editMode ? "Done" : "Arrange"}
        </button>
      </div>

      {sectionOrder.map((sectionId) => {
        const handleDragStart = (e: React.DragEvent) => {
          setDragging(sectionId);
          e.dataTransfer.effectAllowed = "move";
        };
        const handleDragOver = (e: React.DragEvent) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        };
        const handleDrop = (e: React.DragEvent) => {
          e.preventDefault();
          if (!dragging || dragging === sectionId) { setDragging(null); return; }
          const next = [...sectionOrder];
          const fromIdx = next.indexOf(dragging);
          const toIdx = next.indexOf(sectionId);
          next.splice(fromIdx, 1);
          next.splice(toIdx, 0, dragging);
          setSectionOrder(next);
          localStorage.setItem("well-section-order-v1", JSON.stringify(next));
          setDragging(null);
        };
        const handleDragEnd = () => setDragging(null);

        const isDraggingThis = dragging === sectionId;

        const wrapSection = (content: React.ReactNode) => (
          <div
            key={sectionId}
            draggable={editMode}
            onDragStart={editMode ? handleDragStart : undefined}
            onDragOver={editMode ? handleDragOver : undefined}
            onDrop={editMode ? handleDrop : undefined}
            onDragEnd={editMode ? handleDragEnd : undefined}
            className={`relative ${isDraggingThis ? "opacity-40" : ""}`}
          >
            {editMode && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center pr-2 text-text-dim cursor-grab active:cursor-grabbing">
                <GripVertical size={16} />
              </div>
            )}
            <div className={editMode ? "pl-6" : ""}>{content}</div>
          </div>
        );

        if (sectionId === "well-cup") {
          return wrapSection(
            <div className="mb-6">
              <SectionHeader title="WELL Cup" to="/well-cup" />
              <WellCupLeaderboard />
            </div>
          );
        }

        if (sectionId === "daily-plan") {
          if (!user.goalsCompleted || !user.goalPlan) return null;
          const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
          const plan = getDailyPlan(user.goalPlan, dayOfYear);
          return wrapSection(
            <Link to="/wellness?tab=activities" className="block glass-card rounded-card p-4 mb-6">
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
        }

        if (sectionId === "weekly-theme") {
          return wrapSection(
            <div className="mb-6">
              <WeeklyThemeBar theme={currentWeeklyTheme} />
            </div>
          );
        }

        if (sectionId === "inspiration") {
          if (!todaysInspiration) return null;
          return wrapSection(
            <div className="mb-6">
              <SectionHeader title="Today's Inspiration" to="/inspirations" />
              <Link to="/inspirations" className="block">
                <InspirationCard inspiration={todaysInspiration} compact />
              </Link>
            </div>
          );
        }

        if (sectionId === "events") {
          if (!upcomingEvents.length) return null;
          return wrapSection(
            <div className="mb-6">
              <SectionHeader title="Upcoming Events" to="/events" />
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 pt-1 -mx-4 px-4">
                {upcomingEvents.map((event) => (
                  event.id === featuredEventId ? (
                    <div key={event.id} className="shrink-0">
                      <div className="flex items-center gap-1 gradient-brand text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-glow mb-1.5 w-fit">
                        <Sparkles size={8} /> Featured
                      </div>
                      <Link to="/events" className="block rounded-card ring-1 ring-brand-light/50 shadow-glow">
                        <EventCard event={event} compact />
                      </Link>
                    </div>
                  ) : (
                    <Link key={event.id} to="/events" className="shrink-0 rounded-card self-end">
                      <EventCard event={event} compact />
                    </Link>
                  )
                ))}
              </div>
            </div>
          );
        }

        if (sectionId === "tribe") {
          return wrapSection(<TribeActivityStrip key={sectionId} />);
        }

        if (sectionId === "community") {
          return wrapSection(
            <div className="mb-6">
              <SectionHeader title="From the Community" to="/community" />
              <div className="flex flex-col gap-3">
                {latestThreads.map((thread) => (
                  <ThreadPreviewCard key={thread.id} thread={thread} />
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}

      {showBirthday && <BirthdayModal name={user.name} email={user.email} onClose={() => setShowBirthday(false)} />}
      {!showBirthday && showTour && <FeatureTourModal userEmail={user.email} onClose={handleCloseTour} />}
      {!showBirthday && !showTour && showNotifOptIn && <NotificationOptInModal onClose={handleCloseNotifOptIn} />}
    </div>
  );
}
