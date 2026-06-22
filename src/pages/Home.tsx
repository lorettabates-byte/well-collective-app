import { Bell, Calendar, Gift, MessageCircle, Music, PenSquare, Phone, Rss, Salad, Sparkles, Video, Waves } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BirthdayModal from "../components/BirthdayModal";
import NotificationOptInModal from "../components/NotificationOptInModal";
import EventCard from "../components/events/EventCard";
import ThreadPreviewCard from "../components/community/ThreadPreviewCard";
import InspirationCard from "../components/inspiration/InspirationCard";
import SectionHeader from "../components/ui/SectionHeader";
import Avatar from "../components/ui/Avatar";
import { LOGO_URL } from "../components/layout/MobileShell";
import { useEventsFeed } from "../hooks/useEventsFeed";
import { useApp } from "../store/AppContext";
import { getTrialStatus, isActiveMember } from "../utils/trial";

const QUICK_LINKS = [
  { to: "/community", label: "Community", icon: MessageCircle },
  { to: "/inspirations", label: "Inspiration", icon: Sparkles },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/community/new", label: "New Post", icon: PenSquare },
  { to: "/videos", label: "Classes", icon: Video },
  { to: "/wellness", label: "Wellness", icon: Waves },
  { to: "/nutrition", label: "Nutrition", icon: Salad },
  { to: "/blog", label: "Blog", icon: Rss },
  { to: "/music", label: "Music", icon: Music },
];

export default function Home() {
  const { user, threads, inspirations, events, notifications, featuredEventId } = useApp();
  const { events: liveEvents } = useEventsFeed();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const todaysInspiration = inspirations[0];
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

  const trialStatus = getTrialStatus(user.trialEndsAt);
  const showTrialBanner = trialStatus.isActive && !isActiveMember() && !user.isAdmin;

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

      <div className="mb-6">
        <SectionHeader title="From the Community" to="/community" />
        <div className="flex flex-col gap-3">
          {latestThreads.map((thread) => (
            <ThreadPreviewCard key={thread.id} thread={thread} />
          ))}
        </div>
      </div>

      {showBirthday && <BirthdayModal name={user.name} email={user.email} onClose={() => setShowBirthday(false)} />}
      {!showBirthday && showNotifOptIn && <NotificationOptInModal onClose={handleCloseNotifOptIn} />}
    </div>
  );
}
