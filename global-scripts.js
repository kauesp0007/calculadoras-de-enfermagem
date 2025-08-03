/**
 * =================================================================================
 * ARQUIVO DE SCRIPTS GLOBAIS - VERSÃO CORRIGIDA E UNIFICADA
 * Este ficheiro contém toda a lógica JavaScript partilhada pelo site.
 * A inicialização das funções é feita DEPOIS do carregamento dinâmico do HTML
 * para garantir que todos os elementos existam.
 * =================================================================================
 */

/**
 * GERA UM PDF A PARTIR DE UM SELETOR DE CONTEÚDO.
 * Esta função é genérica e fica no escopo global para ser chamada por qualquer página.
 * @param {object} options - Opções para o PDF (titulo, subtitulo, nomeArquivo, seletorConteudo).
 */
function gerarPDFGlobal(options) {
    const {
        titulo = 'Relatório da Calculadora',
        subtitulo = 'Relatório de Cálculo Assistencial',
        nomeArquivo = 'relatorio.pdf',
        seletorConteudo = '.main-content-wrapper'
    } = options;

    console.log(`Iniciando geração de PDF para: ${titulo}`);
    const elementoParaImprimir = document.querySelector(seletorConteudo);

    if (!elementoParaImprimir) {
        alert('Erro: Não foi possível encontrar o conteúdo principal para gerar o PDF.');
        console.error(`Elemento com seletor "${seletorConteudo}" não encontrado.`);
        return;
    }
    
    // Cria um container DIV para o conteúdo do PDF, em vez de clonar o wrapper inteiro.
    const contentToPrint = document.createElement('div');
    contentToPrint.style.padding = '20px';
    contentToPrint.style.fontFamily = 'Inter, sans-serif';

    // Cria um cabeçalho para o PDF
    const pdfHeader = document.createElement('div');
    pdfHeader.style.textAlign = 'center';
    pdfHeader.style.marginBottom = '25px';
    pdfHeader.innerHTML = `
        <h1 style="font-family: 'Nunito Sans', sans-serif; font-size: 22px; font-weight: bold; color: #1A3E74; margin: 0;">${titulo}</h1>
        <h2 style="font-size: 14px; color: #666; margin-top: 5px;">${subtitulo}</h2>
        <p style="font-size: 10px; color: #999; margin-top: 10px;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    `;
    contentToPrint.appendChild(pdfHeader);

    // --- LÓGICA ATUALIZADA PARA INCLUIR ITENS SELECIONADOS ---
    const conteudoCalculadora = elementoParaImprimir.querySelector('#conteudo');
    if (conteudoCalculadora) {
        const cloneConteudo = conteudoCalculadora.cloneNode(true);
        
        // Remove todos os inputs de rádio que NÃO foram selecionados
        cloneConteudo.querySelectorAll('input[type="radio"]:not(:checked)').forEach(radio => {
            // Remove a linha inteira da tabela (tr) ou o label da opção
            radio.closest('.option-row, .option-label')?.remove();
        });

        // Remove as tabelas/fieldsets que ficaram vazios após a limpeza
        cloneConteudo.querySelectorAll('tbody, .options-group').forEach(container => {
            if (container.children.length === 0) {
                container.closest('.criterion-section, .criterion-table')?.remove();
            }
        });
        
        // Adiciona o conteúdo limpo ao PDF
        contentToPrint.appendChild(cloneConteudo);
    }
    // --- FIM DA LÓGICA ATUALIZADA ---

    // Adiciona o resultado final ao PDF
    const resultadoDiv = elementoParaImprimir.querySelector('#resultado');
    if (resultadoDiv && !resultadoDiv.classList.contains('hidden')) {
        const cloneResultado = resultadoDiv.cloneNode(true);
        cloneResultado.style.marginTop = '20px';
        contentToPrint.appendChild(cloneResultado);
    }

    // Define estilo adicional antes de gerar PDF
contentToPrint.style.lineHeight = '1cm';
contentToPrint.style.fontSize = '12px';
contentToPrint.style.margin = '0';

// Configurações detalhadas do PDF
const pdfOptions = {
    margin: [0.5, 0.5, 0.5, 0.5], // Margens: sup, esq, inf, dir (em polegadas ≈ 1,27 cm)
    filename: nomeArquivo,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
        scale: 2,
        scrollY: 0,
        useCORS: true
    },
    jsPDF: {
        unit: 'cm',
        format: [21.0, 29.7], // A4 em centímetros
        orientation: 'portrait',
        putOnlyUsedFonts: true
    },
    pagebreak: { avoid: ['p', 'h1', 'h2', 'h3', 'div', 'section'] }
};


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
                initializeNavigationMenu();
            }
        })
        .catch(error => console.warn('Não foi possível carregar o menu global:', error));

    // Carrega os elementos HTML globais do corpo (barra de acessibilidade, modais, etc.)
    fetch('global-body-elements.html')
        .then(response => response.ok ? response.text() : Promise.reject('Ficheiro global-body-elements.html não encontrado'))
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            initializeGlobalFunctions();
        })
        .catch(error => console.warn('Não foi possível carregar os elementos globais do corpo:', error));

});

