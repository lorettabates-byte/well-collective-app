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

export function computeBadges(
  workoutLog: string[],
  messagesPosted: number,
  breathworkLog: string[] = [],
  wellActivityLog: string[] = [],
  classLog: string[] = []
): Badge[] {
  const streak = computeStreak(workoutLog);
  const totalWorkouts = workoutLog.length;
  const totalClasses = classLog.length;
  const breathworkStreak = computeStreak(breathworkLog);
  const wellActivityCount = wellActivityLog.length;

  return [
    // Community Badges
    { id: "community-participant", label: "Community Participant", description: "Posted or replied in the community at least once.", icon: "MessageCircle", earned: messagesPosted >= 1 },
    { id: "community-regular", label: "Community Regular", description: "Posted or replied 5+ times in the community.", icon: "Users", earned: messagesPosted >= 5 },
    { id: "community-advocate", label: "Community Advocate", description: "Posted or replied 20+ times in the community.", icon: "Sparkles", earned: messagesPosted >= 20 },
    { id: "community-leader", label: "Community Leader", description: "Posted or replied 50+ times in the community.", icon: "Crown", earned: messagesPosted >= 50 },

    // Streak Badges
    { id: "week-streak", label: "7-Day Streak", description: "Completed a workout every day for a full week.", icon: "Flame", earned: streak >= 7 },
    { id: "two-week-streak", label: "14-Day Streak", description: "Completed a workout every day for 2 weeks.", icon: "Zap", earned: streak >= 14 },
    { id: "month-streak", label: "30-Day Streak", description: "Completed a workout every day for a full month.", icon: "Trophy", earned: streak >= 30 },
    { id: "three-month-streak", label: "90-Day Streak", description: "Completed a workout every day for 3 months.", icon: "Star", earned: streak >= 90 },

    // Workout Badges
    { id: "total-10", label: "10 Workouts", description: "Completed 10 total workouts.", icon: "Award", earned: totalWorkouts >= 10 },
    { id: "total-30", label: "30 Workouts", description: "Completed 30 total workouts.", icon: "Award", earned: totalWorkouts >= 30 },
    { id: "total-50", label: "50 Workouts", description: "Completed 50 total workouts.", icon: "Trophy", earned: totalWorkouts >= 50 },
    { id: "total-100", label: "100 Workouts", description: "Completed 100 total workouts — a century of strength!", icon: "Crown", earned: totalWorkouts >= 100 },

    // Breathwork Streak Badges
    { id: "breathwork-week-streak", label: "7-Day Breathwork Streak", description: "Completed breathwork every day for a full week.", icon: "Wind", earned: breathworkStreak >= 7 },
    { id: "breathwork-two-week-streak", label: "14-Day Breathwork Streak", description: "Completed breathwork every day for 2 weeks.", icon: "Wind", earned: breathworkStreak >= 14 },
    { id: "breathwork-month-streak", label: "30-Day Breathwork Streak", description: "Completed breathwork every day for a full month.", icon: "Wind", earned: breathworkStreak >= 30 },
    { id: "breathwork-three-month-streak", label: "90-Day Breathwork Streak", description: "Completed breathwork every day for 3 months.", icon: "Wind", earned: breathworkStreak >= 90 },

    // Wellness Badges
    { id: "wellness-starter", label: "Wellness Starter", description: "Engaged with well activities 5+ times.", icon: "Heart", earned: wellActivityCount >= 5 },
    { id: "wellness-enthusiast", label: "Wellness Enthusiast", description: "Engaged with well activities 20+ times.", icon: "Heart", earned: wellActivityCount >= 20 },
    { id: "self-care-champion", label: "Self-Care Champion", description: "Engaged with well activities 50+ times.", icon: "Heart", earned: wellActivityCount >= 50 },

    // Inspiration Badges
    { id: "inspired", label: "Inspired", description: "Saved an inspiration post.", icon: "Sparkles", earned: totalWorkouts >= 1 },
    { id: "highly-inspired", label: "Highly Inspired", description: "Saved 10+ inspiration posts.", icon: "Sparkles", earned: totalWorkouts >= 10 },
    { id: "inspiration-collector", label: "Inspiration Collector", description: "Saved 30+ inspiration posts.", icon: "Sparkles", earned: totalWorkouts >= 30 },

    // Class Badges
    { id: "class-starter", label: "Class Starter", description: "Completed your first class.", icon: "Video", earned: totalClasses >= 1 },
    { id: "class-enthusiast", label: "Class Enthusiast", description: "Completed 15+ classes.", icon: "Video", earned: totalClasses >= 15 },
    { id: "class-master", label: "Class Master", description: "Completed 50+ classes.", icon: "Video", earned: totalClasses >= 50 },

    // Balance Badges
    { id: "balanced-life", label: "Balanced Life", description: "Maintained engagement across all app features.", icon: "Balance", earned: messagesPosted >= 5 && streak >= 7 && totalWorkouts >= 10 },
    { id: "well-rounded", label: "Well-Rounded", description: "The ultimate wellness warrior.", icon: "Star", earned: messagesPosted >= 20 && streak >= 30 && totalWorkouts >= 50 },
  ];
}
