/**
 * =================================================================================
 * REGISTO DO SERVICE WORKER
 * Este código verifica se o navegador suporta Service Workers e, se suportar,
 * regista o ficheiro sw.js para ativar o cache offline.
 * =================================================================================
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registado com sucesso:', registration.scope);
    }, err => {
      console.log('Registo do Service Worker falhou:', err);
    });
  });
}

/**
 * =================================================================================
 * ARQUIVO DE SCRIPTS GLOBAIS - VERSÃO CORRIGIDA E UNIFICADA
 * Este ficheiro contém toda a lógica JavaScript partilhada pelo site.
 * =================================================================================
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
        cloneConteudo.querySelectorAll('input[type="radio"]:not(:checked)').forEach(radio => radio.closest('.option-row, .option-label')?.remove());
        cloneConteudo.querySelectorAll('tbody, .options-group').forEach(container => {
            if (container.children.length === 0) container.closest('.criterion-section, .criterion-table')?.remove();
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
        html2canvas: { scale: 2, scrollY: 0, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
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
    const closeMenuBtn = document.getElementById('closeOffCanvasMenu') || document.getElementById('closeMenuButton');

    const openNavMenu = () => {
        if(offCanvasMenu) {
            offCanvasMenu.classList.add('is-open');
            offCanvasMenu.classList.remove('-translate-x-full');
        }
        if(menuOverlay) {
            menuOverlay.style.display = 'block';
            menuOverlay.classList.add('is-open');
        }
    };

    const closeNavMenu = () => {
        if(offCanvasMenu) {
            offCanvasMenu.classList.remove('is-open');
            offCanvasMenu.classList.add('-translate-x-full');
        }
        if(menuOverlay) {
            menuOverlay.style.display = 'none';
            menuOverlay.classList.remove('is-open');
        }
    };

    hamburgerButton?.addEventListener('click', openNavMenu);
    menuOverlay?.addEventListener('click', closeNavMenu);
    closeMenuBtn?.addEventListener('click', closeNavMenu);

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


function initializeCookieFunctionality() {
    // Seleciona todos os elementos relacionados a cookies
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

    // Esta é a referência ao botão extra que estava no seu arquivo antigo
    const openGranularCookieModalBtn = document.getElementById('openGranularCookieModalBtn');

    // Funções auxiliares para mostrar/ocultar elementos
    const showCookieBanner = () => { if (!localStorage.getItem('cookieConsent') && cookieConsentBanner) cookieConsentBanner.classList.add('show'); };
    const hideCookieBanner = () => { if (cookieConsentBanner) cookieConsentBanner.classList.remove('show'); };
    const showGranularCookieModal = () => {
        if (!granularCookieModal) return;
        if(cookieAnalyticsCheckbox) cookieAnalyticsCheckbox.checked = localStorage.getItem('analytics_storage') === 'granted';
        if(cookieMarketingCheckbox) cookieMarketingCheckbox.checked = localStorage.getItem('ad_storage') === 'granted';
        // A lógica correta para o CSS atual é remover a classe 'hidden'
        granularCookieModal.classList.remove('hidden');
        // Força o navegador a aplicar a mudança antes de adicionar a classe de transição
        setTimeout(() => {
            granularCookieModal.classList.add('show');
        }, 10);
    };
    const hideGranularCookieModal = () => {
        if(granularCookieModal) {
            granularCookieModal.classList.remove('show');
            setTimeout(() => {
                granularCookieModal.classList.add('hidden');
            }, 300); // Deve corresponder à duração da transição no CSS
        }
    };
    const updateGtagConsent = (consent) => { if(typeof gtag === 'function') { gtag('consent', 'update', consent); } };

    // Adiciona os eventos aos botões
    if (acceptAllCookiesBtn) {
        acceptAllCookiesBtn.addEventListener('click', () => {
            updateGtagConsent({ 'analytics_storage': 'granted', 'ad_storage': 'granted' });
            localStorage.setItem('cookieConsent', 'accepted');
            hideCookieBanner();
        });
    }

    if (refuseAllCookiesBtn) {
        refuseAllCookiesBtn.addEventListener('click', () => {
            updateGtagConsent({ 'analytics_storage': 'denied', 'ad_storage': 'denied' });
            localStorage.setItem('cookieConsent', 'refused');
            hideCookieBanner();
        });
    }

    // Listener para o botão "Gerenciar cookies"
    if (manageCookiesBtn) {
        manageCookiesBtn.addEventListener('click', showGranularCookieModal);
    }
    
    // Listener para o botão extra do arquivo antigo
    if (openGranularCookieModalBtn) {
        openGranularCookieModalBtn.addEventListener('click', showGranularCookieModal);
    }
    
    if (granularModalCloseButton) {
        granularModalCloseButton.addEventListener('click', hideGranularCookieModal);
    }

    if (cancelGranularPreferencesBtn) {
        cancelGranularPreferencesBtn.addEventListener('click', hideGranularCookieModal);
    }
    
    if (saveGranularPreferencesBtn) {
        saveGranularPreferencesBtn.addEventListener('click', () => {
            const consent = { 
                'analytics_storage': cookieAnalyticsCheckbox.checked ? 'granted' : 'denied', 
                'ad_storage': cookieMarketingCheckbox.checked ? 'granted' : 'denied' 
            };
            updateGtagConsent(consent);
            localStorage.setItem('cookieConsent', 'managed');
            localStorage.setItem('analytics_storage', consent.analytics_storage);
            localStorage.setItem('ad_storage', consent.ad_storage);
            hideGranularCookieModal();
            hideCookieBanner();
        });
    }

    // Exibe o banner inicial se necessário
    showCookieBanner();
}


function initializeGlobalFunctions() {
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

    const fontSizeText = document.getElementById('fontSizeText');
    const lineHeightText = document.getElementById('lineHeightText');
    const letterSpacingText = document.getElementById('letterSpacingText');
    const readingSpeedText = document.getElementById('readingSpeedText');
    const accessibilityToggleButton = document.getElementById('accessibilityToggleButton');
    const pwaAcessibilidadeBar = document.getElementById('pwaAcessibilidadeBar');
    const pwaAcessibilidadeCloseBtn = document.getElementById('pwaAcessibilidadeCloseBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const offCanvasMenu = document.getElementById('offCanvasMenu');

    let currentFontSize = 1, currentLineHeight = 1, currentLetterSpacing = 1, velocidadeLeituraAtual = 1;
    let ultimoElementoFocado = null, leitorAtivo = false, isPaused = false;
    const synth = window.speechSynthesis;
    const velocidadesLeitura = [{ rate: 0.8, label: 'Lenta' }, { rate: 1, label: 'Normal' }, { rate: 1.5, label: 'Rápida' }];
    
    document.addEventListener('focusin', (event) => { ultimoElementoFocado = event.target; });

    function announceStatus(message) {
        statusMessageDiv.textContent = message;
        setTimeout(() => statusMessageDiv.textContent = '', 3000);
    }

    // Ação para aumentar o tamanho da fonte, separada da função de aplicação
    function alternarTamanhoFonte() {
        // Correção para ciclar corretamente de 1 a 5
        currentFontSize = (currentFontSize % 5) + 1;
        updateFontSize();
    }

    // Função que aplica o tamanho da fonte
    function updateFontSize(announce = true) {
        const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
        const labels = ['Normal', 'Médio', 'Grande', 'Extra Grande', 'Máximo'];
        // Acessa o índice correto com base em currentFontSize, que varia de 1 a 5
        const newIndex = currentFontSize - 1;
        body.style.fontSize = sizes[newIndex];
        if (fontSizeText) fontSizeText.textContent = labels[newIndex];
        if (fontSizeTextPWA) fontSizeTextPWA.textContent = labels[newIndex];
        localStorage.setItem('fontSize', currentFontSize);
        if (announce) announceStatus(`Tamanho da fonte: ${labels[newIndex]}`);
    }

    function updateLineHeight(announce = true) {
        const heights = ['1.5', '1.8', '2.2'];
        const labels = ['Médio', 'Grande', 'Extra Grande'];
        currentLineHeight = (currentLineHeight % heights.length) + 1;
        const newIndex = currentLineHeight - 1;
        document.documentElement.style.setProperty('--espacamento-linha', heights[newIndex]);
        if (lineHeightText) lineHeightText.textContent = labels[newIndex];
        if (lineHeightTextPWA) lineHeightTextPWA.textContent = labels[newIndex];
        localStorage.setItem('lineHeight', currentLineHeight);
        if (announce) announceStatus(`Espaçamento de linha: ${labels[newIndex]}`);
    }

    function updateLetterSpacing(announce = true) {
        const spacings = ['0em', '0.05em', '0.1em'];
        const labels = ['Normal', 'Médio', 'Grande'];
        currentLetterSpacing = (currentLetterSpacing % spacings.length) + 1;
        const newIndex = currentLetterSpacing - 1;
        document.documentElement.style.setProperty('--espacamento-letra', spacings[newIndex]);
        if (letterSpacingText) letterSpacingText.textContent = labels[newIndex];
        if (letterSpacingTextPWA) letterSpacingTextPWA.textContent = labels[newIndex];
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
        const isActive = body.classList.contains('contraste-alto');
        localStorage.setItem('contrasteAlto', isActive);
        announceStatus(`Modo de alto contraste ${isActive ? 'ativado' : 'desativado'}.`);
    }

    function toggleDarkMode() {
        body.classList.toggle('dark-mode');
        const isActive = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isActive);
        announceStatus(`Modo escuro ${isActive ? 'ativado' : 'desativado'}.`);
    }

    function toggleDyslexiaFont() {
        body.classList.toggle('fonte-dislexia');
        const isActive = body.classList.contains('fonte-dislexia');
        localStorage.setItem('fonteDislexia', isActive);
        announceStatus(`Fonte para dislexia ${isActive ? 'ativada' : 'desativada'}.`);
    }

    function lerConteudo(texto) {
        if (!texto || !synth) return;
        if (synth.speaking) synth.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = velocidadesLeitura[velocidadeLeituraAtual - 1]?.rate || 1;
        utterance.onstart = () => { leitorAtivo = true; isPaused = false; };
        utterance.onend = () => { leitorAtivo = false; isPaused = false; };
        utterance.onerror = (e) => { leitorAtivo = false; isPaused = false; console.error("Erro no leitor de tela:", e); };
        synth.speak(utterance);
    }

    function handleToggleLeitura() {
        if (!leitorAtivo) {
            lerConteudo(document.querySelector('main')?.innerText);
        } else if (isPaused) {
            synth.resume();
            isPaused = false;
        } else {
            synth.pause();
            isPaused = true;
        }
    }

    function handleReiniciarLeitura() {
        leitorAtivo = false;
        isPaused = false;
        setTimeout(() => lerConteudo(document.querySelector('main')?.innerText), 100);
    }

    function handleVelocidadeLeitura() {
        velocidadeLeituraAtual = (velocidadeLeituraAtual % velocidadesLeitura.length) + 1;
        const novaVelocidade = velocidadesLeitura[velocidadeLeituraAtual - 1];
        if (readingSpeedText) readingSpeedText.textContent = novaVelocidade.label;
        if (readingSpeedTextPWA) readingSpeedTextPWA.textContent = novaVelocidade.label;
    }

    function handleLerFoco() {
        if (ultimoElementoFocado) {
            const texto = (ultimoElementoFocado.textContent || ultimoElementoFocado.ariaLabel || ultimoElementoFocado.alt || ultimoElementoFocado.value)?.trim();
            lerConteudo(texto);
        }
    }

    function resetarAcessibilidade() {
        if(synth) synth.cancel();
        currentFontSize = 1; currentLineHeight = 1; currentLetterSpacing = 1; velocidadeLeituraAtual = 1;
        body.style.fontSize = '';
        document.documentElement.style.setProperty('--espacamento-linha', '1.5');
        document.documentElement.style.setProperty('--espacamento-letra', '0em');
        body.classList.remove('contraste-alto', 'dark-mode', 'fonte-dislexia');
        localStorage.clear();
        updateFontSize(false); updateLineHeight(false); updateLetterSpacing(false);
        if (readingSpeedText) readingSpeedText.textContent = 'Normal';
        if (readingSpeedTextPWA) readingSpeedTextPWA.textContent = 'Normal';
        setFocusColor('yellow', false);
        announceStatus('Configurações de acessibilidade redefinidas.');
    }
    
    const accessibilityActions = [
        // Correção: `action` agora chama a nova função `alternarTamanhoFonte`
        { ids: ['btnAlternarTamanhoFonte', 'btnAlternarTamanhoFontePWA'], action: alternarTamanhoFonte },
        { ids: ['btnAlternarEspacamentoLinha', 'btnAlternarEspacamentoLinhaPWA'], action: updateLineHeight },
        { ids: ['btnAlternarEspacamentoLetra', 'btnAlternarEspacamentoLetraPWA'], action: updateLetterSpacing },
        { ids: ['btnAlternarContraste', 'btnAlternarContrastePWA'], action: toggleContrast },
        { ids: ['btnAlternarModoEscuro', 'btnAlternarModoEscuroPWA'], action: toggleDarkMode },
        { ids: ['btnAlternarFonteDislexia', 'btnAlternarFonteDislexiaPWA'], action: toggleDyslexiaFont },
        { ids: ['btnResetarAcessibilidade', 'btnResetarAcessibilidadePWA'], action: resetarAcessibilidade },
        { ids: ['btnToggleLeitura', 'btnToggleLeituraPWA'], action: handleToggleLeitura },
        { ids: ['btnReiniciarLeitura', 'btnReiniciarLeituraPWA'], action: handleReiniciarLeitura },
        { ids: ['btnAlternarVelocidadeLeitura', 'btnAlternarVelocidadeLeituraPWA'], action: handleVelocidadeLeitura },
        { ids: ['btnReadFocused'], action: handleLerFoco },
    ];
    accessibilityActions.forEach(item => {
        item.ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', item.action);
            }
        });
    });
    document.querySelectorAll('.color-option').forEach(button => {
        button.addEventListener('click', () => setFocusColor(button.dataset.color));
    });
    document.querySelectorAll('.color-options-pwa .color-option').forEach(button => {
        button.addEventListener('click', () => setFocusColor(button.dataset.color));
    });

    const keyboardModal = document.getElementById('keyboardShortcutsModal');
    const openKeyboardBtn = document.getElementById('btnKeyboardShortcuts');
    const openKeyboardBtnPWA = document.getElementById('btnKeyboardShortcutsPWA');
    const closeKeyboardBtn = document.getElementById('keyboardModalCloseButton');

    const showKeyboardModal = () => { if (keyboardModal) keyboardModal.classList.remove('hidden'); };
    const hideKeyboardModal = () => { if (keyboardModal) keyboardModal.classList.add('hidden'); };

    openKeyboardBtn?.addEventListener('click', showKeyboardModal);
    openKeyboardBtnPWA?.addEventListener('click', showKeyboardModal);
    closeKeyboardBtn?.addEventListener('click', hideKeyboardModal);
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && keyboardModal && !keyboardModal.classList.contains('hidden')) {
            hideKeyboardModal();
        }
    });
    
    // Chama a função que inicializa toda a lógica de cookies
    initializeCookieFunctionality();

    function loadAccessibilitySettings() {
        const savedFontSize = parseInt(localStorage.getItem('fontSize') || '1', 10);
        currentFontSize = savedFontSize;
        updateFontSize(false); // Aplica a fonte salva. 'false' evita o anúncio inicial.
        
        currentLineHeight = parseInt(localStorage.getItem('lineHeight') || '1', 10);
        updateLineHeight(false);
        currentLetterSpacing = parseInt(localStorage.getItem('letterSpacing') || '1', 10);
        updateLetterSpacing(false);
        velocidadeLeituraAtual = parseInt(localStorage.getItem('readingSpeed') || '1', 10);
        updateReadingSpeed(false);
        if (localStorage.getItem('contrasteAlto') === 'true') body.classList.add('contraste-alto');
        if (localStorage.getItem('darkMode') === 'true') body.classList.add('dark-mode');
        if (localStorage.getItem('fonteDislexia') === 'true') body.classList.add('fonte-dislexia');
        setFocusColor(localStorage.getItem('focusColor') || 'yellow', false);
    }
    loadAccessibilitySettings();
    
    accessibilityToggleButton?.addEventListener('click', () => {
        if (offCanvasMenu?.classList.contains('is-open')) {
            offCanvasMenu.classList.remove('is-open');
        }
        pwaAcessibilidadeBar?.classList.toggle('is-open');
        if (menuOverlay) menuOverlay.style.display = pwaAcessibilidadeBar.classList.contains('is-open') ? 'block' : 'none';
    });

    pwaAcessibilidadeCloseBtn?.addEventListener('click', () => {
        pwaAcessibilidadeBar?.classList.remove('is-open');
        if (!offCanvasMenu?.classList.contains('is-open')) {
            if (menuOverlay) menuOverlay.style.display = 'none';
        }
    });
    
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.style.display = (window.scrollY > 200) ? 'block' : 'none';
        });
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    function initVLibras() {
        if (document.querySelector('[vw]')) {
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
    }
    initVLibras();
  
    inicializarTooltips();

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
        const emailValid = isValidEmail(newsletterEmail.value);
        const consentChecked = newsletterConsent.checked;
        // The button is disabled unless both email is valid and consent is checked.
        subscribeNewsletterBtn.disabled = !(emailValid && consentChecked);
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
                newsletterError.textContent = 'E-mail inválido. Verifique se digitou corretamente, por exemplo: nome@dominio.com';
                newsletterError.style.display = 'block';
                announceStatus('Erro no formulário: E-mail inválido. Verifique se digitou corretamente, por exemplo: nome@dominio.com');
                return;
            }

            if (!newsletterConsent.checked) {
                newsletterError.textContent = 'Você deve aceitar os termos para se inscrever.';
                newsletterError.style.display = 'block';
                announceStatus('Erro no formulário: Você deve aceitar os termos para se inscrever.');
                return;
            }

            newsletterError.style.display = 'none'; // Hide previous errors

            // Disable button during submission
            subscribeNewsletterBtn.disabled = true;
            subscribeNewsletterBtn.textContent = 'Enviando...';
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
                    showCustomModal('Obrigado por se inscrever na nossa newsletter!');
                    newsletterForm.reset(); // Clear form fields
                    updateSubscribeButtonState(); // Update button state after reset
                    announceStatus('Inscrição na newsletter realizada com sucesso!');
                } else {
                    const data = await response.json();
                    let errorMessage = 'Ocorreu um erro ao se inscrever. Por favor, tente novamente. Certifique-se de que o e-mail não está em uso ou tente novamente mais tarde.';
                    if (data.errors) {
                        errorMessage = data.errors.map(error => error.message).join(', ') + '. Verifique se digitou corretamente ou tente novamente mais tarde.';
                    }
                    newsletterError.textContent = errorMessage;
                    newsletterError.style.display = 'block';
                    announceStatus(`Erro na inscrição da newsletter: ${errorMessage}`);
                }
            } catch (error) {
                console.error('Submission error:', error);
                const networkErrorMessage = 'Ocorreu um erro de rede. Por favor, tente novamente.';
                newsletterError.textContent = networkErrorMessage;
                newsletterError.style.display = 'block';
                announceStatus(`Erro na inscrição da newsletter: ${networkErrorMessage}`);
            } finally {
                subscribeNewsletterBtn.disabled = false;
                subscribeNewsletterBtn.textContent = 'Assinar';
            }
        });
    }

    // Initial state update for newsletter button on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', updateSubscribeButtonState);
}
