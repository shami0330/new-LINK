/* Link Messenger service worker: index.html is served from the cache (so the app opens instantly and works offline);
   the app itself compares it with GitHub when the user taps "Chats" and asks before updating. */
const C="link-v4",IDX=new URL("index.html",self.registration.scope).href;
self.addEventListener("install",e=>{self.skipWaiting();
 e.waitUntil((async()=>{try{const c=await caches.open(C);if(!(await c.match(IDX))){const r=await fetch(IDX,{cache:"reload"});if(r.ok)await c.put(IDX,r)}}catch(x){}})())});
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{const q=e.request,u=new URL(q.url);
 if(q.method!=="GET"||u.origin!==location.origin)return;
 if(u.searchParams.has("_u")){e.respondWith(fetch(q,{cache:"no-store"}));return}
 const idx=q.mode==="navigate"||u.pathname.endsWith("/index.html")||u.pathname.endsWith("/");
 e.respondWith((async()=>{const c=await caches.open(C),k=idx?IDX:q,hit=await c.match(k);if(hit)return hit;
  try{const r=await fetch(q);if(r.ok)c.put(k,r.clone());return r}catch(x){return Response.error()}})())});
