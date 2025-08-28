// service-worker.js
const CACHE_NAME = 'calculadoras-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/global-styles.css',
  '/global-scripts.js',
  // Adicione outros URLs de recursos estáticos que você deseja armazenar em cache
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});