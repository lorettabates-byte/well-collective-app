import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { LOGO_URL } from "../components/layout/MobileShell";
import { uid } from "../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function StartTrial({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
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
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = (await res.json()) as { error?: string; trialEndsAt?: string; name?: string; resumed?: boolean };

      if (!res.ok || !data.trialEndsAt) {
        setError(data.error || "Failed to start trial. Please try again.");
        return;
      }

      localStorage.setItem("memberToken", `trial_${uid("local")}`);
      localStorage.setItem("memberUser", JSON.stringify({ email: email.trim(), name: data.name || name.trim() }));
      localStorage.setItem("memberTrialEndsAt", data.trialEndsAt);

      onSuccess();
    } catch {
      setError("Failed to start trial. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleStartTrial} className="flex flex-col gap-4">
      {error && (
        <div className="flex gap-2 bg-red-500/10 border border-red-500/30 rounded-card p-3">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-text mb-1.5 block">Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light"
        />
      </div>

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
        {submitting ? "Starting…" : "Start My 7-Day Free Trial"}
      </button>
      <p className="text-[11px] text-text-dim text-center -mt-1">
        No credit card needed. We'll let you know if you want to become a full WELL Collective member.
      </p>
    </form>
  );
}

export default function MemberLogin({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "trial">("login");
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
          ) : (
            <>
              <h1 className="text-xl font-bold text-text mb-1">Start Your Free Trial</h1>
              <p className="text-xs text-text-muted mb-5">
                Try WELL Collective free for 7 days — no membership account needed yet.
              </p>
              <StartTrial onSuccess={onSuccess} />
            </>
          )}
        </div>

        <p className="text-xs text-text-muted text-center">
          Not a member yet? Visit lorettabates.com to join WELL Collective.
        </p>
      </div>
    </div>
  );
}
