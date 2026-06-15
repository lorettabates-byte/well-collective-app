import { Gift, Loader2, LogOut, RefreshCw } from "lucide-react";
import { LOGO_URL } from "./layout/MobileShell";

const CHECKOUT_URL = "https://lorettabates.com/videolibrary.lorettabates.com/checkout-page/?lid=4";

export default function SubscribeGate({
  checking,
  onRecheck,
  onLogout,
}: {
  checking: boolean;
  onRecheck: () => void;
  onLogout: () => void;
}) {
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
          <p className="text-sm text-text-muted mb-5">
            Subscribe to WELL Collective to keep full access to community, classes, wellness tools, and more.
          </p>

          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow mb-3"
          >
            Subscribe Now
          </a>

          <button
            onClick={onRecheck}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-text border border-border rounded-pill py-2.5 disabled:opacity-50"
          >
            {checking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {checking ? "Checking..." : "I've Subscribed — Check Again"}
          </button>
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
