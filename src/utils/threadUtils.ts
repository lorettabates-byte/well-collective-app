import type { ForumThread } from "../types";

export function getTrendingThreads(threads: ForumThread[], pinnedCount: number = 2, recentCount: number = 1): ForumThread[] {
  const pinnedThreads = [...threads]
    .filter((t) => t.pinnedAt)
    .sort((a, b) => (b.pinnedAt || "").localeCompare(a.pinnedAt || ""))
    .slice(0, pinnedCount);

  const recentThreads = [...threads]
    .filter((t) => !t.pinnedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // No pins — show the most recent threads up to the total slot count
  if (pinnedThreads.length === 0) {
    return recentThreads.slice(0, pinnedCount + recentCount);
  }

  return [...pinnedThreads, ...recentThreads.slice(0, recentCount)];
}
