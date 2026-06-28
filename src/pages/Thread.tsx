import { Send, Pin, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import ChatBubble from "../components/community/ChatBubble";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { compressImage, MAX_PHOTO_BYTES } from "../utils/compressImage";
import { timeAgo } from "../utils/format";

export default function Thread() {
  const { categoryId, threadId } = useParams<{ categoryId: string; threadId: string }>();
  const { categories, threads, user, addMessage, memberBadges, pinThread, unpinThread } = useApp();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [photoError, setPhotoError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const thread = threads.find((t) => t.id === threadId);
  const category = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    // block: "end" aligns the bottom of the marker with the bottom of the
    // scrollport — the default "start" alignment was landing mid-thread on
    // long messages, leaving the sticky input bar stranded above unread text.
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread?.messages.length]);

  if (!thread || !category) return <Navigate to="/community" replace />;

  const isOwnThread = thread.authorId === user.id;
  const authorName = isOwnThread ? user.name || thread.authorName : memberBadges[thread.authorId]?.name || thread.authorName;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !image) return;
    addMessage(thread.id, text.trim(), image);
    setText("");
    setImage(undefined);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is too large — please choose an image smaller than 15MB.");
      e.target.value = "";
      return;
    }
    setPhotoError("");
    setImage(await compressImage(file, 640, 0.6));
    e.target.value = "";
  };

  const handleTogglePin = () => {
    if (thread.pinnedAt) {
      unpinThread(thread.id);
    } else {
      pinThread(thread.id, categoryId!);
    }
  };

  return (
    <div>
      <TopBar
        title={thread.title}
        subtitle={category.name}
        showBack
        right={user.isAdmin && (
          <button
            onClick={handleTogglePin}
            className={`p-2 rounded-full transition-colors ${
              thread.pinnedAt
                ? "text-brand-light"
                : "text-text-dim hover:text-text"
            }`}
          >
            <Pin size={20} className={thread.pinnedAt ? "fill-brand-light" : ""} />
          </button>
        )}
      />
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
        className="sticky bottom-0 z-30 glass-card border-t border-border px-3 py-2.5 flex flex-col gap-2 mt-4"
      >
        {photoError && <p className="text-xs text-red-400">{photoError}</p>}
        {image && (
          <div className="relative w-20">
            <img src={image} alt="" className="w-20 h-20 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => setImage(undefined)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X size={11} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-2 text-text-dim shrink-0 cursor-pointer">
            <ImageIcon size={16} />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-surface-2 border border-border rounded-pill px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            disabled={!text.trim() && !image}
            className="w-10 h-10 flex items-center justify-center rounded-full gradient-brand text-white shadow-glow disabled:opacity-50 shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
