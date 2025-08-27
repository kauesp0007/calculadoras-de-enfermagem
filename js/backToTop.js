// --- BOTÃO VOLTAR AO TOPO ---
const backToTopBtn = document.getElementById('back-to-top-btn');

if (backToTopBtn) {
    const toggleBackToTopButton = () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('is-hidden');
        } else {
            backToTopBtn.classList.add('is-hidden');
        }
    };
    
    // Verifica o estado inicial ao carregar a página e adiciona o listener
    toggleBackToTopButton();
    window.addEventListener('scroll', toggleBackToTopButton);

    // Adiciona o listener para o evento de clique
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}