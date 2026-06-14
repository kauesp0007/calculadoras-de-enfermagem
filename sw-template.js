const CACHE_NAME = "calculadoras-enfermagem-cache-__CACHE_VERSION__";

// O SCRIPT DE BUILD VAI INJETAR A LISTA DE ARQUIVOS AQUI
const urlsToCache = [
  //INJETAR_ARQUIVOS_AQUI
];

// 1. EVENTO DE INSTALAÇÃO (INSTALL)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log(
          "Service Worker: Abrindo o cache e salvando os arquivos.",
          CACHE_NAME,
        );
        return cache.addAll(urlsToCache.filter((url) => !url.startsWith("/*")));
      })
      .then(() => self.skipWaiting()) // Força o SW a instalar imediatamente
      .catch((err) => {
        console.error("Service Worker: Falha ao salvar arquivos no cache", err);
      }),
  );
});

// 2. EVENTO DE ATIVAÇÃO (ACTIVATE)
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("Service Worker: Deletando cache antigo", cacheName);
              return caches.delete(cacheName); // Exclui antigos
            }
          }),
        );
      } catch (err) {
        console.error("Erro ao deletar caches antigos", err);
      }

      // Essencial: Força o novo Service Worker a assumir o controle da página imediatamente
      return self.clients.claim();
    })(),
  );
});

// 3. EVENTO DE FETCH (INTERCEPTA REQUISIÇÕES)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (!req.url.startsWith("http")) return;

  // 1) Network-first para navegação de páginas (HTML)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(req);
          try {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, networkResponse.clone());
          } catch (e) {}
          return networkResponse;
        } catch (err) {
          console.warn("Network falhou para HTML, tentando cache", err);
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match("/offline.html");
          if (fallback) return fallback;
          return new Response("Offline", {
            status: 504,
            statusText: "Gateway Timeout",
          });
        }
      })(),
    );
    return;
  }

  // 2) Stale-While-Revalidate para outros recursos (CSS/JS/images)
  // Retorna o cache na mesma hora, mas atualiza ele no fundo chamando a rede
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(req);

      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch((err) => {
          console.error("Erro no Service Worker em background:", req.url, err);
        });

      return cachedResponse || fetchPromise;
    })(),
  );
});
