import {
  Activity,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  Heart,
  MessageCircle,
  Music,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  Trophy,
  User,
  Video,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logActivity } from "../utils/wellCup";
import { logEvent } from "../utils/analytics";

const PROFILE_PHOTO_DEMO_URL = "https://lorettabates.com/wp-content/uploads/2026/06/DSC_5773.jpg";
const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

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
  referralDemo?: boolean;
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    title: "Welcome to WELL Collective 💙",
    body: "Your home base for community, classes, daily inspiration, and wellness tracking. Complete this quick tour and earn bonus points!",
    introPoints: true,
  },
  {
    icon: Trophy,
    title: "WELL Cup 🏆",
    body: "Earn points for everything — opening the app, logging meals, completing workouts, posting, and more. Daily winner leads the board, monthly winner gets a FREE month, and yearly winner wins a FREE WELL Escape! Share your referral code to give friends a 30-day free trial and earn bonus points.",
    findIt: [{ icon: Trophy, label: "Well Cup" }],
    referralDemo: true,
  },
  {
    icon: Waves,
    title: "Classes, Wellness & Music",
    body: "Take livestreams or on-demand Zumba® and Fitness Bellydance in Classes. Breathwork, workout plans, and daily activities live in Wellness. Plus Loretta's exclusive music — only available here — in Music.",
    findIt: [
      { icon: Video, label: "Classes" },
      { icon: Waves, label: "Wellness" },
      { icon: Music, label: "Music" },
    ],
  },
  {
    icon: MessageCircle,
    title: "Community & Your Tribe",
    body: "Post, reply, and share in Community. Add members to your WELL Tribe and send direct messages. A new theme drops every week, daily inspirations all year, and Events keep you connected in real life too.",
    findIt: [
      { icon: MessageCircle, label: "Community" },
      { icon: Calendar, label: "Events" },
    ],
  },
  {
    icon: Activity,
    title: "Track Your Day 📊",
    body: "Log steps and meals on the Home Screen. Check sleep, energy in vs. out, and daily activities in WELL Check. Every log earns points and builds your wellness picture.",
    findIt: [{ icon: Activity, label: "WellCheck" }],
  },
  {
    icon: User,
    title: "Your Profile",
    body: "Add a profile photo and earn 15 bonus points. Set your birthday — we love celebrating! Log daily steps and meals on the home screen to track your wellness and balance energy in vs. out.",
    findIt: [{ icon: User, label: "Profile" }],
    avatarDemo: true,
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
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const deferredInstall = useRef<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredInstall.current = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!API_URL || !userEmail) return;
    fetch(`${API_URL}/api/referrals/my-code?email=${encodeURIComponent(userEmail)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.code) setReferralCode(d.code);
      })
      .catch(() => {});
  }, [userEmail]);

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
      if (userEmail) {
        logActivity(userEmail, "tutorial_complete").catch(() => {});
        logEvent(userEmail, "tutorial_complete", { total_steps: SLIDES.length });
      }
      onClose(true);
    } else {
      const nextStep = step + 1;
      if (userEmail) {
        logEvent(userEmail, "tutorial_step", {
          step: nextStep,
          slide_title: SLIDES[nextStep].title,
          from_step: step,
        });
      }
      setStep(nextStep);
    }
  };

  const handleSkip = () => {
    if (userEmail) {
      logEvent(userEmail, "tutorial_skip", {
        at_step: step,
        slide_title: slide.title,
        completed_steps: step,
      });
    }
    onClose(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 animate-fade-in-up">
      <div className="relative w-full max-w-sm gradient-brand p-[1px] rounded-card">
        <div className="bg-surface rounded-card p-6 flex flex-col items-center text-center gap-3 animate-pop-in">
          <button
            onClick={handleSkip}
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

          {/* Referral code demo (shown on the WELL Cup slide) */}
          {slide.referralDemo && referralCode && (
            <div className="w-full rounded-card bg-surface-2 border border-border px-3 py-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Gift size={14} className="text-brand-light" />
                <span className="text-xs font-semibold text-text">Your referral code</span>
              </div>
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 bg-surface-1 border border-border rounded-lg px-3 py-2 text-center">
                  <span className="text-sm font-bold tracking-wider text-brand-light">{referralCode}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode).then(() => {
                      setReferralCopied(true);
                      setTimeout(() => setReferralCopied(false), 2000);
                    }).catch(() => {});
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-2 border border-border shrink-0"
                  aria-label="Copy referral code"
                >
                  {referralCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-text-muted" />}
                </button>
                <button
                  onClick={() => {
                    const text = `Join me on WELL Collective! Use my code ${referralCode} for a FREE 1-month trial. Download: https://app.lorettabates.com`;
                    if (navigator.share) {
                      navigator.share({ text }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(text).catch(() => {});
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg gradient-brand shrink-0"
                  aria-label="Share referral code"
                >
                  <Share2 size={14} className="text-white" />
                </button>
              </div>
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
            <button onClick={handleSkip} className="text-xs text-text-dim mt-1">
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
