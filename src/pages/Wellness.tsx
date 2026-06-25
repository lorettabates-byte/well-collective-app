import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Flame,
  Heart,
  Info,
  Lock,
  MessageCircle,
  RefreshCw,
  StretchHorizontal,
  Trophy,
  Users,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import ExerciseInfoModal from "../components/ExerciseInfoModal";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { generateWorkout, type WorkoutPlan } from "../data/workoutLibrary";
import { computeBadges, computeStreak } from "../utils/streaks";
import { getTrialStatus, isActiveMember } from "../utils/trial";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface DailyBreathwork {
  title: string;
  description: string;
  script: string;
  duration: number;
  backgroundSound?: string;
}

interface SelectedExercise {
  name: string;
  meta: string;
  description: string;
}

const BADGE_ICONS: Record<string, LucideIcon> = {
  MessageCircle,
  Users,
  Flame,
  Trophy,
  Award,
};

export default function Wellness() {
  const { user, threads, currentWeeklyTheme, todaysWellActivity, logWorkoutCompletion } = useApp();
  const navigate = useNavigate();
  const trialStatus = getTrialStatus(user.trialEndsAt);
  const isTrialUser = trialStatus.isActive && !isActiveMember() && !user.isAdmin;

  const [plan, setPlan] = useState<WorkoutPlan>(() => generateWorkout());
  const [selected, setSelected] = useState<SelectedExercise | null>(null);
  const [wellActivityCompleted, setWellActivityCompleted] = useState(() => {
    const key = `well-activity-${new Date().toISOString().slice(0, 10)}`;
    return localStorage.getItem(key) === "true";
  });
  const [badgesExpanded, setBadgesExpanded] = useState(false);
  const [workoutLockedMessage, setWorkoutLockedMessage] = useState(false);
  const [dailyBreathwork, setDailyBreathwork] = useState<DailyBreathwork | null>(null);

  const CardioIcon = plan.cardio.icon;

  const workoutLog = user.workoutLog ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const completedToday = workoutLog.includes(today);
  const streak = computeStreak(workoutLog);

  const handleWellActivityComplete = () => {
    const key = `well-activity-${today}`;
    localStorage.setItem(key, "true");
    setWellActivityCompleted(true);
  };

  // Fetch daily breathwork to align with Breathwork feature
  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/breathwork/today`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDailyBreathwork(data);
      })
      .catch((err) => console.error("Failed to load daily breathwork:", err));
  }, []);

  const messagesPosted = threads.reduce(
    (sum, t) => sum + t.messages.filter((m) => m.authorId === user.id).length,
    0
  );
  const badges = computeBadges(workoutLog, messagesPosted);

  return (
    <div>
      <TopBar title="Daily Wellness" subtitle="Workouts, streaks & mindful activities" icon={Waves} iconColor="#84D8FD" showBack />
      <div className="px-4 pt-4 flex flex-col gap-6">
        <section>
          <div className="bg-gradient-to-r from-brand-blue/20 to-brand-light/20 border border-brand-light/30 rounded-2xl p-4 mb-4">
            <h2 className="text-lg font-bold text-text">Daily Workout</h2>
            <p className="text-xs text-text-muted mt-1">Generate and complete your personalized routine</p>
          </div>
          {workoutLockedMessage && (
            <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-card px-3 py-2.5 mb-3">
              <Lock size={14} className="text-brand-light shrink-0" />
              <p className="text-xs text-text-muted">
                The workout generator is available to full members — upgrade to unlock.
              </p>
            </div>
          )}
          <button
            onClick={() => {
              if (isTrialUser) {
                setWorkoutLockedMessage(true);
                setTimeout(() => setWorkoutLockedMessage(false), 3000);
                return;
              }
              setPlan(generateWorkout());
            }}
            className={`w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-pill py-2.5 mb-4 ${
              isTrialUser ? "bg-surface-2 border border-border text-text-dim" : "gradient-brand text-white shadow-glow"
            }`}
          >
            {isTrialUser ? <Lock size={16} /> : <RefreshCw size={16} />}
            GENERATE NEW WORKOUT
          </button>

          <div className="flex flex-col gap-5">
            <section>
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-3 mb-3">
                <h3 className="flex items-center gap-1.5 text-base font-bold text-text">
                  <Flame size={18} className="text-orange-400 drop-shadow-[0_2px_6px_rgba(251,146,60,0.55)]" />
                  Cardio
                </h3>
              </div>
              <a
                href={plan.cardio.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 glass-card rounded-card p-4"
              >
                <div
                  className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0"
                  style={{ backgroundColor: `${plan.cardio.color}22` }}
                >
                  <CardioIcon size={20} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-text">{plan.cardio.title}</h4>
                  <p className="text-xs text-text-muted line-clamp-2">{plan.cardio.description}</p>
                </div>
                <ArrowUpRight size={18} className="text-text-dim shrink-0" />
              </a>
            </section>

            <section>
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-3 mb-3">
                <h3 className="flex items-center gap-1.5 text-base font-bold text-text">
                  <Dumbbell size={18} className="text-blue-400 drop-shadow-[0_2px_6px_rgba(59,130,246,0.55)]" />
                  Resistance Training
                </h3>
              </div>
              <div className="glass-card rounded-card p-4 flex flex-col gap-3">
                {plan.resistance.map((exercise) => (
                  <button
                    key={exercise.name}
                    onClick={() =>
                      setSelected({ name: exercise.name, meta: exercise.sets, description: exercise.description })
                    }
                    className="flex items-center justify-between gap-2 text-left"
                  >
                    <span className="flex items-center gap-1.5 text-sm text-text">
                      {exercise.name}
                      <Info size={13} className="text-brand-light/70 shrink-0" />
                    </span>
                    <span className="text-xs text-text-dim shrink-0">{exercise.sets}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-3 mb-3">
                <h3 className="flex items-center gap-1.5 text-base font-bold text-text">
                  <StretchHorizontal size={18} className="text-purple-400 drop-shadow-[0_2px_6px_rgba(168,85,247,0.55)]" />
                  Stretching
                </h3>
              </div>
              <div className="glass-card rounded-card p-4 flex flex-col gap-3">
                {plan.stretches.map((stretch) => (
                  <button
                    key={stretch.name}
                    onClick={() =>
                      setSelected({ name: stretch.name, meta: stretch.duration, description: stretch.description })
                    }
                    className="flex items-center justify-between gap-2 text-left"
                  >
                    <span className="flex items-center gap-1.5 text-sm text-text">
                      {stretch.name}
                      <Info size={13} className="text-brand-light/70 shrink-0" />
                    </span>
                    <span className="text-xs text-text-dim shrink-0">{stretch.duration}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-xl p-3 mb-3">
                <h3 className="text-base font-bold text-text">Breathwork</h3>
              </div>
              <div className="glass-card rounded-card p-4 flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
                  <Wind size={18} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-text">
                      {dailyBreathwork?.title || plan.breathwork.name}
                    </h4>
                    <span className="text-xs text-text-dim">
                      {dailyBreathwork?.duration ? `${dailyBreathwork.duration} min` : plan.breathwork.duration}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {dailyBreathwork?.description || plan.breathwork.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/music?tab=breathwork")}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-pill py-2.5 gradient-brand text-white shadow-glow hover:opacity-90 transition-colors"
              >
                <Wind size={16} />
                Start Guided Breathwork
              </button>
            </section>
          </div>
        </section>

        <section>
          <div className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 rounded-2xl p-4 mb-4">
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-text">
              <Heart size={18} className="text-pink-400 drop-shadow-[0_2px_6px_rgba(244,114,182,0.55)]" />
              Well Activity
            </h2>
          </div>
          <div className="gradient-brand p-[1px] rounded-card mb-4">
            <div className="bg-surface/95 rounded-card p-4">
              {currentWeeklyTheme && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">
                  This week: {currentWeeklyTheme.title}
                </span>
              )}
              <h3 className="text-base font-bold text-text mt-1.5 mb-1.5">{todaysWellActivity.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{todaysWellActivity.description}</p>
              <button
                onClick={handleWellActivityComplete}
                disabled={wellActivityCompleted}
                className={`w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-pill py-2 mt-3 transition-colors ${
                  wellActivityCompleted
                    ? "bg-surface-2 border border-border text-brand-light"
                    : "gradient-brand text-white"
                }`}
              >
                <CheckCircle2 size={14} />
                {wellActivityCompleted ? "Activity Completed ✓" : "Mark Complete"}
              </button>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <button
              onClick={() => {
                logWorkoutCompletion();
                confetti({ particleCount: 100, spread: 70 });
              }}
              disabled={completedToday}
              className={`flex items-center justify-center gap-2 text-sm font-semibold rounded-pill py-3 px-8 transition-colors ${
                completedToday
                  ? "bg-surface-2 border border-border text-brand-light"
                  : "gradient-brand text-white shadow-glow"
              }`}
            >
              <CheckCircle2 size={16} />
              {completedToday ? "Workout Complete for Today ✓" : "Mark Today's Workout Complete"}
            </button>
          </div>
        </section>

        <section>
          <div className="bg-gradient-to-r from-brand-blue/20 to-brand-light/20 border border-brand-light/30 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text">Your Streak &amp; Badges</h2>
            <button
              onClick={() => setBadgesExpanded(!badgesExpanded)}
              className="flex items-center gap-1 text-xs text-brand-light hover:text-brand-blue transition-colors"
            >
              {badgesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          <div className="glass-card rounded-card p-4 mb-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-brand shadow-glow flex items-center justify-center shrink-0">
              <Flame size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-text leading-none">
                {streak} {streak === 1 ? "day" : "days"}
              </p>
              <p className="text-xs text-text-muted mt-1">Current workout streak — keep it going!</p>
            </div>
          </div>

          <div className={`grid gap-3 transition-all ${badgesExpanded ? "grid-cols-2" : "grid-cols-4"}`}>
            {(badgesExpanded ? badges : badges.slice(0, 4)).map((badge) => {
              const Icon = BADGE_ICONS[badge.icon] ?? Award;
              return (
                <div
                  key={badge.id}
                  className={`glass-card rounded-card p-3 flex flex-col gap-1.5 ${badge.earned ? "" : "opacity-40"}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      badge.earned ? "gradient-brand" : "bg-surface-2 border border-border"
                    }`}
                  >
                    <Icon size={16} className={badge.earned ? "text-white" : "text-text-dim"} />
                  </div>
                  {badgesExpanded && (
                    <>
                      <p className="text-xs font-bold text-text leading-tight">{badge.label}</p>
                      <p className="text-[11px] text-text-dim leading-tight">{badge.description}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {!badgesExpanded && <p className="text-xs text-text-muted mt-2">Click to see all {badges.length} badges</p>}
        </section>
      </div>

      {selected && (
        <ExerciseInfoModal
          name={selected.name}
          meta={selected.meta}
          description={selected.description}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
