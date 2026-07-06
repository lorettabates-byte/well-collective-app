import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

export function useUnreadMessageCount(email: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!email || !API_URL) return;
    fetch(`${API_URL}/api/messages/unread-count?email=${encodeURIComponent(email)}`)
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((data) => setUnreadCount(data.count || 0))
      .catch(() => {});
  }, [email]);

  return unreadCount;
}
