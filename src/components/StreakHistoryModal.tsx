import { useEffect, useState } from "react";
import { Check, Flame, X } from "lucide-react";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface StreakHistory {
  currentStreak: number;
  longestStreak: number;
  history: { date: string; loggedIn: boolean }[];
  milestones: { days: number; bonus: number; reached: boolean }[];
  nextMilestone: { days: number; bonus: number; daysRemaining: number } | null;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function StreakHistoryModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [data, setData] = useState<StreakHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API_URL) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/streak/history?email=${encodeURIComponent(email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-6" onClick={onClose}>
      <div
        className="relative gradient-brand p-[1px] rounded-card shadow-glow max-w-sm w-full animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface rounded-card p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
          <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 text-text-dim">
            <X size={16} />
          </button>

          {loading ? (
            <p className="text-sm text-text-muted text-center py-8">Loading your streak...</p>
          ) : !data || data.currentStreak === 0 ? (
            <div className="flex flex-col items-center text-center gap-2 py-6">
              <Flame size={28} className="text-text-dim" />
              <p className="text-sm text-text-muted">Open the app tomorrow to start your login streak!</p>
            </div>
          ) : (
            <>
              {/* Header: current streak */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-brand shadow-glow flex items-center justify-center shrink-0">
                  <Flame size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">{data.currentStreak}-Day Streak</h2>
                  <p className="text-xs text-text-muted">Longest streak: {data.longestStreak} days</p>
                </div>
              </div>

              {/* Past week login history */}
              <div>
                <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-2">This Week</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {data.history.map((day, i) => {
                    const d = new Date(day.date + "T00:00:00");
                    const isToday = i === data.history.length - 1;
                    return (
                      <div key={day.date} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-text-dim">{DAY_LABELS[d.getDay()]}</span>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                            day.loggedIn
                              ? "gradient-brand border-transparent"
                              : isToday
                              ? "border-brand-light/50 border-dashed"
                              : "border-border bg-surface-2"
                          }`}
                        >
                          {day.loggedIn && <Check size={14} className="text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress toward next milestone */}
              {data.nextMilestone && (
                <div className="bg-surface-2 border border-border rounded-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-text">
                      {data.nextMilestone.daysRemaining} more day{data.nextMilestone.daysRemaining !== 1 ? "s" : ""} to next bonus
                    </p>
                    <span className="text-xs font-bold text-brand-light">+{data.nextMilestone.bonus} pts</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full gradient-brand transition-all"
                      style={{ width: `${Math.min(100, (data.currentStreak / data.nextMilestone.days) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* All milestones */}
              <div>
                <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-2">Streak Milestones</p>
                <div className="flex flex-col gap-2">
                  {data.milestones.map((m) => (
                    <div
                      key={m.days}
                      className={`flex items-center gap-3 rounded-card px-3 py-2 ${
                        m.reached ? "bg-brand/10 border border-brand-light/20" : "bg-surface-2 border border-border"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          m.reached ? "gradient-brand" : "bg-surface border border-border"
                        }`}
                      >
                        {m.reached ? (
                          <Check size={13} className="text-white" />
                        ) : (
                          <span className="text-[10px] font-bold text-text-dim">{m.days}</span>
                        )}
                      </div>
                      <p className={`text-sm flex-1 ${m.reached ? "text-brand-light font-semibold" : "text-text-muted"}`}>
                        {m.days}-day streak
                      </p>
                      <span className={`text-xs font-bold ${m.reached ? "text-brand-light" : "text-text-dim"}`}>
                        +{m.bonus} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
