// Mirrors TRIBE_CHEER_LABELS in well-collective-server/src/routes/tribe.ts —
// the 3 fixed cheers a member can send to someone in their WELL Tribe.
export const TRIBE_CHEERS = [
  { id: "crushing-it", emoji: "🔥", label: "Crushing It" },
  { id: "proud-of-you", emoji: "🎉", label: "Proud of You" },
  { id: "keep-going", emoji: "💪", label: "Keep Going" },
] as const;
