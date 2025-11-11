const CACHE_NAME = 'registro-ore-cache-v6';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache. Caching static assets.');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Ignora le richieste non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategia: Network falling back to cache
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Se la richiesta alla rete ha successo, la salvo in cache per usi futuri
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => {
        // Se la rete fallisce, cerco la risorsa nella cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se non è neanche in cache, l'operazione fallisce (solo se assolutamente necessario)
          console.error('Fetch failed; returning offline page instead.', event.request.url);
          return new Response('Contenuto non disponibile offline.', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
