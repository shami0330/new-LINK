/* Link Messenger service worker.
   - index.html is served from cache "link-v4" (the in-app updater writes the new index.html there).
   - Requests with ?_u= and non-GET (HEAD) requests are the updater's checks: always go to network. */
const CACHE = "link-v4";
const SCOPE = self.registration.scope;
const INDEX = new URL("index.html", SCOPE).href;
const PRE = ["index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/icon-180.png", "icons/favicon-32.png"].map(p => new URL(p, SCOPE).href);

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(PRE.map(u => fetch(u, { cache: "reload" }).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.searchParams.has("_u")) return;
  if (req.mode === "navigate") {
    e.respondWith(
      caches.match(INDEX).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(INDEX, c)); }
        return res;
      }))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && url.pathname.startsWith(new URL(SCOPE).pathname)) { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); }
      return res;
    }))
  );
});
