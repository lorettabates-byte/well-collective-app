export interface CardStyle {
  id: string;
  label: string;
  bg: string;        // CSS gradient (inline style)
  textColor: string; // Tailwind class
  message: string;
}

export interface CardOccasion {
  id: string;
  label: string;
  icon: string;       // Lucide icon name
  styles: CardStyle[];
}

export const CARD_OCCASIONS: CardOccasion[] = [
  {
    id: "birthday",
    label: "Birthday",
    icon: "Gift",
    styles: [
      { id: "ocean",    label: "Ocean Blue",     bg: "linear-gradient(135deg, #0191CE 0%, #06b6d4 100%)", textColor: "text-white",      message: "Wishing you waves of joy on your special day!" },
      { id: "rose",     label: "Rose Garden",    bg: "linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)", textColor: "text-white",      message: "Blooming with birthday wishes just for you!" },
      { id: "midnight", label: "Midnight Gold",  bg: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)", textColor: "text-yellow-300", message: "Your birthday shines as bright as you do." },
      { id: "citrus",   label: "Citrus Burst",   bg: "linear-gradient(135deg, #f97316 0%, #facc15 100%)", textColor: "text-white",      message: "Here's to a bright and beautiful birthday!" },
      { id: "lavender", label: "Lavender Dream", bg: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)", textColor: "text-white",      message: "Sending you peace, joy, and birthday love." },
      { id: "emerald",  label: "Emerald Forest", bg: "linear-gradient(135deg, #059669 0%, #0d9488 100%)", textColor: "text-white",      message: "May your birthday be as wonderful as you are." },
    ],
  },
  {
    id: "thinking-of-you",
    label: "Thinking of You",
    icon: "Heart",
    styles: [
      { id: "blue-mist",    label: "Blue Mist",    bg: "linear-gradient(135deg, #3b82f6 0%, #93c5fd 100%)", textColor: "text-white",      message: "You've been on my mind. Thinking of you!" },
      { id: "warm-sunrise", label: "Warm Sunrise", bg: "linear-gradient(135deg, #f59e0b 0%, #fde68a 100%)", textColor: "text-amber-900",  message: "Just wanted you to know you're in my thoughts." },
      { id: "soft-mauve",   label: "Soft Mauve",   bg: "linear-gradient(135deg, #c084fc 0%, #e9d5ff 100%)", textColor: "text-purple-900", message: "Sending warm thoughts your way." },
      { id: "garden",       label: "Garden Bloom", bg: "linear-gradient(135deg, #4ade80 0%, #a3e635 100%)", textColor: "text-green-900",  message: "A little reminder: you are loved." },
    ],
  },
  {
    id: "just-saying-hi",
    label: "Just Saying Hi",
    icon: "Sun",
    styles: [
      { id: "sunny",   label: "Sunny Yellow", bg: "linear-gradient(135deg, #eab308 0%, #fde047 100%)", textColor: "text-yellow-900", message: "Hey there! Just dropping in to say hi!" },
      { id: "teal",    label: "Teal Wave",    bg: "linear-gradient(135deg, #0891b2 0%, #67e8f9 100%)", textColor: "text-white",      message: "Popping by to spread some good vibes!" },
      { id: "coral",   label: "Coral Splash", bg: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", textColor: "text-white",      message: "Hi! Hope your day is as bright as you are!" },
      { id: "skyblue", label: "Blue Sky",     bg: "linear-gradient(135deg, #0ea5e9 0%, #bae6fd 100%)", textColor: "text-blue-900",   message: "Just here to say — hope you're having a great day!" },
    ],
  },
  {
    id: "condolences",
    label: "Condolences",
    icon: "Feather",
    styles: [
      { id: "gentle-grey", label: "Gentle Grey",  bg: "linear-gradient(135deg, #475569 0%, #94a3b8 100%)", textColor: "text-white",      message: "Holding you close in thought during this time." },
      { id: "soft-indigo", label: "Soft Indigo",  bg: "linear-gradient(135deg, #4338ca 0%, #818cf8 100%)", textColor: "text-white",      message: "Sending you love and peace." },
      { id: "ivory",       label: "Ivory Peace",  bg: "linear-gradient(135deg, #78716c 0%, #d6d3d1 100%)", textColor: "text-stone-900",  message: "You are not alone in this." },
      { id: "misty-rose",  label: "Misty Rose",   bg: "linear-gradient(135deg, #9d174d 0%, #fda4af 100%)", textColor: "text-white",      message: "Thinking of you with care and compassion." },
    ],
  },
  {
    id: "youve-got-this",
    label: "You've Got This",
    icon: "Zap",
    styles: [
      { id: "fire",     label: "Fire",      bg: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)", textColor: "text-white", message: "You are stronger than you know. You've got this!" },
      { id: "electric", label: "Electric",  bg: "linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)", textColor: "text-white", message: "Believe in yourself — you can do this!" },
      { id: "bold-red", label: "Bold Red",  bg: "linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)", textColor: "text-white", message: "You are unstoppable. Keep going!" },
      { id: "gold",     label: "Gold Rush", bg: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)", textColor: "text-white", message: "This moment is yours. Go get it!" },
    ],
  },
  {
    id: "congratulations",
    label: "Congratulations",
    icon: "Award",
    styles: [
      { id: "champagne", label: "Champagne", bg: "linear-gradient(135deg, #78350f 0%, #fde68a 100%)", textColor: "text-yellow-900", message: "So proud of you! Well deserved!" },
      { id: "rainbow",   label: "Confetti",  bg: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)", textColor: "text-white", message: "Celebrating this amazing milestone with you!" },
      { id: "royal",     label: "Royal",     bg: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)", textColor: "text-white",     message: "What an achievement! You've earned it!" },
      { id: "starlight", label: "Starlight", bg: "linear-gradient(135deg, #0f172a 0%, #1e40af 100%)", textColor: "text-blue-200",  message: "To new heights and incredible things!" },
    ],
  },
];
