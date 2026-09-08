import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

// Keys stored in Capacitor Preferences (native) or localStorage (web).
// Preferences survives Capgo OTA restarts; localStorage does not.
const TOKEN_KEY = "adminToken";
const ADMIN_KEY = "admin";

// In-memory cache so synchronous callers (AdminRoute, AppContext) can read
// without awaiting — populated by loadAdminSession() at app startup.
let _token: string | null = null;
let _admin: string | null = null;

async function prefsGet(key: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return localStorage.getItem(key);
  const { value } = await Preferences.get({ key });
  return value;
}

async function prefsSet(key: string, value: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) { localStorage.setItem(key, value); return; }
  await Preferences.set({ key, value });
}

async function prefsRemove(key: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) { localStorage.removeItem(key); return; }
  await Preferences.remove({ key });
}

// Call once at app startup to warm the in-memory cache.
export async function loadAdminSession(): Promise<void> {
  try {
    _token = await prefsGet(TOKEN_KEY);
    _admin = await prefsGet(ADMIN_KEY);
    // Mirror into localStorage so any code that still reads it directly works.
    if (_token) localStorage.setItem(TOKEN_KEY, _token);
    else localStorage.removeItem(TOKEN_KEY);
    if (_admin) localStorage.setItem(ADMIN_KEY, _admin);
    else localStorage.removeItem(ADMIN_KEY);
  } catch {
    // Fall back to whatever is already in localStorage.
    _token = localStorage.getItem(TOKEN_KEY);
    _admin = localStorage.getItem(ADMIN_KEY);
  }
}

// Synchronous reads — valid after loadAdminSession() has resolved.
export function getAdminToken(): string | null { return _token; }
export function getAdminData(): string | null { return _admin; }
export function isAdminLoggedIn(): boolean { return !!_token && !!_admin; }

export async function saveAdminSession(token: string, admin: object): Promise<void> {
  const adminStr = JSON.stringify(admin);
  _token = token;
  _admin = adminStr;
  await Promise.all([
    prefsSet(TOKEN_KEY, token),
    prefsSet(ADMIN_KEY, adminStr),
  ]);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, adminStr);
}

export async function clearAdminSession(): Promise<void> {
  _token = null;
  _admin = null;
  await Promise.all([
    prefsRemove(TOKEN_KEY),
    prefsRemove(ADMIN_KEY),
  ]);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}
