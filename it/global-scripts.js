/**
 * =================================================================================
 * REGISTRAZIONE DEL SERVICE WORKER
 * Questo codice verifica se il browser supporta i Service Worker e, in caso affermativo,
 * registra il file sw.js per abilitare il caching offline.
 * =================================================================================
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registrato con successo:', registration.scope);
    }, err => {
      console.log('Registrazione del Service Worker fallita:', err);
    });
  });
}

/**
 * =================================================================================
 * FILE DI SCRIPT GLOBALI - VERSIONE CORRETTA E UNIFICATA
 * Questo file contiene tutta la logica JavaScript condivisa dal sito.
 * =================================================================================
 */

function gerarPDFGlobal(options) {
    const {
        titulo = 'Report del calcolatore',
        subtitulo = 'Report di calcolo assistenziale',
        nomeArquivo = 'report.pdf',
        seletorConteudo = '.main-content-wrapper'
    } = options;

    console.log(`Avvio della generazione del PDF per: ${titulo}`);
    const elementoParaImprimir = document.querySelector(seletorConteudo);

    if (!elementoParaImprimir) {
        alert('Errore: Impossibile trovare il contenuto principale per generare il PDF.');
        console.error(`Elemento con selettore "${seletorConteudo}" non trovato.`);
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
        <p style="font-size: 10px; color: #999; margin-top: 10px;">Generato il: ${new Date().toLocaleString('it-IT')}</p>
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
        console.error("Errore durante la generazione del PDF: ", err);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('menu-global.html')
        .then(response => response.ok ? response.text() : Promise.reject('File menu-global.html non trovato'))
        .then(html => {
            const headerContainer = document.getElementById('global-header-container');
            if (headerContainer) {
                headerContainer.innerHTML = html;
                initializeNavigationMenu();
            }
        })
        .catch(error => console.warn('Impossibile caricare il menu globale:', error));

    fetch('global-body-elements.html')
        .then(response => response.ok ? response.text() : Promise.reject('File global-body-elements.html non trovato'))
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            initializeGlobalFunctions();
        })
        .catch(error => console.warn('Impossibile caricare gli elementi del corpo globali:', error));
});

