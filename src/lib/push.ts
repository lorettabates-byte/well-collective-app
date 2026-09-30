import { Capacitor } from "@capacitor/core";
import { PushNotifications, type Token, type RegistrationError } from "@capacitor/push-notifications";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function isPushSupported(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  return "serviceWorker" in navigator && "PushManager" in window;
}

function notSupportedMessage(): string {
  if (Capacitor.isNativePlatform()) {
    if (Capacitor.getPlatform() === "android") {
      return "To enable notifications, go to your phone's Settings > Apps > WELL with Loretta > Notifications and turn them on.";
    }
    return "To enable notifications, go to Settings > WELL with Loretta > Notifications on your device.";
  }
  return "Notifications aren't supported in this browser. On iPhone or iPad, use Share > Add to Home Screen first, then enable notifications from there.";
}

function deniedMessage(): string {
  if (Capacitor.isNativePlatform()) {
    if (Capacitor.getPlatform() === "android") {
      return "Notifications are blocked. Go to Settings > Apps > WELL with Loretta > Notifications to enable them.";
    }
    return "Notifications are blocked. Go to Settings > WELL with Loretta > Notifications to enable them.";
  }
  return "Notifications are blocked for this app. Enable them in your device or browser settings, then try again.";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushSubscribeResult {
  success: boolean;
  reason?: string;
  permissionDenied?: boolean;
}

// Listeners must be attached before register(): iOS returns a cached token
// almost instantly on repeat calls, which would otherwise be missed.
async function getNativeToken(timeoutMs: number): Promise<string> {
  let resolveToken!: (value: string) => void;
  let rejectToken!: (err: Error) => void;
  const tokenPromise = new Promise<string>((resolve, reject) => {
    resolveToken = resolve;
    rejectToken = reject;
  });
  const onToken = await PushNotifications.addListener("registration", (t: Token) => resolveToken(t.value));
  const onError = await PushNotifications.addListener("registrationError", (err: RegistrationError) =>
    rejectToken(new Error(err.error)),
  );
  const timeout = setTimeout(() => rejectToken(new Error("Token registration timed out")), timeoutMs);
  try {
    await PushNotifications.register();
    return await tokenPromise;
  } finally {
    clearTimeout(timeout);
    await onToken.remove().catch(() => {});
    await onError.remove().catch(() => {});
  }
}

async function subscribeNative(userEmail?: string): Promise<PushSubscribeResult> {
  if (!API_URL) return { success: false, reason: "Push notifications aren't configured on the server." };

  try {
    // Always call requestPermissions() rather than gating on checkPermissions().
    // The native plugin's checkPermissions() sometimes returns "denied" in a stale
    // state (e.g. after a reinstall or fresh native build) even when iOS has never
    // shown the OS dialog. Calling requestPermissions() unconditionally forces iOS
    // to either show the dialog (fresh install / notDetermined) or return the real
    // cached state, and either way iOS finally registers the app in Settings >
    // WELL Collective > Notifications so the user can toggle it manually.
    let permResult = await PushNotifications.requestPermissions();

    if (permResult.receive !== "granted") {
      return { success: false, reason: deniedMessage(), permissionDenied: true };
    }

    const token = await getNativeToken(15000);

    const platform = Capacitor.getPlatform();
    const res = await fetch(`${API_URL}/api/device-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform, userEmail }),
    });
    if (!res.ok) throw new Error(`device-token save failed: ${res.status}`);

    return { success: true };
  } catch (err) {
    console.error("Native push registration failed:", err);
    return { success: false, reason: "Something went wrong setting up push notifications. Please try again." };
  }
}

/**
 * Requests notification permission and registers for push.
 * On iOS/Android uses the native Capacitor plugin (FCM/APNs).
 * On web/PWA uses Web Push (VAPID via service worker).
 */
export async function subscribeToPush(userEmail?: string): Promise<PushSubscribeResult> {
  if (Capacitor.isNativePlatform()) {
    return subscribeNative(userEmail);
  }

  if (typeof Notification === "undefined") {
    return { success: false, reason: notSupportedMessage() };
  }
  if (Notification.permission === "denied") {
    return { success: false, reason: deniedMessage() };
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, reason: "Notification permission was not granted." };
  }

  if (!isPushSupported()) {
    return { success: false, reason: notSupportedMessage() };
  }

  if (!API_URL || !VAPID_PUBLIC_KEY) {
    return { success: false, reason: "Push notifications aren't configured on the server." };
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    const payload = {
      ...subscription.toJSON(),
      userEmail: userEmail || undefined,
    };

    const res = await fetch(`${API_URL}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, reason: "Could not save your subscription. Please try again." };
    }
  } catch (err) {
    console.error("Push subscription failed:", err);
    return { success: false, reason: "Something went wrong setting up push notifications. Please try again." };
  }

  return { success: true };
}

/**
 * Called silently on app startup when pushEnabled=true to re-register
 * the native token (which can rotate) or revalidate the web subscription.
 */
export async function revalidatePushSubscription(userEmail?: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await subscribeNative(userEmail).catch(() => {});
    return;
  }

  if (!isPushSupported() || !API_URL || !VAPID_PUBLIC_KEY) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
      } else {
        return;
      }
    }
    const payload = { ...subscription.toJSON(), userEmail: userEmail || undefined };
    await fetch(`${API_URL}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Push revalidation failed (non-fatal):", err);
  }
}

export async function unsubscribeFromPush(_userEmail?: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    if (!API_URL) return;
    try {
      const permResult = await PushNotifications.checkPermissions();
      if (permResult.receive === "granted") {
        const token = await getNativeToken(10000);
        await fetch(`${API_URL}/api/device-token`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }
    } catch (err) {
      console.warn("Native unsubscribe failed (non-fatal):", err);
    }
    return;
  }

  if (!isPushSupported() || !API_URL) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await fetch(`${API_URL}/api/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}
