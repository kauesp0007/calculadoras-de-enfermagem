/**
 * =================================================================================
 * SERVICE WORKER REGISTRATION
 * This code checks if the browser supports Service Workers and, if so,
 * registers the sw.js file to enable offline caching.
 * =================================================================================
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registered successfully:', registration.scope);
    }, err => {
      console.log('Service Worker registration failed:', err);
    });
  });
}

/**
 * =================================================================================
 * GLOBAL SCRIPTS FILE - CORRECTED AND UNIFIED VERSION
 * This file contains all the JavaScript logic shared by the site.
 * =================================================================================
 */

function gerarPDFGlobal(options) {
    const {
        titulo = 'Calculator Report',
        subtitulo = 'Care Calculation Report',
        nomeArquivo = 'report.pdf',
        seletorConteudo = '.main-content-wrapper'
    } = options;

    console.log(`Starting PDF generation for: ${titulo}`);
    const elementoParaImprimir = document.querySelector(seletorConteudo);

    if (!elementoParaImprimir) {
        alert('Error: Could not find the main content to generate the PDF.');
        console.error(`Element with selector "${seletorConteudo}" not found.`);
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
        <p style="font-size: 10px; color: #999; margin-top: 10px;">Generated on: ${new Date().toLocaleString('en-US')}</p>
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
        console.error("Error generating PDF: ", err);
    });
}

