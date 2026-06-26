import { Mail, MessageCircle, Plus, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import { resolveFeaturedBadge } from "../data/badges";
import { useApp } from "../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface Message {
  id: number;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
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
    <div className="flex flex-col h-screen bg-bg">
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
            <div key={msg.id} className={`flex gap-2 ${msg.sender_id === user.id ? "justify-end" : ""}`}>
              {msg.sender_id !== user.id && (
                <button type="button" onClick={() => navigate(`/member/${selectedUserId}`)} className="shrink-0">
                  <Avatar
                    src={otherMember?.avatar || ""}
                    alt={otherMember?.name || "Member"}
                    size={28}
                    badgeId={resolveFeaturedBadge(otherMember ?? {})}
                  />
                </button>
              )}
              <div
                className={`max-w-xs rounded-card px-3 py-2 text-sm ${
                  msg.sender_id === user.id
                    ? "gradient-brand text-white"
                    : "bg-surface-2 text-text"
                }`}
              >
                {msg.body}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-4 border-t border-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-surface-2 border border-border rounded-pill px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="gradient-brand text-white p-2.5 rounded-full disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
