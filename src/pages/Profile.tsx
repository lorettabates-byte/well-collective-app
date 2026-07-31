import { Capacitor } from "@capacitor/core";
import { Activity, Bell, Bookmark, ChefHat, ChevronRight, Copy, Check, Crown, Dumbbell, Eye, EyeOff, Gift, Heart, HelpCircle, Loader2, LogOut, MessageCircle, Pencil, Phone, RefreshCw, Share2, ShieldCheck, SlidersHorizontal, Trash2, Trophy, Users, Watch, X } from "lucide-react";
import { openMemberLink } from "../utils/ssoLink";
import { initIAP, purchaseMembership } from "../utils/iap";

const isNative = Capacitor.isNativePlatform();
import { MOOD_STATUSES } from "../data/moods";
import SectionIntroModal from "../components/SectionIntroModal";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/ui/Avatar";
import TopBar from "../components/layout/TopBar";
import { getBadgeDef, resolveFeaturedBadge } from "../data/badges";
import { useApp } from "../store/AppContext";
import { useSectionTracking } from "../hooks/useSectionTracking";

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

type SectionId = "daily-plan" | "well-cup" | "weekly-theme" | "inspiration" | "events" | "tribe" | "community";

const LAYOUTS: { id: string; label: string; description: string; sectionOrder: SectionId[] }[] = [
  {
    id: "classic",
    label: "Classic",
    description: "All sections in your default order",
    sectionOrder: ["daily-plan", "well-cup", "weekly-theme", "inspiration", "events", "tribe", "community"],
  },
  {
    id: "focus",
    label: "Focus",
    description: "Your 4 chosen sections featured large — tap to customize",
    sectionOrder: ["daily-plan", "well-cup", "weekly-theme", "inspiration", "events", "tribe", "community"],
  },
  {
    id: "community",
    label: "Community",
    description: "Tribe activity and community threads front and center",
    sectionOrder: ["tribe", "community", "events", "weekly-theme", "inspiration", "daily-plan", "well-cup"],
  },
  {
    id: "exercise",
    label: "Exercise",
    description: "WELL Cup, daily plan, and events for workout accountability",
    sectionOrder: ["daily-plan", "well-cup", "events", "tribe", "inspiration", "weekly-theme", "community"],
  },
  {
    id: "nutrition",
    label: "Nutrition",
    description: "Daily plan and inspiration to stay on track with nourishment",
    sectionOrder: ["daily-plan", "inspiration", "well-cup", "weekly-theme", "events", "tribe", "community"],
  },
  {
    id: "inspire",
    label: "Inspire",
    description: "Inspiration and weekly theme rise to the top — spark something new",
    sectionOrder: ["inspiration", "weekly-theme", "daily-plan", "events", "tribe", "community", "well-cup"],
  },
  {
    id: "flow",
    label: "Flow",
    description: "Guided morning · afternoon · evening — structured calm",
    sectionOrder: ["daily-plan", "inspiration", "weekly-theme", "events", "tribe", "well-cup", "community"],
  },
  {
    id: "calm",
    label: "Calm",
    description: "Inspiration · breathwork · peaceful sounds — stress reduction focus",
    sectionOrder: ["inspiration", "weekly-theme", "daily-plan", "tribe", "events", "community", "well-cup"],
  },
];

// "dashboard" and "together" are legacy IDs — map them to their new equivalents
const LAYOUT_ID_ALIASES: Record<string, string> = {
  dashboard: "exercise",
  together: "community",
};

const GOAL_RECOMMENDED_LAYOUT: Record<string, string> = {
  stress:    "calm",
  energy:    "exercise",
  strength:  "exercise",
  weight:    "nutrition",
  rut:       "inspire",
  community: "community",
};

