// global-scripts.js
// Este arquivo contém todo o JavaScript para a barra de acessibilidade,
// modais (personalizado, cookies, atalhos de teclado) e VLibras,
// além da lógica de navegação e responsividade global, e o formulário de newsletter.

document.addEventListener('DOMContentLoaded', function() {
    // --- Referências de Elementos Globais ---
    const body = document.body;
    const statusMessageDiv = document.getElementById('statusMessage'); // Região ARIA Live para anúncios

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
    const btnReadFocused = document.getElementById('btnReadFocused');


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
    const btnReadFocusedPWA = document.getElementById('btnReadFocusedPWA');


    // Elementos do menu de navegação (para PWA/Mobile)
    const hamburgerButton = document.getElementById('hamburgerButton');
    const offCanvasMenu = document.getElementById('offCanvasMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const desktopNav = document.querySelector('.desktop-nav'); // A navegação desktop principal

    // Elementos do modal de mensagem personalizado (showCustomModal)
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
    const openGranularCookieModalBtn = document.getElementById('openGranularCookieModalBtn'); // Botão no rodapé

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
            if (toggleLeituraBtn) {
                toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraText">Reproduzir Leitura</span>';
            }
            if (toggleLeituraBtnPWA) {
                toggleLeituraBtnPWA.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraTextPWA">Reproduzir Leitura</span>';
            }
            announceStatus('Leitura pausada.');
        } else {
            if (speechSynthesizer.paused && utterance) {
                speechSynthesizer.resume();
                announceStatus('Leitura retomada.');
            } else {
                // Cancel any ongoing speech before starting a new one
                if (speechSynthesizer.speaking) {
                    speechSynthesizer.cancel();
                }
                const textToRead = mainContent.innerText;
                utterance = new SpeechSynthesisUtterance(textToRead);
                utterance.lang = 'pt-BR';
                utterance.rate = currentReadingSpeed === 1 ? 1 : (currentReadingSpeed === 2 ? 0.75 : 1.25); // Apply saved speed
                utterance.onend = () => {
                    isReading = false;
                    if (toggleLeituraBtn) {
                        toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraText">Reproduzir Leitura</span>';
                    }
                    if (toggleLeituraBtnPWA) {
                        toggleLeituraBtnPWA.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraTextPWA">Reproduzir Leitura</span>';
                    }
                    announceStatus('Leitura concluída.');
                };
                speechSynthesizer.speak(utterance);
                announceStatus('Leitura iniciada.');
            }
            isReading = true;
            if (toggleLeituraBtn) {
                toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span class="sr-only" id="toggleLeituraText">Pausar Leitura</span>';
            }
            if (toggleLeituraBtnPWA) {
                toggleLeituraBtnPWA.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span class="sr-only" id="toggleLeituraTextPWA">Pausar Leitura</span>';
            }
        }
    }

    /**
     * Restarts text-to-speech reading from the beginning.
     */
    function reiniciarLeitura() {
        if (speechSynthesizer.speaking) {
            speechSynthesizer.cancel();
        }
        isReading = false;
        announceStatus('Leitura reiniciada.');
        toggleLeitura(); // Start reading from the beginning
    }

    /**
     * Reads the text content of the currently focused element.
     */
    function readFocusedElement() {
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement.innerText) {
            // Cancel any ongoing speech before starting a new one
            if (speechSynthesizer.speaking) {
                speechSynthesizer.cancel();
            }
            const textToRead = focusedElement.innerText;
            const focusedUtterance = new SpeechSynthesisUtterance(textToRead);
            focusedUtterance.lang = 'pt-BR';
            focusedUtterance.rate = currentReadingSpeed === 1 ? 1 : (currentReadingSpeed === 2 ? 0.75 : 1.25);
            speechSynthesizer.speak(focusedUtterance);
            announceStatus(`Lendo: ${textToRead.substring(0, 50)}...`); // Announce first 50 chars
        } else {
            announceStatus('Nenhum elemento focado com texto para ler.');
        }
    }

    /**
     * Toggles high contrast mode.
     */
    function alternarContraste() {
        body.classList.toggle('contraste-alto');
        const isActive = body.classList.contains('contraste-alto');
        localStorage.setItem('contrasteAlto', isActive);
        if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', isActive);
        if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', isActive);
        announceStatus(`Modo de alto contraste ${isActive ? 'ativado' : 'desativado'}.`);
    }

    /**
     * Toggles dark mode.
     */
    function alternarModoEscuro() {
        body.classList.toggle('dark-mode');
        const isActive = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isActive);
        if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', isActive);
        if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', isActive);
        announceStatus(`Modo escuro ${isActive ? 'ativado' : 'desativado'}.`);
    }

    /**
     * Toggles OpenDyslexic font.
     */
    function alternarFonteDislexia() {
        body.classList.toggle('fonte-dislexia');
        const isActive = body.classList.contains('fonte-dislexia');
        localStorage.setItem('fonteDislexia', isActive);
        announceStatus(`Fonte para dislexia ${isActive ? 'ativada' : 'desativada'}.`);
    }

    /**
      * Sets the accessibility focus color.
     * @param {string} color - The color to set (e.g., 'yellow', 'lime').
     */
    function definirCorFoco(color) {
        currentFocusColor = color;
        document.documentElement.style.setProperty('--cor-foco-acessibilidade', currentFocusColor);
        localStorage.setItem('focusColor', color);
        updateFocusColorButtons(currentFocusColor);
        announceStatus(`Cor de foco de acessibilidade alterada para ${color}.`);
    }

    /**
     * Updates the visual state of the focus color selection buttons.
     * @param {string} selectedColor - The currently selected color.
     */
    function updateFocusColorButtons(selectedColor) {
        document.querySelectorAll('#barraAcessibilidade .color-option').forEach(button => {
            if (button.dataset.color === selectedColor) { // Use dataset.color
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
        // Also update buttons in PWA accessibility bar if they exist
        document.querySelectorAll('#pwaAcessibilidadeBar .color-option').forEach(button => {
            if (button.dataset.color === selectedColor) { // Use dataset.color
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }

    /**
     * Resets all accessibility settings to default.
     */
    function resetarAcessibilidade() {
        // Reset font size
        currentFontSize = 1;
        updateFontSize();
        body.style.fontSize = ''; // Remove inline style

        // Reset line height
        currentLineHeight = 1;
        updateLineHeight();
        document.documentElement.style.setProperty('--espacamento-linha', '1.5');

        // Reset letter spacing
        currentLetterSpacing = 1;
        updateLetterSpacing();
        document.documentElement.style.setProperty('--espacamento-letra', '0em');

        // Reset reading speed
        currentReadingSpeed = 1;
        updateReadingSpeed();
        if (speechSynthesizer.speaking) {
            speechSynthesizer.cancel();
            isReading = false;
            if (toggleLeituraBtn) {
                toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraText">Reproduzir Leitura</span>';
            }
            if (toggleLeituraBtnPWA) {
                toggleLeituraBtnPWA.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraTextPWA">Reproduzir Leitura</span>';
            }
        }

        // Remove contrast, dark mode, and dyslexia font classes
        body.classList.remove('contraste-alto', 'dark-mode', 'fonte-dislexia');
        if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', 'false');
        if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', 'false');
        if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', 'false');
        if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', 'false');


        // Reset focus color
        definirCorFoco('yellow'); // Set default focus color

        // Clear all accessibility related localStorage items
        localStorage.removeItem('fontSize');
        localStorage.removeItem('lineHeight');
        localStorage.removeItem('letterSpacing');
        localStorage.removeItem('readingSpeed');
        localStorage.removeItem('contrasteAlto');
        localStorage.removeItem('darkMode');
        localStorage.removeItem('fonteDislexia');
        localStorage.removeItem('focusColor');

        announceStatus('Configurações de acessibilidade redefinidas para o padrão.');
    }

    // --- Event Listeners for Accessibility Buttons (Desktop) ---
    document.addEventListener('DOMContentLoaded', () => {
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

        // --- Event Listeners for Accessibility Buttons (PWA/Mobile) ---
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

        // --- Submenu Toggle Logic for PWA Accessibility Bar ---
        document.querySelectorAll('.pwa-submenu-header').forEach(header => {
            header.addEventListener('click', function() {
                const submenuId = this.dataset.submenu;
                const submenuContent = document.getElementById(`${submenuId}-submenu`);
                const chevronIcon = this.querySelector('i.fa-chevron-down, i.fa-chevron-right');

                if (!submenuContent) {
                    console.error(`Submenu content not found for ID: ${submenuId}-submenu`);
                    return;
                }

                document.querySelectorAll('.pwa-submenu-content.is-open').forEach(openSubmenu => {
                    if (openSubmenu.id !== `${submenuId}-submenu`) {
                        openSubmenu.classList.remove('is-open');
                        const openSubmenuHeader = openSubmenu.previousElementSibling;
                        const openChevron = openSubmenuHeader.querySelector('i.fa-chevron-down');
                        if (openChevron) {
                            openChevron.classList.remove('fa-chevron-down');
                            openChevron.classList.add('fa-chevron-right');
                            openSubmenuHeader.setAttribute('aria-expanded', 'false');
                        }
                    }
                });

                submenuContent.classList.toggle('is-open');
                const isExpanded = submenuContent.classList.contains('is-open');
                this.setAttribute('aria-expanded', isExpanded);

                if (chevronIcon) {
                    if (isExpanded) {
                        chevronIcon.classList.remove('fa-chevron-right');
                        chevronIcon.classList.add('fa-chevron-down');
                    } else {
                        chevronIcon.classList.remove('fa-chevron-down');
                        chevronIcon.classList.add('fa-chevron-right');
                    }
                }
            });
        });

        // Initial apply of saved settings
        applySavedSettings();
    });


    // --- Back to Top Button ---
    const backToTopBtn = document.getElementById('backToTopBtn');

    /**
     * Checks the scroll position and shows/hides the "Back to Top" button.
     */
    function checkScrollPosition() {
        if (backToTopBtn) {
            if (window.scrollY > 200) {
                backToTopBtn.style.display = 'block';
            } else {
                backToTopBtn.style.display = 'none';
            }
        }
    }

    /**
     * Scrolls the page to the top smoothly.
     */
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        announceStatus('Página rolada para o topo.');
    }

    window.addEventListener('scroll', checkScrollPosition);
    document.addEventListener('DOMContentLoaded', checkScrollPosition);
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', scrollToTop);
    }

    // --- Custom Modal Logic (for newsletter and NANDA/NIC/NOC) ---
    const customModal = document.getElementById('customModal');
    const modalMessage = document.getElementById('modalMessage');
    const modalMessageTitle = document.getElementById('modalMessageTitle'); // New title element
    const modalCloseButton = document.getElementById('modalCloseButton');

    /**
     * Displays a custom modal with a given message.
     * @param {string} message - The message to display in the modal.
     * @param {HTMLElement} [triggeringElement=document.activeElement] - The element that triggered the modal.
     */
    window.showCustomModal = function(message, triggeringElement = document.activeElement) {
        if (customModal && modalMessage && modalMessageTitle) {
            lastFocusedElement = triggeringElement; // Store the element that opened the modal
            modalMessage.textContent = message;
            modalMessageTitle.textContent = "Mensagem de Informação"; // Set a default title for screen readers
            customModal.classList.remove('hidden');
            customModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
            modalCloseButton.focus(); // Focus the close button for accessibility
            announceStatus(`Modal aberto: ${message}`); // Announce modal message
        } else {
            console.error('Custom Modal elements not found.');
        }
    }

    /**
     * Hides the custom modal.
     */
    function hideCustomModal() {
        if (customModal) {
            customModal.classList.add('hidden');
            customModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = ''; // Restore body scrolling
            if (lastFocusedElement) {
                lastFocusedElement.focus(); // Return focus to the element that opened the modal
                lastFocusedElement = null; // Clear the stored element
            }
            announceStatus('Modal fechado.');
        } else {
            console.error('Custom Modal element not found for hiding.');
        }
    }

    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', hideCustomModal);
    }

    // Close modal if escape key is pressed
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (customModal && !customModal.classList.contains('hidden')) {
                hideCustomModal();
            }
        }
    });

    // --- Newsletter Subscription Logic (Adjusted for Formspree) ---
    const newsletterForm = document.getElementById('newsletters-section'); // Now the form itself
    const newsletterEmail = document.getElementById('email'); // Changed to 'email'
    const newsletterConsent = document.getElementById('newsletterConsent');
    const subscribeNewsletterBtn = document.getElementById('subscribeNewsletterBtn');
    const newsletterError = document.getElementById('erro-email'); // Changed to 'erro-email'

    /**
     * Validates the email format.
     * @param {string} email - The email address to validate.
     * @returns {boolean} True if the email is valid, false otherwise.
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Updates the state of the subscribe button based on input validity and consent.
     */
    function updateSubscribeButtonState() {
        const emailValid = newsletterEmail && isValidEmail(newsletterEmail.value);
        const consentChecked = newsletterConsent && newsletterConsent.checked;
        if (subscribeNewsletterBtn) {
            subscribeNewsletterBtn.disabled = !(emailValid && consentChecked);
        }
    }

    // Add event listeners for newsletter form fields
    if (newsletterEmail) {
        newsletterEmail.addEventListener('input', updateSubscribeButtonState);
    }
    if (newsletterConsent) {
        newsletterConsent.addEventListener('change', updateSubscribeButtonState);
    }

    // Handle Formspree submission
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent default form submission

            const email = newsletterEmail.value;
            if (!isValidEmail(email)) {
                if (newsletterError) {
                    newsletterError.textContent = 'E-mail inválido. Verifique se digitou corretamente, por exemplo: nome@dominio.com';
                    newsletterError.style.display = 'block';
                    newsletterError.focus();
                }
                announceStatus('Erro no formulário: E-mail inválido. Verifique se digitou corretamente, por exemplo: nome@dominio.com');
                return;
            }

            if (!newsletterConsent.checked) {
                if (newsletterError) {
                    newsletterError.textContent = 'Você deve aceitar os termos para se inscrever.';
                    newsletterError.style.display = 'block';
                    newsletterError.focus();
                }
                announceStatus('Erro no formulário: Você deve aceitar os termos para se inscrever.');
                return;
            }

            if (newsletterError) {
                newsletterError.style.display = 'none'; // Hide previous errors
            }

            // Disable button during submission
            if (subscribeNewsletterBtn) {
                subscribeNewsletterBtn.disabled = true;
                subscribeNewsletterBtn.textContent = 'Enviando...';
            }
            announceStatus('Enviando formulário da newsletter...');

            try {
                const response = await fetch(this.action, {
                    method: this.method,
                    body: new FormData(this), // Use FormData to send form data
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    window.showCustomModal('Obrigado por se inscrever na nossa newsletter!');
                    newsletterForm.reset(); // Clear form fields
                    updateSubscribeButtonState(); // Update button state after reset
                    announceStatus('Inscrição na newsletter realizada com sucesso!');
                } else {
                    const data = await response.json();
                    let errorMessage = 'Ocorreu um erro ao se inscrever. Por favor, tente novamente. Certifique-se de que o e-mail não está em uso ou tente novamente mais tarde.';
                    if (data.errors) {
                        errorMessage = data.errors.map(error => error.message).join(', ') + '. Verifique se digitou corretamente ou tente novamente mais tarde.';
                    }
                    if (newsletterError) {
                        newsletterError.textContent = errorMessage;
                        newsletterError.style.display = 'block';
                        newsletterError.focus();
                    }
                    announceStatus(`Erro na inscrição da newsletter: ${errorMessage}`);
                }
            } catch (error) {
                console.error('Submission error:', error);
                const networkErrorMessage = 'Ocorreu um erro de rede. Por favor, tente novamente.';
                if (newsletterError) {
                    newsletterError.textContent = networkErrorMessage;
                    newsletterError.style.display = 'block';
                    newsletterError.focus();
                }
                announceStatus(`Erro na inscrição da newsletter: ${networkErrorMessage}`);
            } finally {
                if (subscribeNewsletterBtn) {
                    subscribeNewsletterBtn.disabled = false;
                    subscribeNewsletterBtn.textContent = 'Assinar';
                }
            }
        });
    }

    // Initial state update for newsletter button on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', updateSubscribeButtonState);

    // --- Cookie Consent Banner Logic ---
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn');
    const manageCookiesBtn = document.getElementById('manageCookiesBtn');
    const openGranularCookieModalBtn = document.getElementById('openGranularCookieModalBtn'); // Botão no rodapé

    const cookiesAcceptedKey = 'cookiesAccepted';
    const cookiePreferencesKey = 'cookiePreferences';

    function showCookieBanner() {
        if (localStorage.getItem(cookiesAcceptedKey) === null) {
            cookieConsentBanner.classList.add('show');
        }
    }

    function hideCookieBanner() {
        cookieConsentBanner.classList.remove('show');
    }

    function updateGtagConsent() {
        const preferences = JSON.parse(localStorage.getItem(cookiePreferencesKey)) || {};
        const analyticsStorage = preferences.analytics === true ? 'granted' : 'denied';
        const adStorage = preferences.marketing === true ? 'granted' : 'denied';

        gtag('consent', 'update', {
            'analytics_storage': analyticsStorage,
            'ad_storage': adStorage
        });
    }

    function loadGranularPreferences() {
        const preferences = JSON.parse(localStorage.getItem(cookiePreferencesKey)) || {};
        if (cookieAnalyticsCheckbox) cookieAnalyticsCheckbox.checked = preferences.analytics === true;
        if (cookieMarketingCheckbox) cookieMarketingCheckbox.checked = preferences.marketing === true;
    }

    function saveGranularPreferences() {
        const preferences = {
            essential: true, // Always essential
            analytics: cookieAnalyticsCheckbox ? cookieAnalyticsCheckbox.checked : false,
            marketing: cookieMarketingCheckbox ? cookieMarketingCheckbox.checked : false
        };
        localStorage.setItem(cookiePreferencesKey, JSON.stringify(preferences));
        localStorage.setItem(cookiesAcceptedKey, 'true');
        updateGtagConsent();
        hideGranularCookieModal();
        announceStatus('Preferências de cookies salvas.');
    }

    function showGranularCookieModal() {
        hideCookieBanner();
        if (granularCookieModal) {
            granularCookieModal.classList.add('show');
            granularCookieModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            loadGranularPreferences();
            if (granularModalCloseButton) granularModalCloseButton.focus();
            announceStatus('Modal de configurações de cookies aberto.');
        }
    }

    function hideGranularCookieModal() {
        if (granularCookieModal) {
            granularCookieModal.classList.remove('show');
            granularCookieModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (localStorage.getItem(cookiesAcceptedKey) === null) {
                showCookieBanner();
            }
            announceStatus('Modal de configurações de cookies fechado.');
        }
    }

    function refuseAllCookies() {
        localStorage.setItem(cookiesAcceptedKey, 'false');
        localStorage.setItem(cookiePreferencesKey, JSON.stringify({ essential: true, analytics: false, marketing: false }));
        updateGtagConsent();
        hideCookieBanner();
        announceStatus('Todos os cookies não essenciais foram recusados.');
    }

    if (acceptAllCookiesBtn) {
        acceptAllCookiesBtn.addEventListener('click', () => {
            localStorage.setItem(cookiesAcceptedKey, 'true');
            localStorage.setItem(cookiePreferencesKey, JSON.stringify({ essential: true, analytics: true, marketing: true }));
            hideCookieBanner();
            updateGtagConsent();
            announceStatus('Todos os cookies foram aceitos.');
        });
    }

    if (refuseAllCookiesBtn) {
        refuseAllCookiesBtn.addEventListener('click', refuseAllCookies);
    }

    if (manageCookiesBtn) {
        manageCookiesBtn.addEventListener('click', showGranularCookieModal);
    }
    if (openGranularCookieModalBtn) {
        openGranularCookieModalBtn.addEventListener('click', showGranularCookieModal);
    }

    if (granularModalCloseButton) {
        granularModalCloseButton.addEventListener('click', hideGranularCookieModal);
    }
    if (saveGranularPreferencesBtn) {
        saveGranularPreferencesBtn.addEventListener('click', saveGranularPreferences);
    }
    if (cancelGranularPreferencesBtn) {
        cancelGranularPreferencesBtn.addEventListener('click', hideGranularCookieModal);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (granularCookieModal && granularCookieModal.classList.contains('show')) {
                hideGranularCookieModal();
            }
        }
    });

    showCookieBanner();
    updateGtagConsent();

    // --- VLibras widget initialization ---
    // Make sure the VLibras script is loaded in the HTML head
    // <script src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
    new VLibras.Widget('https://vlibras.gov.br/app');


    // --- Service Worker registration ---
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

    // --- Keyboard Shortcuts Modal Event Listeners ---
    if (btnKeyboardShortcuts) {
        btnKeyboardShortcuts.addEventListener('click', showKeyboardShortcutsModal);
    }
    if (btnKeyboardShortcutsPWA) {
        btnKeyboardShortcutsPWA.addEventListener('click', showKeyboardShortcutsModal);
    }

    if (keyboardModalCloseButton) {
        keyboardModalCloseButton.addEventListener('click', hideKeyboardShortcutsModal);
    }
    if (keyboardShortcutsModal) {
        keyboardShortcutsModal.addEventListener('click', (e) => {
            if (e.target === keyboardShortcutsModal) {
                hideKeyboardShortcutsModal();
            }
        });
    }
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (keyboardShortcutsModal && keyboardShortcutsModal.classList.contains('show')) {
                hideKeyboardShortcutsModal();
            }
        }
    });

    // --- Global Navigation Submenu Toggle Logic (for desktop and mobile) ---
    // This logic handles the opening/closing of submenus in both desktop and mobile navigation.
    function handleSubmenuToggle(event) {
        event.preventDefault();
        const toggleBtn = event.currentTarget;
        const submenuId = toggleBtn.dataset.submenuToggle;
        const submenu = document.getElementById(`submenu-${submenuId}`);
        const isCurrentlyExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';

        if (submenu) {
            // Close all other open submenus at the same level
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

            // Toggle the clicked submenu
            if (isCurrentlyExpanded) {
                submenu.classList.add('hidden');
                toggleBtn.setAttribute('aria-expanded', 'false');
                const icon = toggleBtn.querySelector('svg, i');
                if (icon) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                    if (icon.tagName === 'SVG') icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>';
                }
            } else {
                submenu.classList.remove('hidden');
                toggleBtn.setAttribute('aria-expanded', 'true');
                const icon = toggleBtn.querySelector('svg, i');
                if (icon) {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                    if (icon.tagName === 'SVG') icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
                }
            }
        }
    }

    // Add event listeners for desktop submenu toggles
    document.querySelectorAll('.desktop-nav [data-submenu-toggle]').forEach(toggleBtn => {
        toggleBtn.addEventListener('click', handleSubmenuToggle);
    });

    // Add event listeners for mobile submenu toggles
    document.querySelectorAll('#offCanvasMenu [data-submenu-toggle]').forEach(toggleBtn => {
        toggleBtn.addEventListener('click', handleSubmenuToggle);
    });

    // --- Hamburger Menu and Off-Canvas Navigation Logic (PWA/Mobile) ---
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
            // Close accessibility bar if open when hamburger is clicked
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

        // Close off-canvas menu when a link inside it is clicked
        offCanvasMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                offCanvasMenu.classList.remove('is-open');
                menuOverlay.classList.remove('is-open');
                releaseFocus();
            });
        });
    }

    // --- Accessibility Toggle Button Logic (PWA/Mobile) ---
    if (accessibilityToggleButton && pwaAcessibilidadeBar && menuOverlay) {
        accessibilityToggleButton.addEventListener('click', () => {
            pwaAcessibilidadeBar.classList.toggle('is-open');
            const isOpen = pwaAcessibilidadeBar.classList.contains('is-open');
            accessibilityToggleButton.setAttribute('aria-expanded', isOpen);

            if (isOpen) {
                menuOverlay.classList.add('is-open'); // Show overlay
                const firstFocusable = pwaAcessibilidadeBar.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
                trapFocus(pwaAcessibilidadeBar);
                // Close hamburger menu if open when accessibility toggle is clicked
                if (offCanvasMenu && offCanvasMenu.classList.contains('is-open')) {
                    offCanvasMenu.classList.remove('is-open');
                }
            } else {
                menuOverlay.classList.remove('is-open'); // Hide overlay
                releaseFocus();
            }
        });

        menuOverlay.addEventListener('click', (e) => {
            // Only close pwaAcessibilidadeBar if the click target is the overlay itself
            if (pwaAcessibilidadeBar.classList.contains('is-open') &&
                !pwaAcessibilidadeBar.contains(e.target)) {
                pwaAcessibilidadeBar.classList.remove('is-open');
                accessibilityToggleButton.setAttribute('aria-expanded', 'false');
                menuOverlay.classList.remove('is-open');
                releaseFocus();
            }
        });
    }

    // --- PWA/Desktop Mode Toggle Logic ---
    const mainTitle = document.getElementById('main-title');
    const titleBar = document.querySelector('.title-bar');

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

    // Initial calls on load
    togglePWAModeElements();
    adjustTitleBarWidth();

    // --- Newsletter Section - Dynamic Elements and Tooltips ---
    // This part ensures that tooltips are properly initialized for dynamically loaded content
    // and that the newsletter form logic is correctly bound.
    const newsletterSection = document.getElementById('newsletters-section');
    if (newsletterSection) {
        // Re-initialize tooltips for the newsletter section if it's dynamically loaded
        newsletterSection.querySelectorAll('.tooltip-container').forEach(container => {
            const button = container.querySelector('.tooltip-icon-button');
            const tooltipText = container.querySelector('.tooltip-text');

            if (button && tooltipText) {
                // Ensure the button has aria-describedby for accessibility
                button.setAttribute('aria-describedby', tooltipText.id);

                // Add event listeners for hover and focus to show/hide tooltip
                button.addEventListener('mouseenter', () => { tooltipText.style.visibility = 'visible'; tooltipText.style.opacity = '1'; });
                button.addEventListener('mouseleave', () => { tooltipText.style.visibility = 'hidden'; tooltipText.style.opacity = '0'; });
                button.addEventListener('focus', () => { tooltipText.style.visibility = 'visible'; tooltipText.style.opacity = '1'; });
                button.addEventListener('blur', () => { tooltipText.style.visibility = 'hidden'; tooltipText.style.opacity = '0'; });
            }
        });
    }
});
