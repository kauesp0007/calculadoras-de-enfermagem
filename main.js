// main.js

// Garante que o script só execute após o carregamento completo do DOM.
document.addEventListener('DOMContentLoaded', () => {

    // --- Lógica do Botão "Voltar ao Topo" ---
    // Seleciona o botão de voltar ao topo pelo seu ID.
    const backToTopBtn = document.getElementById('back-to-top-btn');

    // Verifica se o botão existe antes de adicionar os listeners.
    if (backToTopBtn) {
        
        /**
         * Alterna a visibilidade do botão de voltar ao topo com base na posição do scroll.
         * O botão fica visível quando o usuário rola mais de 300 pixels para baixo.
         */
        const toggleBackToTopButton = () => {
            if (window.scrollY > 300) {
                // Remove a classe 'is-hidden' para exibir o botão.
                backToTopBtn.classList.remove('is-hidden');
            } else {
                // Adiciona a classe 'is-hidden' para ocultar o botão.
                backToTopBtn.classList.add('is-hidden');
            }
        };
        
        // Verifica o estado inicial do botão ao carregar a página.
        toggleBackToTopButton();

        // Adiciona um listener para o evento de scroll da janela para chamar a função de alternância.
        window.addEventListener('scroll', toggleBackToTopButton);

        // Adiciona um listener para o evento de clique no botão.
        backToTopBtn.addEventListener('click', () => {
            // Rola a página suavemente para o topo.
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- REGISTRO DO SERVICE WORKER PARA PWA ---
    // Verifica se o navegador suporta a API de Service Worker.
    if ('serviceWorker' in navigator) {
        // Adiciona um listener para o evento 'load' da janela.
        window.addEventListener('load', () => {
            // Tenta registrar o service worker localizado em '/service-worker.js'.
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    // Log de sucesso do registro.
                    console.log('Service Worker registrado com sucesso: ', registration.scope);
                })
                .catch(err => {
                    // Log de erro em caso de falha no registro.
                    console.error('Falha ao registrar Service Worker:', err);
                });
        });
    }

}); // Fim do DOMContentLoaded
