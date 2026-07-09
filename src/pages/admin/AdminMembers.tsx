import { Calendar, ChevronDown, ChevronUp, Mail, Plus, Search, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/ui/Avatar";
import TopBar from "../../components/layout/TopBar";
import { SPECIAL_BADGES } from "../../data/badges";
import { deriveMemberId, getAuthHeaders } from "../../utils/admin";
import { formatDateLong } from "../../utils/format";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface AdminMember {
  email: string;
  name: string;
  avatar?: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  updatedAt: string;
  grantedBadges?: string[];
}

function MemberCard({
  member,
  onDelete,
  onToggleBadge,
  onTrialUpdated,
  isTrialExpired,
}: {
  member: AdminMember;
  onDelete: (email: string) => void;
  onToggleBadge: (email: string, badgeId: string, currentlyGranted: boolean) => void;
  onTrialUpdated: (email: string, trialEndsAt: string) => void;
  isTrialExpired: (trialEndsAt?: string) => boolean;
}) {
  const granted = new Set(member.grantedBadges ?? []);
  const [editingTrial, setEditingTrial] = useState(false);
  const [trialDate, setTrialDate] = useState(member.trialEndsAt ?? "");
  const [trialSaving, setTrialSaving] = useState(false);
  const [trialError, setTrialError] = useState("");

  const saveTrial = async () => {
    if (!trialDate || !API_URL) return;
    setTrialSaving(true);
    setTrialError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/members/${encodeURIComponent(member.email)}/trial`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ trialEndsAt: trialDate }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setTrialError(d.error || "Failed to save");
        return;
      }
      onTrialUpdated(member.email, trialDate);
      setEditingTrial(false);
    } catch {
      setTrialError("Failed to save");
    } finally {
      setTrialSaving(false);
    }
  };

  return (
    <div className="glass-card rounded-card px-4 py-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <Link to={`/member/${deriveMemberId(member.email)}`} className="shrink-0">
          <Avatar src={member.avatar ?? ""} alt={member.name} size={40} />
        </Link>
        <Link to={`/member/${deriveMemberId(member.email)}`} className="flex-1 min-w-0 hover:opacity-75 transition-opacity">
          <p className="text-sm font-semibold text-text truncate">{member.name}</p>
          <p className="text-xs text-text-muted truncate">{member.email}</p>
          {member.trialEndsAt && (
            <p className={`text-[11px] mt-0.5 ${isTrialExpired(member.trialEndsAt) ? "text-red-400" : "text-brand-light"}`}>
              {isTrialExpired(member.trialEndsAt) ? "Trial expired " : "Trial ends "}
              {formatDateLong(member.trialEndsAt)}
            </p>
          )}
        </Link>
        <button
          onClick={() => { setEditingTrial((v) => !v); setTrialError(""); setTrialDate(member.trialEndsAt ?? ""); }}
          className="text-brand-light p-2 shrink-0"
          aria-label="Edit trial date"
          title="Edit trial end date"
        >
          <Calendar size={16} />
        </button>
        <a
          href={`mailto:${member.email}`}
          onClick={(e) => e.stopPropagation()}
          className="text-brand-light p-2 shrink-0"
          aria-label={`Email ${member.name}`}
        >
          <Mail size={16} />
        </a>
        <button
          onClick={() => onDelete(member.email)}
          className="text-red-400 p-2 shrink-0"
          aria-label={`Remove ${member.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {editingTrial && (
        <div className="bg-surface-2 border border-border rounded-card px-3 py-2.5 flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-text-muted">Set trial end date</p>
          {trialError && <p className="text-[11px] text-red-400">{trialError}</p>}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={trialDate}
              onChange={(e) => setTrialDate(e.target.value)}
              className="flex-1 bg-surface-3 border border-border rounded-card px-2.5 py-1.5 text-sm text-text focus:outline-none focus:border-brand-blue"
            />
            <button
              onClick={saveTrial}
              disabled={trialSaving || !trialDate}
              className="text-[12px] font-semibold gradient-brand text-white rounded-pill px-3 py-1.5 disabled:opacity-50"
            >
              {trialSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditingTrial(false)}
              className="text-[12px] text-text-muted rounded-pill px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {SPECIAL_BADGES.map((badge) => {
          const isGranted = granted.has(badge.id);
          return (
            <button
              key={badge.id}
              onClick={() => onToggleBadge(member.email, badge.id, isGranted)}
              className={`flex items-center gap-1 text-[11px] font-semibold rounded-pill px-2.5 py-1 ${
                isGranted ? "gradient-brand text-white" : "bg-surface-2 border border-border text-text-dim"
              }`}
            >
              <span>{badge.icon}</span>
              {isGranted ? `${badge.label} ✓` : `Grant ${badge.label}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminMembers() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grantTrial, setGrantTrial] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadMembers = () => {
    if (!API_URL) return;
    setLoading(true);
    fetch(`${API_URL}/api/admin/members`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : { members: [] }))
      .then((data) => setMembers(data.members || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !API_URL) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/members`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: name.trim(), email: email.trim(), grantTrial }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to add member");
        return;
      }
      setName("");
      setEmail("");
      setGrantTrial(true);
      setShowAddForm(false);
      loadMembers();
    } catch {
      setError("Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (memberEmail: string) => {
    if (!API_URL) return;
    if (!window.confirm(`Remove ${memberEmail} from the member directory?`)) return;
    try {
      await fetch(`${API_URL}/api/members/${encodeURIComponent(memberEmail)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      setMembers((prev) => prev.filter((m) => m.email !== memberEmail));
    } catch {
      window.alert("Failed to remove member. Please try again.");
    }
  };

  const [fullMembersExpanded, setFullMembersExpanded] = useState(true);
  const [trialMembersExpanded, setTrialMembersExpanded] = useState(true);
  const [expiredTrialExpanded, setExpiredTrialExpanded] = useState(false);

  const isTrialExpired = (trialEndsAt?: string) => !!trialEndsAt && trialEndsAt < new Date().toISOString().slice(0, 10);
  const isActiveTrial = (trialEndsAt?: string) => !!trialEndsAt && !isTrialExpired(trialEndsAt);

  const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";
  const q = searchQuery.toLowerCase().trim();
  const sortedMembers = [...members]
    .filter((m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    .sort((a, b) => firstName(a.name).localeCompare(firstName(b.name), undefined, { sensitivity: "base" }));

  const fullMembers = sortedMembers.filter((m) => !m.trialEndsAt);
  const trialMembers = sortedMembers.filter((m) => isActiveTrial(m.trialEndsAt));
  const expiredTrialMembers = sortedMembers.filter((m) => m.trialEndsAt && isTrialExpired(m.trialEndsAt));

  const handleTrialUpdated = (memberEmail: string, trialEndsAt: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.email !== memberEmail ? m : { ...m, trialEndsAt }))
    );
  };

  const toggleBadge = async (memberEmail: string, badgeId: string, currentlyGranted: boolean) => {
    if (!API_URL) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.email !== memberEmail
          ? m
          : {
              ...m,
              grantedBadges: currentlyGranted
                ? (m.grantedBadges ?? []).filter((b) => b !== badgeId)
                : [...(m.grantedBadges ?? []), badgeId],
            }
      )
    );
    try {
      await fetch(`${API_URL}/api/admin/members/${encodeURIComponent(memberEmail)}/badges`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ badgeId, grant: !currentlyGranted }),
      });
    } catch {
      loadMembers();
    }
  };

  return (
    <div>
      <TopBar title="Members" subtitle="View, add, and remove members" showBack />
      <div className="px-4 pt-4">
        <div className="glass-card rounded-card px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Total Members</p>
          <p className="text-lg font-bold text-brand-light">{loading ? "…" : members.length}</p>
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email…"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full bg-surface-2 border border-border rounded-pill pl-8 pr-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
          />
        </div>

        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center justify-center gap-2 text-sm font-semibold gradient-brand text-white rounded-pill py-2.5 w-full mb-4"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? "Cancel" : "Add Member"}
        </button>

        {showAddForm && (
          <form onSubmit={handleAdd} className="glass-card rounded-card p-4 flex flex-col gap-3 mb-6">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
            </div>
            <label className="flex items-center gap-2.5 glass-card rounded-card px-3.5 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={grantTrial}
                onChange={(e) => setGrantTrial(e.target.checked)}
                className="w-4 h-4 accent-brand-blue"
              />
              <span className="text-xs text-text-muted">Grant a 7-day free trial</span>
            </label>
            <button
              type="submit"
              disabled={saving || !name.trim() || !email.trim()}
              className="flex items-center justify-center gap-2 text-sm font-semibold gradient-brand text-white rounded-pill py-2.5 disabled:opacity-50"
            >
              <UserPlus size={16} />
              {saving ? "Adding…" : "Add Member"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-text-muted text-center py-8">Loading members…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No members yet.</p>
        ) : (
          <div className="flex flex-col gap-4">

            {/* WELL Collective Members */}
            <div>
              <button
                onClick={() => setFullMembersExpanded((v) => !v)}
                className="w-full flex items-center justify-between glass-card rounded-card px-4 py-3 mb-2"
              >
                <div>
                  <p className="text-sm font-bold text-text text-left">WELL Collective Members</p>
                  <p className="text-xs text-text-muted text-left">Full members — {fullMembers.length} total</p>
                </div>
                {fullMembersExpanded ? <ChevronUp size={16} className="text-text-dim shrink-0" /> : <ChevronDown size={16} className="text-text-dim shrink-0" />}
              </button>
              {fullMembersExpanded && (
                <div className="flex flex-col gap-2.5">
                  {fullMembers.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">No full members yet.</p>
                  ) : fullMembers.map((member) => <MemberCard key={member.email} member={member} onDelete={handleDelete} onToggleBadge={toggleBadge} onTrialUpdated={handleTrialUpdated} isTrialExpired={isTrialExpired} />)}
                </div>
              )}
            </div>

            {/* Free Trial Members */}
            {trialMembers.length > 0 && (
              <div>
                <button
                  onClick={() => setTrialMembersExpanded((v) => !v)}
                  className="w-full flex items-center justify-between glass-card rounded-card px-4 py-3 mb-2"
                >
                  <div>
                    <p className="text-sm font-bold text-text text-left">Free Trial Members</p>
                    <p className="text-xs text-text-muted text-left">Active trials — {trialMembers.length} total</p>
                  </div>
                  {trialMembersExpanded ? <ChevronUp size={16} className="text-text-dim shrink-0" /> : <ChevronDown size={16} className="text-text-dim shrink-0" />}
                </button>
                {trialMembersExpanded && (
                  <div className="flex flex-col gap-2.5">
                    {trialMembers.map((member) => <MemberCard key={member.email} member={member} onDelete={handleDelete} onToggleBadge={toggleBadge} onTrialUpdated={handleTrialUpdated} isTrialExpired={isTrialExpired} />)}
                  </div>
                )}
              </div>
            )}

            {/* Expired Trial Members — collapsed by default so they don't clutter the view */}
            {expiredTrialMembers.length > 0 && (
              <div>
                <button
                  onClick={() => setExpiredTrialExpanded((v) => !v)}
                  className="w-full flex items-center justify-between glass-card rounded-card px-4 py-3 mb-2 border border-red-500/20"
                >
                  <div>
                    <p className="text-sm font-bold text-red-400 text-left">Expired Trials (no longer active)</p>
                    <p className="text-xs text-text-muted text-left">Not counted as members — {expiredTrialMembers.length} total</p>
                  </div>
                  {expiredTrialExpanded ? <ChevronUp size={16} className="text-text-dim shrink-0" /> : <ChevronDown size={16} className="text-text-dim shrink-0" />}
                </button>
                {expiredTrialExpanded && (
                  <div className="flex flex-col gap-2.5">
                    {expiredTrialMembers.map((member) => <MemberCard key={member.email} member={member} onDelete={handleDelete} onToggleBadge={toggleBadge} onTrialUpdated={handleTrialUpdated} isTrialExpired={isTrialExpired} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
