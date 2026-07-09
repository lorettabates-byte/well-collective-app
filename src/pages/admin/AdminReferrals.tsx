import { CheckCircle2, Gift, Mail, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { getAuthHeaders } from "../../utils/admin";
import { formatDateLong } from "../../utils/format";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface ReferralRecord {
  referrerEmail: string;
  referrerName?: string;
  referredEmail: string;
  referredName?: string;
  createdAt: string;
  convertedAt?: string;
  signupBonusAwarded: boolean;
  conversionBonusAwarded: boolean;
}

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showManual, setShowManual] = useState(false);
  const [manualReferrer, setManualReferrer] = useState("");
  const [manualReferred, setManualReferred] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualSuccess, setManualSuccess] = useState("");

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/referrals/admin/list`, { headers: getAuthHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setReferrals(d.referrals))
      .catch(() => setError("Failed to load referrals — try logging out and back into Admin."))
      .finally(() => setLoading(false));
  }, []);

  const conversions = referrals.filter((r) => r.convertedAt).length;

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReferrer.trim() || !manualReferred.trim() || !API_URL) return;
    setManualSaving(true);
    setManualError("");
    setManualSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/referrals/admin/manual`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          referrerEmail: manualReferrer.trim(),
          referredEmail: manualReferred.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setManualError(data.error || "Failed to apply referral");
        return;
      }
      setManualSuccess(`Done! ${manualReferred.trim()} now has a 30-day trial ending ${data.trialEndsAt}. Both members received 25 pts.`);
      setManualReferrer("");
      setManualReferred("");
      // Refresh the referral list
      if (API_URL) {
        fetch(`${API_URL}/api/referrals/admin/list`, { headers: getAuthHeaders() })
          .then((r) => r.json())
          .then((d) => setReferrals(d.referrals))
          .catch(() => {});
      }
    } catch {
      setManualError("Network error — please try again");
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <div>
      <TopBar title="Referrals" subtitle="Friend invites & conversions" icon={Gift} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-lg font-bold text-text">{referrals.length}</p>
            <p className="text-[11px] text-text-muted">Total referrals</p>
          </div>
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-lg font-bold text-text">{conversions}</p>
            <p className="text-[11px] text-text-muted">Converted to paid</p>
          </div>
        </div>

        {/* Manual referral */}
        <button
          onClick={() => { setShowManual((v) => !v); setManualError(""); setManualSuccess(""); }}
          className="flex items-center justify-center gap-2 text-sm font-semibold gradient-brand text-white rounded-pill py-2.5 w-full mb-4"
        >
          {showManual ? <X size={16} /> : <Plus size={16} />}
          {showManual ? "Cancel" : "Add Manual Referral"}
        </button>

        {showManual && (
          <form onSubmit={submitManual} className="glass-card rounded-card p-4 flex flex-col gap-3 mb-5">
            <p className="text-xs text-text-muted">Enter both email addresses. The referred member will receive a 30-day trial and both will get 25 bonus points.</p>
            {manualError && <p className="text-xs text-red-400">{manualError}</p>}
            {manualSuccess && <p className="text-xs text-green-400">{manualSuccess}</p>}
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Referrer email (person who shared the link)</label>
              <input
                type="email"
                value={manualReferrer}
                onChange={(e) => setManualReferrer(e.target.value)}
                placeholder="celine@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Referred email (person who signed up)</label>
              <input
                type="email"
                value={manualReferred}
                onChange={(e) => setManualReferred(e.target.value)}
                placeholder="sister@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
              />
            </div>
            <button
              type="submit"
              disabled={manualSaving || !manualReferrer.trim() || !manualReferred.trim()}
              className="flex items-center justify-center gap-2 text-sm font-semibold gradient-brand text-white rounded-pill py-2.5 disabled:opacity-50"
            >
              <Gift size={16} />
              {manualSaving ? "Applying…" : "Apply Referral"}
            </button>
          </form>
        )}


        {loading && <p className="text-xs text-text-muted text-center">Loading…</p>}
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}

        {!loading && !error && referrals.length === 0 && (
          <p className="text-xs text-text-muted text-center">No referrals yet.</p>
        )}

        <div className="flex flex-col gap-2.5 pb-6">
          {referrals.map((r, i) => (
            <div key={i} className="glass-card rounded-card px-4 py-3.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    {r.referredName || r.referredEmail}
                  </p>
                  <a
                    href={`mailto:${r.referredEmail}`}
                    className="text-brand-light shrink-0"
                    aria-label={`Email ${r.referredName || r.referredEmail}`}
                  >
                    <Mail size={13} />
                  </a>
                </div>
                {r.convertedAt && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400 shrink-0">
                    <CheckCircle2 size={13} />
                    Converted
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
                Referred by{" "}
                <a href={`mailto:${r.referrerEmail}`} className="text-text hover:text-brand-light">
                  {r.referrerName || r.referrerEmail}
                </a>
              </p>
              <div className="flex items-center gap-3 text-[11px] text-text-dim">
                <span>Joined {formatDateLong(r.createdAt)}</span>
                {r.convertedAt && <span>Converted {formatDateLong(r.convertedAt)}</span>}
              </div>
              <div className="flex gap-2 mt-2">
                <span className={`text-[10px] font-semibold rounded-pill px-2 py-0.5 ${r.signupBonusAwarded ? "bg-brand-light/10 text-brand-light" : "bg-surface-2 text-text-dim"}`}>
                  {r.signupBonusAwarded ? "25 pts awarded" : "Signup bonus pending"}
                </span>
                {r.convertedAt && (
                  <span className={`text-[10px] font-semibold rounded-pill px-2 py-0.5 ${r.conversionBonusAwarded ? "bg-brand-light/10 text-brand-light" : "bg-surface-2 text-text-dim"}`}>
                    {r.conversionBonusAwarded ? "50 pts awarded" : "Conversion bonus pending"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
