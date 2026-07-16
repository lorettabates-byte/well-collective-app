import {
  Activity, BarChart3, BookOpen, Calendar, CheckCircle2, Dumbbell, Flame, Footprints, Home, Lock,
  MapPin, MessageSquare, Moon, Music, PenLine, PieChart, Salad, Smartphone, Sparkles,
  Star, Target, TrendingUp, UserPlus, Video, Wind, X, Zap,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { logActivity } from "../utils/wellCup";
import { useApp } from "../store/AppContext";
import { useSectionTracking } from "../hooks/useSectionTracking";
import { todayISO } from "../utils/format";
import { syncWellCheckWidget } from "../utils/wellCheckWidget";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface ActivitySummary {
  type: string;
  points: number;
  count: number;
}

type HistoryRange = "week" | "month" | "year";
type HistoryMetric = "wellAreas" | "sleepHours" | "energyOut" | "energyIn" | "steps";

interface ActivityHistoryDay {
  date: string;
  totalPoints: number;
  activities: ActivitySummary[];
  energyIn?: number;
  energyOut?: number | null;
  sleepHours?: number | null;
  steps?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  wellAreas?: number;
}

interface ActivityHistoryResponse {
  range: HistoryRange;
  days: ActivityHistoryDay[];
  totals: {
    totalPoints: number;
    completedDays: number;
    activityCounts: ActivitySummary[];
    averages?: {
      sleepHours?: number | null;
      energyIn?: number | null;
      energyOut?: number | null;
      steps?: number | null;
      wellAreas?: number | null;
    };
  };
}

interface HistoryChartPoint {
  key: string;
  title: string;
  label: string;
  subLabel: string;
  days: ActivityHistoryDay[];
  totalPoints: number;
  activeDays: number;
  wellAreas: number;
  sleepHours: number | null;
  energyIn: number;
  energyOut: number | null;
  steps: number;
  protein: number;
  carbs: number;
  fat: number;
  topActivity: string;
}

const ACTIVITY_LABELS: Record<string, string> = {
  app_open: "Opened the app",
  forum_post: "Posted in the community",
  forum_comment: "Commented in community",
  class_watch: "Watched a class",
  song_play: "Listened to music",
  blog_open: "Read the blog",
  meal_log: "Logged a meal",
  sleep_log: "Logged sleep",
  breathwork: "Completed daily breathwork",
  breathwork_extended: "Completed extended breathwork",
  breathwork_calm_kit: "Used a Calm Toolkit tool",
  stretching: "Did stretching",
  resistance_training: "Resistance training",
  cardio: "Cardio",
  well_activity: "WELL activity",
  event_attend: "Attended an event",
  well_escape: "Attended a WELL Escape",
  tribe_add: "Added a tribe member",
  daily_challenge_accept: "Accepted a challenge",
  steps: "Logged daily steps",
};

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  app_open: Smartphone,
  forum_post: PenLine,
  forum_comment: MessageSquare,
  class_watch: Video,
  song_play: Music,
  blog_open: BookOpen,
  meal_log: Salad,
  sleep_log: Moon,
  breathwork: Wind,
  breathwork_extended: Wind,
  breathwork_calm_kit: Wind,
  stretching: Activity,
  resistance_training: Dumbbell,
  cardio: TrendingUp,
  well_activity: Zap,
  event_attend: Calendar,
  well_escape: MapPin,
  tribe_add: UserPlus,
  daily_challenge_accept: Target,
  steps: Footprints,
};

// 6 fixed wellness categories shown in the check-in grid
const CHECKIN_GRID = [
  { key: "workout",    label: "Workout",    Icon: Dumbbell,  maps: ["resistance_training", "cardio"] },
  { key: "sleep",      label: "Sleep",      Icon: Moon,      maps: ["sleep_log"] },
  { key: "nutrition",  label: "Nutrition",  Icon: Salad,     maps: ["meal_log"] },
  { key: "breathwork", label: "Breathwork", Icon: Wind,      maps: ["breathwork", "breathwork_extended", "breathwork_calm_kit"] },
  { key: "stretching", label: "Stretching", Icon: Activity,  maps: ["stretching"] },
  { key: "mindset",    label: "Mindset",    Icon: Sparkles,  maps: ["class_watch", "blog_open", "well_activity", "breathwork_calm_kit"] },
];

