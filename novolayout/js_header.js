// Controle dos menus do cabeçalho
class HeaderManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupDesktopDropdowns();
        this.setupMobileDropdowns();
    }

    setupMobileMenu() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const closeMenuBtn = document.getElementById('close-menu-btn');

        if (hamburgerBtn && mobileMenu && closeMenuBtn) {
            hamburgerBtn.addEventListener('click', () => {
                mobileMenu.classList.add('show');
                hamburgerBtn.setAttribute('aria-expanded', 'true');
            });

            closeMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('show');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
            });
        }
    }

    setupDesktopDropdowns() {
        const dropdownButtons = document.querySelectorAll('[aria-haspopup="true"]');

        dropdownButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const menuId = button.getAttribute('aria-controls');
                const menu = document.getElementById(menuId);
                const isExpanded = button.getAttribute('aria-expanded') === 'true';

                // Fechar todos os outros menus
                document.querySelectorAll('[aria-expanded="true"]').forEach(btn => {
                    if (btn !== button) {
                        const otherMenuId = btn.getAttribute('aria-controls');
                        const otherMenu = document.getElementById(otherMenuId);
                        btn.setAttribute('aria-expanded', 'false');
                        if (otherMenu) otherMenu.classList.add('hidden');
                    }
                });

                // Alternar o menu atual
                button.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
                if (menu) {
                    menu.classList.toggle('hidden');
                }
            });
        });

        // Fechar menus ao clicar fora
        document.addEventListener('click', () => {
            document.querySelectorAll('[aria-expanded="true"]').forEach(button => {
                const menuId = button.getAttribute('aria-controls');
                const menu = document.getElementById(menuId);
                button.setAttribute('aria-expanded', 'false');
                if (menu) menu.classList.add('hidden');
            });
        });
    }

    setupMobileDropdowns() {
        const mobileDropdownButtons = document.querySelectorAll('.mobile-dropdown-btn');

        mobileDropdownButtons.forEach(button => {
            button.addEventListener('click', () => {
                const contentId = button.getAttribute('aria-controls');
                const content = document.getElementById(contentId);
                const isExpanded = button.getAttribute('aria-expanded') === 'true';

                button.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');

                if (content) {
                    content.classList.toggle('show');
                }

                // Alternar ícone
                const icon = button.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            });
        });
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new HeaderManager();
});