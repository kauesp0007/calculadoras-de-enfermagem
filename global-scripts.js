// Exemplo de como o seu ficheiro global-scripts.js ficaria

/**
 * GERA UM PDF A PARTIR DE UM SELETOR DE CONTEÚDO.
 * Esta função é genérica e pode ser chamada por qualquer página.
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


// --- O RESTO DO SEU CÓDIGO DE global-scripts.js CONTINUA AQUI ---
// Por exemplo:

document.addEventListener('DOMContentLoaded', function() {
  // ... o seu código de inicialização de menus, acessibilidade, etc.
});

// ... mais código, se houver.
// global-scripts.js - VERSÃO CORRIGIDA E COMPLETA
document.addEventListener('DOMContentLoaded', function() {
    // --- Referências de Elementos Globais ---
    const body = document.body;
    const statusMessageDiv = document.getElementById('statusMessage');

    // Elementos da barra de acessibilidade desktop
    const desktopAcessibilidadeBar = document.getElementById('barraAcessibilidade');
    const fontSizeText = document.getElementById('fontSizeText');
    const lineHeightText = document.getElementById('lineHeightText');
    const letterSpacingText = document.getElementById('letterSpacingText');
    const btnAlternarContraste = document.getElementById('btnAlternarContraste');
    const btnAlternarModoEscuro = document.getElementById('btnAlternarModoEscuro');
    const btnAlternarFonteDislexia = document.getElementById('btnAlternarFonteDislexia');
    const btnKeyboardShortcuts = document.getElementById('btnKeyboardShortcuts');
    const btnResetarAcessibilidade = document.getElementById('btnResetarAcessibilidade');
    const btnReadFocused = document.getElementById('btnReadFocused');

    // Elementos da barra de acessibilidade PWA/Mobile
    const accessibilityToggleButton = document.getElementById('accessibilityToggleButton');
    const pwaAcessibilidadeBar = document.getElementById('pwaAcessibilidadeBar');

    // Elementos do menu de navegação (carregados dinamicamente)
    const hamburgerButton = document.getElementById('hamburgerButton');
    const offCanvasMenu = document.getElementById('offCanvasMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    // Variáveis de Estado
    let currentFontSize = 1;
    let currentLineHeight = 1;
    let currentLetterSpacing = 1;
    let currentReadingSpeed = 1;
    let speechSynthesizer = window.speechSynthesis;
    let utterance = null;
    let isReading = false;
    let currentFocusColor = localStorage.getItem('focusColor') || 'yellow';
    let lastFocusedElement = null;

    // --- Funções de Acessibilidade ---
    function announceStatus(message) {
        if (statusMessageDiv) statusMessageDiv.textContent = message;
    }

    function updateFontSize(announce = true) {
        const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
        const labels = ['Normal', 'Médio', 'Grande', 'Extra Grande', 'Máximo'];
        body.style.fontSize = sizes[currentFontSize - 1];
        if (fontSizeText) fontSizeText.textContent = labels[currentFontSize - 1];
        if (fontSizeTextPWA) fontSizeTextPWA.textContent = labels[currentFontSize - 1];
        localStorage.setItem('fontSize', currentFontSize);
        if (announce) announceStatus(`Tamanho da fonte alterado para ${labels[currentFontSize - 1]}`);
    }

    function alternarTamanhoFonte() {
        currentFontSize = (currentFontSize % 5) + 1;
        updateFontSize();
    }
    
    function updateLineHeight(announce = true) {
        const heights = ['1.5', '1.8', '2.0'];
        const labels = ['Médio', 'Grande', 'Extra Grande'];
        document.documentElement.style.setProperty('--espacamento-linha', heights[currentLineHeight - 1]);
        if (lineHeightText) lineHeightText.textContent = labels[currentLineHeight - 1];
        if (lineHeightTextPWA) lineHeightTextPWA.textContent = labels[currentLineHeight - 1];
        localStorage.setItem('lineHeight', currentLineHeight);
        if (announce) announceStatus(`Espaçamento de linha alterado para ${labels[currentLineHeight - 1]}`);
    }

    function alternarEspacamentoLinha() {
        currentLineHeight = (currentLineHeight % 3) + 1;
        updateLineHeight();
    }
    
    function updateLetterSpacing(announce = true) {
        const spacings = ['0em', '0.05em', '0.1em'];
        const labels = ['Normal', 'Médio', 'Grande'];
        document.documentElement.style.setProperty('--espacamento-letra', spacings[currentLetterSpacing - 1]);
        if (letterSpacingText) letterSpacingText.textContent = labels[currentLetterSpacing - 1];
        if (letterSpacingTextPWA) letterSpacingTextPWA.textContent = labels[currentLetterSpacing - 1];
        localStorage.setItem('letterSpacing', currentLetterSpacing);
        if (announce) announceStatus(`Espaçamento de letra alterado para ${labels[currentLetterSpacing - 1]}`);
    }
    
    function alternarEspacamentoLetra() {
        currentLetterSpacing = (currentLetterSpacing % 3) + 1;
        updateLetterSpacing();
    }

    function alternarContraste() {
        body.classList.toggle('contraste-alto');
        const isActive = body.classList.contains('contraste-alto');
        localStorage.setItem('contrasteAlto', isActive);
        if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', isActive);
        if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', isActive);
        announceStatus(`Modo de alto contraste ${isActive ? 'ativado' : 'desativado'}.`);
    }

    function alternarModoEscuro() {
        body.classList.toggle('dark-mode');
        const isActive = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isActive);
        if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', isActive);
        if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', isActive);
        announceStatus(`Modo escuro ${isActive ? 'ativado' : 'desativado'}.`);
    }

    function alternarFonteDislexia() {
        body.classList.toggle('fonte-dislexia');
        const isActive = body.classList.contains('fonte-dislexia');
        localStorage.setItem('fonteDislexia', isActive);
        announceStatus(`Fonte para dislexia ${isActive ? 'ativada' : 'desativada'}.`);
    }
    
    function resetarAcessibilidade() {
        currentFontSize = 1;
        currentLineHeight = 1;
        currentLetterSpacing = 1;
        
        body.style.fontSize = '';
        document.documentElement.style.setProperty('--espacamento-linha', '1.5');
        document.documentElement.style.setProperty('--espacamento-letra', '0em');
        body.classList.remove('contraste-alto', 'dark-mode', 'fonte-dislexia');
        
        localStorage.removeItem('fontSize');
        localStorage.removeItem('lineHeight');
        localStorage.removeItem('letterSpacing');
        localStorage.removeItem('contrasteAlto');
        localStorage.removeItem('darkMode');
        localStorage.removeItem('fonteDislexia');
        
        updateFontSize(false);
        updateLineHeight(false);
        updateLetterSpacing(false);
        if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', 'false');
        if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', 'false');
        if (btnAlternarContrastePWA) btnAlternarContrastePWA.setAttribute('aria-pressed', 'false');
        if (btnAlternarModoEscuroPWA) btnAlternarModoEscuroPWA.setAttribute('aria-pressed', 'false');
        
        announceStatus('Configurações de acessibilidade redefinidas.');
    }

    // --- Lógica do Botão Voltar ao Topo ---
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                backToTopBtn.style.display = 'block';
            } else {
                backToTopBtn.style.display = 'none';
            }
        });
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Lógica do Modal Personalizado ---
    const customModal = document.getElementById('customModal');
    const modalCloseButton = document.getElementById('modalCloseButton');
    const modalMessage = document.getElementById('modalMessage');

    function showCustomModal(message) {
        if (customModal && modalMessage && modalCloseButton) {
            modalMessage.textContent = message;
            customModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            lastFocusedElement = document.activeElement;
            modalCloseButton.focus();
        }
    }

    function hideCustomModal() {
        if (customModal) {
            customModal.classList.add('hidden');
            document.body.style.overflow = '';
            if (lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }
        }
    }

    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', hideCustomModal);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && customModal && !customModal.classList.contains('hidden')) {
            hideCustomModal();
        }
    });

    // --- Lógica do Banner de Cookies ---
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn');
    const manageCookiesBtn = document.getElementById('manageCookiesBtn');
    const granularCookieModal = document.getElementById('granularCookieModal');
    const granularModalCloseButton = document.getElementById('granularModalCloseButton');
    const saveGranularPreferencesBtn = document.getElementById('saveGranularPreferencesBtn');
    const cancelGranularPreferencesBtn = document.getElementById('cancelGranularPreferencesBtn');
    const cookieAnalyticsCheckbox = document.getElementById('cookieAnalytics');
    const cookieMarketingCheckbox = document.getElementById('cookieMarketing');

    const cookiesAcceptedKey = 'cookiesAccepted';
    const analyticsConsentKey = 'analyticsConsent';
    const marketingConsentKey = 'marketingConsent';

    function showCookieBanner() {
        if (localStorage.getItem(cookiesAcceptedKey) === null) {
            cookieConsentBanner.classList.add('show');
        }
    }

    function hideCookieBanner() {
        cookieConsentBanner.classList.remove('show');
    }

    function updateGtagConsent() {
        const analyticsStorage = localStorage.getItem(analyticsConsentKey) === 'true' ? 'granted' : 'denied';
        const adStorage = localStorage.getItem(marketingConsentKey) === 'true' ? 'granted' : 'denied';

        gtag('consent', 'update', {
            'analytics_storage': analyticsStorage,
            'ad_storage': adStorage
        });
    }

    function loadGranularPreferences() {
        cookieAnalyticsCheckbox.checked = localStorage.getItem(analyticsConsentKey) === 'true';
        cookieMarketingCheckbox.checked = localStorage.getItem(marketingConsentKey) === 'true';
    }

    function saveGranularPreferences() {
        localStorage.setItem(analyticsConsentKey, cookieAnalyticsCheckbox.checked);
        localStorage.setItem(marketingConsentKey, cookieMarketingCheckbox.checked);
        localStorage.setItem(cookiesAcceptedKey, 'true');
        updateGtagConsent();
        granularCookieModal.classList.add('hidden');
        document.body.style.overflow = '';
        showCookieBanner();
    }

    function showGranularCookieModal() {
        loadGranularPreferences();
        granularCookieModal.classList.remove('hidden');
        granularCookieModal.classList.add('show'); // Adiciona a classe show
        document.body.style.overflow = 'hidden';
        lastFocusedElement = document.activeElement;
        const focusableElements = granularCookieModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    function hideGranularCookieModal() {
        granularCookieModal.classList.add('hidden');
        granularCookieModal.classList.remove('show'); // Remove a classe show
        document.body.style.overflow = '';
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }

    function refuseAllCookies() {
        localStorage.setItem(cookiesAcceptedKey, 'false');
        localStorage.setItem(analyticsConsentKey, 'false');
        localStorage.setItem(marketingConsentKey, 'false');
        updateGtagConsent();
        hideCookieBanner();
    }

    if (acceptAllCookiesBtn) {
        acceptAllCookiesBtn.addEventListener('click', () => {
            localStorage.setItem(cookiesAcceptedKey, 'true');
            localStorage.setItem(analyticsConsentKey, 'true');
            localStorage.setItem(marketingConsentKey, 'true');
            updateGtagConsent();
            hideCookieBanner();
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

    // Initial check and display of cookie banner
    showCookieBanner();
    updateGtagConsent();

    // --- Outras lógicas de inicialização ---
    applySavedSettings();
});

