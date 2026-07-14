import { Cake, Flame, Heart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TRIBE_CHEERS } from "../../data/cheers";
import { resolveFeaturedBadge } from "../../data/badges";
import { useApp } from "../../store/AppContext";
import { birthdayDateForYear } from "../../utils/birthday";
import { computeStreak } from "../../utils/streaks";
import SectionHeader from "../ui/SectionHeader";
import Avatar from "../ui/Avatar";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface TribeMember {
  id: string;
  name: string;
  avatar?: string;
  birthday?: string;
  workoutLog?: string[];
  lastCheeredAt?: string | null;
  levelBadge?: string;
  bonusBadges?: string[];
  grantedBadges?: string[];
  featuredBadge?: string;
  moodStatus?: string | null;
}

type SuggestionReason = "birthday" | "streak" | "new" | "uncheerred" | "inactive" | "tribe";

interface ScoredMember {
  member: TribeMember;
  score: number;
  reason: SuggestionReason;
  reasonLabel: string;
  ctaCopy: string;
}

function daysUntilBirthday(birthday: string): number {
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(`${todayStr}T00:00:00`);
  const next = new Date(`${birthdayDateForYear(birthday, today.getFullYear())}T00:00:00`);
  let diff = Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
  if (diff < 0) {
    const nextYear = new Date(`${birthdayDateForYear(birthday, today.getFullYear() + 1)}T00:00:00`);
    diff = Math.round((nextYear.getTime() - today.getTime()) / MS_PER_DAY);
  }
  return diff;
}

function scoreMember(m: TribeMember): ScoredMember | null {
  let score = 0;
  let reason: SuggestionReason | null = null;
  let reasonLabel = "";
  let ctaCopy = "Send a Cheer";

  if (m.birthday) {
    const days = daysUntilBirthday(m.birthday);
    if (days === 0) { score += 10; reason = "birthday"; reasonLabel = "Birthday today"; ctaCopy = "Send Love"; }
    else if (days <= 2) { score += 8; reason = "birthday"; reasonLabel = `Birthday in ${days}d`; ctaCopy = "Send Love"; }
    else if (days <= 7) { score += 5; reason = "birthday"; reasonLabel = `Birthday in ${days}d`; ctaCopy = "Send Love"; }
  }

  const streak = computeStreak(m.workoutLog || []);
  if (streak >= 5 && !reason) { score += 6; reason = "streak"; reasonLabel = `${streak}-day streak`; ctaCopy = "Cheer Her On"; }
  else if (streak >= 3 && !reason) { score += 3; reason = "streak"; reasonLabel = `${streak}-day streak`; ctaCopy = "Send a Cheer"; }
  else if (streak >= 5) score += 6;
  else if (streak >= 3) score += 3;

  const logLen = (m.workoutLog || []).length;
  if (logLen === 0 && !reason) { score += 4; reason = "new"; reasonLabel = "New member"; ctaCopy = "Say Welcome"; }
  else if (logLen <= 3 && !reason) { score += 2; reason = "new"; reasonLabel = "Just started"; ctaCopy = "Encourage Her"; }
  else if (logLen === 0) score += 4;
  else if (logLen <= 3) score += 2;

  const lastCheered = m.lastCheeredAt ? new Date(m.lastCheeredAt).getTime() : 0;
  const daysSinceCheer = lastCheered ? Math.floor((Date.now() - lastCheered) / MS_PER_DAY) : 999;
  if (daysSinceCheer >= 7 && !reason) { score += 2; reason = "uncheerred"; reasonLabel = "Needs a cheer"; ctaCopy = "Send Some Love"; }
  else if (daysSinceCheer >= 7) score += 2;

  if (daysSinceCheer >= 30 && logLen > 3 && !reason) {
    score += 1; reason = "inactive"; reasonLabel = "Reconnect"; ctaCopy = "Reach Out";
  }

  // Always include — fall back to a generic "tribe" reason so the strip never disappears
  if (!reason) { reason = "tribe"; reasonLabel = "In your tribe"; ctaCopy = "Say Hi"; }
  return { member: m, score, reason, reasonLabel, ctaCopy };
}