function initializeNavigationMenu() {
  const headerHtml = `
    <header class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6 md:justify-start md:space-x-10">
          <div class="flex justify-start lg:w-0 lg:flex-1">
            <a href="/en/">
              <span class="sr-only">Nursing Calculators</span>
              <img class="h-10 w-auto sm:h-12" src="https://www.calculadorasdeenfermagem.com.br/logonav.webp" alt="Nursing Calculators Logo">
            </a>
          </div>
          <div class="-mr-2 -my-2 md:hidden">
            <button type="button" id="mobile-menu-open-button" class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-light-blue" aria-expanded="false">
              <span class="sr-only">Open menu</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <nav class="hidden md:flex space-x-10">
            <a href="/en/" class="text-base font-medium text-gray-500 hover:text-gray-900">Home</a>
            <a href="/en/sobre-nos.html" class="text-base font-medium text-gray-500 hover:text-gray-900">About Us</a>
            <a href="/en/calculadoras.html" class="text-base font-medium text-gray-500 hover:text-gray-900">Calculators</a>
            <a href="/en/politica.html" class="text-base font-medium text-gray-500 hover:text-gray-900">Policies</a>
            <a href="/en/contato.html" class="text-base font-medium text-gray-500 hover:text-gray-900">Contact</a>
          </nav>
          <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            <a href="/" class="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-light-blue hover:bg-dark-blue">
              Português
            </a>
          </div>
        </div>
      </div>

      <div id="mobile-menu" class="absolute z-50 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden hidden">
        <div class="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
          <div class="pt-5 pb-6 px-5">
            <div class="flex items-center justify-between">
              <div>
                <img class="h-10 w-auto" src="https://www.calculadorasdeenfermagem.com.br/logonav.webp" alt="Workflow">
              </div>
              <div class="-mr-2">
                <button type="button" id="mobile-menu-close-button" class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-light-blue">
                  <span class="sr-only">Close menu</span>
                  <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="mt-6">
              <nav class="grid gap-y-8">
                <a href="/en/" class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50">
                  <span class="ml-3 text-base font-medium text-gray-900">Home</span>
                </a>
                <a href="/en/sobre-nos.html" class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50">
                  <span class="ml-3 text-base font-medium text-gray-900">About Us</span>
                </a>
                <a href="/en/calculadoras.html" class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50">
                  <span class="ml-3 text-base font-medium text-gray-900">Calculators</span>
                </a>
                <a href="/en/politica.html" class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50">
                  <span class="ml-3 text-base font-medium text-gray-900">Policies</span>
                </a>
                <a href="/en/contato.html" class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50">
                  <span class="ml-3 text-base font-medium text-gray-900">Contact</span>
                </a>
              </nav>
            </div>
          </div>
          <div class="py-6 px-5 space-y-6">
            <div>
              <a href="/" class="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-light-blue hover:bg-dark-blue">
                Português
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  `;
  const headerContainer = document.getElementById('global-header-container');
  if (headerContainer) {
    headerContainer.innerHTML = headerHtml;
  }

  const mobileMenuOpenButton = document.getElementById('mobile-menu-open-button');
  const mobileMenuCloseButton = document.getElementById('mobile-menu-close-button');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuOpenButton) {
    mobileMenuOpenButton.addEventListener('click', () => {
      mobileMenu.classList.remove('hidden');
    });
  }

  if (mobileMenuCloseButton) {
    mobileMenuCloseButton.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  }
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
  const velocidadesLeitura = [{ rate: 0.8, label: 'Slow' }, { rate: 1, label: 'Normal' }, { rate: 1.5, label: 'Fast' }];
  
  document.addEventListener('focusin', (event) => { ultimoElementoFocado = event.target; });

  function announceStatus(message) {
      statusMessageDiv.textContent = message;
      setTimeout(() => statusMessageDiv.textContent = '', 3000);
  }

  function updateFontSize(announce = true) {
      const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
      const labels = ['Normal', 'Medium', 'Large', 'Extra Large', 'Maximum'];
      currentFontSize = (currentFontSize % sizes.length) + 1;
      const newIndex = currentFontSize - 1;
      body.style.fontSize = sizes[newIndex];
      if (fontSizeText) fontSizeText.textContent = labels[newIndex];
      localStorage.setItem('fontSize', currentFontSize);
      if (announce) announceStatus(`Font size: ${labels[newIndex]}`);
  }

  function updateLineHeight(announce = true) {
      const heights = ['1.5', '1.8', '2.2'];
      const labels = ['Medium', 'Large', 'Extra Large'];
      currentLineHeight = (currentLineHeight % heights.length) + 1;
      const newIndex = currentLineHeight - 1;
      document.documentElement.style.setProperty('--espacamento-linha', heights[newIndex]);
      if (lineHeightText) lineHeightText.textContent = labels[newIndex];
      localStorage.setItem('lineHeight', currentLineHeight);
      if (announce) announceStatus(`Line spacing: ${labels[newIndex]}`);
  }

  function updateLetterSpacing(announce = true) {
      const spacings = ['0em', '0.05em', '0.1em'];
      const labels = ['Normal', 'Medium', 'Large'];
      currentLetterSpacing = (currentLetterSpacing % spacings.length) + 1;
      const newIndex = currentLetterSpacing - 1;
      document.documentElement.style.setProperty('--espacamento-letra', spacings[newIndex]);
      if (letterSpacingText) letterSpacingText.textContent = labels[newIndex];
      localStorage.setItem('letterSpacing', currentLetterSpacing);
      if (announce) announceStatus(`Letter spacing: ${labels[newIndex]}`);
  }

  function setFocusColor(color, announce = true) {
      if (!color) return;
      document.documentElement.style.setProperty('--cor-foco-acessibilidade', color);
      localStorage.setItem('focusColor', color);
      document.querySelectorAll('.color-option').forEach(opt => {
          opt.classList.toggle('selected', opt.dataset.color === color);
      });
      if (announce) announceStatus(`Focus color changed.`);
  }

  function toggleContrast() {
      body.classList.toggle('contraste-alto');
      announceStatus('High contrast ' + (body.classList.contains('contraste-alto') ? 'enabled' : 'disabled'));
  }

  function toggleDarkMode() {
      body.classList.toggle('dark-mode');
      announceStatus('Dark mode ' + (body.classList.contains('dark-mode') ? 'enabled' : 'disabled'));
  }

  function toggleDyslexiaFont() {
      body.classList.toggle('fonte-dislexia');
      announceStatus('Dyslexia font ' + (body.classList.contains('fonte-dislexia') ? 'enabled' : 'disabled'));
  }

  function lerConteudo(texto) {
      if (!texto || !synth) return;
      if (synth.speaking) synth.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'en-US';
      utterance.rate = velocidadesLeitura[velocidadeLeituraAtual - 1]?.rate || 1;
      utterance.onstart = () => { leitorAtivo = true; isPaused = false; };
      utterance.onend = () => { leitorAtivo = false; isPaused = false; };
      utterance.onerror = (e) => { leitorAtivo = false; isPaused = false; console.error("Error in screen reader:", e); };
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
      announceStatus('Accessibility settings reset.');
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
  
  // Call the function that initializes all cookie logic
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
  // --- Page Search Functionality ---
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
      clearHighlight(); // Clear previous highlights

      if (query.length > 2) {
          highlightText(query);
          const firstMatch = document.querySelector('.highlight');
          if (firstMatch) {
              firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
              alert('No results found.');
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


  // --- Translation Functionality (Google Translate) ---
  window.googleTranslateElementInit = function() {
      new google.translate.TranslateElement({
          pageLanguage: 'en',
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

// FIND the function initializeCookieFunctionality() in your JS and REPLACE it with this complete block:
function initializeCookieFunctionality() {
    // Selects all cookie-related elements
    const cookieConsentBanner = document.getElementById('cookieConsentBanner');
    const acceptAllCookiesBtn = document.getElementById('acceptAllCookiesBtn');
    const refuseAllCookiesBtn = document.getElementById('refuseAllCookiesBtn');
    const manageCookiesBtn = document.getElementById('manageCookiesBtn'); // Button on the banner
    const granularCookieModal = document.getElementById('granularCookieModal');
    const saveGranularPreferencesBtn = document.getElementById('saveGranularPreferencesBtn');
    const granularModalCloseButton = document.getElementById('granularModalCloseButton');
    const cancelGranularPreferencesBtn = document.getElementById('cancelGranularPreferencesBtn');
    const cookieAnalyticsCheckbox = document.getElementById('cookieAnalytics');
    const cookieMarketingCheckbox = document.getElementById('cookieMarketing');

    // "Manage Cookie Preferences" button that is in the footer
    const openGranularCookieModalBtn = document.getElementById('openGranularCookieModalBtn');

    // Helper functions to show/hide elements
    const showCookieBanner = () => { if (!localStorage.getItem('cookieConsent') && cookieConsentBanner) cookieConsentBanner.classList.add('show'); };
    const hideCookieBanner = () => { if (cookieConsentBanner) cookieConsentBanner.classList.remove('show'); };
    
    const showGranularCookieModal = () => {
        if (!granularCookieModal) return;
        if(cookieAnalyticsCheckbox) cookieAnalyticsCheckbox.checked = localStorage.getItem('analytics_storage') === 'granted';
        if(cookieMarketingCheckbox) cookieMarketingCheckbox.checked = localStorage.getItem('ad_storage') === 'granted';
        granularCookieModal.classList.remove('hidden');
        // Forces the browser to apply the change before adding the transition class
        setTimeout(() => {
            granularCookieModal.classList.add('show');
        }, 10);
    };
    
    const hideGranularCookieModal = () => { 
        if(granularCookieModal) {
            granularCookieModal.classList.remove('show');
            setTimeout(() => {
                granularCookieModal.classList.add('hidden');
            }, 300); // Must match the duration of the CSS transition
        }
    };

    const updateGtagConsent = (consent) => { if(typeof gtag === 'function') { gtag('consent', 'update', consent); } };

    // Adds events to the buttons
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

    // Listener for the "Manage cookies" button on the BANNER
    manageCookiesBtn?.addEventListener('click', showGranularCookieModal);
    
    // Listener for the "Manage Cookie Preferences" button in the FOOTER
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

    // Displays the initial banner if necessary
    showCookieBanner();
}


document.addEventListener('DOMContentLoaded', function() {
    initializeNavigationMenu();

    // The logic below this point can be loaded from global-body-elements.html
    // but we will keep it in this file for now for simplicity.
    // ... [rest of the initialization logic]
    // The rest of the original script remains here
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
  // Original logic continues here
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
  const velocidadesLeitura = [{ rate: 0.8, label: 'Slow' }, { rate: 1, label: 'Normal' }, { rate: 1.5, label: 'Fast' }];
  
  document.addEventListener('focusin', (event) => { ultimoElementoFocado = event.target; });

  function announceStatus(message) {
      statusMessageDiv.textContent = message;
      setTimeout(() => statusMessageDiv.textContent = '', 3000);
  }

  function updateFontSize(announce = true) {
      const sizes = ['1em', '1.15em', '1.3em', '1.5em', '2em'];
      const labels = ['Normal', 'Medium', 'Large', 'Extra Large', 'Maximum'];
      currentFontSize = (currentFontSize % sizes.length) + 1;
      const newIndex = currentFontSize - 1;
      body.style.fontSize = sizes[newIndex];
      if (fontSizeText) fontSizeText.textContent = labels[newIndex];
      localStorage.setItem('fontSize', currentFontSize);
      if (announce) announceStatus(`Font size: ${labels[newIndex]}`);
  }

  function updateLineHeight(announce = true) {
      const heights = ['1.5', '1.8', '2.2'];
      const labels = ['Medium', 'Large', 'Extra Large'];
      currentLineHeight = (currentLineHeight % heights.length) + 1;
      const newIndex = currentLineHeight - 1;
      document.documentElement.style.setProperty('--espacamento-linha', heights[newIndex]);
      if (lineHeightText) lineHeightText.textContent = labels[newIndex];
      localStorage.setItem('lineHeight', currentLineHeight);
      if (announce) announceStatus(`Line spacing: ${labels[newIndex]}`);
  }

  function updateLetterSpacing(announce = true) {
      const spacings = ['0em', '0.05em', '0.1em'];
      const labels = ['Normal', 'Medium', 'Large'];
      currentLetterSpacing = (currentLetterSpacing % spacings.length) + 1;
      const newIndex = currentLetterSpacing - 1;
      document.documentElement.style.setProperty('--espacamento-letra', spacings[newIndex]);
      if (letterSpacingText) letterSpacingText.textContent = labels[newIndex];
      localStorage.setItem('letterSpacing', currentLetterSpacing);
      if (announce) announceStatus(`Letter spacing: ${labels[newIndex]}`);
  }

  function setFocusColor(color, announce = true) {
      if (!color) return;
      document.documentElement.style.setProperty('--cor-foco-acessibilidade', color);
      localStorage.setItem('focusColor', color);
      document.querySelectorAll('.color-option').forEach(opt => {
          opt.classList.toggle('selected', opt.dataset.color === color);
      });
      if (announce) announceStatus(`Focus color changed.`);
  }

  function toggleContrast() {
      body.classList.toggle('contraste-alto');
      announceStatus('High contrast ' + (body.classList.contains('contraste-alto') ? 'enabled' : 'disabled'));
  }

  function toggleDarkMode() {
      body.classList.toggle('dark-mode');
      announceStatus('Dark mode ' + (body.classList.contains('dark-mode') ? 'enabled' : 'disabled'));
  }

  function toggleDyslexiaFont() {
      body.classList.toggle('fonte-dislexia');
      announceStatus('Dyslexia font ' + (body.classList.contains('fonte-dislexia') ? 'enabled' : 'disabled'));
  }

  function lerConteudo(texto) {
      if (!texto || !synth) return;
      if (synth.speaking) synth.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'en-US';
      utterance.rate = velocidadesLeitura[velocidadeLeituraAtual - 1]?.rate || 1;
      utterance.onstart = () => { leitorAtivo = true; isPaused = false; };
      utterance.onend = () => { leitorAtivo = false; isPaused = false; };
      utterance.onerror = (e) => { leitorAtivo = false; isPaused = false; console.error("Error in screen reader:", e); };
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
      announceStatus('Accessibility settings reset.');
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
  
  // Call the function that initializes all cookie logic
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
  // --- Page Search Functionality ---
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
      clearHighlight(); // Clear previous highlights

      if (query.length > 2) {
          highlightText(query);
          const firstMatch = document.querySelector('.highlight');
          if (firstMatch) {
              firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
              alert('No results found.');
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


  // --- Translation Functionality (Google Translate) ---
  window.googleTranslateElementInit = function() {
      new google.translate.TranslateElement({
          pageLanguage: 'en',
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
}
