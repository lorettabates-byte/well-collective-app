import { useEffect, useState } from "react";
import type { CommunityEvent } from "../types";

const LIVE_API_URL = "https://lorettabates.com/wp-json/tribe/events/v1/events?per_page=25";
const SERVER_API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

const COLORS = ["#01519D", "#0191CE", "#84D8FD"];

interface FeedState {
  events: CommunityEvent[];
  loading: boolean;
  error: boolean;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "-")
    .replace(/&#8230;/g, "...")
    .replace(/&amp;/g, "&");
}

function formatTimeRange(start: string, end: string): string {
  const startClock = start.split(" ")[1] ?? "";
  const endClock = end.split(" ")[1] ?? "";
  if (startClock.startsWith("00:00") && (endClock.startsWith("23:59") || endClock.startsWith("00:00"))) {
    return "All Day";
  }

  const formatOne = (value: string) => {
    const time = value.split(" ")[1];
    if (!time) return "";
    const [hourStr, minuteStr] = time.split(":");
    const hour = Number(hourStr);
    const minute = minuteStr ?? "00";
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute} ${period}`;
  };
  const startTime = formatOne(start);
  const endTime = formatOne(end);
  if (!startTime) return "All Day";
  if (!endTime || endTime === startTime) return startTime;
  return `${startTime} - ${endTime}`;
}

interface TribeEvent {
  id: number;
  title: string;
  description: string;
  url: string;
  start_date: string;
  end_date: string;
  cost?: string;
  venue?: {
    venue?: string;
    city?: string;
    state?: string;
  };
  image?: { url?: string } | false;
}

interface TribeResponse {
  events?: TribeEvent[];
}

export function useEventsFeed(): FeedState {
  const [state, setState] = useState<FeedState>({ events: [], loading: true, error: false });

  useEffect(() => {
    let cancelled = false;

    fetch(LIVE_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then(async (data: TribeResponse) => {
        if (cancelled) return;
        const raw = Array.isArray(data.events) ? data.events : [];
        const events: CommunityEvent[] = raw.map((event, index) => ({
          id: `live-${event.id}`,
          title: decodeEntities(stripHtml(event.title ?? "Untitled Event")),
          description: decodeEntities(stripHtml(event.description ?? "")).slice(0, 240),
          date: (event.start_date ?? "").slice(0, 10),
          time: formatTimeRange(event.start_date ?? "", event.end_date ?? ""),
          location: [event.venue?.venue, event.venue?.city, event.venue?.state].filter(Boolean).join(", "),
          rsvps: [],
          color: COLORS[index % COLORS.length],
          image: event.image && event.image.url ? event.image.url : undefined,
          url: event.url,
          cost: event.cost || undefined,
          source: "live",
        }));

        // Fetch RSVPs for each live event from server
        if (SERVER_API_URL) {
          try {
            const rsvpPromises = events.map((event) =>
              fetch(`${SERVER_API_URL}/api/live-events/rsvps/${event.id}`)
                .then((res) => (res.ok ? res.json() : { rsvps: [] }))
                .catch(() => ({ rsvps: [] }))
            );
            const rsvpResults = await Promise.all(rsvpPromises);
            events.forEach((event, index) => {
              event.rsvps = rsvpResults[index]?.rsvps ?? [];
            });
          } catch (err) {
            console.error("Failed to fetch live event RSVPs:", err);
          }
        }

        setState({ events, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ events: [], loading: false, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
