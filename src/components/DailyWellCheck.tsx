import { Activity, ChevronDown, ChevronUp, Info, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { todayISO } from "../utils/format";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface ActivitySummary {
  type: string;
  points: number;
  count: number;
}

const ACTIVITY_LABELS: Record<string, string> = {
  app_open: "Opened the app",
  forum_post: "Posted in the community",
  forum_comment: "Commented in the community",
  class_watch: "Watched a class",
  song_play: "Listened to music",
  blog_open: "Read the blog",
  meal_log: "Logged a meal",
  sleep_log: "Logged sleep",
  breathwork: "Completed breathwork",
  stretching: "Did stretching",
  resistance_training: "Did resistance training",
  well_activity: "Completed a WELL activity",
  event_attend: "Attended an event",
  well_escape: "Attended a WELL Escape",
  tribe_add: "Added a tribe member",
  cardio: "Completed cardio",
  daily_challenge_accept: "Accepted a daily challenge",
};

const ACTIVITY_EMOJI: Record<string, string> = {
  app_open: "📱",
  forum_post: "✍️",
  forum_comment: "💬",
  class_watch: "🎥",
  song_play: "🎵",
  blog_open: "📖",
  meal_log: "🥗",
  sleep_log: "😴",
  breathwork: "🌬️",
  stretching: "🧘",
  resistance_training: "💪",
  well_activity: "⭐",
  event_attend: "📅",
  well_escape: "🌟",
  tribe_add: "🤝",
  cardio: "🏃",
  daily_challenge_accept: "🎯",
};

const POINTS_GUIDE = [
  { emoji: "📱", label: "Open the app", pts: 5 },
  { emoji: "✍️", label: "Post in community", pts: 10 },
  { emoji: "💬", label: "Comment in community", pts: 5 },
  { emoji: "🎥", label: "Complete a class", pts: 20 },
  { emoji: "🏃", label: "Complete cardio", pts: 20 },
  { emoji: "🎵", label: "Listen to music", pts: 5 },
  { emoji: "📖", label: "Read the blog", pts: 5 },
  { emoji: "🥗", label: "Log a meal", pts: 10 },
  { emoji: "😴", label: "Log sleep", pts: 10 },
  { emoji: "🌬️", label: "Breathwork", pts: 15 },
  { emoji: "🧘", label: "Stretching", pts: 15 },
  { emoji: "💪", label: "Resistance training", pts: 20 },
  { emoji: "⭐", label: "Well Activity", pts: 15 },
  { emoji: "📅", label: "Attend an event", pts: 25 },
  { emoji: "🤝", label: "Add a tribe member", pts: 5 },
  { emoji: "🎯", label: "Accept a daily challenge", pts: 10 },
  { emoji: "🌟", label: "Attend a WELL Escape", pts: 100 },
];

export default function DailyWellCheck({ email }: { email: string }) {
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(false);

  useEffect(() => {
    if (!API_URL || !email) return;
    fetch(`${API_URL}/api/activity/today?email=${encodeURIComponent(email)}`)
      .then((r) => (r.ok ? r.json() : { activities: [], totalPoints: 0 }))
      .then((d) => {
        setActivities(d.activities || []);
        setTotalPoints(d.totalPoints || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  const today = todayISO();
  const sleepDataRaw = localStorage.getItem(`well-sleep-data-${today}`);
  const sleepData = sleepDataRaw ? (() => { try { return JSON.parse(sleepDataRaw) as { hours: number; quality: string }; } catch { return null; } })() : null;

  const sleepRec = sleepData
    ? sleepData.quality === "not_enough" || sleepData.hours < 6
      ? `Tonight, try to get 7–9 hours. You logged ${sleepData.hours}h and felt under-rested.`
      : sleepData.quality === "needed_more"
      ? `You felt you needed more sleep last night (${sleepData.hours}h). Aim for earlier bedtime tonight.`
      : null
    : null;

  if (loading) return null;

  const completedCount = activities.length;

  return (
    <div className="glass-card rounded-card p-4 mb-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center shrink-0">
            <Activity size={16} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-text">Today's WELL CHECK</p>
            <p className="text-xs text-text-muted">
              {completedCount === 0
                ? "Nothing logged yet — the day is yours!"
                : `${completedCount} activit${completedCount === 1 ? "y" : "ies"} · ${totalPoints} pts`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalPoints > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-yellow-400">
              <Star size={12} className="fill-yellow-400" />
              {totalPoints}
            </span>
          )}
          {expanded ? <ChevronUp size={16} className="text-text-dim" /> : <ChevronDown size={16} className="text-text-dim" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
          {sleepRec && (
            <div className="flex items-start gap-2 bg-indigo-500/10 border border-indigo-400/30 rounded-card px-3 py-2 mb-1">
              <span className="text-base shrink-0">💤</span>
              <p className="text-xs text-text-muted leading-snug">{sleepRec}</p>
            </div>
          )}

          {completedCount === 0 ? (
            <p className="text-xs text-text-muted text-center py-2">
              Start logging your wellness activities to see your daily summary here.
            </p>
          ) : (
            <>
              {activities.map((a) => (
                <div key={a.type} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center shrink-0">{ACTIVITY_EMOJI[a.type] ?? "✅"}</span>
                  <span className="text-xs text-text flex-1 min-w-0">
                    {ACTIVITY_LABELS[a.type] ?? a.type}
                    {a.count > 1 && <span className="text-text-dim"> ×{a.count}</span>}
                  </span>
                  <span className="text-xs font-bold text-brand-light shrink-0">+{a.points} pts</span>
                </div>
              ))}

              <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                <span className="text-xs font-bold text-text">Today's total</span>
                <span className="text-sm font-bold text-yellow-400 flex items-center gap-1">
                  <Star size={13} className="fill-yellow-400" />
                  {totalPoints} pts
                </span>
              </div>
            </>
          )}

          {/* Points guide */}
          <button
            onClick={() => setGuideExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-text-dim mt-2 py-1.5 border-t border-border"
          >
            <Info size={12} />
            {guideExpanded ? "Hide point values" : "How are points earned?"}
            {guideExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {guideExpanded && (
            <div className="flex flex-col gap-1.5 bg-surface-2 rounded-card p-3">
              {POINTS_GUIDE.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center shrink-0">{item.emoji}</span>
                  <span className="text-xs text-text-muted flex-1">{item.label}</span>
                  <span className="text-xs font-bold text-brand-light shrink-0">+{item.pts}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
