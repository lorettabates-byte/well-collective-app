import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { CategoryIcon } from "../../data/iconMap";
import { useApp } from "../../store/AppContext";
import { timeAgo } from "../../utils/format";

export default function AdminPosts() {
  const { categories, threads, deleteThread, deleteMessage } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...threads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <TopBar title="Posts" subtitle="Moderate threads & messages" showBack />
      <div className="px-4 pt-4 flex flex-col gap-3">
        {sorted.map((thread) => {
          const category = categories.find((c) => c.id === thread.categoryId);
          const expanded = expandedId === thread.id;

          return (
            <div key={thread.id} className="glass-card rounded-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {category && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-pill mb-1.5"
                      style={{ backgroundColor: `${category.color}22`, color: category.color }}
                    >
                      <CategoryIcon icon={category.icon} size={12} className="drop-shadow-none" />
                      {category.name}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-text">{thread.title}</h3>
                  <p className="text-xs text-text-dim mt-0.5">
                    {thread.authorName} · {timeAgo(thread.createdAt)} · {thread.messages.length} messages
                  </p>
                </div>
                <button
                  onClick={() => setExpandedId(expanded ? null : thread.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0"
                  aria-label="Toggle messages"
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button
                  onClick={() => deleteThread(thread.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0 text-red-400"
                  aria-label="Delete thread"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
                  {thread.messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-2 bg-surface-2 rounded-card px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text">{message.authorName}</p>
                        <p className="text-xs text-text-muted mt-0.5">{message.text}</p>
                        <p className="text-[10px] text-text-dim mt-1">{timeAgo(message.createdAt)} · {message.likes.length} likes</p>
                      </div>
                      <button
                        onClick={() => deleteMessage(thread.id, message.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-3 shrink-0 text-red-400"
                        aria-label="Delete message"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
