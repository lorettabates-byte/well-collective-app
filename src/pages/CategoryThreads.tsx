import { PenSquare } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import ThreadPreviewCard from "../components/community/ThreadPreviewCard";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";

export default function CategoryThreads() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { categories, threads } = useApp();
  const category = categories.find((c) => c.id === categoryId);

  if (!category) return <Navigate to="/community" replace />;

  const categoryThreads = threads
    .filter((t) => t.categoryId === categoryId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <TopBar title={category.name} subtitle={category.description} showBack />
      <div className="px-4 pt-4">
        <Link
          to={`/community/${categoryId}/new`}
          className="flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 mb-4 shadow-glow"
        >
          <PenSquare size={16} />
          New Post
        </Link>

        {categoryThreads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-text-muted">No posts yet. Be the first to share something! 🌿</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {categoryThreads.map((thread) => (
              <ThreadPreviewCard key={thread.id} thread={thread} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
