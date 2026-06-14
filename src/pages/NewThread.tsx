import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";

export default function NewThread() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { categories, addThread } = useApp();
  const navigate = useNavigate();
  const category = categories.find((c) => c.id === categoryId);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  if (!category || !categoryId) return <Navigate to="/community" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    const thread = addThread(categoryId, title.trim(), text.trim());
    navigate(`/community/${categoryId}/${thread.id}`, { replace: true });
  };

  return (
    <div>
      <TopBar title="New Post" subtitle={`Posting in ${category.name}`} showBack />
      <form onSubmit={handleSubmit} className="px-4 pt-4 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a title..."
            className="w-full bg-surface-2 border border-border rounded-card px-4 py-3 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Message</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share what's on your mind..."
            rows={6}
            className="w-full bg-surface-2 border border-border rounded-card px-4 py-3 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={!title.trim() || !text.trim()}
          className="gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow disabled:opacity-50"
        >
          Post to {category.name}
        </button>
      </form>
    </div>
  );
}
