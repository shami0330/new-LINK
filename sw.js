/* Link Messenger service worker.
   The page is served from the cache (instant start, works offline). The app compares it with the server
   when the user taps "Chats" and asks before updating, so this worker never refreshes the page by itself. */
const C="link-v4";
const key=u=>{const x=new URL(u);x.search="";x.hash="";if(x.pathname.slice(-1)==="/")x.pathname+="index.html";return x.href};
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{const q=e.request,u=new URL(q.url);
 if(q.method!=="GET"||u.origin!==location.origin)return;
 if(u.searchParams.has("_u")){e.respondWith(fetch(q.url,{cache:"no-store"}));return}
 const page=q.mode==="navigate"||u.pathname.endsWith(".html")||u.pathname.slice(-1)==="/";
 const k=page?key(q.url):q.url;
 e.respondWith((async()=>{const c=await caches.open(C),hit=await c.match(k);if(hit)return hit;
  const r=await fetch(q);if(r.ok)c.put(k,r.clone());return r})())});
