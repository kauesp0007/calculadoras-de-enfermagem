// Define o nome e a versão do cache (AUTOMÁTICO via gerar-sw.js)
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
      .then(() => self.skipWaiting())
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
              console.log("Service Worker: Deletando cache antigo:", cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          }),
        );

        // Passa a controlar as páginas imediatamente
        await self.clients.claim();

        // Notifica todas as janelas controladas que o SW foi atualizado
        const clientList = await self.clients.matchAll({ type: "window" });
        for (const client of clientList) {
          try {
            client.postMessage({ type: "SW_UPDATED" });
          } catch (e) {
            /* ignore */
          }
        }
      } catch (err) {
        console.error("Erro durante activate do Service Worker:", err);
      }
    })(),
  );
});

// 3. EVENTO DE BUSCA (FETCH)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Somente GETs
  if (req.method !== "GET") return;

  const reqUrl = new URL(req.url);

  // Ignorar requisições cross-origin (Google, Analytics, Ads)
  if (reqUrl.origin !== self.location.origin) return;

  // 1) Network-first para requisições de navegação / HTML
  const acceptsHtml =
    req.headers.get("accept") &&
    req.headers.get("accept").includes("text/html");
  if (req.mode === "navigate" || acceptsHtml) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(req);
          // Atualiza o cache com a versão mais recente do HTML
          try {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, networkResponse.clone());
          } catch (e) {
            console.warn("Falha ao atualizar cache com a resposta de rede:", e);
          }
          return networkResponse;
        } catch (err) {
          console.warn(
            "Network falhou para request de navegação, tentando cache",
            err,
          );
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

  // 2) Cache-first para outros recursos (CSS/JS/images)
  event.respondWith(
    (async () => {
      try {
        const cached = await caches.match(req);
        if (cached) return cached;

        const networkResponse = await fetch(req);
        // Salva no cache para uso offline futuro
        try {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, networkResponse.clone());
        } catch (e) {
          /* ignore cache put errors */
        }
        return networkResponse;
      } catch (err) {
        console.error("Service Worker fetch error for", req.url, err);
        const fallback = await caches.match("/offline.html");
        if (fallback) return fallback;
        return new Response("Offline", {
          status: 504,
          statusText: "Gateway Timeout",
        });
      }
    })(),
  );
});
