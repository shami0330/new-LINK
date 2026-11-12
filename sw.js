/* Link PWA service worker
   نسخه | VERSION: فقط وقتی فایل‌های کنار index.html (آیکن‌ها، مانیفست) عوض شدند این عدد را یکی زیاد کن؛
   برای عوض شدن خود index.html لازم نیست، چون همیشه اول از اینترنت گرفته می‌شود. */
const VERSION = 1;
const CACHE = "link-v" + VERSION;
const INDEX = new URL("index.html", self.registration.scope).href;
const CORE = [INDEX, "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png"].map(p => new URL(p, self.registration.scope).href);

/* نصب | Install: فایل‌های اصلی برای حالت آفلاین ذخیره می‌شوند و نسخه‌ی جدید بلافاصله آماده می‌شود */
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => {})))));
  self.skipWaiting();
});

/* فعال شدن | Activate: کش نسخه‌های قدیمی پاک می‌شود و نسخه‌ی جدید کنترل همه‌ی صفحه‌ها را می‌گیرد */
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("link-v") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

/* دریافت | Fetch: اول اینترنت (همیشه تازه، بدون کش مرورگر)، اگر نبود از کش؛ درخواست‌های سرور دیگر (Appwrite و ...) دست نمی‌خورند */
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.headers.has("range")) return;
  e.respondWith((async () => {
    const nav = r.mode === "navigate";
    const req = nav ? new Request(INDEX, { cache: "no-store" }) : new Request(r, { cache: "no-store" });
    try {
      const res = await fetch(req);
      if (res && res.status === 200) {
        const c = await caches.open(CACHE);
        c.put(nav ? INDEX : r.url, res.clone());
      }
      return res;
    } catch (err) {
      const hit = await caches.match(nav ? INDEX : r.url);
      if (hit) return hit;
      throw err;
    }
  })());
});
