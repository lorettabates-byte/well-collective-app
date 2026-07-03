import { Bell, Bookmark, ChefHat, ChevronRight, Dumbbell, Eye, EyeOff, LogOut, Pencil, ShieldCheck, SlidersHorizontal, Trophy, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/ui/Avatar";
import DailyWellCheck from "../components/DailyWellCheck";
import { getBadgeDef, resolveFeaturedBadge } from "../data/badges";
import { useApp } from "../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function MenuRow({
  icon,
  label,
  to,
  badge,
}: {
  icon: ReactNode;
  label: string;
  to: string;
  badge?: number;
}) {
  return (
    <Link to={to} className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5">
      <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-brand-light">
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium text-text">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[11px] font-bold bg-surface-3 text-brand-light rounded-pill px-2 py-0.5">
          {badge}
        </span>
      )}
      <ChevronRight size={16} className="text-text-dim" />
    </Link>
  );
}

export default function Profile() {
  const { user, inspirations, savedRecipes } = useApp();

  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [tribeConnections, setTribeConnections] = useState<number | null>(null);
  const [addedByCount, setAddedByCount] = useState<number | null>(null);
  const [allTimePoints, setAllTimePoints] = useState<number | null>(null);

  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/members/me?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.member) return;
        if (d.member.showOnLeaderboard !== undefined) setShowOnLeaderboard(d.member.showOnLeaderboard);
        if (d.member.tribeConnections !== undefined) setTribeConnections(d.member.tribeConnections);
        if (d.member.addedByCount !== undefined) setAddedByCount(d.member.addedByCount);
        if (d.member.allTimePoints !== undefined) setAllTimePoints(d.member.allTimePoints);
      })
      .catch(() => {});
  }, [user.email]);

  const toggleLeaderboard = async () => {
    const next = !showOnLeaderboard;
    setShowOnLeaderboard(next);
    if (!API_URL || !user.email) return;
    await fetch(`${API_URL}/api/members/leaderboard-visibility`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, showOnLeaderboard: next }),
    }).catch(() => {});
  };

  const savedCount = inspirations.filter((i) => i.savedBy.includes(user.id)).length;
  const featuredBadgeId = resolveFeaturedBadge(user);
  const featuredBadge = getBadgeDef(featuredBadgeId);

  const handleLogout = () => {
    localStorage.removeItem("memberToken");
    localStorage.removeItem("memberUser");
    localStorage.removeItem("memberTrialEndsAt");
    localStorage.removeItem("memberMembershipStatus");
    localStorage.removeItem("memberProfileSyncedEmail");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("admin");
    window.location.reload();
  };

  return (
    <div className="px-4 pt-6">
      <div className="flex flex-col items-center text-center mb-6">
        <Avatar src={user.avatar} alt={user.name} size={84} ring badgeId={featuredBadgeId} />
        <div className="flex items-center gap-2 mt-3">
          <h1 className="text-lg font-bold text-text">{user.name}</h1>
          {user.isAdmin && (
            <span className="text-[10px] font-bold uppercase tracking-wide gradient-brand text-white rounded-pill px-2 py-0.5">
              Admin
            </span>
          )}
        </div>
        {featuredBadge && (
          <p className="text-xs font-semibold text-brand-light mt-1">
            {featuredBadge.icon} {featuredBadge.label}
          </p>
        )}
        <p className="text-sm text-text-muted mt-1 max-w-xs">{user.bio}</p>
        <Link
          to="/profile/edit"
          className="flex items-center gap-1.5 mt-4 text-xs font-semibold gradient-brand text-white rounded-pill px-4 py-2 shadow-glow"
        >
          <Pencil size={13} />
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-card p-3 text-center">
          <p className="text-lg font-bold text-text">{tribeConnections ?? "—"}</p>
          <p className="text-[11px] text-text-muted leading-tight">Tribe Connections</p>
        </div>
        <div className="glass-card rounded-card p-3 text-center">
          <p className="text-lg font-bold text-text">{addedByCount ?? "—"}</p>
          <p className="text-[11px] text-text-muted leading-tight">Added By</p>
        </div>
        <div className="glass-card rounded-card p-3 text-center">
          <p className="text-lg font-bold text-text">{allTimePoints !== null ? allTimePoints.toLocaleString() : "—"}</p>
          <p className="text-[11px] text-text-muted leading-tight">Total Points</p>
        </div>
      </div>

      {user.email && <DailyWellCheck email={user.email} />}

      <div className="flex flex-col gap-2.5 mb-6">
        <MenuRow icon={<Users size={16} />} label="WELL Tribe" to="/tribe" />
        <MenuRow icon={<Bell size={16} />} label="Notifications" to="/notifications" />
        <MenuRow icon={<SlidersHorizontal size={16} />} label="Notification Settings" to="/profile/notifications" />
        <MenuRow icon={<Bookmark size={16} />} label="Saved Inspirations" to="/inspirations?filter=saved" badge={savedCount} />
        <MenuRow
          icon={<Dumbbell size={16} />}
          label="Saved Workouts"
          to="/wellness?view=saved"
          badge={user.savedWorkouts?.length}
        />
        <MenuRow
          icon={<ChefHat size={16} />}
          label="Saved Recipes"
          to="/nutrition?view=saved"
          badge={savedRecipes.length}
        />
        {user.isAdmin && <MenuRow icon={<ShieldCheck size={16} />} label="Admin Panel" to="/admin" />}
      </div>

      {/* WELL CUP leaderboard visibility */}
      <button
        onClick={toggleLeaderboard}
        className="w-full flex items-center gap-3 glass-card rounded-card px-4 py-3 mb-3"
      >
        <Trophy size={16} className="text-yellow-400 shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-text">WELL Cup Leaderboard</p>
          <p className="text-xs text-text-muted">{showOnLeaderboard ? "You're visible to the community" : "You're hidden from the leaderboard"}</p>
        </div>
        {showOnLeaderboard
          ? <Eye size={16} className="text-brand-light shrink-0" />
          : <EyeOff size={16} className="text-text-dim shrink-0" />}
      </button>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-400 border border-red-400/30 rounded-pill py-3 mb-4"
      >
        <LogOut size={16} />
        Log Out
      </button>
    </div>
  );
}
