import SectionIntroModal from "../components/SectionIntroModal";
import {
  Activity,
  ArrowUpRight,
  Award,
  BookOpen,
  Bookmark,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Crown,
  Dumbbell,
  Eye,
  Flame,
  Hand,
  Heart,
  Info,
  Leaf,
  MessageCircle,
  Moon,
  Music2,
  PenLine,
  RefreshCw,
  Scale,
  Sparkles,
  Square,
  Star,
  StretchHorizontal,
  Timer,
  Trash2,
  Trophy,
  Users,
  Video,
  Volume2,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AMBIENT_SOUNDS, playAmbientSound, playLoopingAudio, type AmbientSoundHandle, type AmbientSoundId } from "../utils/ambientSounds";
import { getSoundIcon } from "../data/soundIconMap";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import ExerciseInfoModal from "../components/ExerciseInfoModal";
import StreakCelebrationModal from "../components/StreakCelebrationModal";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { generateWorkout, type WorkoutPlan } from "../data/workoutLibrary";
import { logActivity } from "../utils/wellCup";
import { VIDEO_CATEGORIES } from "../data/videoLibrary";
import { ALL_BADGES } from "../data/badges";
import { computeBadges, computeStreak, getStreakMilestone } from "../utils/streaks";
import { todayISO } from "../utils/format";

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
  Sparkles,
  Crown,
  Zap,
  Star,
  Heart,
  Video,
  Wind,
  Balance: Scale,
};

