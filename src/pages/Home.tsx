import { Activity, Bell, Calendar, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Dumbbell, Flame, Gift, GripVertical, Info, Mail, MessageCircle, Moon, Music, PenSquare, Play, Rss, Salad, Share2, Sparkles, Sun, Sunrise, Utensils, Video, Waves, X } from "lucide-react";

import { fetchYesterdayWinner } from "../utils/wellCup";
import { Capacitor } from "@capacitor/core";
import { RateApp } from "capacitor-rate-app";
import { logEvent, startSessionTracking } from "../utils/analytics";
import { useEffect, useRef, useState } from "react";
import WellCupShareCard from "../components/WellCupShareCard";
import Confetti from "../components/ui/Confetti";
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
const DEFAULT_SECTION_ORDER: SectionId[] = ["daily-plan", "weekly-theme", "inspiration", "tribe", "community", "events", "well-cup"];
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
  const { user, threads, blockedUserIds, inspirations, events, notifications, featuredEventId, currentWeeklyTheme } = useApp();
  const visibleThreads = threads.filter((t) => !blockedUserIds.includes(t.authorId));
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
  const latestThreads = getTrendingThreads(visibleThreads, 2, 1);

  const [showBirthday, setShowBirthday] = useState(false);
  const [showNotifOptIn, setShowNotifOptIn] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showWalkthroughPrompt, setShowWalkthroughPrompt] = useState(
    () => !localStorage.getItem("well-walkthrough-seen-v1")
  );
  const [showWalkthroughVideo, setShowWalkthroughVideo] = useState(false);
  const [winnerBanner, setWinnerBanner] = useState<{ name: string; avatar: string | null; total_points: number; win_date: string } | null>(null);
  const [showWinShare, setShowWinShare] = useState(false);
  const [showMonthlyWinShare, setShowMonthlyWinShare] = useState(false);
  const [monthlyWinBanner, setMonthlyWinBanner] = useState<{ pts: number; monthLabel: string; dismissKey: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streakBanner, setStreakBanner] = useState<{ streak: number; bonus: number } | null>(null);
  const [headerStreak, setHeaderStreak] = useState<number | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  const resolveLayout = (raw: string): string => ({ dashboard: "exercise", together: "community", community: "connection" }[raw] ?? raw);
  const [homeLayout, setHomeLayout] = useState(() => resolveLayout(localStorage.getItem("well-home-layout") ?? "classic"));
  useEffect(() => {
    const onLayoutChange = () => {
      setHomeLayout(resolveLayout(localStorage.getItem("well-home-layout") ?? "classic"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
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

  const sectionOrderRef = useRef<HTMLDivElement>(null);

  const moveSectionUp = (id: SectionId) => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      localStorage.setItem("well-section-order-v1", JSON.stringify(next));
      return next;
    });
  };

  const moveSectionDown = (id: SectionId) => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      localStorage.setItem("well-section-order-v1", JSON.stringify(next));
      return next;
    });
  };

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
    if (!user.ratingPromptPending || !user.email) return;
    const timer = setTimeout(async () => {
      try { await RateApp.requestReview(); } catch { /* web preview */ }
      fetch(`${API_URL}/api/members/clear-rating-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      }).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [user.ratingPromptPending, user.email]);

  useEffect(() => {
    const key = "well-notifications-onboarding-v1";
    if (localStorage.getItem(key)) return;
    // Skip on Android native - Notification API is unavailable there (web push not supported in Capacitor WebView)
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android" && typeof Notification === "undefined") return;
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
          // Prompt for a rating at 7-day and 30-day streak milestones — once per milestone.
          const streak = s.current_streak;
          if (streak === 7 || streak === 30) {
            const ratingKey = `well-rating-prompted-${streak}`;
            if (!localStorage.getItem(ratingKey)) {
              localStorage.setItem(ratingKey, "1");
              setTimeout(() => RateApp.requestReview(), 2500);
            }
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

  // Check if this user recently won the monthly WELL Cup (show share banner once per winning month)
  useEffect(() => {
    if (!user.lastMonthlyWinAt || !user.lastMonthlyWinPts) return;
    const winDate = new Date(user.lastMonthlyWinAt);
    const ageMs = Date.now() - winDate.getTime();
    if (ageMs > 60 * 24 * 60 * 60 * 1000) return;
    const winMonth = `${winDate.getFullYear()}-${String(winDate.getMonth() + 1).padStart(2, "0")}`;
    const dismissKey = `well-cup-monthly-banner-${winMonth}`;
    if (localStorage.getItem(dismissKey)) return;
    const monthLabel = winDate.toLocaleString("default", { month: "long", year: "numeric" });
    setMonthlyWinBanner({ pts: user.lastMonthlyWinPts, monthLabel, dismissKey });
    const confettiKey = `well-cup-confetti-monthly-${winMonth}`;
    if (!localStorage.getItem(confettiKey)) {
      localStorage.setItem(confettiKey, "1");
      setShowConfetti(true);
    }
  }, [user.lastMonthlyWinAt, user.lastMonthlyWinPts]);

  // Check if this user won yesterday's daily WELL Cup (confetti on first open after win)
  useEffect(() => {
    if (!user.lastDailyWinAt || !user.lastDailyWinPts) return;
    const winDate = new Date(user.lastDailyWinAt);
    const ageMs = Date.now() - winDate.getTime();
    if (ageMs > 36 * 60 * 60 * 1000) return; // only within 36h of win
    const winDay = winDate.toISOString().slice(0, 10);
    const confettiKey = `well-cup-confetti-daily-${winDay}`;
    if (!localStorage.getItem(confettiKey)) {
      localStorage.setItem(confettiKey, "1");
      setShowConfetti(true);
    }
  }, [user.lastDailyWinAt, user.lastDailyWinPts]);

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
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />

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

      {/* Monthly WELL Cup win banner */}
      {monthlyWinBanner && (
        <div className="rounded-card mb-4 border border-purple-400/40 overflow-hidden" style={{ background: "rgba(167,139,250,0.07)" }}>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-2xl shrink-0">👑</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-purple-300">You won the {monthlyWinBanner.monthLabel} WELL Cup!</p>
              <p className="text-xs text-purple-400/70">{monthlyWinBanner.pts.toLocaleString()} points — you led the entire community.</p>
            </div>
            <button
              onClick={() => setShowMonthlyWinShare(true)}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-purple-300 bg-purple-400/10 border border-purple-400/30 rounded-pill px-3 py-1.5"
            >
              <Share2 size={12} />
              Share
            </button>
            <button
              onClick={() => {
                localStorage.setItem(monthlyWinBanner.dismissKey, "1");
                setMonthlyWinBanner(null);
              }}
              className="shrink-0 text-text-dim p-1"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {showMonthlyWinShare && monthlyWinBanner && (
        <WellCupShareCard
          winner={{ name: user.name, avatar: user.avatar || null, total_points: monthlyWinBanner.pts }}
          period="monthly"
          periodLabel={`${monthlyWinBanner.monthLabel} Winner`}
          onClose={() => {
            setShowMonthlyWinShare(false);
            localStorage.setItem(monthlyWinBanner.dismissKey, "1");
            setMonthlyWinBanner(null);
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
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const plan = user.goalPlan ? getDailyPlan(user.goalPlan, dayOfYear) : null;
        const hour = new Date().getHours();

        // ── FOCUS LAYOUT ───────────────────────────────────────────────────────
        if (homeLayout === "focus") {
          const defaultBig = links.slice(0, 4).map((l) => l.id);
          const activeBigIds = focusBigIds.length === 4 ? focusBigIds : defaultBig;
          const bigLinks = links.filter((l) => activeBigIds.includes(l.id));
          const smallLinks = links.filter((l) => !activeBigIds.includes(l.id));

          // Bug fix: toggle works directly on state; initialization happens on picker open
          const toggleFocusSection = (id: string) => {
            setFocusBigIds((prev) => {
              if (prev.includes(id)) return prev.filter((x) => x !== id);
              if (prev.length < 4) return [...prev, id];
              return prev;
            });
          };

          const saveFocusPicker = () => {
            localStorage.setItem("well-focus-shortcuts-v1", JSON.stringify(focusBigIds));
            setShowFocusPicker(false);
          };

          if (showFocusPicker) {
            const remaining = 4 - focusBigIds.length;
            return (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-text">Choose your 4 featured sections</p>
                  <button
                    onClick={saveFocusPicker}
                    disabled={focusBigIds.length !== 4}
                    className="text-xs font-semibold text-brand-light disabled:opacity-40"
                  >
                    {focusBigIds.length === 4 ? "Done" : `${remaining} more to go`}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {links.map(({ id, label, icon: Icon }) => {
                    const selected = focusBigIds.includes(id);
                    const disabled = !selected && focusBigIds.length >= 4;
                    return (
                      <button
                        key={id}
                        onClick={() => toggleFocusSection(id)}
                        disabled={disabled}
                        className={`flex flex-col items-center gap-1.5 transition-opacity ${disabled ? "opacity-30" : ""}`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative ${selected ? "gradient-brand shadow-glow" : "bg-surface-2 border border-border"}`}>
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
                    setFocusBigIds(activeBigIds);
                    setShowFocusPicker(true);
                  }}
                  className="text-[11px] font-semibold text-brand-light border border-brand-light/40 rounded-pill px-3 py-1.5"
                >
                  Customize
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {bigLinks.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="flex flex-col items-center justify-center gap-3 glass-card rounded-card py-7">
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

        // ── EXERCISE LAYOUT ────────────────────────────────────────────────────
        if (homeLayout === "exercise") {
          const weekStart = new Date();
          weekStart.setHours(0, 0, 0, 0);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekStartStr = weekStart.toISOString().split("T")[0];
          const workoutsThisWeek = [...new Set([...workoutLog, ...resistanceLog])].filter((d) => d >= weekStartStr).length;
          const weeklyGoal = 4;
          const cardioDone = (() => { try { return localStorage.getItem(`well-cardio-${today}`) === "1"; } catch { return false; } })();
          const strengthDone = (() => { try { return localStorage.getItem(`well-resistance-${today}`) === "1"; } catch { return false; } })();
          const exStretchDone = stretchingLog.includes(today) || localStorage.getItem(`well-stretching-${today}`) === "1";

          // Energy out: BMR × activity factor + step burn + exercise cals
          const exerciseCals = (() => {
            try { return parseInt(localStorage.getItem(`well-exercise-cals-${today}`) ?? "0", 10) || 0; } catch { return 0; }
          })();
          const energyOut = (user.heightCm && user.weightKg && user.age) ? (() => {
            const base = (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * user.age);
            const bmr = user.gender === "male" ? base + 5 : user.gender === "female" ? base - 161 : base - 78;
            const stepKcal = homeSteps ? Math.round(homeSteps * user.weightKg * 0.00057) : 0;
            const tdee = Math.round(bmr * 1.2) + stepKcal + exerciseCals;
            return (tdee >= 800 && tdee <= 4500) ? tdee : null;
          })() : null;

          return (
            <div className="mb-6">
              {/* Top stats: Energy Out, Cardio, Strength */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="rounded-2xl px-3 py-3 flex flex-col gap-1 border" style={{ background: "rgba(20,184,166,0.10)", borderColor: "rgba(20,184,166,0.30)" }}>
                  <Activity size={14} className="text-teal-400" />
                  <span className="text-base font-extrabold text-teal-300 leading-none">
                    {energyOut != null ? `${energyOut.toLocaleString()}` : "—"}
                  </span>
                  <span className="text-[10px] text-teal-400/80 leading-tight">Energy out<br /><span className="text-teal-400/50">kcal est.</span></span>
                </div>
                <div className={`rounded-2xl px-3 py-3 flex flex-col gap-1 border ${cardioDone ? "" : ""}`} style={{ background: cardioDone ? "rgba(34,197,94,0.12)" : "rgba(251,146,60,0.10)", borderColor: cardioDone ? "rgba(34,197,94,0.35)" : "rgba(251,146,60,0.30)" }}>
                  <Flame size={14} className={cardioDone ? "text-green-400" : "text-orange-400"} />
                  <span className={`text-base font-extrabold leading-none ${cardioDone ? "text-green-300" : "text-orange-300"}`}>
                    {cardioDone ? "Done" : "0"}
                  </span>
                  <span className={`text-[10px] leading-tight ${cardioDone ? "text-green-400/80" : "text-orange-400/80"}`}>Cardio</span>
                </div>
                <div className={`rounded-2xl px-3 py-3 flex flex-col gap-1 border`} style={{ background: strengthDone ? "rgba(139,92,246,0.14)" : "rgba(59,130,246,0.09)", borderColor: strengthDone ? "rgba(139,92,246,0.40)" : "rgba(59,130,246,0.25)" }}>
                  <Dumbbell size={14} className={strengthDone ? "text-purple-400" : "text-blue-400"} />
                  <span className={`text-base font-extrabold leading-none ${strengthDone ? "text-purple-300" : "text-blue-300"}`}>
                    {strengthDone ? "Done" : "0"}
                  </span>
                  <span className={`text-[10px] leading-tight ${strengthDone ? "text-purple-400/80" : "text-blue-400/80"}`}>Strength</span>
                </div>
              </div>

              {/* Second row: Steps + Stretching */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-2xl px-3 py-3 flex items-center gap-3 border" style={{ background: "rgba(59,130,246,0.09)", borderColor: "rgba(59,130,246,0.25)" }}>
                  <Activity size={18} className="text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-base font-extrabold text-blue-300 leading-none">{homeSteps != null ? homeSteps.toLocaleString() : "—"}</p>
                    <p className="text-[10px] text-blue-400/70 mt-0.5">Steps today</p>
                  </div>
                </div>
                <div className="rounded-2xl px-3 py-3 flex items-center gap-3 border" style={{ background: exStretchDone ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.04)", borderColor: exStretchDone ? "rgba(34,197,94,0.30)" : "rgba(255,255,255,0.10)" }}>
                  <Waves size={18} className={exStretchDone ? "text-green-400 shrink-0" : "text-text-dim shrink-0"} />
                  <div className="min-w-0">
                    <p className={`text-base font-extrabold leading-none ${exStretchDone ? "text-green-300" : "text-text-dim"}`}>{exStretchDone ? "Done" : "—"}</p>
                    <p className={`text-[10px] mt-0.5 ${exStretchDone ? "text-green-400/70" : "text-text-dim"}`}>Stretching</p>
                  </div>
                </div>
              </div>

              {/* Weekly workout progress */}
              <div className="glass-card rounded-card px-4 py-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell size={13} className="text-brand-light" />
                    <span className="text-xs font-semibold text-text">Workouts this week</span>
                  </div>
                  <span className="text-xs font-bold text-brand-light">{workoutsThisWeek} of {weeklyGoal}</span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: weeklyGoal }).map((_, i) => (
                    <div key={i} className={`h-2 flex-1 rounded-full transition-all ${i < workoutsThisWeek ? "gradient-brand" : "bg-surface-2 border border-border"}`} />
                  ))}
                </div>
              </div>

              {/* Today's fitness plan */}
              {plan && (
                <Link to="/wellness?tab=activities" className="block glass-card rounded-card px-4 py-3 mb-3 border border-brand-light/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-light">Today's Focus</span>
                    <ChevronRight size={13} className="text-text-dim" />
                  </div>
                  <p className="text-sm font-bold text-text mb-1">{plan.title}</p>
                  <div className="flex flex-col gap-1">
                    {plan.tasks.slice(0, 2).map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-light mt-1.5 shrink-0" />
                        <p className="text-[11px] text-text-muted leading-tight">{t}</p>
                      </div>
                    ))}
                  </div>
                </Link>
              )}

              {/* Quick nav */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {links.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-xl gradient-brand shadow-glow flex items-center justify-center">
                      <Icon size={19} className="text-white" />
                    </div>
                    <span className="text-[10px] text-text-muted text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        // ── NUTRITION LAYOUT ───────────────────────────────────────────────────
        if (homeLayout === "nutrition") {
          const cals = homeMacros ? Math.round(homeMacros.calories) : 0;
          const calGoal = 2000;
          const calPct = Math.min(100, Math.round((cals / calGoal) * 100));

          return (
            <div className="mb-6">
              {/* Macro summary card */}
              <div className="glass-card rounded-card px-4 py-4 mb-3 border border-green-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Salad size={14} className="text-green-400" />
                    <span className="text-xs font-bold text-text">Today's Nutrition</span>
                  </div>
                  <Link to="/nutrition" className="text-[10px] text-brand-light font-semibold flex items-center gap-1">
                    + Log meal <ChevronRight size={10} />
                  </Link>
                </div>
                {homeMacros ? (
                  <>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-2xl font-extrabold text-text leading-none">{cals.toLocaleString()}</span>
                      <span className="text-xs text-text-dim mb-0.5">/ {calGoal.toLocaleString()} kcal</span>
                    </div>
                    <div className="h-2 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="h-2 rounded-full bg-green-500 transition-all duration-500" style={{ width: `${calPct}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Protein", val: Math.round(homeMacros.protein), unit: "g", color: "text-blue-300" },
                        { label: "Carbs", val: Math.round(homeMacros.carbs), unit: "g", color: "text-yellow-300" },
                        { label: "Fat", val: Math.round(homeMacros.fat), unit: "g", color: "text-orange-300" },
                      ].map(({ label, val, unit, color }) => (
                        <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <p className={`text-base font-bold leading-none ${color}`}>{val}<span className="text-[10px] font-normal text-text-dim">{unit}</span></p>
                          <p className="text-[10px] text-text-dim mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-3 gap-2">
                    <p className="text-sm text-text-muted">No meals logged yet today.</p>
                    <Link to="/nutrition" className="gradient-brand text-white text-xs font-semibold px-4 py-2 rounded-pill shadow-glow">
                      + Log your first meal
                    </Link>
                  </div>
                )}
              </div>

              {/* Today's recipe */}
              <Link to="/nutrition#nutrition-recipe" className="flex items-center gap-4 glass-card rounded-card px-4 py-3 mb-3 border border-border">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
                  <Utensils size={20} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text">Today's Recipe</p>
                  <p className="text-[11px] text-text-muted">This week's featured healthy recipe</p>
                </div>
                <ChevronRight size={14} className="text-text-dim shrink-0" />
              </Link>

              {/* Meal plan link */}
              <Link to="/nutrition/meal-plan" className="flex items-center gap-4 glass-card rounded-card px-4 py-3 mb-3 border border-border">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}>
                  <Calendar size={20} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text">Meal Plan</p>
                  <p className="text-[11px] text-text-muted">Plan and prep this week's meals</p>
                </div>
                <ChevronRight size={14} className="text-text-dim shrink-0" />
              </Link>

              {/* Compact quick nav */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {links.filter((l) => l.id !== "nutrition").map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center">
                      <Icon size={16} className="text-text-dim" />
                    </div>
                    <span className="text-[10px] text-text-dim text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        // ── FLOW LAYOUT ────────────────────────────────────────────────────────
        if (homeLayout === "flow") {
          const timeBlock = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
          const bwDone = breathworkLog.includes(today);

          const blocks = [
            {
              id: "morning",
              Icon: Sunrise,
              label: "Morning",
              color: "rgba(251,191,36,0.12)",
              border: "rgba(251,191,36,0.30)",
              iconColor: "text-yellow-400",
              headline: "Morning ritual",
              sub: "Breathwork · Daily focus · Set your intention",
              to: "/wellness?tab=activities",
              done: bwDone,
            },
            {
              id: "afternoon",
              Icon: Sun,
              label: "Afternoon",
              color: "rgba(59,130,246,0.10)",
              border: "rgba(59,130,246,0.28)",
              iconColor: "text-blue-400",
              headline: "Tribe check-in",
              sub: "Connect with your tribe · Send a cheer · Encourage someone",
              to: "/tribe",
              done: false,
            },
            {
              id: "evening",
              Icon: Moon,
              label: "Evening",
              color: "rgba(99,102,241,0.12)",
              border: "rgba(99,102,241,0.30)",
              iconColor: "text-indigo-400",
              headline: "Wind-down",
              sub: "Gentle stretch · Sleep prep · Log your day",
              to: "/wellness?tab=workout",
              done: false,
            },
          ];
          const current = blocks.find((b) => b.id === timeBlock) ?? blocks[0];
          const others = blocks.filter((b) => b.id !== timeBlock);

          return (
            <div className="mb-6">
              {/* Current time block — hero */}
              <Link to={current.to} className="block rounded-card px-5 py-6 mb-4 border" style={{ background: current.color, borderColor: current.border }}>
                <div className="flex items-center gap-2 mb-3">
                  <current.Icon size={16} className={current.iconColor} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${current.iconColor}`}>Right Now · {current.label}</span>
                  {current.done && <CheckCircle2 size={14} className="text-brand-light ml-auto" />}
                </div>
                <p className="text-xl font-extrabold text-text mb-2">{current.headline}</p>
                <p className="text-sm text-text-muted">{current.sub}</p>
              </Link>

              {/* Other time blocks */}
              <p className="text-xs font-semibold uppercase tracking-widest text-text-dim mb-3 px-1">Also today</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {others.map((b) => (
                  <Link key={b.id} to={b.to} className="rounded-card px-4 py-4 border" style={{ background: b.color, borderColor: b.border }}>
                    <div className="flex items-center gap-2 mb-2">
                      <b.Icon size={16} className={b.iconColor} />
                      <span className={`text-xs font-bold ${b.iconColor}`}>{b.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-text mb-1">{b.headline}</p>
                    <p className="text-xs text-text-dim leading-snug">{b.sub}</p>
                  </Link>
                ))}
              </div>

              {/* Compact nav strip */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {links.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl bg-surface-2 border border-border flex items-center justify-center">
                      <Icon size={18} className="text-text-dim" />
                    </div>
                    <span className="text-xs text-text-dim text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        // ── INSPIRE LAYOUT ─────────────────────────────────────────────────────
        if (homeLayout === "inspire") {
          return (
            <div className="mb-6">
              {/* Hero inspiration quote */}
              {todaysInspiration && (
                <Link to="/inspirations" className="block rounded-card px-5 py-6 mb-3" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.22) 100%)", border: "1px solid rgba(139,92,246,0.30)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-3">Today's Inspiration</p>
                  <p className="text-base font-bold text-text leading-snug mb-3">{todaysInspiration.title}</p>
                  {todaysInspiration.body && (
                    <p className="text-[11px] text-purple-300/80 leading-relaxed line-clamp-3">{todaysInspiration.body}</p>
                  )}
                </Link>
              )}

              {/* Weekly theme card */}
              {currentWeeklyTheme && (
                <div className="glass-card rounded-card px-4 py-3 mb-3 border border-brand-light/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-light mb-1">This Week's Theme</p>
                  <p className="text-sm font-bold text-text">{currentWeeklyTheme.title}</p>
                  {currentWeeklyTheme.body && (
                    <p className="text-[11px] text-text-muted mt-1 leading-tight line-clamp-2">{currentWeeklyTheme.body}</p>
                  )}
                </div>
              )}

              {/* Featured class CTA */}
              <Link to="/videos" className="flex items-center gap-4 glass-card rounded-card px-4 py-3 mb-3">
                <div className="w-12 h-12 rounded-xl gradient-brand shadow-glow flex items-center justify-center shrink-0">
                  <Play size={20} className="text-white ml-0.5" fill="white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-light mb-0.5">Featured Class</p>
                  <p className="text-sm font-bold text-text">Browse Today's Classes</p>
                </div>
                <ChevronRight size={14} className="text-text-dim shrink-0" />
              </Link>

              {/* WELL Activity */}
              <Link to="/wellness?tab=activities" className="flex items-center gap-4 glass-card rounded-card px-4 py-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)" }}>
                  <Sparkles size={20} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Daily Activity</p>
                  <p className="text-sm font-bold text-text">Today's WELL Activity</p>
                </div>
                <ChevronRight size={14} className="text-text-dim shrink-0" />
              </Link>

              {/* Motivational Music */}
              <Link to="/music" className="flex items-center gap-4 glass-card rounded-card px-4 py-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.28)" }}>
                  <Music size={20} className="text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-0.5">Music</p>
                  <p className="text-sm font-bold text-text">Motivational Playlist</p>
                </div>
                <ChevronRight size={14} className="text-text-dim shrink-0" />
              </Link>

              {/* Minimal nav strip */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {links.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center">
                      <Icon size={16} className="text-text-dim" />
                    </div>
                    <span className="text-[10px] text-text-dim text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        // ── CALM LAYOUT (stress reduction) ─────────────────────────────────────
        if (homeLayout === "calm") {
          return (
            <div className="mb-6">
              {/* Today's inspiration hero */}
              {todaysInspiration && (
                <Link to="/inspirations" className="block rounded-card px-5 py-5 mb-3" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.18) 100%)", border: "1px solid rgba(139,92,246,0.28)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2">Today's Inspiration</p>
                  <p className="text-sm font-bold text-text leading-snug mb-2">{todaysInspiration.title}</p>
                  {todaysInspiration.body && (
                    <p className="text-[11px] text-purple-300/70 leading-relaxed line-clamp-2">{todaysInspiration.body}</p>
                  )}
                </Link>
              )}

              {/* Calm toolkit */}
              <Link to="/wellness?tab=activities" className="flex items-center gap-4 glass-card rounded-card px-4 py-4 mb-3 border border-blue-500/20">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.28)" }}>
                  <Waves size={22} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-0.5">Calm Toolkit</p>
                  <p className="text-sm font-bold text-text">Daily breathwork & calming activity</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Guided breathing · Affirmations · Grounding</p>
                </div>
                <ChevronRight size={14} className="text-text-dim shrink-0" />
              </Link>

              {/* Motivational sounds */}
              <Link to="/music?tab=sounds" className="flex items-center gap-4 glass-card rounded-card px-4 py-4 mb-3 border border-indigo-500/20">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)" }}>
                  <Waves size={22} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Peaceful Sounds</p>
                  <p className="text-sm font-bold text-text">Ambient & motivational sounds</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Rain · Forest · Ocean · Focus tones</p>
                </div>
                <ChevronRight size={14} className="text-text-dim shrink-0" />
              </Link>

              {/* Motivational music */}
              <Link to="/music" className="flex items-center gap-4 glass-card rounded-card px-4 py-4 mb-3 border border-orange-500/20">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.28)" }}>
                  <Music size={22} className="text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-0.5">Music</p>
                  <p className="text-sm font-bold text-text">Calm & motivational playlist</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Hand-curated music to reset your mind</p>
                </div>
                <ChevronRight size={14} className="text-text-dim shrink-0" />
              </Link>

              {/* Compact nav strip */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {links.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center">
                      <Icon size={16} className="text-text-dim" />
                    </div>
                    <span className="text-[10px] text-text-dim text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        }

        // ── CONNECTION LAYOUT ───────────────────────────────────────────────────
        if (homeLayout === "connection") {
          const communityPosts = getTrendingThreads(visibleThreads, 2, 1);
          return (
            <div className="mb-6">
              {/* Action row */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <Link
                  to="/community/new"
                  className="flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow"
                >
                  <PenSquare size={15} />
                  New Post
                </Link>
                <Link
                  to="/messages"
                  className="flex items-center justify-center gap-2 glass-card text-text text-sm font-semibold rounded-pill py-3 border border-border"
                >
                  <Mail size={15} />
                  Messages
                </Link>
              </div>

              {/* Recent posts */}
              {communityPosts.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-text">Recent Posts</h2>
                    <Link to="/community" className="text-xs text-brand-light font-semibold">See all</Link>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {communityPosts.map((thread) => (
                      <ThreadPreviewCard key={thread.id} thread={thread} />
                    ))}
                  </div>
                </div>
              )}

              {/* WELL Tribe — 3×2 grid with cheer/card actions built in */}
              <TribeActivityStrip grid maxCount={6} />
            </div>
          );
        }

        // ── CLASSIC (default) ──────────────────────────────────────────────────
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

      <div ref={sectionOrderRef}>
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
              <>
                <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center text-text-dim cursor-grab" style={{ width: 36 }}>
                  <GripVertical size={22} />
                </div>
                <div className="absolute right-0 top-0 bottom-0 z-10 flex flex-col items-center justify-center gap-0" style={{ width: 36 }}>
                  <button
                    onPointerDown={(e) => { e.preventDefault(); moveSectionUp(sectionId); }}
                    className="w-9 h-9 flex items-center justify-center text-text-dim active:text-brand-light"
                  >
                    <ChevronUp size={20} />
                  </button>
                  <button
                    onPointerDown={(e) => { e.preventDefault(); moveSectionDown(sectionId); }}
                    className="w-9 h-9 flex items-center justify-center text-text-dim active:text-brand-light"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              </>
            )}
            <div className={editMode ? "px-10" : ""}>{content}</div>
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
              <InspirationCard inspiration={todaysInspiration} compact to="/inspirations" />
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
          if (homeLayout === "connection") return null;
          return wrapSection(<TribeActivityStrip key={sectionId} />);
        }

        if (sectionId === "community") {
          if (homeLayout === "connection") return null;
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
      </div>

      {showBirthday && <BirthdayModal name={user.name} email={user.email} onClose={() => setShowBirthday(false)} />}
      {!showBirthday && showTour && <FeatureTourModal userEmail={user.email} onClose={handleCloseTour} />}
      {!showBirthday && !showTour && showNotifOptIn && <NotificationOptInModal onClose={handleCloseNotifOptIn} />}
    </div>
  );
}
