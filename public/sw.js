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
        // client.navigate() changes the page URL directly at the browser level,
        // which React Router picks up on mount — more reliable than postMessage,
        // which can be dropped when the app is backgrounded/suspended and the
        // JS event listener isn't active yet.
        return appClient.focus().then(() => {
          return appClient.navigate(absoluteUrl);
        }).catch(() => {
          // Fallback: postMessage if navigate() isn't supported
          appClient.postMessage({ type: "NAVIGATE", url: targetUrl });
        });
      }
      return self.clients.openWindow(absoluteUrl);
    })
  );
});
