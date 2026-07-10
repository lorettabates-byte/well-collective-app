import { Heart, Edit2, Check, X, CornerUpLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { resolveFeaturedBadge } from "../../data/badges";
import { useApp } from "../../store/AppContext";
import type { ThreadMessage } from "../../types";
import { formatTime } from "../../utils/format";
import Avatar from "../ui/Avatar";
import ImageLightbox from "../ui/ImageLightbox";

interface ChatBubbleProps {
  message: ThreadMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  threadId: string;
  replyToMessage?: ThreadMessage;
  onReply?: (message: ThreadMessage) => void;
}

export default function ChatBubble({ message, isOwn, showAvatar, showName, threadId, replyToMessage, onReply }: ChatBubbleProps) {
  const { user, toggleMessageLike, memberBadges, editMessage } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const hasLiked = message.likes.includes(user.id);
  const liveAuthor = memberBadges[message.authorId];
  const badgeId = resolveFeaturedBadge(liveAuthor ?? {});
  const authorAvatar = liveAuthor?.avatar || message.authorAvatar;
  const authorName = liveAuthor?.name || message.authorName;

  const replyAuthorName = replyToMessage
    ? (memberBadges[replyToMessage.authorId]?.name || replyToMessage.authorName)
    : null;

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""} animate-fade-in-up`}>
      <div className="w-7 shrink-0">
        {showAvatar &&
          (isOwn ? (
            <Avatar src={user.avatar || authorAvatar} alt={user.name || authorName} size={28} badgeId={badgeId} />
          ) : (
            <Link to={`/member/${message.authorId}`}>
              <Avatar src={authorAvatar} alt={authorName} size={28} badgeId={badgeId} />
            </Link>
          ))}
      </div>
      <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {showName && !isOwn && <span className="text-[11px] text-text-dim mb-1 px-1">{authorName}</span>}

        {/* Quoted reply preview */}
        {replyToMessage && (
          <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 border-brand-light/60 bg-brand/10 max-w-full ${isOwn ? "self-end" : "self-start"}`}>
            <p className="text-[10px] font-semibold text-brand-light mb-0.5">↩ {replyAuthorName}</p>
            <p className="text-[11px] text-text-muted line-clamp-2">
              {replyToMessage.text || (replyToMessage.image ? "📷 Photo" : "")}
            </p>
          </div>
        )}

        {isEditing ? (
          <div className="flex gap-2 w-full">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={`flex-1 px-4 py-2.5 text-sm rounded-lg resize-none focus:outline-none focus:ring-2 ${
                isOwn
                  ? "bg-white text-black focus:ring-brand-light"
                  : "bg-surface-2 text-text focus:ring-brand-light"
              }`}
              rows={3}
            />
            <div className="flex gap-1 items-start pt-2.5">
              <button
                onClick={() => {
                  editMessage(threadId, message.id, editText.trim());
                  setIsEditing(false);
                }}
                className="p-1 text-green-400 hover:text-green-300"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setEditText(message.text);
                  setIsEditing(false);
                }}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.image && (
              <img
                src={message.image}
                alt=""
                className="max-w-full rounded-bubble mb-1 cursor-pointer active:opacity-80"
                style={{ maxHeight: 240 }}
                onClick={() => setLightboxSrc(message.image!)}
              />
            )}
            {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
            {message.text && (
              <div
                className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  isOwn
                    ? "gradient-brand text-white rounded-bubble rounded-br-md"
                    : "bg-surface-2 text-text rounded-bubble rounded-bl-md"
                }`}
              >
                {message.text}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-[10px] text-text-dim">
                {formatTime(message.createdAt)}
                {message.editedAt && <span className="ml-1 text-[9px]">(edited)</span>}
              </span>
              {onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="text-text-dim hover:text-brand-light transition-colors p-0.5"
                  aria-label="Reply"
                >
                  <CornerUpLeft size={12} />
                </button>
              )}
              {isOwn && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-text-dim hover:text-text transition-colors p-0.5"
                >
                  <Edit2 size={12} />
                </button>
              )}
              <button
                onClick={() => toggleMessageLike(threadId, message.id)}
                className="flex items-center gap-1 text-[10px] text-text-dim"
              >
                <Heart size={12} className={hasLiked ? "fill-brand-light text-brand-light" : ""} />
                {message.likes.length > 0 && message.likes.length}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
