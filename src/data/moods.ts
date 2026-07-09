export interface MoodStatus {
  id: string;
  label: string;
  emoji: string;
  color: string;   // hex for ring/glow
  pulse: boolean;  // animate-pulse for "need encouragement"
  description: string;
}

export const MOOD_STATUSES: MoodStatus[] = [
  {
    id: "need-encouragement",
    label: "Need Encouragement",
    emoji: "💙",
    color: "#a855f7",
    pulse: true,
    description: "Could use some love from my tribe today",
  },
  {
    id: "tough-day",
    label: "Tough Day",
    emoji: "🌧",
    color: "#60a5fa",
    pulse: false,
    description: "Having a hard one today",
  },
  {
    id: "feeling-good",
    label: "Feeling Good",
    emoji: "✨",
    color: "#34d399",
    pulse: false,
    description: "Doing really well today",
  },
  {
    id: "celebrating",
    label: "Celebrating",
    emoji: "🎉",
    color: "#fbbf24",
    pulse: false,
    description: "Something wonderful happened!",
  },
  {
    id: "crushing-it",
    label: "Crushing It",
    emoji: "🔥",
    color: "#f97316",
    pulse: false,
    description: "On fire and nailing it today",
  },
];

export const MOOD_STATUS_EXPIRY_HOURS = 24;
