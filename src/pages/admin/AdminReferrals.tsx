import { CheckCircle2, Gift } from "lucide-react";
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

  return (
    <div>
      <TopBar title="Referrals" subtitle="Friend invites & conversions" icon={Gift} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-lg font-bold text-text">{referrals.length}</p>
            <p className="text-[11px] text-text-muted">Total referrals</p>
          </div>
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-lg font-bold text-text">{conversions}</p>
            <p className="text-[11px] text-text-muted">Converted to paid</p>
          </div>
        </div>

        {loading && <p className="text-xs text-text-muted text-center">Loading…</p>}
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}

        {!loading && !error && referrals.length === 0 && (
          <p className="text-xs text-text-muted text-center">No referrals yet.</p>
        )}

        <div className="flex flex-col gap-2.5 pb-6">
          {referrals.map((r, i) => (
            <div key={i} className="glass-card rounded-card px-4 py-3.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-text truncate">
                  {r.referrerName || r.referrerEmail}
                </p>
                {r.convertedAt && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400 shrink-0">
                    <CheckCircle2 size={13} />
                    Converted
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mb-1">
                Referred <span className="text-text">{r.referredName || r.referredEmail}</span>
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
