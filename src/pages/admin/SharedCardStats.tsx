import { useEffect, useState } from "react";
import { getAuthHeaders } from "../../utils/admin";
import { occasionLabel } from "../../data/greetingCards";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface Stats {
  totals: { shared: number; opened: number; try_taps: number; cards_with_try: number; senders: number; shared_30d: number; signups?: number; paying?: number };
  recent: { senderName: string; toName: string | null; occasionId: string; opens: number; tryTaps: number; signups?: number; createdAt: string }[];
  joined?: { name: string; senderName: string; paying: boolean; createdAt: string }[];
  topSharers: { name: string; shared: number; tryTaps: number; signups?: number }[];
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Loretta's count of cards members shared with people outside the WELL Collective:
// how many were made and opened, taps on "Try it free for 30 days", free trials started
// from a card, and how many of those people became paying members.
export default function SharedCardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/admin/cards/shared-stats`, { headers: getAuthHeaders() })
      .then(async (r) => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then((d) => setStats(d as Stats))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load"));
  }, []);

  const t = stats?.totals;
  const box = (n: number | undefined, label: string) => (
    <div className="flex-1 min-w-[72px] rounded-card bg-surface-2 border border-border px-2 py-2 text-center">
      <p className="text-lg font-semibold text-text">{n ?? "-"}</p>
      <p className="text-[11px] text-text-muted leading-tight">{label}</p>
    </div>
  );

  return (
    <div className="glass-card rounded-card px-4 py-3 mb-4 border border-border">
      <p className="text-sm font-semibold text-text">Cards shared outside the WELL Collective</p>
      <p className="text-xs text-text-muted mt-1">Cards members sent by link to friends who are not members yet.</p>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      <div className="flex flex-wrap gap-2 mt-3">
        {box(t?.shared, "cards shared")}
        {box(t?.opened, "opened")}
        {box(t?.try_taps, "tapped Try it free")}
        {box(t?.signups, "started a free trial")}
        {box(t?.paying, "now paying members")}
      </div>
      {stats?.joined && stats.joined.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-text">Joined from a card</p>
          {stats.joined.slice(0, 8).map((j, i) => (
            <p key={i} className="text-xs text-text-muted mt-1">
              {day(j.createdAt)}: {j.name} started a free trial from {j.senderName}'s card{j.paying ? ", now a paying member" : ""}
            </p>
          ))}
        </div>
      )}
      {stats && stats.topSharers.length > 0 && (
        <p className="text-xs text-text-muted mt-3">
          <span className="font-semibold text-text">Top sharers: </span>
          {stats.topSharers.map((p) => `${p.name} (${p.shared} shared${p.signups ? `, ${p.signups} joined` : ""})`).join(", ")}
        </p>
      )}
      {stats && stats.recent.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-text">Latest</p>
          {stats.recent.slice(0, 8).map((r, i) => (
            <p key={i} className="text-xs text-text-muted mt-1">
              {day(r.createdAt)}: {r.senderName} sent {occasionLabel(r.occasionId)}{r.toName ? ` to ${r.toName}` : ""}
              {" "}({r.opens ? `opened ${r.opens}x` : "not opened yet"}{r.tryTaps ? `, ${r.tryTaps} tapped Try it free` : ""}{r.signups ? `, ${r.signups} joined` : ""})
            </p>
          ))}
        </div>
      )}
      {stats && stats.recent.length === 0 && <p className="text-xs text-text-muted mt-3">No cards shared yet.</p>}
    </div>
  );
}
