import {
  Bell,
  Calendar,
  Heart,
  MessageCircle,
  Music,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

interface Slide {
  icon: LucideIcon;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    title: "Welcome to WELL Collective 💙",
    body: "This is your home base for community, classes, and a little daily inspiration. Let's take a quick look around.",
  },
  {
    icon: MessageCircle,
    title: "Community",
    body: "Post, reply, and share photos in Community — and add people to your WELL Tribe to cheer them on with direct messages.",
  },
  {
    icon: Waves,
    title: "Classes & Wellness",
    body: "Browse Classes for guided videos, and check Wellness for breathwork and nutrition to support you day to day.",
  },
  {
    icon: Music,
    title: "Music",
    body: "Loretta has made songs just for you and your encouragement — only available here on the WELL App.",
  },
  {
    icon: Calendar,
    title: "Inspirations & Events",
    body: "A new inspiration lands every week, plus daily notes to keep you motivated. Don't miss upcoming Events too.",
  },
  {
    icon: Bell,
    title: "Notifications & Profile",
    body: "The bell keeps you up to date on new posts and replies. Head to your Profile to adjust what you get notified about.",
  },
];

export default function FeatureTourModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 animate-fade-in-up">
      <div className="relative w-full max-w-sm gradient-brand p-[1px] rounded-card">
        <div className="bg-surface rounded-card p-6 flex flex-col items-center text-center gap-3 animate-pop-in">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted"
            aria-label="Skip"
          >
            <Heart size={14} />
          </button>

          <div className="w-14 h-14 rounded-full gradient-brand shadow-glow flex items-center justify-center mb-1">
            <Icon size={26} className="text-white" />
          </div>

          <h2 className="text-lg font-bold text-text">{slide.title}</h2>
          <p className="text-sm text-text-muted leading-relaxed min-h-[60px]">{slide.body}</p>

          <div className="flex items-center gap-1.5 my-1">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-5 gradient-brand" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2 w-full mt-1">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 text-sm font-semibold text-text-muted border border-border rounded-pill py-2.5"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
              className="flex-1 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow"
            >
              {isLast ? "Get Started!" : "Next"}
            </button>
          </div>

          {!isLast && (
            <button onClick={onClose} className="text-xs text-text-dim mt-1">
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
