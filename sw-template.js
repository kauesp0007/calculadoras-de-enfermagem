const CACHE_VERSION = "__CACHE_VERSION__";
const CACHE_NAME = `calculadoras-enfermagem-cache-${CACHE_VERSION}`;

// O SCRIPT DE BUILD VAI INJETAR A LISTA DE ARQUIVOS AQUI
const urlsToCache = [
  //INJETAR_ARQUIVOS_AQUI
];

// 1. EVENTO DE INSTALAÇÃO (Precaching tolerante a falhas)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        console.log(
          `[Service Worker] Instalando nova versão: ${CACHE_VERSION}`,
        );

        // Adiciona os ficheiros ao cache 1 a 1.
        // Se um ficheiro faltar, não impede a instalação do resto (fundamental para grandes repositórios)
        await Promise.all(
          urlsToCache
            .filter((url) => !url.startsWith("/*"))
            .map((url) => {
              return cache
                .add(new Request(url, { cache: "reload" }))
                .catch((err) => {
                  console.warn(
                    `[Service Worker] Ficheiro não encontrado para cache: ${url}`,
                  );
                });
            }),
        );
      })
      .then(() => self.skipWaiting()), // Força o SW a assumir o controlo
  );
});

// 2. EVENTO DE ATIVAÇÃO (Limpeza de caches antigos)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(
                `[Service Worker] Apagando cache antigo: ${cacheName}`,
              );
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// 3. EVENTO DE FETCH (A Mágica da Interceção)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Intercepta apenas requisições HTTP/HTTPS normais de GET
  if (!url.protocol.startsWith("http") || req.method !== "GET") return;

  // ESTRATÉGIA 1: PÁGINAS HTML (Network First -> Cache Fallback -> Offline Fallback)
  if (
    req.mode === "navigate" ||
    req.headers.get("accept").includes("text/html")
  ) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          // Salva dinamicamente as páginas HTML que o utilizador visita (Runtime Cache)
          const responseToCache = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(req, responseToCache));
          return networkResponse;
        })
        .catch(async () => {
          // Se estiver offline, tenta carregar o HTML da versão em cache
          const cachedResponse = await caches.match(req);
          if (cachedResponse) return cachedResponse;

          // Se não tiver no cache, entrega a página offline padrão (certifique-se de que offline.html existe)
          return caches.match("/offline.html");
        }),
    );
    return;
  }

  // ESTRATÉGIA 2: CSS e JS (O "Cache Buster Invisível")
  if (url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        // Se estiver no cache ATUAL, entrega imediatamente!
        if (cachedResponse) return cachedResponse;

        // Se NÃO estiver no cache (porque é uma versão nova e o cache foi limpo),
        // vai buscar à rede e INJETA O CACHE BUSTER sob a forma de query string ?v=...
        const fetchUrl = new URL(req.url);
        fetchUrl.searchParams.set("v", CACHE_VERSION);

        return fetch(fetchUrl)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              // Guarda no cache utilizando o Request ORIGINAL (sem o ?v)
              // para que da próxima vez o caches.match(req) encontre o ficheiro.
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(req, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => caches.match(req)); // Proteção extra contra falhas de rede
      }),
    );
    return;
  }

  // ESTRATÉGIA 3: IMAGENS E RESTANTES RECURSOS (Stale-While-Revalidate)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(req, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          /* Ignora erros em imagens de background se falhar */
        });

      // Retorna o cache imediatamente (Stale), mas atualiza em pano de fundo (Revalidate)
      return cachedResponse || fetchPromise;
    }),
  );
});
