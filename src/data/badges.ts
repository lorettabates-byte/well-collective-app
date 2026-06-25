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

// All four tiers share a blue background (varied by shade) so the emoji
// always reads clearly against it, rather than the low-contrast grey/purple
// the first tier used to have.
export const LEVEL_BADGES: BadgeDef[] = [
  { id: "new-member", label: "New Member", description: "Just joined the WELL Collective.", icon: "🌱", color: "bg-blue-400" },
  { id: "active-member", label: "Active Member", description: "Getting involved across the app.", icon: "🔥", color: "bg-blue-500" },
  { id: "committed-member", label: "Committed Member", description: "Consistently showing up.", icon: "⭐", color: "bg-blue-600" },
  { id: "well-champion", label: "WELL Champion", description: "A top engager in the community.", icon: "👑", color: "bg-blue-700" },
];

// Earned automatically alongside (not instead of) a level badge — based on
// tenure or encouragement activity rather than the message+workout score.
export const BONUS_BADGES: BadgeDef[] = [
  { id: "legacy-builder", label: "Legacy Builder", description: "Active in the WELL Collective for over a year.", icon: "🏗️", color: "bg-cyan-600" },
  { id: "well-ambassador", label: "WELL Ambassador", description: "Encourages others through posts, comments, and cheers.", icon: "📣", color: "bg-emerald-600" },
];

export const SPECIAL_BADGES: BadgeDef[] = [
  { id: "well-escape", label: "WELL Escape Attendee", description: "Attended a WELL Escape retreat.", icon: "🌴", color: "bg-teal-500" },
  { id: "made-magnificent", label: "Made Magnificent", description: "Completed the Made Magnificent program.", icon: "✨", color: "bg-fuchsia-500" },
  { id: "made-to-be-different", label: "Made to Be Different", description: "Completed the Made to Be Different program.", icon: "🦋", color: "bg-violet-500" },
  { id: "founding-member", label: "Founding Member", description: "One of the original WELL Collective members.", icon: "🏛️", color: "bg-amber-600" },
];

export const ALL_BADGES: BadgeDef[] = [...LEVEL_BADGES, ...BONUS_BADGES, ...SPECIAL_BADGES];

export function getBadgeDef(id?: string): BadgeDef | undefined {
  if (!id) return undefined;
  return ALL_BADGES.find((b) => b.id === id);
}

export interface BadgeHolder {
  levelBadge?: string;
  bonusBadges?: string[];
  grantedBadges?: string[];
  featuredBadge?: string;
}

// One badge to show on an avatar: the member's chosen featured badge if
// it's still actually earned, otherwise their current level badge.
export function resolveFeaturedBadge(holder: BadgeHolder): string | undefined {
  const earned = new Set(
    [holder.levelBadge, ...(holder.bonusBadges ?? []), ...(holder.grantedBadges ?? [])].filter(Boolean) as string[]
  );
  if (holder.featuredBadge && earned.has(holder.featuredBadge)) return holder.featuredBadge;
  return holder.levelBadge;
}
