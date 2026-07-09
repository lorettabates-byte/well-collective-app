import {
  Cake, CheckCircle2, ChevronDown, ChevronUp, Circle, Flame, Heart, HelpCircle,
  Plus, Search, Sparkles, Trophy, UserMinus, Users, X, Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TRIBE_CHEERS } from "../data/cheers";
import { resolveFeaturedBadge } from "../data/badges";
import type { TribeChallenge } from "../data/challenges";
import { useApp } from "../store/AppContext";
import { birthdayDateForYear } from "../utils/birthday";
import { computeStreak } from "../utils/streaks";
import { useSectionTracking } from "../hooks/useSectionTracking";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import ReceivedCardModal from "../components/tribe/ReceivedCardModal";
import type { ReceivedTribeCard } from "../components/tribe/ReceivedCardModal";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const TRIBE_STORAGE_KEY = "well-collective-tribe";
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const COLLAPSED_COUNT = 5;

interface DirectoryMember {
  id: string;
  name: string;
  avatar?: string;
  levelBadge?: string;
  bonusBadges?: string[];
  grantedBadges?: string[];
  featuredBadge?: string;
}

interface TribeMember extends DirectoryMember {
  birthday?: string;
  workoutLog?: string[];
  lastCheeredAt?: string | null;
  moodStatus?: string | null;
}

interface ActiveTribeChallenge {
  id: number;
  challengeId: string;
  title: string;
  description: string;
  duration: string;
  category: TribeChallenge["category"];
  goals: { id: string; label: string }[];
  bonusPoints: number;
  completedAt: string | null;
  myProgress: string[];
  partnerProgress: string[];
  partner: { name: string; avatar?: string };
  invitedByMe: boolean;
}

type SuggestionReason = "birthday" | "streak" | "new" | "uncheerred" | "inactive";

interface ScoredMember {
  member: TribeMember;
  score: number;
  reason: SuggestionReason;
  reasonText: string;
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
  let reasonText = "";

  if (m.birthday) {
    const days = daysUntilBirthday(m.birthday);
    if (days === 0) { score += 10; reason = "birthday"; reasonText = "Birthday today!"; }
    else if (days <= 2) { score += 8; reason = "birthday"; reasonText = `Birthday in ${days}d`; }
    else if (days <= 7) { score += 5; reason = "birthday"; reasonText = `Birthday in ${days}d`; }
  }

  const streak = computeStreak(m.workoutLog || []);
  if (streak >= 5 && !reason) { score += 6; reason = "streak"; reasonText = `${streak}-day streak`; }
  else if (streak >= 3 && !reason) { score += 3; reason = "streak"; reasonText = `${streak}-day streak`; }
  else if (streak >= 5) score += 6;
  else if (streak >= 3) score += 3;

  const logLen = (m.workoutLog || []).length;
  if (logLen <= 2 && !reason) { score += 4; reason = "new"; reasonText = logLen === 0 ? "New member" : "Just getting started"; }
  else if (logLen <= 2) score += 4;

  const lastCheered = m.lastCheeredAt ? new Date(m.lastCheeredAt).getTime() : 0;
  const daysSinceCheer = lastCheered ? Math.floor((Date.now() - lastCheered) / MS_PER_DAY) : 999;
  if (daysSinceCheer >= 7 && !reason) { score += 2; reason = "uncheerred"; reasonText = "Hasn't been cheered recently"; }
  else if (daysSinceCheer >= 7) score += 2;

  if (daysSinceCheer >= 30 && logLen > 3 && !reason) {
    score += 1; reason = "inactive"; reasonText = "Haven't connected in a while";
  }

  if (score === 0 || !reason) return null;
  return { member: m, score, reason: reason!, reasonText };
}

