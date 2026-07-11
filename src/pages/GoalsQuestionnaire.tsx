import type { ReactNode } from "react";
import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  Compass,
  Dumbbell,
  Footprints,
  Heart,
  Leaf,
  Monitor,
  Moon,
  RefreshCw,
  Sunrise,
  Sun,
  Trophy,
  Users,
  Wind,
  Zap,
} from "lucide-react";
import { useApp } from "../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

type GoalPlan = "energy" | "weight" | "strength" | "rut" | "stress" | "community";
type NotifTone = "motivation" | "accountability" | "gentle" | "education";
type MovementTarget = "sedentary" | "light" | "moderate" | "active";

interface Answers {
  goalPlan: GoalPlan[];
  notificationTone: NotifTone[];
  movementTarget: MovementTarget | null;
  notifTimes: { send7am: boolean; send3pm: boolean; send9pm: boolean };
}

const GOAL_OPTIONS: { value: GoalPlan; icon: ReactNode; label: string; desc: string }[] = [
  { value: "energy",    icon: <Zap size={20} />,       label: "Boost my energy",       desc: "Feel less tired and more alive every day" },
  { value: "weight",    icon: <Leaf size={20} />,      label: "Manage my weight",       desc: "Build healthy habits that actually stick" },
  { value: "strength",  icon: <Dumbbell size={20} />,  label: "Build strength & tone",  desc: "Get stronger through movement I enjoy" },
  { value: "rut",       icon: <RefreshCw size={20} />, label: "Break out of a rut",     desc: "Shake things up and feel inspired again" },
  { value: "stress",    icon: <Wind size={20} />,      label: "Manage stress better",   desc: "Find calm and build resilience" },
  { value: "community", icon: <Users size={20} />,     label: "Connect & be inspired",  desc: "Be part of something bigger than myself" },
];

const CHALLENGE_OPTIONS: { value: NotifTone; icon: ReactNode; label: string; desc: string }[] = [
  { value: "motivation",     icon: <Zap size={20} />,          label: "Staying motivated",       desc: "I start strong but lose steam" },
  { value: "accountability", icon: <CalendarCheck size={20} />, label: "Being consistent",        desc: "I need someone to keep me on track" },
  { value: "gentle",         icon: <Heart size={20} />,         label: "Being too hard on myself", desc: "I need encouragement, not pressure" },
  { value: "education",      icon: <Compass size={20} />,       label: "Knowing where to start",  desc: "I want guidance and structure" },
];

const ACTIVITY_OPTIONS: { value: MovementTarget; icon: ReactNode; label: string; desc: string }[] = [
  { value: "sedentary", icon: <Monitor size={20} />,   label: "Mostly sitting",      desc: "Desk job, not much movement right now" },
  { value: "light",     icon: <Footprints size={20} />, label: "Light movement",      desc: "Some walks, occasional activity" },
  { value: "moderate",  icon: <Activity size={20} />,   label: "Moderately active",   desc: "Working out 2–3× per week already" },
  { value: "active",    icon: <Trophy size={20} />,     label: "Already very active", desc: "Regular training, ready to level up" },
];

const NOTIF_OPTIONS: { key: "send7am" | "send3pm" | "send9pm"; icon: ReactNode; label: string; desc: string }[] = [
  { key: "send7am", icon: <Sunrise size={20} />, label: "Morning",   desc: "7 am daily nudge" },
  { key: "send3pm", icon: <Sun size={20} />,     label: "Afternoon", desc: "3 pm check-in" },
  { key: "send9pm", icon: <Moon size={20} />,    label: "Evening",   desc: "9 pm wind-down reminder" },
];

// Shared card used for both single-select and multi-select options
function OptionCard<T extends string>({
  value, icon, label, desc, selected, onSelect,
}: {
  value: T; icon: ReactNode; label: string; desc: string; selected: boolean; onSelect: (v: T) => void;
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={`w-full text-left rounded-card p-4 border transition-all flex items-center gap-3 ${
        selected
          ? "gradient-brand border-transparent shadow-glow"
          : "bg-surface-2 border-border"
      }`}
    >
      <span className={`shrink-0 ${selected ? "text-white" : "text-brand-light"}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${selected ? "text-white" : "text-text"}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${selected ? "text-white/80" : "text-text-muted"}`}>{desc}</p>
      </div>
      {selected && <Check size={16} className="text-white shrink-0" />}
    </button>
  );
}

