import { Mail, MessageCircle, Plus, Send, Edit2, Check, X, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import { resolveFeaturedBadge } from "../data/badges";
import { useApp } from "../store/AppContext";
import { formatTime } from "../utils/format";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface Message {
  id: number;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
  edited_at?: string;
  likes?: string[];
}

interface Conversation {
  user_id: string;
  last_message_at: string;
  last_body: string;
  unread_count: number;
}

interface DirectoryMember {
  id: string;
  name: string;
  avatar?: string;
  levelBadge?: string;
  bonusBadges?: string[];
  grantedBadges?: string[];
  featuredBadge?: string;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

interface DirectMessageProps {
  message: Message;
  isOwn: boolean;
  onEdit: (messageId: number, newBody: string) => Promise<void>;
  onLike: (messageId: number) => Promise<void>;
  currentUserId: string;
  otherMember: DirectoryMember | undefined;
  selectedUserId: string;
  navigate: ReturnType<typeof useNavigate>;
}

function DirectMessage({
  message,
  isOwn,
  onEdit,
  onLike,
  currentUserId,
  otherMember,
  selectedUserId,
  navigate,
}: DirectMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.body);
  const isLiked = (message.likes || []).includes(currentUserId);

  return (
    <div className={`flex gap-2 ${isOwn ? "justify-end" : ""}`}>
      {!isOwn && (
        <button type="button" onClick={() => navigate(`/member/${selectedUserId}`)} className="shrink-0">
          <Avatar
            src={otherMember?.avatar || ""}
            alt={otherMember?.name || "Member"}
            size={28}
            badgeId={resolveFeaturedBadge(otherMember ?? {})}
          />
        </button>
      )}
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {isEditing ? (
          <div className="flex gap-2 max-w-xs">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg resize-none focus:outline-none focus:ring-2 ${
                isOwn
                  ? "bg-white text-black focus:ring-brand-light"
                  : "bg-surface-2 text-text focus:ring-brand-light"
              }`}
              rows={2}
            />
            <div className="flex gap-1 items-start pt-1.5">
              <button
                onClick={() => {
                  onEdit(message.id, editText);
                  setIsEditing(false);
                }}
                className="p-1 text-green-400 hover:text-green-300"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setEditText(message.body);
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
            <div
              className={`max-w-xs rounded-card px-3 py-2 text-sm ${
                isOwn ? "gradient-brand text-white" : "bg-surface-2 text-text"
              }`}
            >
              {message.body}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-text-dim px-1">
              <span>
                {formatTime(message.created_at)}
                {message.edited_at && <span className="ml-1">(edited)</span>}
              </span>
              <button
                onClick={() => onLike(message.id)}
                className={`p-0.5 transition-colors ${
                  isLiked ? "text-red-400 hover:text-red-300" : "text-text-dim hover:text-text"
                }`}
              >
                <Heart size={12} className={isLiked ? "fill-red-400" : ""} />
              </button>
              {isOwn && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-text-dim hover:text-text transition-colors p-0.5"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Messages() {
  const { user } = useApp();
  const navigate = useNavigate();
  const { userId: selectedUserId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [directory, setDirectory] = useState<Record<string, DirectoryMember>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch the member directory once so we can resolve names/avatars for
  // both the inbox list and the open conversation header/bubbles.
  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/members?excludeEmail=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : { members: [] }))
      .then((data) => {
        const map: Record<string, DirectoryMember> = {};
        for (const m of data.members || []) map[m.id] = m;
        setDirectory(map);
      })
      .catch(() => setDirectory({}));
  }, [user.email]);

  useEffect(() => {
    if (selectedUserId || !API_URL) {
      setInboxLoading(false);
      return;
    }

    let cancelled = false;
    const fetchInbox = async () => {
      try {
        const res = await fetch(`${API_URL}/api/messages?currentUserId=${encodeURIComponent(user.id)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (err) {
        console.error("Fetch inbox error:", err);
      } finally {
        if (!cancelled) setInboxLoading(false);
      }
    };

    fetchInbox();
    const pollInterval = setInterval(fetchInbox, 5000);
    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [selectedUserId, user.id]);

  useEffect(() => {
    if (!selectedUserId || !API_URL) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/messages/${selectedUserId}?currentUserId=${user.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };

    fetchMessages();

    // Poll for new messages every 2 seconds while conversation is open
    const pollInterval = setInterval(fetchMessages, 2000);
    return () => clearInterval(pollInterval);
  }, [selectedUserId, user.id, API_URL]);

  const handleSend = async () => {
    if (!input.trim() || !selectedUserId || !API_URL) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          recipientId: selectedUserId,
          body: input,
          senderName: user.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.message]);
        setInput("");
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = async (messageId: number, newBody: string) => {
    if (!API_URL || !newBody.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: newBody.trim(),
          senderId: user.id,
        }),
      });

      if (res.ok) {
        setMessages(messages.map((msg) =>
          msg.id === messageId
            ? { ...msg, body: newBody.trim(), edited_at: new Date().toISOString() }
            : msg
        ));
      }
    } catch (err) {
      console.error("Edit message error:", err);
    }
  };

  const handleLikeMessage = async (messageId: number) => {
    if (!API_URL) return;

    try {
      const res = await fetch(`${API_URL}/api/messages/${messageId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (res.ok) {
        const { liked } = await res.json();
        setMessages(messages.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                likes: liked
                  ? [...(msg.likes || []), user.id]
                  : (msg.likes || []).filter((id) => id !== user.id),
              }
            : msg
        ));
      }
    } catch (err) {
      console.error("Like message error:", err);
    }
  };

  if (!selectedUserId) {
    return (
      <div>
        <TopBar title="Messages" subtitle="Private conversations" icon={Mail} iconColor="#0191CE" showBack />
        <div className="px-4 pt-4">
          {inboxLoading ? (
            <p className="text-xs text-text-muted text-center py-12">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-12">
              <MessageCircle size={48} className="text-text-muted" />
              <p className="text-sm text-text-muted">No conversations yet</p>
              <Link
                to="/new-message"
                className="flex items-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill px-6 py-2.5 shadow-glow"
              >
                <Plus size={16} />
                Start a Conversation
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 mb-4">
                {conversations.map((conv) => {
                  const member = directory[conv.user_id];
                  const name = member?.name || "Member";
                  return (
                    <Link
                      key={conv.user_id}
                      to={`/messages/${conv.user_id}`}
                      className="flex items-center gap-3 glass-card rounded-card p-4"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/member/${conv.user_id}`);
                        }}
                        className="shrink-0"
                      >
                        <Avatar src={member?.avatar || ""} alt={name} size={44} badgeId={resolveFeaturedBadge(member ?? {})} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-text truncate">{name}</h3>
                          <span className="text-[11px] text-text-dim shrink-0">
                            {timeAgo(conv.last_message_at)}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted truncate">{conv.last_body}</p>
                      </div>
                      {conv.unread_count > 0 && (
                        <div className="w-5 h-5 rounded-full gradient-brand text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {conv.unread_count}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
              <Link
                to="/new-message"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-light border border-brand-light/30 rounded-pill py-2.5 mb-4"
              >
                <Plus size={16} />
                Start a Conversation
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const otherMember = directory[selectedUserId];

  return (
    <div className="flex flex-col h-screen bg-bg pb-24">
      <TopBar
        title={otherMember?.name || "Message"}
        subtitle="Conversation"
        showBack
        right={
          otherMember && (
            <button type="button" onClick={() => navigate(`/member/${selectedUserId}`)}>
              <Avatar
                src={otherMember.avatar || ""}
                alt={otherMember.name}
                size={32}
                badgeId={resolveFeaturedBadge(otherMember)}
              />
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-8">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <DirectMessage
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user.id}
              onEdit={handleEditMessage}
              onLike={handleLikeMessage}
              currentUserId={user.id}
              otherMember={otherMember}
              selectedUserId={selectedUserId}
              navigate={navigate}
            />
          ))
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4 py-4 border-t border-border flex items-end gap-2 bg-bg">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-grow textarea up to 5 lines (~120px)
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-surface-2 border border-border rounded-card px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light resize-none leading-snug"
          style={{ maxHeight: 120 }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="gradient-brand text-white p-2.5 rounded-full disabled:opacity-50 shrink-0"
          title="Send (or press Enter)"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