const REASON_CONFIG: Record<SuggestionReason, { icon: React.ReactNode; accent: string; label: string }> = {
  birthday:  { icon: <Cake size={12} />,     accent: "text-brand-light bg-brand-light/10 border-brand-light/20", label: "Birthday" },
  streak:    { icon: <Flame size={12} />,    accent: "text-orange-400 bg-orange-400/10 border-orange-400/20",   label: "On a streak" },
  new:       { icon: <Sparkles size={12} />, accent: "text-violet-400 bg-violet-400/10 border-violet-400/20",   label: "New member" },
  uncheerred:{ icon: <Heart size={12} />,    accent: "text-rose-400 bg-rose-400/10 border-rose-400/20",         label: "Needs a cheer" },
  inactive:  { icon: <Heart size={12} />,    accent: "text-text-muted bg-surface-2 border-border",              label: "Reconnect" },
};

const CHALLENGE_CATEGORY_CONFIG: Record<TribeChallenge["category"], {
  label: string;
  accent: string;
  glow: string;
  mine: string;
  partner: string;
  text: string;
}> = {
  fitness: {
    label: "Movement",
    accent: "linear-gradient(90deg, #FB923C, #FACC15)",
    glow: "rgba(251,146,60,0.14)",
    mine: "#FB923C",
    partner: "#FACC15",
    text: "#FDBA74",
  },
  nutrition: {
    label: "Nourishment",
    accent: "linear-gradient(90deg, #34D399, #84D8FD)",
    glow: "rgba(52,211,153,0.12)",
    mine: "#34D399",
    partner: "#84D8FD",
    text: "#6EE7B7",
  },
  mindfulness: {
    label: "Mindfulness",
    accent: "linear-gradient(90deg, #A78BFA, #84D8FD)",
    glow: "rgba(167,139,250,0.13)",
    mine: "#A78BFA",
    partner: "#84D8FD",
    text: "#C4B5FD",
  },
  wellness: {
    label: "WELL Check",
    accent: "linear-gradient(90deg, #84D8FD, #2A6DD9)",
    glow: "rgba(132,216,253,0.13)",
    mine: "#84D8FD",
    partner: "#FACC15",
    text: "#84D8FD",
  },
};

function launchChallengeConfetti() {
  confetti({
    particleCount: 120,
    spread: 78,
    origin: { y: 0.72 },
    colors: ["#84D8FD", "#FACC15", "#34D399", "#FB923C", "#FFFFFF"],
  });
  window.setTimeout(() => {
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 70,
      origin: { x: 0.15, y: 0.75 },
      colors: ["#84D8FD", "#FACC15", "#FFFFFF"],
    });
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 70,
      origin: { x: 0.85, y: 0.75 },
      colors: ["#34D399", "#FB923C", "#FFFFFF"],
    });
  }, 180);
}

