import { Clock, Pin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";

export default function Trending() {
  const { threads, categories } = useApp();
  const navigate = useNavigate();

  const pinnedThreads = threads.filter((t) => t.pinnedAt).sort((a, b) => (b.pinnedAt || "").localeCompare(a.pinnedAt || ""));
  const recentThreads = threads
    .filter((t) => !t.pinnedAt)
    .sort((a, b) => {
      const aDate = a.messages[0]?.createdAt ?? a.createdAt ?? "";
      const bDate = b.messages[0]?.createdAt ?? b.createdAt ?? "";
      return bDate.localeCompare(aDate);
    })
    .slice(0, 10);

  const categoryMap = categories.reduce(
    (map, cat) => {
      map[cat.id] = cat;
      return map;
    },
    {} as Record<string, (typeof categories)[0]>
  );

  const ThreadCard = ({ thread, pinned }: { thread: (typeof threads)[0]; pinned: boolean }) => {
    const category = categoryMap[thread.categoryId];
    return (
      <button
        key={thread.id}
        onClick={() => navigate(`/community/${thread.categoryId}/${thread.id}`)}
        className="glass-card rounded-card p-4 text-left hover:bg-surface-1 transition-colors"
      >
        <div className="flex items-start gap-2 mb-2">
          {pinned
            ? <Pin size={16} className="text-brand-light mt-0.5 shrink-0" />
            : <Clock size={16} className="text-text-dim mt-0.5 shrink-0" />}
          <h3 className="font-bold text-text flex-1">{thread.title}</h3>
        </div>
        <p className="text-xs text-text-muted mb-2">{category?.name}</p>
        <p className="text-xs text-text-dim">
          {thread.messages.length} {thread.messages.length === 1 ? "reply" : "replies"}
        </p>
      </button>
    );
  };

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
                  {pinnedThreads.map((thread) => <ThreadCard key={thread.id} thread={thread} pinned />)}
                </div>
              </div>
            )}
            {recentThreads.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Recent Posts</p>
                <div className="flex flex-col gap-3">
                  {recentThreads.map((thread) => <ThreadCard key={thread.id} thread={thread} pinned={false} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