// INCOLLA QUESTA FUNZIONE COMPLETA AL POSTO DELLA VECCHIA initializeNavigationMenu()
function initializeNavigationMenu() {
    const hamburgerButton = document.getElementById('hamburgerButton');
    const offCanvasMenu = document.getElementById('offCanvasMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    // INCOLLA QUESTA RIGA CORRETTA AL POSTO DELLA VECCHIA:
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


// TROVA la funzione initializeCookieFunctionality() nel tuo JS e SOSTITUISCILA con questo blocco completo:

function initializeCookieFunctionality() {
    // Seleziona tutti gli elementi correlati ai cookie
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn');
    const manageCookiesBtn = document.getElementById('manageCookiesBtn'); // Pulsante nel banner
    const granularCookieModal = document.getElementById('granularCookieModal');
    const saveGranularPreferencesBtn = document.getElementById('saveGranularPreferencesBtn');
    const granularModalCloseButton = document.getElementById('granularModalCloseButton');
    const cancelGranularPreferencesBtn = document.getElementById('cancelGranularPreferencesBtn');
    const cookieAnalyticsCheckbox = document.getElementById('cookieAnalytics');
    const cookieMarketingCheckbox = document.getElementById('cookieMarketing');

    // Pulsante "Gestisci preferenze cookie" nel footer
    const openGranularCookieModalBtn = document.getElementById('openGranularCookieModalBtn');

    // Funzioni ausiliarie per mostrare/nascondere elementi
    const showCookieBanner = () => { if (!localStorage.getItem('cookieConsent') && cookieConsentBanner) cookieConsentBanner.classList.add('show'); };
    const hideCookieBanner = () => { if (cookieConsentBanner) cookieConsentBanner.classList.remove('show'); };
    
    const showGranularCookieModal = () => {
        if (!granularCookieModal) return;
        if(cookieAnalyticsCheckbox) cookieAnalyticsCheckbox.checked = localStorage.getItem('analytics_storage') === 'granted';
        if(cookieMarketingCheckbox) cookieMarketingCheckbox.checked = localStorage.getItem('ad_storage') === 'granted';
        granularCookieModal.classList.remove('hidden');
        // Forza il browser ad applicare la modifica prima di aggiungere la classe di transizione
        setTimeout(() => {
            granularCookieModal.classList.add('show');
        }, 10);
    };
    
    const hideGranularCookieModal = () => { 
        if(granularCookieModal) {
            granularCookieModal.classList.remove('show');
            setTimeout(() => {
                granularCookieModal.classList.add('hidden');
            }, 300); // Deve corrispondere alla durata della transizione nel CSS
        }
    };

    const updateGtagConsent = (consent) => { if(typeof gtag === 'function') { gtag('consent', 'update', consent); } };

    // Aggiunge gli eventi ai pulsanti
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

    // Listener per il pulsante "Gestisci cookie" nel BANNER
    manageCookiesBtn?.addEventListener('click', showGranularCookieModal);
    
    // Listener per il pulsante "Gestisci preferenze cookie" nel FOOTER
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

    // Mostra il banner iniziale se necessario
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
    const velocidadesLeitura = [{ rate: 0.8, label: 'Lenta' }, { rate: 1, label: 'Normale' }, { rate: 1.5, label: 'Veloce' }];
    
    document.addEventListener('focusin', (event) => { ultimoElementoFocado = event.target; });

    function announceStatus(message) {
        statusMessageDiv.textContent = message;
        setTimeout(() => statusMessageDiv.textContent = '', 3000);
    }

    function updateFontSize(announce = true) {
        const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
        const labels = ['Normale', 'Media', 'Grande', 'Extra Grande', 'Massima'];
        currentFontSize = (currentFontSize % sizes.length) + 1;
        const newIndex = currentFontSize - 1;
        body.style.fontSize = sizes[newIndex];
        if (fontSizeText) fontSizeText.textContent = labels[newIndex];
        localStorage.setItem('fontSize', currentFontSize);
        if (announce) announceStatus(`Dimensione del carattere: ${labels[newIndex]}`);
    }

    function updateLineHeight(announce = true) {
        const heights = ['1.5', '1.8', '2.2'];
        const labels = ['Media', 'Grande', 'Extra Grande'];
        currentLineHeight = (currentLineHeight % heights.length) + 1;
        const newIndex = currentLineHeight - 1;
        document.documentElement.style.setProperty('--espacamento-linha', heights[newIndex]);
        if (lineHeightText) lineHeightText.textContent = labels[newIndex];
        localStorage.setItem('lineHeight', currentLineHeight);
        if (announce) announceStatus(`Interlinea: ${labels[newIndex]}`);
    }

    function updateLetterSpacing(announce = true) {
        const spacings = ['0em', '0.05em', '0.1em'];
        const labels = ['Normale', 'Media', 'Grande'];
        currentLetterSpacing = (currentLetterSpacing % spacings.length) + 1;
        const newIndex = currentLetterSpacing - 1;
        document.documentElement.style.setProperty('--espacamento-letra', spacings[newIndex]);
        if (letterSpacingText) letterSpacingText.textContent = labels[newIndex];
        localStorage.setItem('letterSpacing', currentLetterSpacing);
        if (announce) announceStatus(`Spaziatura delle lettere: ${labels[newIndex]}`);
    }

    function setFocusColor(color, announce = true) {
        if (!color) return;
        document.documentElement.style.setProperty('--cor-foco-acessibilidade', color);
        localStorage.setItem('focusColor', color);
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.color === color);
        });
        if (announce) announceStatus(`Colore del focus cambiato.`);
    }

    function toggleContrast() {
        body.classList.toggle('contraste-alto');
        announceStatus('Contrasto elevato ' + (body.classList.contains('contraste-alto') ? 'attivato' : 'disattivato'));
    }

    function toggleDarkMode() {
        body.classList.toggle('dark-mode');
        announceStatus('Modalità scura ' + (body.classList.contains('dark-mode') ? 'attivata' : 'disattivata'));
    }

    function toggleDyslexiaFont() {
        body.classList.toggle('fonte-dislexia');
        announceStatus('Carattere per dislessia ' + (body.classList.contains('fonte-dislexia') ? 'attivato' : 'disattivato'));
    }

    function lerConteudo(texto) {
        if (!texto || !synth) return;
        if (synth.speaking) synth.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'it-IT';
        utterance.rate = velocidadesLeitura[velocidadeLeituraAtual - 1]?.rate || 1;
        utterance.onstart = () => { leitorAtivo = true; isPaused = false; };
        utterance.onend = () => { leitorAtivo = false; isPaused = false; };
        utterance.onerror = (e) => { leitorAtivo = false; isPaused = false; console.error("Errore nel lettore di schermo:", e); };
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
        if (readingSpeedText) readingSpeedText.textContent = 'Normale';
        setFocusColor('yellow', false);
        announceStatus('Impostazioni di accessibilità ripristinate.');
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
    
    // Chiama la funzione che inizializza tutta la logica dei cookie
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
                    console.warn('Impossibile inizializzare il widget VLibras.');
                    clearInterval(interval);
                }
            }, 200);
        }
    }
    initVLibras();
  // --- Funzionalità di ricerca nella pagina ---
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
        clearHighlight(); // Pulisce le evidenziazioni precedenti

        if (query.length > 2) {
            highlightText(query);
            const firstMatch = document.querySelector('.highlight');
            if (firstMatch) {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                alert('Nessun risultato trovato.');
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


    // --- Funzionalità di traduzione (Google Translate) ---
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'it',
            includedLanguages: 'en,es,pt,it',
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