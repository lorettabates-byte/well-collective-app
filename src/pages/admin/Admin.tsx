import { BarChart3, Bell, Calendar, CalendarClock, Gift, Layers, Music, Save, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("adminToken");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

const TILES = [
  { to: "/admin/members", label: "Members", description: "View, add, and remove members", icon: Users },
  { to: "/admin/categories", label: "Categories", description: "Manage forum categories", icon: Layers },
  { to: "/admin/posts", label: "Posts", description: "Moderate threads & messages", icon: ShieldCheck },
  { to: "/admin/notifications", label: "Notifications", description: "Send push notifications", icon: Bell },
  { to: "/admin/inspirations", label: "Inspirations", description: "Schedule daily content", icon: Sparkles },
  { to: "/admin/content", label: "Content Schedule", description: "Bulk-upload themes, inspirations & recipes", icon: CalendarClock },
  { to: "/admin/events", label: "Events", description: "Manage the community calendar", icon: Calendar },
  { to: "/admin/coupons", label: "Coupons", description: "Create promo codes & birthday gift codes", icon: Gift },
  { to: "/admin/music", label: "Music", description: "Manage the WELL Collective Soundtrack", icon: Music },
  { to: "/admin/analytics", label: "Analytics", description: "View engagement stats", icon: BarChart3 },
];

export default function Admin() {
  const { categories, threads, events } = useApp();
  const [livestreamCoverUrl, setLivestreamCoverUrl] = useState("");
  const [coverStatus, setCoverStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/settings/livestream-cover`)
      .then((res) => (res.ok ? res.json() : { url: null }))
      .then((data) => setLivestreamCoverUrl(data.url || ""))
      .catch(() => {});
  }, []);

  const handleSaveCover = async () => {
    if (!API_URL) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/settings/livestream-cover`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ url: livestreamCoverUrl.trim() || null }),
      });
      if (res.ok) {
        setCoverStatus({ type: "success", message: "Livestream cover updated!" });
      } else {
        setCoverStatus({ type: "error", message: "Failed to update livestream cover" });
      }
    } catch {
      setCoverStatus({ type: "error", message: "Failed to update livestream cover" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TopBar title="Admin Panel" subtitle="Manage WELL Collective" showBack />
      <div className="px-4 pt-4 flex flex-col gap-6">
        <div className="glass-card rounded-card p-4">
          <h3 className="text-sm font-bold text-text mb-2">Livestream Cover</h3>
          <p className="text-xs text-text-muted mb-3">Set the cover photo URL for the featured Classes section</p>
          <input
            type="text"
            value={livestreamCoverUrl}
            onChange={(e) => setLivestreamCoverUrl(e.target.value)}
            placeholder="https://example.com/livestream-cover.jpg"
            className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-brand-light mb-3"
          />
          <button
            onClick={handleSaveCover}
            disabled={saving}
            className="flex items-center justify-center gap-2 text-sm font-semibold gradient-brand text-white rounded-pill py-2.5 w-full disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Cover"}
          </button>
          {coverStatus && (
            <p className={`text-xs mt-2 ${coverStatus.type === "success" ? "text-brand-light" : "text-red-400"}`}>
              {coverStatus.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
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

        <div>
          <h3 className="text-sm font-bold text-text mb-3">Admin Sections</h3>
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
    </div>
  );
}
