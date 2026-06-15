import { BarChart3, Bell, Calendar, CalendarClock, Gift, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";

const TILES = [
  { to: "/admin/categories", label: "Categories", description: "Manage forum categories", icon: Layers },
  { to: "/admin/posts", label: "Posts", description: "Moderate threads & messages", icon: ShieldCheck },
  { to: "/admin/notifications", label: "Notifications", description: "Send push notifications", icon: Bell },
  { to: "/admin/inspirations", label: "Inspirations", description: "Schedule daily content", icon: Sparkles },
  { to: "/admin/content", label: "Content Schedule", description: "Bulk-upload themes, inspirations & recipes", icon: CalendarClock },
  { to: "/admin/events", label: "Events", description: "Manage the community calendar", icon: Calendar },
  { to: "/admin/coupons", label: "Coupons", description: "Create promo codes & birthday gift codes", icon: Gift },
  { to: "/admin/analytics", label: "Analytics", description: "View engagement stats", icon: BarChart3 },
];

export default function Admin() {
  const { categories, threads, events } = useApp();

  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);

  return (
    <div>
      <TopBar title="Admin Panel" subtitle="Manage WELL Collective" showBack />
      <div className="px-4 pt-4">
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-lg font-bold text-text">{categories.length}</p>
            <p className="text-[10px] text-text-muted">Categories</p>
          </div>
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-lg font-bold text-text">{threads.length}</p>
            <p className="text-[10px] text-text-muted">Posts</p>
          </div>
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-lg font-bold text-text">{totalMessages}</p>
            <p className="text-[10px] text-text-muted">Messages</p>
          </div>
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-lg font-bold text-text">{events.length}</p>
            <p className="text-[10px] text-text-muted">Events</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {TILES.map(({ to, label, description, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5">
              <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center shrink-0">
                <Icon size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{label}</p>
                <p className="text-xs text-text-muted">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
