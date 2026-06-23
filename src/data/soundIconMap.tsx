import {
  Bell,
  Cloud,
  CloudLightning,
  CloudRain,
  Droplet,
  Flame,
  Flower2,
  Heart,
  Leaf,
  Moon,
  Mountain,
  Music2,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  TreePine,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

// A curated, elegant outline-icon set for peaceful sounds — used for both the
// built-in procedural sounds and as the picker options when an admin uploads
// a custom one, so everything stays visually consistent (no mismatched emoji).
export const SOUND_ICONS: Record<string, LucideIcon> = {
  "cloud-rain": CloudRain,
  "cloud-lightning": CloudLightning,
  waves: Waves,
  bell: Bell,
  wind: Wind,
  sparkles: Sparkles,
  moon: Moon,
  cloud: Cloud,
  flower: Flower2,
  mountain: Mountain,
  droplet: Droplet,
  "tree-pine": TreePine,
  sun: Sun,
  snowflake: Snowflake,
  star: Star,
  heart: Heart,
  flame: Flame,
  leaf: Leaf,
  music: Music2,
};

export const SOUND_ICON_OPTIONS = Object.keys(SOUND_ICONS);

export function getSoundIcon(key: string): LucideIcon {
  return SOUND_ICONS[key] ?? Music2;
}

interface SoundIconProps {
  icon: string;
  size?: number;
  className?: string;
}

export function SoundIcon({ icon, size = 24, className = "" }: SoundIconProps) {
  const Icon = getSoundIcon(icon);
  return <Icon size={size} className={className} />;
}
