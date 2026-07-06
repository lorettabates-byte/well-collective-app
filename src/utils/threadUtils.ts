import type { Thread } from "../types";

export function getTrendingThreads(threads: Thread[], pinnedCount: number = 2, recentCount: number = 1): Thread[] {
  const pinnedThreads = [...threads]
    .filter((t) => t.pinnedAt)
    .sort((a, b) => (b.pinnedAt || "").localeCompare(a.pinnedAt || ""))
    .slice(0, pinnedCount);

  const mostRecentNonPinned = [...threads]
    .filter((t) => !t.pinnedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, recentCount);

  return [...pinnedThreads, ...mostRecentNonPinned];
}
