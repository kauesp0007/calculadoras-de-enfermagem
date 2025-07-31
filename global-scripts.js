// global-scripts.js
// Este arquivo contém todo o JavaScript para a barra de acessibilidade,
// modais (personalizado, cookies, atalhos de teclado) e VLibras,
// além da lógica de navegação e responsividade global, e o formulário de newsletter.

document.addEventListener('DOMContentLoaded', function() {
    // --- Referências de Elementos Globais (Assumindo que estão diretamente no HTML) ---
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
    let currentFontSize = 1;
    let currentLineHeight = 1;
    let currentLetterSpacing = 1;
    let currentReadingSpeed = 1;
    let speechSynthesizer = window.speechSynthesis;
    let utterance = null;
    let isReading = false;
    let currentFocusColor = localStorage.getItem('focusColor') || 'yellow';
    let lastFocusedElement = null; // Para armazenar o elemento que abriu o modal

    // --- Funções de Acessibilidade ---

    function announceStatus(message) {
        if (statusMessageDiv) {
            statusMessageDiv.textContent = message;
        }
    }

    function applySavedSettings() {
        const savedFontSize = localStorage.getItem('fontSize');
        if (savedFontSize) { currentFontSize = parseInt(savedFontSize); updateFontSize(false); }
        const savedLineHeight = localStorage.getItem('lineHeight');
        if (savedLineHeight) { currentLineHeight = parseInt(savedLineHeight); updateLineHeight(false); }
        const savedLetterSpacing = localStorage.getItem('letterSpacing');
        if (savedLetterSpacing) { currentLetterSpacing = parseInt(savedLetterSpacing); updateLetterSpacing(false); }
        const savedReadingSpeed = localStorage.getItem('readingSpeed');
        if (savedReadingSpeed) { currentReadingSpeed = parseInt(savedReadingSpeed); updateReadingSpeed(false); }
        if (localStorage.getItem('contrasteAlto') === 'true') { body.classList.add('contraste-alto'); if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', 'true'); if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', 'true'); }
        if (localStorage.getItem('darkMode') === 'true') { body.classList.add('dark-mode'); if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', 'true'); if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', 'true'); }
        if (localStorage.getItem('fonteDislexia') === 'true') { body.classList.add('fonte-dislexia'); }
        const savedFocusColor = localStorage.getItem('focusColor');
        if (savedFocusColor) { currentFocusColor = savedFocusColor; document.documentElement.style.setProperty('--cor-foco-acessibilidade', currentFocusColor); updateFocusColorButtons(currentFocusColor); }
    }

    function updateFontSize(announce = true) {
        let message = '';
        switch (currentFontSize) {
            case 1: body.style.fontSize = '1em'; if (fontSizeText) fontSizeText.textContent = 'Normal'; if (fontSizeTextPWA) fontSizeTextPWA.textContent = 'Normal'; message = 'Tamanho da fonte normal (100%).'; break;
            case 2: body.style.fontSize = '1.15em'; if (fontSizeText) fontSizeText.textContent = 'Médio'; if (fontSizeTextPWA) fontSizeTextPWA.textContent = 'Médio'; message = 'Tamanho da fonte médio (115%).'; break;
            case 3: body.style.fontSize = '1.3em'; if (fontSizeText) fontSizeText.textContent = 'Grande'; if (fontSizeTextPWA) fontSizeTextPWA.textContent = 'Grande'; message = 'Tamanho da fonte grande (130%).'; break;
            case 4: body.style.fontSize = '1.5em'; if (fontSizeText) fontSizeText.textContent = 'Extra Grande'; if (fontSizeTextPWA) fontSizeTextPWA.textContent = 'Extra Grande'; message = 'Tamanho da fonte extra grande (150%).'; break;
            case 5: body.style.fontSize = '2em'; if (fontSizeText) fontSizeText.textContent = 'Máximo'; if (fontSizeTextPWA) fontSizeTextPWA.textContent = 'Máximo'; message = 'Tamanho da fonte máximo (200%).'; break;
        }
        localStorage.setItem('fontSize', currentFontSize);
        if (announce) announceStatus(message);
    }
    function alternarTamanhoFonte() { currentFontSize = (currentFontSize % 5) + 1; updateFontSize(); }

    function updateLineHeight(announce = true) {
        let message = '';
        switch (currentLineHeight) {
            case 1: document.documentElement.style.setProperty('--espacamento-linha', '1.5'); if (lineHeightText) lineHeightText.textContent = 'Médio'; if (lineHeightTextPWA) lineHeightTextPWA.textContent = 'Médio'; message = 'Espaçamento de linha médio.'; break;
            case 2: document.documentElement.style.setProperty('--espacamento-linha', '1.8'); if (lineHeightText) lineHeightText.textContent = 'Grande'; if (lineHeightTextPWA) lineHeightTextPWA.textContent = 'Grande'; message = 'Espaçamento de linha grande.'; break;
            case 3: document.documentElement.style.setProperty('--espacamento-linha', '2.0'); if (lineHeightText) lineHeightText.textContent = 'Extra Grande'; if (lineHeightTextPWA) lineHeightTextPWA.textContent = 'Extra Grande'; message = 'Espaçamento de linha extra grande.'; break;
        }
        localStorage.setItem('lineHeight', currentLineHeight);
        if (announce) announceStatus(message);
    }
    function alternarEspacamentoLinha() { currentLineHeight = (currentLineHeight % 3) + 1; updateLineHeight(); }

    function updateLetterSpacing(announce = true) {
        let message = '';
        switch (currentLetterSpacing) {
            case 1: document.documentElement.style.setProperty('--espacamento-letra', '0em'); if (letterSpacingText) letterSpacingText.textContent = 'Normal'; if (letterSpacingTextPWA) letterSpacingTextPWA.textContent = 'Normal'; message = 'Espaçamento de letra normal.'; break;
            case 2: document.documentElement.style.setProperty('--espacamento-letra', '0.05em'); if (letterSpacingText) letterSpacingText.textContent = 'Médio'; if (letterSpacingTextPWA) letterSpacingTextPWA.textContent = 'Médio'; message = 'Espaçamento de letra médio.'; break;
            case 3: document.documentElement.style.setProperty('--espacamento-letra', '0.1em'); if (letterSpacingText) letterSpacingText.textContent = 'Grande'; if (letterSpacingTextPWA) letterSpacingTextPWA.textContent = 'Grande'; message = 'Espaçamento de letra grande.'; break;
        }
        localStorage.setItem('letterSpacing', currentLetterSpacing);
        if (announce) announceStatus(message);
    }
    function alternarEspacamentoLetra() { currentLetterSpacing = (currentLetterSpacing % 3) + 1; updateLetterSpacing(); if (isReading) { reiniciarLeitura(); } }

    function updateReadingSpeed(announce = true) {
        let rate = 1;
        let message = '';
        switch (currentReadingSpeed) {
            case 1: rate = 1; if (readingSpeedText) readingSpeedText.textContent = 'Normal'; if (readingSpeedTextPWA) readingSpeedTextPWA.textContent = 'Normal'; message = 'Velocidade de leitura normal.'; break;
            case 2: rate = 0.75; if (readingSpeedText) readingSpeedText.textContent = 'Lento'; if (readingSpeedTextPWA) readingSpeedTextPWA.textContent = 'Lento'; message = 'Velocidade de leitura lenta.'; break;
            case 3: rate = 1.25; if (readingSpeedText) readingSpeedText.textContent = 'Rápido'; if (readingSpeedTextPWA) readingSpeedTextPWA.textContent = 'Rápido'; message = 'Velocidade de leitura rápida.'; break;
        }
        if (utterance) { utterance.rate = rate; }
        localStorage.setItem('readingSpeed', currentReadingSpeed);
        if (announce) announceStatus(message);
    }
    function alternarVelocidadeLeitura() { currentReadingSpeed = (currentReadingSpeed % 3) + 1; updateReadingSpeed(); if (isReading) { reiniciarLeitura(); } }

    function toggleLeitura() {
        if (!speechSynthesizer) { announceStatus('Seu navegador não suporta leitura de texto.'); return; }
        const mainContent = document.getElementById('main-content');
        if (!mainContent) { announceStatus('Conteúdo principal para leitura não encontrado.'); return; }

        if (isReading) {
            speechSynthesizer.pause(); isReading = false;
            if (toggleLeituraBtn) { toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraText">Reproduzir Leitura</span>'; }
            if (toggleLeituraBtnPWA) { toggleLeituraBtnPWA.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraTextPWA">Reproduzir Leitura</span>'; }
            announceStatus('Leitura pausada.');
        } else {
            if (speechSynthesizer.paused && utterance) { speechSynthesizer.resume(); announceStatus('Leitura retomada.'); }
            else {
                if (speechSynthesizer.speaking) { speechSynthesizer.cancel(); }
                const textToRead = mainContent.innerText;
                utterance = new SpeechSynthesisUtterance(textToRead);
                utterance.lang = 'pt-BR';
                utterance.rate = currentReadingSpeed === 1 ? 1 : (currentReadingSpeed === 2 ? 0.75 : 1.25);
                utterance.onend = () => {
                    isReading = false;
                    if (toggleLeituraBtn) { toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraText">Reproduzir Leitura</span>'; }
                    if (toggleLeituraBtnPWA) { toggleLeituraBtnPWA.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraTextPWA">Reproduzir Leitura</span>'; }
                    announceStatus('Leitura concluída.');
                };
                speechSynthesizer.speak(utterance); announceStatus('Leitura iniciada.');
            }
            isReading = true;
            if (toggleLeituraBtn) { toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span class="sr-only" id="toggleLeituraText">Pausar Leitura</span>'; }
            if (toggleLeituraBtnPWA) { toggleLeituraBtnPWA.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span class="sr-only" id="toggleLeituraTextPWA">Pausar Leitura</span>'; }
        }
    }
    function reiniciarLeitura() { if (speechSynthesizer.speaking) { speechSynthesizer.cancel(); } isReading = false; announceStatus('Leitura reiniciada.'); toggleLeitura(); }

    function readFocusedElement() {
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement.innerText) {
            if (speechSynthesizer.speaking) { speechSynthesizer.cancel(); }
            const textToRead = focusedElement.innerText;
            const focusedUtterance = new SpeechSynthesisUtterance(textToRead);
            focusedUtterance.lang = 'pt-BR';
            focusedUtterance.rate = currentReadingSpeed === 1 ? 1 : (currentReadingSpeed === 2 ? 0.75 : 1.25);
            speechSynthesizer.speak(focusedUtterance);
            announceStatus(`Lendo: ${textToRead.substring(0, 50)}...`);
        } else { announceStatus('Nenhum elemento focado com texto para ler.'); }
    }

    function alternarContraste() {
        body.classList.toggle('contraste-alto'); const isActive = body.classList.contains('contraste-alto'); localStorage.setItem('contrasteAlto', isActive);
        if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', isActive); if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', isActive);
        announceStatus(`Modo de alto contraste ${isActive ? 'ativado' : 'desativado'}.`);
    }
    function alternarModoEscuro() {
        body.classList.toggle('dark-mode'); const isActive = body.classList.contains('dark-mode'); localStorage.setItem('darkMode', isActive);
        if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', isActive); if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', isActive);
        announceStatus(`Modo escuro ${isActive ? 'ativado' : 'desativado'}.`);
    }
    function alternarFonteDislexia() {
        body.classList.toggle('fonte-dislexia'); const isActive = body.classList.contains('fonte-dislexia'); localStorage.setItem('fonteDislexia', isActive);
        announceStatus(`Fonte para dislexia ${isActive ? 'ativada' : 'desativada'}.`);
    }

    function definirCorFoco(color) {
        currentFocusColor = color; document.documentElement.style.setProperty('--cor-foco-acessibilidade', currentFocusColor); localStorage.setItem('focusColor', color); updateFocusColorButtons(currentFocusColor);
        announceStatus(`Cor de foco de acessibilidade alterada para ${color}.`);
    }
    function updateFocusColorButtons(selectedColor) {
        document.querySelectorAll('#barraAcessibilidade .color-option').forEach(button => { if (button.dataset.color === selectedColor) { button.classList.add('selected'); } else { button.classList.remove('selected'); } });
        document.querySelectorAll('#pwaAcessibilidadeBar .color-option').forEach(button => { if (button.dataset.color === selectedColor) { button.classList.add('selected'); } else { button.classList.remove('selected'); } });
    }

    function resetarAcessibilidade() {
        currentFontSize = 1; updateFontSize(); body.style.fontSize = '';
        currentLineHeight = 1; updateLineHeight(); document.documentElement.style.setProperty('--espacamento-linha', '1.5');
        currentLetterSpacing = 1; updateLetterSpacing(); document.documentElement.style.setProperty('--espacamento-letra', '0em');
        currentReadingSpeed = 1; updateReadingSpeed();
        if (speechSynthesizer.speaking) { speechSynthesizer.cancel(); isReading = false; if (toggleLeituraBtn) { toggleLeituraBtn.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraText">Reproduzir Leitura</span>'; } if (toggleLeituraBtnPWA) { toggleLeituraBtnPWA.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg><span class="sr-only" id="toggleLeituraTextPWA">Reproduzir Leitura</span>'; } }
        body.classList.remove('contraste-alto', 'dark-mode', 'fonte-dislexia');
        if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', 'false'); if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', 'false');
        if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', 'false'); if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', 'false');
        definirCorFoco('yellow');
        localStorage.removeItem('fontSize'); localStorage.removeItem('lineHeight'); localStorage.removeItem('letterSpacing'); localStorage.removeItem('readingSpeed'); localStorage.removeItem('contrasteAlto'); localStorage.removeItem('darkMode'); localStorage.removeItem('fonteDislexia'); localStorage.removeItem('focusColor');
        announceStatus('Configurações de acessibilidade redefinidas para o padrão.');
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
        if (focusedElementBeforeModal) { focusedElementBeforeModal.focus(); }
        document.removeEventListener('keydown', handleTrapFocus);
    }
    function handleTrapFocus(e) {
        const isTabPressed = e.key === 'Tab'; if (!isTabPressed) { return; }
        if (e.shiftKey) { if (document.activeElement === firstFocusableElement) { lastFocusableElement.focus(); e.preventDefault(); } }
        else { if (document.activeElement === lastFocusableElement) { firstFocusableElement.focus(); e.preventDefault(); } }
    }

    // --- Funções do Modal de Mensagem Personalizado (showCustomModal) ---
    window.showCustomModal = function(message, triggeringElement = document.activeElement) {
        if (customModal && modalMessage && modalMessageTitle) {
            lastFocusedElement = triggeringElement; modalMessage.textContent = message; modalMessageTitle.textContent = "Mensagem de Informação";
            customModal.classList.remove('hidden'); customModal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
            modalCloseButton.focus(); announceStatus(`Modal aberto: ${message}`);
        } else { console.error('Elementos do Modal Personalizado não encontrados.'); }
    }
    function hideCustomModal() {
        if (customModal) {
            customModal.classList.add('hidden'); customModal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
            if (lastFocusedElement) { lastFocusedElement.focus(); lastFocusedElement = null; }
            announceStatus('Modal fechado.');
        } else { console.error('Elemento do Modal Personalizado não encontrado para ocultar.'); }
    }
    if (modalCloseButton) { modalCloseButton.addEventListener('click', hideCustomModal); }
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (customModal && !customModal.classList.contains('hidden')) { hideCustomModal(); } } });

    // --- Newsletter Subscription Logic ---
    const newsletterForm = document.getElementById('newsletters-section');
    const newsletterEmail = document.getElementById('email');
    const newsletterConsent = document.getElementById('newsletterConsent');
    const subscribeNewsletterBtn = document.getElementById('subscribeNewsletterBtn');
    const newsletterError = document.getElementById('erro-email');

    function isValidEmail(email) { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return emailRegex.test(email); }
    function updateSubscribeButtonState() {
        const emailValid = newsletterEmail && isValidEmail(newsletterEmail.value);
        const consentChecked = newsletterConsent && newsletterConsent.checked;
        if (subscribeNewsletterBtn) { subscribeNewsletterBtn.disabled = !(emailValid && consentChecked); }
    }
    if (newsletterEmail) { newsletterEmail.addEventListener('input', updateSubscribeButtonState); }
    if (newsletterConsent) { newsletterConsent.addEventListener('change', updateSubscribeButtonState); }

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = newsletterEmail.value;
            if (!isValidEmail(email)) { if (newsletterError) { newsletterError.textContent = 'E-mail inválido. Verifique se digitou corretamente, por exemplo: nome@dominio.com'; newsletterError.style.display = 'block'; newsletterError.focus(); } announceStatus('Erro no formulário: E-mail inválido. Verifique se digitou corretamente, por exemplo: nome@dominio.com'); return; }
            if (!newsletterConsent.checked) { if (newsletterError) { newsletterError.textContent = 'Você deve aceitar os termos para se inscrever.'; newsletterError.style.display = 'block'; newsletterError.focus(); } announceStatus('Erro no formulário: Você deve aceitar os termos para se inscrever.'); return; }
            if (newsletterError) { newsletterError.style.display = 'none'; }

            if (subscribeNewsletterBtn) { subscribeNewsletterBtn.disabled = true; subscribeNewsletterBtn.textContent = 'Enviando...'; }
            announceStatus('Enviando formulário da newsletter...');

            try {
                const response = await fetch(this.action, { method: this.method, body: new FormData(this), headers: { 'Accept': 'application/json' } });
                if (response.ok) {
                    window.showCustomModal('Obrigado por se inscrever na nossa newsletter!');
                    newsletterForm.reset(); updateSubscribeButtonState(); announceStatus('Inscrição na newsletter realizada com sucesso!');
                } else {
                    const data = await response.json();
                    let errorMessage = 'Ocorreu um erro ao se inscrever. Por favor, tente novamente. Certifique-se de que o e-mail não está em uso ou tente novamente mais tarde.';
                    if (data.errors) { errorMessage = data.errors.map(error => error.message).join(', ') + '. Verifique se digitou corretamente ou tente novamente mais tarde.'; }
                    if (newsletterError) { newsletterError.textContent = errorMessage; newsletterError.style.display = 'block'; newsletterError.focus(); }
                    announceStatus(`Erro na inscrição da newsletter: ${errorMessage}`);
                }
            } catch (error) {
                console.error('Submission error:', error);
                const networkErrorMessage = 'Ocorreu um erro de rede. Por favor, tente novamente.';
                if (newsletterError) { newsletterError.textContent = networkErrorMessage; newsletterError.style.display = 'block'; newsletterError.focus(); }
                announceStatus(`Erro na inscrição da newsletter: ${networkErrorMessage}`);
            } finally {
                if (subscribeNewsletterBtn) { subscribeNewsletterBtn.disabled = false; subscribeNewsletterBtn.textContent = 'Assinar'; }
            }
        });
    }
    document.addEventListener('DOMContentLoaded', updateSubscribeButtonState);

    // --- Cookie Consent Banner Logic ---
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn');
    const manageCookiesBtn = document.getElementById('manageCookiesBtn');
    const openGranularCookieModalBtn = document.getElementById('openGranularCookieModalBtn');
    const granularCookieModal = document.getElementById('granularCookieModal');
    const granularModalCloseButton = document.getElementById('granularModalCloseButton');
    const saveGranularPreferencesBtn = document.getElementById('saveGranularPreferencesBtn');
    const cancelGranularPreferencesBtn = document.getElementById('cancelGranularPreferencesBtn');
    const cookieAnalyticsCheckbox = document.getElementById('cookieAnalytics');
    const cookieMarketingCheckbox = document.getElementById('cookieMarketing');

    const cookiesAcceptedKey = 'cookiesAccepted';
    const cookiePreferencesKey = 'cookiePreferences';

    function showCookieBanner() {
        if (localStorage.getItem(cookiesAcceptedKey) === null) { cookieConsentBanner.classList.add('show'); }
    }
    function hideCookieBanner() { cookieConsentBanner.classList.remove('show'); }

    function updateGtagConsent() {
        const preferences = JSON.parse(localStorage.getItem(cookiePreferencesKey)) || {};
        const analyticsStorage = preferences.analytics === true ? 'granted' : 'denied';
        const adStorage = preferences.marketing === true ? 'granted' : 'denied';
        gtag('consent', 'update', { 'analytics_storage': analyticsStorage, 'ad_storage': adStorage });
    }

    function loadGranularPreferences() {
        const preferences = JSON.parse(localStorage.getItem(cookiePreferencesKey)) || {};
        if (cookieAnalyticsCheckbox) cookieAnalyticsCheckbox.checked = preferences.analytics === true;
        if (cookieMarketingCheckbox) cookieMarketingCheckbox.checked = preferences.marketing === true;
    }
    function saveGranularPreferences() {
        const preferences = { essential: true, analytics: cookieAnalyticsCheckbox ? cookieAnalyticsCheckbox.checked : false, marketing: cookieMarketingCheckbox ? cookieMarketingCheckbox.checked : false };
        localStorage.setItem(cookiePreferencesKey, JSON.stringify(preferences)); localStorage.setItem(cookiesAcceptedKey, 'true');
        updateGtagConsent(); hideGranularCookieModal(); announceStatus('Preferências de cookies salvas.');
    }
    function showGranularCookieModal() {
        hideCookieBanner();
        if (granularCookieModal) {
            granularCookieModal.classList.add('show'); granularCookieModal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
            loadGranularPreferences(); if (granularModalCloseButton) granularModalCloseButton.focus(); announceStatus('Modal de configurações de cookies aberto.');
        }
    }
    function hideGranularCookieModal() {
        if (granularCookieModal) {
            granularCookieModal.classList.remove('show'); granularCookieModal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
            if (localStorage.getItem(cookiesAcceptedKey) === null) { showCookieBanner(); }
            announceStatus('Modal de configurações de cookies fechado.');
        }
    }
    function refuseAllCookies() {
        localStorage.setItem(cookiesAcceptedKey, 'false'); localStorage.setItem(cookiePreferencesKey, JSON.stringify({ essential: true, analytics: false, marketing: false }));
        updateGtagConsent(); hideCookieBanner(); announceStatus('Todos os cookies não essenciais foram recusados.');
    }

    if (acceptAllCookiesBtn) { acceptAllCookiesBtn.addEventListener('click', () => { localStorage.setItem(cookiesAcceptedKey, 'true'); localStorage.setItem(cookiePreferencesKey, JSON.stringify({ essential: true, analytics: true, marketing: true })); hideCookieBanner(); updateGtagConsent(); announceStatus('Todos os cookies foram aceitos.'); }); }
    if (refuseAllCookiesBtn) { refuseAllCookiesBtn.addEventListener('click', refuseAllCookies); }
    if (manageCookiesBtn) { manageCookiesBtn.addEventListener('click', showGranularCookieModal); }
    if (openGranularCookieModalBtn) { openGranularCookieModalBtn.addEventListener('click', showGranularCookieModal); }
    if (granularModalCloseButton) { granularModalCloseButton.addEventListener('click', hideGranularCookieModal); }
    if (saveGranularPreferencesBtn) { saveGranularPreferencesBtn.addEventListener('click', saveGranularPreferences); }
    if (cancelGranularPreferencesBtn) { cancelGranularPreferencesBtn.addEventListener('click', hideGranularCookieModal); }
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (granularCookieModal && granularCookieModal.classList.contains('show')) { hideGranularCookieModal(); } } });

    showCookieBanner(); updateGtagConsent();

    // --- VLibras widget initialization ---
    // Make sure the VLibras script is loaded in the HTML head: <script src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
    new VLibras.Widget('https://vlibras.gov.br/app');

    // --- Service Worker registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => { console.log('ServiceWorker registration successful with scope: ', registration.scope); })
                .catch(err => { console.log('ServiceWorker registration failed: ', err); });
        });
    }

    // --- Keyboard Shortcuts Modal Event Listeners ---
    const keyboardShortcutsModal = document.getElementById('keyboardShortcutsModal');
    const keyboardModalCloseButton = document.getElementById('keyboardModalCloseButton');
    const btnKeyboardShortcuts = document.getElementById('btnKeyboardShortcuts');
    const btnKeyboardShortcutsPWA = document.getElementById('btnKeyboardShortcutsPWA');

    function showKeyboardShortcutsModal() {
        if (keyboardShortcutsModal) {
            keyboardShortcutsModal.classList.remove('hidden'); lastFocusedElement = document.activeElement;
            const focusableElements = keyboardShortcutsModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) { focusableElements[0].focus(); }
            trapFocus(keyboardShortcutsModal); announceStatus('Modal de atalhos de teclado aberto.');
        }
    }
    function hideKeyboardShortcutsModal() {
        if (keyboardShortcutsModal) {
            keyboardShortcutsModal.classList.add('hidden'); keyboardShortcutsModal.removeEventListener('keydown', trapFocus);
            if (lastFocusedElement) { lastFocusedElement.focus(); } announceStatus('Modal de atalhos de teclado fechado.');
        }
    }
    if (btnKeyboardShortcuts) { btnKeyboardShortcuts.addEventListener('click', showKeyboardShortcutsModal); }
    if (btnKeyboardShortcutsPWA) { btnKeyboardShortcutsPWA.addEventListener('click', showKeyboardShortcutsModal); }
    if (keyboardModalCloseButton) { keyboardModalCloseButton.addEventListener('click', hideKeyboardShortcutsModal); }
    if (keyboardShortcutsModal) { keyboardShortபட்சCompreendido! Você está absolutamente correto. A barra de acessibilidade e o botão "Voltar ao Topo" não estavam aparecendo porque seus elementos HTML não estavam presentes no corpo do documento, e o banner de cookies também não estava sendo exibido.

Minha intenção era que esses componentes fossem gerenciados pelos arquivos globais, mas me equivoquei ao omitir o HTML deles no corpo da página. Para que o `global-styles.css` possa estilizá-los e o `global-scripts.js` possa adicionar suas funcionalidades, os elementos precisam estar lá.

Vou corrigir o `CODIGO DE ASA.txt` para incluir todos os elementos HTML necessários para a barra de acessibilidade (desktop e mobile), o botão "Voltar ao Topo", o widget VLibras, o banner de cookies e os modais (`customModal`, `granularCookieModal`, `keyboardShortcutsModal`). Ao mesmo tempo, vou remover todos os scripts e estilos embutidos que agora são tratados pelos arquivos globais.

Aqui está o código HTML completo e **corrigido** para a Classificação ASA. Por favor, use esta versão para atualizar seu arquivo `asa.html`.


```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Classificação ASA - Avaliação de Risco Perioperatório - Calculadoras de Enfermagem</title>

    <link rel="canonical" href="[https://www.calculadorasdeenfermagem.com.br/asa.html](https://www.calculadorasdeenfermagem.com.br/asa.html)" />
    <link rel="icon" href="favicon.ico" type="image/x-icon" />

    <meta name="description" content="Calcule a Classificação ASA (American Society of Anesthesiologists) para avaliar o risco perioperatório de pacientes. Ferramenta essencial para enfermeiros e anestesiologistas na segurança do paciente." />
    <meta name="keywords" content="ASA, Classificação ASA, American Society of Anesthesiologists, risco perioperatório, risco anestésico, enfermagem, anestesiologia, segurança do paciente, escore de risco" />

    <!-- Open Graph / Social Media Meta Tags -->
    <meta property="og:title" content="Classificação ASA - Avaliação de Risco Perioperatório - Calculadoras de Enfermagem" />
    <meta property="og:description" content="Calcule a Classificação ASA (American Society of Anesthesiologists) para avaliar o risco perioperatório de pacientes. Ferramenta essencial para enfermeiros e anestesiologistas na segurança do paciente." />
    <meta property="og:url" content="[https://www.calculadorasdeenfermagem.com.br/asa.html](https://www.calculadorasdeenfermagem.com.br/asa.html)" />
    <meta property="og:image" content="[https://www.calculadorasdeenfermagem.com.br/iconpages.webp](https://www.calculadorasdeenfermagem.com.br/iconpages.webp)" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Classificação ASA - Avaliação de Risco Perioperatório - Calculadoras de Enfermagem" />
    <meta name="twitter:description" content="Calcule a Classificação ASA (American Society of Anesthesiologists) para avaliar o risco perioperatório de pacientes. Ferramenta essencial para enfermeiros e anestesiologistas na segurança do paciente." />
    <meta name="twitter:image" content="[https://www.calculadorasdeenfermagem.com.br/assets/iconpages.webp](https://www.calculadorasdeenfermagem.com.br/assets/iconpages.webp)" />

    <!-- Preconnect & Fonts -->
    <link rel="preconnect" href="[https://cdn.jsdelivr.net](https://cdn.jsdelivr.net)">
    <link rel="preconnect" href="[https://fonts.googleapis.com](https://fonts.googleapis.com)">
    <link rel="preconnect" href="[https://fonts.gstatic.com](https://fonts.gstatic.com)" crossorigin>
    <link rel="preconnect" href="[https://vlibras.gov.br](https://vlibras.gov.br)">
    <script src="[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)"></script>
    <link href="[https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&family=Inter:wght@400;700&display=swap](https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&family=Inter:wght@400;700&display=swap)" rel="stylesheet">
    <link rel="stylesheet" href="[https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css)">
    <link rel="stylesheet" href="[https://cdn.jsdelivr.net/gh/antijingoist/opendyslexic/web/opendyslexic.css](https://cdn.jsdelivr.net/gh/antijingoist/opendyslexic/web/opendyslexic.css)" />

    <!-- Google Analytics & Consent Mode -->
    <script async src="[https://www.googletagmanager.com/gtag/js?id=AW-952633102](https://www.googletagmanager.com/gtag/js?id=AW-952633102)"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'wait_for_update': 500 // Espera 500ms por uma atualização do consentimento
        });
        gtag('config', 'AW-952633102');
        gtag('config', 'G-8FLJ59XXDK');
    </script>

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "[https://schema.org](https://schema.org)",
      "@type": "MedicalEntity",
      "name": "Classificação ASA",
      "url": "[https://www.calculadorasdeenfermagem.com.br/asa.html](https://www.calculadorasdeenfermagem.com.br/asa.html)",
      "description": "Calculadora da Classificação ASA para avaliar o risco perioperatório de pacientes.",
      "alternateName": ["ASA Score", "Risco Anestésico ASA"]
    }
    </script>

    <!-- SEU NOVO ARQUIVO CSS PRINCIPAL -->
    <link rel="stylesheet" href="global-styles.css">

    <!-- Estilos específicos desta página (se houver e não estiverem no global-styles.css) -->
    <style>
        /* Cores de resultado ajustadas para ASA */
        .resultado.bg-asa-normal { background-color: #D4EDDA; color: #006400; } /* Verde para ASA I e II */
        .resultado.bg-asa-moderado { background-color: #FFF3CD; color: #856404; } /* Amarelo para ASA III */
        .resultado.bg-asa-grave { background-color: #F8D7DA; color: #8B0000; } /* Vermelho para ASA IV, V, VI */
        /* .resultado.bg-info-orange-light é global agora */

        /* Container de cada critério */
        .criterion-section {
            background-color: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.75rem 1rem; /* Ajuste de padding */
            margin-bottom: 1rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        /* Grupo de opções (radio buttons) */
        .options-group {
            display: flex;
            flex-direction: column; /* Mobile-first: empilha as opções verticalmente */
            gap: 0.5rem; /* Espaçamento entre as opções */
        }

        /* Label de cada opção (torna-a clicável e flexível) */
        .option-label {
            display: flex;
            align-items: flex-start; /* Alinha o texto no topo se for longo */
            font-size: 1rem;
            color: #374151;
            cursor: pointer;
            padding: 0.25rem 0; /* Aumenta a área de clique */
            border-radius: 6px;
            transition: background-color 0.2s ease;
        }
        .option-label:hover {
            background-color: #f3f4f6;
        }
        .option-label input[type="radio"] {
            margin-right: 0.75rem;
            transform: scale(1.1);
            flex-shrink: 0;
            accent-color: #1A3E74;
            margin-top: 0.25rem; /* Alinha o radio com o início do texto */
        }

        /* Media query para telas médias (tablets e desktops pequenos) */
        @media (min-width: 640px) {
            .options-group {
                flex-direction: column; /* Para ASA, mantemos coluna para as descrições longas */
            }
            .option-label {
                flex-basis: auto; /* Deixa o tamanho ser automático */
            }
        }
    </style>
</head>
<body class="bg-gray-50 text-gray-800 font-inter">

    <!-- 🌐 Skip Links (invisíveis, aparecem ao focar via Tab) -->
    <nav aria-label="Atalhos de Acessibilidade" class="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50 focus-within:bg-white focus-within:text-blue-700 focus-within:p-4 focus-within:underline">
        <a href="/" accesskey="I" class="block mb-2">Ir para o Início [<span lang="en">Alt</span> + <span lang="en">Shift</span> + <span lang="en">I</span>]</a>
        <a href="#main-content" accesskey="C" class="block mb-2">Pular para o conteúdo principal [<span lang="en">Alt</span> + <span lang="en">Shift</span> + <span lang="en">C</span>]</a>
        <a href="#barraAcessibilidade" accesskey="A" class="block mb-2">Ativar barra de acessibilidade [<span lang="en">Alt</span> + <span lang="en">Shift</span> + <span lang="en">A</span>]</a>
        <a href="#backToTopBtn" accesskey="T" class="block">Voltar ao Topo da Página [<span lang="en">Alt</span> + <span lang="en">Shift</span> + <span lang="en">T</span>]</a>
    </nav>

    <!-- ARIA Live Region for Status Messages -->
    <div id="statusMessage" class="sr-only" aria-live="polite" aria-atomic="true"></div>

    <!-- Accessibility Bar (Desktop) -->
    <div id="barraAcessibilidade" class="desktop-only flex justify-end items-center space-x-2">
        <button id="btnAlternarTamanhoFonte" aria-label="Alterar tamanho da fonte">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-type"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
            <span id="fontSizeText">Normal</span>
        </button>
        <button id="btnAlternarEspacamentoLinha" aria-label="Alterar espaçamento de linha">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-align-justify"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
            <span id="lineHeightText">Médio</span>
        </button>
        <button id="btnAlternarEspacamentoLetra" aria-label="Alterar espaçamento de letra">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text-spacing"><path d="M10 12H3"/><path d="M21 12h-7"/><path d="M12 20V4"/></svg>
            <span id="letterSpacingText">Normal</span>
        </button>
        <button id="btnAlternarVelocidadeLeitura" aria-label="Alterar velocidade de leitura">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gauge"><path d="M12 14v4"/><path d="M12 2a10 10 0 0 0-9.8 12.3 4 4 0 0 0 5.7 5.7A10 10 0 0 0 22 12Z"/></svg>
            <span id="readingSpeedText">Normal</span>
        </button>
        <button id="btnToggleLeitura" aria-label="Reproduzir/Pausar leitura do conteúdo principal">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span class="sr-only" id="toggleLeituraText">Reproduzir Leitura</span>
        </button>
        <button id="btnReiniciarLeitura" aria-label="Reiniciar leitura do conteúdo principal">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.76 2.75L3 8"/><path d="M3 3v5h5"/></svg>
            <span class="sr-only">Reiniciar Leitura</span>
        </button>
        <button id="btnReadFocused" aria-label="Ler elemento focado">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M22.42 1.42a15 15 0 0 1 0 21.16"/></svg>
            <span class="sr-only">Ler Foco</span>
        </button>
        <button id="btnAlternarContraste" aria-label="Alternar alto contraste" aria-pressed="false">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-contrast"><circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/></svg>
            <span class="sr-only">Contraste</span>
        </button>
        <button id="btnAlternarModoEscuro" aria-label="Alternar modo escuro" aria-pressed="false">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            <span class="sr-only">Modo Escuro</span>
        </button>
        <button id="btnAlternarFonteDislexia" aria-label="Alternar fonte para dislexia">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-type"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
            <span class="sr-only">Fonte Dislexia</span>
        </button>
        <div class="flex space-x-1" role="radiogroup" aria-label="Cor de foco de acessibilidade">
            <button class="color-option" style="background-color: yellow;" data-color="yellow" aria-label="Cor de foco amarela"></button>
            <button class="color-option" style="background-color: lime;" data-color="lime" aria-label="Cor de foco verde-limão"></button>
            <button class="color-option" style="background-color: cyan;" data-color="cyan" aria-label="Cor de foco ciano"></button>
            <button class="color-option" style="background-color: magenta;" data-color="magenta" aria-label="Cor de foco magenta"></button>
        </div>
        <button id="btnKeyboardShortcuts" aria-label="Atalhos de Teclado">
            <i class="fas fa-keyboard" aria-hidden="true"></i>
            <span class="sr-only">Atalhos de Teclado</span>
        </button>
        <button id="btnResetarAcessibilidade" aria-label="Redefinir configurações de acessibilidade">
            <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.76 2.75L3 8"/><path d="M3 3v5h5"/></svg>
            <span class="sr-only">Redefinir</span>
        </button>
    </div>

    <!-- Accessibility Toggle Button (PWA/Mobile) -->
    <button id="accessibilityToggleButton" class="accessibility-toggle-button pwa-only" aria-label="Alternar barra de acessibilidade">
        <i class="fa fa-universal-access text-2xl" style="color: white;"></i>
    </button>

    <!-- PWA Accessibility Bar (Mobile) -->
    <div id="pwaAcessibilidadeBar" class="pwa-only">
        <!-- Submenu Controle de Fonte -->
        <div class="pwa-submenu">
            <button type="button" class="pwa-submenu-header" data-submenu="font-control" aria-expanded="false" aria-controls="font-control-submenu" aria-label="Controle de Fonte">
                Controle de Fonte
                <i class="fa fa-chevron-right text-xs ml-2" aria-hidden="true"></i>
            </button>
            <div id="font-control-submenu" class="pwa-submenu-content">
                <button id="btnAlternarTamanhoFontePWA" aria-label="Alterar tamanho da fonte">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-type"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
                    <span id="fontSizeTextPWA">Normal</span>
                </button>
                <button id="btnAlternarEspacamentoLinhaPWA" aria-label="Alterar espaçamento de linha">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-align-justify"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
                    <span id="lineHeightTextPWA">Médio</span>
                </button>
                <button id="btnAlternarEspacamentoLetraPWA" aria-label="Alterar espaçamento de letra">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text-spacing"><path d="M10 12H3"/><path d="M21 12h-7"/><path d="M12 20V4"/></svg>
                    <span id="letterSpacingTextPWA">Normal</span>
                </button>
                <button id="btnAlternarFonteDislexiaPWA" aria-label="Alternar fonte para dislexia">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-type"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
                    <span class="sr-only">Fonte Dislexia</span>
                </button>
            </div>
        </div>

        <!-- Submenu Controle de Cor -->
        <div class="pwa-submenu">
            <button type="button" class="pwa-submenu-header" data-submenu="color-control" aria-expanded="false" aria-controls="color-control-submenu" aria-label="Controle de Cor">
                Controle de Cor
                <i class="fa fa-chevron-right text-xs ml-2" aria-hidden="true"></i>
            </button>
            <div id="color-control-submenu" class="pwa-submenu-content">
                <button id="btnAlternarContrastePWA" aria-label="Alternar alto contraste" aria-pressed="false">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-contrast"><circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/></svg>
                    <span class="sr-only">Contraste</span>
                </button>
                <button id="btnAlternarModoEscuroPWA" aria-label="Alternar modo escuro" aria-pressed="false">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                    <span class="sr-only">Modo Escuro</span>
                </button>
                <div class="flex space-x-1" role="radiogroup" aria-label="Cor de foco de acessibilidade">
                    <button class="color-option" style="background-color: yellow;" data-color="yellow" aria-label="Cor de foco amarela"></button>
                    <button class="color-option" style="background-color: lime;" data-color="lime" aria-label="Cor de foco verde-limão"></button>
                    <button class="color-option" style="background-color: cyan;" data-color="cyan" aria-label="Cor de foco ciano"></button>
                    <button class="color-option" style="background-color: magenta;" data-color="magenta" aria-label="Cor de foco magenta"></button>
                </div>
            </div>
        </div>

        <!-- Submenu Navegação -->
        <div class="pwa-submenu">
            <button type="button" class="pwa-submenu-header" data-submenu="navigation-control" aria-expanded="false" aria-controls="navigation-control-submenu" aria-label="Navegação">
                Navegação
                <i class="fa fa-chevron-right text-xs ml-2" aria-hidden="true"></i>
            </button>
            <div id="navigation-control-submenu" class="pwa-submenu-content">
                <button id="btnAlternarVelocidadeLeituraPWA" aria-label="Alterar velocidade de leitura">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gauge"><path d="M12 14v4"/><path d="M12 2a10 10 0 0 0-9.8 12.3 4 4 0 0 0 5.7 5.7A10 10 0 0 0 22 12Z"/></svg>
                    <span id="readingSpeedTextPWA">Normal</span>
                </button>
                <button id="btnToggleLeituraPWA" aria-label="Reproduzir/Pausar leitura do conteúdo principal">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span class="sr-only" id="toggleLeituraTextPWA">Reproduzir Leitura</span>
                </button>
                <button id="btnReiniciarLeituraPWA" aria-label="Reiniciar leitura do conteúdo principal">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.76 2.75L3 8"/><path d="M3 3v5h5"/></svg>
                    <span class="sr-only">Reiniciar Leitura</span>
                </button>
                <button id="btnReadFocusedPWA" aria-label="Ler elemento focado">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M22.42 1.42a15 15 0 0 1 0 21.16"/></svg>
                    <span class="sr-only">Ler Foco</span>
                </button>
                <button id="btnKeyboardShortcutsPWA" aria-label="Atalhos de Teclado">
                    <i class="fas fa-keyboard" aria-hidden="true"></i>
                    <span class="sr-only">Atalhos de Teclado</span>
                </button>
            </div>
        </div>

        <!-- Submenu Resetar -->
        <div class="pwa-submenu">
            <button type="button" class="pwa-submenu-header" data-submenu="reset-control" aria-expanded="false" aria-controls="reset-control-submenu" aria-label="Resetar Configurações">
                Resetar
                <i class="fa fa-chevron-right text-xs ml-2" aria-hidden="true"></i>
            </button>
            <div id="reset-control-submenu" class="pwa-submenu-content">
                <button id="btnResetarAcessibilidadePWA" aria-label="Redefinir configurações de acessibilidade">
                    <svg aria-hidden="true" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.76 2.75L3 8"/><path d="M3 3v5h5"/></svg>
                    <span class="sr-only">Redefinir</span>
                </button>
            </div>
        </div>
    </div>

    <!-- VLibras Widget (will be injected by script) -->
    <div vw class="enabled">
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper>
            <div class="vw-plugin-top-wrapper"></div>
        </div>
    </div>

    <!-- Back to Top button -->
    <button id="backToTopBtn" aria-label="Voltar ao topo da página" accesskey="T">
        Voltar ao Topo
    </button>

    <!-- Custom Modal (para mensagens showCustomModal) -->
    <div id="customModal" class="modal-overlay hidden" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="modalMessageTitle">
        <div class="modal-content">
            <button class="modal-close-btn" id="modalCloseButton" aria-label="Fechar mensagem">×</button>
            <h3 id="modalMessageTitle" class="sr-only">Mensagem do Sistema</h3>
            <p id="modalMessage" class="text-gray-800 text-lg mb-4"></p>
        </div>
    </div>

    <!-- Granular Cookie Consent Modal -->
    <div id="granularCookieModal" class="modal-overlay hidden" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="granularModalTitle">
        <div class="granular-modal-content">
            <button class="modal-close-btn" id="granularModalCloseButton" aria-label="Fechar configurações de cookies">×</button>
            <h3 id="granularModalTitle">Configurações de Privacidade</h3>
            <p>Utilizamos cookies para garantir o funcionamento do nosso site e para personalizar o conteúdo. Você pode ajustar suas preferências abaixo:</p>

            <div class="checkbox-group">
                <label for="cookieEssential">
                    <input type="checkbox" id="cookieEssential" checked disabled aria-describedby="descEssential">
                    Essenciais
                </label>
                <span id="descEssential" class="description">Necessários para o funcionamento básico do site (ex: navegação, carrinho de compras). Não podem ser desativados.</span>
            </div>

            <div class="checkbox-group">
                <label for="cookieAnalytics">
                    <input type="checkbox" id="cookieAnalytics" aria-describedby="descAnalytics">
                    Analíticos
                </label>
                <span id="descAnalytics" class="description">Coletam informações sobre como você usa o site para nos ajudar a melhorar.</span>
            </div>

            <div class="checkbox-group">
                <label for="cookieMarketing">
                    <input type="checkbox" id="cookieMarketing" aria-describedby="descMarketing">
                    Marketing
                </label>
                <span id="descMarketing" class="description">Usados para exibir anúncios relevantes com base nos seus interesses.</span>
            </div>

            <div class="modal-buttons">
                <button id="saveGranularPreferencesBtn" class="btn-save">Salvar Preferências</button>
                <button id="cancelGranularPreferencesBtn" class="btn-cancel">Cancelar</button>
            </div>
        </div>
    </div>

    <!-- Keyboard Shortcuts Modal -->
    <div id="keyboardShortcutsModal" class="modal-overlay hidden" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="keyboardModalTitle">
        <div class="keyboard-modal-content">
            <button class="modal-close-btn" id="keyboardModalCloseButton" aria-label="Fechar atalhos de teclado">×</button>
            <h3 id="keyboardModalTitle">Atalhos de Teclado e Navegação</h3>
            <p class="mb-4">Utilize as seguintes combinações de teclas para acessar rapidamente as funcionalidades de acessibilidade:</p>
            <ul>
                <li><strong>Alt + Shift + I:</strong> Ir para o Início (Home)</li>
                <li><strong>Alt + Shift + T:</strong> Voltar ao Topo da Página</li>
            </ul>
            <h4 class="font-bold mb-2 mt-4">Navegação Geral por Teclado</h4>
            <ul>
                <li><strong>Tab:</strong> Move o foco entre elementos interativos (links, botões, formulários)</li>
                <li><strong>Shift + Tab:</strong> Volta ao elemento anterior</li>
                <li><strong>Enter:</strong> Ativa links ou botões</li>
                <li><strong>Esc:</strong> Fecha menus, modais ou pop-ups</li>
                <li><strong>Setas (↑ ↓ ← →):</strong> Navegação em listas, menus e sliders</li>
                <li><strong>"Pular para o conteúdo principal":</strong> Pressione <strong>Tab</strong> ao carregar a página</li>
            </ul>
        </div>
    </div>

    <!-- Container para o menu superior (header) que será carregado dinamicamente -->
    <div id="global-header-container"></div>

    <main id="main-content" class="flex-grow p-8 text-center">
        <div class="main-content-wrapper">
            <main class="max-w-4xl mx-auto px-4 py-8">
                <!-- Breadcrumb -->
                <nav class="breadcrumb" aria-label="breadcrumb">
                    <ol>
                        <li><a href="index.html">Início</a></li>
                        <li><a href="#">Calculadoras</a></li>
                        <li>Classificação ASA</li>
                    </ol>
                </nav>

                <div class="flex flex-col items-center justify-center gap-4 mb-3 text-center">
                    <img src="iconpages.png" alt="Ícone da Classificação ASA" class="w-32 h-auto" />
                    <h1 id="main-title" class="font-nunito font-extrabold text-dark-blue text-4xl lg:text-5xl">
                        Classificação ASA
                    </h1>
                </div>
                <!-- Bar below the title -->
                <div class="title-bar"></div>

                <h2 id="main-subtitle" class="font-inter font-semibold text-light-blue text-xl lg:text-2xl mb-3 text-center sm:text-left">
                    Avaliação de Risco Perioperatório/Anestésico
                </h2>
                <p class="font-inter font-normal text-black-custom text-base lg:text-lg mb-6 text-center sm:text-left">
                    A classificação ASA (American Society of Anesthesiologists) é uma conduta estabelecida pelo médico anestesista na consulta pré anestésica; a equipe de enfermagem cabe atentar-se ao grau de risco ASA e estar sempre preparado para situações complexas que exijam destreza e qualidade na assistência ao paciente no bloco operatório.
                </p>
                <p class="font-inter font-normal text-light-blue text-base lg:text-lg mb-6 text-center sm:text-left">
                    Selecione o escore correspondente à condição do paciente:
                </p>

                <div id="conteudo">
                    <div class="criterion-section">
                        <label for="asa1" class="option-label">
                            <input type="radio" name="asa" value="ASA I: Paciente Estável, sem doença orgânica, fisiológica, bioquímica ou psiquiátrica." id="asa1">
                            <strong>ASA I</strong>: Paciente Estável, sem doença orgânica, fisiológica, bioquímica ou psiquiátrica.
                        </label>
                    </div>
                    <div class="criterion-section">
                        <label for="asa2" class="option-label">
                            <input type="radio" name="asa" value="ASA II: Paciente com doença sistêmica leve e/ou controlada (ex: HAS controlada, DM controlado)." id="asa2">
                            <strong>ASA II</strong>: Paciente com doença sistêmica leve e/ou controlada (ex: HAS controlada, DM controlado).
                        </label>
                    </div>
                    <div class="criterion-section">
                        <label for="asa3" class="option-label">
                            <input type="radio" name="asa" value="ASA III: Paciente com doença sistêmica moderada a grave, sem incapacidade total (ex: DPOC, angina)." id="asa3">
                            <strong>ASA III</strong>: Paciente com doença sistêmica moderada a grave, sem incapacidade total (ex: DPOC, angina).
                        </label>
                    </div>
                    <div class="criterion-section">
                        <label for="asa4" class="option-label">
                            <input type="radio" name="asa" value="ASA IV: Paciente com doença sistêmica grave que representa ameaça constante à vida." id="asa4">
                            <strong>ASA IV</strong>: Paciente com doença sistêmica grave que representa ameaça constante à vida.
                        </label>
                    </div>
                    <div class="criterion-section">
                        <label for="asa5" class="option-label">
                            <input type="radio" name="asa" value="ASA V: Paciente de vaga zero cirurgica (Risco iminente de morte)." id="asa5">
                            <strong>ASA V</strong>: Paciente de vaga zero cirurgica (Risco iminente de morte).
                        </label>
                    </div>
                    <div class="criterion-section">
                        <label for="asa6" class="option-label">
                            <input type="radio" name="asa" value="ASA VI: Paciente com morte encefálica, aguardando equipe de OPO." id="asa6">
                            <strong>ASA VI</strong>: Paciente com morte encefálica, aguardando equipe de OPO.
                        </label>
                    </div>

                    <div id="resultado" class="resultado hidden" aria-live="polite"></div>

                    <div class="ref font-inter text-gray-custom text-left">
                        <p class="font-bold mb-2">Referência Bibliográfica:</p>
                        <p>
                            Sociedade de Anestesiologia do Estado de São Paulo. Sistema de classificação de estado físico. Disponível em:
                            <a href="[https://saesp.org.br/wp-content/uploads/Sistema-de-classificacao-de-estado-fisico.pdf](https://saesp.org.br/wp-content/uploads/Sistema-de-classificacao-de-estado-fisico.pdf)" target="_blank" rel="noopener noreferrer" class="text-light-blue hover:underline">
                                [https://saesp.org.br/wp-content/uploads/Sistema-de-classificacao-de-estado-fisico.pdf](https://saesp.org.br/wp-content/uploads/Sistema-de-classificacao-de-estado-fisico.pdf)
                            </a>
                        </p>
                    </div>
                </div>

                <div class="flex flex-wrap justify-start gap-4 mt-6">
                    <button id="btnCalcular" class="btn-primary" aria-label="Calcular classificação">
                        Calcular
                    </button>
                    <button id="btnLimpar" class="btn-primary" aria-label="Limpar seleção">
                        Limpar
                    </button>
                    <button id="btnGerarPDF" class="btn-secondary" aria-label="Gerar PDF">
                        Gerar PDF
                    </button>
                    <!-- BOTÃO NANDA, NIC, NOC -->
                    <button id="btnNandaNicNoc" class="btn-primary" aria-label="Pesquisar NANDA, NIC, NOC">
                        NANDA, NIC, NOC
                    </button>
                </div>
            </main>
        </div>

        <!-- Newsletter Section -->
        <form id="newsletters-section" action="[https://formspree.io/f/movlvvzp](https://formspree.io/f/movlvvzp)" method="POST" role="form" aria-label="Assinar Newsletter" class="max-w-7xl mx-auto px-4">
            <h4 class="newsletter-heading">Assine nossa <span lang="en">Newsletter</span></h4>
            <p class="newsletter-description">Receba as últimas notícias, artigos e atualizações diretamente na sua caixa de entrada!</p>
            <div class="newsletter-form-container">
                <label for="email" class="block text-black-custom text-lg font-medium py-2 text-left">
                    E-mail:
                    <span class="tooltip-container">
                        <button type="button" class="tooltip-icon-button" aria-label="Informações sobre o e-mail" aria-describedby="tooltip-email">
                            <i class="fas fa-info-circle" aria-hidden="true"></i>
                        </button>
                        <span id="tooltip-email" class="tooltip-text" role="tooltip">Digite um endereço de e-mail válido para receber atualizações.</span>
                    </span>
                </label>
                <div class="newsletter-email-input-wrapper">
                    <input type="email" id="email" name="email" placeholder="Seu e-mail" class="newsletter-email-input" autocomplete="email" required aria-describedby="erro-email ajuda-email tooltip-email">
                    <span id="erro-email" class="newsletter-error-message" aria-live="assertive" tabindex="-1"></span>
                    <span id="ajuda-email" class="sr-only">Digite um endereço de e-mail válido para receber atualizações.</span>
                </div>

                <div class="newsletter-consent-and-button-group flex flex-col md:flex-row md:justify-end md:items-center gap-4 mt-4 md:mt-0">
                    <div class="newsletter-consent-checkbox-group flex items-center justify-start w-full md:w-auto">
                        <input type="checkbox" id="newsletterConsent" name="consent" class="newsletter-consent-checkbox" required aria-describedby="consent-tip">
                        <label for="newsletterConsent" class="newsletter-consent-label ml-2">Aceito receber informações e atualizações sobre o Calculadoras de Enfermagem.</label>
                        <span id="consent-tip" class="sr-only">Marque esta caixa para concordar em receber informações e atualizações.</span>
                    </div>
                    <button type="submit" id="subscribeNewsletterBtn" class="newsletter-subscribe-button" aria-label="Assinar newsletter" disabled>Assinar</button>
                </div>
            </div>
        </form>
    </main>

    <!-- Rodapé integrado diretamente -->
    <footer class="bg-[#1A3E74] text-white py-8">
        <div class="max-w-7xl mx-auto px-4">
            <div class="border-b border-white pb-4 mb-4">
                <div class="flex justify-start items-center">
                    <img src="[https://www.calculadorasdeenfermagem.com.br/iconrodape1.webp](https://www.calculadorasdeenfermagem.com.br/iconrodape1.webp)" alt="Logotipo Calculadoras de Enfermagem no rodapé: um estetoscópio e um coração dentro de um círculo azul." width="120" height="84" class="h-auto w-auto max-w-[80px] max-h-[80px]" loading="lazy" decoding="async">
                </div>
            </div>

            <div class="md:flex md:justify-between md:items-start md:space-x-8 md:items-stretch">
                <div class="mb-6 md:mb-0">
                    <h5 class="font-bold mb-2">Institucional</h5>
                    <ul class="list-none space-y-1">
                        <li><a href="index.html" class="text-white hover:underline">Início</a></li>
                        <li><a href="missao.html" class="text-white hover:underline">Sobre Nós</a></li>
                        <li><a href="mapa-do-site.html" class="text-white hover:underline">Mapa do <span lang="en">Site</span></a></li>
                        <li><a href="politica.html" class="text-white hover:underline">Políticas de <span lang="en">Cookies</span></a></li>
                        <li><a href="politica.html" class="text-white hover:underline">Política de Retenção de dados</a></li>
                        <li><a href="politica.html" class="text-white hover:underline"><abbr lang="en" title="Lei Geral de Proteção de Dados">LGPD</abbr></a></li>
                        <li><a href="politica.html" class="text-white hover:underline">Políticas de Privacidade</a></li>
                        <li><a href="termos.html" class="text-white hover:underline">Termos e Condições de Uso</a></li>
                        <li><a href="politicadeacessibilidade.html" class="text-white hover:underline">Política de Acessibilidade</a></li>
                    </ul>
                </div>

                <div class="mb-6 md:mb-0">
                    <h5 class="font-bold mb-2">Sustentabilidade Digital</h5>
                    <ul class="list-none space-y-1">
                        <li><a href="nossocompromisso.html" class="text-white hover:underline">Nosso Compromisso</a></li>
                        <li><a href="impactodigital.html" class="text-white hover:underline">Relatório de Impacto</a></li>
                        <li><a href="tecnologiaverde.html" class="text-white hover:underline">Tecnologia Verde</a></li>
                    </ul>
                </div>

                <div class="mb-6 md:mb-0">
                    <h5 class="font-bold mb-2">Nosso Compromisso</h5>
                    <p class="text-white text-sm mb-2 max-w-sm md:max-w-xs">Nosso <span lang="en">site</span> adota como princípio de governança, o comprometimento com elevados padrões de acessibilidade digital, sustentabilidade digital e proteção de dados, em conformidade com as melhores práticas e diretrizes vigentes.</p>
                    <div class="flex space-x-4 items-center justify-start">
                        <img src="[https://www.calculadorasdeenfermagem.com.br/seloacessibilidade.webp](https://www.calculadorasdeenfermagem.com.br/seloacessibilidade.webp)" alt="Selo de Acessibilidade, representando acessibilidade digital." width="100" height="100" class="w-auto h-auto max-w-[80px] max-h-[80px]" loading="lazy" decoding="async">
                        <img src="[https://www.calculadorasdeenfermagem.com.br/selosustentabilidade.webp](https://www.calculadorasdeenfermagem.com.br/selosustentabilidade.webp)" alt="Selo de Sustentabilidade, representando sustentabilidade digital." width="100" height="100" class="w-auto h-auto max-w-[80px] max-h-[80px]" loading="lazy" decoding="async">
                        <img src="[https://www.calculadorasdeenfermagem.com.br/selolgpd.webp](https://www.calculadorasdeenfermagem.com.br/selolgpd.webp)" alt="Selo LGPD, representando a Lei Geral de Proteção de Dados." width="100" height="100" class="w-auto h-auto max-w-[80px] max-h-[80px]" loading="lazy" decoding="async">
                    </div>
                </div>

                <div class="flex flex-1 flex-col md:flex-row justify-end items-start md:items-start">
                    <div class="vertical-divider-footer-stretched hidden md:block"></div>
                    <div class="flex flex-col items-start space-y-4">
                        <h5 class="font-bold mb-2">Siga-nos</h5>
                        <div class="flex space-x-4">
                            <a href="[https://linkedin.com/company/calculadoras-de-enfermagem](https://linkedin.com/company/calculadoras-de-enfermagem)" target="_blank" class="footer-social-icon" title="LinkedIn" aria-label="Acesse Nosso Perfil no LinkedIn">
                                <i class="fab fa-linkedin text-xl"></i> <span class="sr-only">Acesse Nosso Perfil no <span lang="en">LinkedIn</span></span>
                            </a>
                            <a href="[https://www.instagram.com/calculadorasdeenfermagem/](https://www.instagram.com/calculadorasdeenfermagem/)" target="_blank" class="footer-social-icon" title="Instagram" aria-label="Acesse Nosso Perfil no Instagram">
                                <i class="fab fa-instagram text-xl"></i> <span class="sr-only">Acesse Nosso Perfil no <span lang="en">Instagram</span></span>
                            </a>
                            <a href="[https://www.tiktok.com/@calculadorasdeenf?_t=ZM-8y94b3VAz2M&_r=1](https://www.tiktok.com/@calculadorasdeenf?_t=ZM-8y94b3VAz2M&_r=1)" target="_blank" class="footer-social-icon" title="TikTok" aria-label="Acesse Nosso Perfil no TikTok">
                                <i class="fab fa-tiktok text-xl"></i> <span class="sr-only">Acesse Nosso Perfil no <span lang="en">Tik Tok</span></span>
                            </a>
                            <a href="[https://www.youtube.com/channel/UC_6runTDHz8u5S1Yab842pg](https://www.youtube.com/channel/UC_6runTDHz8u5S1Yab842pg)" target="_blank" class="footer-social-icon" title="YouTube" aria-label="Acesse Nosso Perfil no YouTube">
                                <i class="fab fa-youtube text-xl"></i> <span class="sr-only">Acesse Nosso Perfil no <span lang="en">Youtube</span></span>
                            </a>
                        </div>
                        <button id="openGranularCookieModalBtn" class="btn-secondary text-white mt-4 py-2 px-4 rounded-md" aria-label="Gerenciar Preferências de Cookies">
                            Gerenciar Preferências de Cookies
                        </button>
                    </div>
                </div>
            </div>

            <div class="mt-8 text-center">
                <p>© 2025 Calculadoras de Enfermagem. Todos os direitos reservados.</p>
            </div>
        </div>
    </footer>

    <!-- Cookie Consent Banner -->
    <div id="cookieConsentBanner">
        <p>Utilizamos <span lang="en">cookies</span> para melhorar sua experiência em nosso <span lang="en">site</span>. Ao continuar navegando, você concorda com nossa <a href="politica.html" class="underline text-blue-200 hover:text-blue-100" aria-label="Política de Cookies">Política de <span lang="en">Cookies</span></a> e <a href="politica.html" class="underline text-blue-200 hover:text-100" aria-label="Política de Privacidade">Política de Privacidade</a>.</p>
        <div class="cookie-buttons">
            <button id="acceptAllCookiesBtn" aria-label="Aceitar todos os cookies">Aceitar todos os <span lang="en">cookies</span></button>
            <button id="manageCookiesBtn" class="secondary" aria-label="Gerenciar suas preferências de cookies">Gerenciar <span lang="en">cookies</span></button>
            <button id="refuseAllCookiesBtn" class="secondary" aria-label="Recusar todos os cookies">Recusar todos os <span lang="en">cookies</span></button>
        </div>
    </div>

    <script src="[https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js](https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js)"></script>
    <!-- Inclua o JavaScript global que contém a lógica das barras de acessibilidade, modais e cookies -->
    <script src="global-scripts.js"></script>
    <!-- Script do VLibras (precisa ser carregado após o global-scripts.js para que o VLibras.Widget esteja disponível) -->
    <script src="[https://vlibras.gov.br/app/vlibras-plugin.js](https://vlibras.gov.br/app/vlibras-plugin.js)"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Inicialização do VLibras (agora no global-scripts.js, mas mantemos a chamada aqui para garantir)
            new VLibras.Widget('[https://vlibras.gov.br/app](https://vlibras.gov.br/app)');

            // Lógica para carregar o cabeçalho global
            fetch('menu-global.html')
                .then(response => response.text())
                .then(html => {
                    const container = document.getElementById('global-header-container');
                    if (container) {
                        container.innerHTML = html;
                        // Chame a função de inicialização do menu após o HTML ser carregado
                        if (typeof initializeGlobalMenu === 'function') {
                            initializeGlobalMenu();
                        }
                    }
                })
                .catch(error => console.error('Erro ao carregar o menu global:', error));

            const resultadoDiv = document.getElementById('resultado');
            const btnNandaNicNoc = document.getElementById('btnNandaNicNoc');

            function calcular() {
                const radios = document.getElementsByName("asa");
                let selectedFullValue = "";
                let selectedClassification = "";
                let selected = false;

                resultadoDiv.innerHTML = '';
                resultadoDiv.className = 'resultado';
                resultadoDiv.style.display = 'none';

                for (let i = 0; i < radios.length; i++) {
                    if (radios[i].checked) {
                        selectedFullValue = radios[i].value;
                        const match = selectedFullValue.match(/^(ASA [IVX]+)/);
                        if (match && match[1]) {
                            selectedClassification = match[1];
                        } else {
                            selectedClassification = selectedFullValue.split(':')[0].trim();
                        }
                        selected = true;
                        break;
                    }
                }

                if (!selected) {
                    resultadoDiv.style.display = "block";
                    let errorMessage = '⚠️ <strong class="font-bold">Por favor, selecione um escore para calcular.</strong>';
                    resultadoDiv.innerHTML = errorMessage;
                    resultadoDiv.classList.add('bg-info-orange-light');
                    resultadoDiv.dataset.score = '';
                    resultadoDiv.dataset.scaleName = '';
                    return;
                }

                let resultadoClasse = '';
                if (selectedClassification === "ASA I" || selectedClassification === "ASA II") {
                    resultadoClasse = 'bg-asa-normal';
                } else if (selectedClassification === "ASA III") {
                    resultadoClasse = 'bg-asa-moderado';
                } else { // ASA IV, V, VI
                    resultadoClasse = 'bg-asa-grave';
                }

                resultadoDiv.style.display = "block";
                resultadoDiv.innerHTML = `
                    <p>Classificação selecionada: <strong class="font-bold">${selectedFullValue}</strong></p>
                `;
                resultadoDiv.classList.remove('hidden', 'bg-info-orange-light', 'bg-asa-normal', 'bg-asa-moderado', 'bg-asa-grave');
                resultadoDiv.classList.add(resultadoClasse);

                resultadoDiv.dataset.score = selectedClassification;
                resultadoDiv.dataset.scaleName = "Classificação ASA";
            }

            function limpar() {
                const radios = document.getElementsByName("asa");
                radios.forEach(radio => radio.checked = false);
                resultadoDiv.innerHTML = "";
                resultadoDiv.classList.add('hidden');
                resultadoDiv.classList.remove('bg-info-orange-light', 'bg-asa-normal', 'bg-asa-moderado', 'bg-asa-grave');
                resultadoDiv.dataset.score = '';
                resultadoDiv.dataset.scaleName = '';
            }

            function gerarPDF() {
                if (resultadoDiv.style.display === 'none' || resultadoDiv.innerHTML.trim() === '' || resultadoDiv.classList.contains('bg-info-orange-light')) {
                    window.showCustomModal('Por favor, clique em "Calcular" primeiro para obter um resultado válido antes de gerar o PDF.');
                    return;
                }

                const contentToPrint = document.querySelector('main').cloneNode(true);

                contentToPrint.style.fontSize = '9px';
                contentToPrint.style.lineHeight = '1.1';

                const unwantedSelectors = [
                    '#backToTopBtn',
                    '.flex.flex-wrap.justify-start.gap-4.mt-6',
                    '#newsletters-section'
                ];
                unwantedSelectors.forEach(sel => {
                    const element = contentToPrint.querySelector(sel);
                    if (element) {
                        element.remove();
                    }
                });

                const pdfTitleText = "Classificação ASA";
                const pdfSubtitleText = "Relatório de Avaliação de Risco Perioperatório/Anestésico";
                const headerDiv = document.createElement('div');
                headerDiv.style.cssText = "text-align: center; margin-bottom: 12px; font-family: 'Nunito Sans', sans-serif; color: #1A3E74;";
                headerDiv.innerHTML = `
                    <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 3px;">${pdfTitleText}</h1>
                    <p style="font-size: 10px; color: #666666;">${pdfSubtitleText}</p>
                    <p style="font-size: 8px; color: #777;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
                `;
                contentToPrint.prepend(headerDiv);

                const resultDivForPdf = contentToPrint.querySelector('#resultado');
                if (resultDivForPdf && resultadoDiv.style.display !== 'none' && resultadoDiv.innerHTML.trim() !== '' && !resultadoDiv.classList.contains('bg-info-orange-light')) {
                    resultDivForPdf.innerHTML = resultadoDiv.innerHTML;
                    resultadoDiv.classList.forEach(cls => {
                        if (cls.startsWith('bg-') || cls.startsWith('text-') || cls.startsWith('asa-')) {
                            resultDivForPdf.classList.add(cls);
                        }
                    });
                    resultDivForPdf.style.backgroundColor = getComputedStyle(resultadoDiv).backgroundColor;
                    resultDivForPdf.style.color = getComputedStyle(resultadoDiv).color;
                    resultDivForPdf.style.display = 'block';
                    resultDivForPdf.style.fontSize = '9px';
                    resultDivForPdf.style.lineHeight = '1.1';
                } else if (resultDivForPdf) {
                    resultDivForPdf.innerHTML = "Resultado não calculado na página ou cálculo inválido. Por favor, preencha os campos e clique em 'Calcular' antes de gerar o PDF.";
                    resultDivForPdf.style.backgroundColor = '#ffeeba';
                    resultDivForPdf.style.color = '#856404';
                    resultDivForPdf.style.display = 'block';
                }

                const references = contentToPrint.querySelector('.ref');
                if (references) {
                    references.style.marginTop = '1rem';
                    references.style.fontSize = '8px';
                    references.style.color = '#666666';
                    references.style.textAlign = 'left';
                    references.querySelectorAll('a').forEach(a => {
                        a.style.color = '#004d99';
                        a.style.textDecoration = 'underline';
                    });
                }

                const opt = {
                    margin:       0.1,
                    filename:     'classificacao-asa.pdf',
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 4, scrollY: 0, useCORS: true },
                    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
                };

                html2pdf().set(opt).from(contentToPrint).save().catch(error => {
                    console.error('Erro ao gerar PDF:', error);
                    window.showCustomModal('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
                });
            }

            document.getElementById('btnCalcular').addEventListener('click', calcular);
            document.getElementById('btnLimpar').addEventListener('click', limpar);
            document.getElementById('btnGerarPDF').addEventListener('click', gerarPDF);

            if (btnNandaNicNoc) {
                btnNandaNicNoc.addEventListener('click', () => {
                    const currentClassification = resultadoDiv.dataset.score;
                    const scaleName = resultadoDiv.dataset.scaleName;

                    if (!currentClassification || !scaleName || resultadoDiv.classList.contains('hidden') || resultadoDiv.innerHTML.includes('Por favor, selecione')) {
                        window.showCustomModal('Por favor, clique em "Calcular" primeiro para obter a classificação e habilitar a pesquisa NANDA, NIC, NOC.');
                        return;
                    }

                    const detailedSearchQuery = `${currentClassification} ${scaleName} GERAR diagnosticos de enfermagem da NANDA, GERAR intervenções de enfermagem do NIC, Gerar um exemplo de mensuração dos resultados implementados pelo enfermeiro (NOC)`;
                    const encodedSearchQuery = encodeURIComponent(detailedSearchQuery);

                    window.open(`https://www.google.com/search?q=${encodedSearchQuery}`, '_blank');
                });
            }
        });
    </script>
</body>
</html>
