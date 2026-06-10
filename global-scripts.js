/**
 * ==========================================================================
 * CALCULADORAS DE ENFERMAGEM — ENGINE GLOBAL (V3.0.0)
 * Totalmente otimizado para Core Web Vitals (INP, CLS, LCP)
 * Livre de dependências (Zero jQuery) & Protegido contra Race Conditions
 * ==========================================================================
 */

// --- FASE 0: EXECUÇÃO CRÍTICA IMEDIATA (Bloqueador de CLS de Fonte) ---
(function aplicarTamanhoFonteImediato() {
  try {
    const savedFontSize = parseInt(localStorage.getItem("fontSize") || "1", 10);
    const fontSizes = ["1em", "1.15em", "1.3em", "1.5em", "2em"];
    const idx = Math.min(Math.max(savedFontSize, 1), fontSizes.length);
    document.documentElement.style.fontSize = fontSizes[idx - 1];
  } catch (e) {
    console.warn("Falha ao carregar tamanho de fonte pré-render:", e);
  }
})();

// --- FASE 1: CAMADA ANTI-BOT SILENCIOSA ---
(function executarProtecaoAntiBot() {
  try {
    const ua = navigator.userAgent || "";
    const isBot =
      navigator.webdriver === true ||
      ua.length < 10 ||
      !navigator.language ||
      (window.screen && (window.screen.width === 0 || window.screen.height === 0));

    if (isBot && location.pathname !== "/") {
      location.replace("/");
    }
  } catch (e) {
    // Falha silenciosa para evitar quebra de fluxos normais
  }
})();

// --- FASE 2: GESTÃO CENTRALIZADA DE ESTADO E INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
  // Inicialização do Service Worker para PWA
  registrarServiceWorker();

  // Orquestração de carregamento assíncrono sem concorrência de renderização
  orquestrarComponentesModulares();
});

/**
 * Registra o Service Worker de forma segura e assíncrona
 */
function registrarServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js")
        .then(reg => console.log("SW registrado com sucesso na rota:", reg.scope))
        .catch(err => console.warn("Registro do SW falhou:", err));
    });
  }
}

/**
 * Orquestra de forma sequencial o carregamento de templates HTML
 * para impedir colisões estruturais no DOM (Race Conditions)
 */
async function orquestrarComponentesModulares() {
  try {
    // 1. Carrega o cabeçalho global primeiro
    const headerCarregado = await carregarEInjetarTemplate("/menu-global.html", "global-header-container");

    if (headerCarregado) {
      inicializarMenuNavegacao();

      // 2. Com o cabeçalho no DOM, o placeholder do seletor de idiomas existe. Buscamos ele agora.
      await carregarEInjetarTemplate("/_language_selector.html", "language-selector-placeholder");
      document.dispatchEvent(new CustomEvent("langSelectorLoaded"));
    }

    // 3. Carrega concorrentemente os elementos do corpo (barra de acessibilidade, modals)
    const bodyElementsCarregados = await carregarEInjetarTemplate("/global-body-elements.html", null, true);
    if (bodyElementsCarregados) {
      inicializarFuncoesGlobaisAcessibilidade();
    }
  } catch (erro) {
    console.error("Erro crítico na orquestração de componentes do sistema:", erro);
  }
}

/**
 * Helper genérico para buscar e injetar conteúdo HTML de forma assíncrona
 */
async function carregarEInjetarTemplate(url, targetId, appendToBody = false) {
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao buscar ${url}`);
    const html = await resposta.text();

    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        if (appendToBody) {
          document.body.insertAdjacentHTML("beforeend", html);
        } else {
          const container = document.getElementById(targetId);
          if (container) {
            container.innerHTML = html;
          } else {
            console.warn(`Elemento container #${targetId} não foi encontrado para injetar o template.`);
            resolve(false);
            return;
          }
        }
        resolve(true);
      });
    });
  } catch (err) {
    console.warn(`Falha na ingestão do módulo dinâmico (${url}):`, err);
    return false;
  }
}

