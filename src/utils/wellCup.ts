const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

export type ActivityType =
  | "app_open"
  | "forum_post"
  | "forum_comment"
  | "class_watch"
  | "song_play"
  | "blog_open"
  | "meal_log"
  | "sleep_log"
  | "breathwork"
  | "stretching"
  | "resistance_training"
  | "well_activity"
  | "event_attend"
  | "well_escape"
  | "daily_challenge_accept";

export async function logActivity(
  memberEmail: string,
  type: ActivityType,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!API_URL || !memberEmail) return;
  try {
    await fetch(`${API_URL}/api/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberEmail, type, metadata }),
    });
  } catch {
    // Fire-and-forget — points are best-effort
  }
}

export interface LeaderboardEntry {
  email: string;
  name: string;
  avatar: string | null;
  points: number;
}

export async function fetchLeaderboard(limit: number | "all" = 10): Promise<{
  leaderboard: LeaderboardEntry[];
  resetAt: string;
}> {
  if (!API_URL) return { leaderboard: [], resetAt: "" };
  const res = await fetch(`${API_URL}/api/leaderboard?limit=${limit}`);
  if (!res.ok) return { leaderboard: [], resetAt: "" };
  return res.json();
}

export async function fetchYesterdayWinner(): Promise<{
  name: string;
  avatar: string | null;
  email: string;
  total_points: number;
  win_date: string;
} | null> {
  if (!API_URL) return null;
  const res = await fetch(`${API_URL}/api/leaderboard/yesterday`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.winner ?? null;
}
