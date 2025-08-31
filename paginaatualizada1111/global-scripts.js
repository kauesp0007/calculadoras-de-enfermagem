// global-scripts.js

/**
 * @fileoverview Scripts globais para o site Calculadoras de Enfermagem
 * Contém a inicialização de componentes, gestão de acessibilidade, cookies e funcionalidades do header
 */

// --- INICIALIZAÇÃO GLOBAL ---
document.addEventListener('DOMContentLoaded', () => {
    initGlobalComponents();
});

/**
 * Inicializa todos os componentes globais do site
 */
function initGlobalComponents() {
    initHeader();
    initFooter();
    initAccessibility();
    initCookieManager();
    initBackToTop();
    initModals();
    initNewsletter();
    
    console.log('Componentes globais inicializados com sucesso');
}

// --- HEADER & NAVEGAÇÃO ---

/**
 * Inicializa todas as funcionalidades do header
 */
function initHeader() {
    initHamburgerMenu();
    initDesktopDropdowns();
    initMobileDropdowns();
    initLanguageSelector();
}

/**
 * Inicializa o menu hamburger para dispositivos móveis
 */
function initHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.getElementById('close-menu-btn');

    if (hamburgerBtn && mobileMenu && closeMenuBtn) {
        const toggleMenu = () => {
            if (mobileMenu.style.display === 'none' || mobileMenu.style.display === '') {
                mobileMenu.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Impide scroll no body
            } else {
                mobileMenu.style.display = 'none';
                document.body.style.overflow = ''; // Restaura scroll
            }
        };

        hamburgerBtn.addEventListener('click', toggleMenu);
        closeMenuBtn.addEventListener('click', toggleMenu);

        // Fechar menu ao clicar em links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    }
}

/**
 * Inicializa os dropdowns do desktop
 */
function initDesktopDropdowns() {
    // Configura dropdowns desktop
    const desktopDropdowns = [
        'sobre-nos-btn', 
        'calculadoras-btn', 
        'conteudo-btn', 
        'carreira-btn', 
        'fale-conosco-btn',
        'language-btn-desktop'
    ];

    desktopDropdowns.forEach(id => {
        const button = document.getElementById(id);
        const menu = document.getElementById(id.replace('-btn', '-menu'));
        
        if (button && menu) {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                // Fecha outros menus
                document.querySelectorAll('[id$="-menu"]').forEach(m => {
                    if (m !== menu) m.classList.add('hidden');
                });
                menu.classList.toggle('hidden');
            });
        }
    });

    // Fecha menus ao clicar fora
    window.addEventListener('click', () => {
        document.querySelectorAll('[id$="-menu"]').forEach(menu => {
            menu.classList.add('hidden');
        });
    });
}

/**
 * Inicializa os dropdowns do mobile
 */
function initMobileDropdowns() {
    // Accordion menu móvel
    document.querySelectorAll('.mobile-dropdown-btn').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            content.classList.toggle('hidden');
            const icon = button.querySelector('i');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        });
    });

    // Selector de idioma mobile
    const languageBtnMobile = document.getElementById('language-btn-mobile');
    const languageMenuMobile = document.getElementById('language-menu-mobile');
    
    if (languageBtnMobile && languageMenuMobile) {
        languageBtnMobile.addEventListener('click', (event) => {
            event.stopPropagation();
            languageMenuMobile.classList.toggle('hidden');
        });
    }
}

/**
 * Inicializa o seletor de idioma
 */