// --- FASE 3: MECANISMO DE CONFORMIDADE, LGPD E COOKIES ---
const GestorConsentimento = {
  getChave() {
    return localStorage.getItem("cookieConsent");
  },

  atualizarConsentsGTM(consentiment) {
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", consentiment);
    }
    try {
      localStorage.setItem("analytics_storage", consentiment.analytics_storage);
      localStorage.setItem("ad_storage", consentiment.ad_storage);
    } catch (e) {}
  },

  esconderBanner() {
    const banner = document.getElementById("cookieConsentBanner");
    if (banner) banner.classList.remove("show");
  },

  exibirBanner() {
    const banner = document.getElementById("cookieConsentBanner");
    if (banner) banner.classList.add("show");
  },

  abrirConfiguradorGranular() {
    const modal = document.getElementById("granularCookieModal");
    const checkAnalytics = document.getElementById("cookieAnalytics");
    const checkMarketing = document.getElementById("cookieMarketing");

    if (modal) {
      if (checkAnalytics) checkAnalytics.checked = localStorage.getItem("analytics_storage") === "granted";
      if (checkMarketing) checkMarketing.checked = localStorage.getItem("ad_storage") === "granted";

      modal.classList.remove("hidden");
      window.requestAnimationFrame(() => modal.classList.add("show"));
    }
  },

  fecharConfiguradorGranular() {
    const modal = document.getElementById("granularCookieModal");
    if (modal) {
      modal.classList.remove("show");
      setTimeout(() => modal.classList.add("hidden"), 300);
    }
  },

  salvarPreferenciasGranulares() {
    const checkAnalytics = document.getElementById("cookieAnalytics");
    const checkMarketing = document.getElementById("cookieMarketing");

    const consent = {
      analytics_storage: (checkAnalytics && checkAnalytics.checked) ? "granted" : "denied",
      ad_storage: (checkMarketing && checkMarketing.checked) ? "granted" : "denied"
    };

    this.atualizarConsentsGTM(consent);
    localStorage.setItem("cookieConsent", "managed");

    // Sincroniza com as rotinas do Lazy Loader
    if (typeof window.applyConsent === "function") {
      window.applyConsent(consent);
    }

    this.fecharConfiguradorGranular();
    this.esconderBanner();
  },

  verificarConsentimentoInicial() {
    const consentSalvo = this.getChave();
    if (consentSalvo === "accepted") {
      this.atualizarConsentsGTM({ analytics_storage: "granted", ad_storage: "granted" });
      this.esconderBanner();
    } else if (consentSalvo === "refused") {
      this.atualizarConsentsGTM({ analytics_storage: "denied", ad_storage: "denied" });
      this.esconderBanner();
    } else {
      setTimeout(() => this.exibirBanner(), 1000);
    }
  }
};

