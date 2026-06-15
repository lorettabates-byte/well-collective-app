import { Bell, Bookmark, ChevronRight, LogOut, Pencil, Rss, Salad, ShieldCheck, SlidersHorizontal, Video, Waves, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/ui/Avatar";
import { useApp } from "../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function MenuRow({
  icon,
  label,
  to,
  badge,
}: {
  icon: ReactNode;
  label: string;
  to: string;
  badge?: number;
}) {
  return (
    <Link to={to} className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5">
      <div className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-brand-light">
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium text-text">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[11px] font-bold bg-surface-3 text-brand-light rounded-pill px-2 py-0.5">
          {badge}
        </span>
      )}
      <ChevronRight size={16} className="text-text-dim" />
    </Link>
  );
}

export default function Profile() {
  const { user, threads, inspirations } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(!user.email);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesPosted = threads.reduce(
    (sum, t) => sum + t.messages.filter((m) => m.authorId === user.id).length,
    0
  );
  const supportGiven = threads.reduce(
    (sum, t) => sum + t.messages.filter((m) => m.likes.includes(user.id)).length,
    0
  );
  const savedCount = inspirations.filter((i) => i.savedBy.includes(user.id)).length;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!API_URL) {
        setError("API URL not configured");
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminEmail", email);
      localStorage.setItem("admin", JSON.stringify(data.admin));

      // Update user with email
      (user as any).email = email;
      setShowLoginModal(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("admin");
    (user as any).email = undefined;
    setShowLoginModal(true);
  };

  return (
    <div className="px-4 pt-6">
      <div className="flex flex-col items-center text-center mb-6">
        <Avatar src={user.avatar} alt={user.name} size={84} ring />
        <div className="flex items-center gap-2 mt-3">
          <h1 className="text-lg font-bold text-text">{user.name}</h1>
          {user.isAdmin && (
            <span className="text-[10px] font-bold uppercase tracking-wide gradient-brand text-white rounded-pill px-2 py-0.5">
              Admin
            </span>
          )}
        </div>
        <p className="text-sm text-text-muted mt-1 max-w-xs">{user.bio}</p>
        <Link
          to="/profile/edit"
          className="flex items-center gap-1.5 mt-4 text-xs font-semibold gradient-brand text-white rounded-pill px-4 py-2 shadow-glow"
        >
          <Pencil size={13} />
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-card p-3 text-center">
          <p className="text-lg font-bold text-text">{messagesPosted}</p>
          <p className="text-[11px] text-text-muted">Messages</p>
        </div>
        <div className="glass-card rounded-card p-3 text-center">
          <p className="text-lg font-bold text-text">{supportGiven}</p>
          <p className="text-[11px] text-text-muted">Support Given</p>
        </div>
        <div className="glass-card rounded-card p-3 text-center">
          <p className="text-lg font-bold text-text">{savedCount}</p>
          <p className="text-[11px] text-text-muted">Saved</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mb-6">
        <MenuRow icon={<Bell size={16} />} label="Notifications" to="/notifications" />
        <MenuRow icon={<SlidersHorizontal size={16} />} label="Notification Settings" to="/profile/notifications" />
        <MenuRow icon={<Bookmark size={16} />} label="Saved Inspirations" to="/inspirations" badge={savedCount} />
        <MenuRow icon={<Video size={16} />} label="Classes" to="/videos" />
        <MenuRow icon={<Waves size={16} />} label="Wellness" to="/wellness" />
        <MenuRow icon={<Salad size={16} />} label="Nutrition" to="/nutrition" />
        <MenuRow icon={<Rss size={16} />} label="Blog" to="/blog" />
        {user.isAdmin && <MenuRow icon={<ShieldCheck size={16} />} label="Admin Panel" to="/admin" />}
      </div>

      {user.email && (
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-400 border border-red-400/30 rounded-pill py-3 mb-4"
        >
          <LogOut size={16} />
          Log Out
        </button>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-sm bg-surface rounded-card p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-text">Admin Login</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-surface-2 border border-border rounded-card px-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-brand-light"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-surface-2 border border-border rounded-card px-4 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-brand-light"
                required
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="gradient-brand text-white font-semibold rounded-pill py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
