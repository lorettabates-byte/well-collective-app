const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

export type AnalyticsEventType =
  | "app_open"
  | "login"
  | "section_visit"
  | "session_end"
  | "tutorial_step"
  | "tutorial_skip"
  | "tutorial_complete";

export function logEvent(
  email: string,
  eventType: AnalyticsEventType,
  metadata?: Record<string, unknown>
): void {
  if (!API_URL || !email) return;
  // Fire-and-forget — analytics must never block the UI
  fetch(`${API_URL}/api/analytics/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, eventType, metadata }),
  }).catch(() => {});
}

// Tracks how long the user spends in the app per visibility session.
// Call once on app mount; cleans up automatically.
export function startSessionTracking(email: string): () => void {
  if (!email) return () => {};
  let sessionStart = Date.now();

  const handleVisibility = () => {
    if (document.visibilityState === "hidden") {
      const duration = Math.round((Date.now() - sessionStart) / 1000);
      if (duration >= 5) {
        logEvent(email, "session_end", { duration_seconds: duration });
      }
    } else {
      sessionStart = Date.now();
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);
  return () => document.removeEventListener("visibilitychange", handleVisibility);
}
