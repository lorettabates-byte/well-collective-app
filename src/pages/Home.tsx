import { Bell, Calendar, Dumbbell, MessageCircle, PenSquare, Rss, Sparkles, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BirthdayModal from "../components/BirthdayModal";
import EventCard from "../components/events/EventCard";
import ThreadPreviewCard from "../components/community/ThreadPreviewCard";
import InspirationCard from "../components/inspiration/InspirationCard";
import SectionHeader from "../components/ui/SectionHeader";
import Avatar from "../components/ui/Avatar";
import { LOGO_URL } from "../components/layout/MobileShell";
import { useApp } from "../store/AppContext";

const QUICK_LINKS = [
  { to: "/community", label: "Community", icon: MessageCircle },
  { to: "/inspirations", label: "Inspiration", icon: Sparkles },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/community/general-chat/new", label: "New Post", icon: PenSquare },
  { to: "/videos", label: "Video Library", icon: Video },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/blog", label: "Blog", icon: Rss },
];

export default function Home() {
  const { user, threads, inspirations, events, notifications } = useApp();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const todaysInspiration = inspirations[0];
  const upcomingEvents = [...events]
    .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const latestThreads = [...threads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  const [showBirthday, setShowBirthday] = useState(false);

  useEffect(() => {
    if (!user.birthday) return;
    const now = new Date();
    const todayMD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (user.birthday !== todayMD) return;

    const key = `well-birthday-shown-${user.id}-${now.getFullYear()}`;
    if (localStorage.getItem(key)) return;

    localStorage.setItem(key, "1");
    setShowBirthday(true);
  }, [user.birthday, user.id]);

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-6">
        <img src={LOGO_URL} alt="WELL Collective" className="h-7" />
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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-1">Hi {user.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-text-muted">Welcome back to your WELL community.</p>
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

      {showBirthday && <BirthdayModal name={user.name} onClose={() => setShowBirthday(false)} />}
    </div>
  );
}