function initLanguageSelector() {
    // Configura os seletores de idioma (desktop e mobile)
    const languageOptions = document.querySelectorAll('[data-lang]');
    
    languageOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = option.getAttribute('data-lang');
            const flagImg = option.getAttribute('data-img');
            
            // Atualiza desktop
            const desktopImg = document.getElementById('selected-lang-img-desktop');
            const desktopText = document.getElementById('selected-lang-text-desktop');
            
            if (desktopImg && desktopText) {
                desktopImg.src = flagImg;
                desktopText.textContent = lang;
            }
            
            // Atualiza mobile
            const mobileImg = document.getElementById('selected-lang-img-mobile');
            if (mobileImg) {
                mobileImg.src = flagImg;
            }
            
            // Fecha menus
            document.querySelectorAll('[id$="-menu"]').forEach(menu => {
                menu.classList.add('hidden');
            });
            
            // Redireciona para a página do idioma selecionado
            window.location.href = option.href;
        });
    });
}

// --- FOOTER ---

/**
 * Inicializa as funcionalidades do footer
 */
function initFooter() {
    const manageCookiesFooterBtn = document.getElementById('manage-cookies-footer-btn');
    if (manageCookiesFooterBtn) {
        manageCookiesFooterBtn.addEventListener('click', () => {
            const cookiePrefsModal = document.getElementById('cookie-prefs-modal');
            if (cookiePrefsModal) {
                cookiePrefsModal.classList.remove('hidden');
                cookiePrefsModal.classList.add('flex');
            }
        });
    }
}

// --- ACESSIBILIDADE ---

/**
 * Inicializa o sistema de acessibilidade
 */
function initAccessibility() {
    const accessibilityManager = new AccessibilityManager();
    accessibilityManager.init();
    
    // Botão LIBRAS
    const librasBtn = document.getElementById('libras-btn');
    if (librasBtn) {
        librasBtn.addEventListener('click', () => {
            const vwWidget = document.querySelector('[vw-access-button]');
            if (vwWidget) {
                vwWidget.click();
            }
        });
    }
}

/**
 * Gerenciador de acessibilidade
 */
class AccessibilityManager {
    constructor() {
        this.body = document.body;
        this.html = document.documentElement;
        this.menu = document.getElementById('accessibility-menu');
        this.openBtn = document.getElementById('accessibility-btn');
        this.closeBtn = document.getElementById('close-accessibility-menu');
        this.closeBtnFooter = document.getElementById('close-accessibility-menu-footer');
        this.resetBtn = document.getElementById('reset-accessibility');
        
        this.state = {};
        this.readingMask = null;
        this.readingGuide = null;
    }

