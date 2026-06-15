const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
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
}

/**
 * Requests notification permission and, if the backend is configured,
 * subscribes to real push notifications via the service worker. Returns
 * success=true if notification permission was granted (regardless of
 * whether the backend push subscription succeeded), so local in-app
 * notifications keep working even without a configured backend. On
 * failure, `reason` explains why so the UI can surface it.
 */
export async function subscribeToPush(userEmail?: string): Promise<PushSubscribeResult> {
  if (typeof Notification === "undefined") {
    return {
      success: false,
      reason:
        "Notifications aren't supported in this browser. On iPhone/iPad, add WELL Collective to your Home Screen first (Share > Add to Home Screen), then enable notifications from there.",
    };
  }

  if (Notification.permission === "denied") {
    return {
      success: false,
      reason:
        "Notifications are blocked for this app. Enable them in your device or browser settings, then try again.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, reason: "Notification permission was not granted." };
  }

  if (!isPushSupported()) {
    return {
      success: false,
      reason:
        "Push notifications aren't supported in this browser. On iPhone/iPad, add WELL Collective to your Home Screen first (Share > Add to Home Screen), then enable notifications from there.",
    };
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

export async function unsubscribeFromPush(): Promise<void> {
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
