/* Unregister any old service worker and reload clients once */
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      try {
        await self.registration.unregister();
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const c of clientsList) c.navigate(c.url);
      } catch (err) {}
    })()
  );
});
self.addEventListener('fetch', () => {}); // no caching
