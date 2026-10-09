const CACHE = "spanisch-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(
      ks.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Network-first for API calls, cache-first for assets
  if (e.request.url.includes("supabase.co") || e.request.url.includes("api.openai.com")) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok && res.type === "basic") {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});

// Push notifications
self.addEventListener("push", e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || "Spanisch – 10 Minuten", {
      body: data.body || "Zeit für deine tägliche Session! 🇪🇸",
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      tag: "daily-reminder",
      renotify: true,
      data: { url: "./" }
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(cs => {
      const c = cs.find(w => w.visibilityState === "visible");
      if (c) return c.focus();
      return clients.openWindow(e.notification.data?.url || "./");
    })
  );
});
