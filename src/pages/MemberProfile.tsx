import { Award, Cake, Flame, Loader2, MessageCircle, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import { getBadgeDef, resolveFeaturedBadge } from "../data/badges";
import { computeStreak } from "../utils/streaks";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface MemberProfileData {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  birthday?: string;
  workoutLog: string[];
  levelBadge?: string;
  bonusBadges?: string[];
  grantedBadges?: string[];
  featuredBadge?: string;
  tribeConnections: number;
}

function formatBirthday(birthday: string): string {
  const [month, day] = birthday.split("-").map(Number);
  return new Date(2000, month - 1, day).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export default function MemberProfile() {
  const { memberId } = useParams<{ memberId: string }>();
  const [member, setMember] = useState<MemberProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!API_URL || !memberId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    fetch(`${API_URL}/api/members/${memberId}/profile`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setMember(data.member))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) {
    return (
      <div>
        <TopBar title="Profile" showBack />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-brand-light animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !member) {
    return (
      <div>
        <TopBar title="Profile" showBack />
        <p className="text-sm text-text-muted text-center py-12">This member couldn't be found.</p>
      </div>
    );
  }

  const featuredBadgeId = resolveFeaturedBadge(member);
  const featuredBadge = getBadgeDef(featuredBadgeId);
  const streak = computeStreak(member.workoutLog);
  const earnedBadgeIds = [
    member.levelBadge,
    ...(member.bonusBadges ?? []),
    ...(member.grantedBadges ?? []),
  ].filter(Boolean) as string[];

  return (
    <div>
      <TopBar title={member.name} showBack />
      <div className="px-4 pt-6">
        <div className="flex flex-col items-center text-center mb-6">
          <Avatar src={member.avatar || ""} alt={member.name} size={84} ring badgeId={featuredBadgeId} />
          <h1 className="text-lg font-bold text-text mt-3">{member.name}</h1>
          {featuredBadge && (
            <p className="text-xs font-semibold text-brand-light mt-1">
              {featuredBadge.icon} {featuredBadge.label}
            </p>
          )}
          {member.bio && <p className="text-sm text-text-muted mt-1 max-w-xs">{member.bio}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-card rounded-card p-3 text-center">
            <Flame size={16} className="text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-text">{streak}</p>
            <p className="text-[11px] text-text-muted">Day Streak</p>
          </div>
          <div className="glass-card rounded-card p-3 text-center">
            <Users size={16} className="text-brand-light mx-auto mb-1" />
            <p className="text-lg font-bold text-text">{member.tribeConnections}</p>
            <p className="text-[11px] text-text-muted">Tribe Connections</p>
          </div>
          <div className="glass-card rounded-card p-3 text-center">
            <Trophy size={16} className="text-brand-light mx-auto mb-1" />
            <p className="text-lg font-bold text-text">{earnedBadgeIds.length}</p>
            <p className="text-[11px] text-text-muted">Badges Earned</p>
          </div>
        </div>

        {member.birthday && (
          <div className="glass-card rounded-card p-4 flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
              <Cake size={18} className="text-brand-light" />
            </div>
            <div>
              <p className="text-sm font-bold text-text">Birthday</p>
              <p className="text-xs text-text-muted">{formatBirthday(member.birthday)}</p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-sm font-bold text-text mb-3">Badges</h2>
          {earnedBadgeIds.length === 0 ? (
            <div className="glass-card rounded-card p-4 flex items-center gap-3">
              <Award size={18} className="text-text-dim shrink-0" />
              <p className="text-xs text-text-muted">No badges earned yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {earnedBadgeIds.map((id) => {
                const badge = getBadgeDef(id);
                if (!badge) return null;
                return (
                  <div key={id} className="glass-card rounded-card p-3 flex flex-col items-center gap-1.5 text-center">
                    <span className="text-lg leading-none">{badge.icon}</span>
                    <p className="text-[10px] font-semibold text-text leading-tight">{badge.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-text-dim justify-center mb-6">
          <MessageCircle size={13} />
          <span>Message them from WELL Tribe or the community to connect.</span>
        </div>
      </div>
    </div>
  );
}
