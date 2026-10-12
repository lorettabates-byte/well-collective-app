import { CalendarX, Play, X } from "lucide-react";
import { useState } from "react";
import { easternToday, useClassCancellations } from "../hooks/useClassCancellations";
import { useApp } from "../store/AppContext";
import { openMemberLink } from "../utils/ssoLink";

// Shown on Home and Classes from 6 days before a cancelled class until that
// class day ends, unless the member closes it. Text comes from the server so
// the app and pushes match.
const DISMISS_KEY = (date: string) => `well-class-cancel-closed:${date}`;

function isClosed(date: string): boolean {
  try { return localStorage.getItem(DISMISS_KEY(date)) === "1"; } catch { return false; }
}

export default function ClassCancellationBanner({ className = "" }: { className?: string }) {
  const { user } = useApp();
  const [closed, setClosed] = useState<string[]>([]);
  const today = easternToday();
  const cancellations = useClassCancellations().filter(
    (c) => (c.banner_from ?? c.date) <= today && !closed.includes(c.date) && !isClosed(c.date)
  );
  if (cancellations.length === 0) return null;

  const close = (date: string) => {
    try { localStorage.setItem(DISMISS_KEY(date), "1"); } catch { /* still hides for this visit */ }
    setClosed((prev) => [...prev, date]);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {cancellations.map((c) => (
        <div key={c.date} className="gradient-brand p-[1px] rounded-card animate-fade-in-up">
          <div className="bg-surface rounded-card p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <CalendarX size={20} className="text-brand-light shrink-0 mt-0.5" />
              <p className="flex-1 text-sm font-semibold text-text leading-snug">{c.banner}</p>
              <button
                type="button"
                onClick={() => close(c.date)}
                aria-label="Close"
                className="shrink-0 -mt-1 -mr-1 w-8 h-8 flex items-center justify-center rounded-full text-text-muted"
              >
                <X size={18} />
              </button>
            </div>
            {c.replacement && (
              <button
                type="button"
                onClick={() => openMemberLink(c.replacement!.url, user.email)}
                className="self-start flex items-center gap-2 gradient-brand rounded-full px-4 py-2 text-sm font-bold text-white"
              >
                <Play size={14} className="fill-white" />
                Dance with this class instead
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
