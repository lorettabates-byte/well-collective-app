import { useEffect, useState } from "react";
import { todayISO } from "../utils/format";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const MESSAGES_CACHE_KEY = "unread-messages-count";
const MESSAGES_CACHE_TTL = 60_000; // 60 seconds

export function useUnreadMessageCount(email: string | null) {
  const [count, setCount] = useState<number>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(MESSAGES_CACHE_KEY) ?? "{}") as { count?: number; at?: number };
      if (Date.now() - (cached.at ?? 0) < MESSAGES_CACHE_TTL) return cached.count ?? 0;
    } catch { /* ignore */ }
    return 0;
  });

  useEffect(() => {
    if (!API_URL || !email) return;
    const refresh = () => {
      fetch(`${API_URL}/api/messages/unread-count?email=${encodeURIComponent(email)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && typeof d.count === "number") {
            setCount(d.count);
            localStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify({ count: d.count, at: Date.now() }));
          }
        })
        .catch(() => {});
    };
    refresh();
    const id = setInterval(refresh, MESSAGES_CACHE_TTL);
    return () => clearInterval(id);
  }, [email]);

  return count;
}
