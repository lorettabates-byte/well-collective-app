import { Mail, MessageCircle, PenSquare, Pin } from "lucide-react";
import { Link } from "react-router-dom";
import CategoryCard from "../components/community/CategoryCard";
import ThreadPreviewCard from "../components/community/ThreadPreviewCard";
import TopBar from "../components/layout/TopBar";
import WellCupLeaderboard from "../components/WellCupLeaderboard";
import SectionHeader from "../components/ui/SectionHeader";
import { useApp } from "../store/AppContext";

export default function Community() {
  const { categories, threads } = useApp();

  const pinnedThreads = [...threads]
    .filter((t) => t.pinnedAt)
    .sort((a, b) => (b.pinnedAt || "").localeCompare(a.pinnedAt || ""))
    .slice(0, 2);

  return (
    <div>
      <TopBar title="Community" subtitle="Connect, share, and support one another" icon={MessageCircle} iconColor="#0191CE" />
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            to="/community/new"
            className="flex items-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-3 px-4 shadow-glow justify-center"
          >
            <PenSquare size={16} />
            New Post
          </Link>
          <Link
            to="/messages"
            className="flex items-center gap-2 glass-card text-text text-sm font-semibold rounded-pill py-3 px-4 justify-center"
          >
            <Mail size={16} />
            Messages
          </Link>
        </div>

        {pinnedThreads.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <Pin size={16} className="text-brand-light" />
                Trending
              </h2>
              <Link to="/trending" className="text-xs text-brand-light hover:text-brand">
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {pinnedThreads.map((thread) => (
                <ThreadPreviewCard key={thread.id} thread={thread} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <SectionHeader title="Categories" />
          <div className="flex flex-col gap-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>

        <WellCupLeaderboard />
      </div>
    </div>
  );
}
