import { Plus, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import Avatar from "../../components/ui/Avatar";
import TopBar from "../../components/layout/TopBar";
import { formatDateLong } from "../../utils/format";

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

  return (
    <div>
      <TopBar title="Members" subtitle="View, add, and remove members" showBack />
      <div className="px-4 pt-4">
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
            {members.map((member) => (
              <div key={member.email} className="glass-card rounded-card px-4 py-3 flex items-center gap-3">
                <Avatar src={member.avatar ?? ""} alt={member.name} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{member.name}</p>
                  <p className="text-xs text-text-muted truncate">{member.email}</p>
                  {member.trialEndsAt && (
                    <p className={`text-[11px] mt-0.5 ${isTrialExpired(member.trialEndsAt) ? "text-red-400" : "text-brand-light"}`}>
                      {isTrialExpired(member.trialEndsAt) ? "Trial expired " : "Trial ends "}
                      {formatDateLong(member.trialEndsAt)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(member.email)}
                  className="text-red-400 p-2 shrink-0"
                  aria-label={`Remove ${member.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
