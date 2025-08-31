// service-worker.js

const CACHE_NAME = 'enfermagem-calculators-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/global-header.html',
    '/global-footer.html',
    '/global-styles.css',
    '/global-scripts.js',
    '/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Nunito+Sans:wght@700;800;900&display=swap',
    'https://www.calculadorasdeenfermagem.com.br/icontopbar1.webp',
    'https://www.calculadorasdeenfermagem.com.br/iconrodape1.webp',
    'https://www.calculadorasdeenfermagem.com.br/iconpages.webp',
    'https://www.calculadorasdeenfermagem.com.br/seloacessibilidade.webp',
    'https://www.calculadorasdeenfermagem.com.br/selosustentabilidade.webp',
    'https://www.calculadorasdeenfermagem.com.br/selolgpd.webp',
    'https://www.calculadorasdeenfermagem.com.br/bandeira-brasil.webp',
    'https://www.calculadorasdeenfermagem.com.br/bandeira-eua.webp',
    'https://www.calculadorasdeenfermagem.com.br/bandeira-espanha.webp',
    'https://www.calculadorasdeenfermagem.com.br/bandeira-alemanha.webp',
    'https://www.calculadorasdeenfermagem.com.br/bandeira-italia.webp',
    'https://vlibras.gov.br/app/vlibras-plugin.js',
    '/assets/icon-192x192.png',
    '/assets/icon-512x512.png'
];

// Instalação do Service Worker e cache dos arquivos estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberta com sucesso!');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Falha ao adicionar URLs ao cache:', err);
            })
    );
});

// Intercepta as requisições e serve do cache, se disponível
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retorna a resposta do cache se encontrada
                if (response) {
                    return response;
                }
                
                // Se a requisição não estiver no cache, faz a requisição de rede e adiciona ao cache
                const fetchRequest = event.request.clone();
                return fetch(fetchRequest)
                    .then((response) => {
                        // Verifica se a resposta é válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clona a resposta para que possa ser usada pelo cache e pelo navegador
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    });
            })
            .catch(error => {
                console.error('Falha na requisição de fetch:', error);
            })
    );
});

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
