// --- INÍCIO DO SCRIPT PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
            
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

    // --- LÓGICA DE MODAIS E COOKIES (GLOBAL) ---
    const suggestToolBtn = document.getElementById('suggest-tool-btn');
    const suggestionModal = document.getElementById('suggestion-modal');
    const cookiePrefsModal = document.getElementById('cookie-prefs-modal');

    const openModal = (modal) => {
        if(!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        window.addEventListener('keydown', closeModalOnEsc);
    };

    const closeModal = (modal) => {
        if(!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        window.removeEventListener('keydown', closeModalOnEsc);
    };
    
    const closeModalOnEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal(suggestionModal);
            closeModal(cookiePrefsModal);
        }
    };

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(suggestionModal);
            closeModal(cookiePrefsModal);
        });
    });

    if(suggestToolBtn) {
        suggestToolBtn.addEventListener('click', () => openModal(suggestionModal));
    }
    
    // --- GESTOR DE COOKIES ---
    class CookieManager {
        constructor() {
            this.banner = document.getElementById('cookie-banner');
            this.prefsModal = document.getElementById('cookie-prefs-modal');
            this.modalToggles = {
                analiticos: document.getElementById('cookies-analiticos'),
                marketing: document.getElementById('cookies-marketing')
            };

            this.prefs = { analiticos: true, marketing: false };
            this.init();
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
            if(this.prefsModal) closeModal(this.prefsModal);
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

            document.getElementById('manage-cookies-banner-btn')?.addEventListener('click', () => openModal(this.prefsModal));
            document.getElementById('manage-cookies-footer-btn')?.addEventListener('click', () => openModal(this.prefsModal));
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
            if(this.modalToggles.analiticos) this.prefs.analiticos = this.modalToggles.analiticos.checked;
            if(this.modalToggles.marketing) this.prefs.marketing = this.modalToggles.marketing.checked;
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

        showBanner() { if(this.banner) this.banner.classList.add('show'); }
        hideBanner() { if(this.banner) this.banner.classList.remove('show'); }
    }

    new CookieManager();
    
    // --- MÓDULO DE ACESSIBILIDADE (GLOBAL) ---
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
            this.init();
        }

        init() {
            if(!this.openBtn || !this.menu) return;

            const closeMenu = () => this.menu.classList.remove('open');

            this.openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.menu.classList.toggle('open');
            });
            this.closeBtn.addEventListener('click', closeMenu);
            this.closeBtnFooter.addEventListener('click', closeMenu);
            
            document.addEventListener('click', (e) => {
                if (this.menu.classList.contains('open') && !e.target.closest('#accessibility-menu') && !e.target.closest('#accessibility-btn')) {
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

            if (isToggle) { this.state[group] = !this.state[group]; } 
            else { this.state[group] = this.state[group] === value ? null : value; }

            const funcName = 'apply' + group.charAt(0).toUpperCase() + group.slice(1);
            if (typeof this[funcName] === 'function') { this[funcName](this.state[group]); }

            this.updateActiveState();
        }

        applyFontSize(value) { this.body.style.fontSize = value ? `${value}em` : ''; }
        applyFontType(value) { this.body.classList.toggle('font-serif', value === 'serif'); this.body.classList.toggle('font-bold-force', value === 'bold'); }
        applyLineSpacing(value) { this.body.style.lineHeight = value || ''; }
        applyLetterSpacing(value) { this.body.style.letterSpacing = value ? `${value}em` : ''; }
        applyContrast(value) { 
            this.html.className = this.html.className.replace(/contrast-\w+/g, ''); 
            if(value) {
                 this.html.classList.add(`contrast-${value}`);
            }
            const carbonBadge = document.getElementById('wcb');
            if(carbonBadge) {
                // Adicionado a lógica para o modo dark do badge de carbono
                if(value === 'dark') {
                    carbonBadge.classList.add('wcb-d');
                } else {
                    carbonBadge.classList.remove('wcb-d');
                }
            }
        }
        applySaturation(value) { this.html.className = this.html.className.replace(/saturation-\w+/g, ''); if(value) this.html.classList.add(`saturation-${value}`); }
        applyHighlightLinks(active) { this.body.classList.toggle('links-highlighted', active); }
        
        applySiteReader(active) {
            if (active) { 
                this.body.addEventListener('click', this.readText, false); 
            } else { 
                this.body.removeEventListener('click', this.readText, false); 
                speechSynthesis.cancel(); 
            }
        }
        
        readText(event) {
            if(event.target.closest('a, button, input, select, textarea')) return;
            event.preventDefault();
            event.stopPropagation();
            const text = event.target.textContent || event.target.alt || event.target.ariaLabel;
            if (text) {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text.trim());
                utterance.lang = 'pt-BR';
                speechSynthesis.speak(utterance);
            }
        }

        applyReadingMask(active) {
            if (active && !this.readingMask) {
                this.readingMask = document.createElement('div'); this.readingMask.id = 'reading-mask'; this.body.appendChild(this.readingMask);
                document.addEventListener('mousemove', this.updateMaskPosition);
            } else if (!active && this.readingMask) {
                this.readingMask.remove(); this.readingMask = null;
                document.removeEventListener('mousemove', this.updateMaskPosition);
            }
        }
        
        updateMaskPosition(e) { const maskHeight = 100; document.getElementById('reading-mask').style.clipPath = `polygon(0 ${e.clientY - maskHeight/2}px, 100% ${e.clientY - maskHeight/2}px, 100% ${e.clientY + maskHeight/2}px, 0 ${e.clientY + maskHeight/2}px)`; }

        applyReadingGuide(active) {
            if (active && !this.readingGuide) {
                this.readingGuide = document.createElement('div'); this.readingGuide.id = 'reading-guide'; this.body.appendChild(this.readingGuide);
                document.addEventListener('mousemove', this.updateGuidePosition);
            } else if (!active && this.readingGuide) {
                this.readingGuide.remove(); this.readingGuide = null;
                document.removeEventListener('mousemove', this.updateGuidePosition);
            }
        }

        updateGuidePosition(e) { document.getElementById('reading-guide').style.top = `${e.clientY}px`; }

        resetAll() {
            const allActions = new Set(Array.from(this.menu.querySelectorAll('[data-action]')).map(el => el.dataset.action));
            allActions.forEach(action => {
                const group = action.replace(/-(\w)/g, (m, p1) => p1.toUpperCase());
                this.state[group] = null;
                const funcName = 'apply' + group.charAt(0).toUpperCase() + group.slice(1);
                if (typeof this[funcName] === 'function') { this[funcName](null); }
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

    new AccessibilityManager();
    
    // --- BOTÃO LIBRAS ---
    const librasBtn = document.getElementById('libras-btn');
    if(librasBtn) {
        librasBtn.addEventListener('click', () => {
            const vw_widget = document.querySelector('[vw-access-button]');
            if (vw_widget) {
                vw_widget.click();
            }
        });
    }

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

    // --- REGISTRO DO SERVICE WORKER PARA PWA ---
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
}); // Fim do DOMContentLoaded