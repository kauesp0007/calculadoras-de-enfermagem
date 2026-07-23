const CACHE_VERSION = "20260722-221023";
const CACHE_NAME = `calculadoras-enfermagem-cache-${CACHE_VERSION}`;

// O SCRIPT DE BUILD VAI INJETAR A LISTA DE ARQUIVOS AQUI
const urlsToCache = [
  '.vscode/extensions.json',
  '.vscode/settings.json',
  '.vscode/tasks.json',
  '/index.html',
  '/offline.html',
  'adicionar-provas.js',
  'analytics-data.json',
  'atualizar-scripts.js',
  'automacoes/banco_nanda_2024_extracted.json',
  'automacoes/banco_nanda_2024_merged_suggestion.json',
  'automacoes/banco_nanda_2024_new_only.json',
  'automacoes/banco_nanda_2024_new_only_clean.json',
  'automacoes/banco_nanda_2024_new_only_clean_updated.json',
  'automacoes/svg_cache.json',
  'automation-guard.js',
  'automatizador-em-massa.js',
  'baixar-pdf-provas.js',
  'banco_nanda.json',
  'banco_nanda.json.bak-20260704T061029.json',
  'banco_nanda_en.json',
  'banco_nanda_es.json',
  'banco_nic_completo.json',
  'banco_nic_en.json',
  'biblioteca-automation.js',
  'biblioteca-provas.json',
  'biblioteca.json',
  'build-biblioteca.js',
  'build-downloads.js',
  'build-pdf.js',
  'build.js',
  'ce-calculadora-padrao.js',
  'convert-webp.js',
  'css-duplicates-report.json',
  'de/favicon.ico',
  'en/favicon.ico',
  'es/favicon.ico',
  'favicon.ico',
  'fetch-analytics.js',
  'fonts/arabic/arabic-700.woff2',
  'fonts/arabic/arabic-regular.woff2',
  'fonts/chinese/chinese-700.woff2',
  'fonts/chinese/chinese-regular.woff2',
  'fonts/devanagari/devanagari-700.woff2',
  'fonts/devanagari/devanagari-regular.woff2',
  'fonts/inter/inter-600.woff2',
  'fonts/inter/inter-700.woff2',
  'fonts/inter/inter-900.woff2',
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
  'ga-credentials.json',
  'generate-sitemap.js',
  'gerarCapasPDF.js',
  'gerarCapasVideo.js',
  'global-scripts.js',
  'global-styles.css',
  'glossary-search.js',
  'hi/favicon.ico',
  'id/favicon.ico',
  'img/education-svgrepo-com.svg',
  'it/favicon.ico',
  'ja/favicon.ico',
  'js/accessibility.js',
  'js/backToTop.js',
  'js/cookies.js',
  'js/main.js',
  'js/menu.js',
  'js/web-vitals-reporter.js',
  'ko/favicon.ico',
  'lang-selector.js',
  'lighthouserc.js',
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
  'otimizador-imagens.js',
  'otimizar-imagens.js',
  'pl/favicon.ico',
  'public/output.css',
  'relatorio_auditoria_seo.json',
  'relatorio_hreflang.json',
  'ru/favicon.ico',
  'scaffold-lang.js',
  'scan-biblioteca.js',
  'scanner-biblioteca.js',
  'scanner-footer-chain.js',
  'scripts/build-blog.js',
  'scripts/extract-docx.js',
  'scripts/find-css-duplicates.js',
  'scripts/parse-dictionary.js',
  'scripts/parse-glossario.js',
  'scripts/remove-static-glossary.js',
  'simpleRename.js',
  'src/input.css',
  'sv/favicon.ico',
  'terminologias.json',
  'termos_medicos_parsed.json',
  'tr/favicon.ico',
  'uk/favicon.ico',
  'vi/favicon.ico',
  'watch-images.js',
  'zh/favicon.ico'
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
        return new Response(null, { status: 204 });
      }),
    );
    return;
  }

  // ESTRATÉGIA 1: PÁGINAS HTML (Network First -> Cache Fallback -> Offline Fallback)
  if (
    req.mode === "navigate" ||
    req.headers.get("accept").includes("text/html")
  ) {
    // 1. Cria uma URL temporária com o Cache Buster para forçar a rede a entregar o arquivo fresco
    const bypassUrl = new URL(req.url);
    bypassUrl.searchParams.set("v", CACHE_VERSION);

    event.respondWith(
      fetch(bypassUrl)
        .then((networkResponse) => {
          // 2. Salva dinamicamente a página HTML usando a requisição ORIGINAL 'req' como chave
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