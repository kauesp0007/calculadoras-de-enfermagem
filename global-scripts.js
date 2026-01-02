/* ========================================================================
   GLOBAL SCRIPTS - VERSÃO CORRIGIDA E FINAL
   (Menu Blindado + Correção de Erros de Console)
   ======================================================================== */

// 1. SERVICE WORKER
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(e => console.log("SW registrado:", e.scope))
      .catch(e => console.log("SW falhou:", e));
  });
}

// 2. FUNÇÕES DE PDF (html2pdf)
function gerarPDFGlobal(e) {
  const libURL = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
  if (typeof html2pdf === "function") {
      executarLogicaDoHtml2Pdf(e);
  } else {
      let script = document.createElement("script");
      script.src = libURL;
      script.onload = () => executingLogicaDoHtml2Pdf(e);
      // Fallback para garantir execução
      script.onload = () => executarLogicaDoHtml2Pdf(e);
      document.head.appendChild(script);
  }
}

function executarLogicaDoHtml2Pdf(config) {
  const {
    titulo = "Relatório",
    subtitulo = "Calculadoras de Enfermagem",
    nomeArquivo = "relatorio.pdf",
    seletorConteudo = ".main-content-wrapper"
  } = config;

  console.log(`Gerando PDF: ${titulo}`);
  const element = document.querySelector(seletorConteudo);

  if (!element) {
      alert("Erro: Conteúdo para PDF não encontrado.");
      return;
  }

  const clone = document.createElement("div");
  clone.style.padding = "20px";
  clone.style.fontFamily = "Inter, sans-serif";

  const header = document.createElement("div");
  header.innerHTML = `
    <div style="text-align:center; margin-bottom:20px;">
        <h1 style="color:#1A3E74; font-size:22px; margin:0;">${titulo}</h1>
        <h3 style="color:#666; font-size:14px; margin:5px 0;">${subtitulo}</h3>
        <p style="color:#999; font-size:10px;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  `;
  clone.appendChild(header);

  const contentClone = element.querySelector("#conteudo") ? element.querySelector("#conteudo").cloneNode(true) : element.cloneNode(true);
  // Remove botões e elementos desnecessários
  contentClone.querySelectorAll('button, input[type="radio"]:not(:checked), .no-print').forEach(el => el.remove());
  clone.appendChild(contentClone);

  const resultado = element.querySelector("#resultado");
  if (resultado && !resultado.classList.contains("hidden")) {
      const resClone = resultado.cloneNode(true);
      resClone.style.marginTop = "20px";
      resClone.style.border = "1px solid #ccc";
      resClone.style.padding = "10px";
      clone.appendChild(resClone);
  }

  const opt = {
    margin: 0.5,
    filename: nomeArquivo,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, scrollY: 0, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(clone).save();
}

// 3. INICIALIZAÇÃO GERAL (Carrega Menu e Footer)
document.addEventListener("DOMContentLoaded", function () {
  Promise.all([
    fetch("menu-global.html").then(r => r.ok ? r.text() : ""),
    fetch("global-body-elements.html").then(r => r.ok ? r.text() : "")
  ]).then(([menuHtml, bodyHtml]) => {

    // Injeta Menu
    if (menuHtml) {
        const container = document.getElementById("global-header-container");
        if (container) container.innerHTML = menuHtml;
    }

    // Injeta Elementos Globais
    if (bodyHtml) {
        document.body.insertAdjacentHTML("beforeend", bodyHtml);
        // Pequeno delay para garantir que o DOM existe antes de iniciar funções
        setTimeout(() => {
            initializeGlobalFunctions();
            initializeCookieFunctionality();
        }, 100);
    }
  }).catch(e => console.warn("Erro ao carregar parciais:", e));
});

/* ========================================================================
   4. LÓGICA DO MENU (DELEGAÇÃO DE EVENTOS - SOLUÇÃO DEFINITIVA)
   ======================================================================== */
// Adiciona o evento ao DOCUMENTO inteiro. Assim, não importa se o botão
// existe agora ou daqui a 1 segundo, o clique vai funcionar.
document.addEventListener('click', function(e) {

    // 1. Botão Hambúrguer (Abrir)
    const hamburgerBtn = e.target.closest('#hamburgerButton');
    if (hamburgerBtn) {
        console.log("Menu clicado!"); // Debug para você ver no console
        const offCanvasMenu = document.getElementById("offCanvasMenu");
        const menuOverlay = document.getElementById("menuOverlay");

        if (offCanvasMenu) {
            offCanvasMenu.classList.add("is-open");
            // Remove classes que possam estar escondendo o menu
            offCanvasMenu.classList.remove("-translate-x-full", "hidden");
        }
        if (menuOverlay) {
            menuOverlay.style.display = "block";
            setTimeout(() => menuOverlay.classList.add("is-open"), 10);
        }
    }

    // 2. Botões de Fechar (X ou Overlay)
    if (e.target.closest('#closeOffCanvasMenu') || e.target.closest('#closeMenuButton') || e.target.id === 'menuOverlay') {
        const offCanvasMenu = document.getElementById("offCanvasMenu");
        const menuOverlay = document.getElementById("menuOverlay");

        if (offCanvasMenu) offCanvasMenu.classList.remove("is-open");
        if (menuOverlay) {
            menuOverlay.classList.remove("is-open");
            setTimeout(() => menuOverlay.style.display = "none", 300);
        }
    }

    // 3. Dropdowns (Submenus)
    const dropdownTrigger = e.target.closest('.has-submenu > a') || e.target.closest('.has-submenu > button');
    if (dropdownTrigger) {
        e.preventDefault();
        const submenu = dropdownTrigger.nextElementSibling;
        if (submenu && submenu.classList.contains("submenu")) {
            submenu.classList.toggle("open");
            submenu.style.display = submenu.classList.contains("open") ? "block" : "none";
        }
    }
});


// 5. COOKIES
function initializeCookieFunctionality() {
  const banner = document.getElementById("cookieConsentBanner");
  const saved = localStorage.getItem("cookieConsent");

  if (!saved && banner) {
      setTimeout(() => banner.classList.add("show"), 500);
  }

  // Listeners dos botões via ID direto (já que o banner é fixo)
  const btnAccept = document.getElementById("acceptAllCookiesBtn");
  const btnRefuse = document.getElementById("refuseAllCookiesBtn");
  const btnManage = document.getElementById("manageCookiesBtn");

  if (btnAccept) btnAccept.addEventListener("click", () => {
      localStorage.setItem("cookieConsent", "accepted");
      updateConsent({ analytics_storage: "granted", ad_storage: "granted" });
      banner.classList.remove("show");
  });

  if (btnRefuse) btnRefuse.addEventListener("click", () => {
      localStorage.setItem("cookieConsent", "refused");
      updateConsent({ analytics_storage: "denied", ad_storage: "denied" });
      banner.classList.remove("show");
      document.querySelectorAll('ins.adsbygoogle, .google-auto-placed').forEach(el => el.style.display = 'none');
  });

  if (btnManage) {
      btnManage.addEventListener("click", () => {
          const modal = document.getElementById("granularCookieModal");
          if(modal) {
             modal.classList.remove("hidden");
             setTimeout(() => modal.classList.add("show"), 10);
          }
      });
  }
}

function updateConsent(consent) {
  if (typeof gtag === "function") gtag("consent", "update", consent);
}

function initializeGlobalFunctions() {
  // CORREÇÃO CRÍTICA: Define 'body' aqui para evitar o erro "ReferenceError: body is not defined"
  const body = document.body;
  if (!body) return; // Segurança extra

  // Ajuste de layout desktop
  function checkLayout() {
    if (window.innerWidth > 1024) {
      const bar = document.getElementById("barraAcessibilidade");
      if(bar) bar.style.display = "flex";
      const nav = document.querySelector("nav.desktop-nav");
      if(nav) nav.style.display = "flex";
    }
  }
  checkLayout();
  window.addEventListener("resize", checkLayout, { passive: true });

  const srRegion = document.createElement("div");
  srRegion.setAttribute("aria-live", "polite");
  srRegion.className = "sr-only";
  body.appendChild(srRegion);

  // Ações de Acessibilidade
  const actions = {
      "btnAlternarTamanhoFonte": () => toggleFontSize(srRegion, body),
      "btnAlternarEspacamentoLinha": () => toggleLineHeight(srRegion),
      "btnAlternarEspacamentoLetra": () => toggleLetterSpacing(srRegion),
      "btnAlternarContraste": () => { body.classList.toggle("contraste-alto"); notify(srRegion, "Contraste alterado"); },
      "btnAlternarModoEscuro": () => { body.classList.toggle("dark-mode"); notify(srRegion, "Modo escuro alterado"); },
      "btnAlternarFonteDislexia": () => { body.classList.toggle("fonte-dislexia"); notify(srRegion, "Fonte dislexia alterada"); },
      "btnResetarAcessibilidade": () => resetAccessibility(srRegion, body)
  };

  Object.keys(actions).forEach(id => {
      const btn = document.getElementById(id);
      const btnPwa = document.getElementById(id + "PWA");
      if(btn) btn.addEventListener("click", actions[id]);
      if(btnPwa) btnPwa.addEventListener("click", actions[id]);
  });

  restoreAccessibilitySettings(body);

  const backBtn = document.getElementById("backToTopBtn");
  if (backBtn) {
      window.addEventListener("scroll", () => {
        backBtn.style.display = window.scrollY > 200 ? "block" : "none";
      }, { passive: true });
      backBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  initVLibras();
  initGoogleTranslate(body); // Passa body
  inicializarTooltips();
}

// Helpers de Acessibilidade
function notify(region, text) { region.textContent = text; setTimeout(() => region.textContent = "", 3000); }
let currentSize = 1;

function toggleFontSize(region, body) {
    const sizes = ["1em", "1.15em", "1.3em", "1.5em", "2em"];
    currentSize = (currentSize % sizes.length);
    body.style.fontSize = sizes[currentSize]; // Usa a variável body passada
    localStorage.setItem("fontSize", currentSize + 1);
    currentSize++;
    notify(region, "Tamanho da fonte alterado");
}

function toggleLineHeight(region) {
    const v = ["1.5", "1.8", "2.2"];
    let curr = parseInt(localStorage.getItem("lineHeight") || 0);
    curr = (curr + 1) % v.length;
    document.documentElement.style.setProperty("--espacamento-linha", v[curr]);
    localStorage.setItem("lineHeight", curr);
    notify(region, "Espaçamento de linha alterado");
}

function toggleLetterSpacing(region) {
     const v = ["0em", ".05em", ".1em"];
     let curr = parseInt(localStorage.getItem("letterSpacing") || 0);
     curr = (curr + 1) % v.length;
     document.documentElement.style.setProperty("--espacamento-letra", v[curr]);
     localStorage.setItem("letterSpacing", curr);
     notify(region, "Espaçamento de letra alterado");
}

function resetAccessibility(region, body) {
    body.style.fontSize = "";
    document.documentElement.style.removeProperty("--espacamento-linha");
    document.documentElement.style.removeProperty("--espacamento-letra");
    body.classList.remove("contraste-alto", "dark-mode", "fonte-dislexia");
    localStorage.clear();
    notify(region, "Acessibilidade redefinida");
}

function restoreAccessibilitySettings(body) {
    if(localStorage.getItem("highContrast") === "true") body.classList.add("contraste-alto");
    if(localStorage.getItem("darkMode") === "true") body.classList.add("dark-mode");
    if(localStorage.getItem("dyslexiaFont") === "true") body.classList.add("fonte-dislexia");
}

function initVLibras() {
    if (document.querySelector("[vw]")) {
        const i = setInterval(() => {
             if(typeof VLibras !== 'undefined') { new VLibras.Widget("https://vlibras.gov.br/app"); clearInterval(i); }
        }, 500);
    }
}

function initGoogleTranslate(body) {
    window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({
            pageLanguage: "pt",
            includedLanguages: "en,es,pt",
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, "language-switcher")
    };
    const s = document.createElement("script");
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    body.appendChild(s);
}

function inicializarTooltips() {
  document.querySelectorAll("[data-tooltip]").forEach(el => {
    const text = el.getAttribute("data-tooltip");
    const tip = document.createElement("div");
    tip.className = "tooltip-dinamico";
    tip.innerText = text;
    el.appendChild(tip);
    el.addEventListener("mouseenter", () => tip.style.opacity = "1");
    el.addEventListener("mouseleave", () => tip.style.opacity = "0");
    el.addEventListener("touchstart", () => tip.style.opacity = "1", {passive: true});
  });
}