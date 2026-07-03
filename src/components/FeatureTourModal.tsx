import {
  Bell,
  Calendar,
  CheckCircle2,
  Heart,
  MessageCircle,
  Music,
  Salad,
  Smartphone,
  Sparkles,
  Star,
  Trophy,
  User,
  Users,
  Video,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logActivity } from "../utils/wellCup";

const PROFILE_PHOTO_DEMO_URL = "https://lorettabates.com/wp-content/uploads/2026/06/DSC_5773.jpg";

interface NavStop {
  icon: LucideIcon;
  label: string;
}

interface Slide {
  icon: LucideIcon;
  title: string;
  body: string;
  findIt?: NavStop[];
  avatarDemo?: boolean;
  interactive?: "notifications" | "homescreen";
  introPoints?: boolean;
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    title: "Welcome to WELL Collective 💙",
    body: "This is your home base for community, classes, and daily inspiration. Let's take a quick look around!",
    introPoints: true,
  },
  {
    icon: Trophy,
    title: "WELL Cup 🏆",
    body: "Earn points for everything you do — opening the app, posting, logging sleep, listening to music, completing workouts, and more. The top point-earner each day wins! 🥇 Monthly winner gets a FREE month • 🌴 Yearly winner wins a FREE WELL Escape!",
    findIt: [{ icon: Trophy, label: "Well Cup" }],
  },
  {
    icon: User,
    title: "Your Profile",
    body: "Add a profile photo, write a short bio, and set your birthday. Adding a photo earns you 15 bonus points — and we love celebrating birthdays here 🎂",
    findIt: [{ icon: User, label: "Profile" }],
    avatarDemo: true,
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
    body: "Take a livestream with Loretta, or hop into Zumba® and Fitness Bellydance on demand in Classes. Check Wellness for breathwork, workout plans, and daily well-being activities.",
    findIt: [
      { icon: Video, label: "Classes" },
      { icon: Waves, label: "Wellness" },
    ],
  },
  {
    icon: Salad,
    title: "Nutrition",
    body: "Explore a daily recipe, plan your meals on a weekly calendar, and auto-generate a shopping list. Log meals, track nutrition, and check off shopping items as you go.",
    findIt: [{ icon: Salad, label: "Nutrition" }],
  },
  {
    icon: Music,
    title: "Music",
    body: "Loretta has made songs just for you — only available here. Sort by category to find the right vibe, or tap the heart to save songs to your Favorites playlist.",
    findIt: [{ icon: Music, label: "Music" }],
  },
  {
    icon: Calendar,
    title: "Inspirations & Events",
    body: "A new theme drops every week, with daily inspirations all year. Don't miss upcoming Events too.",
    findIt: [
      { icon: Sparkles, label: "Inspiration" },
      { icon: Calendar, label: "Events" },
    ],
  },
  {
    icon: Users,
    title: "WELL Tribe",
    body: "Add fellow members to your WELL Tribe to build your circle. Send a direct message to cheer them on, congratulate a win, or just check in.",
    findIt: [
      { icon: User, label: "Profile" },
      { icon: Users, label: "WELL Tribe" },
    ],
  },
  {
    icon: Bell,
    title: "Turn On Notifications 🔔",
    body: "Never miss a class, a community post, or a WELL Cup win! Enable notifications and earn 20 bonus points.",
    interactive: "notifications",
  },
  {
    icon: Smartphone,
    title: "Add to Your Home Screen 📱",
    body: "Keep WELL Collective just one tap away — add it to your home screen like a native app and earn 25 bonus points!",
    interactive: "homescreen",
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

function PointsBadge({ points }: { points: number }) {
  return (
    <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1">
      <Star size={12} className="text-yellow-400 fill-yellow-400" />
      <span className="text-xs font-bold text-yellow-400">+{points} pts</span>
    </div>
  );
}

export default function FeatureTourModal({
  userEmail,
  onClose,
}: {
  userEmail?: string;
  onClose: (completed: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [notifDone, setNotifDone] = useState(false);
  const [homescreenDone, setHomescreenDone] = useState(false);
  const deferredInstall = useRef<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredInstall.current = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;

  const handleNotifications = async () => {
    if (notifDone) return;
    try {
      const result = await Notification.requestPermission();
      if (result === "granted" && userEmail) {
        logActivity(userEmail, "notifications_enabled").catch(() => {});
      }
    } catch {
      // permission API not available
    }
    setNotifDone(true);
  };

  const handleHomescreen = async () => {
    if (homescreenDone) return;
    if (deferredInstall.current) {
      try {
        deferredInstall.current.prompt();
        const { outcome } = await deferredInstall.current.userChoice;
        if (outcome === "accepted" && userEmail) {
          logActivity(userEmail, "add_to_homescreen").catch(() => {});
        }
        deferredInstall.current = null;
      } catch {
        // prompt not available
      }
    }
    setHomescreenDone(true);
  };

  const handleNext = () => {
    if (isLast) {
      if (userEmail) logActivity(userEmail, "tutorial_complete").catch(() => {});
      onClose(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 animate-fade-in-up">
      <div className="relative w-full max-w-sm gradient-brand p-[1px] rounded-card">
        <div className="bg-surface rounded-card p-6 flex flex-col items-center text-center gap-3 animate-pop-in">
          <button
            onClick={() => onClose(false)}
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

          {/* Intro slide: big points call-out */}
          {slide.introPoints && (
            <div className="w-full rounded-card bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Star size={18} className="text-yellow-400 fill-yellow-400" />
                <Star size={22} className="text-yellow-400 fill-yellow-400" />
                <Star size={18} className="text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-sm font-bold text-yellow-300">Complete this tour and earn</p>
              <p className="text-3xl font-extrabold text-yellow-400 leading-tight">50 WELL Cup Points!</p>
              <p className="text-xs text-yellow-300/70">Plus bonus points along the way</p>
            </div>
          )}

          {/* Interactive: Notifications */}
          {slide.interactive === "notifications" && (
            <div className="w-full flex flex-col items-center gap-2">
              {notifDone ? (
                <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
                  <CheckCircle2 size={16} className="text-green-400" />
                  {typeof Notification !== "undefined" && Notification.permission === "granted"
                    ? "Notifications enabled!"
                    : "Got it — you can change this anytime in Profile."}
                </div>
              ) : (
                <button
                  onClick={handleNotifications}
                  className="w-full gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow"
                >
                  Enable Notifications
                </button>
              )}
              <PointsBadge points={20} />
            </div>
          )}

          {/* Interactive: Add to Home Screen */}
          {slide.interactive === "homescreen" && (
            <div className="w-full flex flex-col items-center gap-2">
              {homescreenDone ? (
                <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
                  <CheckCircle2 size={16} className="text-green-400" />
                  You're all set!
                </div>
              ) : deferredInstall.current ? (
                <button
                  onClick={handleHomescreen}
                  className="w-full gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow"
                >
                  Add to Home Screen
                </button>
              ) : (
                <div className="text-xs text-text-dim bg-surface-2 border border-border rounded-card px-3 py-2">
                  On iPhone: tap the <strong>Share</strong> button in Safari → <strong>Add to Home Screen</strong>
                </div>
              )}
              <PointsBadge points={25} />
            </div>
          )}

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
              onClick={handleNext}
              className="flex-1 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow"
            >
              {isLast ? "Get Started! 🎉" : "Next"}
            </button>
          </div>

          {!isLast && (
            <button onClick={() => onClose(false)} className="text-xs text-text-dim mt-1">
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
