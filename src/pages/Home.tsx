import { Bell, Calendar, CheckCircle2, Gift, MessageCircle, Music, Phone, Rss, Salad, Sparkles, Video, Waves } from "lucide-react";
import { logActivity } from "../utils/wellCup";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WellCupLeaderboard from "../components/WellCupLeaderboard";
import BirthdayModal from "../components/BirthdayModal";
import FeatureTourModal from "../components/FeatureTourModal";
import NotificationOptInModal from "../components/NotificationOptInModal";
import EventCard from "../components/events/EventCard";
import TribeActivityStrip from "../components/home/TribeActivityStrip";
import ThreadPreviewCard from "../components/community/ThreadPreviewCard";
import InspirationCard from "../components/inspiration/InspirationCard";
import SectionHeader from "../components/ui/SectionHeader";
import Avatar from "../components/ui/Avatar";
import { LOGO_URL } from "../components/layout/MobileShell";
import { useEventsFeed } from "../hooks/useEventsFeed";
import { useApp } from "../store/AppContext";
import { getTrialStatus, isActiveMember } from "../utils/trial";
import { todayISO } from "../utils/format";

const QUICK_LINKS = [
  { to: "/community", label: "Community", icon: MessageCircle },
  { to: "/wellness", label: "Wellness", icon: Waves },
  { to: "/videos", label: "Classes", icon: Video },
  { to: "/music", label: "Music", icon: Music },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/inspirations", label: "Inspiration", icon: Sparkles },
  { to: "/nutrition", label: "Nutrition", icon: Salad },
  { to: "/blog", label: "Blog", icon: Rss },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, threads, inspirations, events, notifications, featuredEventId, logWorkoutCompletion, logWellActivityCompletion } = useApp();
  const { events: liveEvents } = useEventsFeed();
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Most recent by sentAt, not just inspirations[0] — guards against the
  // array order ever drifting out of sync with actual send time, since this
  // card is supposed to reflect whichever came in last: today's scheduled
  // daily send or a one-off note from Loretta, resetting the moment either
  // arrives.
  const todaysInspiration = [...inspirations].sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
  const allUpcomingEvents = [...events, ...liveEvents]
    .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date));
  const featuredEvent = allUpcomingEvents.find((e) => e.id === featuredEventId);
  const upcomingEvents = [
    ...(featuredEvent ? [featuredEvent] : []),
    ...allUpcomingEvents.filter((e) => e.id !== featuredEventId),
  ].slice(0, 4);
  const latestThreads = [...threads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  const [showBirthday, setShowBirthday] = useState(false);
  const [showNotifOptIn, setShowNotifOptIn] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!user.birthday) return;
    const now = new Date();
    const todayMD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (user.birthday !== todayMD) return;

    const key = `well-birthday-shown-${user.id}-${now.getFullYear()}-${todayMD}`;
    if (localStorage.getItem(key)) return;

    localStorage.setItem(key, "1");
    setShowBirthday(true);
  }, [user.birthday, user.id]);

  useEffect(() => {
    const key = "well-notifications-onboarding-v1";
    if (localStorage.getItem(key)) return;
    setShowNotifOptIn(true);
  }, []);

  const handleCloseNotifOptIn = () => {
    localStorage.setItem("well-notifications-onboarding-v1", "1");
    setShowNotifOptIn(false);
  };

  useEffect(() => {
    const key = "well-feature-tour-v1";
    if (localStorage.getItem(key)) return;
    setShowTour(true);
  }, []);

  const handleCloseTour = () => {
    localStorage.setItem("well-feature-tour-v1", "1");
    setShowTour(false);
  };

  const trialStatus = getTrialStatus(user.trialEndsAt);
  const showTrialBanner = trialStatus.isActive && !isActiveMember() && !user.isAdmin;

  const today = todayISO();
  const workoutLog = user.workoutLog ?? [];
  const breathworkLog = user.breathworkLog ?? [];
  const wellActivityLog = user.wellActivityLog ?? [];
  const [resistanceDone, setResistanceDone] = useState(() => localStorage.getItem(`well-resistance-${todayISO()}`) === "1");
  const [stretchingDone, setStretchingDone] = useState(() => localStorage.getItem(`well-stretching-${todayISO()}`) === "1");
  const [breathworkDone, setBreathworkDone] = useState(() => localStorage.getItem(`well-breathwork-marked-${todayISO()}`) === "1");
  const [sleepDone] = useState(() => localStorage.getItem(`well-sleep-${todayISO()}`) === "1");

  const handleResistance = () => { localStorage.setItem(`well-resistance-${today}`, "1"); setResistanceDone(true); if (user.email) logActivity(user.email, "resistance_training").catch(() => {}); };
  const handleStretching = () => { localStorage.setItem(`well-stretching-${today}`, "1"); setStretchingDone(true); if (user.email) logActivity(user.email, "stretching").catch(() => {}); };
  const handleBreathwork = () => { localStorage.setItem(`well-breathwork-marked-${today}`, "1"); setBreathworkDone(true); if (user.email) logActivity(user.email, "breathwork").catch(() => {}); };
  const handleSleep = () => navigate("/wellness?tab=activities");

  return (
    <div className="px-4 pb-6" style={{ paddingTop: `max(1.25rem, env(safe-area-inset-top))` }}>
      <div className="flex items-center justify-between mb-6">
        <img src={LOGO_URL} alt="WELL Collective" className="h-24" />
        <div className="flex items-center gap-3">
          <Link to="/notifications" className="relative w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 border border-border">
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-brand text-[10px] flex items-center justify-center text-white font-bold">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link to="/profile">
            <Avatar src={user.avatar} alt={user.name} size={36} ring />
          </Link>
        </div>
      </div>

      {showTrialBanner && (
        <div className="gradient-brand p-[1px] rounded-card mb-4">
          <div className="bg-surface rounded-card p-3 flex items-center gap-2.5">
            <Gift size={18} className="text-brand-light shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text">Free Trial Active</p>
              <p className="text-[11px] text-text-muted">{trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? "s" : ""} remaining</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-1">Hi {user.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-text-muted">Welcome back to the WELL COLLECTIVE.</p>
      </div>

      {/* Morning wellness progress — tappable chips */}
      {(() => {
        const workoutDone = workoutLog.includes(today);
        const wellActDone = wellActivityLog.includes(today);
        const bwDone = breathworkLog.includes(today) || breathworkDone;
        const items: { key: string; label: string; done: boolean; onTap?: () => void }[] = [
          { key: "workout",      label: "Workout",      done: workoutDone,  onTap: workoutDone   ? undefined : () => logWorkoutCompletion() },
          { key: "breathwork",   label: "Breathwork",   done: bwDone,       onTap: bwDone        ? undefined : handleBreathwork },
          { key: "well-activity",label: "Well Activity",done: wellActDone,  onTap: wellActDone   ? undefined : () => logWellActivityCompletion() },
          { key: "resistance",   label: "Resistance",   done: resistanceDone,onTap: resistanceDone? undefined : handleResistance },
          { key: "stretching",   label: "Stretching",   done: stretchingDone,onTap: stretchingDone? undefined : handleStretching },
          { key: "sleep",        label: "Sleep",        done: sleepDone,    onTap: sleepDone     ? undefined : handleSleep },
        ];
        const doneCount = items.filter((i) => i.done).length;
        const pct = Math.round((doneCount / items.length) * 100);
        return (
          <div className="mb-6 rounded-2xl border border-brand-light/20 p-5" style={{ background: "linear-gradient(135deg, rgba(8,18,48,0.92) 0%, rgba(12,32,72,0.88) 100%)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white tracking-wide">Today's Progress</p>
              <span className="text-xs font-semibold text-brand-light">{doneCount} of {items.length}</span>
            </div>
            <div className="h-[3px] rounded-full mb-4" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-[3px] rounded-full gradient-brand transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {items.map((item) => (
                <button
                  key={item.key}
                  onClick={item.onTap}
                  disabled={item.done || !item.onTap}
                  className="flex items-center gap-2 text-left disabled:cursor-default"
                >
                  {item.done
                    ? <CheckCircle2 size={13} className="text-brand-light shrink-0" />
                    : <div className="w-3 h-3 rounded-full border border-white/30 shrink-0" />}
                  <span className={`text-xs font-semibold truncate ${item.done ? "text-white" : "text-white/50"}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
            {doneCount < items.length && (
              <p className="text-[10px] text-white/30 text-center mt-3">Tap any item to mark it done</p>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl gradient-brand shadow-glow flex items-center justify-center">
              <Icon size={20} className="text-white" />
            </div>
            <span className="text-[11px] text-text-muted text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      <a
        href="sms:+17863093356"
        className="flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow mb-6"
      >
        <Phone size={16} />
        Contact Loretta
      </a>

      {todaysInspiration && (
        <div className="mb-6">
          <SectionHeader title="Today's Inspiration" to="/inspirations" />
          <InspirationCard inspiration={todaysInspiration} compact />
        </div>
      )}

      {upcomingEvents.length > 0 && (
        <div className="mb-6">
          <SectionHeader title="Upcoming Events" to="/events" />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
        </div>
      )}

      <TribeActivityStrip />

      <WellCupLeaderboard />

      <div className="mb-6 mt-6">
        <SectionHeader title="From the Community" to="/community" />
        <div className="flex flex-col gap-3">
          {latestThreads.map((thread) => (
            <ThreadPreviewCard key={thread.id} thread={thread} />
          ))}
        </div>
      </div>

      {showBirthday && <BirthdayModal name={user.name} email={user.email} onClose={() => setShowBirthday(false)} />}
      {!showBirthday && showTour && <FeatureTourModal onClose={handleCloseTour} />}
      {!showBirthday && !showTour && showNotifOptIn && <NotificationOptInModal onClose={handleCloseNotifOptIn} />}
    </div>
  );
}
