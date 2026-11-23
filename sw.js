/* Link Messenger service worker.
   - index.html is served from cache "link-v4" (the in-app updater writes the new index.html there).
   - Requests with ?_u= and non-GET (HEAD) requests are the updater's checks: always go to network. */
const CACHE = "link-v4";
const SCOPE = self.registration.scope;
const INDEX = new URL("index.html", SCOPE).href;
const PRE = ["index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/icon-180.png", "icons/favicon-32.png"].map(p => new URL(p, SCOPE).href);
/* پیش‌کش کتابخانه | Library Precache: Appwrite محلی هنگام نصب کش می‌شود تا آفلاین هم برنامه بالا بیاید؛ با حالت عادی گرفته می‌شود تا اگر صفحه همین الان آن را گرفته دوباره دانلود نشود (the local Appwrite is cached at install so the app also starts offline; fetched in normal cache mode so it is not downloaded twice) */
const PRE_LIB = ["libs/appwrite.js"].map(p => new URL(p, SCOPE).href);
/* پیش‌کش بیکاری | Idle Precache: فایل‌های جداشده‌ی کوچک؛ فقط وقتی صفحه در زمان بیکاری پیام بدهد گرفته می‌شوند تا با اولین نمایش رقابت نکنند (small split files; fetched only when the page sends an idle message so they never compete with the first display). The names carry a content hash: when a file changes, its name and the reference in index.html change too. */
const EXTRA = ["libs/lkpat-light.99531827.svg", "libs/lkpat-dark.77055983.svg", "libs/lkcall.d557f139.js"].map(p => new URL(p, SCOPE).href);

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(PRE.map(u => fetch(u, { cache: "reload" }).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {})).concat(PRE_LIB.map(u => fetch(u).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {})))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", e => {
  if (!e.data || e.data.t !== "lk-idle") return;
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(EXTRA.map(u => c.match(u).then(h => h || fetch(u, { priority: "low" }).then(r => { if (r.ok) return c.put(u, r); })).catch(() => {})))).catch(() => {}));
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