function LayoutPicker() {
  const { user } = useApp();
  const [current, setCurrent] = useState(() => {
    const saved = localStorage.getItem("well-home-layout") ?? "classic";
    return LAYOUT_ID_ALIASES[saved] ?? saved;
  });
  const recommended = user.goalPlan ? (GOAL_RECOMMENDED_LAYOUT[user.goalPlan] ?? null) : null;

  const selectLayout = (id: string, sectionOrder: SectionId[]) => {
    localStorage.setItem("well-home-layout", id);
    // Auto-set section order to match the layout's content priority
    // (Focus layout preserves whatever order the user already has)
    if (id !== "focus") {
      localStorage.setItem("well-section-order-v1", JSON.stringify(sectionOrder));
      window.dispatchEvent(new Event("well-section-order-changed"));
    }
    window.dispatchEvent(new Event("well-layout-changed"));
    setCurrent(id);
  };

  return (
    <div className="glass-card rounded-card px-4 py-3 mb-3">
      <p className="text-sm font-semibold text-text mb-1">Homepage Layout</p>
      {recommended && (
        <p className="text-[11px] text-text-dim mb-3">Based on your goal, we highlighted the best fit for you.</p>
      )}
      <div className="flex flex-col gap-2">
        {LAYOUTS.map(({ id, label, description, sectionOrder }) => {
          const isActive = current === id;
          const isRecommended = recommended === id;
          return (
            <button
              key={id}
              onClick={() => selectLayout(id, sectionOrder)}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                isActive
                  ? "gradient-brand text-white border-transparent shadow-glow"
                  : isRecommended
                  ? "bg-brand/10 border-brand-light/40 text-text"
                  : "bg-surface-2 border-border text-text"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold ${isActive ? "text-white" : "text-text"}`}>{label}</span>
                  {isRecommended && !isActive && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand-light/20 text-brand-light">For you</span>
                  )}
                  {isActive && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/20 text-white">Active</span>
                  )}
                </div>
                <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-white/80" : "text-text-dim"}`}>{description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Profile() {
  useSectionTracking("profile");
  const { user, inspirations, savedRecipes } = useApp();

  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [hiddenFromCommunity, setHiddenFromCommunity] = useState(false);
  const [tribeConnections, setTribeConnections] = useState<number | null>(null);
  const [addedByCount, setAddedByCount] = useState<number | null>(null);
  const [allTimePoints, setAllTimePoints] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState({ total: 0, conversions: 0 });
  const [copied, setCopied] = useState(false);
  const [activeMoodId, setActiveMoodId] = useState<string | null>(null);
  const [moodSaving, setMoodSaving] = useState(false);

  useEffect(() => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/members/me?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.member) return;
        if (d.member.showOnLeaderboard !== undefined) setShowOnLeaderboard(d.member.showOnLeaderboard);
        if (d.member.hiddenFromCommunity !== undefined) setHiddenFromCommunity(d.member.hiddenFromCommunity);
        if (d.member.tribeConnections !== undefined) setTribeConnections(d.member.tribeConnections);
        if (d.member.addedByCount !== undefined) setAddedByCount(d.member.addedByCount);
        if (d.member.allTimePoints !== undefined) setAllTimePoints(d.member.allTimePoints);
        if (d.member.moodStatus !== undefined) setActiveMoodId(d.member.moodStatus ?? null);
      })
      .catch(() => {});

    fetch(`${API_URL}/api/referrals/my-code?email=${encodeURIComponent(user.email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setReferralCode(d.code);
        setReferralStats({ total: d.totalReferrals, conversions: d.conversions });
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

  const toggleCommunityVisibility = async () => {
    const next = !hiddenFromCommunity;
    setHiddenFromCommunity(next);
    if (!API_URL || !user.email) return;
    await fetch(`${API_URL}/api/members/community-visibility`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, hiddenFromCommunity: next }),
    }).catch(() => {});
  };

  const handleRedoSurvey = () => {
    if (!user.email) return;
    const currentPeriod = new Date().toISOString().slice(0, 7);
    localStorage.removeItem(`well-goals-period-${user.email}-${currentPeriod}`);
    window.location.reload();
  };

  const savedCount = inspirations.filter((i) => i.savedBy.includes(user.id)).length;
  const featuredBadgeId = resolveFeaturedBadge(user);
  const featuredBadge = getBadgeDef(featuredBadgeId);

  const setMood = async (moodId: string | null) => {
    if (!API_URL || !user.email || moodSaving) return;
    const next = moodId === activeMoodId ? null : moodId;
    setMoodSaving(true);
    setActiveMoodId(next);
    await fetch(`${API_URL}/api/member/mood-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, moodStatusId: next }),
    }).catch(() => {});
    setMoodSaving(false);
  };

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!API_URL || !user.email) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`${API_URL}/api/members/self`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (!res.ok) throw new Error("Failed to delete account");
      // Clear all local data then reload to the login screen
      localStorage.clear();
      window.location.reload();
    } catch {
      setDeleteError("Something went wrong. Please try again or contact support.");
      setDeleting(false);
    }
  };

  return (
    <div>
      <TopBar title="" showBack />
      <SectionIntroModal sectionKey="profile" />

      {/* Gradient hero */}
      <div
        className="relative flex flex-col items-center text-center pt-10 pb-8 px-6"
        style={{ background: "linear-gradient(160deg, #0191CE 0%, #7c3aed 60%, #1e1b4b 100%)" }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-4 w-24 h-24 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />

        <div className="relative mb-3">
          <Avatar src={user.avatar} alt={user.name} size={96} ring badgeId={featuredBadgeId} moodStatus={activeMoodId} />
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">{user.name}</h1>
          {user.isAdmin && (
            <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white rounded-pill px-2 py-0.5">
              Admin
            </span>
          )}
        </div>
        {featuredBadge && (
          <p className="text-xs font-semibold text-white/70 mt-0.5">
            {featuredBadge.icon} {featuredBadge.label}
          </p>
        )}
        {user.bio && (
          <p className="text-sm text-white/60 mt-2 max-w-xs leading-snug">{user.bio}</p>
        )}

        {/* Stats strip */}
        <div className="flex items-center gap-0 mt-5 bg-white/10 rounded-2xl overflow-hidden border border-white/10 w-full max-w-xs">
          <div className="flex-1 flex flex-col items-center py-3 px-2">
            <Users size={15} className="text-blue-200 mb-1" />
            <p className="text-base font-bold text-white">{tribeConnections ?? "—"}</p>
            <p className="text-[10px] text-white/55 uppercase tracking-wide">Tribe</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div className="flex-1 flex flex-col items-center py-3 px-2">
            <Heart size={15} className="text-pink-300 mb-1" />
            <p className="text-base font-bold text-white">{addedByCount ?? "—"}</p>
            <p className="text-[10px] text-white/55 uppercase tracking-wide">Added By</p>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div className="flex-1 flex flex-col items-center py-3 px-2">
            <Trophy size={15} className="text-yellow-300 mb-1" />
            <p className="text-base font-bold text-white">{allTimePoints !== null ? allTimePoints.toLocaleString() : "—"}</p>
            <p className="text-[10px] text-white/55 uppercase tracking-wide">Points</p>
          </div>
        </div>

        <Link
          to="/profile/edit"
          className="flex items-center gap-1.5 mt-5 text-xs font-semibold bg-white/15 border border-white/25 text-white rounded-pill px-5 py-2"
        >
          <Pencil size={13} />
          Edit Profile
        </Link>
      </div>

    <div className="px-4 pt-4">

      {/* Mood status */}
      <div className="glass-card rounded-card p-4 mb-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-text">How are you feeling today?</p>
            <p className="text-[11px] text-text-muted">Visible to your tribe members for 24 hours</p>
          </div>
          {activeMoodId && (
            <button
              onClick={() => setMood(null)}
              className="w-6 h-6 rounded-full bg-surface-2 border border-border flex items-center justify-center"
              aria-label="Clear mood status"
            >
              <X size={12} className="text-text-dim" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => activeMoodId && setMood(null)}
            disabled={moodSaving}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold border transition-all ${
              !activeMoodId
                ? "bg-surface-3 border-brand-light/40 text-brand-light shadow-sm"
                : "glass-card border-border text-text-muted"
            }`}
          >
            None
          </button>
          {MOOD_STATUSES.map((mood) => {
            const isActive = activeMoodId === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => setMood(mood.id)}
                disabled={moodSaving}
                className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold border transition-all ${
                  isActive
                    ? "text-white border-transparent shadow-sm"
                    : "glass-card border-border text-text-muted"
                }`}
                style={isActive ? { background: mood.color } : undefined}
                title={mood.description}
              >
                <span>{mood.emoji}</span>
                {mood.label}
              </button>
            );
          })}
        </div>
      </div>


      {referralCode && (
        <div className="glass-card rounded-card p-4 mb-4 border border-brand-light/20">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={18} className="text-brand-light" />
            <h3 className="text-sm font-bold text-text">Invite friends, earn rewards</h3>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Share your code — friends get a <span className="text-brand-light font-semibold">1-month free trial</span> and you earn <span className="text-brand-light font-semibold">25 points</span>. If they subscribe, you both get <span className="text-brand-light font-semibold">50 points</span>!
          </p>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-surface-1 border border-border rounded-lg px-3 py-2.5 text-center">
              <span className="text-sm font-bold tracking-wider text-brand-light">{referralCode}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralCode).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }).catch(() => {});
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-2 border border-border"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-text-muted" />}
            </button>
            <button
              onClick={() => {
                const text = `Join me on WELL Collective! Use my code ${referralCode} for a FREE 1-month trial. Download: https://app.lorettabates.com`;
                if (navigator.share) {
                  navigator.share({ text }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }).catch(() => {});
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg gradient-brand"
            >
              <Share2 size={16} className="text-white" />
            </button>
          </div>
          {referralStats.total > 0 && (
            <div className="flex gap-4 text-xs text-text-muted">
              <span>{referralStats.total} friend{referralStats.total !== 1 ? "s" : ""} invited</span>
              {referralStats.conversions > 0 && (
                <span>{referralStats.conversions} converted</span>
              )}
            </div>
          )}
        </div>
      )}

      <Link
        to="/well-check"
        className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5 mb-4"
      >
        <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center shrink-0">
          <Activity size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">Daily WELL Check</p>
          <p className="text-xs text-text-muted">Your progress + tomorrow's challenges</p>
        </div>
        <ChevronRight size={16} className="text-text-dim shrink-0" />
      </Link>

      <div className="flex flex-col gap-2.5 mb-6">
        {!!localStorage.getItem("memberTrialEndsAt") && (
          <button
            disabled={upgrading}
            onClick={async () => {
              if (isNative) {
                setUpgrading(true);
                try {
                  await initIAP(user.email ?? "");
                  await purchaseMembership();
                } finally {
                  setUpgrading(false);
                }
              } else {
                openMemberLink(
                  "https://lorettabates.com/videolibrary.lorettabates.com/checkout-page/?lid=4",
                  user.email
                );
              }
            }}
            className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5 text-left disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-full gradient-brand shadow-glow flex items-center justify-center shrink-0">
              {upgrading ? <Loader2 size={16} className="text-white animate-spin" /> : <Crown size={16} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">Upgrade to Full Membership</p>
              <p className="text-xs text-text-muted">Keep everything after your trial ends</p>
            </div>
            <ChevronRight size={16} className="text-text-dim shrink-0" />
          </button>
        )}
        <MenuRow icon={<Users size={16} />} label="WELL Tribe" to="/tribe" />
        <MenuRow icon={<Bell size={16} />} label="Notifications" to="/notifications" />
        <MenuRow icon={<SlidersHorizontal size={16} />} label="Notification Settings" to="/profile/notifications" />
        <MenuRow icon={<Watch size={16} />} label="Health Sync" to="/profile/health-sync" />
        <MenuRow icon={<HelpCircle size={16} />} label="Help & FAQ" to="/profile/help" />
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

      {/* Community visibility */}
      <button
        onClick={toggleCommunityVisibility}
        className="w-full flex items-center gap-3 glass-card rounded-card px-4 py-3 mb-3"
      >
        <Users size={16} className="text-brand-light shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-text">Community Visibility</p>
          <p className="text-xs text-text-muted">
            {hiddenFromCommunity ? "You're hidden from member lists & discovery" : "You appear in community member lists"}
          </p>
        </div>
        {hiddenFromCommunity
          ? <EyeOff size={16} className="text-text-dim shrink-0" />
          : <Eye size={16} className="text-brand-light shrink-0" />}
      </button>

      {/* Redo goals survey */}
      <button
        onClick={handleRedoSurvey}
        className="w-full flex items-center gap-3 glass-card rounded-card px-4 py-3 mb-3"
      >
        <RefreshCw size={16} className="text-brand-light shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-text">Redo Goals Survey</p>
          <p className="text-xs text-text-muted">Update your goals and personalized plan</p>
        </div>
        <ChevronRight size={16} className="text-text-dim shrink-0" />
      </button>

      {/* Contact Loretta */}
      <a
        href="sms:+17863093356"
        className="w-full flex items-center gap-3 glass-card rounded-card px-4 py-3 mb-3"
      >
        <Phone size={16} className="text-brand-light shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-text">Contact Loretta</p>
          <p className="text-xs text-text-muted">Send a text message directly</p>
        </div>
        <MessageCircle size={16} className="text-text-dim shrink-0" />
      </a>

      {/* Homepage Layout Picker */}
      <LayoutPicker />

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-400 border border-red-400/30 rounded-pill py-3"
      >
        <LogOut size={16} />
        Log Out
      </button>

      <button
        onClick={() => { setShowDeleteConfirm(true); setDeleteInput(""); setDeleteError(""); }}
        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-text-dim mt-2 mb-6 py-2"
      >
        <Trash2 size={13} />
        Delete Account
      </button>
    </div>

    {/* Delete account confirmation modal */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
        <div className="w-full max-w-sm glass-card rounded-card p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-text">Delete Account</p>
              <p className="text-xs text-text-muted mt-1">This permanently deletes your account and all your data. This cannot be undone.</p>
            </div>
            <button onClick={() => setShowDeleteConfirm(false)} className="text-text-dim shrink-0 mt-0.5">
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-text-muted">Type <span className="text-red-400 font-bold">DELETE</span> to confirm</p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-red-400"
            />
          </div>
          {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
          <button
            onClick={handleDeleteAccount}
            disabled={deleteInput !== "DELETE" || deleting}
            className="w-full py-2.5 rounded-pill text-sm font-bold bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting…" : "Permanently Delete My Account"}
          </button>
        </div>
      </div>
    )}
    </div>
  );
}
