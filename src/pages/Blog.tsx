import { ArrowUpRight, Rss } from "lucide-react";
import BlogPostCard from "../components/blog/BlogPostCard";
import TopBar from "../components/layout/TopBar";
import { BLOG_URL, useBlogFeed } from "../hooks/useBlogFeed";

export default function Blog() {
  const { posts, loading, error } = useBlogFeed();

  return (
    <div>
      <TopBar title="Blog" subtitle="Fresh reads from Loretta" icon={Rss} iconColor="#FF6B6B" showBack />
      <div className="px-4 pt-4">
        {loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Rss size={28} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)] animate-pulse" />
            <p className="text-sm text-text-muted">Loading the latest posts...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <Rss size={28} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
            <p className="text-sm text-text-muted max-w-xs">
              We couldn't load the blog feed right now. You can still visit the blog directly.
            </p>
            <a
              href={BLOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold gradient-brand text-white rounded-pill px-4 py-2 shadow-glow"
            >
              Visit Blog
              <ArrowUpRight size={14} />
            </a>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <BlogPostCard key={post.link} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
