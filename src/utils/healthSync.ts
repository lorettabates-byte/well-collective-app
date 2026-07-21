import { Capacitor } from "@capacitor/core";
import { Health, type HealthDataType, type SleepState } from "@capgo/capacitor-health";
import { todayISO } from "./format";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

// 'workouts' must be requested explicitly or queryWorkouts() returns empty.
// 'totalCalories' = full-day calorie burn from the tracker (replaces BMR estimate).
// 'distance' = walking/running distance aggregated by HealthKit/Health Connect.
const READ_TYPES: HealthDataType[] = ["steps", "sleep", "workouts"];

export interface SyncedRun {
  workoutType: string;
  distanceKm: number;
  durationMinutes: number;
  paceMinPerKm: number | null;
  caloriesBurned: number | null;
  startDate: string;
  endDate: string;
}

const ASLEEP_STATES: SleepState[] = ["asleep", "rem", "deep", "light"];

export async function isHealthSyncAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { available } = await Health.isAvailable();
    return available;
  } catch {
    return false;
  }
}

// Must be called directly from a user tap (never from a useEffect) — both
// HealthKit and Health Connect only show their permission sheet in response
// to a direct user gesture.
export async function requestHealthPermissions(): Promise<{ granted: boolean }> {
  try {
    const status = await Health.requestAuthorization({ read: READ_TYPES });
    // HealthKit never reveals whether a read permission was denied (by
    // design, to avoid leaking which health categories a user opted out
    // of) — readAuthorized reflects "was asked", not "was granted", on iOS.
    // The real signal on iOS is simply that queries come back empty if the
    // user actually denied access; this check is meaningful on Android.
    const granted = READ_TYPES.every((t) => status.readAuthorized.includes(t));
    return { granted };
  } catch (err) {
    console.error("Health permission request failed:", err);
    return { granted: false };
  }
}

export async function checkHealthPermissions(): Promise<boolean> {
  try {
    const status = await Health.checkAuthorization({ read: READ_TYPES });
    return READ_TYPES.every((t) => status.readAuthorized.includes(t));
  } catch {
    return false;
  }
}

async function syncStepsForToday(email: string): Promise<void> {
  if (!API_URL) return;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { samples } = await Health.queryAggregated({
    dataType: "steps",
    startDate: startOfDay.toISOString(),
    endDate: new Date().toISOString(),
    bucket: "day",
  });
  const total = samples.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return;

  // /api/steps upserts today's entry, so it's safe to call every sync.
  await fetch(`${API_URL}/api/steps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberEmail: email, steps: Math.round(total) }),
  });
}

async function syncSleepForLastNight(email: string): Promise<void> {
  if (!API_URL) return;

  // /api/sleep is insert-only (no upsert) — must guard here or every sync
  // would add a duplicate entry and double-award sleep points.
  const existing = await fetch(`${API_URL}/api/sleep/today?email=${encodeURIComponent(email)}`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  if (existing?.entry) return;

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 18 * 60 * 60 * 1000); // covers a full overnight window
  const { samples } = await Health.readSamples({
    dataType: "sleep",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    limit: 200,
  });

  let totalMinutes = 0;
  for (const sample of samples) {
    if (sample.sleepState && ASLEEP_STATES.includes(sample.sleepState)) {
      totalMinutes += (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()) / 60000;
    }
  }
  if (totalMinutes <= 0) return;

  const hours = Math.round((totalMinutes / 60) * 10) / 10;
  // Two-bucket heuristic: auto-sync never assigns "needed_more" — per the
  // app's own labels that's functionally the same as "not_enough" and only
  // makes sense as a manual self-report.
  const quality: "not_enough" | "enough" = hours < 6 ? "not_enough" : "enough";

  await fetch(`${API_URL}/api/sleep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberEmail: email, hours, quality }),
  });
}

async function syncCalorieBurnForToday(): Promise<void> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { samples } = await Health.queryAggregated({
    dataType: "totalCalories",
    startDate: startOfDay.toISOString(),
    endDate: new Date().toISOString(),
    bucket: "day",
  });
  const total = samples.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return;
  // Stored as a plain number string; WellCheck reads this and prefers it over BMR.
  localStorage.setItem(`well-health-calories-${todayISO()}`, String(Math.round(total)));
}

async function syncWorkoutsForToday(logWorkoutCompletion: () => void): Promise<void> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const now = new Date();

  const { workouts } = await Health.queryWorkouts({
    startDate: startOfDay.toISOString(),
    endDate: now.toISOString(),
    limit: 20,
  });
  if (workouts.length === 0) return;

  // Any session marks the day complete (matches manual log button).
  logWorkoutCompletion();

  // Extract running workouts and persist for the Wellness page run display.
  const runs: SyncedRun[] = workouts
    .filter((w) => w.workoutType === "running" || w.workoutType === "runningTreadmill")
    .map((w) => {
      const distanceKm = w.totalDistance != null ? Math.round((w.totalDistance / 1000) * 100) / 100 : 0;
      const durationMinutes =
        (new Date(w.endDate).getTime() - new Date(w.startDate).getTime()) / 60000;
      const paceMinPerKm =
        distanceKm > 0 ? Math.round((durationMinutes / distanceKm) * 10) / 10 : null;
      return {
        workoutType: w.workoutType,
        distanceKm,
        durationMinutes: Math.round(durationMinutes),
        paceMinPerKm,
        caloriesBurned: w.totalEnergyBurned != null ? Math.round(w.totalEnergyBurned) : null,
        startDate: w.startDate,
        endDate: w.endDate,
      };
    });

  if (runs.length > 0) {
    localStorage.setItem(`well-health-runs-${todayISO()}`, JSON.stringify(runs));
  }
}

async function syncWeightForToday(setWeightKg: (kg: number) => void): Promise<void> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Only take a weigh-in logged today (e.g. from a smart scale) — weightKg
  // is a single current-value profile field with no history, so pulling in
  // an old HealthKit sample could silently overwrite a value the user just
  // corrected by hand in Edit Profile.
  const { samples } = await Health.readSamples({
    dataType: "weight",
    startDate: startOfDay.toISOString(),
    endDate: new Date().toISOString(),
    limit: 10,
    ascending: false,
  });
  if (samples.length === 0) return;
  setWeightKg(samples[0].value);
}

export async function runDailyHealthSync(
  email: string,
  opts: { logWorkoutCompletion: () => void; setWeightKg: (kg: number) => void }
): Promise<void> {
  const results = await Promise.allSettled([
    syncStepsForToday(email),
    syncSleepForLastNight(email),
    syncWorkoutsForToday(opts.logWorkoutCompletion),
    syncWeightForToday(opts.setWeightKg),
    syncCalorieBurnForToday(),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("Health sync step failed:", r.reason);
  }
}
