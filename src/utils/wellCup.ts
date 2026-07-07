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
  | "tribe_add"
  | "cardio"
  | "daily_challenge_accept"
  | "tutorial_complete"
  | "notifications_enabled"
  | "add_to_homescreen"
  | "steps";

export interface ActivityResult {
  awarded: boolean;
  points: number;
  streak: { streak: number; bonus: number; longestStreak: number } | null;
}

export async function logActivity(
  memberEmail: string,
  type: ActivityType,
  metadata?: Record<string, unknown>
): Promise<ActivityResult> {
  if (!API_URL || !memberEmail) return { awarded: false, points: 0, streak: null };
  try {
    // keepalive lets the request survive the page navigating away — critical
    // here since class_watch/blog_open fire right before an external link
    // redirect, and the browser otherwise cancels in-flight fetches on nav.
    const res = await fetch(`${API_URL}/api/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberEmail, type, metadata }),
      keepalive: true,
    });
    if (!res.ok) return { awarded: false, points: 0, streak: null };
    return await res.json() as ActivityResult;
  } catch {
    return { awarded: false, points: 0, streak: null };
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
