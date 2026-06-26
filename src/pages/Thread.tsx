import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import ChatBubble from "../components/community/ChatBubble";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { timeAgo } from "../utils/format";

export default function Thread() {
  const { categoryId, threadId } = useParams<{ categoryId: string; threadId: string }>();
  const { categories, threads, user, addMessage, memberBadges } = useApp();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const thread = threads.find((t) => t.id === threadId);
  const category = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  if (!thread || !category) return <Navigate to="/community" replace />;

  const isOwnThread = thread.authorId === user.id;
  const authorName = isOwnThread ? user.name || thread.authorName : memberBadges[thread.authorId]?.name || thread.authorName;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addMessage(thread.id, text.trim());
    setText("");
  };

  return (
    <div>
      <TopBar title={thread.title} subtitle={category.name} showBack />
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-text-dim mb-4">
          Started by {authorName} · {timeAgo(thread.createdAt)}
        </p>
        <div className="flex flex-col gap-3">
          {thread.messages.map((message, i) => {
            const prev = thread.messages[i - 1];
            const next = thread.messages[i + 1];
            const showName = !prev || prev.authorId !== message.authorId;
            const showAvatar = !next || next.authorId !== message.authorId;
            return (
              <ChatBubble
                key={message.id}
                message={message}
                isOwn={message.authorId === user.id}
                showAvatar={showAvatar}
                showName={showName}
                threadId={thread.id}
              />
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="sticky bottom-16 z-30 glass-card border-t border-border px-3 py-2.5 flex items-center gap-2 mt-4"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-surface-2 border border-border rounded-pill px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="w-10 h-10 flex items-center justify-center rounded-full gradient-brand text-white shadow-glow disabled:opacity-50 shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
