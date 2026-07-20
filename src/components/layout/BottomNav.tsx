import { Home, MessageCircle, Trophy, User, Waves } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useApp } from "../../store/AppContext";
import { todayISO } from "../../utils/format";
import { useUnreadMessageCount } from "../../hooks/useUnreadMessageCount";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

const CACHE_KEY = "well-cup-today-pts";
const POLL_INTERVAL = 60_000; // 60 seconds

function useTodayPoints(email?: string) {
  const location = useLocation();
  const [points, setPoints] = useState<number>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as { pts?: number; date?: string };
      if (cached.date === todayISO()) return cached.pts ?? 0;
    } catch { /* ignore */ }
    return 0;
  });
  const latestEmail = useRef(email);
  latestEmail.current = email;

  useEffect(() => {
    if (!API_URL || !email) return;
    const refresh = () => {
      fetch(`${API_URL}/api/activity/today?email=${encodeURIComponent(latestEmail.current ?? "")}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          const pts = d.totalPoints ?? 0;
          setPoints(pts);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ pts, date: todayISO() }));
        })
        .catch(() => {});
    };
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, location.pathname]);

  return points;
}

export default function BottomNav() {
  const { user } = useApp();
  const todayPoints = useTodayPoints(user.email);
  const unreadMessages = useUnreadMessageCount(user.email);

  type NavItem = { to: string; label: string; icon: typeof Home; badge?: number };
  const navItems: NavItem[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/community", label: "Community", icon: MessageCircle, badge: unreadMessages },
    { to: "/well-cup", label: "Well Cup", icon: Trophy, badge: todayPoints },
    { to: "/wellness", label: "Wellness", icon: Waves },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="glass-card border-t border-border px-2 py-2 flex items-center justify-between">
      {navItems.map(({ to, label, icon: Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className="flex-1 flex flex-col items-center gap-1 py-1.5"
        >
          {({ isActive }) => (
            <>
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors" style={isActive ? { background: "linear-gradient(135deg, #0191CE, #0171CE)" } : {}}>
                <Icon size={18} className={isActive ? "text-white drop-shadow-[0_1px_4px_rgba(132,216,253,0.5)]" : "text-text-muted"} />
                {badge !== undefined && badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-yellow-400 text-[9px] font-bold text-black flex items-center justify-center px-0.5 shadow"
                    style={{ lineHeight: 1 }}
                  >
                    {badge >= 1000 ? `${Math.floor(badge / 100) / 10}k` : badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium ${isActive ? "text-brand-light" : "text-text-dim"}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
