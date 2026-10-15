import { Capacitor } from "@capacitor/core";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getStoreMembership, initIAP, type StoreMembership } from "../utils/iap";
import { openMemberLink } from "../utils/ssoLink";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const WEBSITE_ACCOUNT_URL = "https://lorettabates.com/videolibrary.lorettabates.com/my-account/?ihc_ap_menu=subscription";
const APP_STORE_SUBSCRIPTIONS = "itms-apps://apps.apple.com/account/subscriptions";
const PLAY_SUBSCRIPTIONS = "https://play.google.com/store/account/subscriptions?package=com.wellcollective.app";

const REASONS: [string, string][] = [
  ["too_expensive", "Too expensive"],
  ["not_using", "Not using it enough"],
  ["missing_something", "Missing something I want"],
  ["technical", "Technical problems"],
  ["taking_a_break", "Just taking a break"],
  ["other", "Other"],
];

const WHERE: Record<"app_store" | "google_play" | "website", string> = {
  app_store: "the App Store",
  google_play: "Google Play",
  website: "lorettabates.com",
};

interface Props {
  email: string;
  onClose: () => void;
}

export default function ManageMembershipSheet({ email, onClose }: Props) {
  const [store, setStore] = useState<StoreMembership | null>(null);
  const [step, setStep] = useState<"overview" | "why">("overview");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      await initIAP(email);
      setStore(await getStoreMembership());
    })();
  }, [email]);

  const where: "app_store" | "google_play" | "website" = store?.store ?? "website";

  // Sends them to the one place that can actually change their billing.
  const openBilling = async () => {
    if (where === "website") {
      await openMemberLink(WEBSITE_ACCOUNT_URL, email);
    } else if (where === "app_store" && Capacitor.getPlatform() === "ios") {
      window.location.href = APP_STORE_SUBSCRIPTIONS;
    } else {
      window.location.href = store?.managementURL || PLAY_SUBSCRIPTIONS;
    }
  };

  const continueToCancel = async () => {
    if (!reason) return;
    setSending(true);
    try {
      if (API_URL) {
        await fetch(`${API_URL}/api/membership/cancel-reason`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, reason, note: note.trim() || undefined }),
        }).catch(() => {});
      }
      await openBilling();
      onClose();
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your membership"
        className="w-full sm:max-w-md glass-card rounded-t-card sm:rounded-card p-5 max-h-[90vh] overflow-y-auto"
        style={{ background: "#0a1624", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-bold text-text">{step === "overview" ? "Your membership" : "Before you go..."}</p>
          <button onClick={onClose} aria-label="Close" className="text-text-muted p-1">
            <X size={18} />
          </button>
        </div>

        {!store ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="text-brand-light animate-spin" />
          </div>
        ) : step === "overview" ? (
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-text-muted leading-relaxed">
              You're a WELL Collective member through <span className="text-text font-semibold">{WHERE[where]}</span>. That's where your billing lives.
            </p>
            <button onClick={openBilling} className="gradient-brand text-white text-sm font-semibold rounded-pill py-3">
              Manage billing
            </button>
            <button onClick={() => setStep("why")} className="text-sm font-semibold rounded-pill py-3 border border-border text-text-muted">
              Cancel membership
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-text-muted leading-relaxed">
              Can you tell me why? Just tap one. It really helps me make the WELL better for everyone.
            </p>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Why are you cancelling?">
              {REASONS.map(([key, label]) => (
                <button
                  key={key}
                  role="radio"
                  aria-checked={reason === key}
                  onClick={() => setReason(key)}
                  className={`flex items-center justify-between text-left text-sm rounded-card px-4 py-3 border transition-colors ${
                    reason === key ? "border-brand-light bg-brand-blue/25 text-text font-semibold" : "border-border text-text"
                  }`}
                  style={reason === key ? { boxShadow: "0 0 0 1px #84D8FD inset" } : undefined}
                >
                  {label}
                  {reason === key && <Check size={16} className="text-brand-light shrink-0" />}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              placeholder="Anything else you want me to know? (optional)"
              className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light min-h-[80px]"
            />
            <button
              onClick={continueToCancel}
              disabled={!reason || sending}
              className="gradient-brand text-white text-sm font-semibold rounded-pill py-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending && <Loader2 size={14} className="animate-spin" />}
              Continue to cancel
            </button>
            <button onClick={onClose} className="text-sm font-semibold text-brand-light py-2">
              Never mind, I'm staying!
            </button>
            <p className="text-[13px] text-text-dim leading-relaxed">
              You'll finish cancelling in {WHERE[where]}. You keep everything until your paid month ends.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
