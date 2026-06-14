import { Heart } from "lucide-react";
import { useApp } from "../../store/AppContext";
import type { ThreadMessage } from "../../types";
import { formatTime } from "../../utils/format";
import Avatar from "../ui/Avatar";

interface ChatBubbleProps {
  message: ThreadMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  threadId: string;
}

export default function ChatBubble({ message, isOwn, showAvatar, showName, threadId }: ChatBubbleProps) {
  const { user, toggleMessageLike } = useApp();
  const hasLiked = message.likes.includes(user.id);

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""} animate-fade-in-up`}>
      <div className="w-7 shrink-0">{showAvatar && <Avatar src={message.authorAvatar} alt={message.authorName} size={28} />}</div>
      <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {showName && !isOwn && <span className="text-[11px] text-text-dim mb-1 px-1">{message.authorName}</span>}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isOwn
              ? "gradient-brand text-white rounded-bubble rounded-br-md"
              : "bg-surface-2 text-text rounded-bubble rounded-bl-md"
          }`}
        >
          {message.text}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[10px] text-text-dim">{formatTime(message.createdAt)}</span>
          <button
            onClick={() => toggleMessageLike(threadId, message.id)}
            className="flex items-center gap-1 text-[10px] text-text-dim"
          >
            <Heart size={12} className={hasLiked ? "fill-brand-light text-brand-light" : ""} />
            {message.likes.length > 0 && message.likes.length}
          </button>
        </div>
      </div>
    </div>
  );
}