// --- FASE 4: DELEGAÇÃO DE EVENTOS DE CLIQUE GLOBAL (EVITA MULTI-LISTENERS) ---
document.addEventListener("click", (evento) => {
  const elemento = evento.target;
  const botao = elemento.closest("button, a");
  if (!botao) return;

  const id = botao.id;

  // Gerenciamento de Cookies (Delegado)
  if (id === "acceptAllCookiesBtn") {
    localStorage.setItem("cookieConsent", "accepted");
    GestorConsentimento.atualizarConsentsGTM({
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted"
    });
    if (typeof window.acceptAllCookies === "function") window.acceptAllCookies();
    GestorConsentimento.esconderBanner();
  }
  else if (id === "refuseAllCookiesBtn") {
    localStorage.setItem("cookieConsent", "refused");
    GestorConsentimento.atualizarConsentsGTM({
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    if (typeof window.rejectAllCookies === "function") window.rejectAllCookies();
    GestorConsentimento.esconderBanner();
  }
  else if (id === "manageCookiesBtn" || id === "openGranularCookieModalBtn") {
    GestorConsentimento.abrirConfiguradorGranular();
  }
  else if (id === "granularModalCloseButton" || id === "cancelGranularPreferencesBtn") {
    GestorConsentimento.fecharConfiguradorGranular();
  }
  else if (id === "saveGranularPreferencesBtn") {
    GestorConsentimento.salvarPreferenciasGranulares();
  }
  // Sincronização de clique com o modal integrado do footer (cookie-modal)
  else if (id === "openGranularCookieModalBtn") {
    const modalIntegrado = document.getElementById("cookie-modal");
    if (modalIntegrado) modalIntegrado.classList.remove("hidden");
  }
  else if (id === "save-cookies") {
    const modalIntegrado = document.getElementById("cookie-modal");
    if (modalIntegrado) modalIntegrado.classList.add("hidden");
  }
});

// --- FASE 5: OPERAÇÃO DA BARRA DE NAVEGAÇÃO MOBILE & DESKTOP ---
function inicializarMenuNavegacao() {
  const hamburguer = document.getElementById("hamburgerButton");
  const menuOffCanvas = document.getElementById("offCanvasMenu");
  const overlay = document.getElementById("menuOverlay");
  const closeBtn = document.getElementById("closeOffCanvasMenu") || document.getElementById("closeMenuButton");

  const abrirMenu = () => {
    if (menuOffCanvas) {
      menuOffCanvas.classList.add("is-open");
      menuOffCanvas.classList.remove("-translate-x-full");
    }
    if (overlay) {
      overlay.style.display = "block";
      overlay.classList.add("is-open");
    }
  };

  const fecharMenu = () => {
    if (menuOffCanvas) {
      menuOffCanvas.classList.remove("is-open");
      menuOffCanvas.classList.add("-translate-x-full");
    }
    if (overlay) {
      overlay.style.display = "none";
      overlay.classList.remove("is-open");
    }
  };

  hamburguer?.addEventListener("click", abrirMenu);
  overlay?.addEventListener("click", fecharMenu);
  closeBtn?.addEventListener("click", fecharMenu);

  // Submenus expansivos (Accordion no Mobile)
  menuOffCanvas?.querySelectorAll(".has-submenu > a, .has-submenu > button").forEach(elem => {
    elem.addEventListener("click", (e) => {
      e.preventDefault();
      const submenu = elem.nextElementSibling;
      if (submenu && submenu.classList.contains("submenu")) {
        submenu.classList.toggle("open");
      }
    });
  });
}

// --- FASE 6: MOTOR DE ACESSIBILIDADE INTEGRADO E RESPONSIVO ---
function inicializarFuncoesGlobaisAcessibilidade() {
  const body = document.body;
  const liveRegion = document.createElement("div");
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.className = "sr-only";
  body.appendChild(liveRegion);

  const fontSizeText = document.getElementById("fontSizeText");
  const lineHeightText = document.getElementById("lineHeightText");
  const letterSpacingText = document.getElementById("letterSpacingText");
  const readingSpeedText = document.getElementById("readingSpeedText");

  const pwaAcessibilidadeBar = document.getElementById("pwaAcessibilidadeBar");
  const accessibilityToggleButton = document.getElementById("accessibilityToggleButton");
  const pwaAcessibilidadeCloseBtn = document.getElementById("pwaAcessibilidadeCloseBtn");
  const menuOverlay = document.getElementById("menuOverlay");

  let state = {
    fontLevel: parseInt(localStorage.getItem("fontSize") || "1", 10),
    lineLevel: parseInt(localStorage.getItem("lineHeight") || "1", 10),
    letterLevel: parseInt(localStorage.getItem("letterSpacing") || "1", 10),
    speedLevel: parseInt(localStorage.getItem("readingSpeed") || "1", 10),
    focusedElement: null,
    isPlayingSpeech: false,
    isPausedSpeech: false
  };

  const synth = window.speechSynthesis;
  const readingSpeeds = [
    { rate: 0.8, label: "Lenta" },
    { rate: 1.0, label: "Normal" },
    { rate: 1.5, label: "Rápida" }
  ];

  document.addEventListener("focusin", e => {
    state.focusedElement = e.target;
  });

  const anunciarAcessibilidade = (msg) => {
    liveRegion.textContent = msg;
    setTimeout(() => { liveRegion.textContent = ""; }, 2500);
  };

  // Funções de Aplicação de Estados Visuais
  const applyFontSize = (level, announce = true) => {
    const fontSizes = ["1em", "1.15em", "1.3em", "1.5em", "2em"];
    const labels = ["Normal", "Médio", "Grande", "Extra Grande", "Máximo"];
    const idx = Math.min(Math.max(level, 1), fontSizes.length);
    state.fontLevel = idx;

    document.documentElement.style.fontSize = fontSizes[idx - 1];
    if (fontSizeText) fontSizeText.textContent = labels[idx - 1];
    localStorage.setItem("fontSize", String(idx));

    if (announce) anunciarAcessibilidade(`Tamanho da fonte ajustado para: ${labels[idx - 1]}`);
  };

  const applyLineHeight = (level, announce = true) => {
    const values = ["1.5", "1.8", "2.2"];
    const labels = ["Médio", "Grande", "Extra Grande"];
    const idx = Math.min(Math.max(level, 1), values.length);
    state.lineLevel = idx;

    document.documentElement.style.setProperty("--espacamento-linha", values[idx - 1]);
    if (lineHeightText) lineHeightText.textContent = labels[idx - 1];
    localStorage.setItem("lineHeight", String(idx));

    if (announce) anunciarAcessibilidade(`Espaçamento de linha ajustado para: ${labels[idx - 1]}`);
  };

  const applyLetterSpacing = (level, announce = true) => {
    const values = ["0em", ".05em", ".1em"];
    const labels = ["Normal", "Médio", "Grande"];
    const idx = Math.min(Math.max(level, 1), values.length);
    state.letterLevel = idx;

    document.documentElement.style.setProperty("--espacamento-letra", values[idx - 1]);
    if (letterSpacingText) letterSpacingText.textContent = labels[idx - 1];
    localStorage.setItem("letterSpacing", String(idx));

    if (announce) anunciarAcessibilidade(`Espaçamento de letra ajustado para: ${labels[idx - 1]}`);
  };

  const applyReadingSpeed = (level, announce = true) => {
    const idx = Math.min(Math.max(level, 1), readingSpeeds.length);
    state.speedLevel = idx;

    const sp = readingSpeeds[idx - 1];
    if (readingSpeedText) readingSpeedText.textContent = sp.label;
    localStorage.setItem("readingSpeed", String(idx));

    if (announce) anunciarAcessibilidade(`Velocidade de leitura ajustada para: ${sp.label}`);
  };

  const setFocusColor = (color, announce = true) => {
    if (!color) return;
    document.documentElement.style.setProperty("--cor-foco-acessibilidade", color);
    localStorage.setItem("focusColor", color);

    document.querySelectorAll(".color-option").forEach(btn => {
      btn.classList.toggle("selected", btn.dataset.color === color);
    });

    if (announce) anunciarAcessibilidade("Cor de foco alterada.");
  };

  // Leitor de Tela Integrado (Web Speech API)
  const falarTexto = (texto) => {
    if (texto && synth) {
      if (synth.speaking) synth.cancel();

      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = "pt-BR";
      utterance.rate = readingSpeeds[state.speedLevel - 1]?.rate || 1.0;

      utterance.onstart = () => {
        state.isPlayingSpeech = true;
        state.isPausedSpeech = false;
      };
      utterance.onend = () => {
        state.isPlayingSpeech = false;
        state.isPausedSpeech = false;
      };
      utterance.onerror = (e) => {
        state.isPlayingSpeech = false;
        state.isPausedSpeech = false;
        console.warn("Erro no sintetizador de voz:", e);
      };
      synth.speak(utterance);
    }
  };

  const alternarReproducaoLeitura = () => {
    if (state.isPlayingSpeech) {
      if (state.isPausedSpeech) {
        synth.resume();
        state.isPausedSpeech = false;
      } else {
        synth.pause();
        state.isPausedSpeech = true;
      }
    } else {
      const conteudoLeitura = document.querySelector("main")?.innerText || "";
      falarTexto(conteudoLeitura);
    }
  };

  const reiniciarLeitura = () => {
    state.isPlayingSpeech = false;
    state.isPausedSpeech = false;
    if (synth) synth.cancel();
    setTimeout(() => {
      const conteudoLeitura = document.querySelector("main")?.innerText || "";
      falarTexto(conteudoLeitura);
    }, 150);
  };

  const falarElementoFocado = () => {
    if (state.focusedElement) {
      const txt = (state.focusedElement.textContent || state.focusedElement.ariaLabel || state.focusedElement.alt || state.focusedElement.value || "").trim();
      if (txt) falarTexto(txt);
    }
  };

  const redefinirTudoAcessibilidade = () => {
    if (synth) synth.cancel();

    applyFontSize(1, false);
    applyLineHeight(1, false);
    applyLetterSpacing(1, false);
    applyReadingSpeed(1, false);
    setFocusColor("yellow", false);

    body.classList.remove("contraste-alto", "dark-mode", "fonte-dislexia");
    localStorage.clear();
    anunciarAcessibilidade("Configurações de acessibilidade redefinidas para o padrão de fábrica.");
  };

  // Mapeamento Direto dos Botões das duas barras (Desktop e Mobile PWA)
  const acoesMapeadas = [
    { ids: ["btnAlternarTamanhoFonte", "btnAlternarTamanhoFontePWA"], run: () => applyFontSize((state.fontLevel % 5) + 1) },
    { ids: ["btnAlternarEspacamentoLinha", "btnAlternarEspacamentoLinhaPWA"], run: () => applyLineHeight((state.lineLevel % 3) + 1) },
    { ids: ["btnAlternarEspacamentoLetra", "btnAlternarEspacamentoLetraPWA"], run: () => applyLetterSpacing((state.stateLevel % 3) + 1) },
    { ids: ["btnAlternarContraste", "btnAlternarContrastePWA"], run: () => {
        body.classList.toggle("contraste-alto");
        anunciarAcessibilidade("Alto contraste " + (body.classList.contains("contraste-alto") ? "ativado" : "desativado"));
        localStorage.setItem("highContrast", body.classList.contains("contraste-alto"));
      }
    },
    { ids: ["btnAlternarModoEscuro", "btnAlternarModoEscuroPWA"], run: () => {
        body.classList.toggle("dark-mode");
        anunciarAcessibilidade("Modo escuro " + (body.classList.contains("dark-mode") ? "ativado" : "desativado"));
        localStorage.setItem("darkMode", body.classList.contains("dark-mode"));
      }
    },
    { ids: ["btnAlternarFonteDislexia", "btnAlternarFonteDislexiaPWA"], run: () => {
        body.classList.toggle("fonte-dislexia");
        anunciarAcessibilidade("Fonte para dislexia " + (body.classList.contains("fonte-dislexia") ? "ativada" : "desativada"));
        localStorage.setItem("dyslexiaFont", body.classList.contains("fonte-dislexia"));
      }
    },
    { ids: ["btnResetarAcessibilidade", "btnResetarAcessibilidadePWA"], run: redefinirTudoAcessibilidade },
    { ids: ["btnToggleLeitura"], run: alternarReproducaoLeitura },
    { ids: ["btnReiniciarLeitura"], run: reiniciarLeitura },
    { ids: ["btnAlternarVelocidadeLeitura"], run: () => applyReadingSpeed((state.speedLevel % readingSpeeds.length) + 1) },
    { ids: ["btnReadFocused"], run: falarElementoFocado }
  ];

  // Atribuição Dinâmica de Listeners
  acoesMapeadas.forEach(grupo => {
    grupo.ids.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) btn.addEventListener("click", grupo.run);
    });
  });

  // Escuta de Cliques nas Paletas de Cores de Foco
  document.querySelectorAll(".color-option").forEach(palette => {
    palette.addEventListener("click", () => setFocusColor(palette.dataset.color));
  });

  // Operação do Modal de Atalhos de Teclado
  const shortcutsModal = document.getElementById("keyboardShortcutsModal");
  const btnShortcuts = document.getElementById("btnKeyboardShortcuts");
  const btnShortcutsPWA = document.getElementById("btnKeyboardShortcutsPWA");
  const shortcutsCloseBtn = document.getElementById("keyboardModalCloseButton");

  const exibirShortcuts = () => shortcutsModal?.classList.remove("hidden");
  const ocultarShortcuts = () => shortcutsModal?.classList.add("hidden");

  btnShortcuts?.addEventListener("click", exibirShortcuts);
  btnShortcutsPWA?.addEventListener("click", exibirShortcuts);
  shortcutsCloseBtn?.addEventListener("click", ocultarShortcuts);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") ocultarShortcuts();
  });

  // Restauração Segura do Estado do LocalStorage (Preservando Sessão)
  const carregarSessaoAcessibilidade = () => {
    applyFontSize(parseInt(localStorage.getItem("fontSize") || "1", 10), false);
    applyLineHeight(parseInt(localStorage.getItem("lineHeight") || "1", 10), false);
    applyLetterSpacing(parseInt(localStorage.getItem("letterSpacing") || "1", 10), false);
    applyReadingSpeed(parseInt(localStorage.getItem("readingSpeed") || "1", 10), false);

    if (localStorage.getItem("highContrast") === "true") body.classList.add("contraste-alto");
    if (localStorage.getItem("darkMode") === "true") body.classList.add("dark-mode");
    if (localStorage.getItem("dyslexiaFont") === "true") body.classList.add("fonte-dislexia");

    setFocusColor(localStorage.getItem("focusColor") || "yellow", false);
  };
  carregarSessaoAcessibilidade();

  // Controle de Visualização do Painel PWA Lateral (Mobile)
  accessibilityToggleButton?.addEventListener("click", () => {
    if (pwaAcessibilidadeBar) pwaAcessibilidadeBar.classList.add("is-open");
    if (menuOverlay) menuOverlay.style.display = "block";
  });

  pwaAcessibilidadeCloseBtn?.addEventListener("click", () => {
    if (pwaAcessibilidadeBar) pwaAcessibilidadeBar.classList.remove("is-open");
    if (menuOverlay) menuOverlay.style.display = "none";
  });

  // Botão Voltar ao Topo (Otimizado com RequestAnimationFrame)
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    let scrollTicking = false;
    window.addEventListener("scroll", () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          backToTopBtn.style.display = window.scrollY > 200 ? "block" : "none";
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Inicializa os Tooltips do DOM
  inicializarTooltips();

  // Valida cookies pós injeção de elementos globais
  GestorConsentimento.verificarConsentimentoInicial();
}