const HISTORY_RANGES: { id: HistoryRange; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

const HISTORY_METRICS: {
  id: HistoryMetric;
  label: string;
  shortLabel: string;
  color: string;
  glow: string;
  Icon: LucideIcon;
}[] = [
  { id: "wellAreas", label: "WELL Areas", shortLabel: "Areas", color: "#84D8FD", glow: "rgba(132,216,253,0.22)", Icon: PieChart },
  { id: "sleepHours", label: "Sleep", shortLabel: "Sleep", color: "#A78BFA", glow: "rgba(167,139,250,0.22)", Icon: Moon },
  { id: "energyOut", label: "Energy Out", shortLabel: "Out", color: "#FB923C", glow: "rgba(251,146,60,0.22)", Icon: Flame },
  { id: "energyIn", label: "Energy In", shortLabel: "In", color: "#34D399", glow: "rgba(52,211,153,0.2)", Icon: Salad },
  { id: "steps", label: "Steps", shortLabel: "Steps", color: "#FACC15", glow: "rgba(250,204,21,0.18)", Icon: Footprints },
];

function parseHistoryDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatHistoryDate(date: string): string {
  return parseHistoryDate(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatHistoryMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function getCoveredCategoryCount(activities: ActivitySummary[]): number {
  const doneTypes = new Set(activities.map((a) => a.type));
  return CHECKIN_GRID.filter((item) => item.maps.some((m) => doneTypes.has(m))).length;
}

function getDayAreaCount(day: ActivityHistoryDay): number {
  return day.wellAreas ?? getCoveredCategoryCount(day.activities);
}

function getTopActivityLabel(activities: ActivitySummary[]): string {
  const top = [...activities].sort((a, b) => b.points - a.points)[0];
  return top ? ACTIVITY_LABELS[top.type] ?? top.type : "No activities";
}

function averagePositive(values: (number | null | undefined)[], places = 0): number | null {
  const filtered = values
    .map((value) => Number(value ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (filtered.length === 0) return null;
  const factor = 10 ** places;
  return Math.round((filtered.reduce((sum, value) => sum + value, 0) / filtered.length) * factor) / factor;
}

function sumMetric(values: (number | null | undefined)[]): number {
  return values.reduce<number>((sum, value) => sum + Number(value ?? 0), 0);
}

function formatHistoryMetric(metric: HistoryMetric, value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "No data";
  if (metric === "sleepHours") return `${Number(value).toFixed(1)}h`;
  if (metric === "energyIn" || metric === "energyOut") return `${Math.round(value).toLocaleString()} kcal`;
  if (metric === "steps") return Math.round(value).toLocaleString();
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function getPointMetricValue(point: HistoryChartPoint, metric: HistoryMetric): number {
  if (metric === "sleepHours") return point.sleepHours ?? 0;
  if (metric === "energyIn") return point.energyIn;
  if (metric === "energyOut") return point.energyOut ?? 0;
  if (metric === "steps") return point.steps;
  return point.wellAreas;
}

function getMetricConfig(metric: HistoryMetric) {
  return HISTORY_METRICS.find((item) => item.id === metric) ?? HISTORY_METRICS[0];
}

function buildMonthlyHistory(days: ActivityHistoryDay[]): HistoryChartPoint[] {
  const monthMap = new Map<string, ActivityHistoryDay[]>();

  for (const day of days) {
    const key = day.date.slice(0, 7);
    const monthDays = monthMap.get(key) ?? [];
    monthDays.push(day);
    monthMap.set(key, monthDays);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, monthDays]) => {
      const date = new Date(`${key}-01T00:00:00`);
      return {
        key,
        title: formatHistoryMonth(key),
        label: date.toLocaleDateString(undefined, { month: "short" }),
        subLabel: date.toLocaleDateString(undefined, { year: "2-digit" }),
        days: monthDays,
        totalPoints: sumMetric(monthDays.map((day) => day.totalPoints)),
        activeDays: monthDays.length,
        wellAreas: averagePositive(monthDays.map(getDayAreaCount), 1) ?? 0,
        sleepHours: averagePositive(monthDays.map((day) => day.sleepHours), 1),
        energyIn: Math.round(averagePositive(monthDays.map((day) => day.energyIn), 0) ?? 0),
        energyOut: averagePositive(monthDays.map((day) => day.energyOut), 0),
        steps: Math.round(averagePositive(monthDays.map((day) => day.steps), 0) ?? 0),
        protein: Math.round(sumMetric(monthDays.map((day) => day.protein))),
        carbs: Math.round(sumMetric(monthDays.map((day) => day.carbs))),
        fat: Math.round(sumMetric(monthDays.map((day) => day.fat))),
        topActivity: getTopActivityLabel(monthDays.flatMap((day) => day.activities)),
      };
    });
}

function buildDailyHistory(days: ActivityHistoryDay[]): HistoryChartPoint[] {
  return [...days]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => {
      const date = parseHistoryDate(day.date);
      return {
        key: day.date,
        title: formatHistoryDate(day.date),
        label: date.toLocaleDateString(undefined, { day: "numeric" }),
        subLabel: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
        days: [day],
        totalPoints: day.totalPoints,
        activeDays: 1,
        wellAreas: getDayAreaCount(day),
        sleepHours: day.sleepHours ?? null,
        energyIn: day.energyIn ?? 0,
        energyOut: day.energyOut ?? null,
        steps: day.steps ?? 0,
        protein: day.protein ?? 0,
        carbs: day.carbs ?? 0,
        fat: day.fat ?? 0,
        topActivity: getTopActivityLabel(day.activities),
      };
    });
}

// MET (Metabolic Equivalent of Task) values from the Compendium of Physical
// Activities (Ainsworth et al., 2011) — the standard reference used in
// exercise science and clinical research for estimating energy expenditure.
// Since the app logs "did you do X today" rather than a timer, each entry
// also carries a typical session length so the estimate has something
// concrete to multiply against.
const ACTIVITY_MET: Record<string, { met: number; minutes: number }> = {
  resistance_training: { met: 5.0, minutes: 40 }, // Compendium: resistance training, moderate effort
  cardio: { met: 7.0, minutes: 30 },               // Compendium: aerobic/cardio exercise, general
  class_watch:        { met: 6.5, minutes: 40 },   // Compendium: dance/aerobics class (Zumba ~6.5)
  breathwork: { met: 1.3, minutes: 10 },           // Compendium: meditation / breathing exercises
  stretching: { met: 2.3, minutes: 15 },           // Compendium: stretching, mild effort
  well_activity: { met: 2.8, minutes: 20 },        // light-moderate general wellness activity
};

// ACSM formula: kcal burned = MET x 3.5 x weight(kg) / 200 x minutes.
function metCalories(met: number, minutes: number, weightKg: number, count: number): number {
  return ((met * 3.5 * weightKg) / 200) * minutes * count;
}

// Calories per step, derived from the same MET formula applied to walking
// (MET 3.5) at an average cadence of ~100 steps/min — consistent with
// Harvard Health Publishing's widely cited estimate of ~0.04 kcal/step for a
// 70kg (154lb) adult walking at a moderate pace, scaled linearly by weight.
const KCAL_PER_STEP_PER_KG = 0.00057;

interface Challenge {
  id: string;
  title: string;
  description: string;
  pts: number;
  Icon: LucideIcon;
}

const ALL_CHALLENGES: (Challenge & { requiresAbsence?: string; requiresPoorSleep?: boolean })[] = [
  { id: "resistance", Icon: Dumbbell,  title: "Strength Session",  description: "Complete a resistance training workout tomorrow",       pts: 20, requiresAbsence: "resistance_training" },
  { id: "breathwork", Icon: Wind,      title: "Mindful Breathing", description: "Spend 10 minutes on breathwork to start the day",       pts: 15, requiresAbsence: "breathwork" },
  { id: "stretching", Icon: Activity,  title: "Stretch It Out",    description: "Complete your full stretching routine",                 pts: 15, requiresAbsence: "stretching" },
  { id: "sleep",      Icon: Moon,      title: "Rest & Recharge",   description: "Aim for 7–9 hours of quality sleep tonight",           pts: 10, requiresPoorSleep: true },
  { id: "meal_log",   Icon: Salad,     title: "Fuel Your Body",    description: "Log every meal tomorrow to track your nutrition",       pts: 10, requiresAbsence: "meal_log" },
  { id: "class_watch",Icon: Video,     title: "Take a Class",      description: "Watch at least one wellness class video",              pts: 20, requiresAbsence: "class_watch" },
  { id: "community",  Icon: PenLine,   title: "Connect & Share",   description: "Post or comment in the community",                     pts: 10, requiresAbsence: "forum_post" },
  { id: "well_activity",Icon: Zap,     title: "WELL Activity",     description: "Complete tomorrow's daily WELL Activity",              pts: 15, requiresAbsence: "well_activity" },
  { id: "tribe",      Icon: UserPlus,  title: "Grow Your Tribe",   description: "Add one new member to your WELL Tribe",               pts: 5,  requiresAbsence: "tribe_add" },
];

function getDailySummary(
  doneTypes: Set<string>,
  sleepData: { hours: number; quality: string } | null,
): { positive: string; improve: string } {
  let positive = "You showed up today! Opening the app is step one — and you did it. We're proud of you.";

  if (doneTypes.has("well_escape")) {
    positive = "You attended a WELL Escape — that's an extraordinary wellness milestone.";
  } else if (doneTypes.has("event_attend")) {
    positive = "You showed up to an event today. In-person connection is one of the most powerful wellness practices.";
  } else if (doneTypes.has("resistance_training")) {
    positive = "Strength training done! Every rep builds the body and confidence you deserve.";
  } else if (doneTypes.has("cardio")) {
    positive = "Cardio complete — your heart, lungs, and energy levels are all thanking you right now.";
  } else if (doneTypes.has("breathwork")) {
    positive = "Breathwork done — you took time to center yourself today. That kind of intention changes everything.";
  } else if (doneTypes.has("stretching")) {
    positive = "Stretching complete! Flexibility and recovery are just as vital as any hard workout.";
  } else if (doneTypes.has("sleep_log") && sleepData?.quality === "enough") {
    positive = `You logged ${sleepData.hours}h of great sleep last night. Rest is the foundation everything else builds on.`;
  } else if (doneTypes.has("class_watch")) {
    positive = "You invested in yourself by watching a class today. That 10–20 minutes will compound over time.";
  } else if (doneTypes.has("well_activity")) {
    positive = "WELL Activity complete! Daily consistency with small practices transforms your life over months.";
  } else if (doneTypes.has("meal_log")) {
    positive = "Meal logged! Mindful nutrition starts with awareness, and you're actively practicing it.";
  } else if (doneTypes.has("forum_post")) {
    positive = "You shared in the community today — your story and perspective lift others up more than you know.";
  } else if (doneTypes.has("daily_challenge_accept")) {
    positive = "You accepted today's challenge — that kind of commitment to growth is what separates those who change.";
  } else if (doneTypes.has("tribe_add")) {
    positive = "Your WELL Tribe is growing — community is one of the strongest predictors of long-term wellness.";
  } else if (doneTypes.has("song_play")) {
    positive = "Music is medicine — you used it today to fuel your mood and energy.";
  } else if (doneTypes.has("blog_open")) {
    positive = "You read the blog today. Investing 5 minutes in knowledge is investing in yourself.";
  } else if (doneTypes.has("forum_comment")) {
    positive = "You engaged in the community — even one encouraging comment can change the direction of someone's day.";
  }

  let improve = "You're covering all your wellness bases today — carry that same energy into tomorrow!";

  if (!doneTypes.has("sleep_log")) {
    improve = "Log your sleep tonight — it's worth 10 pts and gives you personalized insights each morning.";
  } else if (sleepData && (sleepData.quality === "not_enough" || sleepData.hours < 6)) {
    improve = `You logged ${sleepData.hours}h last night — try a wind-down routine tonight. Breathwork or stretching before bed can help.`;
  } else if (!doneTypes.has("resistance_training") && !doneTypes.has("cardio") && !doneTypes.has("stretching")) {
    improve = "No movement logged yet today — even a 20-minute walk or quick stretch can shift your entire mood and energy.";
  } else if (!doneTypes.has("breathwork")) {
    improve = "Breathwork hasn't been logged today — just 5 minutes lowers cortisol, sharpens focus, and earns 15 pts.";
  } else if (!doneTypes.has("meal_log")) {
    improve = "Logging meals builds nutritional self-awareness over time. Even tracking one meal today is a strong start.";
  } else if (!doneTypes.has("class_watch")) {
    improve = "A wellness class is ready for you — even 10 minutes of focused learning fuels your long-term growth.";
  } else if (!doneTypes.has("forum_post") && !doneTypes.has("forum_comment")) {
    improve = "Share something in the community today — your unique perspective and story inspire people more than you realize.";
  }

  return { positive, improve };
}

function pickChallenges(doneTypes: Set<string>, poorSleep: boolean): Challenge[] {
  const scored = ALL_CHALLENGES.map((c) => {
    let score = 0;
    if (c.requiresAbsence && !doneTypes.has(c.requiresAbsence)) score += 2;
    if (c.requiresPoorSleep && poorSleep) score += 3;
    if (!c.requiresAbsence && !c.requiresPoorSleep) score += 1;
    return { ...c, score };
  }).filter((c) => c.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

export default function WellCheck() {
  useSectionTracking("well-check");
  const { user, notifications } = useApp();
  const today = todayISO();

  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [historyRange, setHistoryRange] = useState<HistoryRange>("week");
  const [history, setHistory] = useState<ActivityHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyMetric, setHistoryMetric] = useState<HistoryMetric>("wellAreas");
  const [selectedHistoryKey, setSelectedHistoryKey] = useState<string | null>(null);

  // Steps
  const [stepsInput, setStepsInput] = useState("");
  const [todaySteps, setTodaySteps] = useState<{ steps: number; points: number } | null>(null);
  const [stepsSubmitting, setStepsSubmitting] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(true);

  // Energy balance — today's meal calorie total
  const [todayCalories, setTodayCalories] = useState(0);
  const [caloriesLoading, setCaloriesLoading] = useState(true);

  const sleepDataRaw = localStorage.getItem(`well-sleep-data-${today}`);
  const sleepData = sleepDataRaw ? (() => { try { return JSON.parse(sleepDataRaw) as { hours: number; quality: string }; } catch { return null; } })() : null;
  const poorSleep = !!(sleepData && (sleepData.quality === "not_enough" || sleepData.hours < 6));

  const [challengeStates, setChallengeStates] = useState<Record<string, "accepted" | "skipped" | null>>(() => {
    try { return JSON.parse(localStorage.getItem(`well-check-challenges-${today}`) ?? "{}"); } catch { return {}; }
  });

  useEffect(() => {
    if (!API_URL || !user.email) { setLoading(false); return; }
    fetch(`${API_URL}/api/activity/today?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : { activities: [], totalPoints: 0 }))
      .then((d) => {
        setActivities(d.activities || []);
        setTotalPoints(d.totalPoints || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.email]);

  useEffect(() => {
    if (!API_URL || !user.email) { setHistoryLoading(false); return; }
    setHistoryLoading(true);
    fetch(`${API_URL}/api/activity/history?email=${encodeURIComponent(user.email)}&range=${historyRange}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ActivityHistoryResponse | null) => setHistory(d))
      .catch(() => setHistory(null))
      .finally(() => setHistoryLoading(false));
  }, [user.email, historyRange]);

  useEffect(() => {
    setSelectedHistoryKey(null);
  }, [historyRange, historyMetric]);

  useEffect(() => {
    if (!API_URL || !user.email) { setStepsLoading(false); return; }
    fetch(`${API_URL}/api/steps/today?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.steps) setTodaySteps({ steps: d.steps, points: d.points ?? 0 }); })
      .catch(() => {})
      .finally(() => setStepsLoading(false));
  }, [user.email]);

  useEffect(() => {
    if (!API_URL || !user.email) { setCaloriesLoading(false); return; }
    fetch(`${API_URL}/api/meals/today?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : { meals: [] }))
      .then((d) => {
        const total = (d.meals as { estimated_calories?: number }[]).reduce(
          (sum, m) => sum + (m.estimated_calories ?? 0), 0
        );
        setTodayCalories(total);
      })
      .catch(() => {})
      .finally(() => setCaloriesLoading(false));
  }, [user.email]);

  const doneTypes = new Set(activities.map((a) => a.type));
  const challenges = pickChallenges(doneTypes, poorSleep);

  const handleAccept = (challenge: Challenge) => {
    const next = { ...challengeStates, [challenge.id]: "accepted" as const };
    setChallengeStates(next);
    localStorage.setItem(`well-check-challenges-${today}`, JSON.stringify(next));
    if (user.email) logActivity(user.email, "daily_challenge_accept", { challengeId: challenge.id }).catch(() => {});
  };

  const handleSkip = (challenge: Challenge) => {
    const next = { ...challengeStates, [challenge.id]: "skipped" as const };
    setChallengeStates(next);
    localStorage.setItem(`well-check-challenges-${today}`, JSON.stringify(next));
  };

  const handleStepsSubmit = async () => {
    if (!API_URL || !user.email || !stepsInput || stepsSubmitting) return;
    const steps = parseInt(stepsInput, 10);
    if (isNaN(steps) || steps < 0) return;
    setStepsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberEmail: user.email, steps }),
      });
      if (res.ok) {
        const data = await res.json() as { points?: number };
        setTodaySteps({ steps, points: data.points ?? 0 });
        setStepsInput("");
      }
    } catch { /* silent */ } finally {
      setStepsSubmitting(false);
    }
  };

  // Exercise calories: MET-based (Compendium of Physical Activities) for
  // each logged workout type, using today's actual count from `activities`.
  const exerciseCalories = user.weightKg
    ? activities.reduce((sum, a) => {
        const def = ACTIVITY_MET[a.type];
        return def ? sum + metCalories(def.met, def.minutes, user.weightKg!, a.count) : sum;
      }, 0)
    : 0;

  // Step calories: see KCAL_PER_STEP_PER_KG above for the source.
  const stepCalories = user.weightKg && todaySteps ? todaySteps.steps * user.weightKg * KCAL_PER_STEP_PER_KG : 0;

  // Mifflin-St Jeor BMR × sedentary baseline (1.2) — exercise and steps are
  // added explicitly above rather than folded into a higher activity
  // multiplier, since we're already counting them individually.
  const baselineCalories = (user.heightCm && user.weightKg && user.age) ? (() => {
    const base = (10 * user.weightKg) + (6.25 * user.heightCm) - (5 * user.age);
    const bmr = user.gender === "male" ? base + 5 : user.gender === "female" ? base - 161 : base - 78;
    return bmr * 1.2;
  })() : null;

  // Prefer the full-day calorie burn synced from HealthKit/Health Connect when available.
  const syncedCalorieBurn = (() => {
    try {
      const raw = localStorage.getItem(`well-health-calories-${today}`);
      return raw ? parseInt(raw, 10) : null;
    } catch { return null; }
  })();
  const tdee = syncedCalorieBurn ?? (baselineCalories !== null ? Math.round(baselineCalories + exerciseCalories + stepCalories) : null);

  // Count how many of the 6 grid categories are done
  const gridDoneCount = CHECKIN_GRID.filter((item) =>
    item.maps.some((m) => doneTypes.has(m))
  ).length;
  const historyDays = history?.days ?? [];
  const historyChartPoints = historyRange === "year" ? buildMonthlyHistory(historyDays) : buildDailyHistory(historyDays);
  const historyMetricConfig = getMetricConfig(historyMetric);
  const maxHistoryValue = Math.max(1, ...historyChartPoints.map((point) => getPointMetricValue(point, historyMetric)));
  const selectedHistoryPoint = historyChartPoints.find((point) => point.key === selectedHistoryKey) ?? historyChartPoints[historyChartPoints.length - 1] ?? null;
  const historyAverages = history?.totals.averages;
  const avgSleep = historyAverages?.sleepHours ?? averagePositive(historyDays.map((day) => day.sleepHours), 1);
  const avgEnergyIn = historyAverages?.energyIn ?? averagePositive(historyDays.map((day) => day.energyIn));
  const avgEnergyOut = historyAverages?.energyOut ?? averagePositive(historyDays.map((day) => day.energyOut));
  const avgSteps = historyAverages?.steps ?? averagePositive(historyDays.map((day) => day.steps));
  const HistoryMetricIcon = historyMetricConfig.Icon;
  const widgetSleepValue = sleepData ? `${sleepData.hours}h` : "--";
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;
  const remainingWidgetAreas = Math.max(CHECKIN_GRID.length - gridDoneCount, 0);
  const widgetReminder = gridDoneCount >= CHECKIN_GRID.length
    ? "Great job - WELL Check complete"
    : !sleepData
      ? "Tap to log sleep"
      : !todaySteps
        ? "Tap to add steps"
        : todayCalories <= 0
          ? "Tap to log energy in"
          : `Tap to finish ${remainingWidgetAreas} area${remainingWidgetAreas === 1 ? "" : "s"}`;

  useEffect(() => {
    const updatedAt = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    syncWellCheckWidget({
      points: `${totalPoints} pts`,
      areas: `${gridDoneCount}/${CHECKIN_GRID.length}`,
      sleep: widgetSleepValue,
      energyIn: todayCalories > 0 ? `In ${todayCalories.toLocaleString()}` : "In --",
      energyOut: tdee !== null ? `Out ${tdee.toLocaleString()}` : "Out --",
      steps: todaySteps ? todaySteps.steps.toLocaleString() : "--",
      updatedAt,
      reminder: widgetReminder,
      unreadCount: unreadNotifications.toString(),
    });
  }, [gridDoneCount, tdee, todayCalories, todaySteps, totalPoints, widgetReminder, widgetSleepValue, unreadNotifications]);

  return (
    <div>
      <TopBar title="WELL Check" subtitle="Your daily progress + tomorrow's challenges" icon={Activity} iconColor="#84D8FD" showBack />

      <div className="px-4 pt-4 pb-8 flex flex-col gap-5">

        {/* Today's Stats — 5-tile grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Points */}
          <div className="glass-card rounded-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Star size={13} className="text-yellow-400 fill-yellow-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Points Today</span>
            </div>
            {loading ? (
              <p className="text-2xl font-extrabold text-brand-light">—</p>
            ) : (
              <p className="text-2xl font-extrabold text-brand-light">{totalPoints}</p>
            )}
            <p className="text-[10px] text-text-muted">WELL Cup points earned</p>
          </div>

          {/* Steps */}
          <div className="glass-card rounded-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Footprints size={13} className="text-brand-light shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Steps</span>
            </div>
            {stepsLoading ? (
              <p className="text-2xl font-extrabold text-brand-light">—</p>
            ) : todaySteps ? (
              <p className="text-2xl font-extrabold text-brand-light">{todaySteps.steps.toLocaleString()}</p>
            ) : (
              <p className="text-lg font-bold text-text-dim">Not logged</p>
            )}
            <p className="text-[10px] text-text-muted">
              {todaySteps ? `+${todaySteps.points} pts earned` : "Log below to earn points"}
            </p>
          </div>

          {/* Energy Out */}
          <div className="glass-card rounded-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame size={13} className="text-brand-light shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Energy Out</span>
            </div>
            {tdee !== null ? (
              <p className="text-2xl font-extrabold text-brand-light">{tdee.toLocaleString()}</p>
            ) : (
              <p className="text-lg font-bold text-text-dim">Add stats</p>
            )}
            <p className="text-[10px] text-text-muted">
              {tdee !== null
                ? syncedCalorieBurn != null ? "kcal synced from tracker" : "kcal estimated today"
                : "height/weight in Profile"}
            </p>
          </div>

          {/* Activities */}
          <div className="glass-card rounded-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 size={13} className="text-brand-light shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Activities</span>
            </div>
            {loading ? (
              <p className="text-2xl font-extrabold text-brand-light">—</p>
            ) : (
              <p className="text-2xl font-extrabold text-brand-light">{gridDoneCount}<span className="text-base text-text-dim font-semibold"> / {CHECKIN_GRID.length}</span></p>
            )}
            <p className="text-[10px] text-text-muted">wellness areas covered</p>
          </div>

          {/* Sleep */}
          <Link to="/wellness?tab=activities" className="glass-card rounded-card p-4 flex flex-col gap-1 col-span-2 active:opacity-80">
            <div className="flex items-center gap-1.5 mb-1">
              <Moon size={13} className="text-brand-light shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Sleep</span>
              <span className="ml-auto text-[10px] text-brand-light font-semibold">Log →</span>
            </div>
            {sleepData ? (
              <div className="flex items-end gap-3">
                <p className="text-2xl font-extrabold text-brand-light leading-none">{sleepData.hours}h</p>
                <p className="text-xs text-text-muted mb-0.5">
                  {sleepData.quality === "enough" ? "Well rested" : sleepData.quality === "not_enough" ? "Could use more" : "Needed a bit more"}
                </p>
              </div>
            ) : (
              <p className="text-lg font-bold text-text-dim">Not logged</p>
            )}
            <p className="text-[10px] text-text-muted">{sleepData ? "Tap to update" : "Tap to log your sleep"}</p>
          </Link>
        </div>

        {/* Today's Activity Log */}
        <div className="glass-card rounded-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-3">Today's Activity Log</p>

          {!loading && activities.length > 0 && (
            <div className="flex flex-col gap-2">
              {activities.map((a) => {
                const Icon = ACTIVITY_ICON[a.type] ?? Activity;
                return (
                  <div key={a.type} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(42,109,217,0.15)", border: "0.5px solid rgba(91,163,245,0.2)" }}>
                      <Icon size={13} className="text-brand-light" />
                    </div>
                    <span className="text-xs text-text flex-1 min-w-0 truncate">
                      {ACTIVITY_LABELS[a.type] ?? a.type}
                      {a.count > 1 && <span className="text-text-dim"> ×{a.count}</span>}
                    </span>
                    <span className="text-xs font-bold text-yellow-400 shrink-0 flex items-center gap-0.5">
                      <Star size={11} className="fill-yellow-400 shrink-0" />
                      +{a.points}
                    </span>
                  </div>
                );
              })}
              {totalPoints > 0 && (
                <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                  <span className="text-xs font-bold text-text">Today's total</span>
                  <span className="text-sm font-bold text-yellow-400 flex items-center gap-1">
                    <Star size={13} className="fill-yellow-400" />
                    {totalPoints} pts
                  </span>
                </div>
              )}
            </div>
          )}

          {!loading && activities.length === 0 && (
            <p className="text-xs text-text-dim text-center">
              Complete activities throughout the day — they'll show up here.
            </p>
          )}
        </div>

        {/* WELL Check History */}
        <div className="glass-card rounded-card p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(42,109,217,0.15)", border: "0.5px solid rgba(91,163,245,0.2)" }}>
                <Calendar size={15} className="text-brand-light" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">History</p>
                <p className="text-xs text-text-muted">
                  {historyRange === "week" ? "Past 7 days" : historyRange === "month" ? "Past 30 days" : "Past 12 months"}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-yellow-400 shrink-0 flex items-center gap-0.5">
              <Star size={11} className="fill-yellow-400" />
              {history?.totals.totalPoints ?? 0} pts
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {HISTORY_RANGES.map((range) => (
              <button
                key={range.id}
                onClick={() => setHistoryRange(range.id)}
                className={`text-xs font-bold rounded-pill py-2 border transition-colors ${
                  historyRange === range.id
                    ? "gradient-brand text-white border-transparent"
                    : "bg-surface-2 border-border text-text-muted"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-card px-3 py-2.5" style={{ background: "rgba(132,216,253,0.08)", border: "0.5px solid rgba(132,216,253,0.18)" }}>
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide">Avg Sleep</p>
              <p className="text-lg font-extrabold text-brand-light">{avgSleep ? `${avgSleep.toFixed(1)}h` : "—"}</p>
            </div>
            <div className="rounded-card px-3 py-2.5" style={{ background: "rgba(251,146,60,0.08)", border: "0.5px solid rgba(251,146,60,0.18)" }}>
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide">Avg Energy Out</p>
              <p className="text-lg font-extrabold text-orange-300">{avgEnergyOut ? Math.round(avgEnergyOut).toLocaleString() : "—"}</p>
            </div>
            <div className="rounded-card px-3 py-2.5" style={{ background: "rgba(52,211,153,0.08)", border: "0.5px solid rgba(52,211,153,0.18)" }}>
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide">Avg Energy In</p>
              <p className="text-lg font-extrabold text-emerald-300">{avgEnergyIn ? Math.round(avgEnergyIn).toLocaleString() : "—"}</p>
            </div>
            <div className="rounded-card px-3 py-2.5" style={{ background: "rgba(250,204,21,0.08)", border: "0.5px solid rgba(250,204,21,0.18)" }}>
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide">Avg Steps</p>
              <p className="text-lg font-extrabold text-yellow-300">{avgSteps ? Math.round(avgSteps).toLocaleString() : "—"}</p>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: historyMetricConfig.glow }}>
                  <HistoryMetricIcon size={15} style={{ color: historyMetricConfig.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text truncate">{historyMetricConfig.label}</p>
                  <p className="text-[11px] text-text-muted">
                    {historyRange === "year" ? "Tap a month for details" : "Tap a day for details"}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-text-dim shrink-0">
                {history?.totals.completedDays ?? 0} active
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
              {HISTORY_METRICS.map((metric) => {
                const Icon = metric.Icon;
                const active = historyMetric === metric.id;
                return (
                  <button
                    key={metric.id}
                    type="button"
                    onClick={() => setHistoryMetric(metric.id)}
                    className="shrink-0 flex items-center gap-1.5 rounded-pill border px-2.5 py-1.5 text-[11px] font-bold transition-colors"
                    style={{
                      borderColor: active ? metric.color : "rgba(91,163,245,0.18)",
                      background: active ? metric.glow : "rgba(15,33,55,0.7)",
                      color: active ? metric.color : "var(--color-text-muted)",
                    }}
                  >
                    <Icon size={12} />
                    {metric.shortLabel}
                  </button>
                );
              })}
            </div>

            {historyLoading ? (
              <p className="text-xs text-text-dim text-center py-8">Loading history...</p>
            ) : historyChartPoints.length === 0 ? (
              <p className="text-xs text-text-dim text-center py-8">
                No WELL Check activity in this range yet.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto pb-1">
                  <div
                    className="h-44 flex items-end gap-1.5 px-0.5"
                    style={{ minWidth: historyRange === "month" ? 560 : historyRange === "year" ? 360 : 260 }}
                  >
                    {historyChartPoints.map((point) => {
                      const value = getPointMetricValue(point, historyMetric);
                      const selected = selectedHistoryPoint?.key === point.key;
                      const barHeight = value > 0 ? Math.max(12, Math.round((value / maxHistoryValue) * 118)) : 5;
                      return (
                        <button
                          key={point.key}
                          type="button"
                          onClick={() => setSelectedHistoryKey(point.key)}
                          className="flex-1 h-full min-w-0 flex flex-col items-center justify-end gap-1.5 group"
                          aria-label={`Show ${historyMetricConfig.label} details for ${point.title}`}
                        >
                          <span className="text-[10px] font-bold text-text-dim opacity-0 group-hover:opacity-100 transition-opacity">
                            {value > 0 ? formatHistoryMetric(historyMetric, value) : ""}
                          </span>
                          <span
                            className="w-full max-w-7 rounded-t-pill border transition-all"
                            style={{
                              height: `${barHeight}px`,
                              background: value > 0 ? historyMetricConfig.color : "rgba(148,163,184,0.18)",
                              borderColor: selected ? "#ffffff" : "rgba(255,255,255,0.08)",
                              boxShadow: selected ? `0 0 0 2px ${historyMetricConfig.glow}` : "none",
                              opacity: selected || value > 0 ? 1 : 0.55,
                            }}
                          />
                          <span className={`text-[10px] font-bold ${selected ? "text-text" : "text-text-dim"}`}>{point.label}</span>
                          <span className="text-[9px] text-text-dim">{point.subLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedHistoryPoint && (
                  <div className="mt-3 rounded-card border border-border bg-surface px-3 py-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text">{selectedHistoryPoint.title}</p>
                        <p className="text-[11px] text-text-muted">
                          {selectedHistoryPoint.activeDays} active {selectedHistoryPoint.activeDays === 1 ? "day" : "days"} • {selectedHistoryPoint.topActivity}
                        </p>
                      </div>
                      <span className="text-xs font-bold shrink-0" style={{ color: historyMetricConfig.color }}>
                        {formatHistoryMetric(historyMetric, getPointMetricValue(selectedHistoryPoint, historyMetric))}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-card bg-surface-2 border border-border px-3 py-2">
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide">WELL Areas</p>
                        <p className="text-sm font-bold text-brand-light">{formatHistoryMetric("wellAreas", selectedHistoryPoint.wellAreas)}</p>
                      </div>
                      <div className="rounded-card bg-surface-2 border border-border px-3 py-2">
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide">Points</p>
                        <p className="text-sm font-bold text-yellow-300">{selectedHistoryPoint.totalPoints.toLocaleString()}</p>
                      </div>
                      <div className="rounded-card bg-surface-2 border border-border px-3 py-2">
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide">Sleep</p>
                        <p className="text-sm font-bold text-violet-300">{formatHistoryMetric("sleepHours", selectedHistoryPoint.sleepHours)}</p>
                      </div>
                      <div className="rounded-card bg-surface-2 border border-border px-3 py-2">
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide">Steps</p>
                        <p className="text-sm font-bold text-yellow-300">{formatHistoryMetric("steps", selectedHistoryPoint.steps)}</p>
                      </div>
                      <div className="rounded-card bg-surface-2 border border-border px-3 py-2">
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide">Energy In</p>
                        <p className="text-sm font-bold text-emerald-300">{formatHistoryMetric("energyIn", selectedHistoryPoint.energyIn)}</p>
                      </div>
                      <div className="rounded-card bg-surface-2 border border-border px-3 py-2">
                        <p className="text-[10px] text-text-dim font-bold uppercase tracking-wide">Energy Out</p>
                        <p className="text-sm font-bold text-orange-300">{formatHistoryMetric("energyOut", selectedHistoryPoint.energyOut)}</p>
                      </div>
                    </div>

                    {(selectedHistoryPoint.protein > 0 || selectedHistoryPoint.carbs > 0 || selectedHistoryPoint.fat > 0) && (
                      <div className="mt-3 rounded-card px-3 py-2.5" style={{ background: "rgba(52,211,153,0.07)", border: "0.5px solid rgba(52,211,153,0.16)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-text-dim mb-2">Logged macros</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-sm font-bold text-text">{Math.round(selectedHistoryPoint.protein)}g</p>
                            <p className="text-[10px] text-text-dim">Protein</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text">{Math.round(selectedHistoryPoint.carbs)}g</p>
                            <p className="text-[10px] text-text-dim">Carbs</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text">{Math.round(selectedHistoryPoint.fat)}g</p>
                            <p className="text-[10px] text-text-dim">Fat</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Native Widget Setup */}
        <div className="glass-card rounded-card p-4 border border-brand-light/15">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(132,216,253,0.12)", border: "0.5px solid rgba(132,216,253,0.25)" }}>
              <Smartphone size={18} className="text-brand-light" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text">WELL Check Widgets</p>
              <p className="text-xs text-text-muted leading-relaxed">
                Native app users can pin a quick WELL Check snapshot to their iPhone Lock Screen, iPhone Home Screen, or Android Home Screen.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-card bg-surface-2 border border-border px-2.5 py-2.5 text-center">
              <Lock size={15} className="text-brand-light mx-auto mb-1" />
              <p className="text-[10px] font-bold text-text leading-tight">iPhone Lock</p>
            </div>
            <div className="rounded-card bg-surface-2 border border-border px-2.5 py-2.5 text-center">
              <Home size={15} className="text-brand-light mx-auto mb-1" />
              <p className="text-[10px] font-bold text-text leading-tight">iPhone Home</p>
            </div>
            <div className="rounded-card bg-surface-2 border border-border px-2.5 py-2.5 text-center">
              <BarChart3 size={15} className="text-brand-light mx-auto mb-1" />
              <p className="text-[10px] font-bold text-text leading-tight">Android Home</p>
            </div>
          </div>
          <p className="text-[11px] text-text-dim mt-3 leading-relaxed">
            After installing the native app, long-press your screen, choose Widgets, then add WELL Check.
          </p>
        </div>

        {/* Step Tracker */}
        <div className="glass-card rounded-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Footprints size={14} className="text-brand-light shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Today's Steps</p>
          </div>
          {!stepsLoading && todaySteps && (
            <div className="flex items-center justify-between mb-3 rounded-card px-3 py-2"
              style={{ background: "rgba(42,109,217,0.1)", border: "0.5px solid rgba(91,163,245,0.2)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-brand-light shrink-0" />
                <span className="text-sm font-bold text-text">{todaySteps.steps.toLocaleString()} steps logged</span>
              </div>
              {todaySteps.points > 0 && (
                <span className="text-xs font-bold text-yellow-400 flex items-center gap-0.5">
                  <Star size={11} className="fill-yellow-400" />
                  +{todaySteps.points} pts
                </span>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="number"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStepsSubmit()}
              placeholder={todaySteps ? "Update today's steps…" : "Enter today's step count…"}
              min={0}
              max={100000}
              className="flex-1 bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
            />
            <button
              onClick={handleStepsSubmit}
              disabled={!stepsInput || stepsSubmitting}
              className="gradient-brand text-white text-xs font-bold rounded-pill px-4 py-2.5 disabled:opacity-40"
            >
              {stepsSubmitting ? "Saving…" : todaySteps ? "Update" : "Log"}
            </button>
          </div>
          <p className="text-[11px] text-text-dim mt-2">1 pt per 1,000 steps — up to 15 pts per day.</p>
        </div>

        {/* Nourishment Balance */}
        <div className="glass-card rounded-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} className="text-orange-400 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Nourishment Balance</p>
          </div>
          {tdee !== null ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-card px-3 py-3 text-center"
                  style={{ background: "rgba(251,146,60,0.08)", border: "0.5px solid rgba(251,146,60,0.2)" }}>
                  <p className="text-[10px] text-text-dim font-semibold mb-1">Energy Out</p>
                  <p className="text-lg font-bold text-orange-300">{tdee.toLocaleString()}</p>
                  <p className="text-[10px] text-text-dim">kcal estimated</p>
                </div>
                <div className="rounded-card px-3 py-3 text-center"
                  style={{ background: "rgba(42,109,217,0.1)", border: "0.5px solid rgba(91,163,245,0.2)" }}>
                  <p className="text-[10px] text-text-dim font-semibold mb-1">Energy In</p>
                  {caloriesLoading ? (
                    <p className="text-lg font-bold text-brand-light">—</p>
                  ) : todayCalories > 0 ? (
                    <p className="text-lg font-bold text-brand-light">{todayCalories.toLocaleString()}</p>
                  ) : (
                    <p className="text-sm font-semibold text-text-dim pt-2">Not tracked</p>
                  )}
                  <p className="text-[10px] text-text-dim">kcal logged</p>
                </div>
              </div>
              {!caloriesLoading && todayCalories > 0 && (
                <div className="rounded-card px-3 py-2 mb-2" style={{ background: "rgba(42,109,217,0.07)" }}>
                  <p className="text-xs text-text-muted text-center">
                    {Math.abs(tdee - todayCalories) < 150
                      ? "Beautifully balanced energy today 🌿"
                      : todayCalories < tdee
                      ? `${(tdee - todayCalories).toLocaleString()} kcal below output — make sure you're fueling enough`
                      : `${(todayCalories - tdee).toLocaleString()} kcal above estimated output — listen to your body`}
                  </p>
                </div>
              )}
              {syncedCalorieBurn == null && (exerciseCalories > 0 || stepCalories > 0) && (
                <p className="text-[11px] text-text-muted mb-2">
                  Includes {Math.round(exerciseCalories + stepCalories).toLocaleString()} kcal from today's logged workouts
                  {stepCalories > 0 ? " and steps" : ""}.
                </p>
              )}
              <p className="text-[11px] text-text-dim leading-relaxed">
                {syncedCalorieBurn != null
                  ? "Energy out synced from Apple Health / Google Health Connect — reflects your actual tracked burn for today."
                  : "Energy out = Mifflin-St Jeor BMR (sedentary baseline) + MET-based workout calories (Compendium of Physical Activities)"}
                + step calories. Log meals with calorie estimates in Nutrition to track intake.
              </p>
            </>
          ) : (
            <p className="text-xs text-text-muted leading-relaxed">
              Add your height, weight, and age in <strong className="text-text">Edit Profile</strong> to unlock your personalized energy balance.
            </p>
          )}
        </div>

        {/* Daily Summary */}
        {!loading && (() => {
          const { positive, improve } = getDailySummary(doneTypes, sleepData);
          return (
            <div className="glass-card rounded-card p-4 flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Daily Summary</p>

              <div className="flex items-start gap-3 rounded-card px-3 py-2.5"
                style={{ background: "rgba(42,109,217,0.1)", border: "0.5px solid rgba(91,163,245,0.25)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(42,109,217,0.2)" }}>
                  <Sparkles size={13} className="text-blue-300" />
                </div>
                <p className="text-xs text-text leading-relaxed">{positive}</p>
              </div>

              <div className="flex items-start gap-3 rounded-card px-3 py-2.5"
                style={{ background: "rgba(30,70,140,0.15)", border: "0.5px solid rgba(91,163,245,0.15)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(42,109,217,0.15)" }}>
                  <TrendingUp size={13} className="text-blue-400" />
                </div>
                <p className="text-xs text-text leading-relaxed">{improve}</p>
              </div>
            </div>
          );
        })()}

        {/* Tomorrow's challenges */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1">Tomorrow's Challenges</p>
          <p className="text-xs text-text-muted mb-3">Small, achievable wins picked just for you.</p>

          <div className="flex flex-col gap-3">
            {challenges.map((c) => {
              const state = challengeStates[c.id];
              const CIcon = c.Icon;
              return (
                <div key={c.id} className={`glass-card rounded-card p-4 transition-opacity ${state ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(42,109,217,0.15)", border: "0.5px solid rgba(91,163,245,0.2)" }}>
                      <CIcon size={17} className="text-brand-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-text">{c.title}</p>
                        <span className="text-xs font-bold text-yellow-400 shrink-0 flex items-center gap-0.5">
                          <Star size={11} className="fill-yellow-400" />
                          {c.pts}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{c.description}</p>
                    </div>
                  </div>

                  {state === "accepted" ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-brand-light">
                        <CheckCircle2 size={14} />
                        Challenge accepted! See you tomorrow.
                      </div>
                      <span className="text-xs font-bold text-yellow-400 shrink-0 flex items-center gap-0.5">
                        <Star size={11} className="fill-yellow-400" />+10
                      </span>
                    </div>
                  ) : state === "skipped" ? (
                    <p className="text-xs text-text-dim">Skipped — maybe next time!</p>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(c)}
                        className="flex-1 gradient-brand text-white text-xs font-bold rounded-pill py-2.5"
                      >
                        I Can Do It! 🙌
                      </button>
                      <button
                        onClick={() => handleSkip(c)}
                        className="flex items-center justify-center gap-1 bg-surface-2 border border-border text-xs text-text-muted font-semibold rounded-pill px-4 py-2.5"
                      >
                        <X size={12} />
                        Maybe Next Time
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-text-dim text-center leading-relaxed px-4">
          Your WELL Check resets every night. Keep showing up — every point counts toward the monthly and yearly crown. 👑
        </p>
      </div>
    </div>
  );
}