    init() {
        if (!this.openBtn || !this.menu) return;

        const closeMenu = () => this.menu.classList.remove('open');

        this.openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.menu.classList.toggle('open');
        });
        
        this.closeBtn.addEventListener('click', closeMenu);
        this.closeBtnFooter.addEventListener('click', closeMenu);
        
        document.addEventListener('click', (e) => {
            if (this.menu.classList.contains('open') && 
                !e.target.closest('#accessibility-menu') && 
                !e.target.closest('#accessibility-btn')) {
                this.menu.classList.remove('open');
            }
        });

        this.resetBtn.addEventListener('click', () => this.resetAll());
        
        this.menu.addEventListener('click', (e) => {
            const target = e.target.closest('.acc-option');
            if (!target) return;
            const { action, value } = target.dataset;
            this.handleAction(action, value);
        });
    }

    handleAction(action, value) {
        const group = action.replace(/-(\w)/g, (m, p1) => p1.toUpperCase());
        const isToggle = !value;

        if (isToggle) { 
            this.state[group] = !this.state[group]; 
        } else { 
            this.state[group] = this.state[group] === value ? null : value; 
        }

        const funcName = 'apply' + group.charAt(0).toUpperCase() + group.slice(1);
        if (typeof this[funcName] === 'function') { 
            this[funcName](this.state[group]); 
        }

        this.updateActiveState();
    }

    applyFontSize(value) { 
        this.body.style.fontSize = value ? `${value}em` : ''; 
    }
    
    applyFontType(value) { 
        this.body.classList.toggle('font-serif', value === 'serif'); 
        this.body.classList.toggle('font-bold-force', value === 'bold'); 
    }
    
    applyLineSpacing(value) { 
        this.body.style.lineHeight = value || ''; 
    }
    
    applyLetterSpacing(value) { 
        this.body.style.letterSpacing = value ? `${value}em` : ''; 
    }
    
    applyContrast(value) { 
        this.html.className = this.html.className.replace(/contrast-\w+/g, ''); 
        if (value) {
            this.html.classList.add(`contrast-${value}`);
        }
        // Atualiza o badge de carbono para modo escuro se necessário
        const carbonBadge = document.getElementById('wcb');
        if (carbonBadge) {
            if (value === 'dark') {
                carbonBadge.classList.add('wcb-d');
            } else {
                carbonBadge.classList.remove('wcb-d');
            }
        }
    }
    
    applySaturation(value) { 
        this.html.className = this.html.className.replace(/saturation-\w+/g, ''); 
        if (value) this.html.classList.add(`saturation-${value}`); 
    }
    
    applyHighlightLinks(active) { 
        this.body.classList.toggle('links-highlighted', active); 
    }
    
    applySiteReader(active) {
        if (active) { 
            this.body.addEventListener('click', this.readText, false); 
        } else { 
            this.body.removeEventListener('click', this.readText, false); 
            window.speechSynthesis.cancel(); 
        }
    }
    
    readText(event) {
        if (event.target.closest('a, button, input, select, textarea')) return;
        event.preventDefault();
        event.stopPropagation();
        const text = event.target.textContent || event.target.alt || event.target.ariaLabel;
        if (text) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.trim());
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
        }
    }

    applyReadingMask(active) {
        if (active && !this.readingMask) {
            this.readingMask = document.createElement('div'); 
            this.readingMask.id = 'reading-mask'; 
            this.body.appendChild(this.readingMask);
            document.addEventListener('mousemove', this.updateMaskPosition);
        } else if (!active && this.readingMask) {
            this.readingMask.remove(); 
            this.readingMask = null;
            document.removeEventListener('mousemove', this.updateMaskPosition);
        }
    }
    
    updateMaskPosition = (e) => { 
        const maskHeight = 100; 
        const mask = document.getElementById('reading-mask');
        if (mask) {
            mask.style.clipPath = `polygon(0 ${e.clientY - maskHeight/2}px, 100% ${e.clientY - maskHeight/2}px, 100% ${e.clientY + maskHeight/2}px, 0 ${e.clientY + maskHeight/2}px)`; 
        }
    }

    applyReadingGuide(active) {
        if (active && !this.readingGuide) {
            this.readingGuide = document.createElement('div'); 
            this.readingGuide.id = 'reading-guide'; 
            this.body.appendChild(this.readingGuide);
            document.addEventListener('mousemove', this.updateGuidePosition);
        } else if (!active && this.readingGuide) {
            this.readingGuide.remove(); 
            this.readingGuide = null;
            document.removeEventListener('mousemove', this.updateGuidePosition);
        }
    }

    updateGuidePosition = (e) => { 
        const guide = document.getElementById('reading-guide');
        if (guide) {
            guide.style.top = `${e.clientY}px`; 
        }
    }

    resetAll() {
        const allActions = new Set(Array.from(this.menu.querySelectorAll('[data-action]')).map(el => el.dataset.action));
        allActions.forEach(action => {
            const group = action.replace(/-(\w)/g, (m, p1) => p1.toUpperCase());
            this.state[group] = null;
            const funcName = 'apply' + group.charAt(0).toUpperCase() + group.slice(1);
            if (typeof this[funcName] === 'function') { 
                this[funcName](null); 
            }
        });
        this.updateActiveState();
    }
    
    updateActiveState() {
        this.menu.querySelectorAll('.acc-feature').forEach(feature => {
            const group = feature.dataset.group;
            let hasActive = false;
            feature.querySelectorAll('.acc-option').forEach(option => {
                const { action, value } = option.dataset;
                const isActive = value ? this.state[group] === value : !!this.state[group];
                option.classList.toggle('active', isActive);
                if (isActive) hasActive = true;
            });
            feature.classList.toggle('active', hasActive);
        });
    }
}

