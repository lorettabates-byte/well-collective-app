import { Home, MessageCircle, Sparkles, User, Video } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/community", label: "Community", icon: MessageCircle },
  { to: "/videos", label: "Classes", icon: Video },
  { to: "/inspirations", label: "Inspiration", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  return (
    <nav className="glass-card border-t border-border px-2 py-2 flex items-center justify-between">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className="flex-1 flex flex-col items-center gap-1 py-1.5"
        >
          {({ isActive }) => (
            <>
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                  isActive ? "gradient-brand shadow-glow" : ""
                }`}
              >
                <Icon size={18} className={isActive ? "text-white" : "text-text-muted"} />
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
