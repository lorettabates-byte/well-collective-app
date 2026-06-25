// Mirrors computeLevelBadge() / SPECIAL_BADGE_IDS in well-collective-server/src/badges.ts.
// Level badges are earned automatically from forum + workout activity;
// special badges (e.g. "well-escape") are granted manually by an admin.
export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon: string; // emoji, rendered in the small avatar overlay
  color: string; // tailwind bg-* class for the overlay circle
}

export const LEVEL_BADGES: BadgeDef[] = [
  { id: "new-member", label: "New Member", description: "Just joined the WELL Collective.", icon: "🌱", color: "bg-slate-400" },
  { id: "active-member", label: "Active Member", description: "Getting involved across the app.", icon: "🔥", color: "bg-brand-blue" },
  { id: "committed-member", label: "Committed Member", description: "Consistently showing up.", icon: "⭐", color: "bg-purple-500" },
  { id: "well-champion", label: "WELL Champion", description: "A top engager in the community.", icon: "👑", color: "bg-amber-500" },
];

export const SPECIAL_BADGES: BadgeDef[] = [
  { id: "well-escape", label: "WELL Escape Attendee", description: "Attended a WELL Escape retreat.", icon: "🌴", color: "bg-teal-500" },
];

export const ALL_BADGES: BadgeDef[] = [...LEVEL_BADGES, ...SPECIAL_BADGES];

export function getBadgeDef(id?: string): BadgeDef | undefined {
  if (!id) return undefined;
  return ALL_BADGES.find((b) => b.id === id);
}

export interface BadgeHolder {
  levelBadge?: string;
  grantedBadges?: string[];
  featuredBadge?: string;
}

// One badge to show on an avatar: the member's chosen featured badge if
// it's still actually earned, otherwise their current level badge.
export function resolveFeaturedBadge(holder: BadgeHolder): string | undefined {
  const earned = new Set([holder.levelBadge, ...(holder.grantedBadges ?? [])].filter(Boolean) as string[]);
  if (holder.featuredBadge && earned.has(holder.featuredBadge)) return holder.featuredBadge;
  return holder.levelBadge;
}