// --- GERENCIAMENTO DE COOKIES ---

/**
 * Inicializa o gerenciador de cookies
 */
function initCookieManager() {
    const cookieManager = new CookieManager();
    cookieManager.init();
}

class CookieManager {
    constructor() {
        this.banner = document.getElementById('cookie-banner');
        this.prefsModal = document.getElementById('cookie-prefs-modal');
        this.modalToggles = {
            analiticos: document.getElementById('cookies-analiticos'),
            marketing: document.getElementById('cookies-marketing')
        };

        this.prefs = { analiticos: true, marketing: false };
    }

    init() {
        this.loadPreferences();
        this.bindEvents();
        this.checkConsent();
    }

    loadPreferences() {
        try {
            const storedPrefs = localStorage.getItem('cookiePrefs');
            if (storedPrefs) this.prefs = JSON.parse(storedPrefs);
        } catch (e) {
            console.error('Falha ao carregar preferências de cookies do localStorage:', e);
        }
        this.updateUI();
    }

    savePreferences() {
        try {
            localStorage.setItem('cookiePrefs', JSON.stringify(this.prefs));
            localStorage.setItem('cookieConsent', 'managed');
        } catch (e) {
            console.error('Falha ao salvar preferências de cookies no localStorage:', e);
        }
        this.hideBanner();
        if (this.prefsModal) this.closeModal(this.prefsModal);
    }

    updateUI() {
        for (const key in this.prefs) {
            if (this.modalToggles[key]) this.modalToggles[key].checked = this.prefs[key];
        }
    }

    bindEvents() {
        document.getElementById('accept-cookies-btn')?.addEventListener('click', () => this.acceptAll());
        document.getElementById('accept-all-cookies-btn')?.addEventListener('click', () => this.acceptAll());
        document.getElementById('decline-cookies-btn')?.addEventListener('click', () => this.declineAll());
        document.getElementById('save-cookie-prefs-btn')?.addEventListener('click', () => this.managePrefsFromModal());

        document.getElementById('manage-cookies-banner-btn')?.addEventListener('click', () => this.openModal(this.prefsModal));
        document.getElementById('manage-cookies-footer-btn')?.addEventListener('click', () => this.openModal(this.prefsModal));
        
        // Fechar modal ao clicar fora
        if (this.prefsModal) {
            this.prefsModal.addEventListener('click', (e) => {
                if (e.target === this.prefsModal) this.closeModal(this.prefsModal);
            });
            
            // Fechar modal com ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !this.prefsModal.classList.contains('hidden')) {
                    this.closeModal(this.prefsModal);
                }
            });
        }
    }

    acceptAll() {
        this.prefs = { analiticos: true, marketing: true };
        try {
            localStorage.setItem('cookieConsent', 'accepted');
        } catch (e) {
            console.error('Falha ao salvar consentimento de cookies no localStorage:', e);
        }
        this.savePreferences();
        this.updateUI();
    }

    declineAll() {
        this.prefs = { analiticos: false, marketing: false };
        try {
            localStorage.setItem('cookieConsent', 'declined');
        } catch (e) {
            console.error('Falha ao salvar consentimento de cookies no localStorage:', e);
        }
        this.savePreferences();
        this.updateUI();
    }
    
    managePrefsFromModal() {
        if (this.modalToggles.analiticos) this.prefs.analiticos = this.modalToggles.analiticos.checked;
        if (this.modalToggles.marketing) this.prefs.marketing = this.modalToggles.marketing.checked;
        this.savePreferences();
        this.updateUI();
    }

    checkConsent() {
        try {
            if (!localStorage.getItem('cookieConsent') && this.banner) {
                setTimeout(() => this.showBanner(), 2000);
            }
        } catch (e) {
            console.error('Falha ao verificar consentimento de cookies:', e);
        }
    }

    showBanner() { 
        if (this.banner) this.banner.classList.add('show'); 
    }
    
    hideBanner() { 
        if (this.banner) this.banner.classList.remove('show'); 
    }
    
    openModal(modal) {
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    
    closeModal(modal) {
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// --- BOTÃO VOLTAR AO TOPO ---

/**
 * Inicializa o botão "voltar ao topo"
 */
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        const toggleBackToTopButton = () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.remove('is-hidden');
            } else {
                backToTopBtn.classList.add('is-hidden');
            }
        };
        
        toggleBackToTopButton();
        window.addEventListener('scroll', toggleBackToTopButton);

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// --- MODAIS ---

