import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

export interface NowPlayingPlugin {
  setTrack(options: { title: string; artist: string; artworkUrl: string; duration?: number }): Promise<void>;
  setPlaybackState(options: { isPlaying: boolean; currentTime?: number }): Promise<void>;
  updateElapsed(options: { currentTime: number }): Promise<void>;
  clear(): Promise<void>;
  // Fired by the native plugin when an AVAudioSession interruption (phone call,
  // Siri, etc.) begins or ends so JS can pause/resume playback correctly.
  addListener(event: "interruptionBegan", cb: () => void): Promise<PluginListenerHandle>;
  addListener(event: "interruptionEnded", cb: (data: { shouldResume: boolean }) => void): Promise<PluginListenerHandle>;
  // Fired when the user scrubs on the lock screen / Control Center.
  addListener(event: "seekTo", cb: (data: { position: number }) => void): Promise<PluginListenerHandle>;
}

// No-op web implementation — the MediaSession API handles this on web/PWA.
const NowPlaying = registerPlugin<NowPlayingPlugin>("NowPlaying", {
  web: {
    setTrack: async () => {},
    setPlaybackState: async () => {},
    clear: async () => {},
    addListener: async () => ({ remove: async () => {} }),
  },
});

export { NowPlaying };
