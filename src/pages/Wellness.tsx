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
  MessageCircle,
  RefreshCw,
  StretchHorizontal,
  Trophy,
  Users,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import ExerciseInfoModal from "../components/ExerciseInfoModal";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { generateWorkout, type WorkoutPlan } from "../data/workoutLibrary";
import { computeBadges, computeStreak } from "../utils/streaks";

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
  const [plan, setPlan] = useState<WorkoutPlan>(() => generateWorkout());
  const [selected, setSelected] = useState<SelectedExercise | null>(null);
  const [wellActivityCompleted, setWellActivityCompleted] = useState(() => {
    const key = `well-activity-${new Date().toISOString().slice(0, 10)}`;
    return localStorage.getItem(key) === "true";
  });
  const [badgesExpanded, setBadgesExpanded] = useState(false);

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

  const messagesPosted = threads.reduce(
    (sum, t) => sum + t.messages.filter((m) => m.authorId === user.id).length,
    0
  );
  const badges = computeBadges(workoutLog, messagesPosted);

  return (
    <div>
      <TopBar title="Wellness" subtitle="Daily workouts, streaks & mindful activities" showBack />
      <div className="px-4 pt-4 flex flex-col gap-6">
        <section>
          <h2 className="text-sm font-bold text-text mb-2">Daily Workout</h2>
          <button
            onClick={() => setPlan(generateWorkout())}
            className="w-full flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 mb-4 shadow-glow"
          >
            <RefreshCw size={16} />
            Generate My Workout
          </button>

          <div className="flex flex-col gap-4">
            <section>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-text mb-2">
                <Flame size={16} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
                Cardio
              </h3>
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
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-text mb-2">
                <Dumbbell size={16} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
                Resistance Training
              </h3>
              <div className="glass-card rounded-card p-4 flex flex-col gap-2.5">
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
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-text mb-2">
                <StretchHorizontal size={16} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
                Stretching
              </h3>
              <div className="glass-card rounded-card p-4 flex flex-col gap-2.5">
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
              <h3 className="text-sm font-bold text-text mb-2">Breathwork</h3>
              <div className="glass-card rounded-card p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
                  <Wind size={18} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-text">{plan.breathwork.name}</h4>
                    <span className="text-xs text-text-dim">{plan.breathwork.duration}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">{plan.breathwork.description}</p>
                </div>
              </div>
            </section>
          </div>

          <button
            onClick={logWorkoutCompletion}
            disabled={completedToday}
            className={`w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-pill py-2.5 mt-4 transition-colors ${
              completedToday
                ? "bg-surface-2 border border-border text-brand-light"
                : "gradient-brand text-white shadow-glow"
            }`}
          >
            <CheckCircle2 size={16} />
            {completedToday ? "Workout Complete for Today ✓" : "Mark Today's Workout Complete"}
          </button>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-text">Your Streak &amp; Badges</h2>
            <button
              onClick={() => setBadgesExpanded(!badgesExpanded)}
              className="flex items-center gap-1 text-xs text-brand-light"
            >
              {badgesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div className="glass-card rounded-card p-4 mb-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-brand shadow-glow flex items-center justify-center shrink-0">
              <Flame size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-text leading-none">
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

        <section>
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-text mb-2">
            <Heart size={16} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
            Well Activity
          </h2>
          <div className="gradient-brand p-[1px] rounded-card">
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
