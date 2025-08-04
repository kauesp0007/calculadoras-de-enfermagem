/**
 * =================================================================================
 * ARQUIVO DE SCRIPTS GLOBAIS - VERSÃO CORRIGIDA E UNIFICADA
 * Este ficheiro contém toda a lógica JavaScript partilhada pelo site.
 * =================================================================================
 */

function gerarPDFGlobal(options) {
    // ... (código da função gerarPDFGlobal inalterado)
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('menu-global.html')
        .then(response => response.ok ? response.text() : Promise.reject('Ficheiro menu-global.html não encontrado'))
        .then(html => {
            const headerContainer = document.getElementById('global-header-container');
            if (headerContainer) {
                headerContainer.innerHTML = html;
                initializeNavigationMenu();
            }
        })
        .catch(error => console.warn('Não foi possível carregar o menu global:', error));

    fetch('global-body-elements.html')
        .then(response => response.ok ? response.text() : Promise.reject('Ficheiro global-body-elements.html não encontrado'))
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            initializeGlobalFunctions();
        })
        .catch(error => console.warn('Não foi possível carregar os elementos globais do corpo:', error));
});

function initializeNavigationMenu() {
    // ... (código da função initializeNavigationMenu inalterado)
}

function inicializarTooltips() {
    // ... (código da função inicializarTooltips inalterado)
}

