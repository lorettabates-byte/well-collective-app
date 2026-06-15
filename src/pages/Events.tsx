import { Calendar, CalendarDays, List, Star } from "lucide-react";
import { useMemo, useState } from "react";
import BirthdayCard from "../components/events/BirthdayCard";
import CalendarMonth from "../components/events/CalendarMonth";
import EventCard from "../components/events/EventCard";
import TopBar from "../components/layout/TopBar";
import { useEventsFeed } from "../hooks/useEventsFeed";
import { useApp } from "../store/AppContext";
import { birthdayDateForYear, nextBirthdayDate } from "../utils/birthday";
import { formatDateLong } from "../utils/format";

export default function Events() {
  const { user, events, featuredEventId } = useApp();
  const { events: liveEvents } = useEventsFeed();
  const [view, setView] = useState<"calendar" | "list">("calendar");

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

  const upcomingEvents = useMemo(
    () => sortedEvents.filter((e) => e.date >= todayStr && e.id !== featuredEvent?.id),
    [sortedEvents, todayStr, featuredEvent]
  );

  const selectedDateEvents = selectedDate
    ? sortedEvents.filter((e) => e.date === selectedDate)
    : [];

  const showBirthday = !!user.birthday && !!user.showBirthdayOnCalendar;
  const birthdayDateThisMonth = showBirthday ? birthdayDateForYear(user.birthday!, year) : null;
  const birthdayDates = useMemo(() => {
    const set = new Set<string>();
    if (birthdayDateThisMonth) set.add(birthdayDateThisMonth);
    return set;
  }, [birthdayDateThisMonth]);

  const upcomingBirthday = showBirthday ? nextBirthdayDate(user.birthday!) : null;
  const isSelectedBirthday = !!selectedDate && selectedDate === birthdayDateThisMonth;

  // Only surface the user's birthday in the upcoming list if it's coming up soon.
  const maxBirthdayLookahead = useMemo(() => {
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);
    return limit.toISOString().slice(0, 10);
  }, [today]);

  const showUpcomingBirthday = !!upcomingBirthday && upcomingBirthday <= maxBirthdayLookahead;

  type UpcomingItem = { kind: "event"; event: (typeof upcomingEvents)[number] } | { kind: "birthday"; date: string };

  const upcomingItems = useMemo<UpcomingItem[]>(() => {
    const items: UpcomingItem[] = upcomingEvents.map((event) => ({ kind: "event", event }));
    if (showUpcomingBirthday) items.push({ kind: "birthday", date: upcomingBirthday! });
    return items.sort((a, b) => {
      const dateA = a.kind === "event" ? a.event.date : a.date;
      const dateB = b.kind === "event" ? b.event.date : b.date;
      return dateA.localeCompare(dateB);
    });
  }, [upcomingEvents, showUpcomingBirthday, upcomingBirthday]);

  return (
    <div>
      <TopBar
        title="Events"
        subtitle="Workshops, classes, and meetups"
        icon={Calendar}
        iconColor="#0191CE"
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
                {selectedDateEvents.length === 0 && !isSelectedBirthday ? (
                  <p className="text-sm text-text-muted">No events on this day.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {isSelectedBirthday && <BirthdayCard name={user.name} date={selectedDate} />}
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
                      <BirthdayCard key="birthday" name={user.name} date={item.date} />
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
                  <BirthdayCard key="birthday" name={user.name} date={item.date} />
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
