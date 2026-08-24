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
    id: "stressed",
    label: "Stressed",
    emoji: "🌪️",
    color: "#f59e0b",
    pulse: true,
    description: "A lot on my plate right now",
  },
  {
    id: "tired-but-showing-up",
    label: "Tired But Showing Up",
    emoji: "😮‍💨",
    color: "#a78bfa",
    pulse: false,
    description: "Running on empty but still here",
  },
  {
    id: "resting-recovering",
    label: "Resting & Recovering",
    emoji: "🌿",
    color: "#38bdf8",
    pulse: false,
    description: "Taking it easy and letting my body heal",
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
    id: "grateful",
    label: "Grateful Today",
    emoji: "🙏",
    color: "#fb7185",
    pulse: false,
    description: "Counting my blessings today",
  },
  {
    id: "proud",
    label: "Proud of Myself",
    emoji: "🌟",
    color: "#f472b6",
    pulse: false,
    description: "Had a quiet win today",
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
