import {
  Activity, BookOpen, Calendar, CheckCircle2, Dumbbell, Flame, Footprints, MapPin,
  MessageSquare, Moon, Music, PenLine, Salad, Smartphone, Sparkles,
  Star, Target, TrendingUp, UserPlus, Video, Wind, X, Zap,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../components/layout/TopBar";
import { logActivity } from "../utils/wellCup";
import { useApp } from "../store/AppContext";
import { useSectionTracking } from "../hooks/useSectionTracking";
import { todayISO } from "../utils/format";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface ActivitySummary {
  type: string;
  points: number;
  count: number;
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
  breathwork: "Completed breathwork",
  stretching: "Did stretching",
  resistance_training: "Resistance training",
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
  stretching: Activity,
  resistance_training: Dumbbell,
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
  { key: "breathwork", label: "Breathwork", Icon: Wind,      maps: ["breathwork"] },
  { key: "stretching", label: "Stretching", Icon: Activity,  maps: ["stretching"] },
  { key: "mindset",    label: "Mindset",    Icon: Sparkles,  maps: ["class_watch", "blog_open", "well_activity"] },
];

// MET (Metabolic Equivalent of Task) values from the Compendium of Physical
// Activities (Ainsworth et al., 2011) — the standard reference used in
// exercise science and clinical research for estimating energy expenditure.
// Since the app logs "did you do X today" rather than a timer, each entry
// also carries a typical session length so the estimate has something
// concrete to multiply against.
const ACTIVITY_MET: Record<string, { met: number; minutes: number }> = {
  resistance_training: { met: 5.0, minutes: 40 }, // Compendium: resistance training, moderate effort
  cardio: { met: 7.0, minutes: 30 },               // Compendium: aerobic/cardio exercise, general
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
  const { user } = useApp();
  const today = todayISO();

  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const tdee = baselineCalories !== null ? Math.round(baselineCalories + exerciseCalories + stepCalories) : null;

  // Count how many of the 6 grid categories are done
  const gridDoneCount = CHECKIN_GRID.filter((item) =>
    item.maps.some((m) => doneTypes.has(m))
  ).length;

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
              {tdee !== null ? "kcal estimated today" : "height/weight in Profile"}
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
          <div className="glass-card rounded-card p-4 flex flex-col gap-1 col-span-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Moon size={13} className="text-brand-light shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Sleep</span>
            </div>
            {sleepData ? (
              <div className="flex items-end gap-3">
                <p className="text-2xl font-extrabold text-brand-light leading-none">{sleepData.hours}h</p>
                <p className="text-xs text-text-muted mb-0.5">
                  {sleepData.quality === "enough" ? "Well rested 🌙" : sleepData.quality === "not_enough" ? "Could use more" : "Needed a bit more"}
                </p>
              </div>
            ) : (
              <p className="text-lg font-bold text-text-dim">Not logged</p>
            )}
            <p className="text-[10px] text-text-muted">{sleepData ? "Logged via Sleep tracker" : "Log via Wellness → Sleep"}</p>
          </div>
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
              {(exerciseCalories > 0 || stepCalories > 0) && (
                <p className="text-[11px] text-text-muted mb-2">
                  Includes {Math.round(exerciseCalories + stepCalories).toLocaleString()} kcal from today's logged workouts
                  {stepCalories > 0 ? " and steps" : ""}.
                </p>
              )}
              <p className="text-[11px] text-text-dim leading-relaxed">
                Energy out = Mifflin-St Jeor BMR (sedentary baseline) + MET-based workout calories (Compendium of Physical Activities)
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