/**
 * Inicializa os modais do site
 */
function initModals() {
    initSuggestionModal();
    initCookieModal();
}

/**
 * Inicializa o modal de sugestões
 */
function initSuggestionModal() {
    const suggestToolBtn = document.getElementById('suggest-tool-btn');
    const suggestionModal = document.getElementById('suggestion-modal');
    
    if (suggestToolBtn && suggestionModal) {
        suggestToolBtn.addEventListener('click', () => this.openModal(suggestionModal));
        
        // Fechar modal
        suggestionModal.addEventListener('click', (e) => {
            if (e.target === suggestionModal) this.closeModal(suggestionModal);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !suggestionModal.classList.contains('hidden')) {
                this.closeModal(suggestionModal);
            }
        });
        
        // Botões de fechar
        suggestionModal.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(suggestionModal));
        });
    }
}

/**
 * Inicializa o modal de cookies
 */
function initCookieModal() {
    // Já inicializado no CookieManager
}

/**
 * Abre um modal
 */
function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

/**
 * Fecha um modal
 */
function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
}

// --- NEWSLETTER ---

/**
 * Inicializa o formulário de newsletter
 */
function initNewsletter() {
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('newsletter-email');
            const feedbackDiv = document.getElementById('newsletter-feedback');
            const email = emailInput.value.trim();

            if (email) {
                feedbackDiv.textContent = 'A processar...';
                feedbackDiv.style.color = 'gray';
                
                try {
                    // Simulação de envio - substitua pela sua lógica real
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    feedbackDiv.textContent = 'Obrigado por subscrever!';
                    feedbackDiv.style.color = 'green';
                    emailInput.value = '';
                } catch (error) {
                    console.error("Erro ao adicionar o documento: ", error);
                    feedbackDiv.textContent = 'Ocorreu um erro. Por favor, tente novamente mais tarde.';
                    feedbackDiv.style.color = 'red';
                }
            }
        });
    }
}

// --- PWA & SERVICE WORKER ---

/**
 * Registra o Service Worker para funcionalidades PWA
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registrado com sucesso: ', registration.scope);
                })
                .catch(err => {
                    console.error('Falha ao registrar Service Worker:', err);
                });
        });
    }
}

// Registrar Service Worker
registerServiceWorker();

// --- UTILITÁRIOS GLOBAIS ---

/**
 * Função auxiliar para carregar componentes HTML
 * @param {string} url URL do componente a ser carregado
 * @param {string} placeholderId ID do elemento placeholder onde o conteúdo será injetado
 */
function loadComponent(url, placeholderId) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                placeholder.outerHTML = data;
                
                // Reinicializa componentes específicos se necessário
                if (placeholderId === 'global-header-placeholder') {
                    initHeader();
                } else if (placeholderId === 'global-footer-placeholder') {
                    initFooter();
                }
            }
        })
        .catch(error => console.error(`Erro ao carregar ${url}:`, error));
}

// Exporta funções para uso global (se necessário)
if (typeof window !== 'undefined') {
    window.loadComponent = loadComponent;
    window.openModal = openModal;
    window.closeModal = closeModal;
}