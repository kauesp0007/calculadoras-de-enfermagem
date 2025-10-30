/**
 * =================================================================================
 * REGISTRO DEL SERVICE WORKER
 * Este código verifica si el navegador soporta Service Workers y, si lo hace,
 * registra el archivo sw.js para activar el cache offline.
 * =================================================================================
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registrado con éxito:', registration.scope);
    }, err => {
      console.log('Registro del Service Worker falló:', err);
    });
  });
}

/**
 * =================================================================================
 * ARCHIVO DE SCRIPTS GLOBALES - VERSIÓN CORREGIDA Y UNIFICADA
 * Este archivo contiene toda la lógica JavaScript compartida por el sitio.
 * =================================================================================
 */

// =======================================================================
// INÍCIO DO NOVO CÓDIGO DE GERAÇÃO DE PDF (Substitua o seu antigo)
// =======================================================================

/**
 * FUNÇÃO "PORTEIRO" (GATEKEEPER)
 * Esta função é chamada pelos seus botões.
 * Ela verifica se a biblioteca PDF está carregada antes de executar a lógica.
 */
function gerarPDFGlobal(options) {
    const urlScript = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    
    console.log("Verificando a biblioteca html2pdf...");

    // Verifica se a função html2pdf JÁ existe
    if (typeof html2pdf === 'function') {
        console.log("Biblioteca já carregada. Gerando PDF...");
        // Se sim, apenas executa a lógica principal, passando as 'options'
        executarLogicaDoHtml2Pdf(options);
    } else {
        // Se não, cria a tag <script> para carregar a biblioteca
        console.log("Biblioteca não encontrada. Carregando script...");
        let script = document.createElement('script');
        script.src = urlScript;
        document.head.appendChild(script);

        // O mais importante: espera o script carregar
        script.onload = () => {
            console.log("Biblioteca html2pdf carregada com sucesso. Gerando PDF...");
            // Agora que o script carregou, executa a lógica principal
            executarLogicaDoHtml2Pdf(options);
        };
        
        // (Opcional) Tratamento de erro se o CDN falhar
        script.onerror = () => {
            console.error("Falha ao carregar o script do html2pdf.");
            alert("Erro ao carregar a biblioteca de PDF. Por favor, tente novamente.");
        };
    }
}

/**
 * FUNÇÃO DE "LÓGICA PRINCIPAL"
 * Esta função contém TODO O SEU CÓDIGO ORIGINAL.
 * Ela só é chamada depois que o "porteiro" garante que a biblioteca está carregada.
 */
function executarLogicaDoHtml2Pdf(options) {
    //
    // O SEU CÓDIGO ORIGINAL COMEÇA EXATAMENTE AQUI
    //
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

    // A chamada da biblioteca html2pdf() agora está segura aqui
    html2pdf().set(pdfOptions).from(contentToPrint).save().catch(err => {
        console.error("Erro ao gerar PDF: ", err);
    });
}

// =======================================================================
// FIM DO NOVO CÓDIGO DE GERAÇÃO DE PDF
// =======================================================================

document.addEventListener('DOMContentLoaded', function() {
    fetch('menu-global.html')
        .then(response => response.ok ? response.text() : Promise.reject('Archivo menu-global.html no encontrado'))
        .then(html => {
            const headerContainer = document.getElementById('global-header-container');
            if (headerContainer) {
                headerContainer.innerHTML = html;
                initializeNavigationMenu();
            }
        })
        .catch(error => console.warn('No fue posible cargar el menú global:', error));

    fetch('global-body-elements.html')
        .then(response => response.ok ? response.text() : Promise.reject('Archivo global-body-elements.html no encontrado'))
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            initializeGlobalFunctions();
        })
        .catch(error => console.warn('No fue posible cargar los elementos globales del cuerpo:', error));
});

