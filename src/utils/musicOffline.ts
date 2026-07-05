import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import type { Song } from "../types";

const DOWNLOADS_KEY = "well-music-downloads";
const SONGS_DIR = "songs";

function filePath(songId: number): string {
  return `${SONGS_DIR}/${songId}.mp3`;
}

function loadDownloadedIds(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DOWNLOADS_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveDownloadedIds(ids: Set<number>) {
  localStorage.setItem(DOWNLOADS_KEY, JSON.stringify([...ids]));
}

export function isDownloaded(songId: number): boolean {
  return loadDownloadedIds().has(songId);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // FileReader gives a data URL ("data:audio/mpeg;base64,AAAA...") —
      // Filesystem.writeFile wants just the base64 payload, no prefix.
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Offline downloads only make sense on-device — the web build has no
// persistent native filesystem to write to, so it always just streams.
export async function downloadSong(song: Song): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (isDownloaded(song.id)) return;

  const response = await fetch(song.url);
  if (!response.ok) throw new Error(`Failed to fetch song: ${response.status}`);
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);

  await Filesystem.writeFile({
    path: filePath(song.id),
    data: base64,
    directory: Directory.Data,
    recursive: true,
  });

  const ids = loadDownloadedIds();
  ids.add(song.id);
  saveDownloadedIds(ids);
}

export async function deleteDownload(songId: number): Promise<void> {
  const ids = loadDownloadedIds();
  if (!ids.has(songId)) return;

  try {
    await Filesystem.deleteFile({ path: filePath(songId), directory: Directory.Data });
  } catch {
    // Already gone on disk — still clear the local record below.
  }

  ids.delete(songId);
  saveDownloadedIds(ids);
}

// Returns a local file:// URL (converted for WebView use) when a song has
// been downloaded, otherwise falls back to the original streaming URL —
// callers don't need to know which one they got.
export async function getPlaybackUrl(song: Song): Promise<string> {
  if (!Capacitor.isNativePlatform() || !isDownloaded(song.id)) return song.url;

  try {
    const { uri } = await Filesystem.getUri({ path: filePath(song.id), directory: Directory.Data });
    return Capacitor.convertFileSrc(uri);
  } catch {
    // Local record says downloaded but the file is missing (e.g. cleared by
    // the OS under storage pressure) — stream instead of failing playback.
    return song.url;
  }
}
