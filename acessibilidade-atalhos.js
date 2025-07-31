// acessibilidade-atalhos.js
// Este arquivo contém todo o JavaScript para a barra de acessibilidade,
// modais (personalizado, cookies, atalhos de teclado) e VLibras.
// Ele deve ser incluído no final do <body> de suas páginas, antes da tag </body>.

document.addEventListener('DOMContentLoaded', function() {
    // --- Referências de Elementos ---
    const body = document.body;
    const statusMessageDiv = document.getElementById('statusMessage'); // ARIA Live Region

    // Elementos da barra de acessibilidade desktop
    const desktopAcessibilidadeBar = document.getElementById('barraAcessibilidade');
    const fontSizeText = document.getElementById('fontSizeText');
    const lineHeightText = document.getElementById('lineHeightText');
    const letterSpacingText = document.getElementById('letterSpacingText');
    const readingSpeedText = document.getElementById('readingSpeedText');
    const toggleLeituraBtn = document.getElementById('btnToggleLeitura');
    const btnAlternarContraste = document.getElementById('btnAlternarContraste');
    const btnAlternarModoEscuro = document.getElementById('btnAlternarModoEscuro');
    const btnAlternarFonteDislexia = document.getElementById('btnAlternarFonteDislexia');
    const btnKeyboardShortcuts = document.getElementById('btnKeyboardShortcuts');
    const btnResetarAcessibilidade = document.getElementById('btnResetarAcessibilidade');

    // Elementos da barra de acessibilidade PWA/Mobile
    const accessibilityToggleButton = document.getElementById('accessibilityToggleButton');
    const pwaAcessibilidadeBar = document.getElementById('pwaAcessibilidadeBar');
    const fontSizeTextPWA = document.getElementById('fontSizeTextPWA');
    const lineHeightTextPWA = document.getElementById('lineHeightTextPWA');
    const letterSpacingTextPWA = document.getElementById('letterSpacingTextPWA');
    const readingSpeedTextPWA = document.getElementById('readingSpeedTextPWA');
    const toggleLeituraBtnPWA = document.getElementById('btnToggleLeituraPWA');
    const btnAlternarContrastePWA = document.getElementById('btnAlternarContrastePWA');
    const btnAlternarModoEscuroPWA = document.getElementById('btnAlternarModoEscuroPWA');
    const btnAlternarFonteDislexiaPWA = document.getElementById('btnAlternarFonteDislexiaPWA');
    const btnKeyboardShortcutsPWA = document.getElementById('btnKeyboardShortcutsPWA');
    const btnResetarAcessibilidadePWA = document.getElementById('btnResetarAcessibilidadePWA');

    // Elementos do menu de navegação (para PWA/Mobile)
    const hamburgerButton = document.getElementById('hamburgerButton');
    const offCanvasMenu = document.getElementById('offCanvasMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const desktopNav = document.querySelector('.desktop-nav'); // A navegação desktop principal

    // Elementos do modal de mensagem personalizado
    const customModal = document.getElementById('customModal');
    const modalMessage = document.getElementById('modalMessage');
    const modalMessageTitle = document.getElementById('modalMessageTitle');
    const modalCloseButton = document.getElementById('modalCloseButton');

    // Elementos do modal de consentimento de cookies granular
    const granularCookieModal = document.getElementById('granularCookieModal');
    const granularModalCloseButton = document.getElementById('granularModalCloseButton');
    const saveGranularPreferencesBtn = document.getElementById('saveGranularPreferencesBtn');
    const cancelGranularPreferencesBtn = document.getElementById('cancelGranularPreferencesBtn');
    const cookieAnalyticsCheckbox = document.getElementById('cookieAnalytics');
    const cookieMarketingCheckbox = document.getElementById('cookieMarketing');

    // Elementos do modal de atalhos de teclado
    const keyboardShortcutsModal = document.getElementById('keyboardShortcutsModal');
    const keyboardModalCloseButton = document.getElementById('keyboardModalCloseButton');

    // Botão "Voltar ao Topo"
    const backToTopBtn = document.getElementById('backToTopBtn');

    // --- Variáveis de Estado ---
    let currentFontSize = 1; // 1 = normal, 2 = médio, 3 = grande, 4 = extra grande, 5 = máximo
    let currentLineHeight = 1; // 1 = médio, 2 = grande, 3 = extra grande
    let currentLetterSpacing = 1; // 1 = normal, 2 = médio, 3 = grande
    let currentReadingSpeed = 1; // 1 = normal, 2 = lento, 3 = rápido
    let speechSynthesizer = window.speechSynthesis;
    let utterance = null;
    let isReading = false;
    let currentFocusColor = localStorage.getItem('focusColor') || 'yellow';
    let lastFocusedElement = null; // Para armazenar o elemento que abriu o modal

    // --- Funções de Acessibilidade ---

    /**
     * Anuncia uma mensagem usando a região ARIA live.
     * @param {string} message - A mensagem a ser anunciada.
     */
    function announceStatus(message) {
        if (statusMessageDiv) {
            statusMessageDiv.textContent = message;
        }
    }

    /**
     * Aplica as configurações de acessibilidade salvas no localStorage ao carregar a página.
     */
    function applySavedSettings() {
        const savedFontSize = localStorage.getItem('fontSize');
        if (savedFontSize) {
            currentFontSize = parseInt(savedFontSize);
            updateFontSize(false);
        }

        const savedLineHeight = localStorage.getItem('lineHeight');
        if (savedLineHeight) {
            currentLineHeight = parseInt(savedLineHeight);
            updateLineHeight(false);
        }

        const savedLetterSpacing = localStorage.getItem('letterSpacing');
        if (savedLetterSpacing) {
            currentLetterSpacing = parseInt(savedLetterSpacing);
            updateLetterSpacing(false);
        }

        const savedReadingSpeed = localStorage.getItem('readingSpeed');
        if (savedReadingSpeed) {
            currentReadingSpeed = parseInt(savedReadingSpeed);
            updateReadingSpeed(false);
        }

        if (localStorage.getItem('contrasteAlto') === 'true') {
            body.classList.add('contraste-alto');
            if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', 'true');
            if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', 'true');
        }

        if (localStorage.getItem('darkMode') === 'true') {
            body.classList.add('dark-mode');
            if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', 'true');
            if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', 'true');
        }

        if (localStorage.getItem('fonteDislexia') === 'true') {
            body.classList.add('fonte-dislexia');
        }

        const savedFocusColor = localStorage.getItem('focusColor');
        if (savedFocusColor) {
            currentFocusColor = savedFocusColor;
            document.documentElement.style.setProperty('--cor-foco-acessibilidade', currentFocusColor);
            updateFocusColorButtons(currentFocusColor);
        }
    }

    /**
     * Atualiza o tamanho da fonte do corpo e salva a configuração.
     * @param {boolean} announce - Se deve anunciar a mudança via região ARIA live.
     */
    function updateFontSize(announce = true) {
        let message = '';
        switch (currentFontSize) {
            case 1:
                body.style.fontSize = '1em';
                if (fontSizeText) fontSizeText.textContent = 'Normal';
                if (fontSizeTextPWA) fontSizeTextPWA.textContent = 'Normal';
                message = 'Tamanho da fonte normal (100%).';
                break;
            case 2:
                body.style.fontSize = '1.15em';
                if (fontSizeText) fontSizeText.textContent = 'Médio';
                if (fontSizeTextPWA) fontSizeTextPWA.textContent = 'Médio';
                message = 'Tamanho da fonte médio (115%).';
                break;
            case 3:
                body.style.fontSize = '1.3em';
                if (fontSizeText) fontSizeText.textContent = 'Grande';
                if (fontSizeTextPWA) fontSizeTextPWA.textContent = 'Grande';
                message = 'Tamanho da fonte grande (130%).';
                break;
            case 4:
                body.style.fontSize = '1.5em';
                if (fontSizeText) fontSizeText.textContent = 'Extra Grande';
                if (fontSizeTextPWA) fontSizeTextPWA.textContent = 'Extra Grande';
                message = 'Tamanho da fonte extra grande (150%).';
                break;
            case 5:
                body.style.fontSize = '2em';
                if (fontSizeText) fontSizeText.textContent = 'Máximo';
                if (fontSizeTextPWA) fontSizeTextPWA.textContent = 'Máximo';
                message = 'Tamanho da fonte máximo (200%).';
                break;
        }
        localStorage.setItem('fontSize', currentFontSize);
        if (announce) announceStatus(message);
    }

    /** Alterna entre diferentes tamanhos de fonte. */
    function alternarTamanhoFonte() {
        currentFontSize = (currentFontSize % 5) + 1;
        updateFontSize();
    }

    /**
     * Atualiza o espaçamento de linha do corpo e salva a configuração.
     * @param {boolean} announce - Se deve anunciar a mudança via região ARIA live.
     */
    function updateLineHeight(announce = true) {
        let message = '';
        switch (currentLineHeight) {
            case 1:
                document.documentElement.style.setProperty('--espacamento-linha', '1.5');
                if (lineHeightText) lineHeightText.textContent = 'Médio';
                if (lineHeightTextPWA) lineHeightTextPWA.textContent = 'Médio';
                message = 'Espaçamento de linha médio.';
                break;
            case 2:
                document.documentElement.style.setProperty('--espacamento-linha', '1.8');
                if (lineHeightText) lineHeightText.textContent = 'Grande';
                if (lineHeightTextPWA) lineHeightTextPWA.textContent = 'Grande';
                message = 'Espaçamento de linha grande.';
                break;
            case 3:
                document.documentElement.style.setProperty('--espacamento-linha', '2.0');
                if (lineHeightText) lineHeightText.textContent = 'Extra Grande';
                if (lineHeightTextPWA) lineHeightTextPWA.textContent = 'Extra Grande';
                message = 'Espaçamento de linha extra grande.';
                break;
        }
        localStorage.setItem('lineHeight', currentLineHeight);
        if (announce) announceStatus(message);
    }

    /** Alterna entre diferentes espaçamentos de linha. */
    function alternarEspacamentoLinha() {
        currentLineHeight = (currentLineHeight % 3) + 1;
        updateLineHeight();
    }

    /**
     * Atualiza o espaçamento de letra do corpo e salva a configuração.
     * @param {boolean} announce - Se deve anunciar a mudança via região ARIA live.
     */
    function updateLetterSpacing(announce = true) {
        let message = '';
        switch (currentLetterSpacing) {
            case 1:
                document.documentElement.style.setProperty('--espacamento-letra', '0em');
                if (letterSpacingText) letterSpacingText.textContent = 'Normal';
                if (letterSpacingTextPWA) letterSpacingTextPWA.textContent = 'Normal';
                message = 'Espaçamento de letra normal.';
                break;
            case 2:
                document.documentElement.style.setProperty('--espacamento-letra', '0.05em');
                if (letterSpacingText) letterSpacingText.textContent = 'Médio';
                if (letterSpacingTextPWA) letterSpacingTextPWA.textContent = 'Médio';
                message = 'Espaçamento de letra médio.';
                break;
            case 3:
                document.documentElement.style.setProperty('--espacamento-letra', '0.1em');
                if (letterSpacingText) letterSpacingText.textContent = 'Grande';
                if (letterSpacingTextPWA) letterSpacingTextPWA.textContent = 'Grande';
                message = 'Espaçamento de letra grande.';
                break;
        }
        localStorage.setItem('letterSpacing', currentLetterSpacing);
        if (announce) announceStatus(message);
    }

    /** Alterna entre diferentes espaçamentos de letra. */
    function alternarEspacamentoLetra() {
        currentLetterSpacing = (currentLetterSpacing % 3) + 1;
        updateLetterSpacing();
        if (isReading) { // Se estiver lendo, reinicia com a nova velocidade
            reiniciarLeitura();
        }
    }

    /**
     * Atualiza a velocidade de leitura e salva a configuração.
     * @param {boolean} announce - Se deve anunciar a mudança via região ARIA live.
     */
    function updateReadingSpeed(announce = true) {
        let rate = 1;
        let message = '';
        switch (currentReadingSpeed) {
            case 1:
                rate = 1;
                if (readingSpeedText) readingSpeedText.textContent = 'Normal';
                if (readingSpeedTextPWA) readingSpeedTextPWA.textContent = 'Normal';
                message = 'Velocidade de leitura normal.';
                break;
            case 2:
                rate = 0.75;
                if (readingSpeedText) readingSpeedText.textContent = 'Lento';
                if (readingSpeedTextPWA) readingSpeedTextPWA.textContent = 'Lento';
                message = 'Velocidade de leitura lenta.';
                break;
            case 3:
                rate = 1.25;
                if (readingSpeedText) readingSpeedText.textContent = 'Rápido';
                if (readingSpeedTextPWA) readingSpeedTextPWA.textContent = 'Rápido';
                message = 'Velocidade de leitura rápida.';
                break;
        }
        if (utterance) {
            utterance.rate = rate;
        }
        localStorage.setItem('readingSpeed', currentReadingSpeed);
        if (announce) announceStatus(message);
    }

    /** Alterna entre diferentes velocidades de leitura. */
    function alternarVelocidadeLeitura() {
        currentReadingSpeed = (currentReadingSpeed % 3) + 1;
        updateReadingSpeed();
        if (isReading) { // Se estiver lendo, reinicia com a nova velocidade
            reiniciarLeitura();
        }
    }

    /** Alterna a leitura de texto para voz do conteúdo principal. */
    function toggleLeitura() {
        if (!speechSynthesizer) {
            announceStatus('Seu navegador não suporta leitura de texto.');
            return;
        }

        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            announceStatus('Conteúdo principal para leitura não encontrado.');
            return;
        }

        if (isReading) {
            speechSynthesizer.pause();
            isReading = false;
            if (toggleLeituraBtn) toggleLeituraBtn.setAttribute('aria-label', 'Reproduzir leitura do conteúdo principal');
            if (toggleLeituraBtnPWA) toggleLeituraBtnPWA.setAttribute('aria-label', 'Reproduzir leitura do conteúdo principal');
            announceStatus('Leitura pausada.');
        } else {
            if (speechSynthesizer.paused) {
                speechSynthesizer.resume();
                announceStatus('Leitura retomada.');
            } else {
                speechSynthesizer.cancel();
                const textToRead = mainContent.innerText;
                utterance = new SpeechSynthesisUtterance(textToRead);
                updateReadingSpeed(false); // Aplica a velocidade atual à nova fala
                speechSynthesizer.speak(utterance);
                announceStatus('Leitura iniciada.');

                utterance.onend = () => {
                    isReading = false;
                    if (toggleLeituraBtn) toggleLeituraBtn.setAttribute('aria-label', 'Reproduzir leitura do conteúdo principal');
                    if (toggleLeituraBtnPWA) toggleLeituraBtnPWA.setAttribute('aria-label', 'Reproduzir leitura do conteúdo principal');
                    announceStatus('Leitura concluída.');
                };
                utterance.onerror = (event) => {
                    console.error('Erro na síntese de fala:', event.error);
                    announceStatus('Erro na leitura: ' + event.error);
                    isReading = false;
                    if (toggleLeituraBtn) toggleLeituraBtn.setAttribute('aria-label', 'Reproduzir leitura do conteúdo principal');
                    if (toggleLeituraBtnPWA) toggleLeituraBtnPWA.setAttribute('aria-label', 'Reproduzir leitura do conteúdo principal');
                };
            }
            isReading = true;
            if (toggleLeituraBtn) toggleLeituraBtn.setAttribute('aria-label', 'Pausar leitura do conteúdo principal');
            if (toggleLeituraBtnPWA) toggleLeituraBtnPWA.setAttribute('aria-label', 'Pausar leitura do conteúdo principal');
        }
    }

    /** Reinicia a leitura de texto para voz do início do conteúdo principal. */
    function reiniciarLeitura() {
        if (!speechSynthesizer) {
            announceStatus('Seu navegador não suporta leitura de texto.');
            return;
        }
        speechSynthesizer.cancel();
        isReading = false;
        toggleLeitura();
        announceStatus('Leitura reiniciada.');
    }

    /** Lê o elemento atualmente focado. */
    function readFocusedElement() {
        if (!speechSynthesizer) {
            announceStatus('Seu navegador não suporta leitura de texto.');
            return;
        }
        const focusedElement = document.activeElement;
        if (focusedElement) {
            let textToRead = focusedElement.ariaLabel || focusedElement.innerText || focusedElement.value || focusedElement.placeholder;
            // Se for um input e tiver uma mensagem de erro associada, lê o erro também
            if (focusedElement.hasAttribute('aria-invalid') && focusedElement.getAttribute('aria-invalid') === 'true') {
                const describedBy = focusedElement.getAttribute('aria-describedby');
                if (describedBy) {
                    const errorElementId = describedBy.split(' ').find(id => document.getElementById(id) && (document.getElementById(id).classList.contains('newsletter-error-message') || document.getElementById(id).classList.contains('text-red-600')));
                    if (errorElementId) {
                        const errorElement = document.getElementById(errorElementId);
                        if (errorElement && errorElement.style.display !== 'none' && errorElement.textContent) {
                            textToRead += `. Erro: ${errorElement.textContent}`;
                        }
                    }
                }
            }
            if (textToRead) {
                speechSynthesizer.cancel();
                utterance = new SpeechSynthesisUtterance(textToRead);
                updateReadingSpeed(false);
                speechSynthesizer.speak(utterance);
                announceStatus('Lendo elemento focado.');
            } else {
                announceStatus('Nenhum texto para ler no elemento focado.');
            }
        } else {
            announceStatus('Nenhum elemento está focado.');
        }
    }

    /** Alterna o modo de alto contraste. */
    function alternarContraste() {
        body.classList.toggle('contraste-alto');
        const isContrasteAlto = body.classList.contains('contraste-alto');
        localStorage.setItem('contrasteAlto', isContrasteAlto);
        if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', isContrasteAlto);
        if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', isContrasteAlto);
        announceStatus(isContrasteAlto ? 'Modo de alto contraste ativado.' : 'Modo de alto contraste desativado.');
    }

    /** Alterna o modo escuro. */
    function alternarModoEscuro() {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', isDarkMode);
        if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', isDarkMode);
        announceStatus(isDarkMode ? 'Modo escuro ativado.' : 'Modo escuro desativado.');
    }

    /** Alterna a fonte amigável para dislexia. */
    function alternarFonteDislexia() {
        body.classList.toggle('fonte-dislexia');
        const isFonteDislexia = body.classList.contains('fonte-dislexia');
        localStorage.setItem('fonteDislexia', isFonteDislexia);
        announceStatus(isFonteDislexia ? 'Fonte para dislexia ativada.' : 'Fonte para dislexia desativada.');
    }

    /**
     * Atualiza a cor de foco selecionada e a aplica.
     * @param {string} color - A cor a ser definida para o contorno de foco.
     */
    function updateFocusColor(color) {
        currentFocusColor = color;
        document.documentElement.style.setProperty('--cor-foco-acessibilidade', currentFocusColor);
        localStorage.setItem('focusColor', color);
        updateFocusColorButtons(color);
        announceStatus(`Cor de foco alterada para ${color}.`);
    }

    /**
     * Atualiza o estado visual dos botões de seleção de cor de foco.
     * @param {string} selectedColor - A cor atualmente selecionada.
     */
    function updateFocusColorButtons(selectedColor) {
        document.querySelectorAll('.color-option').forEach(button => {
            if (button.dataset.color === selectedColor) {
                button.classList.add('selected');
                button.setAttribute('aria-checked', 'true');
            } else {
                button.classList.remove('selected');
                button.setAttribute('aria-checked', 'false');
            }
        });
    }

    /** Redefine todas as configurações de acessibilidade para seus valores padrão. */
    function resetAccessibilitySettings() {
        currentFontSize = 1;
        currentLineHeight = 1;
        currentLetterSpacing = 1;
        currentReadingSpeed = 1;
        currentFocusColor = 'yellow';

        updateFontSize();
        updateLineHeight();
        updateLetterSpacing();
        updateReadingSpeed();
        updateFocusColor(currentFocusColor);

        body.classList.remove('contraste-alto');
        body.classList.remove('dark-mode');
        body.classList.remove('fonte-dislexia');
        localStorage.removeItem('contrasteAlto');
        localStorage.removeItem('darkMode');
        localStorage.removeItem('fonteDislexia');

        if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', 'false');
        if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', 'false');
        if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', 'false');
        if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', 'false');

        announceStatus('Configurações de acessibilidade redefinidas.');
    }

    // --- Lógica do Focus Trap (para modais e menus off-canvas) ---
    let focusedElementBeforeModal;
    let focusableElements;
    let firstFocusableElement;
    let lastFocusableElement;

    function trapFocus(element) {
        focusedElementBeforeModal = document.activeElement;
        focusableElements = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusableElement = focusableElements[0];
        lastFocusableElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', handleTrapFocus);
    }

    function releaseFocus() {
        if (focusedElementBeforeModal) {
            focusedElementBeforeModal.focus();
        }
        document.removeEventListener('keydown', handleTrapFocus);
    }

    function handleTrapFocus(e) {
        const isTabPressed = e.key === 'Tab';
        if (!isTabPressed) {
            return;
        }

        if (e.shiftKey) { // Se Shift + Tab
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
            }
        } else { // Se apenas Tab
            if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus();
                e.preventDefault();
            }
        }
    }

    // --- Funções do Modal de Mensagem Personalizado ---

    /**
     * Exibe um modal personalizado com uma mensagem.
     * @param {string} message - A mensagem a ser exibida no modal.
     * @param {HTMLElement} [triggeringElement=document.activeElement] - O elemento que acionou o modal.
     */
    window.showCustomModal = function(message, triggeringElement = document.activeElement) {
        if (customModal && modalMessage && modalMessageTitle) {
            lastFocusedElement = triggeringElement;
            modalMessage.textContent = message;
            modalMessageTitle.textContent = "Mensagem de Informação";
            customModal.classList.remove('hidden');
            customModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            modalCloseButton.focus();
            announceStatus(`Modal aberto: ${message}`);
            // A armadilha de foco é ativada automaticamente ao focar no modal
        } else {
            console.error('Elementos do Modal Personalizado não encontrados.');
        }
    };

    /** Oculta o modal personalizado. */
    function hideCustomModal() {
        if (customModal) {
            customModal.classList.add('hidden');
            customModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }
            announceStatus('Modal fechado.');
        } else {
            console.error('Elemento do Modal Personalizado não encontrado para ocultar.');
        }
    }

    // --- Lógica do Cookie Consent Banner ---
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn');
    const manageCookiesBtn = document.getElementById('manageCookiesBtn');

    const cookiesAcceptedKey = 'cookiesAccepted';
    const cookiePreferencesKey = 'cookiePreferences';

    /** Exibe o banner de consentimento de cookies se nenhuma escolha foi feita. */
    function showCookieBanner() {
        if (localStorage.getItem(cookiesAcceptedKey) === null) {
            cookieConsentBanner.classList.add('show');
        }
    }

    /** Oculta o banner de consentimento de cookies. */
    function hideCookieBanner() {
        cookieConsentBanner.classList.remove('show');
    }

    /** Atualiza o consentimento do gtag com base nas preferências salvas. */
    function updateGtagConsent() {
        const preferences = JSON.parse(localStorage.getItem(cookiePreferencesKey)) || {};
        const analyticsStorage = preferences.analytics === true ? 'granted' : 'denied';
        const adStorage = preferences.marketing === true ? 'granted' : 'denied';

        gtag('consent', 'update', {
            'analytics_storage': analyticsStorage,
            'ad_storage': adStorage
        });
    }

    /** Carrega as preferências granulares de cookies nos checkboxes do modal. */
    function loadGranularPreferences() {
        const preferences = JSON.parse(localStorage.getItem(cookiePreferencesKey)) || {};
        cookieAnalyticsCheckbox.checked = preferences.analytics === true;
        cookieMarketingCheckbox.checked = preferences.marketing === true;
    }

    /** Salva as preferências granulares de cookies. */
    function saveGranularPreferences() {
        const preferences = {
            essential: true,
            analytics: cookieAnalyticsCheckbox.checked,
            marketing: cookieMarketingCheckbox.checked
        };
        localStorage.setItem(cookiePreferencesKey, JSON.stringify(preferences));
        localStorage.setItem(cookiesAcceptedKey, 'true'); // Marca que uma escolha foi feita
        updateGtagConsent();
        hideGranularCookieModal();
        announceStatus('Preferências de cookies salvas.');
    }

    /** Exibe o modal de consentimento de cookies granular. */
    function showGranularCookieModal() {
        hideCookieBanner();
        granularCookieModal.classList.add('show');
        granularCookieModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        loadGranularPreferences();
        granularModalCloseButton.focus();
        announceStatus('Modal de configurações de cookies aberto.');
    }

    /** Oculta o modal de consentimento de cookies granular. */
    function hideGranularCookieModal() {
        granularCookieModal.classList.remove('show');
        granularCookieModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (localStorage.getItem(cookiesAcceptedKey) === null) {
            showCookieBanner();
        }
        announceStatus('Modal de configurações de cookies fechado.');
    }

    /** Recusa todos os cookies não essenciais. */
    function refuseAllCookies() {
        localStorage.setItem(cookiesAcceptedKey, 'false');
        localStorage.setItem(cookiePreferencesKey, JSON.stringify({ essential: true, analytics: false, marketing: false }));
        updateGtagConsent();
        hideCookieBanner();
        announceStatus('Todos os cookies não essenciais foram recusados.');
    }

    // --- Lógica do Modal de Atalhos de Teclado ---

    /** Exibe o modal de atalhos de teclado. */
    function showKeyboardShortcutsModal() {
        keyboardShortcutsModal.classList.remove('hidden');
        lastFocusedElement = document.activeElement;
        const focusableElements = keyboardShortcutsModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
        keyboardShortcutsModal.addEventListener('keydown', trapFocus); // Reutiliza a função trapFocus
        announceStatus('Modal de atalhos de teclado aberto.');
    }

    /** Oculta o modal de atalhos de teclado. */
    function hideKeyboardShortcutsModal() {
        keyboardShortcutsModal.classList.add('hidden');
        keyboardShortcutsModal.removeEventListener('keydown', trapFocus);
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
        announceStatus('Modal de atalhos de teclado fechado.');
    }

    // --- Inicialização e Event Listeners ---

    // Define o foco inicial no primeiro skip link
    setTimeout(() => {
        const firstSkipLink = document.querySelector('nav[aria-label="Atalhos de Acessibilidade"] a');
        if (firstSkipLink) {
            firstSkipLink.focus();
        }
    }, 100);

    // Lógica para alternar visibilidade de elementos PWA/Desktop
    function isPWAOrSmallScreen() {
        return window.matchMedia('(display-mode: standalone)').matches || window.innerWidth <= 768;
    }

    function togglePWAModeElements() {
        const vlibrasWidgetButton = document.querySelector('.vw-access-button');

        if (isPWAOrSmallScreen()) {
            if (hamburgerButton) hamburgerButton.classList.remove('pwa-only');
            if (offCanvasMenu) offCanvasMenu.classList.remove('pwa-only');
            if (menuOverlay) menuOverlay.classList.remove('pwa-only');
            if (pwaAcessibilidadeBar) pwaAcessibilidadeBar.classList.remove('pwa-only');

            if (vlibrasWidgetButton) vlibrasWidgetButton.style.display = 'flex';

            if (desktopNav) desktopNav.classList.add('desktop-only');
            if (desktopAcessibilidadeBar) desktopAcessibilidadeBar.classList.add('desktop-only');
        } else {
            if (hamburgerButton) hamburgerButton.classList.add('pwa-only');
            if (offCanvasMenu) offCanvasMenu.classList.add('pwa-only');
            if (menuOverlay) menuOverlay.classList.add('pwa-only');
            if (desktopNav) desktopNav.classList.remove('desktop-only');
            if (desktopAcessibilidadeBar) desktopAcessibilidadeBar.classList.remove('desktop-only');

            if (pwaAcessibilidadeBar) pwaAcessibilidadeBar.classList.add('pwa-only');

            if (vlibrasWidgetButton) vlibrasWidgetButton.style.display = 'none';

            if (offCanvasMenu) offCanvasMenu.classList.remove('is-open');
            if (menuOverlay) menuOverlay.classList.remove('is-open');
            if (pwaAcessibilidadeBar) pwaAcessibilidadeBar.classList.remove('is-open');
        }
    }

    // Lógica do menu hambúrguer (PWA/Mobile)
    if (hamburgerButton && offCanvasMenu && menuOverlay) {
        hamburgerButton.addEventListener('click', () => {
            offCanvasMenu.classList.toggle('is-open');
            menuOverlay.classList.toggle('is-open');
            if (offCanvasMenu.classList.contains('is-open')) {
                const firstFocusable = offCanvasMenu.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
                trapFocus(offCanvasMenu);
            } else {
                releaseFocus();
            }
            if (pwaAcessibilidadeBar && pwaAcessibilidadeBar.classList.contains('is-open')) {
                pwaAcessibilidadeBar.classList.remove('is-open');
                accessibilityToggleButton.setAttribute('aria-expanded', 'false');
            }
        });

        menuOverlay.addEventListener('click', () => {
            offCanvasMenu.classList.remove('is-open');
            menuOverlay.classList.remove('is-open');
            releaseFocus();
        });

        // Adiciona listeners para toggles de submenu mobile
        document.querySelectorAll('#offCanvasMenu [data-submenu-toggle]').forEach(toggleBtn => {
            toggleBtn.addEventListener('click', handleSubmenuToggle);
        });

        offCanvasMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                offCanvasMenu.classList.remove('is-open');
                menuOverlay.classList.remove('is-open');
                releaseFocus();
            });
        });
    }

    // Lógica do botão de alternância de acessibilidade (PWA/Mobile)
    if (accessibilityToggleButton && pwaAcessibilidadeBar && menuOverlay) {
        accessibilityToggleButton.addEventListener('click', () => {
            pwaAcessibilidadeBar.classList.toggle('is-open');
            const isOpen = pwaAcessibilidadeBar.classList.contains('is-open');
            accessibilityToggleButton.setAttribute('aria-expanded', isOpen);

            if (isOpen) {
                menuOverlay.classList.add('is-open');
                const firstFocusable = pwaAcessibilidadeBar.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
                trapFocus(pwaAcessibilidadeBar);
                if (offCanvasMenu && offCanvasMenu.classList.contains('is-open')) {
                    offCanvasMenu.classList.remove('is-open');
                }
            } else {
                menuOverlay.classList.remove('is-open');
                releaseFocus();
            }
        });

        menuOverlay.addEventListener('click', (e) => {
            if (pwaAcessibilidadeBar.classList.contains('is-open') &&
                !pwaAcessibilidadeBar.contains(e.target)) {
                pwaAcessibilidadeBar.classList.remove('is-open');
                accessibilityToggleButton.setAttribute('aria-expanded', 'false');
                menuOverlay.classList.remove('is-open');
                releaseFocus();
            }
        });
    }

    // Lógica para alternar submenus (desktop e mobile)
    function handleSubmenuToggle(event) {
        event.preventDefault();
        const toggleBtn = event.currentTarget;
        const submenuId = toggleBtn.dataset.submenuToggle;
        const submenu = document.getElementById(`submenu-${submenuId}`);
        if (submenu) {
            const isHidden = submenu.classList.contains('hidden');
            const parentUl = toggleBtn.closest('ul');
            if (parentUl) {
                parentUl.querySelectorAll('[data-submenu-toggle]').forEach(otherToggle => {
                    if (otherToggle !== toggleBtn) {
                        const otherSubmenu = document.getElementById(`submenu-${otherToggle.dataset.submenuToggle}`);
                        if (otherSubmenu && !otherSubmenu.classList.contains('hidden')) {
                            otherSubmenu.classList.add('hidden');
                            otherToggle.setAttribute('aria-expanded', 'false');
                            const icon = otherToggle.querySelector('svg, i');
                            if (icon) {
                                icon.classList.remove('fa-chevron-down');
                                icon.classList.add('fa-chevron-right');
                                if (icon.tagName === 'SVG') icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>';
                            }
                        }
                    }
                });
            }

            submenu.classList.toggle('hidden');
            const isExpanded = !submenu.classList.contains('hidden');
            toggleBtn.setAttribute('aria-expanded', isExpanded);

            const icon = toggleBtn.querySelector('svg, i');
            if (icon) {
                if (isExpanded) {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                    if (icon.tagName === 'SVG') icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
                } else {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                    if (icon.tagName === 'SVG') icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>';
                }
            }
        }
    }

    // Adiciona listeners para toggles de submenu desktop
    document.querySelectorAll('.desktop-nav [data-submenu-toggle]').forEach(toggleBtn => {
        toggleBtn.addEventListener('click', handleSubmenuToggle);
    });

    // Ajusta a largura da barra abaixo do título principal (se existirem)
    const mainTitle = document.getElementById('main-title');
    const titleBar = document.querySelector('.title-bar');

    function adjustTitleBarWidth() {
        if (mainTitle && titleBar) {
            const titleWidth = mainTitle.offsetWidth;
            titleBar.style.width = `${titleWidth}px`;
        }
    }

    window.addEventListener('resize', () => {
        togglePWAModeElements();
        adjustTitleBarWidth();
    });

    togglePWAModeElements();
    adjustTitleBarWidth();

    // Event Listeners para os botões da barra de acessibilidade (Desktop)
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
    document.querySelectorAll('#barraAcessibilidade .color-option').forEach(button => {
        button.addEventListener('click', () => updateFocusColor(button.dataset.color));
    });
    document.getElementById('btnKeyboardShortcuts')?.addEventListener('click', showKeyboardShortcutsModal);
    document.getElementById('btnResetarAcessibilidade')?.addEventListener('click', resetAccessibilitySettings);

    // Event Listeners para os botões da barra de acessibilidade (PWA/Mobile)
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
    document.querySelectorAll('#pwaAcessibilidadeBar .color-option').forEach(button => {
        button.addEventListener('click', () => updateFocusColor(button.dataset.color));
    });
    document.getElementById('btnKeyboardShortcutsPWA')?.addEventListener('click', showKeyboardShortcutsModal);
    document.getElementById('btnResetarAcessibilidadePWA')?.addEventListener('click', resetAccessibilitySettings);

    // Lógica de alternância de submenu para a barra de acessibilidade PWA
    document.querySelectorAll('.pwa-submenu-header').forEach(header => {
        header.addEventListener('click', function() {
            const submenuContent = this.nextElementSibling;
            const icon = this.querySelector('i');
            const isOpen = submenuContent.classList.contains('is-open');

            document.querySelectorAll('.pwa-submenu-content.is-open').forEach(openSubmenu => {
                if (openSubmenu !== submenuContent) {
                    openSubmenu.classList.remove('is-open');
                    openSubmenu.previousElementSibling.querySelector('i').classList.replace('fa-chevron-down', 'fa-chevron-right');
                    openSubmenu.previousElementSibling.setAttribute('aria-expanded', 'false');
                }
            });

            submenuContent.classList.toggle('is-open');
            if (isOpen) {
                icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
                this.setAttribute('aria-expanded', 'true');
            } else {
                icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
                this.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Lógica do botão "Voltar ao Topo"
    window.addEventListener('scroll', () => {
        if (backToTopBtn) {
            if (window.scrollY > 200) {
                backToTopBtn.style.display = 'block';
            } else {
                backToTopBtn.style.display = 'none';
            }
        }
    });
    backToTopBtn?.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Aplica as configurações salvas na inicialização
    applySavedSettings();

    // Event Listeners para o modal de mensagem personalizado
    modalCloseButton?.addEventListener('click', hideCustomModal);
    customModal?.addEventListener('click', (e) => {
        if (e.target === customModal) {
            hideCustomModal();
        }
    });

    // Event Listeners para o modal de atalhos de teclado
    keyboardModalCloseButton?.addEventListener('click', hideKeyboardShortcutsModal);
    keyboardShortcutsModal?.addEventListener('click', (e) => {
        if (e.target === keyboardShortcutsModal) {
            hideKeyboardShortcutsModal();
        }
    });

    // Lógica do Cookie Consent Banner
    const cookiesAcceptedKey = 'cookiesAccepted';
    const cookiePreferencesKey = 'cookiePreferences';

    // Event Listeners para os botões do banner de cookies
    acceptAllCookiesBtn?.addEventListener('click', () => {
        localStorage.setItem(cookiesAcceptedKey, 'true');
        localStorage.setItem(cookiePreferencesKey, JSON.stringify({ essential: true, analytics: true, marketing: true }));
        hideCookieBanner();
        gtag('consent', 'update', { 'analytics_storage': 'granted', 'ad_storage': 'granted' });
        announceStatus('Todos os cookies foram aceitos.');
    });

    refuseAllCookiesBtn?.addEventListener('click', refuseAllCookies);

    manageCookiesBtn?.addEventListener('click', showGranularCookieModal);

    granularModalCloseButton?.addEventListener('click', hideGranularCookieModal);
    saveGranularPreferencesBtn?.addEventListener('click', saveGranularPreferences);
    cancelGranularPreferencesBtn?.addEventListener('click', hideGranularCookieModal);

    // Inicializa o banner de cookies e o consentimento do gtag
    showCookieBanner();
    updateGtagConsent();

    // VLibras widget initialization
    new VLibras.Widget('https://vlibras.gov.br/app');

    // Service Worker registration (se você tiver um service worker)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
});
