import { useEffect, useState } from "react";
import { getAuthHeaders } from "../../utils/admin";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface BroadcastResult {
  dryRun: boolean;
  wouldSend: number;
  alreadyHaveOne: number;
  skippedTestOrAdminAccounts: number;
  started?: boolean;
  sample?: string[];
  lastRun?: { sent?: number; planned?: number; finishedAt?: string } | null;
  error?: string;
}

interface ScheduledSend { at: string; onlyEmail?: string; done?: string; cancelled?: boolean }

const whenText = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET";

// One-time send of Loretta's welcome card to every current member, to
// announce the new cards. Check first, then send. Nobody gets it twice.
export default function WelcomeCardBroadcast() {
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [error, setError] = useState("");
  const [schedule, setSchedule] = useState<ScheduledSend[] | null>(null);

  const scheduleCall = async (body?: { cancel: true }) => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/cards/welcome-schedule`, body
        ? { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(body) }
        : { headers: getAuthHeaders() });
      const data = (await res.json().catch(() => ({}))) as { schedule?: ScheduledSend[] };
      if (res.ok && data.schedule) setSchedule(data.schedule);
    } catch {
      /* the schedule box just stays hidden */
    }
  };
  useEffect(() => { scheduleCall(); }, []);
  const pending = (schedule ?? []).filter((s) => !s.done && !s.cancelled);

  const call = async (body: { dryRun: boolean; onlyEmail?: string }) => {
    if (!API_URL) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/cards/welcome-broadcast`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as BroadcastResult;
      if (!res.ok) setError(data.error || `Error ${res.status}`);
      else setResult(data);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const sendAll = () => {
    const n = result?.wouldSend ?? 0;
    if (!window.confirm(`Send Loretta's welcome card to ${n} members now? Each person gets it once.`)) return;
    call({ dryRun: false });
  };

  return (
    <div className="glass-card rounded-card px-4 py-3 mb-4 border border-border">
      <p className="text-sm font-semibold text-text">Welcome card for current members</p>
      <p className="text-xs text-text-muted mt-1">
        Sends Loretta's welcome card once to everyone who is a member right now, to show off the new cards. Check first, then send.
      </p>
      {schedule && schedule.length > 0 && (
        <div className="mt-3 rounded-card bg-surface-2 border border-border px-3 py-2">
          <p className="text-xs font-semibold text-text">Scheduled</p>
          {schedule.map((s) => (
            <p key={s.at + (s.onlyEmail ?? "")} className="text-xs text-text-muted mt-1">
              {whenText(s.at)}: {s.onlyEmail ? `test to ${s.onlyEmail}` : "everyone"}
              {s.done ? " (sent)" : s.cancelled ? " (cancelled)" : ""}
            </p>
          ))}
          {pending.length > 0 && (
            <button
              onClick={() => { if (window.confirm("Cancel the scheduled welcome-card sends?")) scheduleCall({ cancel: true }); }}
              className="text-xs font-semibold glass-card border border-border text-text rounded-pill px-3 py-1.5 mt-2"
            >
              Cancel scheduled sends
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        <button disabled={busy} onClick={() => call({ dryRun: true })} className="text-xs font-semibold glass-card border border-border text-text rounded-pill px-3 py-1.5 disabled:opacity-50">
          Check how many
        </button>
        <button
          disabled={busy || !result?.dryRun || !result.wouldSend}
          onClick={sendAll}
          className="text-xs font-semibold gradient-brand text-white rounded-pill px-3 py-1.5 disabled:opacity-40"
        >
          Send to everyone
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        <input
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="Test send to one email"
          className="flex-1 min-w-0 bg-surface-2 border border-border rounded-pill px-3 py-1.5 text-xs text-text placeholder:text-text-dim"
        />
        <button
          disabled={busy || !testEmail.includes("@")}
          onClick={() => call({ dryRun: false, onlyEmail: testEmail.trim() })}
          className="text-xs font-semibold glass-card border border-border text-text rounded-pill px-3 py-1.5 disabled:opacity-50"
        >
          Send test
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      {result && (
        <p className="text-xs text-text-muted mt-2">
          {result.dryRun
            ? `Would send to ${result.wouldSend}. Already have one: ${result.alreadyHaveOne}. Skipped test or admin accounts: ${result.skippedTestOrAdminAccounts}.`
            : `Sending to ${result.wouldSend} now, one at a time. It can take a few minutes.`}
          {result.lastRun?.finishedAt ? ` Last run: ${result.lastRun.sent ?? 0} sent.` : ""}
        </p>
      )}
    </div>
  );
}
