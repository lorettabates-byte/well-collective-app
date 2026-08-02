import { Pin } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import ThreadPreviewCard from "../components/community/ThreadPreviewCard";
import { useApp } from "../store/AppContext";

export default function Trending() {
  const { threads, blockedUserIds } = useApp();
  const visibleThreads = threads.filter((t) => !blockedUserIds.includes(t.authorId));

  const pinnedThreads = visibleThreads
    .filter((t) => t.pinnedAt)
    .sort((a, b) => (b.pinnedAt || "").localeCompare(a.pinnedAt || ""));

  const recentThreads = visibleThreads
    .filter((t) => !t.pinnedAt)
    .sort((a, b) => {
      const aDate = a.messages[a.messages.length - 1]?.createdAt ?? a.createdAt ?? "";
      const bDate = b.messages[b.messages.length - 1]?.createdAt ?? b.createdAt ?? "";
      return bDate.localeCompare(aDate);
    })
    .slice(0, 10);

  const hasContent = pinnedThreads.length > 0 || recentThreads.length > 0;

  return (
    <div>
      <TopBar title="Trending" subtitle="Featured community posts" icon={Pin} iconColor="#84D8FD" showBack />
      <div className="px-4 pt-4">
        {!hasContent ? (
          <div className="text-center py-12">
            <p className="text-sm text-text-muted">No posts yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {pinnedThreads.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Pinned</p>
                <div className="flex flex-col gap-3">
                  {pinnedThreads.map((thread) => <ThreadPreviewCard key={thread.id} thread={thread} />)}
                </div>
              </div>
            )}
            {recentThreads.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Recent Posts</p>
                <div className="flex flex-col gap-3">
                  {recentThreads.map((thread) => <ThreadPreviewCard key={thread.id} thread={thread} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
