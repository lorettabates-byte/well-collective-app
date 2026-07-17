import { Moon, RefreshCw, Watch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { isHealthSyncAvailable, runDailyHealthSync } from "../utils/healthSync";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

type SleepQuality = "feel_great" | "enough" | "needed_more" | "not_enough";

interface SleepEntry {
  date: string;
  hours: number;
  quality: SleepQuality;
}

const QUALITY_LABEL: Record<SleepQuality, string> = {
  feel_great: "Felt great",
  enough: "Enough",
  needed_more: "Needed more",
  not_enough: "Not enough",
};

function barColor(entry: SleepEntry | undefined): string {
  if (!entry) return "bg-surface-3";
  if (entry.hours >= 7) return "gradient-brand";
  if (entry.hours >= 5) return "bg-amber-500/70";
  return "bg-red-500/60";
}

function barColorInline(entry: SleepEntry | undefined): React.CSSProperties {
  if (!entry) return { opacity: 0.2 };
  return {};
}

// Returns an array of ISO date strings (YYYY-MM-DD) for the last `n` days,
// ending today, in ascending order.
function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function dayLabel(dateStr: string, count: number): string {
  const d = new Date(dateStr + "T12:00:00");
  if (count <= 7) return d.toLocaleDateString("en-US", { weekday: "narrow" });
  if (count <= 14) return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
  return String(d.getDate());
}

function calcStreaks(entryMap: Map<string, SleepEntry>, days: string[]) {
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const e = entryMap.get(days[i]);
    if (e && e.hours >= 6) current++;
    else break;
  }
  let best = 0, run = 0;
  for (const d of days) {
    const e = entryMap.get(d);
    if (e && e.hours >= 6) { run++; if (run > best) best = run; }
    else run = 0;
  }
  return { current, best };
}

const PERIODS = [7, 14, 30] as const;
type Period = (typeof PERIODS)[number];

