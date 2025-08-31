// Gerenciador do botão "Voltar ao Topo"
class BackToTopManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupBackToTopButton();
    }

    setupBackToTopButton() {
        const backToTopBtn = document.getElementById('back-to-top-btn');
        if (backToTopBtn) {
            // Verificar posição inicial
            this.toggleButtonVisibility(backToTopBtn);
            
            // Adicionar listener para o scroll
            window.addEventListener('scroll', () => {
                this.toggleButtonVisibility(backToTopBtn);
            });
            
            // Adicionar listener para o clique
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    toggleButtonVisibility(button) {
        if (window.scrollY > 300) {
            button.classList.remove('is-hidden');
        } else {
            button.classList.add('is-hidden');
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new BackToTopManager();
});