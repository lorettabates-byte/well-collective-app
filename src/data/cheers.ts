export const TRIBE_CHEERS = [
  { id: "welcome",        emoji: "💐", label: "Welcome",           description: "A warm welcome to a new member joining the WELL community" },
  { id: "crushing-it",    emoji: "🔥", label: "Crushing It",       description: "For when they're on fire and absolutely nailing it" },
  { id: "proud-of-you",   emoji: "🎉", label: "Proud of You",      description: "When you want them to know how proud you are of their progress" },
  { id: "keep-going",     emoji: "💪", label: "Keep Going",        description: "A push of encouragement when they need the extra fuel" },
  { id: "you-inspire-me", emoji: "✨", label: "You Inspire Me",    description: "For the members who light you up every time you see their journey" },
  { id: "thinking-of-you",emoji: "💙", label: "Thinking of You",   description: "A gentle reminder that they are seen and in your thoughts" },
  { id: "youre-amazing",  emoji: "🌟", label: "You're Amazing",    description: "Just because — some people deserve to hear it" },
  { id: "way-to-go",      emoji: "🙌", label: "Way to Go",         description: "For celebrating a win, big or small" },
] as const;

export type CheerType = typeof TRIBE_CHEERS[number];
export const BIRTHDAY_CHEER_ID = "happy-birthday";
