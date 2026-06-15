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

/**
 * Requests notification permission and, if the backend is configured,
 * subscribes to real push notifications via the service worker. Returns
 * true if notification permission was granted (regardless of whether the
 * backend push subscription succeeded), so local in-app notifications keep
 * working even without a configured backend.
 */
export async function subscribeToPush(userEmail?: string): Promise<boolean> {
  if (typeof Notification === "undefined") return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  if (isPushSupported() && API_URL && VAPID_PUBLIC_KEY) {
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

      await fetch(`${API_URL}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
  }

  return true;
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
