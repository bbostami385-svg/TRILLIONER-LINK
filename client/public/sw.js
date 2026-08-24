const SHELL_CACHE = "trillioner-link-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(["/", "/offline-videos"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((response) => {
    if (response.ok && (requestUrl.pathname.startsWith("/assets/") || requestUrl.pathname === "/")) {
      const copy = response.clone();
      void caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => requestUrl.pathname.startsWith("/offline-videos") ? caches.match("/") : Response.error())));
});
