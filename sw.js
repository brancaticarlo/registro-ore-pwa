
const CACHE_NAME = 'registro-ore-cache-v3'; // Versione incrementata per forzare l'aggiornamento
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Forza l'attivazione del nuovo service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching base files');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Strategia: prima la rete, poi la cache
  // Utile per avere sempre i dati più aggiornati se c'è connessione
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Se la richiesta va a buon fine, la salvo in cache per usi futuri offline
        return caches.open(CACHE_NAME).then(cache => {
          if (event.request.method === 'GET' && event.request.url.startsWith('http')) {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Se la rete fallisce (siamo offline), cerco la risposta nella cache
        return caches.match(event.request);
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
    })
  );
});
