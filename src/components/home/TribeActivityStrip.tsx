import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  levelBadge?: string;
  bonusBadges?: string[];
  grantedBadges?: string[];
  featuredBadge?: string;
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

export default function TribeActivityStrip() {
  const { user } = useApp();
  const [tribe, setTribe] = useState<TribeMember[]>([]);
  const [cheeringFor, setCheeringFor] = useState<string | null>(null);
  const [sentCheer, setSentCheer] = useState<Record<string, string>>({});

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
    setSentCheer((prev) => ({ ...prev, [memberId]: cheerId }));
    try {
      await fetch(`${API_URL}/api/tribe/${memberId}/cheer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, cheerId }),
      });
    } catch {
      // no-op — the optimistic "sent" state just won't be backed by a real send
    }
    setTimeout(() => setSentCheer((prev) => ({ ...prev, [memberId]: "" })), 2500);
  };

  if (tribe.length === 0) return null;

  return (
    <div className="mb-6">
      <SectionHeader title="Your WELL Tribe" to="/tribe" />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {tribe.map((member) => {
          const streak = computeStreak(member.workoutLog || []);
          const birthdayDays = member.birthday ? daysUntilBirthday(member.birthday) : null;
          const isCheering = cheeringFor === member.id;
          const justSent = sentCheer[member.id];

          return (
            <div key={member.id} className="glass-card rounded-card p-3 w-40 shrink-0 flex flex-col items-center text-center gap-2">
              <Avatar src={member.avatar || ""} alt={member.name} size={48} badgeId={resolveFeaturedBadge(member)} />
              <p className="text-sm font-semibold text-text truncate w-full">{member.name}</p>

              <div className="flex flex-col items-center gap-1 min-h-[2.25rem]">
                {birthdayDays !== null && birthdayDays <= 7 && (
                  <span className="text-[11px] font-medium text-brand-light">
                    🎂 {birthdayDays === 0 ? "Birthday today!" : `Birthday in ${birthdayDays}d`}
                  </span>
                )}
                {streak > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
                    <Flame size={12} className="text-brand-light" />
                    {streak}-day streak
                  </span>
                )}
              </div>

              {justSent ? (
                <p className="text-[11px] font-semibold text-brand-light py-1.5">Cheer sent! 🎉</p>
              ) : isCheering ? (
                <div className="flex items-center gap-1">
                  {TRIBE_CHEERS.map((cheer) => (
                    <button
                      key={cheer.id}
                      onClick={() => sendCheer(member.id, cheer.id)}
                      title={cheer.label}
                      aria-label={`Send ${cheer.label} cheer to ${member.name}`}
                      className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-base"
                    >
                      {cheer.emoji}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setCheeringFor(member.id)}
                  className="text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-1.5 w-full"
                >
                  Send a Cheer
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Link to="/tribe" className="block text-center text-xs text-text-muted mt-2">
        Manage your WELL Tribe
      </Link>
    </div>
  );
}
