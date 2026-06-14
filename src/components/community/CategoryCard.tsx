import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../../store/AppContext";
import type { ForumCategory } from "../../types";

export default function CategoryCard({ category }: { category: ForumCategory }) {
  const { threads } = useApp();
  const postCount = threads.filter((t) => t.categoryId === category.id).length;

  return (
    <Link
      to={`/community/${category.id}`}
      className="flex items-center gap-3 glass-card rounded-card p-4 animate-fade-in-up"
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-2xl text-2xl shrink-0"
        style={{ backgroundColor: `${category.color}22` }}
      >
        {category.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-text">{category.name}</h3>
        <p className="text-xs text-text-muted line-clamp-1">{category.description}</p>
        <p className="text-[11px] text-text-dim mt-0.5">
          {postCount} {postCount === 1 ? "post" : "posts"}
        </p>
      </div>
      <ChevronRight size={18} className="text-text-dim shrink-0" />
    </Link>
  );
}
