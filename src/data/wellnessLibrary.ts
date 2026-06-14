export interface WellActivitySuggestion {
  title: string;
  description: string;
}

// Fallback rotation of AI-style mental-health suggestions, used whenever the
// admin hasn't uploaded a specific suggestion for today.
export const WELL_ACTIVITIES: WellActivitySuggestion[] = [
  {
    title: "Take a warm bath tonight",
    description: "Light a candle, play something soft, and give yourself 20 unhurried minutes to soak and unwind.",
  },
  {
    title: "Call a friend you've been missing",
    description: "Connection is medicine. Reach out to someone who makes you feel like yourself — even a 10-minute catch-up counts.",
  },
  {
    title: "Read a few pages of a book you love",
    description: "Step away from the screen and let your mind wander into a story. No agenda, just enjoyment.",
  },
  {
    title: "Write down three things you're grateful for",
    description: "Grab a notebook (or your notes app) and jot down three small good things from today. Let yourself feel them.",
  },
  {
    title: "Take a slow walk outside",
    description: "No destination needed. Notice the air, the light, the sounds around you — let your body and mind reset.",
  },
  {
    title: "Declutter one small space",
    description: "Pick a drawer, a shelf, or your nightstand. A little outer order can bring a lot of inner calm.",
  },
  {
    title: "Practice 5 minutes of deep breathing",
    description: "Sit somewhere comfortable and breathe in for 4 counts, hold for 4, out for 6. Repeat for five minutes.",
  },
  {
    title: "Treat yourself to your favorite tea or coffee",
    description: "Make it slowly, sit down, and actually enjoy it — no multitasking, just a few minutes for you.",
  },
  {
    title: "Stretch it out before bed",
    description: "Spend 10 minutes on gentle stretches for your neck, shoulders, and back to release the day's tension.",
  },
  {
    title: "Unplug for an hour",
    description: "Put your phone in another room and do something analog — draw, cook, garden, or just sit with your thoughts.",
  },
  {
    title: "Write a kind note to someone",
    description: "A short text or card telling someone what they mean to you can lift both of your days.",
  },
  {
    title: "Get some sunlight first thing",
    description: "Step outside for a few minutes this morning. Natural light early in the day supports your mood and sleep.",
  },
  {
    title: "Do something creative just for fun",
    description: "Doodle, color, sing, dance in your kitchen — give yourself permission to create with no goal in mind.",
  },
  {
    title: "Take a tech-free bath or shower",
    description: "Leave your phone outside the bathroom and let this be a fully present, sensory moment of self-care.",
  },
];

export function getFallbackWellActivity(date: Date): WellActivitySuggestion {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return WELL_ACTIVITIES[dayOfYear % WELL_ACTIVITIES.length];
}
