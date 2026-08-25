import { registerPlugin } from "@capacitor/core";

export interface NowPlayingPlugin {
  setTrack(options: { title: string; artist: string; artworkUrl: string; duration?: number }): Promise<void>;
  setPlaybackState(options: { isPlaying: boolean }): Promise<void>;
  clear(): Promise<void>;
}

// No-op web implementation — the MediaSession API handles this on web/PWA.
const NowPlaying = registerPlugin<NowPlayingPlugin>("NowPlaying", {
  web: {
    setTrack: async () => {},
    setPlaybackState: async () => {},
    clear: async () => {},
  },
});

export { NowPlaying };
