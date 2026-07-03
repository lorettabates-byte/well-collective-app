import { ArrowUpRight } from "lucide-react";
import type { BlogPost } from "../../hooks/useBlogFeed";
import { logActivity } from "../../utils/wellCup";

export default function BlogPostCard({ post, compact, userEmail }: { post: BlogPost; compact?: boolean; userEmail?: string }) {
  const date = post.pubDate
    ? new Date(post.pubDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  const handleClick = () => {
    if (userEmail) logActivity(userEmail, "blog_open").catch(() => {});
  };

  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`block glass-card rounded-card overflow-hidden animate-fade-in-up ${compact ? "w-60 shrink-0" : ""}`}
    >
      {post.thumbnail && (
        <img src={post.thumbnail} alt="" className={`w-full object-cover ${compact ? "h-28" : "h-40"}`} />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-bold text-text line-clamp-2">{post.title}</h3>
          <ArrowUpRight size={16} className="text-brand-light shrink-0 mt-0.5" />
        </div>
        {!compact && post.description && (
          <p className="text-xs text-text-muted line-clamp-3 mb-2">{post.description}</p>
        )}
        {date && <p className="text-[11px] text-text-dim">{date}</p>}
      </div>
    </a>
  );
}