export default function Wellness() {
  const {
    user,
    threads,
    currentWeeklyTheme,
    todaysWellActivity,
    logWorkoutCompletion,
    logCustomWorkout,
    logWellActivityCompletion,
    logResistanceCompletion,
    logStretchingCompletion,
    logClassCompletion,
    saveWorkoutPlan,
    removeSavedWorkout,
  } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showSavedWorkouts = searchParams.get("view") === "saved";

  const [plan, setPlan] = useState<WorkoutPlan>(() => generateWorkout(new Date()));
  const [planDate, setPlanDate] = useState(() => todayISO());
  const [selected, setSelected] = useState<SelectedExercise | null>(null);
  const [badgesExpanded, setBadgesExpanded] = useState(false);
  const [dailyBreathwork, setDailyBreathwork] = useState<DailyBreathwork | null>(null);
  const [celebration, setCelebration] = useState<{ days: number; label: string } | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [customWorkoutText, setCustomWorkoutText] = useState("");
  const [showCustomWorkoutForm, setShowCustomWorkoutForm] = useState(false);
  const initialTab = (["workout", "activities", "streaks"].includes(searchParams.get("tab") ?? "") ? searchParams.get("tab") : "workout") as "workout" | "activities" | "streaks";
  const [activeTab, setActiveTab] = useState<"workout" | "activities" | "streaks">(initialTab);

  const [resistanceDone, setResistanceDone] = useState(() => localStorage.getItem(`well-resistance-${todayISO()}`) === "1");
  const [stretchingDone, setStretchingDone] = useState(() => localStorage.getItem(`well-stretching-${todayISO()}`) === "1");
  const [breathworkMarked, setBreathworkMarked] = useState(() => localStorage.getItem(`well-breathwork-marked-${todayISO()}`) === "1");
  const [cardioDone, setCardioDone] = useState(() => localStorage.getItem(`well-cardio-${todayISO()}`) === "1");
  const [sleepLogged, setSleepLogged] = useState(() => localStorage.getItem(`well-sleep-${todayISO()}`) === "1");
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<"not_enough" | "enough" | "feel_great" | "">("");
  const [sleepSubmitting, setSleepSubmitting] = useState(false);

  // Calm Toolkit state
  const [openCalmCard, setOpenCalmCard] = useState<string | null>(null);
  const [calmDone, setCalmDone] = useState(() => localStorage.getItem(`well-calm-done-${todayISO()}`) === "1");
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [activeSoundKey, setActiveSoundKey] = useState<string | null>(null);
  const calmSoundHandleRef = useRef<AmbientSoundHandle | null>(null);
  const [customSounds, setCustomSounds] = useState<{ id: number; title: string; icon: string; url: string }[]>([]);

  // Box Breathing guided session
  const [boxBreathActive, setBoxBreathActive] = useState(false);
  const [boxBreathPhase, setBoxBreathPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale");
  const [boxBreathCount, setBoxBreathCount] = useState(4);
  const [boxBreathRound, setBoxBreathRound] = useState(1);
  const boxBreathRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Humming Breath guided session
  const [hummingActive, setHummingActive] = useState(false);
  const [hummingPhase, setHummingPhase] = useState<"inhale" | "hum">("inhale");
  const [hummingCount, setHummingCount] = useState(4);
  const [hummingRound, setHummingRound] = useState(1);
  const hummingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Body Scan guided session
  const [bodyScanActive, setBodyScanActive] = useState(false);
  const [bodyScanStep, setBodyScanStep] = useState(0);
  const [bodyScanTimeLeft, setBodyScanTimeLeft] = useState(30);
  const bodyScanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Run tracking — read synced runs from health sync localStorage
  const syncedRuns = (() => {
    try {
      const raw = localStorage.getItem(`well-health-runs-${todayISO()}`);
      return raw ? (JSON.parse(raw) as { distanceKm: number; durationMinutes: number; paceMinPerKm: number | null; caloriesBurned: number | null; workoutType: string }[]) : [];
    } catch { return []; }
  })();
  const autoWorkoutFiredRef = useRef(false);

  // If activities were completed on another device, the server-restored logs
  // will contain today's date — sync them to localStorage and local state.
  useEffect(() => {
    const today = todayISO();
    if (!breathworkMarked && (user.breathworkLog ?? []).includes(today)) {
      localStorage.setItem(`well-breathwork-marked-${today}`, "1");
      setBreathworkMarked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.breathworkLog]);

  useEffect(() => {
    const today = todayISO();
    if (!resistanceDone && (user.resistanceLog ?? []).includes(today)) {
      localStorage.setItem(`well-resistance-${today}`, "1");
      setResistanceDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.resistanceLog]);

  useEffect(() => {
    const today = todayISO();
    if (!stretchingDone && (user.stretchingLog ?? []).includes(today)) {
      localStorage.setItem(`well-stretching-${today}`, "1");
      setStretchingDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.stretchingLog]);

  // Check the server for today's sleep entry — catches the case where sleep
  // was logged on another device/browser and the localStorage flag is missing.
  useEffect(() => {
    if (sleepLogged || !API_URL || !user.email) return;
    fetch(`${API_URL}/api/sleep/today?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hours) {
          const today = todayISO();
          setSleepLogged(true);
          setSleepHours(Number(d.hours));
          setSleepQuality((d.quality as "not_enough" | "enough" | "feel_great") || "");
          localStorage.setItem(`well-sleep-${today}`, "1");
          localStorage.setItem(`well-sleep-data-${today}`, JSON.stringify({ hours: d.hours, quality: d.quality }));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  // Fetch admin-uploaded peaceful sounds for the sound picker
  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/peaceful-sounds`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.sounds) setCustomSounds(d.sounds); })
      .catch(() => {});
  }, []);

  const BODY_SCAN_STEPS = [
    { area: "Feet & Ankles", cue: "Soften your feet. Let them sink. Release tension in your toes and heels." },
    { area: "Calves & Shins", cue: "Notice your lower legs. Let the muscles relax. Feel warmth spreading upward." },
    { area: "Thighs & Hips", cue: "Allow your thighs to feel heavy. Soften your hips and let them rest completely." },
    { area: "Stomach & Lower Back", cue: "Breathe into your belly. Let it rise and fall. Release any tightness in your lower back." },
    { area: "Chest & Heart", cue: "Feel your heart beating steadily. With each breath your chest softens and opens." },
    { area: "Shoulders & Arms", cue: "Drop your shoulders away from your ears. Let your arms fall heavy. Relax through your fingertips." },
    { area: "Neck & Throat", cue: "Lengthen and soften your neck. Relax your jaw. Let your tongue rest gently." },
    { area: "Face & Scalp", cue: "Smooth your forehead. Soften around your eyes. Peace washes over your entire face." },
  ];

  const stopCalmSound = () => {
    calmSoundHandleRef.current?.stop();
    calmSoundHandleRef.current = null;
    setActiveSoundKey(null);
  };

  const handleSoundToggle = (key: string, url?: string) => {
    if (activeSoundKey === key) {
      stopCalmSound();
    } else {
      calmSoundHandleRef.current?.stop();
      const handle = url ? playLoopingAudio(url) : playAmbientSound(key as AmbientSoundId);
      calmSoundHandleRef.current = handle;
      setActiveSoundKey(key);
    }
  };

  const stopBoxBreath = () => {
    if (boxBreathRef.current) { clearInterval(boxBreathRef.current); boxBreathRef.current = null; }
    setBoxBreathActive(false);
    setBoxBreathPhase("inhale");
    setBoxBreathCount(4);
    setBoxBreathRound(1);
  };

  const startBoxBreath = () => {
    stopBoxBreath();
    setBoxBreathActive(true);
    let phase: "inhale" | "hold1" | "exhale" | "hold2" = "inhale";
    let count = 4;
    let round = 1;
    setBoxBreathPhase(phase);
    setBoxBreathCount(count);
    setBoxBreathRound(round);
    const PHASES = ["inhale", "hold1", "exhale", "hold2"] as const;
    boxBreathRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        const idx = PHASES.indexOf(phase);
        if (idx === 3) {
          if (round >= 6) {
            clearInterval(boxBreathRef.current!);
            boxBreathRef.current = null;
            setBoxBreathActive(false);
            setBoxBreathPhase("inhale");
            setBoxBreathCount(4);
            setBoxBreathRound(1);
            return;
          }
          round++;
          setBoxBreathRound(round);
          phase = "inhale";
        } else {
          phase = PHASES[idx + 1];
        }
        count = 4;
        setBoxBreathPhase(phase);
      }
      setBoxBreathCount(count);
    }, 1000);
  };

  const stopHumming = () => {
    if (hummingRef.current) { clearInterval(hummingRef.current); hummingRef.current = null; }
    setHummingActive(false);
    setHummingPhase("inhale");
    setHummingCount(4);
    setHummingRound(1);
  };

  const startHumming = () => {
    stopHumming();
    setHummingActive(true);
    let phase: "inhale" | "hum" = "inhale";
    let count = 4;
    let round = 1;
    setHummingPhase(phase);
    setHummingCount(count);
    setHummingRound(round);
    hummingRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        if (phase === "inhale") {
          phase = "hum";
          count = 6;
        } else {
          round++;
          if (round > 8) {
            clearInterval(hummingRef.current!);
            hummingRef.current = null;
            setHummingActive(false);
            setHummingPhase("inhale");
            setHummingCount(4);
            setHummingRound(1);
            return;
          }
          setHummingRound(round);
          phase = "inhale";
          count = 4;
        }
        setHummingPhase(phase);
      }
      setHummingCount(count);
    }, 1000);
  };

  const stopBodyScan = () => {
    if (bodyScanRef.current) { clearInterval(bodyScanRef.current); bodyScanRef.current = null; }
    setBodyScanActive(false);
    setBodyScanStep(0);
    setBodyScanTimeLeft(30);
  };

  const startBodyScan = () => {
    stopBodyScan();
    setBodyScanActive(true);
    let step = 0;
    let timeLeft = 30;
    setBodyScanStep(step);
    setBodyScanTimeLeft(timeLeft);
    bodyScanRef.current = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        step++;
        if (step >= BODY_SCAN_STEPS.length) {
          clearInterval(bodyScanRef.current!);
          bodyScanRef.current = null;
          setBodyScanActive(false);
          setBodyScanStep(0);
          setBodyScanTimeLeft(30);
          return;
        }
        setBodyScanStep(step);
        timeLeft = 30;
      }
      setBodyScanTimeLeft(timeLeft);
    }, 1000);
  };

  const handleOpenCalmCard = (id: string | null) => {
    if (openCalmCard !== id) {
      stopBoxBreath();
      stopHumming();
      stopBodyScan();
      stopCalmSound();
      setShowSoundPicker(false);
    }
    setOpenCalmCard(id);
  };

  const handleCalmDone = () => {
    localStorage.setItem(`well-calm-done-${today}`, "1");
    setCalmDone(true);
    stopBoxBreath();
    stopHumming();
    stopBodyScan();
    stopCalmSound();
    setOpenCalmCard(null);
    if (user.email) logActivity(user.email, "well_activity").catch(() => {});
  };

  const CalmSoundPicker = () => (
    <div className="mt-3 pt-3 border-t border-border">
      <button
        onClick={() => setShowSoundPicker((v) => !v)}
        className="flex items-center gap-2 text-xs text-text-muted font-semibold"
      >
        {activeSoundKey ? <Volume2 size={13} className="text-brand-light" /> : <Music2 size={13} />}
        <span>{activeSoundKey ? "Sound playing — tap to change or stop" : "Add a peaceful sound"}</span>
        {showSoundPicker ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {showSoundPicker && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {AMBIENT_SOUNDS.map((s) => {
            const Icon = getSoundIcon(s.icon);
            return (
              <button
                key={s.id}
                onClick={() => handleSoundToggle(s.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-card border text-[10px] font-semibold transition-colors ${
                  activeSoundKey === s.id ? "gradient-brand text-white border-transparent" : "border-border bg-surface-2 text-text-muted"
                }`}
              >
                <Icon size={14} />
                {s.label}
              </button>
            );
          })}
          {customSounds.map((s) => {
            const Icon = getSoundIcon(s.icon);
            const key = `custom-${s.id}`;
            return (
              <button
                key={key}
                onClick={() => handleSoundToggle(key, s.url)}
                className={`flex flex-col items-center gap-1 py-2 rounded-card border text-[10px] font-semibold transition-colors ${
                  activeSoundKey === key ? "gradient-brand text-white border-transparent" : "border-border bg-surface-2 text-text-muted"
                }`}
              >
                <Icon size={14} />
                {s.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const CardioIcon = plan.cardio.icon;

  const workoutLog = user.workoutLog ?? [];
  const breathworkLog = user.breathworkLog ?? [];
  const wellActivityLog = user.wellActivityLog ?? [];
  const today = todayISO();

  // Auto-regenerate the workout plan when the ET date rolls over, so
  // resistance training, stretches, and cardio always reflect the current day
  // without needing a manual page reload or app restart.
  useEffect(() => {
    if (today !== planDate) {
      setPlan(generateWorkout(new Date()));
      setPlanDate(today);
    }
  }, [today, planDate]);
  const completedToday = workoutLog.includes(today);
  const wellActivityCompleted = wellActivityLog.includes(today);
  const streak = computeStreak(workoutLog);
  const breathworkStreak = computeStreak(breathworkLog);
  const wellActivityStreak = computeStreak(wellActivityLog);

  const handleWellActivityComplete = () => {
    if (wellActivityCompleted) return;
    const milestone = getStreakMilestone(computeStreak([...wellActivityLog, today]));
    if (milestone) setCelebration({ days: milestone, label: "Well Activity" });
    logWellActivityCompletion();
    confetti({ particleCount: 100, spread: 70 });
  };

  const handleLogCustomWorkout = () => {
    if (completedToday || !customWorkoutText.trim()) return;
    const milestone = getStreakMilestone(computeStreak([...workoutLog, today]));
    if (milestone) setCelebration({ days: milestone, label: "Workout" });
    logCustomWorkout(customWorkoutText.trim());
    setCustomWorkoutText("");
    setShowCustomWorkoutForm(false);
    confetti({ particleCount: 100, spread: 70 });
  };

  // Re-fetch breathwork when the ET date changes so the description and
  // background sound update at the same time as the rest of the daily content.
  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/breathwork/today`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDailyBreathwork(data);
      })
      .catch((err) => console.error("Failed to load daily breathwork:", err));
  }, [today]);

  const messagesPosted = threads.reduce(
    (sum, t) => sum + t.messages.filter((m) => m.authorId === user.id).length,
    0
  );
  const badges = computeBadges(workoutLog, messagesPosted, breathworkLog, wellActivityLog, user.classLog ?? []);
  const profileBadgeIds = new Set(
    [user.levelBadge, ...(user.bonusBadges ?? []), ...(user.grantedBadges ?? [])].filter(Boolean) as string[]
  );

  const handleSaveWorkout = () => {
    saveWorkoutPlan(plan);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleCardioComplete = () => {
    localStorage.setItem(`well-cardio-${today}`, "1");
    setCardioDone(true);
    if (user.email) logActivity(user.email, "cardio").catch(() => {});
  };

  const handleResistanceComplete = () => {
    localStorage.setItem(`well-resistance-${today}`, "1");
    setResistanceDone(true);
    logResistanceCompletion();
    if (user.email) logActivity(user.email, "resistance_training").catch(() => {});
  };

  const handleStretchingComplete = () => {
    localStorage.setItem(`well-stretching-${today}`, "1");
    setStretchingDone(true);
    logStretchingCompletion();
    if (user.email) logActivity(user.email, "stretching").catch(() => {});
  };

  const handleBreathworkMark = () => {
    localStorage.setItem(`well-breathwork-marked-${today}`, "1");
    setBreathworkMarked(true);
    if (user.email) logActivity(user.email, "breathwork").catch(() => {});
  };

  const handleSleepLog = async () => {
    if (!sleepQuality || sleepSubmitting) return;
    setSleepSubmitting(true);
    try {
      if (API_URL && user.email) {
        await fetch(`${API_URL}/api/sleep`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberEmail: user.email, hours: sleepHours, quality: sleepQuality }),
        });
      }
      localStorage.setItem(`well-sleep-${today}`, "1");
      localStorage.setItem(`well-sleep-data-${today}`, JSON.stringify({ hours: sleepHours, quality: sleepQuality }));
      setSleepLogged(true);
    } finally {
      setSleepSubmitting(false);
    }
  };

  // Auto-complete workout when all 3 individual items are marked done
  useEffect(() => {
    if (autoWorkoutFiredRef.current || completedToday) return;
    const bwDone = breathworkMarked || breathworkLog.includes(today);
    if (resistanceDone && stretchingDone && bwDone) {
      autoWorkoutFiredRef.current = true;
      const milestone = getStreakMilestone(computeStreak([...workoutLog, today]));
      if (milestone) setCelebration({ days: milestone, label: "Workout" });
      logWorkoutCompletion();
      confetti({ particleCount: 100, spread: 70 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resistanceDone, stretchingDone, breathworkMarked]);

  if (showSavedWorkouts) {
    const savedWorkouts = user.savedWorkouts ?? [];
    return (
      <div>
        <TopBar title="Saved Workouts" subtitle="Workouts you've bookmarked" icon={Bookmark} iconColor="#84D8FD" showBack />
        <div className="px-4 pt-4 flex flex-col gap-4">
          {savedWorkouts.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-12">
              No saved workouts yet — generate one and tap "Save Workout" to bookmark it here.
            </p>
          ) : (
            savedWorkouts.map((saved) => {
              const cardio = VIDEO_CATEGORIES.find((c) => c.id === saved.cardioId);
              return (
                <div key={saved.id} className="glass-card rounded-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-text-dim">
                      Saved {new Date(saved.savedAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => removeSavedWorkout(saved.id)}
                      aria-label="Remove saved workout"
                      className="text-text-dim"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {cardio && (
                    <div className="flex items-center gap-2 mb-3">
                      <Flame size={14} className="text-orange-400 shrink-0" />
                      <p className="text-sm font-bold text-text">{cardio.title}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-text-muted mb-1.5">Resistance Training</p>
                    <ul className="flex flex-col gap-1">
                      {saved.resistance.map((ex) => (
                        <li key={ex.name} className="flex items-center justify-between text-sm text-text">
                          <span>{ex.name}</span>
                          <span className="text-xs text-text-dim">{ex.sets}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-text-muted mb-1.5">Stretching</p>
                    <ul className="flex flex-col gap-1">
                      {saved.stretches.map((s) => (
                        <li key={s.name} className="flex items-center justify-between text-sm text-text">
                          <span>{s.name}</span>
                          <span className="text-xs text-text-dim">{s.duration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted mb-1.5">Breathwork</p>
                    <p className="text-sm text-text">{saved.breathwork.name}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "workout" as const,    label: "Workout" },
    { id: "activities" as const, label: "Activities" },
    { id: "streaks" as const,    label: "Streaks" },
  ];

  return (
    <div>
      <TopBar title="Wellness" subtitle="Workouts, streaks & mindful activities" icon={Waves} iconColor="#84D8FD" showBack />
      <SectionIntroModal sectionKey="wellness" />

      <div className="px-4 pt-4">
        <Link
          to="/well-check"
          className="flex items-center gap-3 gradient-brand p-[1px] rounded-card shadow-glow mb-0"
        >
          <div className="flex items-center gap-3 bg-surface/95 rounded-card px-4 py-3 w-full">
            <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center shrink-0">
              <Activity size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">Daily WELL Check</p>
              <p className="text-xs text-text-muted">Log activities &amp; earn points</p>
            </div>
            <ChevronRight size={16} className="text-text-dim shrink-0" />
          </div>
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-xs font-semibold rounded-pill py-2 transition-colors ${
              activeTab === tab.id
                ? "gradient-brand text-white shadow-glow"
                : "bg-surface-2 border border-border text-text-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-2 pb-6 flex flex-col gap-5">

      {/* ── WORKOUT TAB ───────────────────────────────────── */}
      {activeTab === "workout" && <>

        <div className="flex gap-2">
          <button
            onClick={() => setPlan(generateWorkout(new Date()))}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold rounded-pill py-2.5 gradient-brand text-white shadow-glow"
          >
            <RefreshCw size={15} />
            New Workout
          </button>
          <button
            onClick={handleSaveWorkout}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-pill px-4 py-2.5 bg-surface-2 border border-border text-text-muted"
          >
            <Bookmark size={13} className={justSaved ? "fill-brand-light text-brand-light" : ""} />
            {justSaved ? "Saved!" : "Save"}
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <section>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <Flame size={15} className="text-orange-400 shrink-0" />
              <h3 className="text-sm font-bold text-text">Cardio</h3>
            </div>
              <a
                href={plan.cardio.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => logClassCompletion()}
                className="flex items-center gap-3 glass-card rounded-card p-4"
              >
                <div
                  className="relative flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 overflow-hidden"
                  style={{ backgroundColor: `${plan.cardio.color}22` }}
                >
                  {plan.cardio.image ? (
                    <img src={plan.cardio.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <CardioIcon size={20} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-text">{plan.cardio.title}</h4>
                  <p className="text-xs text-text-muted line-clamp-2">{plan.cardio.description}</p>
                </div>
                <ArrowUpRight size={18} className="text-text-dim shrink-0" />
              </a>
              <button
                onClick={handleCardioComplete}
                disabled={cardioDone}
                className={`w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-pill py-2 mt-2 transition-colors ${
                  cardioDone ? "bg-surface-2 border border-border text-brand-light" : "gradient-brand text-white"
                }`}
              >
                <CheckCircle2 size={13} />
                {cardioDone ? "Cardio Logged · +20 pts ✓" : "I Did Cardio Today · +20 pts"}
              </button>
            </section>

          <section>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <Dumbbell size={15} className="text-blue-400 shrink-0" />
              <h3 className="text-sm font-bold text-text">Resistance Training</h3>
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
                <button
                  onClick={handleResistanceComplete}
                  disabled={resistanceDone}
                  className={`w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-pill py-2 mt-1 transition-colors ${
                    resistanceDone ? "bg-surface-2 border border-border text-brand-light" : "gradient-brand text-white"
                  }`}
                >
                  <CheckCircle2 size={13} />
                  {resistanceDone ? "Completed · +20 pts ✓" : "Mark Complete · +20 pts"}
                </button>
              </div>
            </section>

          <section>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <StretchHorizontal size={15} className="text-purple-400 shrink-0" />
              <h3 className="text-sm font-bold text-text">Stretching</h3>
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
                <button
                  onClick={handleStretchingComplete}
                  disabled={stretchingDone}
                  className={`w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-pill py-2 mt-1 transition-colors ${
                    stretchingDone ? "bg-surface-2 border border-border text-brand-light" : "gradient-brand text-white"
                  }`}
                >
                  <CheckCircle2 size={13} />
                  {stretchingDone ? "Completed · +15 pts ✓" : "Mark Complete · +15 pts"}
                </button>
              </div>
            </section>

          <section>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <Wind size={15} className="text-teal-400 shrink-0" />
              <h3 className="text-sm font-bold text-text">Breathwork</h3>
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
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate("/breathwork")}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-pill py-2.5 gradient-brand text-white shadow-glow hover:opacity-90 transition-colors"
                >
                  <Wind size={16} />
                  Start Guided Breathwork
                </button>
                <button
                  onClick={handleBreathworkMark}
                  disabled={breathworkMarked || breathworkLog.includes(today)}
                  className={`w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-pill py-2 transition-colors ${
                    breathworkMarked || breathworkLog.includes(today)
                      ? "bg-surface-2 border border-border text-brand-light"
                      : "bg-surface-2 border border-border text-text-muted"
                  }`}
                >
                  <CheckCircle2 size={13} />
                  {breathworkMarked || breathworkLog.includes(today) ? "Breathwork Logged · +15 pts ✓" : "Did your own breathwork? Mark Complete · +15 pts"}
                </button>
              </div>
            </section>
        </div>

        {/* Custom workout + big complete button at bottom of workout tab */}
        {!completedToday && (
          <div className="bg-surface-2 border border-border rounded-card p-4">
            {!showCustomWorkoutForm ? (
              <button onClick={() => setShowCustomWorkoutForm(true)} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-text-muted">
                <PenLine size={15} />
                Did your own workout? Log it here
              </button>
            ) : (
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold text-text-muted">What did you do?</p>
                <textarea value={customWorkoutText} onChange={(e) => setCustomWorkoutText(e.target.value)} placeholder="e.g. 30 min run, yoga class, hike with the dog..." rows={2} className="w-full bg-surface border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => { setShowCustomWorkoutForm(false); setCustomWorkoutText(""); }} className="flex-1 text-xs font-semibold text-text-muted border border-border rounded-pill py-2">Cancel</button>
                  <button onClick={handleLogCustomWorkout} disabled={!customWorkoutText.trim()} className="flex-1 gradient-brand text-white text-xs font-semibold rounded-pill py-2 disabled:opacity-50">Log It</button>
                </div>
              </div>
            )}
          </div>
        )}
        {completedToday && user.customWorkoutNotes?.[today] && (
          <div className="bg-surface-2 border border-border rounded-card p-3 flex items-start gap-2">
            <PenLine size={14} className="text-brand-light shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted"><span className="font-semibold text-text">Logged on your own:</span> {user.customWorkoutNotes[today]}</p>
          </div>
        )}
        {(() => {
          const bwAlreadyDone = breathworkMarked || breathworkLog.includes(today);
          const potentialPts = (!resistanceDone ? 20 : 0) + (!stretchingDone ? 15 : 0) + (!bwAlreadyDone ? 15 : 0) + (!cardioDone ? 20 : 0);

          const handleMarkAllWorkout = () => {
            if (completedToday) return;
            if (!resistanceDone) {
              localStorage.setItem(`well-resistance-${today}`, "1");
              setResistanceDone(true);
              logResistanceCompletion();
              if (user.email) logActivity(user.email, "resistance_training").catch(() => {});
            }
            if (!stretchingDone) {
              localStorage.setItem(`well-stretching-${today}`, "1");
              setStretchingDone(true);
              logStretchingCompletion();
              if (user.email) logActivity(user.email, "stretching").catch(() => {});
            }
            if (!bwAlreadyDone) {
              localStorage.setItem(`well-breathwork-marked-${today}`, "1");
              setBreathworkMarked(true);
              if (user.email) logActivity(user.email, "breathwork").catch(() => {});
            }
            if (!cardioDone) {
              localStorage.setItem(`well-cardio-${today}`, "1");
              setCardioDone(true);
              if (user.email) logActivity(user.email, "cardio").catch(() => {});
            }
            autoWorkoutFiredRef.current = true;
            const milestone = getStreakMilestone(computeStreak([...workoutLog, today]));
            if (milestone) setCelebration({ days: milestone, label: "Workout" });
            logWorkoutCompletion();
            confetti({ particleCount: 120, spread: 90 });
          };

          return (
            <button
              onClick={handleMarkAllWorkout}
              disabled={completedToday}
              className={`w-full flex items-center justify-center gap-2 text-base font-bold rounded-2xl py-5 transition-colors ${
                completedToday ? "bg-surface-2 border border-border text-brand-light" : "gradient-brand text-white shadow-glow"
              }`}
            >
              <CheckCircle2 size={20} />
              {completedToday
                ? "Workout Complete for Today ✓"
                : potentialPts > 0
                ? `Mark Today's Workout Complete · +${potentialPts} pts`
                : "Mark Today's Workout Complete"}
            </button>
          );
        })()}
      </>}

      {/* ── ACTIVITIES TAB ──────────────────────────────────── */}
      {activeTab === "activities" && <>
        {/* Well Activity */}
        <div className="gradient-brand p-[1px] rounded-card">
          <div className="bg-surface/95 rounded-card p-4">
            {currentWeeklyTheme && (
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-light">
                This week: {currentWeeklyTheme.title}
              </span>
            )}
            <div className="flex items-center gap-2 mt-1 mb-1.5">
              <Heart size={14} className="text-pink-400 shrink-0" />
              <h3 className="text-sm font-bold text-text">Today's Well Activity</h3>
            </div>
            <p className="text-xs font-bold text-text mb-1">{todaysWellActivity.title}</p>
            <p className="text-sm text-text-muted leading-relaxed">{todaysWellActivity.description}</p>
            <button
              onClick={handleWellActivityComplete}
              disabled={wellActivityCompleted}
              className={`w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-pill py-2 mt-3 transition-colors ${
                wellActivityCompleted ? "bg-surface-2 border border-border text-brand-light" : "gradient-brand text-white"
              }`}
            >
              <CheckCircle2 size={14} />
              {wellActivityCompleted ? "Activity Completed ✓" : "Mark Complete · +15 pts"}
            </button>
          </div>
        </div>

        {/* Sleep */}
        <div className="glass-card rounded-card p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <Moon size={15} className="text-indigo-400 shrink-0" />
            <h3 className="text-sm font-bold text-text">Sleep</h3>
            {sleepLogged && <span className="ml-auto text-xs font-semibold text-brand-light">Logged ✓</span>}
          </div>
          {sleepLogged ? (
            <p className="text-xs text-text-muted text-center py-1">Sleep logged for today. Rest well tonight!</p>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-text-muted">Hours of sleep last night</p>
                  <span className="text-sm font-bold text-brand-light">{sleepHours}h</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={12}
                  step={0.5}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full accent-brand-light"
                />
                <div className="flex justify-between text-[10px] text-text-dim mt-0.5">
                  <span>2h</span><span>12h</span>
                </div>
              </div>

              <p className="text-xs text-text-muted mb-2">How did you feel when you woke up?</p>
              <div className="flex flex-col gap-2 mb-4">
                {([
                  { id: "not_enough" as const, label: "Didn't get enough" },
                  { id: "enough" as const,     label: "Got enough" },
                  { id: "feel_great" as const, label: "I feel great!" },
                ] as const).map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSleepQuality(q.id)}
                    className={`w-full text-xs font-semibold rounded-pill py-2 border transition-colors ${
                      sleepQuality === q.id
                        ? "gradient-brand text-white border-transparent"
                        : "border-border text-text-muted bg-surface-2"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSleepLog}
                disabled={!sleepQuality || sleepSubmitting}
                className="w-full gradient-brand text-white text-xs font-semibold rounded-pill py-2.5 disabled:opacity-40 transition-opacity"
              >
                {sleepSubmitting ? "Logging…" : "Log Sleep · +10 pts"}
              </button>
            </>
          )}
        </div>
        {/* Run Tracking */}
        <div className="glass-card rounded-card p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <Activity size={15} className="text-brand-light shrink-0" />
            <h3 className="text-sm font-bold text-text">Today's Runs</h3>
            {syncedRuns.length > 0 && (
              <span className="ml-auto text-xs text-text-dim">{syncedRuns.length} {syncedRuns.length === 1 ? "run" : "runs"} synced</span>
            )}
          </div>
          {syncedRuns.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-3">
              No runs synced today. Enable Health Sync in{" "}
              <Link to="/profile" className="text-brand-light font-semibold">Profile</Link> to auto-import runs.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {syncedRuns.map((run, i) => (
                <div key={i} className="rounded-card bg-surface-2 border border-border px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-light mb-2">
                    {run.workoutType === "runningTreadmill" ? "Treadmill Run" : "Outdoor Run"}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center">
                      <p className="text-lg font-extrabold text-text leading-none">{run.distanceKm.toFixed(1)}</p>
                      <p className="text-[10px] text-text-dim">km</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-lg font-extrabold text-text leading-none">{run.durationMinutes}</p>
                      <p className="text-[10px] text-text-dim">min</p>
                    </div>
                    <div className="flex flex-col items-center">
                      {run.paceMinPerKm != null ? (
                        <>
                          <p className="text-lg font-extrabold text-text leading-none">{run.paceMinPerKm.toFixed(1)}</p>
                          <p className="text-[10px] text-text-dim">min/km</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-extrabold text-text-dim leading-none">—</p>
                          <p className="text-[10px] text-text-dim">pace</p>
                        </>
                      )}
                    </div>
                  </div>
                  {run.caloriesBurned != null && (
                    <p className="text-[11px] text-text-muted text-center mt-2">{run.caloriesBurned} kcal burned</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calm Toolkit */}
        <div className="glass-card rounded-card p-4">
          <div className="flex items-center gap-2 mb-1 pb-2 border-b border-border">
            <Brain size={15} className="text-purple-400 shrink-0" />
            <h3 className="text-sm font-bold text-text">Calm Toolkit</h3>
            {calmDone && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-green-400">
                <CheckCircle2 size={12} /> Done
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mb-3 mt-2">Anxiety, stress, or overwhelm? Pick a tool — these work any time, anywhere.</p>

          <div className="flex flex-col gap-3">

            {/* ── GROUNDING section ── */}
            <div className="flex items-center gap-2 pt-1">
              <Leaf size={12} className="text-green-400 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-green-400">Grounding</p>
              <div className="flex-1 h-px bg-green-400/20" />
            </div>

            {/* ── Grounding 5-4-3-2-1 ── */}
            {(() => {
              const id = "grounding";
              const isOpen = openCalmCard === id;
              const Icon = getSoundIcon("leaf");
              return (
                <div className="rounded-card border border-border bg-surface-2 overflow-hidden">
                  <button onClick={() => handleOpenCalmCard(isOpen ? null : id)} className="w-full flex items-center gap-3 px-3 py-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">Grounding 5-4-3-2-1</p>
                      <p className="text-xs text-text-muted">Bring yourself back to the present</p>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-text-dim shrink-0" /> : <ChevronDown size={14} className="text-text-dim shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-4 border-t border-border">
                      <div className="flex flex-col gap-2 mt-3">
                        {[
                          "Find a comfortable position. Take 2 deep breaths.",
                          "Name 5 things you can SEE right now.",
                          "Name 4 things you can physically TOUCH.",
                          "Name 3 things you can HEAR.",
                          "Name 2 things you can SMELL (or like the smell of).",
                          "Name 1 thing you can TASTE right now.",
                          "Take 3 deep breaths. Notice how much calmer you feel.",
                        ].map((step, i) => (
                          <div key={i} className="flex gap-2.5">
                            <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[10px] font-bold text-white">{i + 1}</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed flex-1">{step}</p>
                          </div>
                        ))}
                      </div>
                      <CalmSoundPicker />
                      {!calmDone && (
                        <button onClick={handleCalmDone} className="mt-3 w-full gradient-brand text-white text-xs font-semibold rounded-pill py-2">
                          Mark Done · +5 pts
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Body Scan (guided) ── */}
            {(() => {
              const id = "bodyscan";
              const isOpen = openCalmCard === id;
              const Icon = Eye;
              const progress = bodyScanActive ? Math.round(((BODY_SCAN_STEPS.length - bodyScanStep - 1) * 30 + bodyScanTimeLeft) / (BODY_SCAN_STEPS.length * 30) * 100) : 0;
              return (
                <div className="rounded-card border border-border bg-surface-2 overflow-hidden">
                  <button onClick={() => handleOpenCalmCard(isOpen ? null : id)} className="w-full flex items-center gap-3 px-3 py-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">Guided Body Scan</p>
                      <p className="text-xs text-text-muted">4 minutes · Release tension from head to toe</p>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-text-dim shrink-0" /> : <ChevronDown size={14} className="text-text-dim shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-4 border-t border-border">
                      <div className="mt-3 flex flex-col items-center gap-3">
                        {bodyScanActive ? (
                          <>
                            <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                              <div className="h-full gradient-brand transition-all duration-1000" style={{ width: `${100 - progress}%` }} />
                            </div>
                            <div className="w-full rounded-card bg-indigo-500/10 border border-indigo-500/30 p-4 text-center">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Focus here</p>
                              <p className="text-base font-bold text-text mb-2">{BODY_SCAN_STEPS[bodyScanStep].area}</p>
                              <p className="text-xs text-text-muted leading-relaxed">{BODY_SCAN_STEPS[bodyScanStep].cue}</p>
                              <p className="text-2xl font-extrabold text-indigo-300 mt-3 leading-none">{bodyScanTimeLeft}s</p>
                              <p className="text-[10px] text-text-dim mt-1">Area {bodyScanStep + 1} of {BODY_SCAN_STEPS.length}</p>
                            </div>
                          </>
                        ) : (
                          <div className="w-full text-center">
                            <p className="text-xs text-text-muted mb-1">Lie down or sit comfortably. Close your eyes.</p>
                            <p className="text-xs text-text-dim">We'll guide you through 8 body areas, 30 seconds each.</p>
                          </div>
                        )}
                        <button
                          onClick={bodyScanActive ? stopBodyScan : startBodyScan}
                          className="flex items-center gap-2 text-sm font-semibold rounded-pill px-5 py-2.5 gradient-brand text-white shadow-glow"
                        >
                          <Timer size={14} />
                          {bodyScanActive ? "Stop Session" : "Begin Body Scan"}
                        </button>
                      </div>
                      <CalmSoundPicker />
                      {!calmDone && (
                        <button onClick={handleCalmDone} className="mt-3 w-full gradient-brand text-white text-xs font-semibold rounded-pill py-2">
                          Mark Done · +5 pts
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Progressive Muscle Relaxation ── */}
            {(() => {
              const id = "pmr";
              const isOpen = openCalmCard === id;
              const Icon = Hand;
              return (
                <div className="rounded-card border border-border bg-surface-2 overflow-hidden">
                  <button onClick={() => handleOpenCalmCard(isOpen ? null : id)} className="w-full flex items-center gap-3 px-3 py-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">Progressive Muscle Relaxation</p>
                      <p className="text-xs text-text-muted">Tense and release for deep calm</p>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-text-dim shrink-0" /> : <ChevronDown size={14} className="text-text-dim shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-4 border-t border-border">
                      <div className="flex flex-col gap-2 mt-3">
                        {[
                          "Sit or lie comfortably. Take 3 slow breaths.",
                          "Curl your toes tightly for 5 seconds — then release. Feel the difference.",
                          "Tense your calves for 5 sec — then release completely.",
                          "Squeeze your thighs and glutes for 5 sec — then let go.",
                          "Pull your stomach in tight for 5 sec — then release.",
                          "Shrug your shoulders to your ears for 5 sec — then drop them.",
                          "Clench your jaw and squint your eyes for 5 sec — then soften.",
                          "Take 5 slow breaths. Feel the warmth and heaviness of complete relaxation.",
                        ].map((step, i) => (
                          <div key={i} className="flex gap-2.5">
                            <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[10px] font-bold text-white">{i + 1}</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed flex-1">{step}</p>
                          </div>
                        ))}
                      </div>
                      <CalmSoundPicker />
                      {!calmDone && (
                        <button onClick={handleCalmDone} className="mt-3 w-full gradient-brand text-white text-xs font-semibold rounded-pill py-2">
                          Mark Done · +5 pts
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── CALM section ── */}
            <div className="flex items-center gap-2 pt-1">
              <Sparkles size={12} className="text-amber-400 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Calm</p>
              <div className="flex-1 h-px bg-amber-400/20" />
            </div>

            {/* ── Worry Dump ── */}
            {(() => {
              const id = "worrydump";
              const isOpen = openCalmCard === id;
              const Icon = BookOpen;
              return (
                <div className="rounded-card border border-border bg-surface-2 overflow-hidden">
                  <button onClick={() => handleOpenCalmCard(isOpen ? null : id)} className="w-full flex items-center gap-3 px-3 py-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">Worry Dump</p>
                      <p className="text-xs text-text-muted">Get it out of your head and onto paper</p>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-text-dim shrink-0" /> : <ChevronDown size={14} className="text-text-dim shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-4 border-t border-border">
                      <div className="flex flex-col gap-2 mt-3">
                        {[
                          "Set a timer for 10 minutes.",
                          "Write every worry, fear, and stressor on your mind — don't edit, just dump.",
                          "When the timer ends, stop writing.",
                          "Look at the list. Circle ONLY what you can control today.",
                          "Cross out everything else — they're real, but not yours to carry right now.",
                          "For the circled items: what is ONE tiny step you can take?",
                          "Close the page. The worries are contained. You can return if needed.",
                        ].map((step, i) => (
                          <div key={i} className="flex gap-2.5">
                            <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[10px] font-bold text-white">{i + 1}</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed flex-1">{step}</p>
                          </div>
                        ))}
                      </div>
                      <CalmSoundPicker />
                      {!calmDone && (
                        <button onClick={handleCalmDone} className="mt-3 w-full gradient-brand text-white text-xs font-semibold rounded-pill py-2">
                          Mark Done · +5 pts
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Cognitive Reframe ── */}
            {(() => {
              const id = "reframe";
              const isOpen = openCalmCard === id;
              const Icon = RefreshCw;
              return (
                <div className="rounded-card border border-border bg-surface-2 overflow-hidden">
                  <button onClick={() => handleOpenCalmCard(isOpen ? null : id)} className="w-full flex items-center gap-3 px-3 py-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">Cognitive Reframe</p>
                      <p className="text-xs text-text-muted">Change the story, change the feeling</p>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-text-dim shrink-0" /> : <ChevronDown size={14} className="text-text-dim shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-4 border-t border-border">
                      <div className="flex flex-col gap-2 mt-3">
                        {[
                          "Write down the stressful thought exactly as it appears in your mind.",
                          "Ask yourself: Is this thought 100% true, or is it a story?",
                          "Ask: What evidence do I have FOR this thought?",
                          "Ask: What evidence do I have AGAINST it?",
                          "Ask: What would I tell a close friend who had this thought?",
                          "Write a more balanced, realistic version of the thought.",
                          "Read the new thought 3 times. Notice how your body feels.",
                        ].map((step, i) => (
                          <div key={i} className="flex gap-2.5">
                            <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[10px] font-bold text-white">{i + 1}</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed flex-1">{step}</p>
                          </div>
                        ))}
                      </div>
                      <CalmSoundPicker />
                      {!calmDone && (
                        <button onClick={handleCalmDone} className="mt-3 w-full gradient-brand text-white text-xs font-semibold rounded-pill py-2">
                          Mark Done · +5 pts
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── BREATHING section ── */}
            <div className="flex items-center gap-2 pt-1">
              <Wind size={12} className="text-blue-400 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Breathing</p>
              <div className="flex-1 h-px bg-blue-400/20" />
            </div>

            {/* ── Box Breathing (guided visual) ── */}
            {(() => {
              const id = "boxbreath";
              const isOpen = openCalmCard === id;
              const Icon = Square;
              const phaseLabel = { inhale: "Inhale", hold1: "Hold", exhale: "Exhale", hold2: "Hold" };
              const phaseScale = boxBreathActive
                ? boxBreathPhase === "inhale" ? "scale-125 shadow-[0_0_30px_rgba(132,216,253,0.5)]"
                : boxBreathPhase === "exhale" ? "scale-75"
                : "scale-100"
                : "scale-100";
              return (
                <div className="rounded-card border border-border bg-surface-2 overflow-hidden">
                  <button onClick={() => handleOpenCalmCard(isOpen ? null : id)} className="w-full flex items-center gap-3 px-3 py-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">Box Breathing</p>
                      <p className="text-xs text-text-muted">4-4-4-4 · Inhale, hold, exhale, hold</p>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-text-dim shrink-0" /> : <ChevronDown size={14} className="text-text-dim shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-4 border-t border-border">
                      <div className="mt-4 flex flex-col items-center gap-4">
                        <div className={`w-28 h-28 rounded-2xl gradient-brand flex flex-col items-center justify-center transition-all duration-1000 ${phaseScale}`}>
                          <p className="text-xs font-bold text-white/80 tracking-wide">
                            {boxBreathActive ? phaseLabel[boxBreathPhase] : "Ready"}
                          </p>
                          {boxBreathActive && (
                            <p className="text-4xl font-extrabold text-white leading-none">{boxBreathCount}</p>
                          )}
                        </div>
                        {boxBreathActive && (
                          <p className="text-xs text-text-muted">Round {boxBreathRound} of 6</p>
                        )}
                        {!boxBreathActive && (
                          <p className="text-xs text-text-muted text-center px-4">Sit upright and exhale completely before starting.</p>
                        )}
                        <button
                          onClick={boxBreathActive ? stopBoxBreath : startBoxBreath}
                          className="flex items-center gap-2 text-sm font-semibold rounded-pill px-5 py-2.5 gradient-brand text-white shadow-glow"
                        >
                          <Timer size={14} />
                          {boxBreathActive ? "Stop Session" : "Begin Session"}
                        </button>
                      </div>
                      <CalmSoundPicker />
                      {!calmDone && (
                        <button onClick={handleCalmDone} className="mt-3 w-full gradient-brand text-white text-xs font-semibold rounded-pill py-2">
                          Mark Done · +5 pts
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Humming Breath (guided visual) ── */}
            {(() => {
              const id = "humming";
              const isOpen = openCalmCard === id;
              const HumIcon = getSoundIcon("waves");
              const phaseLabel = hummingPhase === "inhale" ? "Inhale" : "Hum...";
              const hummingScale = hummingActive
                ? hummingPhase === "inhale" ? "scale-110" : "scale-95 shadow-[0_0_30px_rgba(167,139,250,0.5)]"
                : "scale-100";
              return (
                <div className="rounded-card border border-border bg-surface-2 overflow-hidden">
                  <button onClick={() => handleOpenCalmCard(isOpen ? null : id)} className="w-full flex items-center gap-3 px-3 py-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                      <HumIcon size={16} className="text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">Humming Breath</p>
                      <p className="text-xs text-text-muted">Activate your vagus nerve for instant calm</p>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-text-dim shrink-0" /> : <ChevronDown size={14} className="text-text-dim shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-4 border-t border-border">
                      <div className="mt-4 flex flex-col items-center gap-4">
                        <div className={`w-28 h-28 rounded-full bg-violet-500/20 border-2 border-violet-400/40 flex flex-col items-center justify-center transition-all duration-1000 ${hummingScale}`}>
                          <p className="text-xs font-bold text-violet-300 tracking-wide">
                            {hummingActive ? phaseLabel : "Ready"}
                          </p>
                          {hummingActive && (
                            <p className="text-4xl font-extrabold text-violet-200 leading-none">{hummingCount}</p>
                          )}
                        </div>
                        {hummingActive && (
                          <p className="text-xs text-text-muted">Round {hummingRound} of 8</p>
                        )}
                        {!hummingActive && (
                          <p className="text-xs text-text-muted text-center px-4">
                            Inhale through your nose, then hum on the exhale. Feel the vibration in your chest.
                          </p>
                        )}
                        <button
                          onClick={hummingActive ? stopHumming : startHumming}
                          className="flex items-center gap-2 text-sm font-semibold rounded-pill px-5 py-2.5 gradient-brand text-white shadow-glow"
                        >
                          <Timer size={14} />
                          {hummingActive ? "Stop Session" : "Begin Session"}
                        </button>
                      </div>
                      <CalmSoundPicker />
                      {!calmDone && (
                        <button onClick={handleCalmDone} className="mt-3 w-full gradient-brand text-white text-xs font-semibold rounded-pill py-2">
                          Mark Done · +5 pts
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        </div>
      </>}

      {/* ── STREAKS TAB ─────────────────────────────────────── */}
      {activeTab === "streaks" && <>
        <div className="glass-card rounded-card p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full gradient-brand shadow-glow flex items-center justify-center shrink-0">
            <Flame size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-text leading-none">{streak} {streak === 1 ? "day" : "days"}</p>
            <p className="text-xs text-text-muted mt-1">Current workout streak</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-card p-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
              <Wind size={16} className="text-brand-light" />
            </div>
            <div>
              <p className="text-lg font-bold text-text leading-none">{breathworkStreak} {breathworkStreak === 1 ? "day" : "days"}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Breathwork streak</p>
            </div>
          </div>
          <div className="glass-card rounded-card p-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
              <Heart size={16} className="text-pink-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-text leading-none">{wellActivityStreak} {wellActivityStreak === 1 ? "day" : "days"}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Well Activity streak</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text">Activity Badges</h3>
            <button onClick={() => setBadgesExpanded(!badgesExpanded)} className="text-xs text-brand-light">
              {badgesExpanded ? "Show less" : `See all ${badges.length}`}
            </button>
          </div>
          <div className={`grid gap-3 ${badgesExpanded ? "grid-cols-2" : "grid-cols-4"}`}>
            {(badgesExpanded ? badges : badges.slice(0, 4)).map((badge) => {
              const Icon = BADGE_ICONS[badge.icon] ?? Award;
              return (
                <div key={badge.id} className={`glass-card rounded-card p-3 flex flex-col gap-1.5 ${badge.earned ? "" : "opacity-40"}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${badge.earned ? "gradient-brand" : "bg-surface-2 border border-border"}`}>
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
        </div>

        <div>
          <h3 className="text-sm font-bold text-text mb-1">Profile Badges</h3>
          <p className="text-xs text-text-muted mb-3">Earned through activity, tenure, or granted by Loretta.</p>
          <div className="grid grid-cols-4 gap-3">
            {ALL_BADGES.map((badge) => {
              const earned = profileBadgeIds.has(badge.id);
              return (
                <div key={badge.id} className={`glass-card rounded-card p-3 flex flex-col items-center gap-1.5 text-center ${earned ? "" : "opacity-40"}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${earned ? "bg-white" : "bg-surface-2 border border-border"}`}>
                    {badge.icon}
                  </div>
                  <p className="text-[10px] font-semibold text-text leading-tight">{badge.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </>}

      </div>

      {selected && (
        <ExerciseInfoModal
          name={selected.name}
          meta={selected.meta}
          description={selected.description}
          onClose={() => setSelected(null)}
        />
      )}

      {celebration && (
        <StreakCelebrationModal
          days={celebration.days}
          label={celebration.label}
          onClose={() => setCelebration(null)}
        />
      )}
    </div>
  );
}
