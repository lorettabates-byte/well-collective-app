import type { Badge } from "../types";

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Length of the current consecutive-day streak, counting back from today (or yesterday). */
export function computeStreak(workoutLog: string[]): number {
  const days = new Set(workoutLog);
  const today = new Date();

  // Allow the streak to still "count" if yesterday was logged but today isn't yet.
  let cursor = new Date(today);
  if (!days.has(toISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(toISODate(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(toISODate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeBadges(workoutLog: string[], messagesPosted: number): Badge[] {
  const streak = computeStreak(workoutLog);
  const totalWorkouts = workoutLog.length;

  return [
    {
      id: "community-participant",
      label: "Community Participant",
      description: "Posted or replied in the community at least once.",
      icon: "MessageCircle",
      earned: messagesPosted >= 1,
    },
    {
      id: "community-regular",
      label: "Community Regular",
      description: "Posted or replied 5+ times in the community.",
      icon: "Users",
      earned: messagesPosted >= 5,
    },
    {
      id: "week-streak",
      label: "7-Day Streak",
      description: "Completed a workout every day for a full week.",
      icon: "Flame",
      earned: streak >= 7,
    },
    {
      id: "month-streak",
      label: "30-Day Streak",
      description: "Completed a workout every day for a full month.",
      icon: "Trophy",
      earned: streak >= 30,
    },
    {
      id: "total-30",
      label: "30 Workouts Logged",
      description: "Completed 30 total workouts — consistency over time.",
      icon: "Award",
      earned: totalWorkouts >= 30,
    },
  ];
}
