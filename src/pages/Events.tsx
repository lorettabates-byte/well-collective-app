import { Calendar, CalendarDays, List, Star, X } from "lucide-react";
import SectionIntroModal from "../components/SectionIntroModal";
import { useEffect, useMemo, useState } from "react";
import BirthdayCard from "../components/events/BirthdayCard";
import CalendarMonth from "../components/events/CalendarMonth";
import EventCard from "../components/events/EventCard";
import TopBar from "../components/layout/TopBar";
import { useEventsFeed } from "../hooks/useEventsFeed";
import { useApp } from "../store/AppContext";
import { useSectionTracking } from "../hooks/useSectionTracking";
import { birthdayDateForYear, nextBirthdayDate } from "../utils/birthday";
import { formatDateLong } from "../utils/format";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface MemberBirthday {
  id: string;
  name: string;
  birthday: string;
}

export default function Events() {
  useSectionTracking("events");
  const { user, events, featuredEventId } = useApp();
  const { events: liveEvents } = useEventsFeed();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Other members' birthdays, synced from the shared member directory so
  // everyone's opted-in birthday shows on everyone's calendar — not just
  // their own. Falls back to just the local user's own birthday if offline.
  const [memberBirthdays, setMemberBirthdays] = useState<MemberBirthday[]>(() =>
    user.birthday && user.showBirthdayOnCalendar ? [{ id: user.id, name: user.name, birthday: user.birthday }] : []
  );

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/members/birthdays`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.birthdays) setMemberBirthdays(data.birthdays);
      })
      .catch(() => {
        // offline or backend unreachable — fall back to whatever was set initially
      });
  }, []);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const allEvents = useMemo(() => [...events, ...liveEvents], [events, liveEvents]);

  const eventDates = useMemo(() => new Set(allEvents.map((e) => e.date)), [allEvents]);

  const sortedEvents = useMemo(
    () => [...allEvents].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [allEvents]
  );

  const todayStr = today.toISOString().slice(0, 10);

  const featuredEvent = useMemo(
    () => sortedEvents.find((e) => e.id === featuredEventId && e.date >= todayStr),
    [sortedEvents, featuredEventId, todayStr]
  );

  // The featured event intentionally also appears here in its natural date
  // slot, not just in the featured banner above — it's still a real
  // upcoming event, so hiding it from the list made it look like it had
  // disappeared from the calendar/list once "featured."
  const upcomingEvents = useMemo(
    () => sortedEvents.filter((e) => e.date >= todayStr),
    [sortedEvents, todayStr]
  );

  const selectedDateEvents = selectedDate
    ? sortedEvents.filter((e) => e.date === selectedDate)
    : [];

// This year's calendar date for each member's birthday.
  const birthdaysThisMonth = useMemo(
    () => memberBirthdays.map((m) => ({ ...m, date: birthdayDateForYear(m.birthday, year) })),
    [memberBirthdays, year]
  );

  const birthdayDates = useMemo(() => new Set(birthdaysThisMonth.map((b) => b.date)), [birthdaysThisMonth]);

  const selectedDateBirthdays = selectedDate ? birthdaysThisMonth.filter((b) => b.date === selectedDate) : [];

  // Only surface birthdays in the upcoming list if they're coming up soon.
  const maxBirthdayLookahead = useMemo(() => {
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);
    return limit.toISOString().slice(0, 10);
  }, [today]);

  const upcomingBirthdays = useMemo(
    () =>
      memberBirthdays
        .map((m) => ({ ...m, date: nextBirthdayDate(m.birthday) }))
        .filter((m) => m.date <= maxBirthdayLookahead),
    [memberBirthdays, maxBirthdayLookahead]
  );

  type UpcomingItem =
    | { kind: "event"; event: (typeof upcomingEvents)[number] }
    | { kind: "birthday"; name: string; date: string; id: string };

  const upcomingItems = useMemo<UpcomingItem[]>(() => {
    const items: UpcomingItem[] = upcomingEvents.map((event) => ({ kind: "event", event }));
    upcomingBirthdays.forEach((b) => items.push({ kind: "birthday", name: b.name, date: b.date, id: b.id }));
    return items.sort((a, b) => {
      const dateA = a.kind === "event" ? a.event.date : a.date;
      const dateB = b.kind === "event" ? b.event.date : b.date;
      return dateA.localeCompare(dateB);
    });
  }, [upcomingEvents, upcomingBirthdays]);

  return (
    <div>
      <TopBar
        title="Events"
        subtitle="Workshops, classes, and meetups"
        icon={Calendar}
        iconColor="#0191CE"
        showBack
        right={
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-pill p-1">
            <button
              onClick={() => setView("calendar")}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                view === "calendar" ? "gradient-brand text-white" : "text-text-muted"
              }`}
              aria-label="Calendar view"
            >
              <CalendarDays size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                view === "list" ? "gradient-brand text-white" : "text-text-muted"
              }`}
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        }
      />

      <SectionIntroModal sectionKey="events" />
      {!bannerDismissed && (
        <div className="mx-4 mt-4 flex flex-col gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-card px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-start gap-2">
                <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300 font-medium">Attending an event earns you <strong>25 WELL Cup points!</strong></p>
              </div>
              <div className="flex items-start gap-2">
                <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300 font-medium">WELL Escape retreats earn <strong>100 WELL Cup points!</strong> Be sure to register ahead of time here on the app!</p>
              </div>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="w-5 h-5 flex items-center justify-center text-yellow-500/60 hover:text-yellow-400 shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 flex flex-col gap-4">
        {view === "calendar" ? (
          <>
            <CalendarMonth
              year={year}
              month={month}
              eventDates={eventDates}
              birthdayDates={birthdayDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onChangeMonth={(y, m) => {
                setYear(y);
                setMonth(m);
                setSelectedDate(null);
              }}
            />

            {selectedDate ? (
              <div>
                <h2 className="text-sm font-bold text-text mb-3">{formatDateLong(selectedDate)}</h2>
                {selectedDateEvents.length === 0 && selectedDateBirthdays.length === 0 ? (
                  <p className="text-sm text-text-muted">No events on this day.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {selectedDateBirthdays.map((b) => (
                      <BirthdayCard key={b.id} name={b.name} date={b.date} />
                    ))}
                    {selectedDateEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-bold text-text mb-3">Upcoming Events</h2>
                <div className="flex flex-col gap-3">
                  {featuredEvent && (
                    <div className="-mx-1 px-1 pb-1">
                      <div className="gradient-brand p-[2px] rounded-card shadow-glow">
                        <div className="bg-surface rounded-card p-1">
                          <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-brand-light">
                            <Star size={14} className="fill-brand-light" />
                            <span className="text-[11px] font-bold uppercase tracking-wide">Featured Event</span>
                          </div>
                          <EventCard event={featuredEvent} />
                        </div>
                      </div>
                    </div>
                  )}
                  {upcomingItems.map((item) =>
    item.kind === "birthday" ? (
                      <BirthdayCard key={item.id} name={item.name} date={item.date} />
                    ) : (
                      <EventCard key={item.event.id} event={item.event} />
                    )
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {featuredEvent && (
              <div className="-mx-1 px-1 pb-1">
                <div className="gradient-brand p-[2px] rounded-card shadow-glow">
                  <div className="bg-surface rounded-card p-1">
                    <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-brand-light">
                      <Star size={14} className="fill-brand-light" />
                      <span className="text-[11px] font-bold uppercase tracking-wide">Featured Event</span>
                    </div>
                    <EventCard event={featuredEvent} />
                  </div>
                </div>
              </div>
            )}
            {upcomingItems.length === 0 && !featuredEvent ? (
              <p className="text-sm text-text-muted text-center py-12">No upcoming events.</p>
            ) : (
              upcomingItems.map((item) =>
                item.kind === "birthday" ? (
                  <BirthdayCard key={item.id} name={item.name} date={item.date} />
                ) : (
                  <EventCard key={item.event.id} event={item.event} />
                )
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
