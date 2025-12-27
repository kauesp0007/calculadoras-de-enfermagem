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

        // Se a lista for muito grande, o addAll() pode falhar se UM arquivo falhar.
        return cache.addAll(urlsToCache.filter(url => !url.startsWith('/*')));
      })
      .then(() => self.skipWaiting()) // Força o SW a ativar imediatamente
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

  // NÃO interceptar recursos cross-origin (ads, analytics, CDN). Deixa a rede tratar.
  if (reqUrl.origin !== self.location.origin) {
    event.respondWith(
      fetch(req).catch(err => {
        console.warn('Service Worker: cross-origin fetch falhou:', req.url, err);
        return new Response('', { status: 504, statusText: 'Gateway Timeout' });
      })
    );
    return;
  }

  // Cache-first (igual ao seu padrão)
  event.respondWith((async () => {
    try {
      const cached = await caches.match(req);
      if (cached) return cached;

      const networkResponse = await fetch(req);

      // (Opcional) Se quiser cachear novos arquivos visitados:
      // const cache = await caches.open(CACHE_NAME);
      // cache.put(req, networkResponse.clone());

      return networkResponse;
    } catch (err) {
      console.error('Service Worker fetch error for', req.url, err);
      const fallback = await caches.match('/offline.html');
      if (fallback) return fallback;
      return new Response('', { status: 504, statusText: 'Gateway Timeout' });
    }
  })());
});
