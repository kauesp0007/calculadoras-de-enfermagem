// sw.js - Service Worker

// Define o nome e a versão do cache. Mude a versão (ex: v2, v3) quando atualizar os ficheiros.
const CACHE_NAME = 'calculadoras-enfermagem-cache-v1';

// Lista de ficheiros essenciais para o funcionamento do site (o "App Shell").
const urlsToCache = [
  '/',
  '/index.html',
  '/global-styles.css',
  '/global-scripts.js',
  '/menu-global.html',
  '/global-body-elements.html',
  // Páginas adicionadas para cache
  '/gotejamento.html',
  '/insulina.html',
  '/dimensionamento.html',
  '/medicamentos.html',
  '/braden.html',
  '/glasgow.html',
  '/cincinnati.html',
  '/news.html',
  '/richmond.html',
  '/morse.html',
  '/fugulin.html',
  '/nihss.html',
  '/gestacional.html',
  '/asa.html',
  '/apgar.html',
  '/aldrete.html',
  '/elpo.html',
  '/johns.html',
  '/manchester.html',
  '/flacc.html',
  '/meows.html',
  '/balancohidrico.html',
  '/imc.html',
  '/waterlow.html',
  '/gosnell.html',
  '/norton.html',
  '/four.html',
  '/ramsay.html',
  '/jouvet.html',
  '/silverman.html',
  '/downes.html',
  '/barthel.html',
  '/katz.html',
  '/meem.html',
  '/pews.html',
  '/cornell.html',
  '/hamilton.html',
  '/lanss.html',
  '/mapa-do-site.html',
  '/forum.html',
  '/vigilancia.html',
  '/regrasmedicacoes.html',
  '/objetivo.html',
  '/legislacoes.html',
  '/fale.html',
  '/doacoes.html',
  '/checagem.html',
  '/termos.html',
  '/politica.html',
  '/missao.html',
  '/gds.html',
  '/nanda.html',
  '/concursos.html',
  '/saps.html',
  '/apache.html',
  '/qsofa.html',
  '/sofa.html',
  '/cam.html',
  '/cries.html',
  '/prism.html',
  '/pelod.html',
  '/escalanumerica.html',
  '/tecnologiaverde.html',
  '/politicadeacessibilidade.html',
  '/impactodigital.html',
  '/nossocompromisso.html',
  '/metasinternacionais.html',
  '/fast.html',
  '/heparina.html',
  '/vacinas_improved.html',
  '/tabelas-vacinas-crianca.html',
  // Adicione imagens e ícones importantes
  '/favicon.ico',
  '/iconpages.webp',
  '/icontopbar1.webp',
  // Recursos externos também podem ser cacheados
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@700;900&family=Inter:wght@400;600;700&display=swap'
];

// Evento 'install': é acionado quando o service worker é instalado.
self.addEventListener('install', event => {
  // Pede ao navegador para esperar até que o cache seja aberto e todos os ficheiros sejam guardados.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto com sucesso');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': é acionado sempre que a página tenta obter um recurso (ex: um CSS, uma imagem).
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o recurso for encontrado no cache, retorna-o diretamente.
        if (response) {
          return response;
        }
        // Se não for encontrado, busca na rede.
        return fetch(event.request);
      }
    )
  );
});

// Evento 'activate': é acionado quando um novo service worker é ativado.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        // Apaga caches antigos que não estão na lista de permissões.
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
