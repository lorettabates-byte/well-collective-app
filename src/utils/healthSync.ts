import { Capacitor } from "@capacitor/core";
import { Health, type HealthDataType, type SleepState } from "@capgo/capacitor-health";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

// 'workouts' must be requested explicitly (separate from steps/sleep) or
// queryWorkouts() comes back empty even after the user grants the others.
const READ_TYPES: HealthDataType[] = ["steps", "sleep", "workouts"];

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

async function syncWorkoutsForToday(logWorkoutCompletion: () => void): Promise<void> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { workouts } = await Health.queryWorkouts({
    startDate: startOfDay.toISOString(),
    endDate: new Date().toISOString(),
    limit: 10,
  });
  // workoutLog is just a presence/absence date array — any session today is
  // enough to mark the day complete, matching the existing manual-log button.
  if (workouts.length > 0) logWorkoutCompletion();
}

export async function runDailyHealthSync(
  email: string,
  opts: { logWorkoutCompletion: () => void }
): Promise<void> {
  const results = await Promise.allSettled([
    syncStepsForToday(email),
    syncSleepForLastNight(email),
    syncWorkoutsForToday(opts.logWorkoutCompletion),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("Health sync step failed:", r.reason);
  }
}
