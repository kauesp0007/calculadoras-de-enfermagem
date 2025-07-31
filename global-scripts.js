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
    
    // --- Variáveis de Estado ---
    let currentFontSize = 1;
    let currentLineHeight = 1;
    let currentLetterSpacing = 1;
    
    // --- Funções de Acessibilidade (Resumidas para brevidade, use as suas funções completas aqui) ---
    function announceStatus(message) {
        if (statusMessageDiv) statusMessageDiv.textContent = message;
    }

    function updateFontSize(announce = true) {
        const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
        const labels = ['Normal', 'Médio', 'Grande', 'Extra Grande', 'Máximo'];
        body.style.fontSize = sizes[currentFontSize - 1];
        if (fontSizeText) fontSizeText.textContent = labels[currentFontSize - 1];
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
        announceStatus(`Modo de alto contraste ${isActive ? 'ativado' : 'desativado'}.`);
    }

    function alternarModoEscuro() {
        body.classList.toggle('dark-mode');
        const isActive = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isActive);
        if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', isActive);
        announceStatus(`Modo escuro ${isActive ? 'ativado' : 'desativado'}.`);
    }

    function alternarFonteDislexia() {
        body.classList.toggle('fonte-dislexia');
        const isActive = body.classList.contains('fonte-dislexia');
        localStorage.setItem('fonteDislexia', isActive);
        announceStatus(`Fonte para dislexia ${isActive ? 'ativada' : 'desativada'}.`);
    }
    
    function resetarAcessibilidade() {
        // Redefine as variáveis de estado
        currentFontSize = 1;
        currentLineHeight = 1;
        currentLetterSpacing = 1;
        
        // Remove estilos e classes
        body.style.fontSize = '';
        document.documentElement.style.setProperty('--espacamento-linha', '1.5');
        document.documentElement.style.setProperty('--espacamento-letra', '0em');
        body.classList.remove('contraste-alto', 'dark-mode', 'fonte-dislexia');
        
        // Limpa o localStorage
        localStorage.clear();
        
        // Atualiza a interface
        updateFontSize(false);
        updateLineHeight(false);
        updateLetterSpacing(false);
        if (btnAlternarContraste) btnAlternarContraste.setAttribute('aria-pressed', 'false');
        if (btnAlternarModoEscuro) btnAlternarModoEscuro.setAttribute('aria-pressed', 'false');
        
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

    // --- Lógica do Banner de Cookies ---
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn');

    if (cookieConsentBanner && !localStorage.getItem('cookieConsent')) {
        cookieConsentBanner.classList.add('show');
    }

    if(acceptAllCookiesBtn){
        acceptAllCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            cookieConsentBanner.classList.remove('show');
        });
    }

    if(refuseAllCookiesBtn) {
        refuseAllCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'refused');
            cookieConsentBanner.classList.remove('show');
        });
    }

    // --- Event Listeners da Barra de Acessibilidade (Desktop) ---
    // Atribui os eventos apenas se os botões existirem no DOM.
    document.getElementById('btnAlternarTamanhoFonte')?.addEventListener('click', alternarTamanhoFonte);
    document.getElementById('btnAlternarEspacamentoLinha')?.addEventListener('click', alternarEspacamentoLinha);
    document.getElementById('btnAlternarEspacamentoLetra')?.addEventListener('click', alternarEspacamentoLetra);
    document.getElementById('btnAlternarContraste')?.addEventListener('click', alternarContraste);
    document.getElementById('btnAlternarModoEscuro')?.addEventListener('click', alternarModoEscuro);
    document.getElementById('btnAlternarFonteDislexia')?.addEventListener('click', alternarFonteDislexia);
    document.getElementById('btnResetarAcessibilidade')?.addEventListener('click', resetarAcessibilidade);
});
