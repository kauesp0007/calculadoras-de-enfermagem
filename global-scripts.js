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
    
    const contentToPrint = document.createElement('div');
    contentToPrint.style.padding = '20px';
    contentToPrint.style.fontFamily = 'Inter, sans-serif';

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
      offCanvasMenu?.classList.toggle('-translate-x-full'); // Alterna a classe de visibilidade
      menuOverlay?.style.display = offCanvasMenu?.classList.contains('-translate-x-full') ? 'none' : 'block';
  });

  menuOverlay?.addEventListener('click', () => {
      offCanvasMenu?.classList.add('-translate-x-full');
      menuOverlay.style.display = 'none';
  });

  const submenuToggles = offCanvasMenu?.querySelectorAll('.has-submenu > a, .has-submenu > button');
  submenuToggles?.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
          e.preventDefault();
          const submenu = toggle.nextElementSibling;
          if (submenu && submenu.classList.contains('submenu')) {
              submenu.classList.toggle('open');
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
    const statusMessageDiv = document.createElement('div');
    statusMessageDiv.setAttribute('aria-live', 'polite');
    statusMessageDiv.className = 'sr-only';
    body.appendChild(statusMessageDiv);

    // --- Seletores de Elementos ---
    const fontSizeText = document.getElementById('fontSizeText');
    const lineHeightText = document.getElementById('lineHeightText');
    const letterSpacingText = document.getElementById('letterSpacingText');
    const readingSpeedText = document.getElementById('readingSpeedText');
    const accessibilityToggleButton = document.getElementById('accessibilityToggleButton');
    const pwaAcessibilidadeBar = document.getElementById('pwaAcessibilidadeBar');
    const pwaAcessibilidadeCloseBtn = document.getElementById('pwaAcessibilidadeCloseBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const offCanvasMenu = document.getElementById('offCanvasMenu');

    // --- Variáveis de Estado de Acessibilidade ---
    let currentFontSize = 1;
    let currentLineHeight = 1;
    let currentLetterSpacing = 1;
    let velocidadeLeituraAtual = 1;
    let ultimoElementoFocado = null;
    const synth = window.speechSynthesis;
    let leitorAtivo = false;
    let isPaused = false;
    const velocidadesLeitura = [
        { rate: 0.8, label: 'Lenta' },
        { rate: 1, label: 'Normal' },
        { rate: 1.5, label: 'Rápida' },
        { rate: 2.0, label: 'Muito Rápida' }
    ];

    // --- Funções de Acessibilidade ---
    function announceStatus(message) {
        statusMessageDiv.textContent = message;
        setTimeout(() => statusMessageDiv.textContent = '', 3000);
    }
    
    // Funções de atualização com `announce` opcional para evitar anúncios na carga inicial
    function updateFontSize(announce = true) {
        const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
        const labels = ['Normal', 'Médio', 'Grande', 'Extra Grande', 'Máximo'];
        body.style.fontSize = sizes[currentFontSize - 1];
        if (fontSizeText) fontSizeText.textContent = labels[currentFontSize - 1];
        localStorage.setItem('fontSize', currentFontSize);
        if (announce) announceStatus(`Tamanho da fonte alterado para ${labels[currentFontSize - 1]}`);
    }

    function updateLineHeight(announce = true) {
        const heights = ['1.5', '1.8', '2.2'];
        const labels = ['Médio', 'Grande', 'Extra Grande'];
        document.documentElement.style.setProperty('--espacamento-linha', heights[currentLineHeight - 1]);
        if (lineHeightText) lineHeightText.textContent = labels[currentLineHeight - 1];
        localStorage.setItem('lineHeight', currentLineHeight);
        if (announce) announceStatus(`Espaçamento de linha alterado para ${labels[currentLineHeight - 1]}`);
    }

    function updateLetterSpacing(announce = true) {
        const spacings = ['0em', '0.05em', '0.1em'];
        const labels = ['Normal', 'Médio', 'Grande'];
        document.documentElement.style.setProperty('--espacamento-letra', spacings[currentLetterSpacing - 1]);
        if (letterSpacingText) letterSpacingText.textContent = labels[currentLetterSpacing - 1];
        localStorage.setItem('letterSpacing', currentLetterSpacing);
        if (announce) announceStatus(`Espaçamento de letra alterado para ${labels[currentLetterSpacing - 1]}`);
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

    // --- Leitor de Tela (TTS) ---
    document.addEventListener('focusin', (event) => { ultimoElementoFocado = event.target; });

    function lerConteudo(texto) {
        if (synth.speaking) synth.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = velocidadesLeitura[velocidadeLeituraAtual - 1].rate;
        utterance.onstart = () => { leitorAtivo = true; isPaused = false; };
        utterance.onend = () => { leitorAtivo = false; isPaused = false; };
        utterance.onerror = () => { leitorAtivo = false; isPaused = false; console.error("Erro na síntese de voz."); };
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
        setTimeout(handleToggleLeitura, 100); // Pequeno delay para garantir o cancelamento
        announceStatus('Leitura reiniciada.');
    }

    function handleVelocidadeLeitura() {
        velocidadeLeituraAtual = (velocidadeLeituraAtual % velocidadesLeitura.length) + 1;
        const novaVelocidade = velocidadesLeitura[velocidadeLeituraAtual - 1];
        if (readingSpeedText) readingSpeedText.textContent = novaVelocidade.label;
        localStorage.setItem('readingSpeed', velocidadeLeituraAtual);
        announceStatus(`Velocidade de leitura: ${novaVelocidade.label}`);
        if (leitorAtivo && !isPaused) {
            handleReiniciarLeitura();
        }
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

    // --- Modal de Atalhos ---
    const keyboardShortcutsModal = document.getElementById('keyboardShortcutsModal');
    const closeShortcutsBtn = document.getElementById('keyboardModalCloseButton');

    function showShortcutsModal() {
        keyboardShortcutsModal?.classList.remove('hidden');
    }
    
    function hideShortcutsModal() {
        keyboardShortcutsModal?.classList.add('hidden');
    }
    
    closeShortcutsBtn?.addEventListener('click', hideShortcutsModal);
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !keyboardShortcutsModal?.classList.contains('hidden')) {
            hideShortcutsModal();
        }
    });

    // --- Reset ---
    function resetarAcessibilidade() {
        synth.cancel(); // Para qualquer leitura
        currentFontSize = 1;
        currentLineHeight = 1;
        currentLetterSpacing = 1;
        velocidadeLeituraAtual = 1;
        
        body.style.fontSize = '';
        document.documentElement.style.setProperty('--espacamento-linha', '1.5');
        document.documentElement.style.setProperty('--espacamento-letra', '0em');
        
        body.classList.remove('contraste-alto', 'dark-mode', 'fonte-dislexia');
        
        localStorage.clear();

        updateFontSize(false);
        updateLineHeight(false);
        updateLetterSpacing(false);
        if (readingSpeedText) readingSpeedText.textContent = 'Normal';
        setFocusColor('yellow', false); // Reseta para o padrão
        
        announceStatus('Configurações de acessibilidade redefinidas.');
    }

    // --- Adicionar Event Listeners ---
    const eventMap = {
        'btnAlternarTamanhoFonte': () => { currentFontSize = (currentFontSize % 5) + 1; updateFontSize(); },
        'btnAlternarTamanhoFontePWA': () => { currentFontSize = (currentFontSize % 5) + 1; updateFontSize(); },
        
        'btnAlternarEspacamentoLinha': () => { currentLineHeight = (currentLineHeight % 3) + 1; updateLineHeight(); },
        'btnAlternarEspacamentoLinhaPWA': () => { currentLineHeight = (currentLineHeight % 3) + 1; updateLineHeight(); },

        'btnAlternarEspacamentoLetra': () => { currentLetterSpacing = (currentLetterSpacing % 3) + 1; updateLetterSpacing(); },
        'btnAlternarEspacamentoLetraPWA': () => { currentLetterSpacing = (currentLetterSpacing % 3) + 1; updateLetterSpacing(); },
        
        'btnAlternarContraste': () => { body.classList.toggle('contraste-alto'); announceStatus('Alto contraste ' + (body.classList.contains('contraste-alto') ? 'ativado' : 'desativado')); },
        'btnAlternarContrastePWA': () => { body.classList.toggle('contraste-alto'); announceStatus('Alto contraste ' + (body.classList.contains('contraste-alto') ? 'ativado' : 'desativado')); },

        'btnAlternarModoEscuro': () => { body.classList.toggle('dark-mode'); announceStatus('Modo escuro ' + (body.classList.contains('dark-mode') ? 'ativado' : 'desativado')); },
        'btnAlternarModoEscuroPWA': () => { body.classList.toggle('dark-mode'); announceStatus('Modo escuro ' + (body.classList.contains('dark-mode') ? 'ativado' : 'desativado')); },

        'btnAlternarFonteDislexia': () => { body.classList.toggle('fonte-dislexia'); announceStatus('Fonte para dislexia ' + (body.classList.contains('fonte-dislexia') ? 'ativada' : 'desativada')); },
        'btnAlternarFonteDislexiaPWA': () => { body.classList.toggle('fonte-dislexia'); announceStatus('Fonte para dislexia ' + (body.classList.contains('fonte-dislexia') ? 'ativada' : 'desativada')); },

        'btnResetarAcessibilidade': resetarAcessibilidade,
        'btnResetarAcessibilidadePWA': resetarAcessibilidade,

        'btnToggleLeitura': handleToggleLeitura,
        'btnReiniciarLeitura': handleReiniciarLeitura,
        'btnAlternarVelocidadeLeitura': handleVelocidadeLeitura,
        'btnReadFocused': handleLerFoco,
        
        'btnKeyboardShortcuts': showShortcutsModal,
        'btnKeyboardShortcutsPWA': showShortcutsModal
    };

    for (const id in eventMap) {
        document.getElementById(id)?.addEventListener('click', eventMap[id]);
    }
    
    document.querySelectorAll('.color-option').forEach(button => {
        button.addEventListener('click', () => setFocusColor(button.dataset.color));
    });

    // --- Lógica de Carregamento Inicial das Configurações ---
    function loadAccessibilitySettings() {
        currentFontSize = parseInt(localStorage.getItem('fontSize') || '1', 10);
        updateFontSize(false);

        currentLineHeight = parseInt(localStorage.getItem('lineHeight') || '1', 10);
        updateLineHeight(false);

        currentLetterSpacing = parseInt(localStorage.getItem('letterSpacing') || '1', 10);
        updateLetterSpacing(false);

        velocidadeLeituraAtual = parseInt(localStorage.getItem('readingSpeed') || '1', 10);
        if (readingSpeedText) readingSpeedText.textContent = velocidadesLeitura[velocidadeLeituraAtual - 1].label;

        if (localStorage.getItem('highContrast') === 'true') body.classList.add('contraste-alto');
        if (localStorage.getItem('darkMode') === 'true') body.classList.add('dark-mode');
        if (localStorage.getItem('dyslexiaFont') === 'true') body.classList.add('fonte-dislexia');
        
        const savedColor = localStorage.getItem('focusColor') || 'yellow';
        setFocusColor(savedColor, false);
    }

    loadAccessibilitySettings();
    
    // --- Lógica do Menu PWA/Mobile ---
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
        const maxAttempts = 50;
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
