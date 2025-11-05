const CACHE = "gator-hoops-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=8",
  "./app.js?v=8",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener("activate", (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener("fetch", (e)=>{
  const {request} = e;
  if(request.method!=="GET") return;
  e.respondWith(
    caches.match(request).then(cached=> cached || fetch(request).then(resp=>{
      try{
        const url = new URL(request.url);
        if(url.origin===location.origin){
          const copy = resp.clone();
          caches.open(CACHE).then(c=> c.put(request, copy));
        }
      }catch{}
      return resp;
    }).catch(()=> cached))
  );
});
