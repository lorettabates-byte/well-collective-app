import { Calendar, Check, Loader2, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const WP_EVENTS_URL = "https://lorettabates.com/wp-json/tribe/events/v1/events";

interface AppEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  image?: string;
  source: "app" | "website";
}

interface Props {
  memberId: string;
  memberName: string;
  onClose: () => void;
}

async function fetchAppEvents(): Promise<AppEvent[]> {
  if (!API_URL) return [];
  const res = await fetch(`${API_URL}/api/events`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.events || []).map((e: { id: number; title: string; date: string; time?: string; location?: string; image?: string }) => ({
    id: `app-${e.id}`,
    title: e.title,
    date: e.date,
    time: e.time,
    location: e.location,
    image: e.image,
    source: "app" as const,
  }));
}

async function fetchWebsiteEvents(): Promise<AppEvent[]> {
  try {
    const res = await fetch(`${WP_EVENTS_URL}?per_page=50&status=publish`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    const events = data.events || data || [];
    return events
      .filter((e: { start_date?: string }) => e.start_date)
      .map((e: {
        id: number;
        title?: { rendered?: string } | string;
        start_date: string;
        start_time?: string;
        venue?: { venue?: string };
        image?: { url?: string; sizes?: { medium?: { url?: string } } };
      }) => {
        const titleStr = typeof e.title === "string" ? e.title : e.title?.rendered ?? "";
        return {
          id: `wp-${e.id}`,
          title: titleStr.replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"'),
          date: e.start_date.slice(0, 10),
          time: e.start_date.slice(11, 16) || undefined,
          location: e.venue?.venue,
          image: e.image?.sizes?.medium?.url ?? e.image?.url,
          source: "website" as const,
        };
      });
  } catch {
    return [];
  }
}

export default function EventInvite({ memberId, memberName, onClose }: Props) {
  const { user } = useApp();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppEvent | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.allSettled([fetchAppEvents(), fetchWebsiteEvents()])
      .then(([appResult, wpResult]) => {
        const appEvents = appResult.status === "fulfilled" ? appResult.value : [];
        const wpEvents = wpResult.status === "fulfilled" ? wpResult.value : [];
        const seenIds = new Set<string>();
        const merged: AppEvent[] = [];
        for (const e of [...appEvents, ...wpEvents]) {
          if (!seenIds.has(e.id) && e.date >= today) {
            seenIds.add(e.id);
            merged.push(e);
          }
        }
        merged.sort((a, b) => a.date.localeCompare(b.date));
        setEvents(merged);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!API_URL || !user.email || !selected) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/api/tribe/${memberId}/event-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, eventTitle: selected.title, eventDate: selected.date }),
      });
      setSent(true);
      setTimeout(onClose, 1800);
    } catch {
      // no-op
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[500] flex flex-col">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl flex flex-col min-h-0" style={{ height: "92dvh", maxHeight: "92dvh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-text">Invite to an Event</h2>
            <p className="text-xs text-text-muted">Choose an upcoming event to share with {memberName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <X size={14} className="text-text-muted" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto flex-1 min-h-0 px-4 py-4 flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="text-brand-light animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-10">No upcoming events right now.</p>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelected(event)}
                className={`w-full text-left rounded-card border transition-colors p-3 flex items-stretch gap-3 ${
                  selected?.id === event.id ? "border-brand-light/40 bg-brand-light/5" : "glass-card border-border"
                }`}
                style={{ minHeight: 112, height: "auto", WebkitAppearance: "none" }}
              >
                {event.image ? (
                  <img
                    src={event.image}
                    alt=""
                    className="rounded-card object-cover shrink-0 bg-surface-2 border border-border"
                    style={{ width: 84, height: 84, minWidth: 84, minHeight: 84, display: "block" }}
                  />
                ) : (
                  <div className="rounded-card bg-surface-2 border border-border flex items-center justify-center shrink-0" style={{ width: 84, height: 84, minWidth: 84, minHeight: 84 }}>
                    <Calendar size={20} className="text-brand-light" />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-text leading-snug line-clamp-2">{event.title}</p>
                    {selected?.id === event.id && <Check size={16} className="text-brand-light shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-xs text-text-muted mt-1.5 leading-normal">
                    {new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {event.time && ` · ${event.time}`}
                  </p>
                  {event.location && (
                    <p className="flex items-center gap-1 text-[11px] text-text-dim mt-1 line-clamp-1 leading-normal">
                      <MapPin size={10} className="shrink-0" /> {event.location}
                    </p>
                  )}
                  {event.source === "website" && (
                    <span className="inline-block mt-2 text-[10px] font-bold text-brand-light/60 uppercase tracking-wide leading-none">lorettabates.com</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-4 pt-3 border-t border-border shrink-0 bg-surface" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}>
          {sent ? (
            <div className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-brand-light">
              <Check size={16} />
              Event invite sent to {memberName}!
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={!selected || sending || loading}
              className="w-full gradient-brand text-white text-sm font-semibold rounded-pill py-3 disabled:opacity-40"
            >
              {sending ? "Sending…" : selected ? `Invite to "${selected.title}"` : "Select an event above"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