/**
 * Inicialização suave de tooltips dinâmicos
 */
function inicializarTooltips() {
  document.querySelectorAll("[data-tooltip]").forEach(elemento => {
    const texto = elemento.getAttribute("data-tooltip");
    if (!texto) return;

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip-dinamico";
    tooltip.innerText = texto;
    elemento.appendChild(tooltip);

    const exibir = () => { tooltip.style.opacity = "1"; };
    const ocultar = () => { tooltip.style.opacity = "0"; };

    elemento.addEventListener("mouseenter", exibir);
    elemento.addEventListener("mouseleave", ocultar);
    elemento.addEventListener("touchstart", exibir, { passive: true });
    elemento.addEventListener("touchend", () => setTimeout(ocultar, 2000), { passive: true });
  });
}

// --- FASE 7: EXPORTAÇÃO DE RELATÓRIO PDF DINÂMICO ---
function gerarPDFGlobal(parametros) {
  const urlBiblioteca = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";

  if (typeof html2pdf === "function") {
    executarLogicaDoHtml2Pdf(parametros);
    return;
  }

  const script = document.createElement("script");
  script.src = urlBiblioteca;
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => executarLogicaDoHtml2Pdf(parametros);
  script.onerror = () => {
    console.error("Falha ao carregar a biblioteca externa html2pdf.");
  };
}

