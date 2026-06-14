import { ArrowUpRight, Dumbbell, Flame, RefreshCw, StretchHorizontal, Wind } from "lucide-react";
import { useState } from "react";
import TopBar from "../components/layout/TopBar";
import { generateWorkout, type WorkoutPlan } from "../data/workoutLibrary";

export default function Workouts() {
  const [plan, setPlan] = useState<WorkoutPlan>(() => generateWorkout());

  const CardioIcon = plan.cardio.icon;

  return (
    <div>
      <TopBar title="AI Workout Generator" subtitle="Cardio, strength, stretch & breath" showBack />
      <div className="px-4 pt-4">
        <button
          onClick={() => setPlan(generateWorkout())}
          className="w-full flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 mb-5 shadow-glow"
        >
          <RefreshCw size={16} />
          Generate My Workout
        </button>

        <div className="flex flex-col gap-4">
          <section>
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-text mb-2">
              <Flame size={16} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
              Cardio
            </h2>
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
                <h3 className="text-sm font-bold text-text">{plan.cardio.title}</h3>
                <p className="text-xs text-text-muted line-clamp-2">{plan.cardio.description}</p>
              </div>
              <ArrowUpRight size={18} className="text-text-dim shrink-0" />
            </a>
          </section>

          <section>
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-text mb-2">
              <Dumbbell size={16} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
              Resistance Training
            </h2>
            <div className="glass-card rounded-card p-4 flex flex-col gap-2.5">
              {plan.resistance.map((exercise) => (
                <div key={exercise.name} className="flex items-center justify-between">
                  <span className="text-sm text-text">{exercise.name}</span>
                  <span className="text-xs text-text-dim">{exercise.sets}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-text mb-2">
              <StretchHorizontal size={16} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
              Stretching
            </h2>
            <div className="glass-card rounded-card p-4 flex flex-col gap-2.5">
              {plan.stretches.map((stretch) => (
                <div key={stretch.name} className="flex items-center justify-between">
                  <span className="text-sm text-text">{stretch.name}</span>
                  <span className="text-xs text-text-dim">{stretch.duration}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-text mb-2">Breathwork</h2>
            <div className="glass-card rounded-card p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Wind size={18} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text">{plan.breathwork.name}</h3>
                  <span className="text-xs text-text-dim">{plan.breathwork.duration}</span>
                </div>
                <p className="text-xs text-text-muted mt-1">{plan.breathwork.description}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
