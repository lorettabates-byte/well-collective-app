import { MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
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

export default function Messages() {
  const { user } = useApp();
  const { userId: selectedUserId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
        <TopBar title="Messages" subtitle="Private conversations" showBack />
        <div className="px-4 pt-8 flex flex-col items-center justify-center text-center gap-3 py-12">
          <MessageCircle size={48} className="text-text-muted" />
          <p className="text-sm text-text-muted">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      <TopBar title={selectedUserId || "Message"} subtitle="Conversation" showBack />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-8">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.sender_id === user.id ? "justify-end" : ""}`}>
              {msg.sender_id !== user.id && <Avatar src="" alt="" size={28} />}
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
