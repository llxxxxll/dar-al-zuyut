/* دار الزيوت — Service Worker (app-shell, network-first navigations) */
const VERSION = "v1.0.0";
const STATIC_CACHE = `dar-static-${VERSION}`;
const RUNTIME_CACHE = `dar-runtime-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("dar-") && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/_build/") ||
    /\.(?:css|js|woff2?|ttf|otf|png|jpe?g|webp|svg|ico)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache cross-origin (Supabase, fonts API, etc.) or auth-bearing requests
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (req.headers.get("authorization")) return;

  // Navigations → Network first, fallback to offline page
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          return fresh;
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          return (await cache.match(OFFLINE_URL)) || Response.error();
        }
      })()
    );
    return;
  }

  // Static assets → Cache first
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh.ok && fresh.type === "basic") cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
});