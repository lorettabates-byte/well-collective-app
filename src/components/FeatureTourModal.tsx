import {
  Bell,
  Calendar,
  Heart,
  MessageCircle,
  Music,
  ShoppingCart,
  Sparkles,
  User,
  Users,
  Video,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

const PROFILE_PHOTO_DEMO_URL = "https://lorettabates.com/wp-content/uploads/2026/06/DSC_5773.jpg";

interface NavStop {
  icon: LucideIcon;
  label: string;
}

interface Slide {
  icon: LucideIcon;
  title: string;
  body: string;
  // The real nav buttons that lead to this feature, shown as a small
  // "find it here" trail since we don't ship real in-app screenshots —
  // arrows separate steps, e.g. Profile -> WELL Tribe.
  findIt?: NavStop[];
  // Shows the LB-initials-crossfading-into-a-photo demo instead of the
  // static icon circle, to illustrate what adding a profile photo does.
  avatarDemo?: boolean;
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
    findIt: [{ icon: MessageCircle, label: "Community" }],
  },
  {
    icon: Waves,
    title: "Classes & Wellness",
    body: "Take a livestream with Loretta, or hop into Zumba® and Fitness Bellydance on demand in Classes. Check Wellness for breathwork and nutrition to support you day to day.",
    findIt: [
      { icon: Video, label: "Classes" },
      { icon: Waves, label: "Wellness" },
    ],
  },
  {
    icon: ShoppingCart,
    title: "Meal Plan & Shopping List",
    body: "Plan your whole week with AI-generated recipes, then auto-generate a shopping list from all the week's ingredients. Check off items as you shop — the list even shows you which items you need multiple times.",
    findIt: [
      { icon: Waves, label: "Wellness" },
      { icon: ShoppingCart, label: "Meal Plan" },
    ],
  },
  {
    icon: Music,
    title: "Music",
    body: "Loretta has made songs just for you and your encouragement — only available here on the WELL App.",
    findIt: [{ icon: Music, label: "Music" }],
  },
  {
    icon: Calendar,
    title: "Inspirations & Events",
    body: "A new theme drops every week, with daily inspirations all year that go along with that theme. Don't miss upcoming Events too.",
    findIt: [
      { icon: Sparkles, label: "Inspiration" },
      { icon: Calendar, label: "Events" },
    ],
  },
  {
    icon: User,
    title: "Your Profile",
    body: "Add a photo, write a short bio, and set your birthday — add it to the calendar if you'd like (we love celebrating birthdays here 🎂).",
    findIt: [{ icon: User, label: "Profile" }],
    avatarDemo: true,
  },
  {
    icon: Users,
    title: "WELL Tribe",
    body: "Add fellow members to your WELL Tribe to build your circle. From their profile you can send a direct message to cheer them on, congratulate a win, or just check in.",
    findIt: [
      { icon: User, label: "Profile" },
      { icon: Users, label: "WELL Tribe" },
    ],
  },
  {
    icon: Bell,
    title: "Notifications",
    body: "The bell keeps you up to date on new posts and replies. Adjust what you get notified about anytime from your Profile.",
    findIt: [{ icon: Bell, label: "Bell icon" }],
  },
];

function NavTrail({ stops }: { stops: NavStop[] }) {
  return (
    <div className="w-full flex items-center justify-center gap-2 bg-surface-2 border border-border rounded-card px-3 py-3">
      <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wide shrink-0">Find it</span>
      <div className="flex items-center gap-1.5">
        {stops.map((stop, i) => {
          const StopIcon = stop.icon;
          return (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-text-dim text-xs">→</span>}
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full gradient-brand shadow-glow flex items-center justify-center">
                  <StopIcon size={15} className="text-white" />
                </div>
                <span className="text-[10px] text-text-muted whitespace-nowrap">{stop.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfilePhotoDemo() {
  const [showPhoto, setShowPhoto] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setShowPhoto((v) => !v), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-14 h-14 mb-1 shadow-glow rounded-full">
      <div
        className={`absolute inset-0 rounded-full gradient-brand flex items-center justify-center text-white font-semibold text-lg transition-opacity duration-700 ${
          showPhoto ? "opacity-0" : "opacity-100"
        }`}
      >
        LB
      </div>
      <img
        src={PROFILE_PHOTO_DEMO_URL}
        alt="Example profile photo"
        className={`absolute inset-0 rounded-full object-cover w-full h-full transition-opacity duration-700 ${
          showPhoto ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

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

          {slide.avatarDemo ? (
            <ProfilePhotoDemo />
          ) : (
            <div className="w-14 h-14 rounded-full gradient-brand shadow-glow flex items-center justify-center mb-1">
              <Icon size={26} className="text-white" />
            </div>
          )}

          <h2 className="text-lg font-bold text-text">{slide.title}</h2>
          <p className="text-sm text-text-muted leading-relaxed min-h-[60px]">{slide.body}</p>

          {slide.findIt && <NavTrail stops={slide.findIt} />}

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
