import { BarChart2, Clock, TrendingUp, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

type Tab = "overview" | "sections" | "tutorial" | "wellcup";

interface DashboardData {
  summary: {
    total_app_opens: number;
    total_logins: number;
    total_sessions: number;
    wau: number;
    dau_today: number;
  };
  dau: { day: string; users: number }[];
  logins: { day: string; logins: number }[];
  sessions: { avg_seconds: number | null; max_seconds: number | null; count: number } | null;
  sectionVisits: { section: string; visits: number; unique_users: number }[];
  tutorialSteps: { step: number; slide_title: string; users: number }[];
  tutorialOutcomes: { outcome: string; count: number }[];
  tutorialSkips: { at_step: number; count: number }[];
  wellCupByType: { activity_type: string; total_points: number; events: number; unique_earners: number }[];
  wellCupByMember: { member_email: string; total_points: number; events: number }[];
  wellCupRecent: { member_email: string; activity_type: string; points: number; created_at: string }[];
}

function formatSeconds(s: number) {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function MiniBar({ value, max, color = "gradient-brand" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2 rounded-pill bg-surface-2 overflow-hidden flex-1">
      <div
        className={`h-full rounded-pill ${color}`}
        style={{ width: `${max > 0 ? Math.round((value / max) * 100) : 0}%` }}
      />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass-card rounded-card p-4 text-center">
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-xs text-text-muted mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-text-dim mt-0.5">{sub}</p>}
    </div>
  );
}

function DAUChart({ data }: { data: { day: string; users: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.users));
  return (
    <div className="glass-card rounded-card p-4">
      <p className="text-xs font-bold text-text mb-3">Daily Active Users (14 days)</p>
      <div className="flex items-end gap-1 h-20">
        {data.map((d) => {
          const pct = Math.round((d.users / max) * 100);
          const date = new Date(d.day);
          const label = `${date.getMonth() + 1}/${date.getDate()}`;
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 60 }}>
                <div
                  className="w-full gradient-brand rounded-sm"
                  style={{ height: `${pct}%`, minHeight: d.users > 0 ? 3 : 0 }}
                />
              </div>
              <span className="text-[9px] text-text-dim leading-none">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OverviewTab({ data }: { data: DashboardData }) {
  const { categories, threads, inspirations, events } = useApp();

  const totalPosts = threads.length;
  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);
  const inspirationLikes = inspirations.reduce((sum, i) => sum + i.likes.length, 0);
  const totalRsvps = events.reduce((sum, e) => sum + e.rsvps.length, 0);

  const categoryActivity = categories
    .map((c) => {
      const msgs = threads.filter((t) => t.categoryId === c.id).reduce((s, t) => s + t.messages.length, 0);
      return { category: c, messages: msgs };
    })
    .sort((a, b) => b.messages - a.messages);
  const maxMsgs = Math.max(1, ...categoryActivity.map((c) => c.messages));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="DAU (today)" value={data.summary.dau_today} />
        <StatCard label="WAU (7 days)" value={data.summary.wau} />
        <StatCard label="App Opens (total)" value={data.summary.total_app_opens.toLocaleString()} />
        <StatCard label="Logins (total)" value={data.summary.total_logins.toLocaleString()} />
        <StatCard
          label="Avg Session"
          value={formatSeconds(data.sessions?.avg_seconds ?? 0)}
          sub={`Max: ${formatSeconds(data.sessions?.max_seconds ?? 0)}`}
        />
        <StatCard label="Sessions Tracked" value={(data.sessions?.count ?? 0).toLocaleString()} />
      </div>

      <DAUChart data={data.dau} />

      <div className="glass-card rounded-card p-4">
        <p className="text-xs font-bold text-text mb-3">Community Content</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Posts" value={totalPosts} />
          <StatCard label="Messages" value={totalMessages} />
          <StatCard label="Inspiration Likes" value={inspirationLikes} />
          <StatCard label="Event RSVPs" value={totalRsvps} />
        </div>
      </div>

      <div className="glass-card rounded-card p-4">
        <p className="text-xs font-bold text-text mb-3">Activity by Category</p>
        <div className="flex items-end gap-1.5 h-28">
          {categoryActivity.map(({ category, messages }) => {
            const pct = maxMsgs > 0 ? Math.round((messages / maxMsgs) * 100) : 0;
            return (
              <div key={category.id} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                {messages > 0 && (
                  <span className="text-[9px] text-text-dim leading-none">{messages}</span>
                )}
                <div className="w-full flex flex-col justify-end" style={{ height: 72 }}>
                  <div
                    className="w-full gradient-brand rounded-sm"
                    style={{ height: `${pct}%`, minHeight: messages > 0 ? 3 : 0 }}
                  />
                </div>
                <span
                  className="text-[8px] text-text-muted text-center leading-tight w-full truncate"
                  title={category.name}
                >
                  {category.name.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionsTab({ data }: { data: DashboardData }) {
  const sorted = [...data.sectionVisits].sort((a, b) => b.visits - a.visits);
  const maxVisits = Math.max(1, ...sorted.map((s) => s.visits));

  const SECTION_LABELS: Record<string, string> = {
    community: "Community",
    inspiration: "Inspirations",
    music: "Music",
    "well-cup": "WELL Cup",
    nutrition: "Nutrition",
    classes: "Classes",
    events: "Events",
    tribe: "Tribe",
    "well-check": "WELL Check",
    profile: "Profile",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card rounded-card p-4">
        <p className="text-xs font-bold text-text mb-1">Section Visits (last 30 days)</p>
        <p className="text-[10px] text-text-dim mb-4">Tracked each time a member opens a section</p>
        <div className="flex flex-col gap-3">
          {sorted.map((s) => (
            <div key={s.section}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text">
                  {SECTION_LABELS[s.section] ?? s.section}
                </span>
                <span className="text-xs text-text-dim">{s.visits} visits · {s.unique_users} members</span>
              </div>
              <MiniBar value={s.visits} max={maxVisits} />
            </div>
          ))}
          {sorted.length === 0 && (
            <p className="text-xs text-text-muted text-center py-4">No section visits tracked yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TutorialTab({ data }: { data: DashboardData }) {
  const completeCount = data.tutorialOutcomes.find((o) => o.outcome === "complete")?.count ?? 0;
  const skipCount = data.tutorialOutcomes.find((o) => o.outcome === "skip")?.count ?? 0;
  const total = completeCount + skipCount;
  const completePct = total > 0 ? Math.round((completeCount / total) * 100) : 0;

  const maxStep = Math.max(...(data.tutorialSteps.map((s) => s.users) ?? [1]), 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Completed Tutorial" value={completeCount} sub={total > 0 ? `${completePct}% of starters` : undefined} />
        <StatCard label="Skipped Tutorial" value={skipCount} sub={total > 0 ? `${100 - completePct}% of starters` : undefined} />
      </div>

      {data.tutorialSteps.length > 0 && (
        <div className="glass-card rounded-card p-4">
          <p className="text-xs font-bold text-text mb-1">Step-by-Step Reach</p>
          <p className="text-[10px] text-text-dim mb-4">How many members reached each slide</p>
          <div className="flex flex-col gap-3">
            {data.tutorialSteps.map((s) => (
              <div key={s.step}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text truncate max-w-[60%]">
                    {s.step + 1}. {s.slide_title}
                  </span>
                  <span className="text-xs text-text-dim shrink-0">{s.users} members</span>
                </div>
                <MiniBar value={s.users} max={maxStep} />
              </div>
            ))}
          </div>
        </div>
      )}

      {data.tutorialSkips.length > 0 && (
        <div className="glass-card rounded-card p-4">
          <p className="text-xs font-bold text-text mb-3">Where Members Skip</p>
          <div className="flex flex-col gap-2">
            {data.tutorialSkips.map((s) => (
              <div key={s.at_step} className="flex items-center justify-between">
                <span className="text-xs text-text">After slide {s.at_step + 1}</span>
                <span className="text-xs font-semibold text-text-dim">{s.count} skips</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.tutorialSteps.length === 0 && (
        <div className="glass-card rounded-card p-6 text-center">
          <p className="text-xs text-text-muted">No tutorial data yet — events are tracked when members open the feature tour</p>
        </div>
      )}
    </div>
  );
}

function WellCupTab({ data }: { data: DashboardData }) {
  const maxPts = Math.max(1, ...data.wellCupByType.map((t) => t.total_points));

  const TYPE_LABELS: Record<string, string> = {
    app_open: "App Open",
    forum_post: "Forum Post",
    forum_comment: "Forum Comment",
    class_watch: "Class Watched",
    song_play: "Song Played",
    blog_open: "Blog Read",
    meal_log: "Meal Logged",
    sleep_log: "Sleep Logged",
    breathwork: "Breathwork",
    stretching: "Stretching",
    resistance_training: "Resistance Training",
    well_activity: "WELL Activity",
    event_attend: "Event Attended",
    well_escape: "WELL Escape",
    tribe_add: "Tribe Member Added",
    daily_challenge_accept: "Daily Challenge",
    profile_photo: "Profile Photo",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card rounded-card p-4">
        <p className="text-xs font-bold text-text mb-1">Points by Activity (last 30 days)</p>
        <p className="text-[10px] text-text-dim mb-4">Where members are earning the most points</p>
        <div className="flex flex-col gap-3">
          {data.wellCupByType.map((t) => (
            <div key={t.activity_type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text">
                  {TYPE_LABELS[t.activity_type] ?? t.activity_type}
                </span>
                <span className="text-xs text-text-dim">
                  {t.total_points.toLocaleString()} pts · {t.unique_earners} members
                </span>
              </div>
              <MiniBar value={t.total_points} max={maxPts} />
            </div>
          ))}
          {data.wellCupByType.length === 0 && (
            <p className="text-xs text-text-muted text-center py-4">No WELL Cup data yet</p>
          )}
        </div>
      </div>

      {data.wellCupByMember.length > 0 && (
        <div className="glass-card rounded-card p-4">
          <p className="text-xs font-bold text-text mb-3">Top Earners (last 30 days)</p>
          <div className="flex flex-col gap-2">
            {data.wellCupByMember.slice(0, 20).map((m, i) => (
              <div key={m.member_email} className="flex items-center gap-3">
                <span className="text-xs text-text-dim w-5 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text truncate">{m.member_email}</p>
                  <p className="text-[10px] text-text-dim">{m.events} activities</p>
                </div>
                <span className="text-xs font-bold text-brand-light shrink-0">
                  {m.total_points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.wellCupRecent.length > 0 && (
        <div className="glass-card rounded-card p-4">
          <p className="text-xs font-bold text-text mb-3">Recent Events</p>
          <div className="flex flex-col gap-2">
            {data.wellCupRecent.slice(0, 50).map((e, i) => {
              const ts = new Date(e.created_at);
              const timeStr = ts.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
                " " + ts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              return (
                <div key={i} className="flex items-start gap-2 py-1 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-text truncate">{e.member_email}</p>
                    <p className="text-[10px] text-text-dim">{TYPE_LABELS[e.activity_type] ?? e.activity_type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold text-brand-light">+{e.points} pts</p>
                    <p className="text-[10px] text-text-dim">{timeStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!API_URL) { setError("No API URL configured"); setLoading(false); return; }
    const adminKey = localStorage.getItem("adminToken") ?? "";
    fetch(`${API_URL}/api/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${adminKey}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const TABS: { id: Tab; label: string; icon: typeof BarChart2 }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "sections", label: "Sections", icon: BarChart2 },
    { id: "tutorial", label: "Tutorial", icon: Users },
    { id: "wellcup", label: "WELL Cup", icon: Trophy },
  ];

  return (
    <div>
      <TopBar title="Analytics" subtitle="Member engagement & behaviour" showBack icon={BarChart2} iconColor="#0191CE" />

      <div className="flex gap-1 px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold border transition-colors ${
              tab === id
                ? "gradient-brand text-white border-transparent shadow-glow"
                : "bg-surface-2 text-text-muted border-border"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-8 pt-2">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="glass-card rounded-card p-4 text-center">
            <p className="text-xs text-red-400">Failed to load analytics: {error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {tab === "overview" && <OverviewTab data={data} />}
            {tab === "sections" && <SectionsTab data={data} />}
            {tab === "tutorial" && <TutorialTab data={data} />}
            {tab === "wellcup" && <WellCupTab data={data} />}
          </>
        )}

        {!loading && !error && !data && (
          <div className="glass-card rounded-card p-6 text-center">
            <Clock size={24} className="text-text-dim mx-auto mb-2" />
            <p className="text-xs text-text-muted">No analytics data available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
