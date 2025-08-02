/**
 * =================================================================================
 * ARQUIVO DE SCRIPTS GLOBAIS - VERSÃO UNIFICADA
 * Este ficheiro contém toda a lógica JavaScript partilhada pelo site.
 *
 * Inclui:
 * 1. Carregamento dinâmico de elementos HTML (menu, barra de acessibilidade, modais).
 * 2. Função genérica para gerar PDFs.
 * 3. Lógica completa para a barra de acessibilidade (Desktop e PWA).
 * 4. Lógica completa para o banner e modal de cookies.
 * 5. Funções para modais de mensagens personalizadas.
 * =================================================================================
 */

/**
 * GERA UM PDF A PARTIR DE UM SELETOR DE CONTEÚDO.
 * Esta função é genérica e fica no escopo global para ser chamada por qualquer página.
 * @param {object} options - Opções para o PDF (titulo, subtitulo, nomeArquivo, seletorConteudo).
 */
function gerarPDFGlobal(options) {
    // Valores padrão
    const {
        titulo = 'Relatório da Calculadora',
        subtitulo = 'Relatório de Cálculo Assistencial',
        nomeArquivo = 'relatorio.pdf',
        seletorConteudo = '.main-content-wrapper' // Um seletor padrão
    } = options;

    console.log(`Iniciando geração de PDF para: ${titulo}`);

    const elementoParaImprimir = document.querySelector(seletorConteudo);

    if (!elementoParaImprimir) {
        alert('Erro: Não foi possível encontrar o conteúdo principal para gerar o PDF.');
        console.error(`Elemento com seletor "${seletorConteudo}" não encontrado.`);
        return;
    }
    
    // Clona o conteúdo para não modificar a página atual
    const contentToPrint = elementoParaImprimir.cloneNode(true);

    // Remove elementos interativos do clone para uma impressão limpa
    contentToPrint.querySelectorAll('button, a, input, fieldset, nav').forEach(el => el.remove());

    // Cria um cabeçalho para o PDF
    const pdfHeader = document.createElement('div');
    pdfHeader.style.textAlign = 'center';
    pdfHeader.style.marginBottom = '25px';
    pdfHeader.innerHTML = `
        <h1 style="font-family: 'Nunito Sans', sans-serif; font-size: 22px; font-weight: bold; color: #1A3E74; margin: 0;">${titulo}</h1>
        <h2 style="font-size: 14px; color: #666; margin-top: 5px;">${subtitulo}</h2>
        <p style="font-size: 10px; color: #999; margin-top: 10px;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    `;

    // Insere o cabeçalho no início do conteúdo
    contentToPrint.prepend(pdfHeader);

    const pdfOptions = {
        margin: 0.5,
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, scrollY: 0, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    console.log('Gerando PDF com as opções:', pdfOptions);
    html2pdf().set(pdfOptions).from(contentToPrint).save().catch(err => {
        console.error("Erro ao gerar PDF: ", err);
    });
}


/**
 * =================================================================================
 * INICIALIZAÇÃO PRINCIPAL APÓS O CARREGAMENTO DO DOM
 * =================================================================================
 */
document.addEventListener('DOMContentLoaded', function() {

    // Carrega o menu global
    fetch('menu-global.html')
        .then(response => response.ok ? response.text() : Promise.reject('Ficheiro menu-global.html não encontrado'))
        .then(html => {
            const headerContainer = document.getElementById('global-header-container');
            if (headerContainer) {
                headerContainer.innerHTML = html;
                if (typeof initializeGlobalMenu === 'function') {
                    initializeGlobalMenu(); 
                }
            }
        })
        .catch(error => console.warn('Não foi possível carregar o menu global:', error));

    // Carrega os elementos HTML globais do corpo (barra de acessibilidade, modais, etc.)
    fetch('global-body-elements.html')
        .then(response => response.ok ? response.text() : Promise.reject('Ficheiro global-body-elements.html não encontrado'))
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            
            // IMPORTANTE: Inicializa todas as funções que dependem destes elementos
            // somente DEPOIS de eles terem sido carregados no DOM.
            initializeGlobalFunctions();
        })
        .catch(error => console.warn('Não foi possível carregar os elementos globais do corpo:', error));

});


