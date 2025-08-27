// --- MENU HAMBÚRGUER ---
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenuBtn = document.getElementById('close-menu-btn');

if (hamburgerBtn && mobileMenu && closeMenuBtn) {
    const toggleMenu = () => {
        if (mobileMenu.style.display === 'none' || mobileMenu.style.display === '') {
            mobileMenu.style.display = 'block';
        } else {
            mobileMenu.style.display = 'none';
        }
    };

    hamburgerBtn.addEventListener('click', toggleMenu);
    closeMenuBtn.addEventListener('click', toggleMenu);

    // Adiciona um listener para fechar o menu ao clicar em qualquer link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });
}

// --- ACCORDION MENU MÓVEL ---
document.querySelectorAll('.mobile-dropdown-btn').forEach(button => {
    button.addEventListener('click', () => {
        const content = button.nextElementSibling;
        content.classList.toggle('hidden');
        const icon = button.querySelector('i');
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
        icon.classList.toggle('rotate-180');
    });
});

// --- DROPDOWNS DESKTOP & MOBILE ---
function setupDropdown(btnId, menuId) {
    const button = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!button || !menu) return;

    button.addEventListener('click', (event) => {
        event.stopPropagation();
        // Fecha outros menus do mesmo tipo (desktop/mobile)
        const type = btnId.includes('desktop') ? 'desktop' : 'mobile';
        document.querySelectorAll(`[id$="-menu-${type}"], [id$="-menu"]`).forEach(m => {
            if (m !== menu) m.classList.add('hidden');
        });
        menu.classList.toggle('hidden');
    });
}

// Desktop Dropdowns
['sobre-nos-btn', 'calculadoras-btn', 'conteudo-btn', 'carreira-btn', 'fale-conosco-btn'].forEach(id => setupDropdown(id, id.replace('-btn', '-menu')));
setupDropdown('language-btn-desktop', 'language-menu-desktop');

// Mobile Dropdown
setupDropdown('language-btn-mobile', 'language-menu-mobile');

window.addEventListener('click', function() {
    document.querySelectorAll('[id$="-menu"], [id$="-menu-desktop"], [id$="-menu-mobile"]').forEach(m => {
        m.classList.add('hidden');
    });
});