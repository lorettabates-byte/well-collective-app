const LOGO_URL = "/icons/notification-icon-v2.png";
const BADGE_URL = "/icons/notification-badge-v2.png";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "WELL Collective", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "WELL Collective";
  const options = {
    body: data.body || "",
    icon: data.icon || LOGO_URL,
    badge: data.badge || BADGE_URL,
    image: data.image || undefined,
    tag: data.tag || "well-collective",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        // App is open — send a message so React Router navigates without a reload
        const client = clients[0];
        client.postMessage({ type: "NAVIGATE", url: targetUrl });
        return client.focus();
      }
      // App is closed — open it at the target URL
      const absoluteUrl = new URL(targetUrl, self.location.origin).href;
      return self.clients.openWindow(absoluteUrl);
    })
  );
});
