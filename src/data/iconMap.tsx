import {
  Award,
  Dumbbell,
  Hand,
  Leaf,
  MessagesSquare,
  Salad,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  hand: Hand,
  salad: Salad,
  dumbbell: Dumbbell,
  leaf: Leaf,
  award: Award,
  messages: MessagesSquare,
  sparkles: Sparkles,
};

export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICONS);

export function getCategoryIcon(key: string): LucideIcon {
  return CATEGORY_ICONS[key] ?? Sparkles;
}

interface CategoryIconProps {
  icon: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ icon, size = 20, className = "" }: CategoryIconProps) {
  const Icon = getCategoryIcon(icon);
  return (
    <Icon
      size={size}
      className={`text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)] ${className}`}
    />
  );
}
