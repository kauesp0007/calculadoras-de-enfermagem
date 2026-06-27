const CACHE_VERSION = "20260627-203115";
const CACHE_NAME = `calculadoras-enfermagem-cache-${CACHE_VERSION}`;

// O SCRIPT DE BUILD VAI INJETAR A LISTA DE ARQUIVOS AQUI
const urlsToCache = [
  '.vscode/extensions.json',
  '.vscode/settings.json',
  '.vscode/tasks.json',
  '/index.html',
  '/offline.html',
  'adicionar-provas.js',
  'ar/global-scripts.js',
  'ar/global-styles.css',
  'ar/lang-selector.js',
  'atualizar-scripts.js',
  'automation-guard.js',
  'automatizador-em-massa.js',
  'baixar-pdf-provas.js',
  'biblioteca-automation.js',
  'biblioteca-provas.json',
  'biblioteca.json',
  'build-biblioteca.js',
  'build-pdf.js',
  'build.js',
  'ce-calculadora-padrao.js',
  'convert-webp.js',
  'css-duplicates-report.json',
  'css/fontawesome.min.css',
  'de/favicon.ico',
  'de/global-scripts.js',
  'de/global-styles.css',
  'de/lang-selector.js',
  'en/favicon.ico',
  'en/global-scripts.js',
  'en/global-styles.css',
  'es/favicon.ico',
  'es/global-scripts.js',
  'es/global-styles.css',
  'es/lang-selector.js',
  'favicon.ico',
  'fonts/arabic/arabic-700.woff2',
  'fonts/arabic/arabic-regular.woff2',
  'fonts/chinese/chinese-700.woff2',
  'fonts/chinese/chinese-regular.woff2',
  'fonts/devanagari/devanagari-700.woff2',
  'fonts/devanagari/devanagari-regular.woff2',
  'fonts/fa-brands/fa-brands-400.woff2',
  'fonts/fa-solid/fa-solid-900.woff2',
  'fonts/inter/inter-600.woff2',
  'fonts/inter/inter-700.woff2',
  'fonts/inter/inter-regular.woff2',
  'fonts/japanese/japanese-700.woff2',
  'fonts/japanese/japanese-regular.woff2',
  'fonts/korean/korean-700.woff2',
  'fonts/korean/korean-regular.woff2',
  'fonts/nunito/nunito-700.woff2',
  'fonts/nunito/nunito-900.woff2',
  'fonts/nunito/nunito-regular.woff2',
  'force-clear-capas.js',
  'force-fix-lang-bar.js',
  'fr/favicon.ico',
  'fr/global-scripts.js',
  'fr/global-styles.css',
  'generate-sitemap.js',
  'gerarCapasPDF.js',
  'gerarCapasVideo.js',
  'global-scripts.js',
  'global-styles.css',
  'glossary-search.js',
  'hi/favicon.ico',
  'hi/global-scripts.js',
  'hi/global-styles.css',
  'hi/lang-selector.js',
  'id/favicon.ico',
  'id/global-scripts.js',
  'id/global-styles.css',
  'id/lang-selector.js',
  'it/favicon.ico',
  'it/global-scripts.js',
  'it/global-styles.css',
  'ja/favicon.ico',
  'ja/global-scripts.js',
  'ja/global-styles.css',
  'ja/lang-selector.js',
  'js/accessibility.js',
  'js/backToTop.js',
  'js/cookies.js',
  'js/main.js',
  'js/menu.js',
  'ko/favicon.ico',
  'ko/global-scripts.js',
  'ko/global-styles.css',
  'ko/lang-selector.js',
  'lang-selector.js',
  'locales/ar/cookies.json',
  'locales/ar/footer.json',
  'locales/bn/cookies.json',
  'locales/bn/footer.json',
  'locales/cs/cookies.json',
  'locales/cs/footer.json',
  'locales/da/cookies.json',
  'locales/da/footer.json',
  'locales/de/cookies.json',
  'locales/de/footer.json',
  'locales/el/cookies.json',
  'locales/el/footer.json',
  'locales/en/cookies.json',
  'locales/en/footer.json',
  'locales/es/cookies.json',
  'locales/es/footer.json',
  'locales/fi/cookies.json',
  'locales/fi/footer.json',
  'locales/fr/cookies.json',
  'locales/fr/footer.json',
  'locales/he/cookies.json',
  'locales/he/footer.json',
  'locales/hi/cookies.json',
  'locales/hi/footer.json',
  'locales/id/cookies.json',
  'locales/id/footer.json',
  'locales/it/cookies.json',
  'locales/it/footer.json',
  'locales/ja/cookies.json',
  'locales/ja/footer.json',
  'locales/ko/cookies.json',
  'locales/ko/footer.json',
  'locales/ms/cookies.json',
  'locales/ms/footer.json',
  'locales/nb/cookies.json',
  'locales/nb/footer.json',
  'locales/nl/cookies.json',
  'locales/nl/footer.json',
  'locales/pl/cookies.json',
  'locales/pl/footer.json',
  'locales/pt/cookies.json',
  'locales/pt/footer.json',
  'locales/ro/cookies.json',
  'locales/ro/footer.json',
  'locales/ru/cookies.json',
  'locales/ru/footer.json',
  'locales/sv/cookies.json',
  'locales/sv/footer.json',
  'locales/th/cookies.json',
  'locales/th/footer.json',
  'locales/tr/cookies.json',
  'locales/tr/footer.json',
  'locales/uk/cookies.json',
  'locales/uk/footer.json',
  'locales/ur/cookies.json',
  'locales/ur/footer.json',
  'locales/vi/cookies.json',
  'locales/vi/footer.json',
  'locales/zh/cookies.json',
  'locales/zh/footer.json',
  'log-imagens.js',
  'main.js',
  'manifest.json',
  'nl/favicon.ico',
  'nl/global-scripts.js',
  'nl/global-styles.css',
  'nl/lang-selector.js',
  'otimizador-imagens.js',
  'otimizar-imagens.js',
  'pl/favicon.ico',
  'pl/global-scripts.js',
  'pl/global-styles.css',
  'pl/lang-selector.js',
  'public/output.css',
  'ru/favicon.ico',
  'ru/global-scripts.js',
  'ru/global-styles.css',
  'ru/lang-selector.js',
  'scaffold-lang.js',
  'scan-biblioteca.js',
  'scanner-biblioteca.js',
  'scanner-footer-chain.js',
  'scripts/build-blog.js',
  'scripts/find-css-duplicates.js',
  'simpleRename.js',
  'src/input.css',
  'sv/favicon.ico',
  'sv/global-scripts.js',
  'sv/global-styles.css',
  'sv/lang-selector.js',
  'tr/favicon.ico',
  'tr/global-scripts.js',
  'tr/global-styles.css',
  'tr/lang-selector.js',
  'uk/favicon.ico',
  'uk/global-scripts.js',
  'uk/global-styles.css',
  'uk/lang-selector.js',
  'vi/favicon.ico',
  'vi/global-scripts.js',
  'vi/global-styles.css',
  'vi/lang-selector.js',
  'watch-images.js',
  'zh/favicon.ico',
  'zh/global-scripts.js',
  'zh/global-styles.css',
  'zh/lang-selector.js'
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

  // ESTRATÉGIA EXCEÇÃO: Bloqueadores de Anúncios (Ad Blockers)
  // Evita o erro "Failed to convert value to 'Response'" interceptando as falhas do AdSense
  if (req.url.includes("googlesyndication.com")) {
    event.respondWith(
      fetch(req).catch((error) => {
        // Se a requisição falhar (ex: bloqueada pelo navegador), retorna uma resposta vazia inofensiva
        return new Response("Ad blocked", { status: 204 });
      }),
    );
    return;
  }

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

          // Se não tiver no cache, tenta entregar a página offline padrão
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) return offlinePage;

          // Se até o offline.html falhar (Fallback absoluto para evitar TypeError)
          return new Response(
            "<h1>Sem conexão</h1><p>Você está offline e esta página não foi salva no cache.</p>",
            {
              status: 503,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            },
          );
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

        // Se NÃO estiver no cache, vai buscar à rede e INJETA O CACHE BUSTER
        const fetchUrl = new URL(req.url);
        fetchUrl.searchParams.set("v", CACHE_VERSION);

        return fetch(fetchUrl)
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
            // Em caso de falha de rede e não ter cache (Fallback absoluto)
            return caches
              .match(req)
              .then(
                (res) =>
                  res ||
                  new Response("", { status: 404, statusText: "Not Found" }),
              );
          });
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
          // Falha de rede pura (ex: bloqueio de AdBlock ou offline sem cache)
          // Precisamos retornar uma resposta válida vazia para evitar "Failed to convert value to Response"
          return new Response("", {
            status: 408,
            statusText: "Request Timeout",
          });
        });

      return cachedResponse || fetchPromise;
    }),
  );
});
