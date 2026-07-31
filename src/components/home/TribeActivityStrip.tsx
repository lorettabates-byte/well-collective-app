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
  else if (logLen <= 3 && !reason) { score += 2; reason = "new"; reasonLabel = "Just started"; ctaCopy = "Encourage"; }
  else if (logLen === 0) score += 4;
  else if (logLen <= 3) score += 2;

  const lastCheered = m.lastCheeredAt ? new Date(m.lastCheeredAt).getTime() : 0;
  const daysSinceCheer = lastCheered ? Math.floor((Date.now() - lastCheered) / MS_PER_DAY) : 999;
  if (daysSinceCheer >= 7 && !reason) { score += 2; reason = "uncheerred"; reasonLabel = "Needs a cheer"; ctaCopy = "Send Love"; }
  else if (daysSinceCheer >= 7) score += 2;

  if (daysSinceCheer >= 30 && logLen > 3 && !reason) {
    score += 1; reason = "inactive"; reasonLabel = "Reconnect"; ctaCopy = "Reach Out";
  }

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

interface Props {
  grid?: boolean;
  maxCount?: number;
}

export default function TribeActivityStrip({ grid = false, maxCount }: Props) {
  const { user } = useApp();
  const navigate = useNavigate();
  const [tribe, setTribe] = useState<TribeMember[]>([]);
  const [cheeringFor, setCheeringFor] = useState<string | null>(null);
  const [cheerNote, setCheerNote] = useState("");
  // Load welcomed members AFTER user.email is available to ensure the correct localStorage key
  const [welcomedMembers, setWelcomedMembers] = useState<Record<string, boolean>>({});
  const [recentlySent, setRecentlySent] = useState<string | null>(null);

  useEffect(() => {
    if (!user.email) return;
    const key = `well-welcomed-${user.email}`;
    try {
      setWelcomedMembers(JSON.parse(localStorage.getItem(key) || "{}"));
    } catch { /* ignore */ }
  }, [user.email]);

  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/tribe?email=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : { tribe: [] }))
      .then((data) => setTribe(data.tribe || []))
      .catch(() => setTribe([]));
  }, [user.email]);

  const sendCheer = async (memberId: string, cheerId: string, isWelcome: boolean, note?: string) => {
    if (!API_URL || !user.email) return;
    setCheeringFor(null);
    setCheerNote("");
    if (isWelcome) {
      const key = `well-welcomed-${user.email}`;
      setWelcomedMembers((prev) => {
        const next = { ...prev, [memberId]: true };
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    } else {
      setRecentlySent(memberId);
      setTimeout(() => setRecentlySent(null), 2500);
    }
    try {
      await fetch(`${API_URL}/api/tribe/${memberId}/cheer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, cheerId, note: note || undefined }),
      });
    } catch { /* no-op */ }
  };

  if (tribe.length === 0) return null;

  const limit = maxCount ?? (grid ? 9 : 6);
  const suggestions = [...tribe]
    .map(scoreMember)
    .filter((s): s is ScoredMember => s !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const renderTile = ({ member, reason, reasonLabel, ctaCopy }: ScoredMember, compact = false) => {
    const cfg = REASON_STYLES[reason];
    const isCheering = cheeringFor === member.id;
    const isWelcome = ctaCopy === "Say Welcome";
    const alreadyWelcomed = isWelcome && !!welcomedMembers[member.id];
    const justSentOther = !isWelcome && recentlySent === member.id;
    const firstName = member.name.split(" ")[0];

    return (
      <div
        key={member.id}
        className={`glass-card rounded-card flex flex-col items-center border border-border text-center ${compact ? "p-2.5 gap-2" : "p-3.5 gap-2"}`}
      >
        <Link to={`/member/${member.id}`} className="flex flex-col items-center gap-1.5 w-full">
          <Avatar
            src={member.avatar || ""}
            alt={member.name}
            size={compact ? 40 : 48}
            badgeId={resolveFeaturedBadge(member)}
            moodStatus={member.moodStatus}
          />
          <p className="text-xs font-semibold text-text truncate w-full">{firstName}</p>
        </Link>

        <span className={`flex items-center gap-0.5 font-semibold rounded-full border ${cfg.accent} ${compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"}`}>
          {cfg.icon}
          <span className="truncate max-w-[60px]">{reasonLabel}</span>
        </span>

        {alreadyWelcomed ? (
          <div className="text-xs font-semibold text-text-dim border border-border rounded-pill text-center opacity-60 w-full px-2 py-1">
            Welcomed
          </div>
        ) : justSentOther ? (
          <div className="text-xs font-semibold text-brand-light text-center w-full py-1">
            Sent!
          </div>
        ) : isCheering ? (
          <div className="w-full">
            <input
              type="text"
              value={cheerNote}
              onChange={(e) => setCheerNote(e.target.value)}
              placeholder="Note (optional)"
              className="w-full bg-surface-2 border border-border rounded-pill px-2.5 py-1 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue mb-1.5"
            />
            <div className="flex flex-wrap justify-center gap-1">
              {TRIBE_CHEERS.slice(0, compact ? 4 : 4).map((cheer) => (
                <button
                  key={cheer.id}
                  onClick={() => sendCheer(member.id, cheer.id, isWelcome, cheerNote)}
                  title={cheer.label}
                  className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-sm"
                >
                  {cheer.emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              if (reason === "birthday") { navigate(`/member/${member.id}`); return; }
              setCheeringFor(member.id);
              setCheerNote("");
            }}
            className="text-xs font-semibold gradient-brand text-white rounded-pill w-full px-2 py-1.5"
          >
            {ctaCopy}
          </button>
        )}
      </div>
    );
  };

  if (grid) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-text">Your WELL Tribe</p>
            <p className="text-[11px] text-text-muted">Send a cheer to someone in your circle</p>
          </div>
          <Link to="/tribe" className="text-xs text-brand-light font-semibold">
            Manage →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {suggestions.map((s) => renderTile(s, true))}
        </div>
        {tribe.length > limit && (
          <Link to="/tribe" className="block text-center text-xs text-text-muted mt-2.5">
            +{tribe.length - limit} more in your tribe
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <SectionHeader title="Your WELL Tribe" to="/tribe" />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {suggestions.map((s) => (
          <div key={s.member.id} className="shrink-0 w-36">
            {renderTile(s, false)}
          </div>
        ))}
      </div>
      <Link to="/tribe" className="block text-center text-xs text-text-muted mt-2.5">
        See all {tribe.length} tribe member{tribe.length === 1 ? "" : "s"}
      </Link>
    </div>
  );
}
