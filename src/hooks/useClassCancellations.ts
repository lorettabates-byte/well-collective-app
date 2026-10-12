import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const REFRESH_MS = 5 * 60 * 1000;

export interface ClassCancellation {
  date: string; // YYYY-MM-DD, the cancelled class (Eastern)
  time: string;
  back_on: string;
  back_time: string;
  replacement: { title: string; url: string } | null;
  banner: string;
}

// Shared across screens so Home, Classes and Events make one request between them.
let cache: { at: number; list: ClassCancellation[] } | null = null;
let inflight: Promise<ClassCancellation[]> | null = null;

function easternToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

async function load(): Promise<ClassCancellation[]> {
  if (cache && Date.now() - cache.at < REFRESH_MS) return cache.list;
  if (!API_URL) return [];
  inflight ??= fetch(`${API_URL}/api/class-cancellations`)
    .then((res) => (res.ok ? res.json() : { cancellations: [] }))
    .then((data: { cancellations?: ClassCancellation[] }) => {
      const list = data.cancellations ?? [];
      cache = { at: Date.now(), list };
      return list;
    })
    .catch(() => cache?.list ?? [])
    .finally(() => { inflight = null; });
  return inflight;
}

// Cancelled classes whose day hasn't ended yet in Eastern time, soonest first.
export function useClassCancellations(): ClassCancellation[] {
  const [list, setList] = useState<ClassCancellation[]>(cache?.list ?? []);

  useEffect(() => {
    let alive = true;
    const refresh = () => load().then((l) => { if (alive) setList(l); });
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const today = easternToday();
  return list.filter((c) => c.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

// The weekly livestream on a cancelled date must not look upcoming or joinable.
export function isCancelledLivestream(
  event: { date: string; title: string },
  cancellations: ClassCancellation[]
): boolean {
  return /livestream/i.test(event.title) && cancellations.some((c) => c.date === event.date);
}
