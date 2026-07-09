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
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const appClient = clients.find((c) => c.url.startsWith(self.location.origin));
      if (appClient) {
        // Use client.navigate() for a guaranteed page change, then fall back to
        // postMessage for browsers that don't support it (navigate returns a Promise).
        const nav = appClient.navigate ? appClient.navigate(absoluteUrl) : Promise.reject();
        return nav
          .then((c) => (c || appClient).focus())
          .catch(() => {
            appClient.postMessage({ type: "NAVIGATE", url: targetUrl });
            return appClient.focus();
          });
      }
      return self.clients.openWindow(absoluteUrl);
    })
  );
});
