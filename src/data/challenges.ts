export interface TribeChallenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: "nutrition" | "fitness" | "mindfulness" | "wellness";
}

export const TRIBE_CHALLENGES: TribeChallenge[] = [
  {
    id: "nourishment-3day",
    title: "3-Day Nourishment Challenge",
    description: "Log your meals together for 3 days straight",
    duration: "3 days",
    category: "nutrition",
  },
  {
    id: "workout-streak-7",
    title: "7-Day Streak Challenge",
    description: "Complete a workout every single day for a week",
    duration: "7 days",
    category: "fitness",
  },
  {
    id: "morning-ritual-5",
    title: "Morning Ritual Challenge",
    description: "Complete your WELL Check before noon for 5 days",
    duration: "5 days",
    category: "wellness",
  },
  {
    id: "mindfulness-5",
    title: "Mindfulness Challenge",
    description: "Complete a breathwork session every day for 5 days",
    duration: "5 days",
    category: "mindfulness",
  },
  {
    id: "wellcheck-7",
    title: "Full WELL Check Challenge",
    description: "Complete all WELL Check categories for 7 days in a row",
    duration: "7 days",
    category: "wellness",
  },
  {
    id: "hydration-5",
    title: "Hydration Reset",
    description: "Log your water intake each day for 5 days",
    duration: "5 days",
    category: "nutrition",
  },
];
