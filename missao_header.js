// missao_header.js
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerButton = document.getElementById('hamburgerButton');
    const offCanvasMenu = document.getElementById('offCanvasMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const desktopNav = document.querySelector('.desktop-nav');
    const accessibilityToggleButton = document.getElementById('accessibilityToggleButton');
    const pwaAcessibilidadeBar = document.getElementById('pwaAcessibilidadeBar');
    const desktopAcessibilidadeBar = document.getElementById('barraAcessibilidade');

    // Função para verificar se é PWA ou tela pequena
    function isPWAOrSmallScreen() {
        return window.matchMedia('(display-mode: standalone)').matches || window.innerWidth <= 768;
    }

    // Função para alternar a visibilidade dos elementos do modo PWA
    function togglePWAModeElements() {
        const vlibrasWidgetButton = document.querySelector('.vw-access-button'); // Obtém o botão VLibras

        if (isPWAOrSmallScreen()) {
            // Mostra os elementos PWA removendo 'pwa-only' que define display: none
            // A media query aplicará então display: block !important
            if (hamburgerButton) hamburgerButton.classList.remove('pwa-only');
            if (offCanvasMenu) offCanvasMenu.classList.remove('pwa-only');
            if (menuOverlay) menuOverlay.classList.remove('pwa-only');
            if (pwaAcessibilidadeBar) pwaAcessibilidadeBar.classList.remove('pwa-only');

            // Define explicitamente a exibição do botão VLibras
            if (vlibrasWidgetButton) vlibrasWidgetButton.style.display = 'flex';

            // Oculta os elementos do desktop
            if (desktopNav) desktopNav.classList.add('desktop-only');
            if (desktopAcessibilidadeBar) desktopAcessibilidadeBar.classList.add('desktop-only');
        } else {
            // Mostra os elementos do desktop
            if (hamburgerButton) hamburgerButton.classList.add('pwa-only'); // Oculta o hambúrguer no desktop
            if (offCanvasMenu) offCanvasMenu.classList.add('pwa-only');
            if (menuOverlay) menuOverlay.classList.add('pwa-only');
            if (desktopNav) desktopNav.classList.remove('desktop-only');
            if (desktopAcessibilidadeBar) desktopAcessibilidadeBar.classList.remove('desktop-only');

            // Oculta os elementos PWA
            if (pwaAcessibilidadeBar) pwaAcessibilidadeBar.classList.add('pwa-only');

            // Garante que o menu e a barra PWA estejam fechados ao mudar para a visualização do desktop
            if (offCanvasMenu) offCanvasMenu.classList.remove('is-open');
            if (menuOverlay) menuOverlay.classList.remove('is-open');
            if (pwaAcessibilidadeBar) pwaAcessibilidadeBar.classList.remove('is-open');
        }
    }

    // Lógica do menu hambúrguer
    if (hamburgerButton && offCanvasMenu && menuOverlay) {
        hamburgerButton.addEventListener('click', () => {
            console.log('Botão hambúrguer clicado.');
            offCanvasMenu.classList.toggle('is-open');
            menuOverlay.classList.toggle('is-open');
            // Fecha a barra de acessibilidade se estiver aberta
            if (pwaAcessibilidadeBar && pwaAcessibilidadeBar.classList.contains('is-open')) {
                pwaAcessibilidadeBar.classList.remove('is-open');
                accessibilityToggleButton.setAttribute('aria-expanded', 'false');
            }
        });

        menuOverlay.addEventListener('click', () => {
            console.log('Overlay do menu clicado (para fechar o hambúrguer).');
            offCanvasMenu.classList.remove('is-open');
            menuOverlay.classList.remove('is-open');
        });

        // Adiciona listeners de evento para alternar submenus móveis
        document.querySelectorAll('[data-submenu-toggle]').forEach(toggleBtn => {
            toggleBtn.addEventListener('click', function(event) {
                event.preventDefault(); // Previne o comportamento padrão do link
                const submenuId = this.dataset.submenuToggle;
                const submenu = document.getElementById(`submenu-${submenuId}`);
                if (submenu) {
                    submenu.classList.toggle('hidden');
                    const isExpanded = !submenu.classList.contains('hidden');
                    this.setAttribute('aria-expanded', isExpanded);
                    // Gira o ícone de chevron
                    const icon = this.querySelector('i.fa-chevron-down, i.fa-chevron-right');
                    if (icon) {
                        if (isExpanded) {
                            icon.classList.remove('fa-chevron-right');
                            icon.classList.add('fa-chevron-down');
                        } else {
                            icon.classList.remove('fa-chevron-down');
                            icon.classList.add('fa-chevron-right');
                        }
                    }
                }
            });
        });
    }

    // Lógica do botão de alternância de acessibilidade (PWA)
    if (accessibilityToggleButton && pwaAcessibilidadeBar && menuOverlay) {
        accessibilityToggleButton.addEventListener('click', () => {
            console.log("accessibilityToggleButton clicado!"); // Log de depuração
            pwaAcessibilidadeBar.classList.toggle('is-open');
            const isOpen = pwaAcessibilidadeBar.classList.contains('is-open');
            accessibilityToggleButton.setAttribute('aria-expanded', isOpen);

            if (isOpen) {
                menuOverlay.classList.add('is-open'); // Mostra o overlay
                // Fecha o menu hambúrguer se estiver aberto
                if (offCanvasMenu && offCanvasMenu.classList.contains('is-open')) {
                    offCanvasMenu.classList.remove('is-open');
                }
            } else {
                menuOverlay.classList.remove('is-open'); // Oculta o overlay
            }
        });

        menuOverlay.addEventListener('click', (e) => {
            // Só fecha a pwaAcessibilidadeBar se o alvo do clique for o próprio overlay
            // e não um filho da pwaAcessibilidadeBar
            if (pwaAcessibilidadeBar.classList.contains('is-open') &&
                !pwaAcessibilidadeBar.contains(e.target)) {
                console.log('Overlay do menu clicado (para fechar a barra de acessibilidade PWA).');
                pwaAcessibilidadeBar.classList.remove('is-open');
                accessibilityToggleButton.setAttribute('aria-expanded', 'false');
                menuOverlay.classList.remove('is-open');
            }
        });
    }

    // Ouve o redimensionamento da janela para ajustar a visibilidade dos elementos PWA
    window.addEventListener('resize', togglePWAModeElements);
    // Chamada inicial ao carregar
    togglePWAModeElements();
});