export default function SleepAnalysis() {
  const { user, updateProfile, logWorkoutCompletion } = useApp();
  const [allEntries, setAllEntries] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(14);
  const [syncing, setSyncing] = useState(false);
  const [healthAvailable, setHealthAvailable] = useState(false);

  useEffect(() => {
    isHealthSyncAvailable().then(setHealthAvailable);
  }, []);

  useEffect(() => {
    if (!user.email || !API_URL) { setLoading(false); return; }
    fetch(`${API_URL}/api/sleep/history?email=${encodeURIComponent(user.email)}&days=30`)
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => setAllEntries(data.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.email]);

  const days = useMemo(() => lastNDays(period), [period]);

  const entryMap = useMemo(
    () => new Map(allEntries.map((e) => [e.date, e])),
    [allEntries]
  );

  const windowEntries = useMemo(
    () => days.map((d) => entryMap.get(d)),
    [days, entryMap]
  );

  const logged = windowEntries.filter(Boolean) as SleepEntry[];
  const avgHours = logged.length
    ? Math.round((logged.reduce((s, e) => s + e.hours, 0) / logged.length) * 10) / 10
    : null;

  const qualityCounts = logged.reduce<Record<string, number>>((acc, e) => {
    acc[e.quality] = (acc[e.quality] ?? 0) + 1;
    return acc;
  }, {});
  const goodNights = (qualityCounts["feel_great"] ?? 0) + (qualityCounts["enough"] ?? 0);

  const { current: currentStreak, best: bestStreak } = useMemo(
    () => calcStreaks(entryMap, days),
    [entryMap, days]
  );

  // Scale: 10h = 100% bar height. Reference line at 8h = 80%.
  const barHeightPct = (entry: SleepEntry | undefined) =>
    entry ? Math.min(100, (entry.hours / 10) * 100) : 6;

  const handleSyncNow = () => {
    if (!user.email) return;
    setSyncing(true);
    runDailyHealthSync(user.email, {
      logWorkoutCompletion,
      setWeightKg: (kg) => updateProfile({ weightKg: kg }),
    })
      .then(() => {
        // Reload history after sync
        if (!API_URL) return;
        return fetch(`${API_URL}/api/sleep/history?email=${encodeURIComponent(user.email!)}&days=30`)
          .then((r) => (r.ok ? r.json() : { entries: [] }))
          .then((data) => setAllEntries(data.entries ?? []));
      })
      .catch(() => {})
      .finally(() => setSyncing(false));
  };

  return (
    <div>
      <TopBar title="Sleep Analysis" showBack />
      <div className="px-4 pt-4 flex flex-col gap-3 pb-8">

        {/* Period toggle */}
        <div className="flex gap-1.5 glass-card rounded-card p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 text-xs font-semibold rounded-pill py-1.5 transition-colors ${
                period === p
                  ? "gradient-brand text-white"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {p}d
            </button>
          ))}
        </div>

        {/* Bar chart */}
        <div className="glass-card rounded-card p-4">
          <p className="text-[10px] text-text-dim uppercase tracking-wide mb-3">
            Hours per night — last {period} days
          </p>

          {loading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-border border-t-text-muted rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="relative h-24">
                {/* 8h reference line */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-text-dim/40 pointer-events-none"
                  style={{ bottom: "80%" }}
                />
                <span
                  className="absolute right-0 text-[9px] text-text-dim"
                  style={{ bottom: "81%" }}
                >
                  8h
                </span>

                {/* Bars */}
                <div className="absolute inset-0 flex items-end gap-[2px] pr-5">
                  {windowEntries.map((entry, i) => (
                    <div
                      key={days[i]}
                      className="flex-1 flex flex-col items-center gap-0.5"
                    >
                      <div
                        className={`w-full rounded-t-[3px] transition-all ${barColor(entry)}`}
                        style={{
                          height: `${barHeightPct(entry)}%`,
                          ...barColorInline(entry),
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex gap-[2px] pr-5 mt-1">
                {days.map((d, i) => (
                  <div
                    key={d}
                    className={`flex-1 text-center text-[9px] ${
                      windowEntries[i] ? "text-text-dim" : "text-text-dim/40"
                    }`}
                  >
                    {dayLabel(d, period)}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex gap-3 mt-3">
                <span className="flex items-center gap-1 text-[10px] text-text-dim">
                  <span className="w-2.5 h-2.5 rounded-sm gradient-brand inline-block" /> 7h+
                </span>
                <span className="flex items-center gap-1 text-[10px] text-text-dim">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/70 inline-block" /> 5–7h
                </span>
                <span className="flex items-center gap-1 text-[10px] text-text-dim">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500/60 inline-block" /> &lt;5h
                </span>
                <span className="flex items-center gap-1 text-[10px] text-text-dim">
                  <span className="w-2.5 h-2.5 rounded-sm bg-surface-3 inline-block opacity-40" /> No data
                </span>
              </div>
            </>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-xl font-bold font-serif text-text">
              {loading ? "—" : avgHours != null ? `${avgHours}h` : "—"}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">Avg / night</p>
          </div>
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-xl font-bold font-serif text-text">
              {loading ? "—" : `${logged.length}/${period}`}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">Nights logged</p>
          </div>
          <div className="glass-card rounded-card p-3 text-center">
            <p className="text-xl font-bold font-serif text-text">
              {loading ? "—" : logged.length ? `${Math.round((goodNights / logged.length) * 100)}%` : "—"}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">Good nights</p>
          </div>
        </div>

        {/* Streak cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-card rounded-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Moon size={13} className="text-text-dim" />
              <p className="text-[10px] text-text-dim uppercase tracking-wide">Current streak</p>
            </div>
            <p className="text-2xl font-bold font-serif text-text">
              {loading ? "—" : currentStreak}
            </p>
            <p className="text-[10px] text-text-muted">nights of 6h+</p>
          </div>
          <div className="glass-card rounded-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Moon size={13} className="text-text-dim" />
              <p className="text-[10px] text-text-dim uppercase tracking-wide">Best streak</p>
            </div>
            <p className="text-2xl font-bold font-serif text-text">
              {loading ? "—" : bestStreak}
            </p>
            <p className="text-[10px] text-text-muted">nights of 6h+</p>
          </div>
        </div>

        {/* Quality breakdown */}
        {logged.length > 0 && (
          <div className="glass-card rounded-card p-4">
            <p className="text-[10px] text-text-dim uppercase tracking-wide mb-3">
              Quality breakdown
            </p>
            <div className="flex flex-col gap-2">
              {(["feel_great", "enough", "needed_more", "not_enough"] as SleepQuality[])
                .filter((q) => qualityCounts[q])
                .map((q) => {
                  const count = qualityCounts[q] ?? 0;
                  const pct = Math.round((count / logged.length) * 100);
                  return (
                    <div key={q} className="flex items-center gap-2">
                      <p className="text-xs text-text-muted w-24 shrink-0">{QUALITY_LABEL[q]}</p>
                      <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            q === "feel_great" || q === "enough" ? "gradient-brand" : "bg-amber-500/70"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-dim w-8 text-right">{count}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Health sync CTA or sync button */}
        {healthAvailable && (
          user.healthSyncEnabled ? (
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center justify-center gap-2 glass-card rounded-card px-4 py-3 text-sm font-semibold text-text disabled:opacity-60"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync sleep from watch"}
            </button>
          ) : (
            <Link
              to="/profile/health-sync"
              className="flex items-center gap-3 glass-card rounded-card px-4 py-3"
            >
              <Watch size={16} className="text-text-dim shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">Connect your watch</p>
                <p className="text-xs text-text-muted">
                  Auto-fill sleep data from Apple Health or Health Connect
                </p>
              </div>
              <span className="text-text-dim text-xs">›</span>
            </Link>
          )
        )}

        {/* Tip */}
        <div className="glass-card rounded-card p-4">
          <p className="text-[10px] text-text-dim uppercase tracking-wide mb-1.5">Sleep tip</p>
          <p className="text-xs text-text-muted leading-relaxed">
            Adults need 7–9 hours of sleep per night. Consistent sleep and wake times — even on
            weekends — are one of the most powerful tools for improving sleep quality and energy
            levels throughout the day.
          </p>
        </div>

      </div>
    </div>
  );
}