export default function GoalsQuestionnaire({ onComplete, onSkip }: { onComplete: () => void; onSkip?: () => void }) {
  const { user, updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    goalPlan: [],
    notificationTone: [],
    movementTarget: null,
    notifTimes: { send7am: true, send3pm: false, send9pm: true },
  });

  const canAdvance =
    (step === 0 && answers.goalPlan.length > 0) ||
    (step === 1 && answers.notificationTone.length > 0) ||
    (step === 2 && answers.movementTarget !== null) ||
    step === 3;

  function toggleMulti<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  const handleFinish = async () => {
    if (!user.email || saving) return;
    setSaving(true);
    // Send primary selection to server; additional selections are a UX enhancement
    const primaryGoal = answers.goalPlan[0] ?? null;
    const primaryTone = answers.notificationTone[0] ?? null;
    try {
      await fetch(`${API_URL}/api/members/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...user,
          email: user.email,
          goalPlan: primaryGoal,
          notificationTone: primaryTone,
          movementTarget: answers.movementTarget,
          goalsCompleted: true,
        }),
      });
      await fetch(`${API_URL}/api/members/notification-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          notificationSchedule: answers.notifTimes,
        }),
      });
      updateProfile({
        goalPlan: primaryGoal!,
        notificationTone: primaryTone!,
        movementTarget: answers.movementTarget!,
        goalsCompleted: true,
        notificationSchedule: answers.notifTimes,
      });
      onComplete();
    } catch {
      updateProfile({
        goalPlan: primaryGoal!,
        notificationTone: primaryTone!,
        movementTarget: answers.movementTarget!,
        goalsCompleted: true,
      });
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      q: "What are you here for?",
      sub: "Select all that apply — we'll build your plan around these.",
      content: (
        <div className="flex flex-col gap-2.5">
          {GOAL_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              value={o.value}
              icon={o.icon}
              label={o.label}
              desc={o.desc}
              selected={answers.goalPlan.includes(o.value)}
              onSelect={(v) => setAnswers((a) => ({ ...a, goalPlan: toggleMulti(a.goalPlan, v) }))}
            />
          ))}
        </div>
      ),
    },
    {
      q: "What's your biggest challenge?",
      sub: "Select all that apply — your check-ins will reflect these.",
      content: (
        <div className="flex flex-col gap-2.5">
          {CHALLENGE_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              value={o.value}
              icon={o.icon}
              label={o.label}
              desc={o.desc}
              selected={answers.notificationTone.includes(o.value)}
              onSelect={(v) => setAnswers((a) => ({ ...a, notificationTone: toggleMulti(a.notificationTone, v) }))}
            />
          ))}
        </div>
      ),
    },
    {
      q: "How active are you right now?",
      sub: "Helps us set the right starting point.",
      content: (
        <div className="flex flex-col gap-2.5">
          {ACTIVITY_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              value={o.value}
              icon={o.icon}
              label={o.label}
              desc={o.desc}
              selected={answers.movementTarget === o.value}
              onSelect={(v) => setAnswers((a) => ({ ...a, movementTarget: v }))}
            />
          ))}
        </div>
      ),
    },
    {
      q: "When do you want your check-ins?",
      sub: "Pick as many as you'd like.",
      content: (
        <div className="flex flex-col gap-2.5">
          {NOTIF_OPTIONS.map(({ key, icon, label, desc }) => {
            const on = answers.notifTimes[key];
            return (
              <button
                key={key}
                onClick={() =>
                  setAnswers((a) => ({
                    ...a,
                    notifTimes: { ...a.notifTimes, [key]: !on },
                  }))
                }
                className={`w-full text-left rounded-card p-4 border transition-all flex items-center gap-3 ${
                  on ? "gradient-brand border-transparent shadow-glow" : "bg-surface-2 border-border"
                }`}
              >
                <span className={`shrink-0 ${on ? "text-white" : "text-brand-light"}`}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${on ? "text-white" : "text-text"}`}>{label}</p>
                  <p className={`text-xs mt-0.5 ${on ? "text-white/80" : "text-text-muted"}`}>{desc}</p>
                </div>
                {on && <Check size={16} className="text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    // Use 100dvh (dynamic viewport height) so the layout fits correctly on
    // mobile browsers where URL bars resize the viewport, and add min-h-0 to
    // the scroll section so it never pushes the CTA button off-screen.
    <div
      className="fixed inset-0 z-[200] bg-surface flex flex-col"
      style={{ height: "100dvh" }}
    >
      {/* Header */}
      <div className="px-5 pt-safe pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-3 mb-5">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "gradient-brand" : "bg-border"}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-text-dim uppercase tracking-widest font-semibold">
            Question {step + 1} of {steps.length}
          </p>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-text-muted hover:text-text transition-colors"
            >
              Skip
            </button>
          )}
        </div>
        <h2 className="text-xl font-extrabold text-text leading-tight">{current.q}</h2>
        <p className="text-sm text-text-muted mt-1">{current.sub}</p>
      </div>

      {/* Options — only this section scrolls; min-h-0 prevents it from
          overflowing and pushing the CTA below the visible area */}
      <div className="flex-1 min-h-0 px-5 pb-4 overflow-y-auto">{current.content}</div>

      {/* CTA — always visible at bottom; inline paddingBottom ensures the
          button clears the iOS home indicator bar on devices without a home
          button, even if the pb-safe utility class isn't applied */}
      <div
        className="px-5 pt-3 shrink-0 border-t border-border bg-surface"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          disabled={!canAdvance || saving}
          onClick={() => {
            if (step < steps.length - 1) setStep((s) => s + 1);
            else handleFinish();
          }}
          className="w-full gradient-brand text-white font-bold rounded-pill py-3.5 shadow-glow flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {step < steps.length - 1 ? (
            <>Next <ArrowRight size={16} /></>
          ) : saving ? (
            "Saving…"
          ) : (
            "Let's go"
          )}
        </button>
      </div>
    </div>
  );
}