/**
 * =================================================================================
 * FUNÇÕES DE INICIALIZAÇÃO (CHAMADAS APÓS O FETCH)
 * =================================================================================
 */

function initializeNavigationMenu() {
    const hamburgerButton = document.getElementById('hamburgerButton');
    const offCanvasMenu = document.getElementById('offCanvasMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const accessibilityPanel = document.getElementById('pwaAcessibilidadeBar');

    hamburgerButton?.addEventListener('click', () => {
        if (accessibilityPanel?.classList.contains('is-open')) {
            accessibilityPanel.classList.remove('is-open');
        }
        offCanvasMenu?.classList.add('is-open');
        if (menuOverlay) menuOverlay.style.display = 'block';
    });
}

function initializeGlobalFunctions() {
    const body = document.body;
    const statusMessageDiv = document.getElementById('statusMessage');
    let lastFocusedElement = null;

    // --- Lógica de Acessibilidade ---
    const fontSizeText = document.getElementById('fontSizeText');
    const lineHeightText = document.getElementById('lineHeightText');
    const letterSpacingText = document.getElementById('letterSpacingText');
    const accessibilityToggleButton = document.getElementById('accessibilityToggleButton');
    const pwaAcessibilidadeBar = document.getElementById('pwaAcessibilidadeBar');
    const pwaAcessibilidadeCloseBtn = document.getElementById('pwaAcessibilidadeCloseBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const offCanvasMenu = document.getElementById('offCanvasMenu');

    let currentFontSize = 1;
    let currentLineHeight = 1;
    let currentLetterSpacing = 1;

    function announceStatus(message) {
        if (statusMessageDiv) statusMessageDiv.textContent = message;
    }

    function updateFontSize(announce = true) {
        const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
        const labels = ['Normal', 'Médio', 'Grande', 'Extra Grande', 'Máximo'];
        body.style.fontSize = sizes[currentFontSize - 1];
        if (fontSizeText) fontSizeText.textContent = labels[currentFontSize - 1];
        localStorage.setItem('fontSize', currentFontSize);
        if (announce) announceStatus(`Tamanho da fonte: ${labels[currentFontSize - 1]}`);
    }

    function updateLineHeight(announce = true) {
        const heights = ['1.5', '1.8', '2.0'];
        const labels = ['Médio', 'Grande', 'Extra Grande'];
        document.documentElement.style.setProperty('--espacamento-linha', heights[currentLineHeight - 1]);
        if (lineHeightText) lineHeightText.textContent = labels[currentLineHeight - 1];
        localStorage.setItem('lineHeight', currentLineHeight);
        if (announce) announceStatus(`Espaçamento de linha: ${labels[currentLineHeight - 1]}`);
    }

    function updateLetterSpacing(announce = true) {
        const spacings = ['0em', '0.05em', '0.1em'];
        const labels = ['Normal', 'Médio', 'Grande'];
        document.documentElement.style.setProperty('--espacamento-letra', spacings[currentLetterSpacing - 1]);
        if (letterSpacingText) letterSpacingText.textContent = labels[currentLetterSpacing - 1];
        localStorage.setItem('letterSpacing', currentLetterSpacing);
        if (announce) announceStatus(`Espaçamento de letra: ${labels[currentLetterSpacing - 1]}`);
    }
    
    function resetarAcessibilidade() {
        currentFontSize = 1;
        currentLineHeight = 1;
        currentLetterSpacing = 1;
        body.style.fontSize = '';
        document.documentElement.style.setProperty('--espacamento-linha', '1.5');
        document.documentElement.style.setProperty('--espacamento-letra', '0em');
        body.classList.remove('contraste-alto', 'dark-mode', 'fonte-dislexia');
        localStorage.clear(); // Limpa todas as configurações salvas
        updateFontSize(false);
        updateLineHeight(false);
        updateLetterSpacing(false);
        announceStatus('Configurações de acessibilidade redefinidas.');
    }
    
    accessibilityToggleButton?.addEventListener('click', () => {
        if (offCanvasMenu?.classList.contains('is-open')) {
            offCanvasMenu.classList.remove('is-open');
        }
        pwaAcessibilidadeBar?.classList.add('is-open');
        if (menuOverlay) menuOverlay.style.display = 'block';
    });

    pwaAcessibilidadeCloseBtn?.addEventListener('click', () => {
        pwaAcessibilidadeBar?.classList.remove('is-open');
        if (!offCanvasMenu?.classList.contains('is-open')) {
            if (menuOverlay) menuOverlay.style.display = 'none';
        }
    });
    
    menuOverlay?.addEventListener('click', () => {
        offCanvasMenu?.classList.remove('is-open');
        pwaAcessibilidadeBar?.classList.remove('is-open');
        if (menuOverlay) menuOverlay.style.display = 'none';
    });

    document.getElementById('btnAlternarTamanhoFonte')?.addEventListener('click', () => { currentFontSize = (currentFontSize % 5) + 1; updateFontSize(); });
    document.getElementById('btnAlternarEspacamentoLinha')?.addEventListener('click', () => { currentLineHeight = (currentLineHeight % 3) + 1; updateLineHeight(); });
    document.getElementById('btnAlternarEspacamentoLetra')?.addEventListener('click', () => { currentLetterSpacing = (currentLetterSpacing % 3) + 1; updateLetterSpacing(); });
    document.getElementById('btnAlternarContraste')?.addEventListener('click', () => { body.classList.toggle('contraste-alto'); });
    document.getElementById('btnAlternarModoEscuro')?.addEventListener('click', () => { body.classList.toggle('dark-mode'); });
    document.getElementById('btnAlternarFonteDislexia')?.addEventListener('click', () => { body.classList.toggle('fonte-dislexia'); });
    document.getElementById('btnResetarAcessibilidade')?.addEventListener('click', resetarAcessibilidade);

    // --- Lógica do Botão Voltar ao Topo ---
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.style.display = (window.scrollY > 200) ? 'block' : 'none';
        });
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // --- Lógica do Banner de Cookies ---
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
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

    function showCookieBanner() { if (!localStorage.getItem('cookieConsent')) cookieConsentBanner?.classList.add('show'); }
    function hideCookieBanner() { cookieConsentBanner?.classList.remove('show'); }
    function updateGtagConsent(consent) { gtag('consent', 'update', consent); }
    function showGranularCookieModal() {
        if(cookieAnalyticsCheckbox) cookieAnalyticsCheckbox.checked = localStorage.getItem('analytics_storage') === 'granted';
        if(cookieMarketingCheckbox) cookieMarketingCheckbox.checked = localStorage.getItem('ad_storage') === 'granted';
        granularCookieModal?.classList.add('show');
    }
    function hideGranularCookieModal() { granularCookieModal?.classList.remove('show'); }

    acceptAllCookiesBtn?.addEventListener('click', () => { const consent = { 'analytics_storage': 'granted', 'ad_storage': 'granted' }; updateGtagConsent(consent); localStorage.setItem('cookieConsent', 'accepted'); hideCookieBanner(); });
    refuseAllCookiesBtn?.addEventListener('click', () => { const consent = { 'analytics_storage': 'denied', 'ad_storage': 'denied' }; updateGtagConsent(consent); localStorage.setItem('cookieConsent', 'refused'); hideCookieBanner(); });
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

    // Inicializar VLibras
    if (typeof VLibras !== 'undefined') {
        new VLibras.Widget('https://vlibras.gov.br/app');
    }
}