function executarLogicaDoHtml2Pdf(parametros) {
  const {
    titulo = "Relatório da Calculadora",
    subtitulo = "Relatório de Cálculo Assistencial",
    nomeArquivo = "relatorio.pdf",
    seletorConteudo = ".main-content-wrapper"
  } = parametros;

  const wrapperElement = document.querySelector(seletorConteudo);
  if (!wrapperElement) {
    console.error(`O seletor "${seletorConteudo}" não foi localizado no DOM.`);
    return;
  }

  const templatePDF = document.createElement("div");
  templatePDF.style.padding = "20px";
  templatePDF.style.fontFamily = "Inter, sans-serif";
  templatePDF.style.lineHeight = "1.5";
  templatePDF.style.fontSize = "12px";

  // Cabeçalho da página do PDF
  const cabecalho = document.createElement("div");
  cabecalho.style.textAlign = "center";
  cabecalho.style.marginBottom = "25px";
  cabecalho.innerHTML = `
    <h1 style="font-family: 'Nunito Sans', sans-serif; font-size: 22px; font-weight: bold; color: #1A3E74; margin: 0;">${titulo}</h1>
    <h2 style="font-size: 14px; color: #666; margin-top: 5px;">${subtitulo}</h2>
    <p style="font-size: 10px; color: #999; margin-top: 10px;">Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
  `;
  templatePDF.appendChild(cabecalho);

  const conteudoOriginal = wrapperElement.querySelector("#conteudo");
  if (conteudoOriginal) {
    const cloneConteudo = conteudoOriginal.cloneNode(true);

    // Limpeza de campos não selecionados no relatório final
    cloneConteudo.querySelectorAll('input[type="radio"]:not(:checked)').forEach(el => {
      el.closest(".option-row, .option-label")?.remove();
    });
    cloneConteudo.querySelectorAll("tbody, .options-group").forEach(el => {
      if (el.children.length === 0) {
        el.closest(".criterion-section, .criterion-table")?.remove();
      }
    });
    templatePDF.appendChild(cloneConteudo);
  }

  const resultadoOriginal = wrapperElement.querySelector("#resultado");
  if (resultadoOriginal && !resultadoOriginal.classList.contains("hidden")) {
    const cloneResultado = resultadoOriginal.cloneNode(true);
    cloneResultado.style.marginTop = "20px";
    templatePDF.appendChild(cloneResultado);
  }

  const configuracoesPDF = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: nomeArquivo,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, scrollY: 0, useCORS: true },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    pagebreak: { avoid: ["p", "h1", "h2", "h3", "div", "section"] }
  };

  window.html2pdf().set(configuracoesPDF).from(templatePDF).save().catch(err => {
    console.error("Falha ao exportar PDF:", err);
  });
}

