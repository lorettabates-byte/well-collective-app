import {
  Activity, BookOpen, Calendar, CheckCircle2, Dumbbell, MapPin,
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

  // Count how many of the 6 grid categories are done
  const gridDoneCount = CHECKIN_GRID.filter((item) =>
    item.maps.some((m) => doneTypes.has(m))
  ).length;

  return (
    <div>
      <TopBar title="WELL Check" subtitle="Your daily progress + tomorrow's challenges" icon={Activity} iconColor="#84D8FD" showBack />

      <div className="px-4 pt-4 pb-8 flex flex-col gap-5">

        {/* Today's Check-In — 6-category grid */}
        <div className="glass-card rounded-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-3">Today's Check-In</p>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-[3px] rounded-full bg-white/8">
              <div
                className="h-[3px] rounded-full transition-all duration-500"
                style={{
                  width: `${(gridDoneCount / CHECKIN_GRID.length) * 100}%`,
                  background: "linear-gradient(90deg, #2a6dd9, #5ba3f5)",
                }}
              />
            </div>
            <span className="text-xs font-semibold text-brand-light shrink-0">{gridDoneCount} of {CHECKIN_GRID.length}</span>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            {CHECKIN_GRID.map((item) => {
              const done = item.maps.some((m) => doneTypes.has(m));
              return (
                <div key={item.key} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center border"
                    style={done
                      ? { background: "rgba(42,109,217,0.25)", borderColor: "#5ba3f5" }
                      : { background: "transparent", borderColor: "rgba(255,255,255,0.15)" }
                    }
                  >
                    {done && <div className="w-2 h-2 rounded-full" style={{ background: "#5ba3f5" }} />}
                  </div>
                  <span className={`text-xs font-semibold truncate ${done ? "text-text" : "text-text-dim"}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Detailed activity list — what was actually logged */}
          {!loading && activities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
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
            <p className="text-xs text-text-dim text-center mt-3">
              Complete activities throughout the day — they'll show up here.
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
