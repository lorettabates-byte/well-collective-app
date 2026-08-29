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
        // Focus first, then postMessage — sending before focus() resolves means the
        // app is still backgrounded/suspended when the message arrives and the React
        // Router listener in App.tsx may not be active yet, causing the navigation
        // to be silently dropped and the user lands on the home screen.
        return appClient.focus().then(() => {
          appClient.postMessage({ type: "NAVIGATE", url: targetUrl });
        });
      }
      return self.clients.openWindow(absoluteUrl);
    })
  );
});
