import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const buildVersion = process.env.GITHUB_SHA || String(Date.now())

// Emits dist/version.json so the running app can detect when a newer
// build has been deployed and prompt itself to reload.
function buildVersionPlugin(): Plugin {
  return {
    name: 'write-build-version',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: buildVersion }),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), buildVersionPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  resolve: {
    alias: {
      // Replace the native-only Capacitor push plugin with a no-op stub for
      // the web/PWA bundle. Capacitor.isNativePlatform() is always false in
      // the browser so the stub methods are never actually called.
      '@capacitor/push-notifications': path.resolve(__dirname, 'src/lib/capacitor-push-stub.ts'),
    },
  },
  build: {
    // Older Safari/iOS versions (pre-16.4) are still in use by some members;
    // widen the JS syntax target so the bundle parses on those devices too.
    target: ['es2020', 'safari14', 'ios14'],
  },
})
