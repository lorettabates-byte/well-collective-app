import { Heart, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CategoryIcon } from "../../data/iconMap";
import { resolveFeaturedBadge } from "../../data/badges";
import { useApp } from "../../store/AppContext";
import type { ForumThread } from "../../types";
import { timeAgo } from "../../utils/format";
import Avatar from "../ui/Avatar";

export default function ThreadPreviewCard({ thread }: { thread: ForumThread }) {
  const { categories, memberBadges, user } = useApp();
  const navigate = useNavigate();
  const category = categories.find((c) => c.id === thread.categoryId);
  const lastMessage = thread.messages[thread.messages.length - 1];
  const totalLikes = thread.messages.reduce((sum, m) => sum + m.likes.length, 0);
  const liveAuthor = memberBadges[thread.authorId];
  const badgeId = resolveFeaturedBadge(liveAuthor ?? {});
  const isOwnThread = thread.authorId === user.id;
  // Prefer the live directory over the avatar/name baked into the thread at
  // post time, which goes stale the moment the author updates their profile.
  const authorAvatar = isOwnThread ? user.avatar || thread.authorAvatar : liveAuthor?.avatar || thread.authorAvatar;
  const authorName = isOwnThread ? user.name || thread.authorName : liveAuthor?.name || thread.authorName;

  return (
    <Link
      to={`/community/${thread.categoryId}/${thread.id}`}
      className="block glass-card rounded-card p-4 animate-fade-in-up"
    >
      <div className="flex items-center gap-2 mb-2">
        {isOwnThread ? (
          <Avatar src={authorAvatar} alt={authorName} size={28} badgeId={badgeId} />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/member/${thread.authorId}`);
            }}
            className="shrink-0"
          >
            <Avatar src={authorAvatar} alt={authorName} size={28} badgeId={badgeId} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text truncate">{authorName}</p>
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
