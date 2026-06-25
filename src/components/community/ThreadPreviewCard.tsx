import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { CategoryIcon } from "../../data/iconMap";
import { resolveFeaturedBadge } from "../../data/badges";
import { useApp } from "../../store/AppContext";
import type { ForumThread } from "../../types";
import { timeAgo } from "../../utils/format";
import Avatar from "../ui/Avatar";

export default function ThreadPreviewCard({ thread }: { thread: ForumThread }) {
  const { categories, memberBadges } = useApp();
  const category = categories.find((c) => c.id === thread.categoryId);
  const lastMessage = thread.messages[thread.messages.length - 1];
  const totalLikes = thread.messages.reduce((sum, m) => sum + m.likes.length, 0);
  const badgeId = resolveFeaturedBadge(memberBadges[thread.authorId] ?? {});

  return (
    <Link
      to={`/community/${thread.categoryId}/${thread.id}`}
      className="block glass-card rounded-card p-4 animate-fade-in-up"
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar src={thread.authorAvatar} alt={thread.authorName} size={28} badgeId={badgeId} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text truncate">{thread.authorName}</p>
        </div>
        <span className="text-xs text-text-dim shrink-0">{timeAgo(thread.createdAt)}</span>
      </div>

      {category && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-pill mb-2"
          style={{ backgroundColor: `${category.color}22`, color: category.color }}
        >
          <CategoryIcon icon={category.icon} size={12} className="drop-shadow-none" />
          {category.name}
        </span>
      )}

      <h3 className="text-sm font-bold text-text mb-1">{thread.title}</h3>
      {lastMessage && (
        <p className="text-xs text-text-muted line-clamp-2 mb-3">{lastMessage.text}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-text-dim">
        <span className="flex items-center gap-1">
          <Heart size={14} /> {totalLikes}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={14} /> {thread.messages.length}
        </span>
      </div>
    </Link>
  );
}
