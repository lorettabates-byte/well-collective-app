import { Plus, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/ui/Avatar";
import TopBar from "../../components/layout/TopBar";
import { SPECIAL_BADGES } from "../../data/badges";
import { formatDateLong } from "../../utils/format";

function deriveMemberId(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  return `m_${Math.abs(hash).toString(36)}`;
}

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("adminToken");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    const fallbackKey = import.meta.env.VITE_ADMIN_API_KEY as string | undefined;
    if (fallbackKey) {
      headers["x-admin-key"] = fallbackKey;
    }
  }
  return headers;
}

interface AdminMember {
  email: string;
  name: string;
  avatar?: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  updatedAt: string;
  grantedBadges?: string[];
}

export default function AdminMembers() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
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

  const isTrialExpired = (trialEndsAt?: string) => !!trialEndsAt && trialEndsAt < new Date().toISOString().slice(0, 10);

  const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";
  const sortedMembers = [...members].sort((a, b) =>
    firstName(a.name).localeCompare(firstName(b.name), undefined, { sensitivity: "base" })
  );

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
          <div className="flex flex-col gap-2.5">
            {sortedMembers.map((member) => {
              const granted = new Set(member.grantedBadges ?? []);
              return (
                <div key={member.email} className="glass-card rounded-card px-4 py-3 flex flex-col gap-2.5">
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
                      onClick={() => handleDelete(member.email)}
                      className="text-red-400 p-2 shrink-0"
                      aria-label={`Remove ${member.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SPECIAL_BADGES.map((badge) => {
                      const isGranted = granted.has(badge.id);
                      return (
                        <button
                          key={badge.id}
                          onClick={() => toggleBadge(member.email, badge.id, isGranted)}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
