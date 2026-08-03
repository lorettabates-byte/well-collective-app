import { AlertCircle, CheckCircle2, Loader2, Mail, RefreshCw, Send, Trash2, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { getAuthHeaders } from "../../utils/admin";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const WINBACK_CODE = "WELL-LORETT-BE1D";

interface CampaignMember { email: string; name: string }

interface CampaignPreview {
  notOnApp: CampaignMember[];
  lapsed: CampaignMember[];
}

interface PushDiagnostic {
  email: string;
  member: { name: string; membership_status: string; trial_ends_at: string | null } | null;
  subscriptionCount: number;
  subscriptions: Array<{ platform: string; endpoint: string; registeredAt: string }>;
}

function MemberList({
  members,
  selected,
  onToggle,
  onToggleAll,
}: {
  members: CampaignMember[];
  selected: Set<string>;
  onToggle: (email: string) => void;
  onToggleAll: () => void;
}) {
  const allSelected = members.length > 0 && members.every((m) => selected.has(m.email));
  return (
    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
      <label className="flex items-center gap-2 px-2 py-1.5 text-xs text-text-muted cursor-pointer">
        <input type="checkbox" checked={allSelected} onChange={onToggleAll} className="accent-brand" />
        Select all ({members.length})
      </label>
      {members.map((m) => (
        <label key={m.email} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.has(m.email)}
            onChange={() => onToggle(m.email)}
            className="accent-brand"
          />
          <span className="text-sm text-text font-medium flex-1">{m.name}</span>
          <span className="text-xs text-text-muted">{m.email}</span>
        </label>
      ))}
    </div>
  );
}

