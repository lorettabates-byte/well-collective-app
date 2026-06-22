import { Mail, MessageCircle, PenSquare } from "lucide-react";
import { Link } from "react-router-dom";
import CategoryCard from "../components/community/CategoryCard";
import ThreadPreviewCard from "../components/community/ThreadPreviewCard";
import TopBar from "../components/layout/TopBar";
import SectionHeader from "../components/ui/SectionHeader";
import { useApp } from "../store/AppContext";

export default function Community() {
  const { categories, threads } = useApp();

  const trending = [...threads]
    .sort((a, b) => {
      const aLikes = a.messages.reduce((sum, m) => sum + m.likes.length, 0);
      const bLikes = b.messages.reduce((sum, m) => sum + m.likes.length, 0);
      return bLikes - aLikes;
    })
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

        {trending.length > 0 && (
          <div className="mb-6">
            <SectionHeader title="🔥 Trending" />
            <div className="flex flex-col gap-3">
              {trending.map((thread) => (
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
      </div>
    </div>
  );
}
