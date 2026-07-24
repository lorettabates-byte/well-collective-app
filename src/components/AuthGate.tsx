import { Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { checkMembershipStatus } from "../lib/membership";
import { checkIAPStatus, initIAP } from "../utils/iap";
import { getTrialStatus } from "../utils/trial";
import MemberLogin from "../pages/MemberLogin";
import SubscribeGate from "./SubscribeGate";

const RECHECK_INTERVAL_MS = 1000 * 60 * 60 * 6; // 6 hours

interface CachedMembershipStatus {
  active: boolean;
  checkedAt: string;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem("memberToken"));
  const [membershipActive, setMembershipActive] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const trialStatus = getTrialStatus(localStorage.getItem("memberTrialEndsAt") || undefined);

  const refreshMembership = async () => {
    setChecking(true);
    try {
      const member = JSON.parse(localStorage.getItem("memberUser") || "{}") as { email?: string };
      // Check UMP membership (web subscribers) and IAP (App Store subscribers) in parallel
      const [umpActive, iapActive] = await Promise.all([
        member.email ? checkMembershipStatus(member.email) : Promise.resolve(true),
        checkIAPStatus(),
      ]);
      const active = umpActive || iapActive;
      const cached: CachedMembershipStatus = { active, checkedAt: new Date().toISOString() };
      localStorage.setItem("memberMembershipStatus", JSON.stringify(cached));
      setMembershipActive(active);
    } catch {
      setMembershipActive(true); // fail open
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!authed) return;
    // Initialize IAP and identify user so RevenueCat knows who this is
    const member = JSON.parse(localStorage.getItem("memberUser") || "{}") as { email?: string };
    if (member.email) initIAP(member.email).catch(() => {});

    const raw = localStorage.getItem("memberMembershipStatus");
    if (raw) {
      try {
        const cached = JSON.parse(raw) as CachedMembershipStatus;
        const age = Date.now() - new Date(cached.checkedAt).getTime();
        if (age < RECHECK_INTERVAL_MS) {
          setMembershipActive(cached.active);
          return;
        }
      } catch {
        // ignore malformed cache
      }
    }

    refreshMembership();
  }, [authed]);

  const handleLogout = () => {
    localStorage.removeItem("memberToken");
    localStorage.removeItem("memberUser");
    localStorage.removeItem("memberTrialEndsAt");
    localStorage.removeItem("memberMembershipStatus");
    setAuthed(false);
    setMembershipActive(null);
  };

  if (!authed) {
    return <MemberLogin onSuccess={() => setAuthed(true)} />;
  }

  if (!trialStatus.isActive) {
    if (membershipActive === null) {
      return (
        <div className="min-h-screen w-full bg-bg flex items-center justify-center">
          <Loader2 size={28} className="text-brand-light animate-spin" />
        </div>
      );
    }

    if (!membershipActive) {
      return <SubscribeGate checking={checking} onRecheck={refreshMembership} onLogout={handleLogout} />;
    }
  }

  return <>{children}</>;
}
