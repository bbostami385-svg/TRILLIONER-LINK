const SHELL_CACHE = "trillioner-link-shell-v2";
const SHELL_ROUTES = ["/", "/videos", "/shorts", "/offline-videos", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ROUTES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((response) => {
    if (response.ok && (requestUrl.pathname.startsWith("/assets/") || SHELL_ROUTES.includes(requestUrl.pathname))) {
      const copy = response.clone();
      void caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => requestUrl.pathname.startsWith("/playlist/") || requestUrl.pathname.startsWith("/offline-videos") || requestUrl.pathname.startsWith("/videos") || requestUrl.pathname.startsWith("/shorts") ? caches.match("/") : Response.error())));
});
