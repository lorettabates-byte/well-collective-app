import { CalendarDays, List } from "lucide-react";
import { useMemo, useState } from "react";
import CalendarMonth from "../components/events/CalendarMonth";
import EventCard from "../components/events/EventCard";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { formatDateLong } from "../utils/format";

export default function Events() {
  const { events } = useApp();
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventDates = useMemo(() => new Set(events.map((e) => e.date)), [events]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [events]
  );

  const upcomingEvents = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return sortedEvents.filter((e) => e.date >= todayStr);
  }, [sortedEvents]);

  const selectedDateEvents = selectedDate
    ? sortedEvents.filter((e) => e.date === selectedDate)
    : [];

  return (
    <div>
      <TopBar
        title="Events"
        subtitle="Workshops, classes, and meetups"
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
                {selectedDateEvents.length === 0 ? (
                  <p className="text-sm text-text-muted">No events on this day.</p>
                ) : (
                  <div className="flex flex-col gap-3">
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
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-12">No upcoming events.</p>
            ) : (
              upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