const REASON_STYLES: Record<SuggestionReason, { icon: React.ReactNode; accent: string }> = {
  birthday:   { icon: <Cake size={10} />,     accent: "text-brand-light bg-brand-light/10 border-brand-light/20" },
  streak:     { icon: <Flame size={10} />,    accent: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  new:        { icon: <Sparkles size={10} />, accent: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
  uncheerred: { icon: <Heart size={10} />,    accent: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  inactive:   { icon: <Heart size={10} />,    accent: "text-text-muted bg-surface-2 border-border" },
  tribe:      { icon: <Heart size={10} />,    accent: "text-brand-light bg-brand-light/10 border-brand-light/20" },
};

export default function TribeActivityStrip() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [tribe, setTribe] = useState<TribeMember[]>([]);
  const [cheeringFor, setCheeringFor] = useState<string | null>(null);
  const SENT_CHEERS_KEY = `well-sent-cheers-${user.email || ""}`;
  const [sentCheer, setSentCheer] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(SENT_CHEERS_KEY) || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/tribe?email=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : { tribe: [] }))
      .then((data) => setTribe(data.tribe || []))
      .catch(() => setTribe([]));
  }, [user.email]);

  const sendCheer = async (memberId: string, cheerId: string) => {
    if (!API_URL || !user.email) return;
    setCheeringFor(null);
    setSentCheer((prev) => {
      const next = { ...prev, [memberId]: true };
      try { localStorage.setItem(SENT_CHEERS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    try {
      await fetch(`${API_URL}/api/tribe/${memberId}/cheer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, cheerId }),
      });
    } catch { /* no-op */ }
  };

  if (tribe.length === 0) return null;

  const suggestions = [...tribe]
    .map(scoreMember)
    .filter((s): s is ScoredMember => s !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <div className="mb-6">
      <SectionHeader title="Your WELL Tribe" to="/tribe" />

      {/* Horizontal scrollable tiles */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {suggestions.map(({ member, reason, reasonLabel, ctaCopy }) => {
          const cfg = REASON_STYLES[reason];
          const isCheering = cheeringFor === member.id;
          const justSent = sentCheer[member.id];

          return (
            <div
              key={member.id}
              className="shrink-0 w-36 glass-card rounded-card p-3.5 flex flex-col items-center gap-2 border border-border text-center"
            >
              <Link to={`/member/${member.id}`} className="flex flex-col items-center gap-1.5 w-full">
                <Avatar
                  src={member.avatar || ""}
                  alt={member.name}
                  size={48}
                  badgeId={resolveFeaturedBadge(member)}
                  moodStatus={member.moodStatus}
                />
                <p className="text-xs font-semibold text-text truncate w-full">{member.name.split(" ")[0]}</p>
              </Link>

              {/* Reason chip */}
              <span className={`flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5 border ${cfg.accent}`}>
                {cfg.icon}
                <span className="truncate max-w-[72px]">{reasonLabel}</span>
              </span>

              {/* Action area */}
              {justSent ? (
                <div className="text-[11px] font-semibold text-text-dim border border-border rounded-pill px-2.5 py-1 w-full text-center opacity-60">
                  Cheer Sent
                </div>
              ) : isCheering ? (
                <div className="flex flex-wrap justify-center gap-1">
                  {TRIBE_CHEERS.slice(0, 4).map((cheer) => (
                    <button
                      key={cheer.id}
                      onClick={() => sendCheer(member.id, cheer.id)}
                      title={cheer.label}
                      className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs"
                    >
                      {cheer.emoji}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() =>
                    reason === "birthday"
                      ? navigate(`/member/${member.id}`)
                      : setCheeringFor(member.id)
                  }
                  className="text-[11px] font-semibold gradient-brand text-white rounded-pill px-2.5 py-1 w-full"
                >
                  {ctaCopy}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Link to="/tribe" className="block text-center text-xs text-text-muted mt-2.5">
        See all {tribe.length} tribe member{tribe.length === 1 ? "" : "s"}
      </Link>
    </div>
  );
}
