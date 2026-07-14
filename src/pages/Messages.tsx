import { Camera, Mail, MessageCircle, Plus, Send, Edit2, Check, X, Heart, Image } from "lucide-react";
import ImageLightbox from "../components/ui/ImageLightbox";
import LinkifiedText from "../components/ui/LinkifiedText";
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
  image?: string;
  image_status?: string;
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

/** Compress an image File to a base64 JPEG at max 800px, ~70% quality */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const max = 800;
        let { width, height } = img;
        if (width > max || height > max) {
          if (width > height) { height = Math.round((height * max) / width); width = max; }
          else { width = Math.round((width * max) / height); height = max; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface DirectMessageProps {
  message: Message;
  isOwn: boolean;
  onEdit: (messageId: number, newBody: string) => Promise<void>;
  onLike: (messageId: number) => Promise<void>;
  onApproveImage: (messageId: number) => Promise<void>;
  currentUserId: string;
  otherMember: DirectoryMember | undefined;
  otherMoodStatus?: string | null;
  selectedUserId: string;
  navigate: ReturnType<typeof useNavigate>;
}

function DirectMessage({
  message,
  isOwn,
  onEdit,
  onLike,
  onApproveImage,
  currentUserId,
  otherMember,
  otherMoodStatus,
  selectedUserId,
  navigate,
}: DirectMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.body);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const isLiked = (message.likes || []).includes(currentUserId);
  const hasImage = !!message.image;
  const imagePending = message.image_status === "pending";

  return (
    <div className={`flex gap-2 ${isOwn ? "justify-end" : ""}`}>
      {!isOwn && (
        <button type="button" onClick={() => navigate(`/member/${selectedUserId}`)} className="shrink-0">
          <Avatar
            src={otherMember?.avatar || ""}
            alt={otherMember?.name || "Member"}
            size={28}
            badgeId={resolveFeaturedBadge(otherMember ?? {})}
            moodStatus={otherMoodStatus}
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
                onClick={() => { onEdit(message.id, editText); setIsEditing(false); }}
                className="p-1 text-green-400 hover:text-green-300"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => { setEditText(message.body); setIsEditing(false); }}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {hasImage && (
              <div className="max-w-xs mb-1">
                {!isOwn && imagePending ? (
                  <div
                    className="relative rounded-card overflow-hidden cursor-pointer"
                    onClick={() => onApproveImage(message.id)}
                  >
                    <img
                      src={message.image}
                      alt="Photo"
                      className="w-full object-cover blur-xl scale-110"
                      style={{ maxHeight: 200 }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <Image size={20} className="text-white mb-1" />
                      <span className="text-white text-xs font-semibold">Tap to approve photo</span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={message.image}
                    alt="Photo"
                    className="rounded-card object-cover w-full cursor-pointer active:opacity-80"
                    style={{ maxHeight: 300 }}
                    onClick={() => setLightboxSrc(message.image!)}
                  />
                )}
                {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
              </div>
            )}
            {message.body && message.body !== "📷 Photo" && (
              <div
                className={`max-w-xs rounded-card px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  isOwn ? "gradient-brand text-white" : "bg-surface-2 text-text"
                }`}
              >
                <LinkifiedText text={message.body} />
              </div>
            )}
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
              {isOwn && !hasImage && (
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
  const { user, blockedUserIds, memberBadges } = useApp();
  const navigate = useNavigate();
  const { userId: selectedUserId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [directory, setDirectory] = useState<Record<string, DirectoryMember>>({});
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll messages list to bottom (targets the inner scroll container, not MobileShell)
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = messagesListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    else bottomRef.current?.scrollIntoView({ behavior });
  };

  // Adjust compose box when virtual keyboard opens/closes (iOS PWA / Capacitor).
  // vv.offsetTop is the viewport scroll amount which exactly cancels the keyboard
  // height in the (height + offsetTop) formula, so we drop it: keyboard height is
  // simply window.innerHeight minus the shrunken visual viewport height.
  useEffect(() => {
    if (!selectedUserId) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const reposition = () => {
      const box = composeRef.current;
      if (!box) return;
      const keyboardHeight = Math.max(0, window.innerHeight - vv.height);
      box.style.bottom = `${keyboardHeight + 80}px`;
      if (keyboardHeight > 0) setTimeout(() => scrollToBottom("smooth"), 80);
    };
    vv.addEventListener("resize", reposition);
    vv.addEventListener("scroll", reposition);
    return () => {
      vv.removeEventListener("resize", reposition);
      vv.removeEventListener("scroll", reposition);
    };
  }, [selectedUserId]);

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
    return () => { cancelled = true; clearInterval(pollInterval); };
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
          setTimeout(() => scrollToBottom("instant"), 50);
        }
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };

    fetchMessages();
    const pollInterval = setInterval(fetchMessages, 2000);
    return () => clearInterval(pollInterval);
  }, [selectedUserId, user.id, API_URL]);

  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || !selectedUserId || !API_URL) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          recipientId: selectedUserId,
          body: input.trim() || (pendingImage ? "📷 Photo" : ""),
          senderName: user.name,
          ...(pendingImage ? { image: pendingImage } : {}),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message.id !== -1) {
          setMessages((prev) => [...prev, data.message]);
        }
        setInput("");
        setPendingImage(null);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        setTimeout(() => scrollToBottom("smooth"), 50);
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPendingImage(compressed);
    } catch {
      console.error("Failed to compress image");
    }
    e.target.value = "";
  };

  const handleEditMessage = async (messageId: number, newBody: string) => {
    if (!API_URL || !newBody.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newBody.trim(), senderId: user.id }),
      });
      if (res.ok) {
        setMessages(messages.map((msg) =>
          msg.id === messageId ? { ...msg, body: newBody.trim(), edited_at: new Date().toISOString() } : msg
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
            ? { ...msg, likes: liked ? [...(msg.likes || []), user.id] : (msg.likes || []).filter((id) => id !== user.id) }
            : msg
        ));
      }
    } catch (err) {
      console.error("Like message error:", err);
    }
  };

  const handleApproveImage = async (messageId: number) => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/${messageId}/approve-image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approverId: user.id }),
      });
      if (res.ok) {
        setMessages(messages.map((msg) =>
          msg.id === messageId ? { ...msg, image_status: "approved" } : msg
        ));
      }
    } catch (err) {
      console.error("Approve image error:", err);
    }
  };

  if (!selectedUserId) {
    // Filter blocked users from inbox
    const visibleConversations = conversations.filter((c) => !blockedUserIds.includes(c.user_id));

    return (
      <div>
        <TopBar title="Messages" subtitle="Private conversations" icon={Mail} iconColor="#0191CE" showBack />
        <div className="px-4 pt-4">
          {inboxLoading ? (
            <p className="text-xs text-text-muted text-center py-12">Loading conversations...</p>
          ) : visibleConversations.length === 0 ? (
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
                {visibleConversations.map((conv) => {
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
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/member/${conv.user_id}`); }}
                        className="shrink-0"
                      >
                        <Avatar src={member?.avatar || ""} alt={name} size={44} badgeId={resolveFeaturedBadge(member ?? {})} moodStatus={memberBadges[conv.user_id]?.moodStatus} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-text truncate">{name}</h3>
                          <span className="text-[11px] text-text-dim shrink-0">{timeAgo(conv.last_message_at)}</span>
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
                moodStatus={memberBadges[selectedUserId ?? ""]?.moodStatus}
              />
            </button>
          )
        }
      />

      <div ref={messagesListRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
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
              onApproveImage={handleApproveImage}
              currentUserId={user.id}
              otherMember={otherMember}
              otherMoodStatus={memberBadges[selectedUserId ?? ""]?.moodStatus}
              selectedUserId={selectedUserId}
              navigate={navigate}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose box — fixed above bottom nav, keyboard-adjusted via visualViewport */}
      <div
        ref={composeRef}
        className="fixed left-0 right-0 px-4 py-3 border-t border-border bg-bg"
        style={{ bottom: 80 }}
      >
        {pendingImage && (
          <div className="relative mb-2 inline-block">
            <img src={pendingImage} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={10} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePickImage}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-text-dim hover:text-brand-light transition-colors shrink-0"
            title="Send photo"
          >
            <Camera size={20} />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-surface-2 border border-border rounded-card px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light resize-none leading-snug"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={loading || (!input.trim() && !pendingImage)}
            className="gradient-brand text-white p-2.5 rounded-full disabled:opacity-50 shrink-0"
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
