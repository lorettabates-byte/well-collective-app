import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import {
  isHealthSyncAvailable,
  requestHealthPermissions,
  runDailyHealthSync,
} from "../utils/healthSync";

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${enabled ? "gradient-brand" : "bg-surface-3"}`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function HealthSyncSettings() {
  const { user, updateProfile, logWorkoutCompletion } = useApp();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState("");

  useEffect(() => {
    isHealthSyncAvailable().then(setAvailable);
  }, []);

  const handleToggle = async () => {
    setError("");
    if (user.healthSyncEnabled) {
      updateProfile({ healthSyncEnabled: false });
      return;
    }
    // Must call this directly from the click handler — both HealthKit and
    // Health Connect only show their permission sheet in response to a
    // direct user gesture, not from an effect.
    const { granted } = await requestHealthPermissions();
    if (!granted) {
      setError(
        "Permission wasn't granted. You can enable it later in iOS Settings > Privacy > Health, or in the Health Connect app on Android."
      );
      return;
    }
    updateProfile({ healthSyncEnabled: true });
    if (user.email) {
      setSyncing(true);
      runDailyHealthSync(user.email, {
        logWorkoutCompletion,
        setWeightKg: (kg) => updateProfile({ weightKg: kg }),
      })
        .then(() => setLastSynced(new Date().toLocaleTimeString()))
        .finally(() => setSyncing(false));
    }
  };

  const handleSyncNow = () => {
    if (!user.email) return;
    setError("");
    setSyncing(true);
    runDailyHealthSync(user.email, {
      logWorkoutCompletion,
      setWeightKg: (kg) => updateProfile({ weightKg: kg }),
    })
      .then(() => setLastSynced(new Date().toLocaleTimeString()))
      .catch(() => setError("Sync failed. Please try again."))
      .finally(() => setSyncing(false));
  };

  return (
    <div>
      <TopBar title="Health Sync" showBack />
      <div className="px-4 pt-4 flex flex-col gap-2.5">
        {/* Apple Health / Health Connect platform badge */}
        <div className="glass-card rounded-card px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
            <span className="text-red-400 font-bold text-base leading-none">♥</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text">Powered by Apple Health &amp; Google Health Connect</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              This app reads health data from Apple Health (iOS) and Health Connect (Android).
              Data accessed: Steps, Sleep, Exercise.
            </p>
          </div>
        </div>

        {available === false && (
          <div className="flex gap-2 bg-red-500/10 border border-red-500/30 rounded-card p-3">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">
              Health data isn't available on this device. This feature requires the WELL
              Collective app installed from the App Store or Play Store.
            </p>
          </div>
        )}
        {error && (
          <div className="flex gap-2 bg-red-500/10 border border-red-500/30 rounded-card p-3">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        <div className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text">Connect Apple Health / Health Connect</p>
            <p className="text-xs text-text-muted mt-0.5">
              Auto-fill today's steps, sleep, and workouts from Apple Health or Health Connect
              each time you open the app
            </p>
          </div>
          <Toggle enabled={!!user.healthSyncEnabled} onToggle={handleToggle} />
        </div>
        {user.healthSyncEnabled && (
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center justify-center gap-2 glass-card rounded-card px-4 py-3 text-sm font-semibold text-text disabled:opacity-60"
          >
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        )}
        {lastSynced && !syncing && (
          <p className="text-xs text-text-muted text-center">Last synced at {lastSynced}</p>
        )}
        <p className="text-[11px] text-text-dim text-center px-2 mt-1">
          Health data is used only to auto-populate your daily WELL Check and is never shared with third parties.
        </p>
      </div>
    </div>
  );
}
