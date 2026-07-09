import {
  Cake, ChevronDown, ChevronUp, Flame, Heart, HelpCircle,
  Plus, Search, Sparkles, UserMinus, Users, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TRIBE_CHEERS } from "../data/cheers";
import { resolveFeaturedBadge } from "../data/badges";
import { useApp } from "../store/AppContext";
import { birthdayDateForYear } from "../utils/birthday";
import { computeStreak } from "../utils/streaks";
import { useSectionTracking } from "../hooks/useSectionTracking";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";

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

export default function Tribe() {
  useSectionTracking("tribe");
  const { user } = useApp();
  const [tribe, setTribe] = useState<TribeMember[]>([]);
  const [allMembers, setAllMembers] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [addSearch, setAddSearch] = useState("");
  const [tribeSearch, setTribeSearch] = useState("");
  const [listExpanded, setListExpanded] = useState(false);
  const [showCheerInfo, setShowCheerInfo] = useState(false);

  const [cheeringFor, setCheeringFor] = useState<string | null>(null);
  const [sentCheers, setSentCheers] = useState<Record<string, boolean>>({});

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

  const handleAdd = async (memberId: string) => {
    if (!API_URL || !user.email) return;
    setAdding(memberId);
    try {
      const res = await fetch(`${API_URL}/api/tribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, memberId }),
      });
      if (res.ok) loadTribe();
    } catch { /* no-op */ } finally { setAdding(null); }
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
          onClick={() => setShowAdd((v) => !v)}
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
    </div>
  );
}
