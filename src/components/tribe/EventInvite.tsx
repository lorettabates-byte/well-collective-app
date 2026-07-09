import { Calendar, Check, Loader2, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const WP_EVENTS_URL = "https://lorettabates.com/wp-json/tribe/events/v1/events";
const APP_EVENT_TIMEOUT_MS = 4500;
const WEBSITE_EVENT_TIMEOUT_MS = 3500;

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

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<unknown> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeout = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, controller ? { signal: controller.signal } : undefined);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    if (timeout) window.clearTimeout(timeout);
  }
}

async function fetchAppEvents(): Promise<AppEvent[]> {
  if (!API_URL) return [];
  const data = await fetchJsonWithTimeout(`${API_URL}/api/events?upcoming=true&light=true&limit=100`, APP_EVENT_TIMEOUT_MS);
  return normalizeAppEvents(data);
}

async function fetchWebsiteEvents(): Promise<AppEvent[]> {
  const data = await fetchJsonWithTimeout(`${WP_EVENTS_URL}?per_page=50&status=publish`, WEBSITE_EVENT_TIMEOUT_MS);
  if (!data || typeof data !== "object") return [];
  const events = Array.isArray((data as { events?: unknown[] }).events)
    ? (data as { events: unknown[] }).events
    : Array.isArray(data)
      ? data
      : [];
  return events
    .filter((e): e is {
      id: number;
      title?: { rendered?: string } | string;
      start_date: string;
      start_time?: string;
      venue?: { venue?: string };
      image?: { url?: string; sizes?: { medium?: { url?: string } } };
    } => typeof e === "object" && e !== null && typeof (e as { start_date?: unknown }).start_date === "string")
    .map((e) => {
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
}

function normalizeAppEvents(data: unknown): AppEvent[] {
  if (!data || typeof data !== "object" || !Array.isArray((data as { events?: unknown[] }).events)) return [];
  const normalized: Array<AppEvent | null> = (data as { events: unknown[] }).events.map((e) => {
    if (!e || typeof e !== "object") return null;
    const event = e as { id?: number | string; title?: string; date?: string; time?: string; location?: string; image?: string };
    const date = normalizeEventDate(event.date);
    if (!date || !event.title || event.id == null) return null;
    return {
      id: `app-${event.id}`,
      title: event.title,
      date,
      time: event.time,
      location: event.location,
      image: event.image,
      source: "app" as const,
    };
  });
  return normalized.filter((event): event is AppEvent => event !== null);
}

function normalizeLocalEvents(events: Array<{ id: string; title: string; date: string; time?: string; location?: string; image?: string }>): AppEvent[] {
  const normalized: Array<AppEvent | null> = events.map((event) => {
    const date = normalizeEventDate(event.date);
    if (!date || !event.title) return null;
    return {
      id: `local-${event.id}`,
      title: event.title,
      date,
      time: event.time,
      location: event.location,
      image: event.image?.startsWith("data:") ? undefined : event.image,
      source: "app" as const,
    };
  });
  return normalized.filter((event): event is AppEvent => event !== null);
}

function mergeEvents(existing: AppEvent[], incoming: AppEvent[], today: string): AppEvent[] {
  const byKey = new Map<string, AppEvent>();
  for (const event of [...existing, ...incoming]) {
    if (event.date < today) continue;
    const key = `${event.source}:${event.title.toLowerCase()}:${event.date}:${event.time ?? ""}`;
    if (!byKey.has(key)) byKey.set(key, event);
  }
  return Array.from(byKey.values()).sort((a, b) => `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`));
}

function normalizeEventDate(date?: string): string {
  if (!date) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export default function EventInvite({ memberId, memberName, onClose }: Props) {
  const { user, events: localEvents } = useApp();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [selected, setSelected] = useState<AppEvent | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    const immediateLocalEvents = normalizeLocalEvents(localEvents);

    setEvents(mergeEvents([], immediateLocalEvents, today));
    setLoading(true);
    fetchAppEvents()
      .then((appEvents) => {
        if (cancelled) return;
        setEvents((current) => mergeEvents(current, appEvents, today));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    setWebsiteLoading(true);
    fetchWebsiteEvents()
      .then((websiteEvents) => {
        if (cancelled) return;
        setEvents((current) => mergeEvents(current, websiteEvents, today));
      })
      .finally(() => {
        if (!cancelled) setWebsiteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [localEvents]);

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
          {loading && events.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="text-brand-light animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-10">No upcoming events right now.</p>
          ) : (
            <>
              {(loading || websiteLoading) && (
                <div className="flex items-center justify-center gap-2 rounded-card bg-surface-2 border border-border px-3 py-2 text-[11px] font-semibold text-text-dim">
                  <Loader2 size={12} className="animate-spin text-brand-light" />
                  Loading more upcoming events...
                </div>
              )}
              {events.map((event) => (
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
                    <span className="inline-block mt-2 text-[10px] font-bold text-brand-light/60 uppercase tracking-wide leading-none">
                      {event.source === "website" ? "lorettabates.com" : "WELL Collective"}
                    </span>
                  </div>
                </button>
              ))}
            </>
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
              disabled={!selected || sending}
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
