import { Award, Check, Search } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { getAuthHeaders } from "../../utils/admin";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface Member {
  email: string;
  name: string;
  well_cup_points: number;
}

export default function AdminPoints() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [selectedEmail, setSelectedEmail] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/admin/members`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : { members: [] }))
      .then((d) => {
        const list: Member[] = (d.members ?? []).map((m: { email: string; name: string; well_cup_points?: number }) => ({
          email: m.email,
          name: m.name,
          well_cup_points: m.well_cup_points ?? 0,
        }));
        setMembers(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!API_URL || !selectedEmail || !points || !reason) return;
    setSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/points/admin-award`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ memberEmail: selectedEmail, points: parseInt(points, 10), reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to award points");
      } else {
        const member = members.find((m) => m.email === selectedEmail);
        setSuccess(`Awarded ${points} pts to ${member?.name ?? selectedEmail}`);
        setPoints("");
        setReason("");
        setMembers((prev) =>
          prev.map((m) =>
            m.email === selectedEmail
              ? { ...m, well_cup_points: m.well_cup_points + parseInt(points, 10) }
              : m
          )
        );
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  };

  const selected = members.find((m) => m.email === selectedEmail);

  return (
    <div>
      <TopBar title="Award Points" subtitle="Manually give points to a member" icon={Award} iconColor="#0191CE" showBack />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Award form */}
        <form onSubmit={handleSubmit} className="glass-card rounded-card p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-text">Award Points</h3>

          {/* Member picker */}
          <div>
            <label className="text-xs text-text-muted mb-1 block">Member</label>
            <div className="relative mb-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-brand-light"
              />
            </div>
            {(isSearchFocused || search) && (
              loading ? (
                <p className="text-xs text-text-dim px-1">Loading members…</p>
              ) : (
                <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
                  {filtered.map((m) => (
                    <button
                      key={m.email}
                      type="button"
                      onClick={() => { setSelectedEmail(m.email); setSearch(""); setIsSearchFocused(false); }}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedEmail === m.email
                          ? "bg-brand-light/20 text-brand-light font-semibold border border-brand-light/40"
                          : "bg-surface-2 text-text hover:bg-surface-3"
                      }`}
                    >
                      <span className="font-medium">{m.name}</span>
                      <span className="text-text-dim text-xs ml-2">{m.email}</span>
                      <span className="text-text-dim text-xs ml-2">({m.well_cup_points} pts)</span>
                    </button>
                  ))}
                  {filtered.length === 0 && search && (
                    <p className="text-xs text-text-dim px-1">No members match "{search}"</p>
                  )}
                </div>
              )
            )}
            {selected && (
              <p className="text-xs text-brand-light mt-1 px-1">
                Selected: <strong>{selected.name}</strong> — currently {selected.well_cup_points} pts
              </p>
            )}
          </div>

          {/* Points amount */}
          <div>
            <label className="text-xs text-text-muted mb-1 block">Points (use negative to deduct)</label>
            <input
              type="number"
              placeholder="e.g. 50"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-brand-light"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs text-text-muted mb-1 block">Reason</label>
            <input
              type="text"
              placeholder="e.g. Referred 3 friends, attended retreat…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-brand-light"
            />
          </div>

          {success && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              <Check size={14} className="text-green-400 shrink-0" />
              <p className="text-xs text-green-400">{success}</p>
            </div>
          )}
          {error && (
            <p className="text-xs text-red-400 px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedEmail || !points || !reason}
            className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Awarding…" : "Award Points"}
          </button>
        </form>

        {/* Leaderboard snapshot */}
        <div className="glass-card rounded-card p-4">
          <h3 className="text-sm font-bold text-text mb-3">Member Points</h3>
          {loading ? (
            <p className="text-xs text-text-dim">Loading…</p>
          ) : (
            <div className="flex flex-col gap-2">
              {[...members]
                .sort((a, b) => b.well_cup_points - a.well_cup_points)
                .slice(0, 20)
                .map((m, i) => (
                  <div key={m.email} className="flex items-center gap-3">
                    <span className="text-xs text-text-dim w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{m.name}</p>
                      <p className="text-[11px] text-text-dim truncate">{m.email}</p>
                    </div>
                    <span className="text-sm font-bold text-brand-light">{m.well_cup_points} pts</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
