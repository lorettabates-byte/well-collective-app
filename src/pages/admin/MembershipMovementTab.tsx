import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminToken } from "../../utils/adminAuth";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

type Source = "website" | "app_store" | "google_play";
type Counts = Record<Source | "total", number>;

interface Person {
  name: string;
  email: string;
  source: Source;
  sourceLabel: string;
  date: string;
  memberSince: string | null;
  tenure: string | null;
  accessUntil: string | null;
  storeReason: string | null;
  reason: string | null;
  note: string | null;
  askedVia: string | null;
}

interface Movement {
  month: string;
  months: string[];
  counts: { joined: Counts; cancelled: Counts; ended: Counts; resumed: Counts };
  activeNow: Counts | null;
  joined: Person[];
  cancelled: Person[];
  ended: Person[];
  reasons: { key: string; label: string; count: number }[];
  reasonNotes: { reason: string; note: string; date: string }[];
}

const SOURCES: { id: Source; label: string; color: string }[] = [
  { id: "website", label: "lorettabates.com", color: "#84D8FD" },
  { id: "app_store", label: "App Store", color: "#0191CE" },
  { id: "google_play", label: "Google Play", color: "#34d399" },
];

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }) : "";

const monthLabel = (m: string) =>
  new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

function SourceChip({ p }: { p: Person }) {
  const s = SOURCES.find((x) => x.id === p.source);
  return (
    <span
      className="text-[11px] font-semibold rounded-pill px-2 py-0.5 border shrink-0"
      style={{ color: s?.color, borderColor: `${s?.color}55`, background: `${s?.color}14` }}
    >
      {p.sourceLabel}
    </span>
  );
}

function CountCard({ title, counts, tone }: { title: string; counts: Counts; tone: string }) {
  return (
    <div className="glass-card rounded-card p-4 flex-1 min-w-[140px]">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold mt-1 tabular-nums" style={{ color: tone }}>{counts.total}</p>
      <div className="mt-2 flex flex-col gap-0.5">
        {SOURCES.map((s) => (
          <div key={s.id} className="flex justify-between text-[13px]">
            <span className="text-text-muted">{s.label}</span>
            <span className="text-text font-semibold tabular-nums">{counts[s.id]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonRow({ p, kind }: { p: Person; kind: "joined" | "cancelled" | "ended" }) {
  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text truncate">{p.name}</p>
          <p className="text-[13px] text-text-dim truncate">{p.email}</p>
        </div>
        <SourceChip p={p} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-text-muted">
        <span>{kind === "joined" ? "Joined" : kind === "cancelled" ? "Cancelled" : "Ended"} {fmtDate(p.date)}</span>
        {kind !== "joined" && <span>Member for {p.tenure}</span>}
        {kind === "cancelled" && p.accessUntil && <span>Access until {fmtDate(p.accessUntil)}</span>}
      </div>
      {kind !== "joined" && (
        <div className="mt-1.5 text-[13px]">
          {p.reason ? (
            <p className="text-text">
              <span className="text-text-muted">Why: </span>
              {p.reason}
              {p.note ? <span className="text-text-muted">, "{p.note}"</span> : null}
            </p>
          ) : (
            <p className="text-text-dim">Why: no answer yet</p>
          )}
          {p.storeReason && <p className="text-text-dim">Store says: {p.storeReason}</p>}
        </div>
      )}
    </div>
  );
}

function Section({ title, people, kind, empty }: { title: string; people: Person[]; kind: "joined" | "cancelled" | "ended"; empty: string }) {
  return (
    <div className="glass-card rounded-card p-4">
      <p className="text-sm font-bold text-text mb-1">{title}</p>
      {people.length === 0 ? <p className="text-[13px] text-text-dim py-2">{empty}</p> : people.map((p) => <PersonRow key={`${p.email}-${p.date}`} p={p} kind={kind} />)}
    </div>
  );
}

export default function MembershipMovementTab() {
  const navigate = useNavigate();
  const [month, setMonth] = useState<string>("");
  const [data, setData] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!API_URL) return;
    setLoading(true);
    setError("");
    const adminKey = getAdminToken() ?? localStorage.getItem("adminToken") ?? "";
    fetch(`${API_URL}/api/analytics/membership-movement${month ? `?month=${month}` : ""}`, {
      headers: { Authorization: `Bearer ${adminKey}` },
    })
      .then((r) => {
        if (r.status === 401) { navigate("/admin/login"); return null; }
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d: Movement | null) => { if (d) { setData(d); if (!month) setMonth(d.month); } })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [month]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return <div className="glass-card rounded-card p-4 text-center text-[13px] text-red-400">Could not load joins and cancels: {error || "no data"}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-bold text-text">{monthLabel(data.month)}</p>
        <select
          value={month || data.month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Choose month"
          className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-[13px] text-text focus:outline-none focus:border-brand-light"
        >
          {data.months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      <div className="flex gap-3 flex-wrap">
        <CountCard title="Joined" counts={data.counts.joined} tone="#34d399" />
        <CountCard title="Cancelled" counts={data.counts.cancelled} tone="#f87171" />
      </div>
      {data.activeNow && (
        <p className="text-[13px] text-text-muted">
          Paying right now: <span className="text-text font-semibold">{data.activeNow.total}</span> ({data.activeNow.website} website, {data.activeNow.app_store} App Store, {data.activeNow.google_play} Google Play)
        </p>
      )}

      <div className="glass-card rounded-card p-4">
        <p className="text-sm font-bold text-text mb-2">Why people are leaving</p>
        {data.reasons.length === 0 ? (
          <p className="text-[13px] text-text-dim">No answers yet this month.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.reasons.map((r) => {
              const max = Math.max(...data.reasons.map((x) => x.count));
              return (
                <div key={r.key}>
                  <div className="flex justify-between text-[13px]"><span className="text-text">{r.label}</span><span className="text-text font-semibold tabular-nums">{r.count}</span></div>
                  <div className="h-1.5 bg-surface-2 rounded-full mt-1 overflow-hidden"><div className="h-full rounded-full bg-[#f87171]" style={{ width: `${(r.count / max) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
        {data.reasonNotes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
            {data.reasonNotes.map((n, i) => (
              <p key={i} className="text-[13px] text-text">"{n.note}" <span className="text-text-dim">({n.reason}, {fmtDate(n.date)})</span></p>
            ))}
          </div>
        )}
      </div>

      <Section title="Who cancelled" people={data.cancelled} kind="cancelled" empty="Nobody cancelled this month." />
      <Section title="Who joined" people={data.joined} kind="joined" empty="No new paying members yet this month." />
      <Section title="Memberships that ended" people={data.ended} kind="ended" empty="No memberships ended this month." />
      <p className="text-[13px] text-text-dim">"Cancelled" is when someone turns off renewal. They keep access until their paid time runs out, then it shows under "ended".</p>
    </div>
  );
}
