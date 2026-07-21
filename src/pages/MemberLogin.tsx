import { Browser } from "@capacitor/browser";
import { AlertCircle, ArrowUpRight, Brain, ClipboardList, Dumbbell, Loader2, Moon, Trophy, Utensils } from "lucide-react";
import { useState } from "react";
import { LOGO_URL } from "../components/layout/MobileShell";
import { uid } from "../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function ResumeTrial({ onSuccess, onSwitchToStart }: { onSuccess: () => void; onSwitchToStart: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!API_URL) {
      setError("Backend not configured");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/start-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { error?: string; trialEndsAt?: string; name?: string; resumed?: boolean };

      if (!res.ok || !data.trialEndsAt) {
        setError(
          data.error ||
            "We couldn't find a free trial for that email. Try starting a new trial instead."
        );
        return;
      }

      localStorage.setItem("memberToken", `trial_${uid("local")}`);
      localStorage.setItem("memberUser", JSON.stringify({ email: email.trim(), name: data.name || "" }));
      localStorage.setItem("memberTrialEndsAt", data.trialEndsAt);

      onSuccess();
    } catch {
      setError("Failed to log in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleResume} className="flex flex-col gap-4">
      {error && (
        <div className="flex gap-2 bg-red-500/10 border border-red-500/30 rounded-card p-3">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-text mb-1.5 block">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          autoCapitalize="none"
          autoCorrect="off"
          className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow disabled:opacity-50"
      >
        {submitting ? "Logging in…" : "Log Back Into My Trial"}
      </button>
      <button
        type="button"
        onClick={onSwitchToStart}
        className="text-[11px] text-text-dim text-center -mt-1 underline"
      >
        New here? Start a free trial instead.
      </button>
    </form>
  );
}

function JoinOnWeb({ onSwitchToResume }: { onSwitchToResume: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => Browser.open({ url: "https://lorettabates.com/membership" })}
        className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow flex items-center justify-center gap-2"
      >
        Start My Free Trial at lorettabates.com
        <ArrowUpRight size={15} />
      </button>
      <p className="text-[11px] text-text-dim text-center">
        Memberships are managed at lorettabates.com. After signing up, come back here and log in.
      </p>
      <button type="button" onClick={onSwitchToResume} className="text-[11px] text-text-dim text-center underline">
        Already have an account? Log back in instead.
      </button>
    </div>
  );
}

export default function MemberLogin({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "trial">("login");
  const [trialView, setTrialView] = useState<"start" | "resume">("start");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!API_URL) {
        setError("Backend not configured");
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/member-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data: { error?: string; token?: string; user?: { email: string; name: string } };
      try {
        data = await res.json();
      } catch {
        setError("Server error. Please try again in a moment.");
        return;
      }

      if (!res.ok || !data.token || !data.user) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("memberToken", data.token);
      localStorage.setItem("memberUser", JSON.stringify(data.user));

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <img src={LOGO_URL} alt="WELL Collective" className="h-16" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`text-sm font-semibold rounded-pill py-2.5 border ${
              mode === "login" ? "gradient-brand text-white border-transparent shadow-glow" : "border-border text-text-muted"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode("trial")}
            className={`text-sm font-semibold rounded-pill py-2.5 border ${
              mode === "trial" ? "gradient-brand text-white border-transparent shadow-glow" : "border-border text-text-muted"
            }`}
          >
            Free Trial
          </button>
        </div>

        <div className="glass-card rounded-card p-6">
          {mode === "login" ? (
            <>
              <h1 className="text-xl font-bold text-text mb-1">Welcome Back</h1>
              <p className="text-xs text-text-muted mb-5">
                Log in with your WELL Collective membership account to continue.
              </p>

              {error && (
                <div className="flex gap-2 bg-red-500/10 border border-red-500/30 rounded-card p-3 mb-4">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-text mb-1.5 block">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your WELL Collective username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text mb-1.5 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </form>
            </>
          ) : trialView === "start" ? (
            <>
              <h1 className="text-xl font-bold text-text mb-1">Start Your Free Trial</h1>
              <p className="text-xs text-text-muted mb-3">
                Try WELL Collective free for 7 days — or 30 days with a friend's referral code!
              </p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {[
                  { icon: <Brain size={15} />, label: "Guided Calm Toolkit", desc: "Grounding, breathing & mindset sessions with AI voice" },
                  { icon: <Dumbbell size={15} />, label: "Workout Plans", desc: "Daily resistance, cardio & stretch routines" },
                  { icon: <Utensils size={15} />, label: "Nutrition Tracking", desc: "Log meals, scan barcodes & track macros" },
                  { icon: <Moon size={15} />, label: "Sleep & Recovery", desc: "Log sleep quality · guided breathwork & stretching for recovery" },
                  { icon: <ClipboardList size={15} />, label: "WELL Check", desc: "Daily wellness score across 6 health categories" },
                  { icon: <Trophy size={15} />, label: "WELL Cup Points", desc: "Earn points, climb the leaderboard & win prizes" },
                ].map((f) => (
                  <div key={f.label} className="bg-surface-2 border border-border rounded-card p-2.5 flex flex-col gap-1">
                    <span className="text-brand-light leading-none">{f.icon}</span>
                    <p className="text-[11px] font-semibold text-text leading-tight">{f.label}</p>
                    <p className="text-[10px] text-text-muted leading-tight">{f.desc}</p>
                  </div>
                ))}
              </div>
              <JoinOnWeb onSwitchToResume={() => setTrialView("resume")} />
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-text mb-1">Welcome Back</h1>
              <p className="text-xs text-text-muted mb-5">
                Enter the email you used to start your free trial to continue where you left off.
              </p>
              <ResumeTrial onSuccess={onSuccess} onSwitchToStart={() => setTrialView("start")} />
            </>
          )}
        </div>

      </div>
    </div>
  );
}
