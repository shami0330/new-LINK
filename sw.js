/* Link PWA service worker
   روش کار: اول همه‌چیز از کش مرورگر باز می‌شود (سریع و آفلاین)؛ بررسی آپدیت در پس‌زمینه توسط صفحه انجام می‌شود.
   VERSION: فقط وقتی خود sw.js یا فایل‌های کنار index.html (آیکن‌ها، مانیفست) عوض شدند یکی زیاد کن.
   برای عوض شدن index.html لازم نیست؛ صفحه خودش آپدیت را پیدا می‌کند. */
const VERSION = 3;
const CACHE = "link-v" + VERSION;
const SCOPE = self.registration.scope;
const INDEX = new URL("index.html", SCOPE).href;
const CORE = [INDEX, "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png"].map(p => new URL(p, SCOPE).href);

/* نصب | Install: فایل‌های اصلی ذخیره می‌شوند */
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => {})))));
  self.skipWaiting();
});

/* فعال شدن | Activate: کش قدیمی پاک می‌شود */
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("link-v") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

/* دریافت | Fetch: اول کش؛ اگر نبود از اینترنت (و ذخیره). درخواست‌های بررسی آپدیت (پارامتر _u) مستقیم به اینترنت می‌روند */
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.headers.has("range")) return;
  if (u.searchParams.has("_u")) return;
  e.respondWith((async () => {
    const key = r.mode === "navigate" ? INDEX : r.url;
    const hit = await caches.match(key);
    if (hit) return hit;
    const res = await fetch(r);
    if (res && res.status === 200) (await caches.open(CACHE)).put(key, res.clone());
    return res;
  })());
});
