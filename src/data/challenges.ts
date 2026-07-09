export interface TribeChallenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: "nutrition" | "fitness" | "mindfulness" | "wellness";
  bonusPoints: number;
  goals: { id: string; label: string }[];
}

export const TRIBE_CHALLENGES: TribeChallenge[] = [
  {
    id: "nourishment-3day",
    title: "3-Day Nourishment Challenge",
    description: "Log your meals together for 3 days straight",
    duration: "3 days",
    category: "nutrition",
    bonusPoints: 25,
    goals: [
      { id: "day-1", label: "Day 1 meals logged" },
      { id: "day-2", label: "Day 2 meals logged" },
      { id: "day-3", label: "Day 3 meals logged" },
    ],
  },
  {
    id: "workout-streak-7",
    title: "7-Day Streak Challenge",
    description: "Complete a workout every single day for a week",
    duration: "7 days",
    category: "fitness",
    bonusPoints: 25,
    goals: Array.from({ length: 7 }, (_, i) => ({ id: `day-${i + 1}`, label: `Day ${i + 1} workout complete` })),
  },
  {
    id: "morning-ritual-5",
    title: "Morning Ritual Challenge",
    description: "Complete your WELL Check before noon for 5 days",
    duration: "5 days",
    category: "wellness",
    bonusPoints: 25,
    goals: Array.from({ length: 5 }, (_, i) => ({ id: `day-${i + 1}`, label: `Day ${i + 1} WELL Check before noon` })),
  },
  {
    id: "mindfulness-5",
    title: "Mindfulness Challenge",
    description: "Complete a breathwork session every day for 5 days",
    duration: "5 days",
    category: "mindfulness",
    bonusPoints: 25,
    goals: Array.from({ length: 5 }, (_, i) => ({ id: `day-${i + 1}`, label: `Day ${i + 1} breathwork complete` })),
  },
  {
    id: "wellcheck-7",
    title: "Full WELL Check Challenge",
    description: "Complete all WELL Check categories for 7 days in a row",
    duration: "7 days",
    category: "wellness",
    bonusPoints: 25,
    goals: Array.from({ length: 7 }, (_, i) => ({ id: `day-${i + 1}`, label: `Day ${i + 1} full WELL Check` })),
  },
  {
    id: "hydration-5",
    title: "Hydration Reset",
    description: "Log your water intake each day for 5 days",
    duration: "5 days",
    category: "nutrition",
    bonusPoints: 25,
    goals: Array.from({ length: 5 }, (_, i) => ({ id: `day-${i + 1}`, label: `Day ${i + 1} water goal met` })),
  },
];