// --- FASE 8: RASTREAMENTO ANALYTICS DE CLIQUES EM CÁLCULOS (GA4) ---
(function inicializarRastreamentoCalcular() {
  function analyticsLiberado() {
    try {
      return localStorage.getItem("analytics_storage") !== "denied";
    } catch (_) {
      return true;
    }
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || btn.id !== "btnCalcular" || !analyticsLiberado()) return;

    if (typeof window.gtag === "function") {
      window.gtag("event", "calcular_click", {
        page_path: window.location.pathname,
        page_title: document.title
      });
    }
  });
})();

// --- FASE 9: INJEÇÃO DINÂMICA DE ANÚNCIO MULTIPLEX (ADSENSE) ---
document.addEventListener("DOMContentLoaded", () => {
  const footerPlaceholder = document.getElementById("footer-placeholder");
  if (!footerPlaceholder) return;

  const adContainer = document.createElement("div");
  adContainer.className = "max-w-7xl mx-auto px-4 my-10";
  adContainer.innerHTML = `
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-format="autorelaxed"
         data-ad-client="ca-pub-6472730056006847"
         data-ad-slot="5401011816"></ins>
  `;

  footerPlaceholder.parentNode.insertBefore(adContainer, footerPlaceholder);

  setTimeout(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("Bloqueio de rede ou adblocker impediu a inicialização do AdSense Multiplex.");
    }
  }, 500);
});

