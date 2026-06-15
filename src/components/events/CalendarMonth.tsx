import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalendarMonthProps {
  year: number;
  month: number; // 0-indexed
  eventDates: Set<string>;
  birthdayDates?: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onChangeMonth: (year: number, month: number) => void;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function CalendarMonth({
  year,
  month,
  eventDates,
  birthdayDates,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: CalendarMonthProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goPrev = () => {
    if (month === 0) onChangeMonth(year - 1, 11);
    else onChangeMonth(year, month - 1);
  };

  const goNext = () => {
    if (month === 11) onChangeMonth(year + 1, 0);
    else onChangeMonth(year, month + 1);
  };

  return (
    <div className="glass-card rounded-card p-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-text">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-2 border border-border">
            <ChevronLeft size={14} />
          </button>
          <button onClick={goNext} className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-2 border border-border">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-[11px] text-text-dim font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const hasEvent = eventDates.has(dateStr);
          const hasBirthday = birthdayDates?.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateStr)}
              className={`relative aspect-square flex items-center justify-center text-xs rounded-xl transition-colors ${
                isSelected
                  ? "gradient-brand text-white font-bold"
                  : isToday
                  ? "border border-brand-light/40 text-brand-light font-semibold"
                  : "text-text-muted hover:bg-surface-2"
              }`}
            >
              {day}
              {hasBirthday && (
                <span className="absolute -top-1 -right-1 text-[10px] leading-none">🎂</span>
              )}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-light" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
