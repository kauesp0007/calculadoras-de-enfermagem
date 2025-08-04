/**
 * =================================================================================
 * ARQUIVO DE SCRIPTS GLOBAIS - VERSÃO CORRIGIDA E UNIFICADA
 * Este ficheiro contém toda a lógica JavaScript partilhada pelo site.
 * =================================================================================
 */

/**
 * GERA UM PDF A PARTIR DE UM SELETOR DE CONTEÚDO.
 */
function gerarPDFGlobal(options) {
    const {
        titulo = 'Relatório da Calculadora',
        subtitulo = 'Relatório de Cálculo Assistencial',
        nomeArquivo = 'relatorio.pdf',
        seletorConteudo = '.main-content-wrapper'
    } = options;

    const elementoParaImprimir = document.querySelector(seletorConteudo);

    if (!elementoParaImprimir) {
        alert('Erro: Não foi possível encontrar o conteúdo principal para gerar o PDF.');
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
        contentToPrint.appendChild(conteudoCalculadora.cloneNode(true));
    }

    const resultadoDiv = elementoParaImprimir.querySelector('#resultado');
    if (resultadoDiv && !resultadoDiv.classList.contains('hidden')) {
        const cloneResultado = resultadoDiv.cloneNode(true);
        cloneResultado.style.marginTop = '20px';
        contentToPrint.appendChild(cloneResultado);
    }

    const pdfOptions = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, scrollY: 0, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
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

    const toggleNavMenu = () => {
        const isOpen = offCanvasMenu.classList.toggle('is-open');
        offCanvasMenu.classList.toggle('-translate-x-full');
        menuOverlay.style.display = isOpen ? 'block' : 'none';
    };

    hamburgerButton?.addEventListener('click', toggleNavMenu);
    menuOverlay?.addEventListener('click', () => {
        if (offCanvasMenu?.classList.contains('is-open')) {
            toggleNavMenu();
        }
        const pwaAcessibilidadeBar = document.getElementById('pwaAcessibilidadeBar');
        if (pwaAcessibilidadeBar?.classList.contains('is-open')) {
            pwaAcessibilidadeBar.classList.remove('is-open');
            menuOverlay.style.display = 'none';
        }
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
    // Implementação de tooltips
}

function initializeGlobalFunctions() {
    // =================================================================================
    // NOVA SEÇÃO: Correção de visibilidade para Desktop via JavaScript
    // Este bloco garante que os menus do desktop sejam exibidos, mesmo que o CSS os esconda.
    // =================================================================================
    function forceDesktopView() {
        if (window.innerWidth > 1024) {
            const accessibilityBar = document.getElementById('barraAcessibilidade');
            if (accessibilityBar) {
                accessibilityBar.style.display = 'flex';
            }
            const desktopNav = document.querySelector('nav.desktop-nav');
            if (desktopNav) {
                desktopNav.style.display = 'flex';
            }
        }
    }
    // Executa a função assim que possível e também ao redimensionar a janela
    forceDesktopView();
    window.addEventListener('resize', forceDesktopView);
    // =================================================================================


    const body = document.body;
    const statusMessageDiv = document.createElement('div');
    statusMessageDiv.setAttribute('aria-live', 'polite');
    statusMessageDiv.className = 'sr-only';
    body.appendChild(statusMessageDiv);

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
        statusMessageDiv.textContent = message;
        setTimeout(() => statusMessageDiv.textContent = '', 3000);
    }

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

    function toggleContrast() {
        body.classList.toggle('contraste-alto');
        const isEnabled = body.classList.contains('contraste-alto');
        localStorage.setItem('highContrast', isEnabled);
        announceStatus(`Alto contraste ${isEnabled ? 'ativado' : 'desativado'}`);
    }

    function toggleDarkMode() {
        body.classList.toggle('dark-mode');
        const isEnabled = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isEnabled);
        announceStatus(`Modo escuro ${isEnabled ? 'ativado' : 'desativado'}`);
    }

    function toggleDyslexiaFont() {
        body.classList.toggle('fonte-dislexia');
        const isEnabled = body.classList.contains('fonte-dislexia');
        localStorage.setItem('dyslexiaFont', isEnabled);
        announceStatus(`Fonte para dislexia ${isEnabled ? 'ativada' : 'desativada'}`);
    }

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
        setFocusColor('yellow', false);
        announceStatus('Configurações de acessibilidade redefinidas.');
    }

    const accessibilityActions = [
        { ids: ['btnAlternarTamanhoFonte', 'btnAlternarTamanhoFontePWA'], action: updateFontSize },
        { ids: ['btnAlternarEspacamentoLinha', 'btnAlternarEspacamentoLinhaPWA'], action: updateLineHeight },
        { ids: ['btnAlternarEspacamentoLetra', 'btnAlternarEspacamentoLetraPWA'], action: updateLetterSpacing },
        { ids: ['btnAlternarContraste', 'btnAlternarContrastePWA'], action: toggleContrast },
        { ids: ['btnAlternarModoEscuro', 'btnAlternarModoEscuroPWA'], action: toggleDarkMode },
        { ids: ['btnAlternarFonteDislexia', 'btnAlternarFonteDislexiaPWA'], action: toggleDyslexiaFont },
        { ids: ['btnResetarAcessibilidade', 'btnResetarAcessibilidadePWA'], action: resetarAcessibilidade },
        { ids: ['btnKeyboardShortcuts', 'btnKeyboardShortcutsPWA'], action: showShortcutsModal }
    ];

    accessibilityActions.forEach(item => {
        item.ids.forEach(id => {
            document.getElementById(id)?.addEventListener('click', item.action);
        });
    });
    
    document.querySelectorAll('.color-option').forEach(button => {
        button.addEventListener('click', () => setFocusColor(button.dataset.color));
    });

    function loadAccessibilitySettings() {
        currentFontSize = parseInt(localStorage.getItem('fontSize') || '1', 10);
        updateFontSize(false);
        currentLineHeight = parseInt(localStorage.getItem('lineHeight') || '1', 10);
        updateLineHeight(false);
        currentLetterSpacing = parseInt(localStorage.getItem('letterSpacing') || '1', 10);
        updateLetterSpacing(false);
        if (localStorage.getItem('highContrast') === 'true') body.classList.add('contraste-alto');
        if (localStorage.getItem('darkMode') === 'true') body.classList.add('dark-mode');
        if (localStorage.getItem('dyslexiaFont') === 'true') body.classList.add('fonte-dislexia');
        const savedColor = localStorage.getItem('focusColor') || 'yellow';
        setFocusColor(savedColor, false);
    }

    loadAccessibilitySettings();
    
    accessibilityToggleButton?.addEventListener('click', () => {
        if (offCanvasMenu?.classList.contains('is-open')) {
            offCanvasMenu.classList.remove('is-open');
            offCanvasMenu.classList.add('-translate-x-full');
        }
        pwaAcessibilidadeBar?.classList.add('is-open');
        if (menuOverlay) {
            menuOverlay.style.display = 'block';
        }
    });

    pwaAcessibilidadeCloseBtn?.addEventListener('click', () => {
        pwaAcessibilidadeBar?.classList.remove('is-open');
        if (!offCanvasMenu?.classList.contains('is-open')) {
            if (menuOverlay) {
                menuOverlay.style.display = 'none';
            }
        }
    });

    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.style.display = (window.scrollY > 200) ? 'block' : 'none';
        });
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Lógica de Cookies ...
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    // ... restante da lógica de cookies ...
}
