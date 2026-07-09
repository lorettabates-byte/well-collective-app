import { Capacitor, registerPlugin } from "@capacitor/core";

interface WellCheckWidgetSnapshot {
  points: string;
  areas: string;
  sleep: string;
  energyIn: string;
  energyOut: string;
  steps: string;
  updatedAt: string;
}

interface WellCheckWidgetPlugin {
  saveSnapshot(options: WellCheckWidgetSnapshot): Promise<{ ok: boolean }>;
}

const NativeWellCheckWidget = registerPlugin<WellCheckWidgetPlugin>("WellCheckWidget");

export async function syncWellCheckWidget(snapshot: WellCheckWidgetSnapshot): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NativeWellCheckWidget.saveSnapshot(snapshot);
  } catch {
    // iOS WidgetKit support is scaffolded separately; Android implements this plugin now.
  }
}
