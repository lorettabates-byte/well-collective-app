import { Capacitor, registerPlugin } from "@capacitor/core";

interface WellCheckWidgetSnapshot {
  points: string;
  areas: string;
  sleep: string;
  energyIn: string;
  energyOut: string;
  steps: string;
  updatedAt: string;
  reminder: string;
  unreadCount: string;
}

interface WellCheckWidgetPlugin {
  saveSnapshot(options: WellCheckWidgetSnapshot): Promise<{ ok: boolean }>;
}

const NativeWellCheckWidget = registerPlugin<WellCheckWidgetPlugin>("WellCheckWidget");

const SNAPSHOT_CACHE_KEY = "well-check-widget-snapshot";

export function getCachedWidgetSnapshot(): Partial<WellCheckWidgetSnapshot> {
  try {
    const raw = localStorage.getItem(SNAPSHOT_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function cacheWidgetSnapshot(snapshot: WellCheckWidgetSnapshot) {
  try { localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(snapshot)); } catch {}
}

export async function syncWellCheckWidget(snapshot: WellCheckWidgetSnapshot): Promise<void> {
  cacheWidgetSnapshot(snapshot);
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NativeWellCheckWidget.saveSnapshot(snapshot);
  } catch {
    // iOS WidgetKit support is scaffolded separately; Android implements this plugin now.
  }
}