// --- FASE 10: LAZY LOAD SEGURO DE GOOGLE SERVICES (MÉTRICAS & ADSENSE) ---
function initLazyLoadServices() {
  if (
    localStorage.getItem("admin_mode") === "true" ||
    new URLSearchParams(window.location.search).get("admin") === "1"
  ) {
    console.log("🚧 Modo Admin detectado: Carregamento de anúncios bloqueado.");
    if (new URLSearchParams(window.location.search).get("admin") === "1") {
      localStorage.setItem("admin_mode", "true");
    }
    return;
  }

  const savedConsent = localStorage.getItem("cookieConsent");
  const isRefused = (savedConsent === "refused");
  const isManaged = (savedConsent === "managed");
  let adsBlocked = isRefused || (isManaged && localStorage.getItem("ad_storage") === "denied");

  window.__metricsLoaded = false;
  window.__adsenseLoaded = false;
  window.dataLayer = window.dataLayer || [];

  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  function loadAnalytics() {
    if (window.__metricsLoaded) return;
    window.__metricsLoaded = true;

    const aState = isRefused ? "denied" : (localStorage.getItem("analytics_storage") || "granted");
    const adState = adsBlocked ? "denied" : "granted";

    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=G-PFM06B7TS5";
    document.head.appendChild(s);

    gtag("consent", "default", {
      analytics_storage: aState,
      ad_storage: adState,
      ad_user_data: adState,
      ad_personalization: adState,
      wait_for_update: 500
    });

    gtag("js", new Date());
    gtag("config", "G-PFM06B7TS5");
    gtag("config", "G-MJDKPDPJ26");
    gtag("config", "G-M7DHHF38EJ");
    gtag("config", "G-8FLJ59XXDK");
    gtag("config", "G-VVDP5JGEX8");
    gtag("config", "AW-952633102");
    gtag("config", "AW-9277197961");
  }

  function loadAdSenseOnce() {
    if (window.__adsenseLoaded || adsBlocked) return;
    window.__adsenseLoaded = true;

    const ad = document.createElement("script");
    ad.async = true;
    ad.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
    ad.crossOrigin = "anonymous";
    document.head.appendChild(ad);
  }

  function executeServices() {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        loadAnalytics();
        loadAdSenseOnce();
      });
    } else {
      setTimeout(() => {
        loadAnalytics();
        loadAdSenseOnce();
      }, 150);
    }
  }

  let userInteracted = false;
  function onUserInteraction() {
    if (userInteracted) return;
    userInteracted = true;

    executeServices();

    window.removeEventListener("scroll", onUserInteraction);
    window.removeEventListener("mousemove", onUserInteraction);
    window.removeEventListener("touchstart", onUserInteraction);
    window.removeEventListener("keydown", onUserInteraction);
  }

  if (!adsBlocked) {
    window.addEventListener("scroll", onUserInteraction, { passive: true });
    window.addEventListener("mousemove", onUserInteraction, { passive: true });
    window.addEventListener("touchstart", onUserInteraction, { passive: true });
    window.addEventListener("keydown", onUserInteraction, { passive: true });

    // Fallback de segurança temporizada para garantir rastreamento
    setTimeout(onUserInteraction, 8500);
  }

  window.applyConsent = function (consent) {
    gtag("consent", "update", consent);
    if (consent.ad_storage === "granted") {
      adsBlocked = false;
      onUserInteraction();
    } else {
      adsBlocked = true;
      document.querySelectorAll("ins.adsbygoogle, .google-auto-placed")
        .forEach(ad => {
          ad.style.display = "none";
          ad.innerHTML = "";
        });
    }
    localStorage.setItem("analytics_storage", consent.analytics_storage);
    localStorage.setItem("ad_storage", consent.ad_storage);
  };

  window.acceptAllCookies = function () {
    localStorage.setItem("cookieConsent", "accepted");
    window.applyConsent({
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted"
    });
  };

  window.rejectAllCookies = function () {
    localStorage.setItem("cookieConsent", "refused");
    window.applyConsent({
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
  };
}
document.addEventListener("DOMContentLoaded", initLazyLoadServices);

// --- FASE 11: ENGINE LOCAL DE INTERNACIONALIZAÇÃO (Traduções de locales) ---
if (typeof window.traducoes === "undefined") {
  window.traducoes = {};
}

function aplicarTraducoes() {
  // Tradução de texto padrão de marcação de atributos (data-i18n)
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const chave = el.getAttribute("data-i18n");
    const partes = chave.split(".");
    let valor = window.traducoes;

    partes.forEach(p => {
      if (valor && valor[p] !== undefined) valor = valor[p];
      else valor = null;
    });

    if (valor !== null) el.textContent = valor;
  });

  // Tradução para aria-labels de acessibilidade (data-i18n-aria-label)
  document.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
    const chave = el.getAttribute("data-i18n-aria-label");
    const partes = chave.split(".");
    let valor = window.traducoes;

    partes.forEach(p => {
      if (valor && valor[p] !== undefined) valor = valor[p];
      else valor = null;
    });

    if (valor !== null) el.setAttribute("aria-label", valor);
  });

  substituirAnoFooter();
}

async function carregarTraducoes(idioma, arquivoJson) {
  try {
    const resposta = await fetch(`/locales/${idioma}/${arquivoJson}`);
    if (!resposta.ok) throw new Error();
    const novosDados = await resposta.json();

    window.traducoes = { ...window.traducoes, ...novosDados };
    aplicarTraducoes();
  } catch (error) {
    console.warn(`Localização JSON de tradução não encontrada (${idioma}/${arquivoJson})`);
  }
}

function substituirAnoFooter() {
  const copyrightElement = document.querySelector('[data-i18n="footer.copyright"]');
  if (copyrightElement && copyrightElement.textContent.includes("{{year}}")) {
    copyrightElement.textContent = copyrightElement.textContent.replace("{{year}}", String(new Date().getFullYear()));
  }
}