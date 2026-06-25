import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import AuthGate from "./components/AuthGate";
import { AppProvider } from "./store/AppContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthGate>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthGate>
    </BrowserRouter>
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