function initializeGlobalFunctions() {
    // Força a exibição dos elementos de desktop que podem estar sendo escondidos pelo CSS
    function forceDesktopView() {
        if (window.innerWidth > 1024) {
            const accessibilityBar = document.getElementById('barraAcessibilidade');
            if (accessibilityBar) accessibilityBar.style.display = 'flex';
            
            const desktopNav = document.querySelector('nav.desktop-nav');
            if (desktopNav) desktopNav.style.display = 'flex';
        }
    }
    forceDesktopView();
    window.addEventListener('resize', forceDesktopView);

    const body = document.body;
    const statusMessageDiv = document.createElement('div');
    statusMessageDiv.setAttribute('aria-live', 'polite');
    statusMessageDiv.className = 'sr-only';
    body.appendChild(statusMessageDiv);

    // --- Seletores e Variáveis de Estado ---
    const fontSizeText = document.getElementById('fontSizeText');
    const lineHeightText = document.getElementById('lineHeightText');
    const letterSpacingText = document.getElementById('letterSpacingText');
    const readingSpeedText = document.getElementById('readingSpeedText');
    const accessibilityToggleButton = document.getElementById('accessibilityToggleButton');
    const pwaAcessibilidadeBar = document.getElementById('pwaAcessibilidadeBar');
    const pwaAcessibilidadeCloseBtn = document.getElementById('pwaAcessibilidadeCloseBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const offCanvasMenu = document.getElementById('offCanvasMenu');

    let currentFontSize = 1;
    let currentLineHeight = 1;
    let currentLetterSpacing = 1;
    
    // --- Variáveis de Estado para Leitor de Tela (TTS) ---
    let velocidadeLeituraAtual = 1;
    const velocidadesLeitura = [
        { rate: 0.8, label: 'Lenta' },
        { rate: 1, label: 'Normal' },
        { rate: 1.5, label: 'Rápida' },
    ];
    let ultimoElementoFocado = null;
    const synth = window.speechSynthesis;
    let leitorAtivo = false;
    let isPaused = false;
    
    document.addEventListener('focusin', (event) => { ultimoElementoFocado = event.target; });


    // --- Funções de Acessibilidade ---
    function announceStatus(message) {
        statusMessageDiv.textContent = message;
        setTimeout(() => statusMessageDiv.textContent = '', 3000);
    }
    
    // ... (funções updateFontSize, updateLineHeight, updateLetterSpacing, etc. inalteradas) ...
    function updateFontSize(announce = true) {
        const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
        const labels = ['Normal', 'Médio', 'Grande', 'Extra Grande', 'Máximo'];
        const newIndex = (currentFontSize % sizes.length);
        currentFontSize = newIndex + 1;
        body.style.fontSize = sizes[newIndex];
        if (fontSizeText) fontSizeText.textContent = labels[newIndex];
        localStorage.setItem('fontSize', currentFontSize);
        if (announce) announceStatus(`Tamanho da fonte: ${labels[newIndex]}`);
    }

    function updateLineHeight(announce = true) {
        const heights = ['1.5', '1.8', '2.2'];
        const labels = ['Médio', 'Grande', 'Extra Grande'];
        const newIndex = (currentLineHeight % heights.length);
        currentLineHeight = newIndex + 1;
        document.documentElement.style.setProperty('--espacamento-linha', heights[newIndex]);
        if (lineHeightText) lineHeightText.textContent = labels[newIndex];
        localStorage.setItem('lineHeight', currentLineHeight);
        if (announce) announceStatus(`Espaçamento de linha: ${labels[newIndex]}`);
    }

    function updateLetterSpacing(announce = true) {
        const spacings = ['0em', '0.05em', '0.1em'];
        const labels = ['Normal', 'Médio', 'Grande'];
        const newIndex = (currentLetterSpacing % spacings.length);
        currentLetterSpacing = newIndex + 1;
        document.documentElement.style.setProperty('--espacamento-letra', spacings[newIndex]);
        if (letterSpacingText) letterSpacingText.textContent = labels[newIndex];
        localStorage.setItem('letterSpacing', currentLetterSpacing);
        if (announce) announceStatus(`Espaçamento de letra: ${labels[newIndex]}`);
    }

    function setFocusColor(color, announce = true) {
        if (!color) return;
        document.documentElement.style.setProperty('--cor-foco-acessibilidade', color);
        localStorage.setItem('focusColor', color);
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.color === color);
        });
        if (announce) announceStatus(`Cor de foco alterada.`);
    }

    function toggleContrast() { body.classList.toggle('contraste-alto'); /* ... */ }
    function toggleDarkMode() { body.classList.toggle('dark-mode'); /* ... */ }
    function toggleDyslexiaFont() { body.classList.toggle('fonte-dislexia'); /* ... */ }


    // --- NOVA LÓGICA: Funções para Leitor de Tela (TTS) ---
    function lerConteudo(texto) {
        if (!texto) return;
        if (synth.speaking) synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = velocidadesLeitura.find((v, i) => i === velocidadeLeituraAtual - 1)?.rate || 1;
        utterance.onstart = () => { leitorAtivo = true; isPaused = false; };
        utterance.onend = () => { leitorAtivo = false; isPaused = false; };
        utterance.onerror = () => { leitorAtivo = false; isPaused = false; };
        synth.speak(utterance);
    }
    
    function handleToggleLeitura() {
        if (!leitorAtivo) {
            const conteudo = document.querySelector('main')?.innerText;
            if (conteudo) lerConteudo(conteudo);
            else announceStatus('Não há conteúdo principal para ler.');
        } else {
            if (isPaused) {
                synth.resume();
                isPaused = false;
                announceStatus('Leitura retomada.');
            } else {
                synth.pause();
                isPaused = true;
                announceStatus('Leitura pausada.');
            }
        }
    }

    function handleReiniciarLeitura() {
        synth.cancel();
        leitorAtivo = false;
        isPaused = false;
        setTimeout(() => lerConteudo(document.querySelector('main')?.innerText), 100);
        announceStatus('Leitura reiniciada.');
    }

    function handleVelocidadeLeitura() {
        velocidadeLeituraAtual = (velocidadeLeituraAtual % velocidadesLeitura.length) + 1;
        const novaVelocidade = velocidadesLeitura[velocidadeLeituraAtual - 1];
        if (readingSpeedText) readingSpeedText.textContent = novaVelocidade.label;
        localStorage.setItem('readingSpeed', velocidadeLeituraAtual);
        announceStatus(`Velocidade de leitura: ${novaVelocidade.label}`);
    }

    function handleLerFoco() {
        if (ultimoElementoFocado) {
            const texto = (ultimoElementoFocado.textContent || ultimoElementoFocado.ariaLabel || ultimoElementoFocado.alt || ultimoElementoFocado.value)?.trim();
            if (texto) lerConteudo(texto);
            else announceStatus('Elemento focado não tem texto para ler.');
        } else {
            announceStatus('Nenhum elemento está focado.');
        }
    }

    // --- Modal de Atalhos e Reset ---
    const keyboardShortcutsModal = document.getElementById('keyboardShortcutsModal');
    const closeShortcutsBtn = document.getElementById('keyboardModalCloseButton');
    function showShortcutsModal() { keyboardShortcutsModal?.classList.remove('hidden'); }
    function hideShortcutsModal() { keyboardShortcutsModal?.classList.add('hidden'); }
    closeShortcutsBtn?.addEventListener('click', hideShortcutsModal);
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && keyboardShortcutsModal && !keyboardShortcutsModal.classList.contains('hidden')) {
            hideShortcutsModal();
        }
    });

    function resetarAcessibilidade() {
        synth.cancel();
        // ... (código da função resetarAcessibilidade inalterado) ...
    }

    // --- Adicionar Event Listeners ---
    const accessibilityActions = [
        { ids: ['btnAlternarTamanhoFonte', 'btnAlternarTamanhoFontePWA'], action: updateFontSize },
        { ids: ['btnAlternarEspacamentoLinha', 'btnAlternarEspacamentoLinhaPWA'], action: updateLineHeight },
        { ids: ['btnAlternarEspacamentoLetra', 'btnAlternarEspacamentoLetraPWA'], action: updateLetterSpacing },
        { ids: ['btnAlternarContraste', 'btnAlternarContrastePWA'], action: toggleContrast },
        { ids: ['btnAlternarModoEscuro', 'btnAlternarModoEscuroPWA'], action: toggleDarkMode },
        { ids: ['btnAlternarFonteDislexia', 'btnAlternarFonteDislexiaPWA'], action: toggleDyslexiaFont },
        { ids: ['btnResetarAcessibilidade', 'btnResetarAcessibilidadePWA'], action: resetarAcessibilidade },
        { ids: ['btnKeyboardShortcuts', 'btnKeyboardShortcutsPWA'], action: showShortcutsModal },
        // Adiciona os botões de áudio ao mapa de eventos
        { ids: ['btnToggleLeitura'], action: handleToggleLeitura },
        { ids: ['btnReiniciarLeitura'], action: handleReiniciarLeitura },
        { ids: ['btnAlternarVelocidadeLeitura'], action: handleVelocidadeLeitura },
        { ids: ['btnReadFocused'], action: handleLerFoco },
    ];

    accessibilityActions.forEach(item => {
        item.ids.forEach(id => {
            document.getElementById(id)?.addEventListener('click', item.action);
        });
    });
    
    document.querySelectorAll('.color-option').forEach(button => {
        button.addEventListener('click', () => setFocusColor(button.dataset.color));
    });

    // --- Carregamento Inicial das Configurações ---
    function loadAccessibilitySettings() {
        // ... (código da função loadAccessibilitySettings inalterado) ...
    }
    loadAccessibilitySettings();
    
    // --- Lógica do Menu PWA/Mobile ---
    accessibilityToggleButton?.addEventListener('click', () => { /* ... */ });
    pwaAcessibilidadeCloseBtn?.addEventListener('click', () => { /* ... */ });
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) { /* ... */ }

    // --- LÓGICA CORRIGIDA: Banner e Modal de Cookies ---
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn');
    const manageCookiesBtn = document.getElementById('manageCookiesBtn'); // Botão no banner
    const granularCookieModal = document.getElementById('granularCookieModal');
    const saveGranularPreferencesBtn = document.getElementById('saveGranularPreferencesBtn');
    const granularModalCloseButton = document.getElementById('granularModalCloseButton');
    const cancelGranularPreferencesBtn = document.getElementById('cancelGranularPreferencesBtn');
    const cookieAnalyticsCheckbox = document.getElementById('cookieAnalytics');
    const cookieMarketingCheckbox = document.getElementById('cookieMarketing');

    function showCookieBanner() { if (!localStorage.getItem('cookieConsent')) cookieConsentBanner?.classList.add('show'); }
    function hideCookieBanner() { cookieConsentBanner?.classList.remove('show'); }
    function updateGtagConsent(consent) { if(typeof gtag === 'function') { gtag('consent', 'update', consent); } }
    
    function showGranularCookieModal() {
        if(cookieAnalyticsCheckbox) cookieAnalyticsCheckbox.checked = localStorage.getItem('analytics_storage') === 'granted';
        if(cookieMarketingCheckbox) cookieMarketingCheckbox.checked = localStorage.getItem('ad_storage') === 'granted';
        granularCookieModal?.classList.remove('hidden'); // Exibe o modal
    }
    function hideGranularCookieModal() { granularCookieModal?.classList.add('hidden'); } // Oculta o modal

    acceptAllCookiesBtn?.addEventListener('click', () => { /* ... */ });
    refuseAllCookiesBtn?.addEventListener('click', () => { /* ... */ });
    
    // Event listener corrigido e garantido
    manageCookiesBtn?.addEventListener('click', showGranularCookieModal);
    
    granularModalCloseButton?.addEventListener('click', hideGranularCookieModal);
    cancelGranularPreferencesBtn?.addEventListener('click', hideGranularCookieModal);
    saveGranularPreferencesBtn?.addEventListener('click', () => {
        const consent = { 'analytics_storage': cookieAnalyticsCheckbox.checked ? 'granted' : 'denied', 'ad_storage': cookieMarketingCheckbox.checked ? 'granted' : 'denied' };
        updateGtagConsent(consent);
        localStorage.setItem('cookieConsent', 'managed');
        localStorage.setItem('analytics_storage', consent.analytics_storage);
        localStorage.setItem('ad_storage', consent.ad_storage);
        hideGranularCookieModal();
        hideCookieBanner();
    });
    showCookieBanner();

    // --- Inicialização do VLibras ---
    function initVLibras() {
        let attempts = 0;
        const maxAttempts = 50;
        const interval = setInterval(() => {
            attempts++;
            if (typeof VLibras !== 'undefined') {
                new VLibras.Widget('https://vlibras.gov.br/app');
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                console.warn('VLibras widget could not be initialized.');
                clearInterval(interval);
            }
        }, 200);
    }
    initVLibras();
    
    inicializarTooltips(); 
}
