import { Component, StrictMode } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Capacitor } from "@capacitor/core";
import "./index.css";
import App from "./App.tsx";
import AuthGate from "./components/AuthGate";
import { AppProvider } from "./store/AppContext";
import { MusicPlayerProvider } from "./store/MusicPlayerContext";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: "#fff", background: "#0a0e1a", minHeight: "100vh", fontFamily: "monospace", fontSize: 13 }}>
          <p style={{ color: "#f87171", fontWeight: "bold", marginBottom: 8 }}>App crashed — error details:</p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#fca5a5" }}>
            {this.state.error.message}{"\n\n"}{this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthGate>
          <AppProvider>
            <MusicPlayerProvider>
              <App />
            </MusicPlayerProvider>
          </AppProvider>
        </AuthGate>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // sw.js calls skipWaiting()+clients.claim() on install, so a new SW
        // takes over immediately rather than waiting for all tabs to close.
        // Without this listener, the open page would still be running the
        // old JS bundle until the next full reload — which on an installed
        // home-screen PWA might never happen on its own, making it look
        // like updates require deleting and re-adding the app.
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
        // Browsers only re-check the SW script on navigation/SW events, so
        // for a PWA left open for hours this nudges it to check periodically.
        setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch((err) => {
        console.error("Service worker registration failed:", err);
      });
  });
}
