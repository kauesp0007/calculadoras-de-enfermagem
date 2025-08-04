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

    const conteudoCalculadora = elementoParaImprimir.querySelector('#conteudo');
    if (conteudoCalculadora) {
        const cloneConteudo = conteudoCalculadora.cloneNode(true);
        
        cloneConteudo.querySelectorAll('input[type="radio"]:not(:checked)').forEach(radio => {
            radio.closest('.option-row, .option-label')?.remove();
        });

        cloneConteudo.querySelectorAll('tbody, .options-group').forEach(container => {
            if (container.children.length === 0) {
                container.closest('.criterion-section, .criterion-table')?.remove();
            }
        });
        
        contentToPrint.appendChild(cloneConteudo);
    }

    const resultadoDiv = elementoParaImprimir.querySelector('#resultado');
    if (resultadoDiv && !resultadoDiv.classList.contains('hidden')) {
        const cloneResultado = resultadoDiv.cloneNode(true);
        cloneResultado.style.marginTop = '20px';
        contentToPrint.appendChild(cloneResultado);
    }

    contentToPrint.style.lineHeight = '1.5';
    contentToPrint.style.fontSize = '12px';
    contentToPrint.style.margin = '0';

    const pdfOptions = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            scrollY: 0,
            useCORS: true
        },
        jsPDF: {
            unit: 'in',
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: { avoid: ['p', 'h1', 'h2', 'h3', 'div', 'section'] }
    };

    html2pdf().set(pdfOptions).from(contentToPrint).save().catch(err => {
        console.error("Erro ao gerar PDF: ", err);
    });
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
  const hamburgerButton = document.getElementById('hamburgerButton');
  const offCanvasMenu = document.getElementById('offCanvasMenu');
  const menuOverlay = document.getElementById('menuOverlay');

  hamburgerButton?.addEventListener('click', () => {
    offCanvasMenu?.classList.toggle('is-open');
    menuOverlay?.classList.toggle('is-open');
  });

  menuOverlay?.addEventListener('click', () => {
    offCanvasMenu?.classList.remove('is-open');
    menuOverlay?.classList.remove('is-open');
  });

  const submenuToggles = offCanvasMenu?.querySelectorAll('button[data-submenu-toggle]');
  submenuToggles?.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
          e.preventDefault();
          const submenuId = toggle.getAttribute('data-submenu-toggle');
          const submenu = document.getElementById(`submenu-${submenuId}`);
          const icon = toggle.querySelector('i');

          if (submenu) {
              const parentUl = toggle.closest('ul');
              parentUl.querySelectorAll('.submenu.open').forEach(openSubmenu => {
                  if (openSubmenu !== submenu) {
                      openSubmenu.classList.remove('open');
                      const otherIcon = openSubmenu.previousElementSibling.querySelector('i');
                      otherIcon?.classList.remove('fa-chevron-up');
                      otherIcon?.classList.add('fa-chevron-down');
                  }
              });

              submenu.classList.toggle('open');
              icon?.classList.toggle('fa-chevron-down');
              icon?.classList.toggle('fa-chevron-up');
          }
      });
  });
}


function inicializarTooltips() {
    const elementosComTooltip = document.querySelectorAll('[data-tooltip]');
    
    elementosComTooltip.forEach(el => {
        const texto = el.getAttribute('data-tooltip');
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-dinamico';
        tooltip.innerText = texto;
        el.appendChild(tooltip);

        el.addEventListener('mouseenter', () => tooltip.style.opacity = '1');
        el.addEventListener('mouseleave', () => tooltip.style.opacity = '0');
        el.addEventListener('touchstart', () => tooltip.style.opacity = '1');
        el.addEventListener('touchend', () => setTimeout(() => tooltip.style.opacity = '0', 2000));
    });
}

function initializeGlobalFunctions() {
    const body = document.body;
    const estiloTooltip = document.createElement('style');
    estiloTooltip.innerHTML = `
    .tooltip-dinamico {
      position: absolute;
      background-color: #1A3E74;
      color: white;
      font-size: 12px;
      padding: 6px 10px;
      border-radius: 4px;
      white-space: normal;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s;
      top: 120%;
      left: 50%;
      transform: translateX(-50%);
      max-width: 220px;
      text-align: center;
    }
    [data-tooltip] {
      position: relative;
      cursor: help;
      border-bottom: 1px dotted #1A3E74;
    }
    `;
    document.head.appendChild(estiloTooltip);

    const statusMessageDiv = document.getElementById('statusMessage');

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
        localStorage.clear();
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
    function updateGtagConsent(consent) { if(typeof gtag === 'function') { gtag('consent', 'update', consent); } }
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

    // Inicializar VLibras de forma robusta
    function initVLibras() {
        let attempts = 0;
        const maxAttempts = 50; // Tenta por 10 segundos (50 * 200ms)
        const interval = setInterval(() => {
            attempts++;
            if (typeof VLibras !== 'undefined') {
                new VLibras.Widget('https://vlibras.gov.br/app');
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                console.warn('VLibras widget could not be initialized after 10 seconds.');
                clearInterval(interval);
            }
        }, 200);
    }
    initVLibras();
    
    inicializarTooltips(); 
}
