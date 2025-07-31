// // global-scripts.js
// Este arquivo contém todo o JavaScript para a barra de acessibilidade,
// modais (personalizado, cookies, atalhos de teclado) e VLibras,
// além da lógica de navegação e responsividade global, e o formulário de newsletter.

document.addEventListener('DOMContentLoaded', function() {
    // --- Referências de Elementos Globais ---
    const body = document.body;
    [cite_start]const statusMessageDiv = document.getElementById('statusMessage'); // [cite: 2]

    // Elementos da barra de acessibilidade desktop
    const desktopAcessibilidadeBar = document.getElementById('barraAcessibilidade'); [cite_start]// [cite: 2]
    const fontSizeText = document.getElementById('fontSizeText'); [cite_start]// [cite: 2]
    const lineHeightText = document.getElementById('lineHeightText'); [cite_start]// [cite: 2]
    const letterSpacingText = document.getElementById('letterSpacingText'); [cite_start]// [cite: 2]
    const readingSpeedText = document.getElementById('readingSpeedText'); [cite_start]// [cite: 2]
    const toggleLeituraBtn = document.getElementById('btnToggleLeitura'); [cite_start]// [cite: 2]
    const btnAlternarContraste = document.getElementById('btnAlternarContraste'); [cite_start]// [cite: 2]
    const btnAlternarModoEscuro = document.getElementById('btnAlternarModoEscuro'); [cite_start]// [cite: 2]
    const btnAlternarFonteDislexia = document.getElementById('btnAlternarFonteDislexia'); [cite_start]// [cite: 3]
    const btnKeyboardShortcuts = document.getElementById('btnKeyboardShortcuts'); [cite_start]// [cite: 3]
    const btnResetarAcessibilidade = document.getElementById('btnResetarAcessibilidade'); [cite_start]// [cite: 3]
    const btnReadFocused = document.getElementById('btnReadFocused'); [cite_start]// [cite: 3]

    // Elementos da barra de acessibilidade PWA/Mobile
    const accessibilityToggleButton = document.getElementById('accessibilityToggleButton'); [cite_start]// [cite: 4]
    const pwaAcessibilidadeBar = document.getElementById('pwaAcessibilidadeBar'); [cite_start]// [cite: 4]
    const fontSizeTextPWA = document.getElementById('fontSizeTextPWA'); [cite_start]// [cite: 5]
    const lineHeightTextPWA = document.getElementById('lineHeightTextPWA'); [cite_start]// [cite: 5]
    const letterSpacingTextPWA = document.getElementById('letterSpacingTextPWA'); [cite_start]// [cite: 5]
    const readingSpeedTextPWA = document.getElementById('readingSpeedTextPWA'); [cite_start]// [cite: 5]
    const toggleLeituraBtnPWA = document.getElementById('btnToggleLeituraPWA'); [cite_start]// [cite: 5]
    const btnAlternarContrastePWA = document.getElementById('btnAlternarContrastePWA'); [cite_start]// [cite: 6]
    const btnAlternarModoEscuroPWA = document.getElementById('btnAlternarModoEscuroPWA'); [cite_start]// [cite: 6]
    const btnAlternarFonteDislexiaPWA = document.getElementById('btnAlternarFonteDislexiaPWA'); [cite_start]// [cite: 6]
    const btnKeyboardShortcutsPWA = document.getElementById('btnKeyboardShortcutsPWA'); [cite_start]// [cite: 6]
    const btnResetarAcessibilidadePWA = document.getElementById('btnResetarAcessibilidadePWA'); [cite_start]// [cite: 6]
    const btnReadFocusedPWA = document.getElementById('btnReadFocusedPWA'); [cite_start]// [cite: 7]

    // Elementos do menu de navegação (para PWA/Mobile)
    const hamburgerButton = document.getElementById('hamburgerButton'); [cite_start]// [cite: 7]
    const offCanvasMenu = document.getElementById('offCanvasMenu'); [cite_start]// [cite: 8]
    const menuOverlay = document.getElementById('menuOverlay'); [cite_start]// [cite: 8]
    const desktopNav = document.querySelector('.desktop-nav'); [cite_start]// [cite: 8]

    // Elementos do modal de mensagem personalizado (showCustomModal)
    const customModal = document.getElementById('customModal'); [cite_start]// [cite: 9]
    const modalMessage = document.getElementById('modalMessage'); [cite_start]// [cite: 10]
    const modalMessageTitle = document.getElementById('modalMessageTitle'); [cite_start]// [cite: 10]
    const modalCloseButton = document.getElementById('modalCloseButton'); [cite_start]// [cite: 10]

    // Elementos do modal de consentimento de cookies granular
    const granularCookieModal = document.getElementById('granularCookieModal'); [cite_start]// [cite: 11]
    const granularModalCloseButton = document.getElementById('granularModalCloseButton'); [cite_start]// [cite: 11]
    const saveGranularPreferencesBtn = document.getElementById('saveGranularPreferencesBtn'); [cite_start]// [cite: 12]
    const cancelGranularPreferencesBtn = document.getElementById('cancelGranularPreferencesBtn'); [cite_start]// [cite: 12]
    const cookieAnalyticsCheckbox = document.getElementById('cookieAnalytics'); [cite_start]// [cite: 12]
    const cookieMarketingCheckbox = document.getElementById('cookieMarketing'); [cite_start]// [cite: 12]
    const openGranularCookieModalBtn = document.getElementById('openGranularCookieModalBtn'); [cite_start]// [cite: 12]

    // Elementos do modal de atalhos de teclado
    const keyboardShortcutsModal = document.getElementById('keyboardShortcutsModal'); [cite_start]// [cite: 13]
    const keyboardModalCloseButton = document.getElementById('keyboardModalCloseButton'); [cite_start]// [cite: 14]

    // Elementos do formulário de newsletter
    const newsletterForm = document.getElementById('newsletters-section'); [cite_start]// [cite: 193]
    const newsletterEmail = document.getElementById('email'); [cite_start]// [cite: 194]
    const newsletterConsent = document.getElementById('newsletterConsent'); [cite_start]// [cite: 195]
    const subscribeNewsletterBtn = document.getElementById('subscribeNewsletterBtn'); [cite_start]// [cite: 195]
    const newsletterError = document.getElementById('erro-email'); [cite_start]// [cite: 195]

    // --- Variáveis de Estado ---
    let currentFontSize = 1; [cite_start]// [cite: 15]
    let currentLineHeight = 1; [cite_start]// [cite: 16]
    let currentLetterSpacing = 1; [cite_start]// [cite: 17]
    let currentReadingSpeed = 1; [cite_start]// [cite: 18]
    let speechSynthesizer = window.speechSynthesis; [cite_start]// [cite: 19]
    let utterance = null; [cite_start]// [cite: 20]
    let isReading = false; [cite_start]// [cite: 20]
    let currentFocusColor = localStorage.getItem('focusColor') || 'yellow'; [cite_start]// [cite: 20]
    let lastFocusedElement = null; [cite_start]// [cite: 20]

    // --- Funções de Acessibilidade ---
    // (Todas as funções como announceStatus, applySavedSettings, updateFontSize, etc. devem ser colocadas aqui)
    // ...
    // (O corpo das funções foi omitido para brevidade, mas deve ser incluído aqui como no arquivo original)
    // ...

    /**
     * [cite_start]Anuncia uma mensagem usando a região ARIA live. [cite: 21]
     * [cite_start]@param {string} message - A mensagem a ser anunciada. [cite: 22]
     */
    function announceStatus(message) {
        if (statusMessageDiv) {
            statusMessageDiv.textContent = message; [cite_start]// [cite: 23]
        }
    }

    /**
     * [cite_start]Aplica as configurações de acessibilidade salvas no localStorage ao carregar a página. [cite: 24]
     */
    function applySavedSettings() {
        const savedFontSize = localStorage.getItem('fontSize'); [cite_start]// [cite: 25]
        if (savedFontSize) {
            currentFontSize = parseInt(savedFontSize); [cite_start]// [cite: 26]
            updateFontSize(false); [cite_start]// [cite: 26]
        }
        const savedLineHeight = localStorage.getItem('lineHeight'); [cite_start]// [cite: 27]
        if (savedLineHeight) {
            currentLineHeight = parseInt(savedLineHeight); [cite_start]// [cite: 28]
            updateLineHeight(false); [cite_start]// [cite: 28]
        }
        const savedLetterSpacing = localStorage.getItem('letterSpacing'); [cite_start]// [cite: 29]
        if (savedLetterSpacing) {
            currentLetterSpacing = parseInt(savedLetterSpacing); [cite_start]// [cite: 30]
            updateLetterSpacing(false); [cite_start]// [cite: 30]
        }
        const savedReadingSpeed = localStorage.getItem('readingSpeed'); [cite_start]// [cite: 31]
        if (savedReadingSpeed) {
            currentReadingSpeed = parseInt(savedReadingSpeed); [cite_start]// [cite: 32]
            updateReadingSpeed(false); [cite_start]// [cite: 32]
        }
        if (localStorage.getItem('contrasteAlto') === 'true') {
            body.classList.add('contraste-alto'); [cite_start]// [cite: 33]
            if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', 'true'); [cite_start]// [cite: 34]
            if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', 'true'); [cite_start]// [cite: 34]
        }
        if (localStorage.getItem('darkMode') === 'true') {
            body.classList.add('dark-mode'); [cite_start]// [cite: 34]
            if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', 'true'); [cite_start]// [cite: 35]
            if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', 'true'); [cite_start]// [cite: 35]
        }
        if (localStorage.getItem('fonteDislexia') === 'true') {
            body.classList.add('fonte-dislexia'); [cite_start]// [cite: 35]
        }
        const savedFocusColor = localStorage.getItem('focusColor'); [cite_start]// [cite: 36]
        if (savedFocusColor) {
            currentFocusColor = savedFocusColor; [cite_start]// [cite: 37]
            document.documentElement.style.setProperty('--cor-foco-acessibilidade', currentFocusColor); [cite_start]// [cite: 37]
            updateFocusColorButtons(currentFocusColor); [cite_start]// [cite: 37]
        }
    }
    
    // ... (Cole aqui TODAS as suas outras funções: updateFontSize, alternarTamanhoFonte, updateLineHeight, etc. até a função adjustTitleBarWidth)


    // --- Event Listeners ---

    // Event listeners da Barra de Acessibilidade (Desktop)
    document.getElementById('btnAlternarTamanhoFonte')?.addEventListener('click', alternarTamanhoFonte);
    document.getElementById('btnAlternarEspacamentoLinha')?.addEventListener('click', alternarEspacamentoLinha);
    document.getElementById('btnAlternarEspacamentoLetra')?.addEventListener('click', alternarEspacamentoLetra);
    document.getElementById('btnAlternarVelocidadeLeitura')?.addEventListener('click', alternarVelocidadeLeitura);
    document.getElementById('btnToggleLeitura')?.addEventListener('click', toggleLeitura);
    document.getElementById('btnReiniciarLeitura')?.addEventListener('click', reiniciarLeitura);
    document.getElementById('btnReadFocused')?.addEventListener('click', readFocusedElement);
    document.getElementById('btnAlternarContraste')?.addEventListener('click', alternarContraste);
    document.getElementById('btnAlternarModoEscuro')?.addEventListener('click', alternarModoEscuro);
    document.getElementById('btnAlternarFonteDislexia')?.addEventListener('click', alternarFonteDislexia);
    document.getElementById('btnResetarAcessibilidade')?.addEventListener('click', resetarAcessibilidade);
    document.getElementById('btnKeyboardShortcuts')?.addEventListener('click', showKeyboardShortcutsModal);
    document.querySelectorAll('#barraAcessibilidade .color-option').forEach(button => {
        button.addEventListener('click', () => definirCorFoco(button.dataset.color));
    });

    // Event listeners da Barra de Acessibilidade (PWA/Mobile)
    document.getElementById('btnAlternarTamanhoFontePWA')?.addEventListener('click', alternarTamanhoFonte);
    document.getElementById('btnAlternarEspacamentoLinhaPWA')?.addEventListener('click', alternarEspacamentoLinha);
    document.getElementById('btnAlternarEspacamentoLetraPWA')?.addEventListener('click', alternarEspacamentoLetra);
    document.getElementById('btnAlternarVelocidadeLeituraPWA')?.addEventListener('click', alternarVelocidadeLeitura);
    document.getElementById('btnToggleLeituraPWA')?.addEventListener('click', toggleLeitura);
    document.getElementById('btnReiniciarLeituraPWA')?.addEventListener('click', reiniciarLeitura);
    document.getElementById('btnReadFocusedPWA')?.addEventListener('click', readFocusedElement);
    document.getElementById('btnAlternarContrastePWA')?.addEventListener('click', alternarContraste);
    document.getElementById('btnAlternarModoEscuroPWA')?.addEventListener('click', alternarModoEscuro);
    document.getElementById('btnAlternarFonteDislexiaPWA')?.addEventListener('click', alternarFonteDislexia);
    document.getElementById('btnResetarAcessibilidadePWA')?.addEventListener('click', resetarAcessibilidade);
    document.getElementById('btnKeyboardShortcutsPWA')?.addEventListener('click', showKeyboardShortcutsModal);
    document.querySelectorAll('#pwaAcessibilidadeBar .color-option').forEach(button => {
        button.addEventListener('click', () => definirCorFoco(button.dataset.color));
    });

    // Event listeners dos Modais
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', hideCustomModal); [cite_start]// [cite: 191]
    }
    if (granularModalCloseButton) {
        granularModalCloseButton.addEventListener('click', hideGranularCookieModal); [cite_start]// [cite: 256]
    }
    if (saveGranularPreferencesBtn) {
        saveGranularPreferencesBtn.addEventListener('click', saveGranularPreferences); [cite_start]// [cite: 257]
    }
    if (cancelGranularPreferencesBtn) {
        cancelGranularPreferencesBtn.addEventListener('click', hideGranularCookieModal); [cite_start]// [cite: 258]
    }
    if (keyboardModalCloseButton) {
        keyboardModalCloseButton.addEventListener('click', hideKeyboardShortcutsModal); [cite_start]// [cite: 265]
    }
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (customModal && !customModal.classList.contains('hidden')) {
                [cite_start]hideCustomModal(); // [cite: 192]
            }
            if (granularCookieModal && granularCookieModal.classList.contains('show')) {
                hideGranularCookieModal(); [cite_start]// [cite: 259]
            }
            if (keyboardShortcutsModal && keyboardShortcutsModal.classList.contains('show')) {
                hideKeyboardShortcutsModal(); [cite_start]// [cite: 267]
            }
        }
    });

    // Event listeners do Botão Voltar ao Topo
    const backToTopBtn = document.getElementById('backToTopBtn'); [cite_start]// [cite: 14]
    if (backToTopBtn) {
        window.addEventListener('scroll', checkScrollPosition); [cite_start]// [cite: 172]
        backToTopBtn.addEventListener('click', scrollToTop); [cite_start]// [cite: 173]
        checkScrollPosition(); // Executa ao carregar a página
    }

    // Event listeners do Banner de Cookies
    const cookieConsentBanner = document.getElementById('cookieConsentBanner'); [cite_start]// [cite: 231]
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn'); [cite_start]// [cite: 231]
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn'); [cite_start]// [cite: 232]
    const manageCookiesBtn = document.getElementById('manageCookiesBtn'); [cite_start]// [cite: 232]
    if (acceptAllCookiesBtn) {
        acceptAllCookiesBtn.addEventListener('click', () => {
            [cite_start]localStorage.setItem('cookiesAccepted', 'true'); // [cite: 252]
            localStorage.setItem('cookiePreferencesKey', JSON.stringify({ essential: true, analytics: true, marketing: true })); [cite_start]// [cite: 252]
            hideCookieBanner(); [cite_start]// [cite: 252]
            updateGtagConsent(); [cite_start]// [cite: 252]
            announceStatus('Todos os cookies foram aceitos.'); [cite_start]// [cite: 252]
        });
    }
    if (refuseAllCookiesBtn) {
        refuseAllCookiesBtn.addEventListener('click', refuseAllCookies); [cite_start]// [cite: 253]
    }
    if (manageCookiesBtn) {
        manageCookiesBtn.addEventListener('click', showGranularCookieModal); [cite_start]// [cite: 254]
    }
    if (openGranularCookieModalBtn) {
        openGranularCookieModalBtn.addEventListener('click', showGranularCookieModal); [cite_start]// [cite: 255]
    }

    // Event listeners do formulário de Newsletter
    if (newsletterEmail) {
        newsletterEmail.addEventListener('input', updateSubscribeButtonState); [cite_start]// [cite: 203]
    }
    if (newsletterConsent) {
        newsletterConsent.addEventListener('change', updateSubscribeButtonState); [cite_start]// [cite: 204]
    }
    if (newsletterForm) {
        [cite_start]newsletterForm.addEventListener('submit', async function(event) { // [cite: 205]
            event.preventDefault(); [cite_start]// [cite: 205]
            // ... (lógica de submit do formulário)
        });
    }

    // --- Lógica de Navegação e Responsividade ---
    // (Cole aqui a lógica de: Submenu Toggle PWA, Hamburger Menu, PWA/Desktop Mode Toggle, etc.)
    // ...


    // --- Inicialização ---

    applySavedSettings(); // Aplica quaisquer configurações de acessibilidade salvas.
    
    // Inicializa a exibição do banner de cookies
    if (cookieConsentBanner) {
        showCookieBanner(); [cite_start]// [cite: 260]
        updateGtagConsent(); [cite_start]// [cite: 260]
    }
    
    // Inicializa o estado do formulário da newsletter
    updateSubscribeButtonState();
    
    // Lógica de responsividade
    togglePWAModeElements();
    adjustTitleBarWidth();
    window.addEventListener('resize', () => {
        [cite_start]togglePWAModeElements(); // [cite: 305]
        adjustTitleBarWidth(); [cite_start]// [cite: 305]
    });

    // Inicializa o Widget VLibras, se o script estiver carregado no HTML
    if (typeof VLibras !== 'undefined') {
        new VLibras.Widget('https://vlibras.gov.br/app'); [cite_start]// [cite: 260]
    }

    // Registro do Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            [cite_start]navigator.serviceWorker.register('/service-worker.js') // [cite: 261]
                .then(registration => {
                    [cite_start]console.log('ServiceWorker registration successful with scope: ', registration.scope); // [cite: 261]
                })
                .catch(err => {
                    [cite_start]console.log('ServiceWorker registration failed: ', err); // [cite: 262]
                });
        });
    }
});
