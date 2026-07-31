import { Calendar, Mail, MessageCircle, PenSquare, Sparkles, Trophy, Users } from "lucide-react";
import SectionIntroModal from "../components/SectionIntroModal";
import WeeklyThemeBar from "../components/WeeklyThemeBar";
import { Link } from "react-router-dom";
import ThreadPreviewCard from "../components/community/ThreadPreviewCard";
import TopBar from "../components/layout/TopBar";
import TribeActivityStrip from "../components/home/TribeActivityStrip";
import EventCard from "../components/events/EventCard";
import { useApp } from "../store/AppContext";
import { useSectionTracking } from "../hooks/useSectionTracking";
import { useEventsFeed } from "../hooks/useEventsFeed";
import { getTrendingThreads } from "../utils/threadUtils";
import { useUnreadMessageCount } from "../hooks/useUnreadMessageCount";

export default function Community() {
  useSectionTracking("community");
  const { threads, events, user, currentWeeklyTheme, featuredEventId } = useApp();
  const { events: liveEvents } = useEventsFeed();
  const unreadMessageCount = useUnreadMessageCount(user.email);
  const communityThreads = getTrendingThreads(threads, 5, 1);

  const allUpcomingEvents = [...events, ...liveEvents]
    .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date));
  const featuredEvent = allUpcomingEvents.find((e) => e.id === featuredEventId);
  const upcomingEvents = [
    ...(featuredEvent ? [featuredEvent] : []),
    ...allUpcomingEvents.filter((e) => e.id !== featuredEventId),
  ].slice(0, 4);

  return (
    <div>
      <TopBar title="Community" subtitle="Connect, share, and support one another" icon={MessageCircle} iconColor="#0191CE" showBack />
      <SectionIntroModal sectionKey="community" />
      <div className="px-4 pt-4">
        <WeeklyThemeBar theme={currentWeeklyTheme} />

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3 mb-4 mt-3">
          <Link
            to="/community/new"
            className="flex items-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-3 px-4 shadow-glow justify-center"
          >
            <PenSquare size={16} />
            New Post
          </Link>
          <Link
            to="/messages"
            className="relative flex items-center gap-2 glass-card text-text text-sm font-semibold rounded-pill py-3 px-4 justify-center"
          >
            <Mail size={16} />
            Messages
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-brand text-[10px] flex items-center justify-center text-white font-bold">
                {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
              </span>
            )}
          </Link>
          <Link
            to="/tribe"
            className="flex items-center gap-2 glass-card text-text text-sm font-semibold rounded-pill py-3 px-4 justify-center"
          >
            <Users size={16} />
            My Tribe
          </Link>
        </div>

        {/* From the Community — thread feed with author info */}
        {communityThreads.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <Sparkles size={15} className="text-brand-light" />
                From the Community
              </h2>
              <Link to="/trending" className="text-xs text-brand-light font-semibold">
                See all
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {communityThreads.map((thread) => (
                <ThreadPreviewCard key={thread.id} thread={thread} />
              ))}
            </div>
          </div>
        )}

        {/* WELL Tribe — 3×3 grid */}
        <TribeActivityStrip grid />

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <Calendar size={15} className="text-brand-light" />
                Upcoming Events
              </h2>
              <Link to="/events" className="text-xs text-brand-light font-semibold">
                View all
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {upcomingEvents.map((event) => (
                event.id === featuredEventId ? (
                  <div key={event.id} className="shrink-0">
                    <div className="flex items-center gap-1 gradient-brand text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-glow mb-1.5 w-fit">
                      <Sparkles size={8} /> Featured
                    </div>
                    <Link to="/events" className="block rounded-card ring-1 ring-brand-light/50 shadow-glow">
                      <EventCard event={event} compact />
                    </Link>
                  </div>
                ) : (
                  <Link key={event.id} to="/events" className="shrink-0 rounded-card self-end">
                    <EventCard event={event} compact />
                  </Link>
                )
              ))}
            </div>
          </div>
        )}

        <Link
          to="/well-cup"
          className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5 mt-2 mb-6"
        >
          <div className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center shrink-0">
            <Trophy size={16} className="text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text">WELL Cup Leaderboard</p>
            <p className="text-xs text-text-muted">Today's rankings, winners &amp; champions</p>
          </div>
          <span className="text-[11px] font-bold text-yellow-400 shrink-0">View →</span>
        </Link>
      </div>
    </div>
  );
}
