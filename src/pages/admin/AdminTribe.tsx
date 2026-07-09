import { Plus, Trash2, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { getAuthHeaders } from "../../utils/admin";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface TribeConnection {
  owner_email: string;
  owner_name: string | null;
  member_email: string;
  member_name: string | null;
  created_at: string;
}

export default function AdminTribe() {
  const [connections, setConnections] = useState<TribeConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");

  const [filterEmail, setFilterEmail] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  const load = () => {
    if (!API_URL) return;
    setLoading(true);
    fetch(`${API_URL}/api/admin/tribe-connections`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : { connections: [] }))
      .then((d) => setConnections(d.connections || []))
      .catch(() => setError("Failed to load — try logging out and back into Admin."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerEmail.trim() || !memberEmail.trim() || !API_URL) return;
    setSaving(true);
    setAddError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/tribe-connections`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ownerEmail: ownerEmail.trim(), memberEmail: memberEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setAddError(data.error || "Failed to add"); return; }
      setOwnerEmail("");
      setMemberEmail("");
      setShowAdd(false);
      load();
    } catch {
      setAddError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (oe: string, me: string) => {
    if (!API_URL) return;
    const key = `${oe}→${me}`;
    setRemoving(key);
    try {
      await fetch(`${API_URL}/api/admin/tribe-connections`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ownerEmail: oe, memberEmail: me }),
      });
      setConnections((prev) => prev.filter((c) => !(c.owner_email === oe && c.member_email === me)));
    } catch { /* no-op */ } finally {
      setRemoving(null);
    }
  };

  const filtered = filterEmail.trim()
    ? connections.filter(
        (c) =>
          c.owner_email.includes(filterEmail.toLowerCase()) ||
          c.member_email.includes(filterEmail.toLowerCase()) ||
          (c.owner_name || "").toLowerCase().includes(filterEmail.toLowerCase()) ||
          (c.member_name || "").toLowerCase().includes(filterEmail.toLowerCase())
      )
    : connections;

  // Group by owner for a readable display
  const byOwner = filtered.reduce<Record<string, TribeConnection[]>>((acc, c) => {
    (acc[c.owner_email] = acc[c.owner_email] || []).push(c);
    return acc;
  }, {});

  return (
    <div>
      <TopBar title="Tribe Connections" subtitle="View and restore tribe memberships" icon={Users} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4 pb-8">

        <div className="glass-card rounded-card px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Total Connections</p>
          <p className="text-lg font-bold text-brand-light">{loading ? "…" : connections.length}</p>
        </div>

        {/* Add connection */}
        <button
          onClick={() => { setShowAdd((v) => !v); setAddError(""); }}
          className="flex items-center justify-center gap-2 text-sm font-semibold gradient-brand text-white rounded-pill py-2.5 w-full mb-4"
        >
          {showAdd ? <X size={16} /> : <Plus size={16} />}
          {showAdd ? "Cancel" : "Restore / Add Tribe Connection"}
        </button>

        {showAdd && (
          <form onSubmit={handleAdd} className="glass-card rounded-card p-4 flex flex-col gap-3 mb-5">
            <p className="text-xs text-text-muted">No notification is sent. Use this to restore lost connections or add someone manually.</p>
            {addError && <p className="text-xs text-red-400">{addError}</p>}
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Whose tribe? (owner email)</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="loretta@lorettabates.com"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Who to add to their tribe? (member email)</label>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="member@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !ownerEmail.trim() || !memberEmail.trim()}
              className="flex items-center justify-center gap-2 text-sm font-semibold gradient-brand text-white rounded-pill py-2.5 disabled:opacity-50"
            >
              <Users size={16} />
              {saving ? "Saving…" : "Add Connection (silent)"}
            </button>
          </form>
        )}

        {/* Filter */}
        {connections.length > 0 && (
          <input
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            placeholder="Filter by name or email…"
            className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue mb-4"
          />
        )}

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        {loading && <p className="text-xs text-text-muted text-center py-8">Loading…</p>}

        {!loading && connections.length === 0 && (
          <div className="glass-card rounded-card p-6 text-center">
            <p className="text-sm font-semibold text-text mb-1">No tribe connections found</p>
            <p className="text-xs text-text-muted">The tribe_members table is empty. Use the form above to restore connections manually.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {Object.entries(byOwner).map(([ownerEmail, conns]) => (
            <div key={ownerEmail} className="glass-card rounded-card px-4 py-3">
              <p className="text-sm font-bold text-text mb-0.5">
                {conns[0].owner_name || ownerEmail}
              </p>
              <p className="text-[11px] text-text-muted mb-3">{ownerEmail} — {conns.length} tribe member{conns.length === 1 ? "" : "s"}</p>
              <div className="flex flex-col gap-2">
                {conns.map((c) => (
                  <div key={c.member_email} className="flex items-center justify-between gap-2 bg-surface-2 rounded-card px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{c.member_name || "[Removed Member]"}</p>
                      <p className="text-[11px] text-text-muted truncate">{c.member_email}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(ownerEmail, c.member_email)}
                      disabled={removing === `${ownerEmail}→${c.member_email}`}
                      className="text-red-400 p-1.5 shrink-0 disabled:opacity-40"
                      aria-label="Remove connection"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
