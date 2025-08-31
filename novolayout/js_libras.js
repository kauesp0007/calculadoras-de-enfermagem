// Gerenciador do botão Libras
class LibrasManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupLibrasButton();
        this.loadVlibrasScript();
    }

    setupLibrasButton() {
        const librasBtn = document.getElementById('libras-btn');
        if (librasBtn) {
            librasBtn.addEventListener('click', () => {
                this.activateVlibras();
            });
        }
    }

    loadVlibrasScript() {
        // Carregar o script do VLibras apenas quando necessário
        if (!document.querySelector('script[src*="vlibras-plugin"]')) {
            const script = document.createElement('script');
            script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
            script.onload = () => {
                console.log('VLibras carregado com sucesso');
                this.initializeVlibras();
            };
            script.onerror = () => {
                console.error('Falha ao carregar VLibras');
            };
            document.body.appendChild(script);
        }
    }

    initializeVlibras() {
        if (typeof window.VLibras !== 'undefined') {
            new window.VLibras.Widget('https://vlibras.gov.br/app');
            console.log('VLibras inicializado');
        }
    }

    activateVlibras() {
        const vwWidget = document.querySelector('[vw-access-button]');
        if (vwWidget) {
            vwWidget.click();
        } else {
            console.warn('Widget VLibras não encontrado');
            // Tentar inicializar se não estiver pronto
            setTimeout(() => {
                this.initializeVlibras();
                const retryWidget = document.querySelector('[vw-access-button]');
                if (retryWidget) {
                    retryWidget.click();
                }
            }, 500);
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new LibrasManager();
});