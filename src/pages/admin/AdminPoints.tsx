import { Award, Check, ChevronDown, ClipboardList, Search, Star } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { getAuthHeaders } from "../../utils/admin";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface Member {
  email: string;
  name: string;
  well_cup_points: number;
}

interface ActivityRow {
  activity_type: string;
  points: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACTIVITY_LABELS: Record<string, string> = {
  app_open: "App open",
  forum_post: "Forum post",
  forum_reply: "Forum reply",
  forum_like: "Forum like received",
  breathwork: "Breathwork session",
  breathwork_complete: "Breathwork complete",
  well_check: "WELL Check",
  event_rsvp: "Event RSVP",
  event_checkin: "Event check-in",
  login_streak_bonus: "Streak bonus",
  admin_award: "Admin award",
  referral: "Referral",
  brain_game: "Brain game",
  retreat_booking: "Retreat booking",
};

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

  // Audit panel
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFocused, setAuditFocused] = useState(false);
  const [auditEmail, setAuditEmail] = useState("");
  const [auditDays, setAuditDays] = useState("30");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditRows, setAuditRows] = useState<ActivityRow[] | null>(null);

  const [spotlightSearch, setSpotlightSearch] = useState("");
  const [spotlightFocused, setSpotlightFocused] = useState(false);
  const [spotlightEmail, setSpotlightEmail] = useState("");
  const [spotlightSubmitting, setSpotlightSubmitting] = useState(false);
  const [spotlightSuccess, setSpotlightSuccess] = useState<string | null>(null);
  const [spotlightError, setSpotlightError] = useState<string | null>(null);

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

  const auditFiltered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(auditSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(auditSearch.toLowerCase())
  );
  const auditSelected = members.find((m) => m.email === auditEmail);

  const handleAuditLoad = async () => {
    if (!API_URL || !auditEmail) return;
    setAuditLoading(true);
    setAuditRows(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/member-activity?email=${encodeURIComponent(auditEmail)}&days=${auditDays}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setAuditRows(res.ok ? data.activities : []);
    } catch {
      setAuditRows([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const spotlightFiltered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(spotlightSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(spotlightSearch.toLowerCase())
  );
  const spotlightSelected = members.find((m) => m.email === spotlightEmail);

  const handleSpotlightOverride = async () => {
    if (!API_URL || !spotlightEmail) return;
    setSpotlightSubmitting(true);
    setSpotlightSuccess(null);
    setSpotlightError(null);
    try {
      const res = await fetch(`${API_URL}/api/points/leaderboard/spotlight-override`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: spotlightEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSpotlightError(data.error ?? "Failed to set spotlight");
      } else {
        setSpotlightSuccess(`Weekly Spotlight set to ${data.leader?.name ?? spotlightEmail}`);
      }
    } catch {
      setSpotlightError("Network error — try again");
    } finally {
      setSpotlightSubmitting(false);
    }
  };

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

        {/* Weekly Spotlight override */}
        <div className="glass-card rounded-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-0.5">
            <Star size={14} className="text-brand-light shrink-0" />
            <h3 className="text-sm font-bold text-text">Weekly Community Spotlight</h3>
          </div>
          <p className="text-xs text-text-muted -mt-1">Override this week's spotlight to any member. Takes effect immediately.</p>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={spotlightSearch}
              onChange={(e) => setSpotlightSearch(e.target.value)}
              onFocus={() => setSpotlightFocused(true)}
              onBlur={() => setSpotlightFocused(false)}
              className="w-full bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-brand-light"
            />
          </div>

          {(spotlightFocused || spotlightSearch) && (
            loading ? (
              <p className="text-xs text-text-dim px-1">Loading members…</p>
            ) : (
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
                {spotlightFiltered.map((m) => (
                  <button
                    key={m.email}
                    type="button"
                    onMouseDown={() => { setSpotlightEmail(m.email); setSpotlightSearch(""); setSpotlightFocused(false); }}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      spotlightEmail === m.email
                        ? "bg-brand-light/20 text-brand-light font-semibold border border-brand-light/40"
                        : "bg-surface-2 text-text hover:bg-surface-3"
                    }`}
                  >
                    {m.name} <span className="text-text-dim text-xs">{m.email}</span>
                  </button>
                ))}
              </div>
            )
          )}

          {spotlightSelected && (
            <p className="text-xs text-brand-light px-1">Selected: <strong>{spotlightSelected.name}</strong></p>
          )}

          {spotlightSuccess && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              <Check size={14} className="text-green-400 shrink-0" />
              <p className="text-xs text-green-400">{spotlightSuccess}</p>
            </div>
          )}
          {spotlightError && <p className="text-xs text-red-400 px-1">{spotlightError}</p>}

          <button
            type="button"
            onClick={handleSpotlightOverride}
            disabled={spotlightSubmitting || !spotlightEmail}
            className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {spotlightSubmitting ? "Saving…" : "Set as This Week's Spotlight"}
          </button>
        </div>

        {/* Member activity audit */}
        <div className="glass-card rounded-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-0.5">
            <ClipboardList size={14} className="text-brand-light shrink-0" />
            <h3 className="text-sm font-bold text-text">Member Activity Audit</h3>
          </div>
          <p className="text-xs text-text-muted -mt-1">See exactly how a member has been earning points and why.</p>

          {/* Member picker */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              onFocus={() => setAuditFocused(true)}
              onBlur={() => setTimeout(() => setAuditFocused(false), 150)}
              className="w-full bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text placeholder:text-text-dim outline-none focus:border-brand-light"
            />
          </div>
          {(auditFocused || auditSearch) && (
            <div className="max-h-40 overflow-y-auto flex flex-col gap-1 -mt-1">
              {auditFiltered.slice(0, 20).map((m) => (
                <button
                  key={m.email}
                  type="button"
                  onMouseDown={() => { setAuditEmail(m.email); setAuditSearch(""); setAuditFocused(false); setAuditRows(null); }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    auditEmail === m.email
                      ? "bg-brand-light/20 text-brand-light font-semibold border border-brand-light/40"
                      : "bg-surface-2 text-text hover:bg-surface-3"
                  }`}
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-text-dim text-xs ml-2">{m.email}</span>
                  <span className="text-text-dim text-xs ml-2">({m.well_cup_points} pts)</span>
                </button>
              ))}
            </div>
          )}
          {auditSelected && (
            <p className="text-xs text-brand-light px-1">Selected: <strong>{auditSelected.name}</strong></p>
          )}

          {/* Days selector + load button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={auditDays}
                onChange={(e) => setAuditDays(e.target.value)}
                className="w-full appearance-none bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-brand-light pr-8"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 365 days</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={handleAuditLoad}
              disabled={auditLoading || !auditEmail}
              className="gradient-brand text-white text-sm font-semibold rounded-lg px-4 disabled:opacity-50"
            >
              {auditLoading ? "Loading…" : "View"}
            </button>
          </div>

          {/* Results */}
          {auditRows !== null && (
            auditRows.length === 0 ? (
              <p className="text-xs text-text-dim px-1">No activity found in this period.</p>
            ) : (
              <div className="flex flex-col gap-0 border border-border rounded-lg overflow-hidden">
                {/* Summary row */}
                <div className="flex items-center justify-between px-3 py-2 bg-surface-3 border-b border-border">
                  <span className="text-xs font-semibold text-text-muted">{auditRows.length} events</span>
                  <span className="text-xs font-bold text-brand-light">
                    {auditRows.reduce((s, r) => s + r.points, 0).toLocaleString()} pts total
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {auditRows.map((row, i) => {
                    const label = ACTIVITY_LABELS[row.activity_type] ?? row.activity_type.replace(/_/g, " ");
                    const meta = row.metadata;
                    const detail = meta?.reason as string | undefined
                      ?? (meta?.streak != null ? `${meta.streak} day streak` : undefined)
                      ?? (meta?.event_name as string | undefined)
                      ?? (meta?.title as string | undefined);
                    const dt = new Date(row.created_at);
                    const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                    return (
                      <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text">{label}</p>
                          {detail && <p className="text-[11px] text-text-muted truncate">{detail}</p>}
                          <p className="text-[10px] text-text-dim">{dateStr} · {timeStr}</p>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${row.points >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {row.points >= 0 ? "+" : ""}{row.points}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>

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
