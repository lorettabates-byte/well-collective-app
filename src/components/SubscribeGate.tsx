import { Capacitor } from "@capacitor/core";
import { Brain, Dumbbell, Gift, Loader2, LogOut, Moon, RefreshCw, RotateCcw, Trophy, Utensils, ClipboardList } from "lucide-react";
import { useState } from "react";
import { purchaseMembership, restoreIAPPurchases } from "../utils/iap";
import { openMemberLink } from "../utils/ssoLink";
import { LOGO_URL } from "./layout/MobileShell";

const FEATURES = [
  { Icon: Brain, name: "Guided Calm Toolkit", desc: "Grounding, breathing & mindset sessions" },
  { Icon: Dumbbell, name: "Workout Plans", desc: "Daily resistance, cardio & stretch routines" },
  { Icon: Utensils, name: "Nutrition Tracking", desc: "Log meals, scan barcodes & track macros" },
  { Icon: Moon, name: "Sleep & Recovery", desc: "Log sleep quality & guided breathwork" },
  { Icon: ClipboardList, name: "WELL Check", desc: "Daily wellness score across 6 categories" },
  { Icon: Trophy, name: "WELL Cup Points", desc: "Earn points, climb the leaderboard & win prizes" },
];

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const CHECKOUT_URL = "https://lorettabates.com/videolibrary.lorettabates.com/checkout-page/?lid=4";
const isNative = Capacitor.isNativePlatform();

async function activateIAPOnServer(email: string): Promise<void> {
  if (!API_URL || !email) return;
  await fetch(`${API_URL}/api/iap/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).catch(() => {});
}

export default function SubscribeGate({
  checking,
  onRecheck,
  onLogout,
}: {
  checking: boolean;
  onRecheck: () => void;
  onLogout: () => void;
}) {
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  const member = JSON.parse(localStorage.getItem("memberUser") || "{}") as { email?: string };

  const handleIAPPurchase = async () => {
    setError("");
    setPurchasing(true);
    try {
      const result = await purchaseMembership();
      if (result.userCancelled) return;
      if (!result.success) {
        setError(result.error || "Purchase failed. Please try again.");
        return;
      }
      await activateIAPOnServer(member.email || "");
      onRecheck();
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setError("");
    setRestoring(true);
    try {
      const active = await restoreIAPPurchases();
      if (active) {
        await activateIAPOnServer(member.email || "");
        onRecheck();
      } else {
        setError("No active subscription found to restore.");
      }
    } finally {
      setRestoring(false);
    }
  };

  const handleWebCheckout = async () => {
    setOpening(true);
    try {
      await openMemberLink(CHECKOUT_URL, member.email);
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <img src={LOGO_URL} alt="WELL Collective" className="h-16" />
        </div>

        <div className="glass-card rounded-card p-6 text-center">
          <div className="w-12 h-12 rounded-full gradient-brand shadow-glow flex items-center justify-center mx-auto mb-4">
            <Gift size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-text mb-2">Your Free Trial Has Ended</h1>
          <p className="text-sm text-text-muted mb-4">
            Subscribe to keep full access to everything in WELL Collective.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {FEATURES.map(({ Icon, name, desc }) => (
              <div
                key={name}
                className="rounded-[14px] p-3 text-left"
                style={{ background: "rgba(20,35,57,0.7)", border: "1px solid rgba(132,216,253,0.07)" }}
              >
                <Icon size={16} className="text-brand-blue mb-1.5" />
                <div className="text-[11px] font-bold text-text leading-tight mb-0.5">{name}</div>
                <div className="text-[10px] text-text-dim leading-snug">{desc}</div>
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          {isNative ? (
            <>
              <button
                onClick={handleIAPPurchase}
                disabled={purchasing}
                className="w-full flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow mb-2 disabled:opacity-60"
              >
                {purchasing ? <Loader2 size={14} className="animate-spin" /> : null}
                {purchasing ? "Processing…" : "Subscribe Now — $30/month"}
              </button>
              <p className="text-[11px] text-text-dim text-center mb-3">
                7-day free trial included · Cancel anytime in Apple ID settings
              </p>
            </>
          ) : (
            <button
              onClick={handleWebCheckout}
              disabled={opening}
              className="w-full flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow mb-3 disabled:opacity-60"
            >
              {opening ? <Loader2 size={14} className="animate-spin" /> : null}
              {opening ? "Opening checkout…" : "Subscribe Now"}
            </button>
          )}

          <button
            onClick={onRecheck}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-text border border-border rounded-pill py-2.5 mb-2 disabled:opacity-50"
          >
            {checking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {checking ? "Checking..." : "I've Subscribed — Check Again"}
          </button>

          {isNative && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="w-full flex items-center justify-center gap-2 text-xs text-text-dim rounded-pill py-2 disabled:opacity-50"
            >
              {restoring ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
              {restoring ? "Restoring…" : "Restore Purchases"}
            </button>
          )}
        </div>

        <p className="text-xs text-text-muted text-center">
          Already subscribed and still seeing this? It can take a minute to sync. Tap "Check Again," or log out and
          back in.
        </p>

        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2 text-xs font-semibold text-text-muted"
        >
          <LogOut size={14} />
          Log Out
        </button>
      </div>
    </div>
  );
}
