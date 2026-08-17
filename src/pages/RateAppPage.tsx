import { RateApp } from "capacitor-rate-app";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Opened when a member taps a "rate the app" push notification.
// Triggers the native App Store review dialog, then returns to home.
export default function RateAppPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await RateApp.requestReview();
      } catch {
        // Plugin unavailable (web preview) — no-op
      }
      navigate("/", { replace: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return null;
}