/**
 * =================================================================================
 * FUNÇÃO DE INICIALIZAÇÃO
 * Agrupa todas as lógicas que precisam ser executadas após o carregamento dos 
 * elementos globais.
 * =================================================================================
 */
function initializeGlobalFunctions() {

    // --- Lógica de Acessibilidade (Padrão Heparina) ---
    const body = document.body;
    const statusMessageDiv = document.getElementById('statusMessage');
    const fontSizeText = document.getElementById('fontSizeText');
    const fontSizeTextPWA = document.getElementById('fontSizeTextPWA');
    const lineHeightText = document.getElementById('lineHeightText');
    const lineHeightTextPWA = document.getElementById('lineHeightTextPWA');
    const letterSpacingText = document.getElementById('letterSpacingText');
    const letterSpacingTextPWA = document.getElementById('letterSpacingTextPWA');
    const readingSpeedText = document.getElementById('readingSpeedText');
    const keyboardShortcutsModal = document.getElementById('keyboardShortcutsModal');
        // --- Lógica de Acessibilidade (Móvel) ---
    const accessibilityToggleButton = document.getElementById('accessibilityToggleButton');
    const accessibilityPanel = document.getElementById('pwaAcessibilidadeBar');
    const accessibilityCloseBtn = document.getElementById('pwaAcessibilidadeCloseBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const mainNavigationMenu = document.getElementById('offCanvasMenu'); // Assumindo que o ID do menu de navegação é este

    // Abre o painel de acessibilidade
    accessibilityToggleButton?.addEventListener('click', () => {
        if (mainNavigationMenu?.classList.contains('is-open')) {
            mainNavigationMenu.classList.remove('is-open');
        }
        accessibilityPanel?.classList.add('is-open');
        menuOverlay?.style.display = 'block';
    });

    // Fecha o painel de acessibilidade
    function closeAccessibilityPanel() {
        accessibilityPanel?.classList.remove('is-open');
        if (!mainNavigationMenu?.classList.contains('is-open')) {
            menuOverlay?.style.display = 'none';
        }
    }

    accessibilityCloseBtn?.addEventListener('click', closeAccessibilityPanel);

    // O overlay agora fecha ambos os menus laterais
    menuOverlay?.addEventListener('click', () => {
        mainNavigationMenu?.classList.remove('is-open');
        accessibilityPanel?.classList.remove('is-open');
        menuOverlay.style.display = 'none';
    });

    // --- Vincula as funções de acessibilidade aos novos botões do PWA ---
    document.getElementById('btnAlternarTamanhoFontePWA')?.addEventListener('click', () => { currentFontSize = (currentFontSize % 5) + 1; updateFontSize(); });
    document.getElementById('btnAlternarEspacamentoLinhaPWA')?.addEventListener('click', () => { currentLineHeight = (currentLineHeight % 3) + 1; updateLineHeight(); });
    document.getElementById('btnAlternarEspacamentoLetraPWA')?.addEventListener('click', () => { currentLetterSpacing = (currentLetterSpacing % 3) + 1; updateLetterSpacing(); });
    document.getElementById('btnAlternarContrastePWA')?.addEventListener('click', () => { const isPressed = body.classList.toggle('contraste-alto'); localStorage.setItem('contrasteAlto', isPressed); document.getElementById('btnAlternarContrastePWA').setAttribute('aria-pressed', isPressed); announceStatus(`Alto contraste ${isPressed ? 'ativado' : 'desativado'}.`); });
    document.getElementById('btnAlternarModoEscuroPWA')?.addEventListener('click', () => { const isPressed = body.classList.toggle('dark-mode'); localStorage.setItem('darkMode', isPressed); document.getElementById('btnAlternarModoEscuroPWA').setAttribute('aria-pressed', isPressed); announceStatus(`Modo escuro ${isPressed ? 'ativado' : 'desativado'}.`); });
    document.getElementById('btnAlternarFonteDislexiaPWA')?.addEventListener('click', () => { const isEnabled = body.classList.toggle('fonte-dislexia'); localStorage.setItem('fonteDislexia', isEnabled); announceStatus(`Fonte para dislexia ${isEnabled ? 'ativada' : 'desativada'}.`); });
    document.querySelectorAll('#pwaAcessibilidadeBar .color-option').forEach(button => button.addEventListener('click', () => updateFocusColor(button.dataset.color)));
    document.getElementById('btnKeyboardShortcutsPWA')?.addEventListener('click', showKeyboardShortcutsModal);
    document.getElementById('btnResetarAcessibilidadePWA')?.addEventListener('click', resetAccessibilitySettings);


    let currentFontSize = 1;
    let currentLineHeight = 1;
    let currentLetterSpacing = 1;
    let currentReadingSpeed = 1;
    let speechSynthesizer = window.speechSynthesis;
    let utterance = null;
    let isReading = false;
    let currentFocusColor = 'yellow';
    let lastFocusedElement = null;

    function announceStatus(message) {
        if (statusMessageDiv) statusMessageDiv.textContent = message;
    }

    function applySavedSettings() {
        currentFontSize = parseInt(localStorage.getItem('fontSize') || '1');
        updateFontSize(false);
        currentLineHeight = parseInt(localStorage.getItem('lineHeight') || '1');
        updateLineHeight(false);
        currentLetterSpacing = parseInt(localStorage.getItem('letterSpacing') || '1');
        updateLetterSpacing(false);
        currentReadingSpeed = parseInt(localStorage.getItem('readingSpeed') || '1');
        updateReadingSpeed(false);
        if (localStorage.getItem('contrasteAlto') === 'true') {
            body.classList.add('contraste-alto');
            document.getElementById('btnAlternarContraste')?.setAttribute('aria-pressed', 'true');
        }
        if (localStorage.getItem('darkMode') === 'true') {
            body.classList.add('dark-mode');
            document.getElementById('btnAlternarModoEscuro')?.setAttribute('aria-pressed', 'true');
        }
        if (localStorage.getItem('fonteDislexia') === 'true') {
            body.classList.add('fonte-dislexia');
        }
        currentFocusColor = localStorage.getItem('focusColor') || 'yellow';
        updateFocusColor(currentFocusColor, false);
    }

    function updateFontSize(announce = true) {
        const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
        const names = ['Normal', 'Médio', 'Grande', 'Extra Grande', 'Máximo'];
        body.style.fontSize = sizes[currentFontSize - 1];
        if (fontSizeText) fontSizeText.textContent = names[currentFontSize - 1];
        if (fontSizeTextPWA) fontSizeTextPWA.textContent = names[currentFontSize - 1];
        localStorage.setItem('fontSize', currentFontSize);
        if(announce) announceStatus(`Tamanho da fonte: ${names[currentFontSize - 1]}`);
    }

    function updateLineHeight(announce = true) {
        const heights = ['1.5', '1.8', '2.0'];
        const names = ['Médio', 'Grande', 'Extra Grande'];
        document.documentElement.style.setProperty('--espacamento-linha', heights[currentLineHeight - 1]);
        if (lineHeightText) lineHeightText.textContent = names[currentLineHeight - 1];
        if (lineHeightTextPWA) lineHeightTextPWA.textContent = names[currentLineHeight - 1];
        localStorage.setItem('lineHeight', currentLineHeight);
        if(announce) announceStatus(`Espaçamento de linha: ${names[currentLineHeight - 1]}`);
    }

    function updateLetterSpacing(announce = true) {
        const spacings = ['0em', '0.05em', '0.1em'];
        const names = ['Normal', 'Médio', 'Grande'];
        document.documentElement.style.setProperty('--espacamento-letra', spacings[currentLetterSpacing - 1]);
        if (letterSpacingText) letterSpacingText.textContent = names[currentLetterSpacing - 1];
        if (letterSpacingTextPWA) letterSpacingTextPWA.textContent = names[currentLetterSpacing - 1];
        localStorage.setItem('letterSpacing', currentLetterSpacing);
        if(announce) announceStatus(`Espaçamento de letra: ${names[currentLetterSpacing - 1]}`);
    }

    function updateReadingSpeed(announce = true) {
        const rates = [1, 0.75, 1.25];
        const names = ['Normal', 'Lento', 'Rápido'];
        if (utterance) utterance.rate = rates[currentReadingSpeed - 1];
        if(readingSpeedText) readingSpeedText.textContent = names[currentReadingSpeed - 1];
        localStorage.setItem('readingSpeed', currentReadingSpeed);
        if(announce) announceStatus(`Velocidade de leitura: ${names[currentReadingSpeed - 1]}`);
    }
    
    function updateFocusColor(color, announce = true) {
        currentFocusColor = color;
        document.documentElement.style.setProperty('--cor-foco-acessibilidade', currentFocusColor);
        localStorage.setItem('focusColor', color);
        document.querySelectorAll('.color-option').forEach(button => {
            button.classList.toggle('selected', button.dataset.color === color);
            button.setAttribute('aria-checked', button.dataset.color === color);
        });
        if (announce) announceStatus(`Cor de foco alterada para ${color}.`);
    }

    function showKeyboardShortcutsModal() {
        const modal = document.getElementById('keyboardShortcutsModal');
        if (!modal) return;
        modal.classList.add('show');
        lastFocusedElement = document.activeElement;
        modal.querySelector('button').focus();
    }

    function hideKeyboardShortcutsModal() {
        const modal = document.getElementById('keyboardShortcutsModal');
        if (!modal) return;
        modal.classList.remove('show');
        if (lastFocusedElement) lastFocusedElement.focus();
    }

    function resetAccessibilitySettings() {
        body.classList.remove('contraste-alto', 'dark-mode', 'fonte-dislexia');
        localStorage.removeItem('contrasteAlto');
        localStorage.removeItem('darkMode');
        localStorage.removeItem('fonteDislexia');
        document.getElementById('btnAlternarContraste')?.setAttribute('aria-pressed', 'false');
        document.getElementById('btnAlternarModoEscuro')?.setAttribute('aria-pressed', 'false');
        
        currentFontSize = 1; updateFontSize(false);
        currentLineHeight = 1; updateLineHeight(false);
        currentLetterSpacing = 1; updateLetterSpacing(false);
        currentReadingSpeed = 1; updateReadingSpeed(false);
        updateFocusColor('yellow', false);
        
        announceStatus('Configurações de acessibilidade redefinidas.');
    }

    // Event Listeners Acessibilidade
    document.getElementById('btnAlternarTamanhoFonte')?.addEventListener('click', () => { currentFontSize = (currentFontSize % 5) + 1; updateFontSize(); });
    document.getElementById('btnAlternarEspacamentoLinha')?.addEventListener('click', () => { currentLineHeight = (currentLineHeight % 3) + 1; updateLineHeight(); });
    document.getElementById('btnAlternarEspacamentoLetra')?.addEventListener('click', () => { currentLetterSpacing = (currentLetterSpacing % 3) + 1; updateLetterSpacing(); });
    document.getElementById('btnAlternarVelocidadeLeitura')?.addEventListener('click', () => { currentReadingSpeed = (currentReadingSpeed % 3) + 1; updateReadingSpeed(); });
    document.getElementById('btnAlternarContraste')?.addEventListener('click', () => { const isPressed = body.classList.toggle('contraste-alto'); localStorage.setItem('contrasteAlto', isPressed); document.getElementById('btnAlternarContraste').setAttribute('aria-pressed', isPressed); announceStatus(`Alto contraste ${isPressed ? 'ativado' : 'desativado'}.`); });
    document.getElementById('btnAlternarModoEscuro')?.addEventListener('click', () => { const isPressed = body.classList.toggle('dark-mode'); localStorage.setItem('darkMode', isPressed); document.getElementById('btnAlternarModoEscuro').setAttribute('aria-pressed', isPressed); announceStatus(`Modo escuro ${isPressed ? 'ativado' : 'desativado'}.`); });
    document.getElementById('btnAlternarFonteDislexia')?.addEventListener('click', () => { const isEnabled = body.classList.toggle('fonte-dislexia'); localStorage.setItem('fonteDislexia', isEnabled); announceStatus(`Fonte para dislexia ${isEnabled ? 'ativada' : 'desativada'}.`); });
    document.querySelectorAll('#barraAcessibilidade .color-option').forEach(button => button.addEventListener('click', () => updateFocusColor(button.dataset.color)));
    document.getElementById('btnResetarAcessibilidade')?.addEventListener('click', resetAccessibilitySettings);
    document.getElementById('btnKeyboardShortcuts')?.addEventListener('click', showKeyboardShortcutsModal);
    document.getElementById('keyboardModalCloseButton')?.addEventListener('click', hideKeyboardShortcutsModal);
    
    applySavedSettings();

    // --- Lógica de Cookies ---
    const cookieBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn');
    const manageCookiesBtn = document.getElementById('manageCookiesBtn');
    const granularCookieModal = document.getElementById('granularCookieModal');
    const openGranularCookieModalBtn = document.getElementById('openGranularCookieModalBtn');
    const saveGranularPreferencesBtn = document.getElementById('saveGranularPreferencesBtn');
    const granularModalCloseButton = document.getElementById('granularModalCloseButton');
    const cancelGranularPreferencesBtn = document.getElementById('cancelGranularPreferencesBtn');
    const cookieAnalyticsCheckbox = document.getElementById('cookieAnalytics');
    const cookieMarketingCheckbox = document.getElementById('cookieMarketing');
    
    function showCookieBanner() { if (!localStorage.getItem('cookieConsent')) cookieBanner.classList.add('show'); }
    function hideCookieBanner() { cookieBanner.classList.remove('show'); }
    function updateGtagConsent(consent) { gtag('consent', 'update', consent); }
    function showGranularCookieModal() {
        cookieAnalyticsCheckbox.checked = localStorage.getItem('analytics_storage') === 'granted';
        cookieMarketingCheckbox.checked = localStorage.getItem('ad_storage') === 'granted';
        granularCookieModal.classList.add('show');
    }
    function hideGranularCookieModal() { granularCookieModal.classList.remove('show'); }

    acceptAllCookiesBtn?.addEventListener('click', () => { const consent = { 'analytics_storage': 'granted', 'ad_storage': 'granted' }; updateGtagConsent(consent); localStorage.setItem('cookieConsent', 'accepted'); localStorage.setItem('analytics_storage', 'granted'); localStorage.setItem('ad_storage', 'granted'); hideCookieBanner(); });
    refuseAllCookiesBtn?.addEventListener('click', () => { const consent = { 'analytics_storage': 'denied', 'ad_storage': 'denied' }; updateGtagConsent(consent); localStorage.setItem('cookieConsent', 'refused'); localStorage.setItem('analytics_storage', 'denied'); localStorage.setItem('ad_storage', 'denied'); hideCookieBanner(); });
    manageCookiesBtn?.addEventListener('click', showGranularCookieModal);
    openGranularCookieModalBtn?.addEventListener('click', showGranularCookieModal);
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

    // Lógica do Botão Voltar ao Topo
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.onscroll = function() {
            if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        };
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
    }

    // Inicializar VLibras (se o script for carregado)
    if (typeof VLibras !== 'undefined') {
        new VLibras.Widget('https://vlibras.gov.br/app');
    }
}
