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