// COLE ESTA FUNCIÓN COMPLETA EN EL LUGAR DE LA ANTIGUA initializeNavigationMenu()
function initializeNavigationMenu() {
    const hamburgerButton = document.getElementById('hamburgerButton');
    const offCanvasMenu = document.getElementById('offCanvasMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    // COLE ESTA LÍNEA CORREGIDA EN EL LUGAR DE LA ANTIGUA:
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


// ENCUENTRE la función initializeCookieFunctionality() en su JS y REEMPLÁCELA por este bloque completo:

function initializeCookieFunctionality() {
    // Selecciona todos los elementos relacionados con cookies
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn');
    const manageCookiesBtn = document.getElementById('manageCookiesBtn'); // Botón en el banner
    const granularCookieModal = document.getElementById('granularCookieModal');
    const saveGranularPreferencesBtn = document.getElementById('saveGranularPreferencesBtn');
    const granularModalCloseButton = document.getElementById('granularModalCloseButton');
    const cancelGranularPreferencesBtn = document.getElementById('cancelGranularPreferencesBtn');
    const cookieAnalyticsCheckbox = document.getElementById('cookieAnalytics');
    const cookieMarketingCheckbox = document.getElementById('cookieMarketing');

    // Botón "Gestionar Preferencias de Cookies" que está en el pie de página
    const openGranularCookieModalBtn = document.getElementById('openGranularCookieModalBtn');

    // Funciones auxiliares para mostrar/ocultar elementos
    const showCookieBanner = () => { if (!localStorage.getItem('cookieConsent') && cookieConsentBanner) cookieConsentBanner.classList.add('show'); };
    const hideCookieBanner = () => { if (cookieConsentBanner) cookieConsentBanner.classList.remove('show'); };
    
    const showGranularCookieModal = () => {
        if (!granularCookieModal) return;
        if(cookieAnalyticsCheckbox) cookieAnalyticsCheckbox.checked = localStorage.getItem('analytics_storage') === 'granted';
        if(cookieMarketingCheckbox) cookieMarketingCheckbox.checked = localStorage.getItem('ad_storage') === 'granted';
        granularCookieModal.classList.remove('hidden');
        // Forzar al navegador a aplicar el cambio antes de agregar la clase de transición
        setTimeout(() => {
            granularCookieModal.classList.add('show');
        }, 10);
    };
    
    const hideGranularCookieModal = () => { 
        if(granularCookieModal) {
            granularCookieModal.classList.remove('show');
            setTimeout(() => {
                granularCookieModal.classList.add('hidden');
            }, 300); // Debe corresponder a la duración de la transición en el CSS
        }
    };

    const updateGtagConsent = (consent) => { if(typeof gtag === 'function') { gtag('consent', 'update', consent); } };

    // Agrega los eventos a los botones
    acceptAllCookiesBtn?.addEventListener('click', () => {
        updateGtagConsent({ 'analytics_storage': 'granted', 'ad_storage': 'granted' });
        localStorage.setItem('cookieConsent', 'accepted');
        hideCookieBanner();
    });

    refuseAllCookiesBtn?.addEventListener('click', () => {
        updateGtagConsent({ 'analytics_storage': 'denied', 'ad_storage': 'denied' });
        localStorage.setItem('cookieConsent', 'refused');
        hideCookieBanner();
    });

    // Listener para el botón "Gestionar cookies" en el BANNER
    manageCookiesBtn?.addEventListener('click', showGranularCookieModal);
    
    // Listener para el botón "Gestionar Preferencias de Cookies" en el PIE DE PÁGINA
    openGranularCookieModalBtn?.addEventListener('click', showGranularCookieModal);
    
    granularModalCloseButton?.addEventListener('click', hideGranularCookieModal);
    cancelGranularPreferencesBtn?.addEventListener('click', hideGranularCookieModal);
    
    saveGranularPreferencesBtn?.addEventListener('click', () => {
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

    // Muestra el banner inicial si es necesario
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

    function updateFontSize(announce = true) {
        const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
        const labels = ['Normal', 'Medio', 'Grande', 'Extra Grande', 'Máximo'];
        currentFontSize = (currentFontSize % sizes.length) + 1;
        const newIndex = currentFontSize - 1;
        body.style.fontSize = sizes[newIndex];
        if (fontSizeText) fontSizeText.textContent = labels[newIndex];
        localStorage.setItem('fontSize', currentFontSize);
        if (announce) announceStatus(`Tamaño de fuente: ${labels[newIndex]}`);
    }

    function updateLineHeight(announce = true) {
        const heights = ['1.5', '1.8', '2.2'];
        const labels = ['Medio', 'Grande', 'Extra Grande'];
        currentLineHeight = (currentLineHeight % heights.length) + 1;
        const newIndex = currentLineHeight - 1;
        document.documentElement.style.setProperty('--espacamento-linha', heights[newIndex]);
        if (lineHeightText) lineHeightText.textContent = labels[newIndex];
        localStorage.setItem('lineHeight', currentLineHeight);
        if (announce) announceStatus(`Espaciado de línea: ${labels[newIndex]}`);
    }

    function updateLetterSpacing(announce = true) {
        const spacings = ['0em', '0.05em', '0.1em'];
        const labels = ['Normal', 'Medio', 'Grande'];
        currentLetterSpacing = (currentLetterSpacing % spacings.length) + 1;
        const newIndex = currentLetterSpacing - 1;
        document.documentElement.style.setProperty('--espacamento-letra', spacings[newIndex]);
        if (letterSpacingText) letterSpacingText.textContent = labels[newIndex];
        localStorage.setItem('letterSpacing', currentLetterSpacing);
        if (announce) announceStatus(`Espaciado de letra: ${labels[newIndex]}`);
    }

    function setFocusColor(color, announce = true) {
        if (!color) return;
        document.documentElement.style.setProperty('--cor-foco-acessibilidade', color);
        localStorage.setItem('focusColor', color);
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.color === color);
        });
        if (announce) announceStatus(`Color de foco cambiado.`);
    }

    function toggleContrast() {
        body.classList.toggle('contraste-alto');
        announceStatus('Alto contraste ' + (body.classList.contains('contraste-alto') ? 'activado' : 'desactivado'));
    }

    function toggleDarkMode() {
        body.classList.toggle('dark-mode');
        announceStatus('Modo oscuro ' + (body.classList.contains('dark-mode') ? 'activado' : 'desactivado'));
    }

    function toggleDyslexiaFont() {
        body.classList.toggle('fonte-dislexia');
        announceStatus('Fuente para dislexia ' + (body.classList.contains('fonte-dislexia') ? 'activada' : 'desactivada'));
    }

    function lerConteudo(texto) {
        if (!texto || !synth) return;
        if (synth.speaking) synth.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.rate = velocidadesLeitura[velocidadeLeituraAtual - 1]?.rate || 1;
        utterance.onstart = () => { leitorAtivo = true; isPaused = false; };
        utterance.onend = () => { leitorAtivo = false; isPaused = false; };
        utterance.onerror = (e) => { leitorAtivo = false; isPaused = false; console.error("Error en el lector de pantalla:", e); };
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
        setFocusColor('yellow', false);
        announceStatus('Configuración de accesibilidad restablecida.');
    }

    const accessibilityActions = [
        { ids: ['btnAlternarTamanhoFonte', 'btnAlternarTamanhoFontePWA'], action: updateFontSize },
        { ids: ['btnAlternarEspacamentoLinha', 'btnAlternarEspacamentoLinhaPWA'], action: updateLineHeight },
        { ids: ['btnAlternarEspacamentoLetra', 'btnAlternarEspacamentoLetraPWA'], action: updateLetterSpacing },
        { ids: ['btnAlternarContraste', 'btnAlternarContrastePWA'], action: toggleContrast },
        { ids: ['btnAlternarModoEscuro', 'btnAlternarModoEscuroPWA'], action: toggleDarkMode },
        { ids: ['btnAlternarFonteDislexia', 'btnAlternarFonteDislexiaPWA'], action: toggleDyslexiaFont },
        { ids: ['btnResetarAcessibilidade', 'btnResetarAcessibilidadePWA'], action: resetarAcessibilidade },
        { ids: ['btnToggleLeitura'], action: handleToggleLeitura },
        { ids: ['btnReiniciarLeitura'], action: handleReiniciarLeitura },
        { ids: ['btnAlternarVelocidadeLeitura'], action: handleVelocidadeLeitura },
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
    
    // Llama a la función que inicializa toda la lógica de cookies
    initializeCookieFunctionality();

    function loadAccessibilitySettings() {
        currentFontSize = 1;
        updateFontSize(false);

        currentLineHeight = parseInt(localStorage.getItem('lineHeight') || '1', 10);
        updateLineHeight(false);
        currentLetterSpacing = parseInt(localStorage.getItem('letterSpacing') || '1', 10);
        updateLetterSpacing(false);
        velocidadeLeituraAtual = parseInt(localStorage.getItem('readingSpeed') || '1', 10);
        if (readingSpeedText) handleVelocidadeLeitura();
        if (localStorage.getItem('highContrast') === 'true') body.classList.add('contraste-alto');
        if (localStorage.getItem('darkMode') === 'true') body.classList.add('dark-mode');
        if (localStorage.getItem('dyslexiaFont') === 'true') body.classList.add('fonte-dislexia');
        setFocusColor(localStorage.getItem('focusColor') || 'yellow', false);
    }
    loadAccessibilitySettings();
    
    accessibilityToggleButton?.addEventListener('click', () => {
        if (offCanvasMenu?.classList.contains('is-open')) {
            offCanvasMenu.classList.remove('is-open');
            offCanvasMenu.classList.add('-translate-x-full');
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
  // --- Funcionalidad de Búsqueda en la Página ---
    const searchInput = document.getElementById('page-search-input');
    const searchBtn = document.getElementById('search-btn');

    function highlightText(text) {
        let bodyHTML = document.body.innerHTML;
        const regex = new RegExp(`(${text})`, 'gi');
        bodyHTML = bodyHTML.replace(regex, `<span class="highlight">$1</span>`);
        document.body.innerHTML = bodyHTML;
    }

    function clearHighlight() {
        const highlights = document.querySelectorAll('.highlight');
        highlights.forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
        });
    }

    const searchFunction = () => {
        const query = searchInput.value.trim();
        clearHighlight(); // Limpia los resaltados anteriores

        if (query.length > 2) {
            highlightText(query);
            const firstMatch = document.querySelector('.highlight');
            if (firstMatch) {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                alert('Ningún resultado encontrado.');
            }
        }
    };

    searchBtn.addEventListener('click', searchFunction);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchFunction();
        }
    });


    // --- Funcionalidad de Traducción (Google Translate) ---
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'es',
            includedLanguages: 'en,es,pt',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'language-switcher');
    };

    const googleTranslateScript = document.createElement('script');
    googleTranslateScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    googleTranslateScript.async = true;
    document.body.appendChild(googleTranslateScript);

    window.translatePage = function(language) {
        const googleTranslateElement = document.querySelector('.goog-te-combo');
        if (googleTranslateElement) {
            googleTranslateElement.value = language;
            googleTranslateElement.dispatchEvent(new Event('change'));
        }
    };
  
    inicializarTooltips(); 
}