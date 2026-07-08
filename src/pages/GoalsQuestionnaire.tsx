import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useApp } from "../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

type GoalPlan = "energy" | "weight" | "strength" | "rut" | "stress" | "community";
type NotifTone = "motivation" | "accountability" | "gentle" | "education";
type MovementTarget = "sedentary" | "light" | "moderate" | "active";

interface Answers {
  goalPlan: GoalPlan | null;
  notificationTone: NotifTone | null;
  movementTarget: MovementTarget | null;
  notifTimes: { send7am: boolean; send3pm: boolean; send9pm: boolean };
}

const GOAL_OPTIONS: { value: GoalPlan; label: string; emoji: string; desc: string }[] = [
  { value: "energy",    label: "Boost my energy",       emoji: "⚡", desc: "Feel less tired and more alive every day" },
  { value: "weight",    label: "Manage my weight",       emoji: "🌿", desc: "Build healthy habits that actually stick" },
  { value: "strength",  label: "Build strength & tone",  emoji: "💪", desc: "Get stronger through movement I enjoy" },
  { value: "rut",       label: "Break out of a rut",     emoji: "🔄", desc: "Shake things up and feel inspired again" },
  { value: "stress",    label: "Manage stress better",   emoji: "🧘", desc: "Find calm and build resilience" },
  { value: "community", label: "Connect & be inspired",  emoji: "💙", desc: "Be part of something bigger than myself" },
];

const CHALLENGE_OPTIONS: { value: NotifTone; label: string; emoji: string; desc: string }[] = [
  { value: "motivation",     label: "Staying motivated",     emoji: "🔥", desc: "I start strong but lose steam" },
  { value: "accountability", label: "Being consistent",       emoji: "📅", desc: "I need someone to keep me on track" },
  { value: "gentle",         label: "Being too hard on myself", emoji: "🌸", desc: "I need encouragement, not pressure" },
  { value: "education",      label: "Knowing where to start", emoji: "🗺️", desc: "I want guidance and structure" },
];

const ACTIVITY_OPTIONS: { value: MovementTarget; label: string; emoji: string; desc: string }[] = [
  { value: "sedentary", label: "Mostly sitting",      emoji: "🪑", desc: "Desk job, not much movement right now" },
  { value: "light",     label: "Light movement",      emoji: "🚶", desc: "Some walks, occasional activity" },
  { value: "moderate",  label: "Moderately active",   emoji: "🏃", desc: "Working out 2–3×/week already" },
  { value: "active",    label: "Already very active", emoji: "🏆", desc: "Regular training, ready to level up" },
];

const NOTIF_OPTIONS = [
  { key: "send7am" as const, label: "Morning",   emoji: "🌅", desc: "7am daily nudge" },
  { key: "send3pm" as const, label: "Afternoon", emoji: "☀️",  desc: "3pm check-in" },
  { key: "send9pm" as const, label: "Evening",   emoji: "🌙", desc: "9pm wind-down reminder" },
];

function OptionCard<T extends string>({
  value, label, emoji, desc, selected, onSelect,
}: {
  value: T; label: string; emoji: string; desc: string; selected: boolean; onSelect: (v: T) => void;
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
      <span className="text-2xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${selected ? "text-white" : "text-text"}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${selected ? "text-white/80" : "text-text-muted"}`}>{desc}</p>
      </div>
      {selected && <Check size={16} className="text-white shrink-0" />}
    </button>
  );
}

export default function GoalsQuestionnaire({ onComplete }: { onComplete: () => void }) {
  const { user, updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    goalPlan: null,
    notificationTone: null,
    movementTarget: null,
    notifTimes: { send7am: true, send3pm: false, send9pm: true },
  });

  const canAdvance =
    (step === 0 && answers.goalPlan !== null) ||
    (step === 1 && answers.notificationTone !== null) ||
    (step === 2 && answers.movementTarget !== null) ||
    step === 3;

  const handleFinish = async () => {
    if (!user.email || saving) return;
    setSaving(true);
    try {
      // Persist goal answers to server via members/sync
      await fetch(`${API_URL}/api/members/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...user,
          email: user.email,
          goalPlan: answers.goalPlan,
          notificationTone: answers.notificationTone,
          movementTarget: answers.movementTarget,
          goalsCompleted: true,
        }),
      });
      // Also persist notification schedule
      await fetch(`${API_URL}/api/members/notification-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          notificationSchedule: answers.notifTimes,
        }),
      });
      updateProfile({
        goalPlan: answers.goalPlan!,
        notificationTone: answers.notificationTone!,
        movementTarget: answers.movementTarget!,
        goalsCompleted: true,
        notificationSchedule: answers.notifTimes,
      });
      onComplete();
    } catch {
      // Still complete locally even if network fails
      updateProfile({
        goalPlan: answers.goalPlan!,
        notificationTone: answers.notificationTone!,
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
      sub: "We'll personalize your daily plan around this.",
      content: (
        <div className="flex flex-col gap-2.5">
          {GOAL_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              value={o.value}
              label={o.label}
              emoji={o.emoji}
              desc={o.desc}
              selected={answers.goalPlan === o.value}
              onSelect={(v) => setAnswers((a) => ({ ...a, goalPlan: v }))}
            />
          ))}
        </div>
      ),
    },
    {
      q: "What's your biggest challenge?",
      sub: "Your check-ins will match your tone.",
      content: (
        <div className="flex flex-col gap-2.5">
          {CHALLENGE_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              value={o.value}
              label={o.label}
              emoji={o.emoji}
              desc={o.desc}
              selected={answers.notificationTone === o.value}
              onSelect={(v) => setAnswers((a) => ({ ...a, notificationTone: v }))}
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
              label={o.label}
              emoji={o.emoji}
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
          {NOTIF_OPTIONS.map(({ key, label, emoji, desc }) => {
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
                <span className="text-2xl shrink-0">{emoji}</span>
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
    <div className="fixed inset-0 z-50 bg-surface flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-safe pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-3 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "gradient-brand" : "bg-border"}`}
            />
          ))}
        </div>
        <p className="text-xs text-text-dim uppercase tracking-widest font-semibold mb-1">
          Question {step + 1} of {steps.length}
        </p>
        <h2 className="text-xl font-extrabold text-text leading-tight">{current.q}</h2>
        <p className="text-sm text-text-muted mt-1">{current.sub}</p>
      </div>

      {/* Options */}
      <div className="flex-1 px-5 pb-4 overflow-y-auto">{current.content}</div>

      {/* CTA */}
      <div className="px-5 pb-safe pb-6 pt-3 shrink-0 border-t border-border bg-surface">
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
            "Let's go! 💙"
          )}
        </button>
      </div>
    </div>
  );
}
