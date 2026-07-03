import { Activity, ChevronDown, ChevronUp, Star } from "lucide-react";
import { useEffect, useState } from "react";

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
  daily_challenge_accept: "🎯",
};

export default function DailyWellCheck({ email }: { email: string }) {
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

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
        </div>
      )}
    </div>
  );
}
