import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wellcollective.app',
  appName: 'WELL Collective',
  webDir: 'dist',
  android: {
    backgroundColor: "#050b14",
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
      disableAutoUpdate: "none",
    },
  },
};

export default config;