export default function AdminCampaign() {
  const [preview, setPreview] = useState<CampaignPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [selectedInvite, setSelectedInvite] = useState<Set<string>>(new Set());
  const [selectedWinback, setSelectedWinback] = useState<Set<string>>(new Set());

  const [sendingInvite, setSendingInvite] = useState(false);
  const [sendingWinback, setSendingWinback] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [winbackResult, setWinbackResult] = useState<string | null>(null);

  // Push diagnostic
  const [diagEmail, setDiagEmail] = useState("danielle.gaillard@gmail.com");
  const [diagLoading, setDiagLoading] = useState(false);
  const [diag, setDiag] = useState<PushDiagnostic | null>(null);
  const [diagError, setDiagError] = useState("");

  // Tribe prune
  const [pruning, setPruning] = useState(false);
  const [pruneResult, setPruneResult] = useState<string | null>(null);

  const loadPreview = async () => {
    if (!API_URL) return;
    setLoading(true);
    setPreviewError("");
    setPreview(null);
    setInviteResult(null);
    setWinbackResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/campaign-preview`, { headers: getAuthHeaders() });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json() as CampaignPreview;
      setPreview(data);
      setSelectedInvite(new Set(data.notOnApp.map((m) => m.email)));
      setSelectedWinback(new Set(data.lapsed.map((m) => m.email)));
    } catch (err: unknown) {
      setPreviewError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (set: Set<string>, email: string): Set<string> => {
    const next = new Set(set);
    if (next.has(email)) next.delete(email); else next.add(email);
    return next;
  };

  const toggleAll = (members: CampaignMember[], selected: Set<string>, setSelected: (s: Set<string>) => void) => {
    if (members.every((m) => selected.has(m.email))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map((m) => m.email)));
    }
  };

  const sendInvites = async () => {
    if (!API_URL || selectedInvite.size === 0 || !preview) return;
    setSendingInvite(true);
    setInviteResult(null);
    try {
      const emails = preview.notOnApp.filter((m) => selectedInvite.has(m.email));
      const res = await fetch(`${API_URL}/api/admin/campaign-send-app-invite`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      setInviteResult(`Sent ${data.sent} email${data.sent !== 1 ? "s" : ""}${data.errors?.length ? ` (${data.errors.length} failed)` : ""}`);
    } catch {
      setInviteResult("Send failed — check server logs");
    } finally {
      setSendingInvite(false);
    }
  };

  const sendWinbacks = async () => {
    if (!API_URL || selectedWinback.size === 0 || !preview) return;
    setSendingWinback(true);
    setWinbackResult(null);
    try {
      const emails = preview.lapsed.filter((m) => selectedWinback.has(m.email));
      const res = await fetch(`${API_URL}/api/admin/campaign-send-winback`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ emails, referralCode: WINBACK_CODE }),
      });
      const data = await res.json();
      setWinbackResult(`Sent ${data.sent} email${data.sent !== 1 ? "s" : ""}${data.errors?.length ? ` (${data.errors.length} failed)` : ""}`);
    } catch {
      setWinbackResult("Send failed — check server logs");
    } finally {
      setSendingWinback(false);
    }
  };

  const runDiag = async () => {
    if (!API_URL || !diagEmail) return;
    setDiagLoading(true);
    setDiag(null);
    setDiagError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/push-diagnostic/${encodeURIComponent(diagEmail)}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDiag(await res.json() as PushDiagnostic);
    } catch (err: unknown) {
      setDiagError(err instanceof Error ? err.message : "Diagnostic failed");
    } finally {
      setDiagLoading(false);
    }
  };

  const pruneTribe = async () => {
    if (!API_URL) return;
    setPruning(true);
    setPruneResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/prune-tribe-now`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setPruneResult(`Removed ${data.removed} expired member${data.removed !== 1 ? "s" : ""} from tribes`);
    } catch {
      setPruneResult("Prune failed — check server logs");
    } finally {
      setPruning(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar title="Member Campaign" />
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-6">

        {/* ── Push Diagnostic ───────────────────────────── */}
        <section className="bg-surface rounded-card p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-text">Push Notification Diagnostic</h2>
            <p className="text-xs text-text-muted mt-0.5">Check whether a member has a registered push subscription</p>
          </div>
          <div className="flex gap-2">
            <input
              value={diagEmail}
              onChange={(e) => setDiagEmail(e.target.value)}
              placeholder="member@email.com"
              className="flex-1 bg-surface-2 border border-border rounded-pill px-3 py-2 text-sm text-text"
            />
            <button
              onClick={runDiag}
              disabled={diagLoading}
              className="flex items-center gap-1.5 text-sm font-semibold text-white gradient-brand rounded-pill px-4 py-2 disabled:opacity-60"
            >
              {diagLoading ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
              Check
            </button>
          </div>
          {diagError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-card px-3 py-2">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{diagError}</p>
            </div>
          )}
          {diag && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface-2 rounded-card px-3 py-2">
                  <p className="text-text-muted">Member</p>
                  <p className="font-semibold text-text">{diag.member?.name ?? "Not in app"}</p>
                </div>
                <div className="bg-surface-2 rounded-card px-3 py-2">
                  <p className="text-text-muted">Subscriptions</p>
                  <p className={`font-semibold ${diag.subscriptionCount > 0 ? "text-green-400" : "text-red-400"}`}>
                    {diag.subscriptionCount > 0 ? `${diag.subscriptionCount} registered` : "None — not subscribed"}
                  </p>
                </div>
              </div>
              {diag.subscriptions.map((s, i) => (
                <div key={i} className="bg-surface-2 rounded-card px-3 py-2 text-xs flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {s.platform.includes("Android") ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} className="text-text-muted" />}
                    <span className="font-semibold text-text">{s.platform}</span>
                    <span className="text-text-muted ml-auto">{new Date(s.registeredAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-text-muted font-mono">{s.endpoint}</p>
                </div>
              ))}
              {diag.subscriptionCount === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-card px-3 py-2 text-xs text-amber-400 flex flex-col gap-1">
                  <p className="font-semibold">No push subscription on file</p>
                  <p>Ask Danielle to open the app, go to Profile → Notifications, turn them OFF then back ON. This re-registers the subscription.</p>
                  <p className="mt-1 font-semibold">Samsung battery fix (most common cause):</p>
                  <p>Settings → Battery → More battery settings → App power management → find Chrome → set to "Don't restrict." Then restart the app.</p>
                </div>
              )}
              {diag.subscriptionCount > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-card px-3 py-2 text-xs text-blue-300">
                  <p className="font-semibold">Subscription exists.</p>
                  <p className="mt-1">If she's still not receiving notifications, Samsung's battery saver is likely killing Chrome's push service in the background. Fix: Settings → Battery → More battery settings → App power management → Chrome → "Don't restrict." Also check Settings → Apps → Chrome → Notifications → all enabled.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Tribe Prune ───────────────────────────────── */}
        <section className="bg-surface rounded-card p-5 flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-bold text-text">WELL Tribe Cleanup</h2>
            <p className="text-xs text-text-muted mt-0.5">Removes expired trial and lapsed members from all WELL Tribes immediately. (Also runs nightly at 2am ET automatically.)</p>
          </div>
          <button
            onClick={pruneTribe}
            disabled={pruning}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white gradient-brand rounded-pill py-2.5 disabled:opacity-60"
          >
            {pruning ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {pruning ? "Pruning…" : "Prune Tribes Now"}
          </button>
          {pruneResult && (
            <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-card px-3 py-2">
              <CheckCircle2 size={14} className="text-green-400 shrink-0" />
              <p className="text-xs text-text">{pruneResult}</p>
            </div>
          )}
        </section>

        {/* ── Campaign Preview ──────────────────────────── */}
        <section className="bg-surface rounded-card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-text">Member Email Campaign</h2>
              <p className="text-xs text-text-muted mt-0.5">Pulls active + lapsed member lists from the video library WordPress</p>
            </div>
            <button
              onClick={loadPreview}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-white gradient-brand rounded-pill px-3 py-1.5 disabled:opacity-60 shrink-0"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {loading ? "Loading…" : preview ? "Refresh" : "Load Lists"}
            </button>
          </div>

          {previewError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-card px-3 py-2">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-400">
                <p className="font-semibold">{previewError}</p>
                {previewError.includes("snippet") && (
                  <p className="mt-1">Make sure the <code className="bg-red-900/30 px-1 rounded">well/v1/all-members</code> Code Snippet is installed on the video library WordPress.</p>
                )}
              </div>
            </div>
          )}

          {preview && (
            <>
              {/* Group A: Active members not on app */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text">Active members not on the app</p>
                    <p className="text-xs text-text-muted">{preview.notOnApp.length} members — will receive the app invite email</p>
                  </div>
                  <span className="text-xs font-bold text-brand-light bg-brand/10 px-2 py-0.5 rounded-full">{preview.notOnApp.length}</span>
                </div>
                {preview.notOnApp.length > 0 ? (
                  <div className="border border-border rounded-card overflow-hidden">
                    <MemberList
                      members={preview.notOnApp}
                      selected={selectedInvite}
                      onToggle={(e) => setSelectedInvite(toggle(selectedInvite, e))}
                      onToggleAll={() => toggleAll(preview.notOnApp, selectedInvite, setSelectedInvite)}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic px-2">All active WC members are already on the app!</p>
                )}
                {preview.notOnApp.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="bg-surface-2 rounded-card px-3 py-2 text-xs text-text-muted">
                      <strong className="text-text">Subject:</strong> Your membership includes this — have you tried it? 📱<br />
                      <strong className="text-text">From:</strong> Loretta Bates &lt;well@lorettabates.com&gt;
                    </div>
                    <button
                      onClick={sendInvites}
                      disabled={sendingInvite || selectedInvite.size === 0}
                      className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white gradient-brand rounded-pill py-2.5 disabled:opacity-60"
                    >
                      {sendingInvite ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {sendingInvite ? "Sending…" : `Send to ${selectedInvite.size} member${selectedInvite.size !== 1 ? "s" : ""}`}
                    </button>
                    {inviteResult && (
                      <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-card px-3 py-2">
                        <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                        <p className="text-xs text-text">{inviteResult}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* Group B: Lapsed members */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-text">Lapsed members</p>
                    <p className="text-xs text-text-muted">{preview.lapsed.length} members — will receive winback email with code <code className="bg-surface-2 px-1 rounded">{WINBACK_CODE}</code></p>
                  </div>
                  <span className="text-xs font-bold text-brand-light bg-brand/10 px-2 py-0.5 rounded-full">{preview.lapsed.length}</span>
                </div>
                {preview.lapsed.length > 0 ? (
                  <div className="border border-border rounded-card overflow-hidden">
                    <MemberList
                      members={preview.lapsed}
                      selected={selectedWinback}
                      onToggle={(e) => setSelectedWinback(toggle(selectedWinback, e))}
                      onToggleAll={() => toggleAll(preview.lapsed, selectedWinback, setSelectedWinback)}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic px-2">No lapsed members found.</p>
                )}
                {preview.lapsed.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="bg-surface-2 rounded-card px-3 py-2 text-xs text-text-muted">
                      <strong className="text-text">Subject:</strong> You're invited back - one month on me<br />
                      <strong className="text-text">Code included:</strong> <span className="text-brand-light font-mono">{WINBACK_CODE}</span> (30-day free trial)
                    </div>
                    <button
                      onClick={sendWinbacks}
                      disabled={sendingWinback || selectedWinback.size === 0}
                      className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white gradient-brand rounded-pill py-2.5 disabled:opacity-60"
                    >
                      {sendingWinback ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      {sendingWinback ? "Sending…" : `Send to ${selectedWinback.size} member${selectedWinback.size !== 1 ? "s" : ""}`}
                    </button>
                    {winbackResult && (
                      <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-card px-3 py-2">
                        <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                        <p className="text-xs text-text">{winbackResult}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

      </div>
    </div>
  );
}
