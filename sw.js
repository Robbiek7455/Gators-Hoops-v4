self.addEventListener("install", (e)=>{ self.skipWaiting(); });
self.addEventListener("activate", (e)=>{ e.waitUntil(clients.claim()); });
self.addEventListener("fetch", (e)=>{
  // network-first, fallback to cache for static assets
  e.respondWith((async ()=>{
    try{ return await fetch(e.request); }
    catch{
      const cache = await caches.open("gators-cache-v1");
      const hit = await cache.match(e.request);
      if(hit) return hit;
      // cache basic shell
      const toCache = ["./","./index.html","./style.css","./app.js"];
      await cache.addAll(toCache.map(u=>u+"?offline=1"));
      return fetch(e.request);
    }
  })());
});
