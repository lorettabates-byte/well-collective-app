import {
  Award, Cake, Calendar, Check, ChevronDown, ChevronUp, Flame, Heart, HelpCircle,
  Loader2, MessageCircle, ShieldOff, Sparkles, Trophy, UserMinus, UserPlus, Users, Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import CardSender from "../components/tribe/CardSender";
import ChallengeInvite from "../components/tribe/ChallengeInvite";
import EventInvite from "../components/tribe/EventInvite";
import { getBadgeDef, resolveFeaturedBadge } from "../data/badges";
import { TRIBE_CHEERS, BIRTHDAY_CHEER_ID } from "../data/cheers";
import { birthdayDateForYear } from "../utils/birthday";
import { computeStreak } from "../utils/streaks";
import { useApp } from "../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

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
  moodStatus?: string | null;
}

function formatBirthday(birthday: string): string {
  const [month, day] = birthday.split("-").map(Number);
  return new Date(2000, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function daysUntilBirthday(birthday: string): number {
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(`${todayStr}T00:00:00`);
  const next = new Date(`${birthdayDateForYear(birthday, today.getFullYear())}T00:00:00`);
  let diff = Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
  if (diff < 0) {
    const nextYear = new Date(
      `${birthdayDateForYear(birthday, today.getFullYear() + 1)}T00:00:00`
    );
    diff = Math.round((nextYear.getTime() - today.getTime()) / MS_PER_DAY);
  }
  return diff;
}

// Badge-tile accent palettes (cycles through 4 colors)
const BADGE_ACCENTS = [
  "bg-brand-light/15 text-brand-light border-brand-light/20",
  "bg-violet-400/15 text-violet-400 border-violet-400/20",
  "bg-orange-400/15 text-orange-400 border-orange-400/20",
  "bg-emerald-400/15 text-emerald-400 border-emerald-400/20",
];

export default function MemberProfile() {
  const { memberId } = useParams<{ memberId: string }>();
  const { user, blockedUserIds, blockUser, unblockUser } = useApp();
  const [member, setMember] = useState<MemberProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const [inTribe, setInTribe] = useState(false);
  const [tribeLoading, setTribeLoading] = useState(false);

  const [showCheerPicker, setShowCheerPicker] = useState(false);
  const [cheerSent, setCheerSent] = useState("");
  const WELCOMED_KEY = `well-welcomed-${user.email || ""}`;
  const [welcomedMembers, setWelcomedMembers] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(WELCOMED_KEY) || "{}"); } catch { return {}; }
  });

  const [birthdayCelebrated, setBirthdayCelebrated] = useState(false);

  const [showCardSender, setShowCardSender] = useState(false);
  const [cardOccasion, setCardOccasion] = useState("birthday");
  const [showChallenge, setShowChallenge] = useState(false);
  const [showEventInvite, setShowEventInvite] = useState(false);
  const [showCheerInfo, setShowCheerInfo] = useState(false);

  const isBlocked = memberId ? blockedUserIds.includes(memberId) : false;

  useEffect(() => {
    if (!API_URL || !memberId) { setLoading(false); return; }
    setLoading(true);
    setNotFound(false);
    Promise.all([
      fetch(`${API_URL}/api/members/${memberId}/profile`).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      user.email
        ? fetch(`${API_URL}/api/tribe?email=${encodeURIComponent(user.email)}`).then(
            (r) => (r.ok ? r.json() : { tribe: [] })
          )
        : Promise.resolve({ tribe: [] }),
    ])
      .then(([profileData, tribeData]) => {
        setMember(profileData.member);
        const tribeIds = new Set(
          (tribeData.tribe || []).map((m: { id: string }) => m.id)
        );
        setInTribe(tribeIds.has(memberId!));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [memberId, user.email]);

  const handleToggleTribe = async () => {
    if (!API_URL || !user.email || !memberId) return;
    setTribeLoading(true);
    try {
      if (inTribe) {
        await fetch(
          `${API_URL}/api/tribe/${memberId}?email=${encodeURIComponent(user.email)}`,
          { method: "DELETE" }
        );
        setInTribe(false);
      } else {
        await fetch(`${API_URL}/api/tribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, memberId }),
        });
        setInTribe(true);
      }
    } catch { /* no-op */ } finally { setTribeLoading(false); }
  };

  const handleSendCheer = async (cheerId: string) => {
    if (!API_URL || !user.email || !memberId) return;
    setShowCheerPicker(false);
    setCheerSent(cheerId);
    const isNewMember = (member?.workoutLog?.length ?? 0) === 0;
    if (isNewMember) {
      setWelcomedMembers((prev) => {
        const next = { ...prev, [memberId]: true };
        try { localStorage.setItem(WELCOMED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    } else {
      setTimeout(() => setCheerSent(""), 2500);
    }
    try {
      await fetch(`${API_URL}/api/tribe/${memberId}/cheer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, cheerId }),
      });
    } catch { /* no-op */ }
  };

  const handleCelebrateBirthday = async () => {
    setBirthdayCelebrated(true);
    await handleSendCheer(BIRTHDAY_CHEER_ID);
  };

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
        <p className="text-sm text-text-muted text-center py-12">
          This member couldn't be found.
        </p>
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

  const bdayDays = member.birthday ? daysUntilBirthday(member.birthday) : null;
  const isBirthdaySoon = bdayDays !== null && bdayDays <= 7;
  const isBirthdayToday = bdayDays === 0;

  return (
    <>
      <div className="pb-8">
        <TopBar title="" showBack />

        {/* Full-bleed gradient hero */}
        <div
          className="relative flex flex-col items-center text-center pt-14 pb-8 px-6"
          style={{
            background: "linear-gradient(160deg, #0191CE 0%, #7c3aed 60%, #1e1b4b 100%)",
          }}
        >
          {/* Subtle orb decorations */}
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 left-4 w-24 h-24 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }}
          />

          {/* Avatar with mood ring */}
          <div className="relative mb-3">
            <Avatar
              src={member.avatar || ""}
              alt={member.name}
              size={96}
              ring
              badgeId={featuredBadgeId}
              moodStatus={inTribe ? member.moodStatus : undefined}
            />
          </div>

          <h1 className="text-xl font-bold text-white">{member.name}</h1>
          {featuredBadge && (
            <p className="text-xs font-semibold text-white/70 mt-0.5">
              {featuredBadge.icon} {featuredBadge.label}
            </p>
          )}
          {member.bio && (
            <p className="text-sm text-white/60 mt-2 max-w-xs leading-snug">
              {member.bio}
            </p>
          )}

          {/* Stats strip */}
          <div className="flex items-center gap-0 mt-5 bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            <div className="flex-1 flex flex-col items-center py-3 px-4">
              <Flame size={16} className="text-orange-300 mb-1" />
              <p className="text-base font-bold text-white">{streak}</p>
              <p className="text-[10px] text-white/55 uppercase tracking-wide">Streak</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div className="flex-1 flex flex-col items-center py-3 px-4">
              <Users size={16} className="text-blue-200 mb-1" />
              <p className="text-base font-bold text-white">{member.tribeConnections}</p>
              <p className="text-[10px] text-white/55 uppercase tracking-wide">Tribe</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div className="flex-1 flex flex-col items-center py-3 px-4">
              <Trophy size={16} className="text-yellow-300 mb-1" />
              <p className="text-base font-bold text-white">{earnedBadgeIds.length}</p>
              <p className="text-[10px] text-white/55 uppercase tracking-wide">Badges</p>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="px-4 -mt-4">

          {/* Primary actions card */}
          <div className="glass-card rounded-2xl border border-border p-4 mb-4 shadow-xl">
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <button
                onClick={handleToggleTribe}
                disabled={tribeLoading}
                className={`flex items-center justify-center gap-2 rounded-pill py-2.5 text-sm font-semibold transition-opacity ${
                  inTribe
                    ? "bg-surface-2 border border-border text-text-muted"
                    : "gradient-brand text-white shadow-glow"
                } ${tribeLoading ? "opacity-50" : ""}`}
              >
                {inTribe ? <UserMinus size={15} /> : <UserPlus size={15} />}
                {inTribe ? "In Your Tribe" : "Add to Tribe"}
              </button>

              {memberId && (member?.workoutLog?.length ?? 0) === 0 && welcomedMembers[memberId] ? (
                <div className="flex items-center justify-center gap-2 rounded-pill py-2.5 text-sm font-semibold glass-card border border-border text-text-dim opacity-60">
                  <Check size={15} />
                  Welcome Sent
                </div>
              ) : cheerSent ? (
                <div className="flex items-center justify-center gap-2 rounded-pill py-2.5 text-sm font-semibold glass-card border border-border text-brand-light">
                  <Check size={15} />
                  Cheer Sent!
                </div>
              ) : (
                <button
                  onClick={() => setShowCheerPicker((v) => !v)}
                  className={`flex items-center justify-center gap-2 rounded-pill py-2.5 text-sm font-semibold border transition-colors ${
                    showCheerPicker
                      ? "gradient-brand text-white border-transparent"
                      : "glass-card border-border text-text"
                  }`}
                >
                  <Heart size={15} className={showCheerPicker ? "text-white" : "text-brand-light"} />
                  {showCheerPicker ? "Close Cheers" : "Send a Cheer"}
                </button>
              )}
            </div>

            {/* Cheer picker — all 7 */}
            {showCheerPicker && !cheerSent && (
              <div className="border-t border-border pt-3">
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {TRIBE_CHEERS.map((cheer) => (
                    <button
                      key={cheer.id}
                      onClick={() => handleSendCheer(cheer.id)}
                      title={cheer.label}
                      className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl bg-surface-2 border border-border active:scale-95 transition-transform"
                    >
                      <span className="text-xl leading-none">{cheer.emoji}</span>
                      <span className="text-[9px] font-semibold text-text-muted leading-tight text-center">
                        {cheer.label}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowCheerInfo((v) => !v)}
                  className="flex items-center gap-1.5 text-[11px] text-text-dim mx-auto"
                >
                  <HelpCircle size={11} />
                  What do the cheers mean?
                  {showCheerInfo ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                {showCheerInfo && (
                  <div className="mt-2.5 flex flex-col gap-2">
                    {TRIBE_CHEERS.map((cheer) => (
                      <div key={cheer.id} className="flex items-start gap-2">
                        <span className="text-base shrink-0 leading-none mt-0.5">{cheer.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text">{cheer.label}</p>
                          <p className="text-[11px] text-text-muted leading-snug">{cheer.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tribe-only actions */}
            {inTribe && (
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <Link
                  to={`/messages/${member.id}`}
                  className="flex items-center justify-center gap-2 rounded-pill py-2 text-sm font-semibold glass-card border border-border text-text"
                >
                  <MessageCircle size={14} className="text-brand-light" />
                  Message
                </Link>
                <button
                  onClick={() => { setCardOccasion("birthday"); setShowCardSender(true); }}
                  className="flex items-center justify-center gap-2 rounded-pill py-2 text-sm font-semibold glass-card border border-border text-text"
                >
                  <Sparkles size={14} className="text-brand-light" />
                  Send a Card
                </button>
                <button
                  onClick={() => setShowChallenge(true)}
                  className="flex items-center justify-center gap-2 rounded-pill py-2 text-sm font-semibold glass-card border border-border text-text"
                >
                  <Zap size={14} className="text-brand-light" />
                  Challenge
                </button>
                <button
                  onClick={() => setShowEventInvite(true)}
                  className="flex items-center justify-center gap-2 rounded-pill py-2 text-sm font-semibold glass-card border border-border text-text"
                >
                  <Calendar size={14} className="text-brand-light" />
                  Invite to Event
                </button>
              </div>
            )}
          </div>

          {/* Birthday celebration prompt */}
          {isBirthdaySoon && !birthdayCelebrated && (
            <button
              onClick={handleCelebrateBirthday}
              className="w-full flex items-center gap-3 glass-card rounded-card px-4 py-3 mb-4 border border-brand-light/20"
            >
              <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center shrink-0">
                <Cake size={16} className="text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-text">
                  {isBirthdayToday
                    ? "It's their birthday today!"
                    : `Birthday in ${bdayDays} day${bdayDays === 1 ? "" : "s"}`}
                </p>
                <p className="text-xs text-text-muted">Tap to send birthday love</p>
              </div>
              <Sparkles size={15} className="text-brand-light shrink-0" />
            </button>
          )}
          {isBirthdaySoon && birthdayCelebrated && (
            <div className="w-full flex items-center gap-3 glass-card rounded-card px-4 py-3 mb-4 border border-brand-light/20">
              <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Check size={16} className="text-brand-light" />
              </div>
              <p className="text-sm font-semibold text-brand-light">Birthday wishes sent!</p>
            </div>
          )}

          {/* Badges */}
          {earnedBadgeIds.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-bold text-text mb-3">Badges</p>
              <div className="grid grid-cols-3 gap-2.5">
                {earnedBadgeIds.map((id, idx) => {
                  const badge = getBadgeDef(id);
                  if (!badge) return null;
                  const accent = BADGE_ACCENTS[idx % BADGE_ACCENTS.length];
                  return (
                    <div
                      key={id}
                      className={`rounded-xl p-3 flex flex-col items-center gap-1.5 text-center border ${accent}`}
                    >
                      <span className="text-2xl leading-none">{badge.icon}</span>
                      <p className="text-[10px] font-bold leading-tight">{badge.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Birthday */}
          {member.birthday && (
            <div className="glass-card rounded-card p-4 flex items-center gap-3 mb-5 border border-border">
              <div className="w-10 h-10 rounded-full bg-brand-light/10 border border-brand-light/20 flex items-center justify-center shrink-0">
                <Cake size={18} className="text-brand-light" />
              </div>
              <div>
                <p className="text-sm font-bold text-text">Birthday</p>
                <p className="text-xs text-text-muted">{formatBirthday(member.birthday)}</p>
              </div>
            </div>
          )}

          {/* No badges fallback */}
          {earnedBadgeIds.length === 0 && (
            <div className="glass-card rounded-card p-4 flex items-center gap-3 mb-5">
              <Award size={18} className="text-text-dim shrink-0" />
              <p className="text-xs text-text-muted">No badges earned yet.</p>
            </div>
          )}

          {/* Block / Unblock */}
          {showBlockConfirm ? (
            <div className="glass-card rounded-card p-4 mb-6 flex flex-col gap-3">
              <p className="text-sm text-text font-semibold">
                {isBlocked ? `Unblock ${member.name}?` : `Block ${member.name}?`}
              </p>
              <p className="text-xs text-text-muted">
                {isBlocked
                  ? "You will see their posts and they can message you again."
                  : "You won't see their posts and they won't be able to message you. They won't know they've been blocked."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (memberId) isBlocked ? unblockUser(memberId) : blockUser(memberId);
                    setShowBlockConfirm(false);
                  }}
                  className="flex-1 py-2 text-sm font-semibold rounded-pill bg-red-500/20 text-red-400 border border-red-500/30"
                >
                  {isBlocked ? "Unblock" : "Block"}
                </button>
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="flex-1 py-2 text-sm font-semibold rounded-pill glass-card text-text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowBlockConfirm(true)}
              className="flex items-center gap-2 text-xs text-text-dim mx-auto mb-6"
            >
              <ShieldOff size={13} />
              <span>{isBlocked ? `Unblock ${member.name}` : `Block ${member.name}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCardSender && memberId && (
        <CardSender
          memberId={memberId}
          memberName={member.name}
          defaultOccasion={cardOccasion}
          onClose={() => setShowCardSender(false)}
        />
      )}
      {showChallenge && memberId && (
        <ChallengeInvite
          memberId={memberId}
          memberName={member.name}
          onClose={() => setShowChallenge(false)}
        />
      )}
      {showEventInvite && memberId && (
        <EventInvite
          memberId={memberId}
          memberName={member.name}
          onClose={() => setShowEventInvite(false)}
        />
      )}
    </>
  );
}
