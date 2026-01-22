// Define o nome e a versão do cache (AUTOMÁTICO via gerar-sw.js)
const CACHE_NAME = 'calculadoras-enfermagem-cache-__CACHE_VERSION__';

// O SCRIPT DE BUILD VAI INJETAR A LISTA DE ARQUIVOS AQUI
const urlsToCache = [
  //INJETAR_ARQUIVOS_AQUI
];

// 1. EVENTO DE INSTALAÇÃO (INSTALL)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abrindo o cache e salvando os arquivos.', CACHE_NAME);
        return cache.addAll(urlsToCache.filter(url => !url.startsWith('/*')));
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('Service Worker: Falha ao salvar arquivos no cache', err);
      })
  );
});

// 2. EVENTO DE ATIVAÇÃO (ACTIVATE)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      ))
      .then(() => self.clients.claim())
  );
});

// 3. EVENTO DE BUSCA (FETCH)
self.addEventListener('fetch', event => {
  const req = event.request;

  // Somente GETs
  if (req.method !== 'GET') return;

  const reqUrl = new URL(req.url);

  // CORREÇÃO: Ignorar requisições cross-origin (Google, Analytics, Ads)
  // Retornar cedo permite que o navegador lide com elas nativamente, evitando erros CORS/404.
  if (reqUrl.origin !== self.location.origin) {
    return;
  }

  // Cache-first (apenas para arquivos do próprio site)
  event.respondWith((async () => {
    try {
      const cached = await caches.match(req);
      if (cached) return cached;

      const networkResponse = await fetch(req);
      return networkResponse;
    } catch (err) {
      console.error('Service Worker fetch error for', req.url, err);
      const fallback = await caches.match('/offline.html');
      if (fallback) return fallback;
      return new Response('Offline', { status: 504, statusText: 'Gateway Timeout' });
    }
  })());
});