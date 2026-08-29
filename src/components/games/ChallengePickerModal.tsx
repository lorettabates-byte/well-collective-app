import { useState, useEffect } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";
import { useApp } from "../../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface TribeMember {
  id: string;
  name: string;
  avatar?: string;
}

interface Props {
  gameId: string;
  gameName: string;
  score: number;
  onClose: () => void;
}

export default function ChallengePickerModal({ gameId, gameName, score, onClose }: Props) {
  const { user } = useApp();
  const [tribe, setTribe] = useState<TribeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user.email || !API_URL) { setLoading(false); return; }
    fetch(`${API_URL}/api/tribe?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        const members: TribeMember[] = (data.tribe ?? []).map((m: { id: string; name: string; avatar?: string }) => ({
          id: m.id, name: m.name, avatar: m.avatar,
        }));
        setTribe(members);
      })
      .catch(() => setError("Could not load tribe"))
      .finally(() => setLoading(false));
  }, [user.email]);

  const invite = async (member: TribeMember) => {
    if (!user.email || !API_URL || sent.has(member.id)) return;
    setSending(member.id);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/game-challenges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, opponentId: member.id, gameId, score }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setSent(s => new Set(s).add(member.id));
        } else {
          setError(data.error ?? "Could not send invite");
        }
      } else {
        setSent(s => new Set(s).add(member.id));
        // Send push notification to opponent
        try {
          const resJson = await res.json();
          const challengeId = resJson.challengeId;
          await fetch(`${API_URL}/api/notifications/send-game-invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipientId: member.id,
              inviterName: user.name || "A friend",
              gameName,
              challengeId,
            }),
          });
        } catch {
          // Notification failed, but challenge was still created — silently ignore
        }
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-md rounded-t-2xl border border-border"
        style={{ background: "var(--color-surface)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div>
            <p className="text-sm font-bold text-text">Share your {gameName} score</p>
            <p className="text-xs text-text-dim mt-0.5">Invite a tribe member to play along</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-text-dim hover:text-text">
            <X size={16} />
          </button>
        </div>

        {/* Score pill */}
        <div className="px-5 py-3 flex items-center gap-2">
          <span className="text-xs text-text-muted">Your score today:</span>
          <span className="text-sm font-bold text-brand-light">{score}</span>
        </div>

        {/* Member list */}
        <div className="px-3 pb-5 max-h-80 overflow-y-auto flex flex-col gap-1">
          {loading && (
            <p className="text-xs text-text-dim text-center py-6">Loading your tribe...</p>
          )}
          {!loading && tribe.length === 0 && !error && (
            <div className="text-center py-6">
              <p className="text-xs text-text-muted">You haven&apos;t connected with any tribe members yet.</p>
              <p className="text-[10px] text-text-dim mt-1">Visit your Well Tribe page to connect.</p>
            </div>
          )}
          {error && (
            <p className="text-xs text-red-400 text-center py-4">{error}</p>
          )}
          {tribe.map(member => {
            const isSent = sent.has(member.id);
            const isSending = sending === member.id;
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-surface-2 flex items-center justify-center">
                  {member.avatar
                    ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    : <span className="text-xs font-bold text-text-dim">{member.name.charAt(0)}</span>
                  }
                </div>

                <span className="flex-1 text-sm text-text font-medium truncate">{member.name}</span>

                <button
                  onClick={() => invite(member)}
                  disabled={isSent || isSending}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${isSent
                      ? "text-emerald-400 border border-emerald-500/30 bg-emerald-500/10"
                      : "text-white gradient-brand disabled:opacity-50"
                    }`}
                >
                  {isSent
                    ? <><CheckCircle2 size={12} /> Invited</>
                    : isSending
                    ? <span className="opacity-60">Sending...</span>
                    : <><Send size={12} /> Invite</>
                  }
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
