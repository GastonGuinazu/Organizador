const CACHE = "organizador-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((r) => r || Response.error())),
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Organizador", body: event.data?.text() ?? "" };
  }
  const title = typeof data.title === "string" ? data.title : "Organizador";
  const body = typeof data.body === "string" ? data.body : "";
  const targetUrl = typeof data.url === "string" ? data.url : "/dashboard";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body || undefined,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: targetUrl },
      tag: typeof data.tag === "string" ? data.tag : undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification.data?.url ?? "/dashboard";
  const path = raw.startsWith("/") ? raw : `/dashboard`;
  const target = `${self.location.origin}${path}`;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
