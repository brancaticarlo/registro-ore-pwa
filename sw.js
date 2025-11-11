const CACHE_NAME = 'registro-ore-cache-v5'; // Versione incrementata per forzare l'aggiornamento
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://aistudiocdn.com/recharts@^3.4.1',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://i.imgur.com/p1h4G3d.png',
  'https://i.imgur.com/22460i5.png',
  'https://i.imgur.com/3g0s5s7.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache. Caching all necessary assets for offline use.');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Strategia: Cache first, then network
  // Ideale per un'app che deve funzionare offline.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se trovo la risorsa in cache, la restituisco subito.
        if (response) {
          return response;
        }
        // Altrimenti, provo a prenderla dalla rete.
        return fetch(event.request).then(
          networkResponse => {
            // Se la richiesta va a buon fine, la clono e la salvo in cache per il futuro.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        );
      })
  );
});
