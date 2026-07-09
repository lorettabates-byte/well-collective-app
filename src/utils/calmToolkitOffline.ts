import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { ALL_CALM_CUES } from "../data/calmCues";

const CALM_DIR = "calmCues";
const CACHE_KEY = "well-calm-cues-downloaded";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function cueFilePath(index: number): string {
  return `${CALM_DIR}/cue_${String(index).padStart(3, "0")}.mp3`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function isCalmToolkitCached(): boolean {
  return localStorage.getItem(CACHE_KEY) === "1";
}

export async function downloadAllCalmCues(
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  if (!Capacitor.isNativePlatform() || !API_URL) return;

  const total = ALL_CALM_CUES.length;
  for (let i = 0; i < total; i++) {
    try {
      const res = await fetch(
        `${API_URL}/api/breathwork/calm-cue?text=${encodeURIComponent(ALL_CALM_CUES[i])}`
      );
      if (!res.ok) continue;
      const blob = await res.blob();
      const base64 = await blobToBase64(blob);
      await Filesystem.writeFile({
        path: cueFilePath(i),
        data: base64,
        directory: Directory.Data,
        recursive: true,
      });
    } catch {
      // Individual cue failures are non-fatal — the rest still download.
    }
    onProgress?.(i + 1, total);
  }
  localStorage.setItem(CACHE_KEY, "1");
}

export async function getOfflineCueUrl(text: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform() || !isCalmToolkitCached()) return null;

  const index = (ALL_CALM_CUES as readonly string[]).indexOf(text);
  if (index === -1) return null;

  try {
    const { uri } = await Filesystem.getUri({
      path: cueFilePath(index),
      directory: Directory.Data,
    });
    return Capacitor.convertFileSrc(uri);
  } catch {
    return null;
  }
}