export default function Tribe() {
  useSectionTracking("tribe");
  const { user } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tribe, setTribe] = useState<TribeMember[]>([]);
  const [allMembers, setAllMembers] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [addSearch, setAddSearch] = useState("");
  const [tribeSearch, setTribeSearch] = useState("");
  const [listExpanded, setListExpanded] = useState(false);
  const [showCheerInfo, setShowCheerInfo] = useState(false);

  const [addError, setAddError] = useState("");
  const [cheeringFor, setCheeringFor] = useState<string | null>(null);
  const [sentCheers, setSentCheers] = useState<Record<string, boolean>>({});
  const [challenges, setChallenges] = useState<ActiveTribeChallenge[]>([]);
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [updatingGoal, setUpdatingGoal] = useState<string | null>(null);
  const [challengeToast, setChallengeToast] = useState("");
  const [receivedCard, setReceivedCard] = useState<ReceivedTribeCard | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const cardParam = searchParams.get("card");
  const challengeParam = searchParams.get("challenge");

  const setTribeAndPersist = (members: TribeMember[]) => {
    setTribe(members);
    try { window.localStorage.setItem(TRIBE_STORAGE_KEY, JSON.stringify(members)); } catch { /* storage full */ }
  };

  const loadTribe = () => {
    if (!API_URL || !user.email) return;
    fetch(`${API_URL}/api/tribe?email=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : { tribe: [] }))
      .then((data) => setTribeAndPersist(data.tribe || []))
      .catch(() => {
        try {
          const cached = window.localStorage.getItem(TRIBE_STORAGE_KEY);
          if (cached) setTribe(JSON.parse(cached));
        } catch { setTribe([]); }
      });
  };

  const loadChallenges = () => {
    if (!API_URL || !user.email) { setChallengeLoading(false); return; }
    setChallengeLoading(true);
    fetch(`${API_URL}/api/tribe/challenges?email=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : { challenges: [] }))
      .then((data) => setChallenges(data.challenges || []))
      .catch(() => setChallenges([]))
      .finally(() => setChallengeLoading(false));
  };

  useEffect(() => {
    if (!API_URL || !user.email) { setLoading(false); return; }
    setLoading(true);
    try {
      const cached = window.localStorage.getItem(TRIBE_STORAGE_KEY);
      if (cached) setTribe(JSON.parse(cached));
    } catch { /* ignore */ }

    Promise.all([
      fetch(`${API_URL}/api/tribe?email=${encodeURIComponent(user.email)}`).then((r) => r.ok ? r.json() : { tribe: [] }),
      fetch(`${API_URL}/api/members?excludeEmail=${encodeURIComponent(user.email)}`).then((r) => r.ok ? r.json() : { members: [] }),
    ])
      .then(([tribeData, membersData]) => {
        setTribeAndPersist(tribeData.tribe || []);
        setAllMembers(membersData.members || []);
      })
      .catch(() => { /* keep cached */ })
      .finally(() => setLoading(false));
  }, [user.email]);

  useEffect(() => {
    loadChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  useEffect(() => {
    if (!API_URL || !user.email || !cardParam) return;
    setCardLoading(true);
    fetch(`${API_URL}/api/tribe/cards/${encodeURIComponent(cardParam)}?email=${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setReceivedCard(data?.card ?? null))
      .catch(() => setReceivedCard(null))
      .finally(() => setCardLoading(false));
  }, [cardParam, user.email]);

  useEffect(() => {
    if (!challengeParam || challenges.length === 0) return;
    window.setTimeout(() => {
      document.getElementById(`tribe-challenge-${challengeParam}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }, [challengeParam, challenges.length]);

  const handleAdd = async (memberId: string) => {
    if (!API_URL || !user.email) return;
    setAdding(memberId);
    setAddError("");
    try {
      const res = await fetch(`${API_URL}/api/tribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, memberId }),
      });
      if (res.ok) {
        loadTribe();
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setAddError(d.error || `Error ${res.status} — please try again`);
      }
    } catch {
      setAddError("Network error — please check your connection");
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!API_URL || !user.email) return;
    setTribe((prev) => prev.filter((m) => m.id !== memberId));
    try {
      await fetch(`${API_URL}/api/tribe/${memberId}?email=${encodeURIComponent(user.email)}`, { method: "DELETE" });
    } catch { loadTribe(); }
  };

  const sendCheer = async (memberId: string, cheerId: string) => {
    if (!API_URL || !user.email) return;
    setCheeringFor(null);
    setSentCheers((prev) => ({ ...prev, [memberId]: true }));
    try {
      await fetch(`${API_URL}/api/tribe/${memberId}/cheer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, cheerId }),
      });
    } catch { /* no-op */ }
    setTimeout(() => setSentCheers((prev) => ({ ...prev, [memberId]: false })), 2500);
  };

  const closeReceivedCard = () => {
    setReceivedCard(null);
    const next = new URLSearchParams(searchParams);
    next.delete("card");
    setSearchParams(next, { replace: true });
  };

  const toggleChallengeGoal = async (challenge: ActiveTribeChallenge, goalId: string) => {
    if (!API_URL || !user.email || challenge.completedAt) return;
    const wasComplete = challenge.myProgress.includes(goalId);
    const key = `${challenge.id}:${goalId}`;
    setUpdatingGoal(key);
    try {
      const res = await fetch(`${API_URL}/api/tribe/challenges/${challenge.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, goalId, completed: !wasComplete }),
      });
      if (!res.ok) return;
      const data = await res.json() as { challenge?: ActiveTribeChallenge; awarded?: boolean; points?: number };
      if (data.challenge) {
        setChallenges((prev) => prev.map((item) => (item.id === challenge.id ? data.challenge! : item)));
      }
      if (data.awarded && data.points) {
        launchChallengeConfetti();
        setChallengeToast(`Challenge complete! You both earned ${data.points} bonus points.`);
        window.setTimeout(() => setChallengeToast(""), 3500);
      }
    } finally {
      setUpdatingGoal(null);
    }
  };

  const tribeIds = new Set(tribe.map((m) => m.id));
  const addable = allMembers
    .filter((m) => !tribeIds.has(m.id))
    .filter((m) => !addSearch || m.name.toLowerCase().includes(addSearch.toLowerCase()));

  const filteredTribe = tribe.filter(
    (m) => !tribeSearch || m.name.toLowerCase().includes(tribeSearch.toLowerCase())
  );

  const suggestions: ScoredMember[] = !tribeSearch
    ? tribe.map(scoreMember).filter((s): s is ScoredMember => s !== null).sort((a, b) => b.score - a.score).slice(0, 5)
    : [];

  const visibleTribe = listExpanded ? filteredTribe : filteredTribe.slice(0, COLLAPSED_COUNT);
  const hiddenCount = filteredTribe.length - COLLAPSED_COUNT;

  return (
    <div>
      <TopBar title="WELL Tribe" subtitle="Your circle of support" showBack />
      <div className="px-4 pt-4 pb-8">

        {/* Stats banner */}
        {!loading && tribe.length > 0 && (
          <div className="glass-card rounded-card px-4 py-3 mb-5 flex items-center gap-4 border border-border">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-text">{tribe.length}</p>
              <p className="text-[11px] text-text-muted">Members</p>
            </div>
            <div className="w-px h-8 bg-border shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-text">{suggestions.length}</p>
              <p className="text-[11px] text-text-muted">To Connect</p>
            </div>
            <div className="w-px h-8 bg-border shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-text">
                {tribe.filter((m) => m.birthday && daysUntilBirthday(m.birthday) <= 7).length}
              </p>
              <p className="text-[11px] text-text-muted">Birthdays Soon</p>
            </div>
          </div>
        )}

        {/* Add to tribe */}
        <button
          onClick={() => { setShowAdd((v) => !v); setAddError(""); }}
          className="flex items-center justify-center gap-2 text-sm font-semibold gradient-brand text-white rounded-pill py-2.5 w-full mb-5"
        >
          {showAdd ? <X size={16} /> : <Plus size={16} />}
          {showAdd ? "Close" : "Add to WELL Tribe"}
        </button>

        {showAdd && (
          <div className="mb-6">
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
              <input
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                placeholder="Search members…"
                className="w-full bg-surface-2 border border-border rounded-pill pl-8 pr-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
            </div>
            {addError && (
              <p className="text-xs text-red-400 mb-2 px-1">{addError}</p>
            )}
            <div className="relative">
              <div className="glass-card rounded-card p-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
                {addable.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">
                    Everyone you know is already in your WELL Tribe.
                  </p>
                ) : (
                  addable.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 px-1 py-1.5">
                      <Link to={`/member/${member.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar src={member.avatar || ""} alt={member.name} size={36} badgeId={resolveFeaturedBadge(member)} />
                        <p className="flex-1 min-w-0 text-sm font-medium text-text truncate">{member.name}</p>
                      </Link>
                      <button
                        onClick={() => handleAdd(member.id)}
                        disabled={adding === member.id}
                        className="text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-1.5 disabled:opacity-50"
                      >
                        {adding === member.id ? "Adding…" : "Add"}
                      </button>
                    </div>
                  ))
                )}
              </div>
              {addable.length > 4 && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-card bg-gradient-to-t from-surface to-transparent" />
              )}
            </div>
          </div>
        )}

        {(challengeLoading || challenges.length > 0) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-text">Tribe Challenges</p>
                <p className="text-[11px] text-text-muted">Check off your goals and watch your partner's progress.</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-pill px-2.5 py-1">
                <Trophy size={12} />
                +25 pts
              </div>
            </div>

            {challengeToast && (
              <div className="mb-3 rounded-card border border-brand-light/30 bg-brand-light/10 px-3 py-2 text-xs font-semibold text-brand-light">
                {challengeToast}
              </div>
            )}

            {challengeLoading ? (
              <div className="glass-card rounded-card p-4 text-center text-xs text-text-dim">Loading challenges...</div>
            ) : (
              <div className="flex flex-col gap-3">
                {challenges.map((challenge) => {
                  const myCount = challenge.myProgress.length;
                  const partnerCount = challenge.partnerProgress.length;
                  const total = challenge.goals.length || 1;
                  const highlighted = challengeParam === String(challenge.id);
                  const cfg = CHALLENGE_CATEGORY_CONFIG[challenge.category];
                  const myPercent = Math.round((myCount / total) * 100);
                  const partnerPercent = Math.round((partnerCount / total) * 100);
                  const togetherPercent = Math.round(((myCount + partnerCount) / (total * 2)) * 100);
                  return (
                    <div
                      key={challenge.id}
                      id={`tribe-challenge-${challenge.id}`}
                      className={`relative overflow-hidden glass-card rounded-card p-4 border ${highlighted ? "border-brand-light/60" : "border-border"}`}
                      style={{ background: `linear-gradient(145deg, ${cfg.glow}, rgba(13,24,38,0.94) 42%, rgba(20,35,57,0.9))` }}
                    >
                      <div className="absolute inset-x-0 top-0 h-1" style={{ background: cfg.accent }} />

                      <div className="flex items-start gap-3 mb-4 pt-1">
                        <div
                          className="w-12 h-12 rounded-full p-0.5 shrink-0"
                          style={{ background: `conic-gradient(${cfg.mine} ${togetherPercent}%, rgba(255,255,255,0.12) 0)` }}
                        >
                          <div className="w-full h-full rounded-full bg-surface flex flex-col items-center justify-center border border-border">
                            <span className="text-[10px] font-extrabold leading-none" style={{ color: cfg.text }}>{togetherPercent}%</span>
                            <span className="text-[8px] text-text-dim leading-none mt-0.5">done</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span
                                  className="text-[9px] font-extrabold uppercase tracking-wide rounded-pill px-2 py-0.5 border"
                                  style={{ color: cfg.text, background: cfg.glow, borderColor: cfg.text }}
                                >
                                  {cfg.label}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wide text-yellow-300 bg-yellow-400/10 border border-yellow-400/20 rounded-pill px-2 py-0.5">
                                  +{challenge.bonusPoints} bonus
                                </span>
                              </div>
                              <p className="text-sm font-bold text-text leading-snug">{challenge.title}</p>
                            </div>
                            {challenge.completedAt ? (
                              <Trophy size={18} className="text-yellow-300 shrink-0 mt-0.5" />
                            ) : (
                              <Zap size={17} className="shrink-0 mt-0.5" style={{ color: cfg.text }} />
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">{challenge.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar src={challenge.partner.avatar || ""} alt={challenge.partner.name} size={22} />
                            <p className="text-[10px] font-bold text-text-dim uppercase tracking-wide">
                              {challenge.duration} with {challenge.partner.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="rounded-card bg-surface-2 border border-border px-3 py-2.5">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-text-dim">You</p>
                            <p className="text-[10px] font-extrabold" style={{ color: cfg.mine }}>{myPercent}%</p>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface overflow-hidden mb-1.5">
                            <div className="h-full rounded-full" style={{ width: `${myPercent}%`, background: cfg.mine }} />
                          </div>
                          <p className="text-xs font-bold text-text">{myCount}/{total}</p>
                        </div>
                        <div className="rounded-card bg-surface-2 border border-border px-3 py-2.5">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-text-dim truncate">{challenge.partner.name}</p>
                            <p className="text-[10px] font-extrabold" style={{ color: cfg.partner }}>{partnerPercent}%</p>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface overflow-hidden mb-1.5">
                            <div className="h-full rounded-full" style={{ width: `${partnerPercent}%`, background: cfg.partner }} />
                          </div>
                          <p className="text-xs font-bold text-text">{partnerCount}/{total}</p>
                        </div>
                      </div>

                      {challenge.completedAt && (
                        <div className="mb-3 rounded-card border border-yellow-400/25 bg-yellow-400/10 px-3 py-2 flex items-center gap-2">
                          <Trophy size={15} className="text-yellow-300 shrink-0" />
                          <p className="text-xs font-semibold text-yellow-100">
                            Completed together. Bonus points were added to both WELL Cups.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        {challenge.goals.map((goal) => {
                          const mineDone = challenge.myProgress.includes(goal.id);
                          const partnerDone = challenge.partnerProgress.includes(goal.id);
                          const loadingGoal = updatingGoal === `${challenge.id}:${goal.id}`;
                          return (
                            <button
                              key={goal.id}
                              onClick={() => toggleChallengeGoal(challenge, goal.id)}
                              disabled={!!challenge.completedAt || loadingGoal}
                              className="w-full flex items-center gap-2 rounded-card border px-3 py-2.5 text-left disabled:opacity-70 transition-colors"
                              style={{
                                background: mineDone ? cfg.glow : "rgba(20,35,57,0.78)",
                                borderColor: mineDone ? cfg.text : "rgba(31,51,73,0.9)",
                              }}
                            >
                              {mineDone ? (
                                <CheckCircle2 size={16} className="shrink-0" style={{ color: cfg.text }} />
                              ) : (
                                <Circle size={16} className="text-text-dim shrink-0" />
                              )}
                              <span className="flex-1 min-w-0 text-xs font-semibold text-text">{goal.label}</span>
                              {partnerDone && (
                                <span className="text-[10px] font-bold text-yellow-300 shrink-0 rounded-pill bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5">Partner done</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-muted text-center py-10">Loading your WELL Tribe…</p>
        ) : tribe.length === 0 ? (
          <div className="glass-card rounded-card p-8 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center">
              <Users size={24} className="text-text-dim" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text mb-1">Your tribe is empty</p>
              <p className="text-xs text-text-muted">Add fellow members to build your circle of support.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Smart suggestion tiles */}
            {suggestions.length > 0 && !tribeSearch && (
              <div className="mb-6">
                {/* Section header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-text">Connect Today</p>
                    <p className="text-[11px] text-text-muted">People worth reaching out to right now</p>
                  </div>
                  <button
                    onClick={() => setShowCheerInfo((v) => !v)}
                    className="flex items-center gap-1 text-[11px] text-text-dim glass-card border border-border rounded-pill px-2.5 py-1"
                  >
                    <HelpCircle size={11} />
                    Cheers?
                  </button>
                </div>

                {/* Cheer info panel */}
                {showCheerInfo && (
                  <div className="glass-card rounded-card p-4 mb-4 border border-brand-light/15">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-text">What each cheer means</p>
                      <button onClick={() => setShowCheerInfo(false)} className="text-text-dim">
                        <X size={13} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {TRIBE_CHEERS.map((cheer) => (
                        <div key={cheer.id} className="flex items-start gap-2.5">
                          <span className="text-base shrink-0 leading-none mt-0.5">{cheer.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-text">{cheer.label}</p>
                            <p className="text-[11px] text-text-muted leading-snug">{cheer.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tile grid */}
                <div className="grid grid-cols-2 gap-3">
                  {suggestions.map(({ member, reason, reasonText }) => {
                    const cfg = REASON_CONFIG[reason];
                    const isCheering = cheeringFor === member.id;
                    const justSent = sentCheers[member.id];
                    return (
                      <div
                        key={member.id}
                        className="glass-card rounded-card p-3.5 flex flex-col items-center text-center gap-2.5 relative overflow-hidden border border-border"
                      >
                        {/* Subtle reason-colored top accent bar */}
                        <div className={`absolute inset-x-0 top-0 h-0.5 ${cfg.accent.includes("bg-brand") ? "bg-brand-light/40" : cfg.accent.includes("orange") ? "bg-orange-400/40" : cfg.accent.includes("violet") ? "bg-violet-400/40" : cfg.accent.includes("rose") ? "bg-rose-400/40" : "bg-border"}`} />

                        <Link to={`/member/${member.id}`} className="flex flex-col items-center gap-1.5 w-full mt-1">
                          <Avatar src={member.avatar || ""} alt={member.name} size={48} badgeId={resolveFeaturedBadge(member)} moodStatus={member.moodStatus} />
                          <p className="text-sm font-semibold text-text truncate w-full">{member.name}</p>
                        </Link>

                        {/* Reason badge */}
                        <span className={`flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 border ${cfg.accent}`}>
                          {cfg.icon}
                          {reasonText}
                        </span>

                        {justSent ? (
                          <p className="text-[11px] font-semibold text-brand-light py-0.5">Cheer sent!</p>
                        ) : isCheering ? (
                          <div className="flex items-center flex-wrap justify-center gap-1 mt-0.5">
                            {TRIBE_CHEERS.map((cheer) => (
                              <button
                                key={cheer.id}
                                onClick={() => sendCheer(member.id, cheer.id)}
                                title={cheer.label}
                                aria-label={`Send ${cheer.label} cheer to ${member.name}`}
                                className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs"
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
              </div>
            )}

            {/* Full tribe list */}
            <div className="flex items-center gap-2 mb-3 mt-1">
              <p className="text-sm font-bold text-text">Your Tribe</p>
              <span className="text-xs font-bold text-text-dim bg-surface-2 border border-border rounded-full px-2 py-0.5">{tribe.length}</span>
            </div>

            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
              <input
                value={tribeSearch}
                onChange={(e) => setTribeSearch(e.target.value)}
                placeholder="Search your tribe…"
                className="w-full bg-surface-2 border border-border rounded-pill pl-8 pr-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="flex flex-col gap-2">
              {visibleTribe.map((member) => {
                const streak = computeStreak(member.workoutLog || []);
                const bdayDays = member.birthday ? daysUntilBirthday(member.birthday) : null;
                const scored = scoreMember(member);
                return (
                  <div key={member.id} className="glass-card rounded-card px-4 py-3 flex items-center gap-3 border border-border">
                    <Link to={`/member/${member.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar src={member.avatar || ""} alt={member.name} size={40} badgeId={resolveFeaturedBadge(member)} moodStatus={member.moodStatus} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text truncate">{member.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {streak >= 3 && (
                            <span className="flex items-center gap-0.5 text-[11px] text-orange-400 font-medium">
                              <Flame size={11} />
                              {streak}d
                            </span>
                          )}
                          {bdayDays !== null && bdayDays <= 7 && (
                            <span className="flex items-center gap-0.5 text-[11px] text-brand-light font-medium">
                              <Cake size={11} />
                              {bdayDays === 0 ? "Today!" : `${bdayDays}d`}
                            </span>
                          )}
                          {scored && !streak && !bdayDays && (
                            <span className={`flex items-center gap-0.5 text-[11px] font-medium ${REASON_CONFIG[scored.reason].accent.split(" ")[0]}`}>
                              {REASON_CONFIG[scored.reason].icon}
                              {scored.reasonText}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="text-text-dim p-2 shrink-0 hover:text-text-muted transition-colors"
                      aria-label={`Remove ${member.name} from WELL Tribe`}
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredTribe.length > COLLAPSED_COUNT && (
              <button
                onClick={() => setListExpanded((v) => !v)}
                className="flex items-center justify-center gap-1.5 w-full mt-3 py-2.5 text-sm font-semibold glass-card rounded-pill text-text-muted border border-border"
              >
                {listExpanded ? <><ChevronUp size={15} /> Show less</> : <><ChevronDown size={15} /> Show {hiddenCount} more</>}
              </button>
            )}
          </>
        )}
      </div>
      {(cardParam || cardLoading || receivedCard) && (
        <ReceivedCardModal card={receivedCard} loading={cardLoading} onClose={closeReceivedCard} />
      )}
    </div>
  );
}
