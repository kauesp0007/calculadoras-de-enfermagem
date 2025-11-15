// Define o nome e a versão do cache.
// Mude 'v1' para 'v2' quando quiser forçar a atualização de todos os arquivos.
const CACHE_NAME = 'calculadoras-enfermagem-cache-v1';

// O SCRIPT DE BUILD VAI INJETAR A LISTA DE ARQUIVOS AQUI
const urlsToCache = [
  //INJETAR_ARQUIVOS_AQUI
];

// 1. EVENTO DE INSTALAÇÃO (INSTALL)
// Ocorre quando o Service Worker é registrado pela primeira vez.
// Ele baixa e salva todos os arquivos da lista 'urlsToCache'.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abrindo o cache e salvando os arquivos.');
        // O script de build vai substituir o marcador por uma lista de caminhos
        // Se a lista for muito grande, o addAll() pode falhar se UM arquivo falhar.
        // O nosso script de build (Passo 2) vai gerar a lista correta.
        return cache.addAll(urlsToCache.filter(url => !url.startsWith('/*')));
      })
      .then(() => self.skipWaiting()) // Força o SW a ativar imediatamente
      .catch(err => {
        console.error('Service Worker: Falha ao salvar arquivos no cache', err);
      })
  );
});

// 2. EVENTO DE ATIVAÇÃO (ACTIVATE)
// Ocorre depois da instalação. É usado para limpar caches antigos.
// Se você mudar o CACHE_NAME para 'v2', este script deletará o 'v1'.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; // O único cache que queremos manter

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o cacheName NÃO ESTÁ na nossa lista de permissão, delete-o.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Torna-se o controlador da página imediatamente
  );
});

// 3. EVENTO DE BUSCA (FETCH)
// Ocorre toda vez que o navegador tenta buscar um arquivo (ex: uma imagem, script, ou página).
// Isso é o que faz o site funcionar offline.
self.addEventListener('fetch', event => {
  // Ignora requisições que não são 'GET' (ex: POST)
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request) // 1. Tenta encontrar o arquivo no CACHE
      .then(response => {
        // Se o arquivo FOI encontrado no cache...
        if (response) {
          // console.log('Service Worker: Servindo do cache:', event.request.url);
          return response; // Retorna o arquivo do cache
        }
        
        // Se o arquivo NÃO FOI encontrado no cache...
        // console.log('Service Worker: Buscando na rede:', event.request.url);
        return fetch(event.request); // Tenta buscá-lo na INTERNET
      })
      .catch(err => {
        // Erro (provavelmente offline e o arquivo não está no cache)
        console.error('Service Worker: Erro ao buscar:', err);
        // Você pode retornar uma página de "fallback" aqui se quiser
        // return caches.match('/offline.html');
      })
  );
});