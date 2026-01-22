// =========================================================
// 1. SERVICE WORKER
// =========================================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(e => {
      console.log("Service Worker registado com sucesso:", e.scope);
    }, e => {
      console.log("Registo do Service Worker falhou:", e);
    });
  });
}

// =========================================================
// 2. FUNÇÃO AVANÇADA DE GERAÇÃO DE PDF (PASSO 2)
// =========================================================
function gerarPDFGlobal() {
  // Carrega a biblioteca html2pdf sob demanda se não existir
  if (typeof html2pdf !== "function") {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => executarGeracaoPDF();
    script.onerror = () => alert("Erro ao carregar biblioteca de PDF. Verifique sua conexão.");
    document.head.appendChild(script);
  } else {
    executarGeracaoPDF();
  }
}

function executarGeracaoPDF() {
  // A. Seleciona o conteúdo principal
  const elementOriginal = document.querySelector(".main-content-wrapper") || document.querySelector("main") || document.body;

  // B. Cria um clone para manipular (Sanitização) sem afetar a tela do usuário
  const clone = elementOriginal.cloneNode(true);

  // --- REMOÇÃO DE ELEMENTOS INDESEJADOS ---
  const seletoresParaRemover = [
    ".breadcrumb",
    ".title-bar",
    "#main-subtitle", // Remove subtítulo específico
    "h2",             // Remove todos os H2 conforme solicitado
    "button",         // Remove todos os botões
    ".btn",           // Remove classes de botão
    ".floating-btn",
    ".no-print",
    "#footer-placeholder",
    "nav",
    "header",
    "#cookieConsentBanner",
    "#addFavoriteBtn",
    ".sidebar-toggle-btn",
    ".scroll-to-calc-btn",
    "#reference-section",
    ".instruction-card",
    ".sidebar-overlay",
    "#sidebarOverlay",
    "aside"
  ];

  seletoresParaRemover.forEach(seletor => {
    clone.querySelectorAll(seletor).forEach(el => el.remove());
  });

  // --- TRATAMENTO DO TÍTULO (H1) ---
  const h1 = clone.querySelector("h1");
  if (h1) {
    h1.style.textAlign = "center";
    h1.style.marginBottom = "15px";
    h1.style.color = "#000";
    h1.style.fontSize = "22px";
    h1.style.fontFamily = "Arial, sans-serif";
  }

  // --- CONVERSÃO DE INPUTS PARA TEXTO (Para aparecer no PDF) ---

  // 1. Textos, Números, Datas (Input Fields)
  clone.querySelectorAll("input[type='text'], input[type='number'], input[type='date'], input[type='time']").forEach(input => {
    const originalInput = document.getElementById(input.id);
    // Pega o valor do original se existir (garante dados mais recentes), senão do clone
    const valor = originalInput ? originalInput.value : input.value;

    const span = document.createElement("span");
    span.innerText = valor;
    span.style.fontWeight = "bold";
    span.style.borderBottom = "1px solid #333";
    span.style.padding = "0 5px";
    span.style.display = "inline-block";
    span.style.minWidth = "20px";

    if(input.parentNode) input.parentNode.replaceChild(span, input);
  });

  // 2. Áreas de Texto (Textareas - ex: Observações SBAR)
  clone.querySelectorAll("textarea").forEach(textarea => {
    const originalTextarea = document.getElementById(textarea.id);
    const valor = originalTextarea ? originalTextarea.value : textarea.value;

    const div = document.createElement("div");
    div.innerText = valor;
    div.style.border = "1px solid #999";
    div.style.padding = "8px";
    div.style.marginTop = "4px";
    div.style.marginBottom = "8px";
    div.style.whiteSpace = "pre-wrap"; // Mantém quebra de linha
    div.style.fontSize = "11px";
    div.style.width = "98%";
    div.style.backgroundColor = "#fff";

    if(textarea.parentNode) textarea.parentNode.replaceChild(div, textarea);
  });

  // 3. Seletores (Dropdowns)
  clone.querySelectorAll("select").forEach(select => {
    const originalSelect = document.getElementById(select.id);
    let valorTexto = "";

    if (originalSelect && originalSelect.selectedIndex >= 0) {
        valorTexto = originalSelect.options[originalSelect.selectedIndex].text;
    } else if (select.selectedIndex >= 0) {
        valorTexto = select.options[select.selectedIndex].text;
    }

    // Se for o texto padrão "Selecione...", deixa vazio ou marca
    if (valorTexto.includes("Selecione")) valorTexto = " - ";

    const span = document.createElement("span");
    span.innerText = valorTexto;
    span.style.fontWeight = "bold";

    if(select.parentNode) select.parentNode.replaceChild(span, select);
  });

  // 4. Checkboxes e Radios (Sincronização Visual)
  // Precisamos iterar pelos originais para saber o estado real
  const inputsOriginais = elementOriginal.querySelectorAll("input[type='checkbox'], input[type='radio']");
  const inputsClone = clone.querySelectorAll("input[type='checkbox'], input[type='radio']");

  // Assume paridade de ordem entre clone e original
  for(let i=0; i < inputsOriginais.length; i++) {
    const original = inputsOriginais[i];
    const clonado = inputsClone[i];

    if (!clonado) continue;

    const spanIcon = document.createElement("span");
    spanIcon.style.fontWeight = "bold";
    spanIcon.style.fontSize = "14px";
    spanIcon.style.marginRight = "5px";

    if(original.checked) {
      spanIcon.innerHTML = "&#9745;"; // ☑ (Checked Box)
    } else {
      spanIcon.innerHTML = "&#9744;"; // ☐ (Unchecked Box)
    }

    if(clonado.parentNode) clonado.parentNode.replaceChild(spanIcon, clonado);
  }

  // --- TRATAMENTO DO RESULTADO (Se houver) ---
  const resultadoOriginal = document.getElementById("resultado");
  if (resultadoOriginal && !resultadoOriginal.classList.contains("hidden") && resultadoOriginal.style.display !== "none") {
    const resultadoClone = resultadoOriginal.cloneNode(true);
    resultadoClone.style.marginTop = "20px";
    resultadoClone.style.border = "2px solid #000";
    resultadoClone.style.padding = "10px";
    resultadoClone.style.backgroundColor = "#f0f0f0";
    resultadoClone.style.pageBreakInside = "avoid"; // Evita quebrar o resultado
    clone.appendChild(resultadoClone);
  }

  // --- PREPARAÇÃO DO CONTAINER FINAL (ESCALA 70%) ---
  // Criamos um wrapper invisível temporário no body
  const containerPDF = document.createElement("div");
  containerPDF.id = "container-pdf-temp";
  containerPDF.style.position = "absolute";
  containerPDF.style.left = "-9999px";
  containerPDF.style.top = "0";
  containerPDF.style.width = "100%";

  // Wrapper de Escala
  const scaleWrapper = document.createElement("div");
  // Para simular 70% de zoom visual, aumentamos a largura do container
  // e aplicamos scale down. (100 / 0.7 = ~142.8%)
  scaleWrapper.style.width = "142.8%";
  scaleWrapper.style.transform = "scale(0.7)";
  scaleWrapper.style.transformOrigin = "top left";

  // Estilos de Tipografia para Impressão
  scaleWrapper.style.fontFamily = "Arial, sans-serif";
  scaleWrapper.style.fontSize = "12pt";
  scaleWrapper.style.color = "#000";
  scaleWrapper.style.lineHeight = "1.3";

  // Injeta o clone limpo
  scaleWrapper.appendChild(clone);
  containerPDF.appendChild(scaleWrapper);
  document.body.appendChild(containerPDF);

  // --- GERAÇÃO (HTML2PDF) ---
  const opt = {
    margin:       [5, 5, 5, 5], // Margem mínima (5mm)
    filename:     (document.title.split('-')[0].trim() || 'documento') + '.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  {
        scale: 2, // Alta resolução
        useCORS: true,
        letterRendering: true,
        scrollY: 0
    },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } // Evita quebra de linhas dentro de elementos
  };

  html2pdf().set(opt).from(containerPDF).save().then(() => {
    console.log("PDF gerado com sucesso.");
    document.body.removeChild(containerPDF); // Limpeza
  }).catch(err => {
    console.error("Erro ao gerar PDF:", err);
    alert("Ocorreu um erro ao gerar o PDF.");
    if(document.body.contains(containerPDF)) {
        document.body.removeChild(containerPDF);
    }
  });
}

// =========================================================
// 3. INICIALIZAÇÃO E EVENT LISTENERS
// =========================================================
document.addEventListener("DOMContentLoaded", function () {

  // Carrega Menu e Footer (Modularização)
  fetch("menu-global.html").then(e => e.ok ? e.text() : Promise.reject("Menu não encontrado")).then(e => {
    const o = document.getElementById("global-header-container");
    o && (o.innerHTML = e, initializeNavigationMenu())
  }).catch(e => console.warn(e));

  fetch("global-body-elements.html").then(e => e.ok ? e.text() : Promise.reject("Body elements não encontrado")).then(e => {
    document.body.insertAdjacentHTML("beforeend", e), initializeGlobalFunctions()
  }).catch(e => console.warn(e));

  // DETECÇÃO AUTOMÁTICA DO BOTÃO "GERAR PDF"
  // Procura pelo botão e substitui sua função pela nova função global
  const btnPDF = document.getElementById("btnGerarPDF");
  if (btnPDF) {
    // Remove listeners antigos clonando o botão
    const newBtn = btnPDF.cloneNode(true);
    if(btnPDF.parentNode) {
        btnPDF.parentNode.replaceChild(newBtn, btnPDF);
    }

    newBtn.addEventListener("click", (e) => {
      e.preventDefault();
      gerarPDFGlobal();
    });
    console.log("🖨️ Botão de PDF configurado para usar o script global.");
  }
});

// =========================================================
// 4. FUNÇÕES AUXILIARES (Menu, Cookies, Acessibilidade)
// =========================================================

function initializeNavigationMenu() {
  const e = document.getElementById("hamburgerButton"),
    o = document.getElementById("offCanvasMenu"),
    t = document.getElementById("menuOverlay"),
    n = document.getElementById("closeOffCanvasMenu") || document.getElementById("closeMenuButton"),
    l = () => {
      o && (o.classList.add("is-open"), o.classList.remove("-translate-x-full")), t && (t.style.display = "block", t.classList.add("is-open"))
    },
    s = () => {
      o && (o.classList.remove("is-open"), o.classList.add("-translate-x-full")), t && (t.style.display = "none", t.classList.remove("is-open"))
    };
  e?.addEventListener("click", l), t?.addEventListener("click", s), n?.addEventListener("click", s), o?.querySelectorAll(".has-submenu > a, .has-submenu > button")?.forEach(e => {
    e.addEventListener("click", o => {
      o.preventDefault();
      const t = e.nextElementSibling;
      t && t.classList.contains("submenu") && t.classList.toggle("open")
    })
  })
}

function inicializarTooltips() {
  document.querySelectorAll("[data-tooltip]").forEach(e => {
    const o = e.getAttribute("data-tooltip"),
      t = document.createElement("div");
    t.className = "tooltip-dinamico", t.innerText = o, e.appendChild(t), e.addEventListener("mouseenter", () => t.style.opacity = "1"), e.addEventListener("mouseleave", () => t.style.opacity = "0"), e.addEventListener("touchstart", () => t.style.opacity = "1"), e.addEventListener("touchend", () => setTimeout(() => t.style.opacity = "0", 2e3))
  })
}

function initializeCookieFunctionality() {
  const e = document.getElementById("cookieConsentBanner"),
    o = document.getElementById("acceptAllCookiesBtn"),
    t = document.getElementById("refuseAllCookiesBtn"),
    n = document.getElementById("manageCookiesBtn"),
    l = document.getElementById("granularCookieModal"),
    s = document.getElementById("saveGranularPreferencesBtn"),
    i = document.getElementById("granularModalCloseButton"),
    a = document.getElementById("cancelGranularPreferencesBtn"),
    c = document.getElementById("cookieAnalytics"),
    r = document.getElementById("cookieMarketing"),
    d = document.getElementById("openGranularCookieModalBtn"),
    m = () => {
      const saved = localStorage.getItem("cookieConsent");
      if (saved === "accepted") {
        h({ analytics_storage: "granted", ad_storage: "granted" });
        u();
        return;
      }
      if (saved === "refused") {
        h({ analytics_storage: "denied", ad_storage: "denied" });
        u();
        return;
      }
      if (!localStorage.getItem("cookieConsent") && e) e.classList.add("show");
    },
    u = () => {
      e && e.classList.remove("show")
    },
    g = () => {
      l && (c && (c.checked = "granted" === localStorage.getItem("analytics_storage")), r && (r.checked = "granted" === localStorage.getItem("ad_storage")), l.classList.remove("hidden"), setTimeout(() => {
        l.classList.add("show")
      }, 10))
    },
    p = () => {
      l && (l.classList.remove("show"), setTimeout(() => {
        l.classList.add("hidden")
      }, 300))
    },
    h = e => {
      "function" == typeof gtag && gtag("consent", "update", e);
      try {
        localStorage.setItem("analytics_storage", e.analytics_storage);
        localStorage.setItem("ad_storage", e.ad_storage);
      } catch (_) {}
    };

  o?.addEventListener("click", () => {
    h({
      analytics_storage: "granted",
      ad_storage: "granted"
    }), localStorage.setItem("cookieConsent", "accepted"), u()
  }), t?.addEventListener("click", () => {
    h({
      analytics_storage: "denied",
      ad_storage: "denied"
    }), localStorage.setItem("cookieConsent", "refused"), u()
  }), n?.addEventListener("click", g), d?.addEventListener("click", g), i?.addEventListener("click", p), a?.addEventListener("click", p), s?.addEventListener("click", () => {
    const e = {
      analytics_storage: c.checked ? "granted" : "denied",
      ad_storage: r.checked ? "granted" : "denied"
    };
    h(e), localStorage.setItem("cookieConsent", "managed"), p(), u()
  }), m()
}

function initializeGlobalFunctions() {
  function e() {
    if (window.innerWidth > 1024) {
      const e = document.getElementById("barraAcessibilidade");
      e && (e.style.display = "flex");
      const o = document.querySelector("nav.desktop-nav");
      o && (o.style.display = "flex")
    }
  }
  e(), window.addEventListener("resize", e);
  const o = document.body,
    t = document.createElement("div");
  t.setAttribute("aria-live", "polite"), t.className = "sr-only", o.appendChild(t);
  const n = document.getElementById("fontSizeText"),
    l = document.getElementById("lineHeightText"),
    s = document.getElementById("letterSpacingText"),
    i = document.getElementById("readingSpeedText"),
    a = document.getElementById("accessibilityToggleButton"),
    c = document.getElementById("pwaAcessibilidadeBar"),
    r = document.getElementById("pwaAcessibilidadeCloseBtn"),
    d = document.getElementById("menuOverlay"),
    m = document.getElementById("offCanvasMenu");
  let u = 1,
    g = 1,
    p = 1,
    h = 1,
    b = null,
    y = !1,
    f = !1;
  const v = window.speechSynthesis,
    w = [{
      rate: .8,
      label: "Lenta"
    }, {
      rate: 1,
      label: "Normal"
    }, {
      rate: 1.5,
      label: "Rápida"
    }];
  document.addEventListener("focusin", e => {
    b = e.target
  });
  const E = e => {
      t.textContent = e, setTimeout(() => t.textContent = "", 3e3)
    },
    // =========================================================
    // ACESSIBILIDADE
    // =========================================================
    applyFontSize = (level, announce) => {
      const fontSizes = ["1em", "1.15em", "1.3em", "1.5em", "2em"];
      const labels = ["Normal", "Médio", "Grande", "Extra Grande", "Máximo"];
      const idx = Math.min(Math.max(parseInt(level || 1, 10), 1), fontSizes.length);
      u = idx;
      const iLevel = idx - 1;
      document.documentElement.style.fontSize = fontSizes[iLevel];
      n && (n.textContent = labels[iLevel]);
      localStorage.setItem("fontSize", String(u));
      (void 0 === announce || announce) && E(`Tamanho da fonte: ${labels[iLevel]}`);
    },
    applyLineHeight = (level, announce) => {
      const values = ["1.5", "1.8", "2.2"];
      const labels = ["Médio", "Grande", "Extra Grande"];
      const idx = Math.min(Math.max(parseInt(level || 1, 10), 1), values.length);
      g = idx;
      const iLevel = idx - 1;
      document.documentElement.style.setProperty("--espacamento-linha", values[iLevel]);
      l && (l.textContent = labels[iLevel]);
      localStorage.setItem("lineHeight", String(g));
      (void 0 === announce || announce) && E(`Espaçamento de linha: ${labels[iLevel]}`);
    },
    applyLetterSpacing = (level, announce) => {
      const values = ["0em", ".05em", ".1em"];
      const labels = ["Normal", "Médio", "Grande"];
      const idx = Math.min(Math.max(parseInt(level || 1, 10), 1), values.length);
      p = idx;
      const iLevel = idx - 1;
      document.documentElement.style.setProperty("--espacamento-letra", values[iLevel]);
      s && (s.textContent = labels[iLevel]);
      localStorage.setItem("letterSpacing", String(p));
      (void 0 === announce || announce) && E(`Espaçamento de letra: ${labels[iLevel]}`);
    },
    readingSpeeds = [{ rate: .8, label: "Lenta" }, { rate: 1, label: "Normal" }, { rate: 1.5, label: "Rápida" }],
    applyReadingSpeed = (level, announce) => {
      const idx = Math.min(Math.max(parseInt(level || 1, 10), 1), readingSpeeds.length);
      h = idx;
      const sp = readingSpeeds[h - 1];
      i && (i.textContent = sp.label);
      localStorage.setItem("readingSpeed", String(h));
      (void 0 === announce || announce) && E(`Velocidade de leitura: ${sp.label}`);
    },
    L = e => {
      u = u % 5 + 1;
      applyFontSize(u, void 0 === e || e);
    },
    k = e => {
      g = g % 3 + 1;
      applyLineHeight(g, void 0 === e || e);
    },
    C = e => {
      p = p % 3 + 1;
      applyLetterSpacing(p, void 0 === e || e);
    },
    S = (e, o) => {
      e && (document.documentElement.style.setProperty("--cor-foco-acessibilidade", e), localStorage.setItem("focusColor", e), document.querySelectorAll(".color-option").forEach(o => {
        o.classList.toggle("selected", o.dataset.color === e)
      }), void 0 === o || o) && E("Cor de foco alterada.")
    },
    x = () => {
      o.classList.toggle("contraste-alto"), E("Alto contraste " + (o.classList.contains("contraste-alto") ? "ativado" : "desativado"))
    },
    A = () => {
      o.classList.toggle("dark-mode"), E("Modo escuro " + (o.classList.contains("dark-mode") ? "ativado" : "desativado"))
    },
    D = () => {
      o.classList.toggle("fonte-dislexia"), E("Fonte para dislexia " + (o.classList.contains("fonte-dislexia") ? "ativada" : "desativada"))
    },
    T = e => {
      if (e && v) {
        v.speaking && v.cancel();
        const o = new SpeechSynthesisUtterance(e);
        o.lang = "pt-BR", o.rate = readingSpeeds[h - 1]?.rate || 1, o.onstart = () => {
          y = !0, f = !1
        }, o.onend = () => {
          y = !1, f = !1
        }, o.onerror = e => {
          y = !1, f = !1, console.error("Erro no leitor de tela:", e)
        }, v.speak(o)
      }
    },
    B = () => {
      y ? f ? (v.resume(), f = !1) : v.pause() : T(document.querySelector("main")?.innerText, f = !0)
    },
    q = () => {
      y = !1, f = !1, setTimeout(() => T(document.querySelector("main")?.innerText), 100)
    },
    N = () => {
      h = h % readingSpeeds.length + 1;
      applyReadingSpeed(h, !1);
    },
    F = () => {
      b && T((b.textContent || b.ariaLabel || b.alt || b.value)?.trim())
    },
    P = () => {
      v && v.cancel(), u = 1, g = 1, p = 1, h = 1, document.documentElement.style.fontSize = "", document.documentElement.style.setProperty("--espacamento-linha", "1.5"), document.documentElement.style.setProperty("--espacamento-letra", "0em"), o.classList.remove("contraste-alto", "dark-mode", "fonte-dislexia"), localStorage.clear(), L(!1), k(!1), C(!1), i && (i.textContent = "Normal"), S("yellow", !1), E("Configurações de acessibilidade redefinidas")
    };
  [{
    ids: ["btnAlternarTamanhoFonte", "btnAlternarTamanhoFontePWA"],
    action: L
  }, {
    ids: ["btnAlternarEspacamentoLinha", "btnAlternarEspacamentoLinhaPWA"],
    action: k
  }, {
    ids: ["btnAlternarEspacamentoLetra", "btnAlternarEspacamentoLetraPWA"],
    action: C
  }, {
    ids: ["btnAlternarContraste", "btnAlternarContrastePWA"],
    action: x
  }, {
    ids: ["btnAlternarModoEscuro", "btnAlternarModoEscuroPWA"],
    action: A
  }, {
    ids: ["btnAlternarFonteDislexia", "btnAlternarFonteDislexiaPWA"],
    action: D
  }, {
    ids: ["btnResetarAcessibilidade", "btnResetarAcessibilidadePWA"],
    action: P
  }, {
    ids: ["btnToggleLeitura"],
    action: B
  }, {
    ids: ["btnReiniciarLeitura"],
    action: q
  }, {
    ids: ["btnAlternarVelocidadeLeitura"],
    action: N
  }, {
    ids: ["btnReadFocused"],
    action: F
  }].forEach(e => {
    e.ids.forEach(o => {
      const t = document.getElementById(o);
      t && t.addEventListener("click", e.action)
    })
  }), document.querySelectorAll(".color-option").forEach(e => {
    e.addEventListener("click", () => S(e.dataset.color))
  });
  const M = document.getElementById("keyboardShortcutsModal"),
    H = document.getElementById("btnKeyboardShortcuts"),
    I = document.getElementById("btnKeyboardShortcutsPWA"),
    O = document.getElementById("keyboardModalCloseButton"),
    J = () => {
      M && M.classList.remove("hidden")
    },
    K = () => {
      M && M.classList.add("hidden")
    };
  H?.addEventListener("click", J), I?.addEventListener("click", J), O?.addEventListener("click", K), window.addEventListener("keydown", e => {
    "Escape" === e.key && M && !M.classList.contains("hidden") && K()
  }), initializeCookieFunctionality();
  const R = () => {
    const savedFontSize = parseInt(localStorage.getItem("fontSize") || "1", 10);
    const savedLineHeight = parseInt(localStorage.getItem("lineHeight") || "1", 10);
    const savedLetterSpacing = parseInt(localStorage.getItem("letterSpacing") || "1", 10);
    const savedReadingSpeed = parseInt(localStorage.getItem("readingSpeed") || "1", 10);

    applyFontSize(savedFontSize, !1);
    applyLineHeight(savedLineHeight, !1);
    applyLetterSpacing(savedLetterSpacing, !1);
    applyReadingSpeed(savedReadingSpeed, !1);

    "true" === localStorage.getItem("highContrast") && o.classList.add("contraste-alto");
    "true" === localStorage.getItem("darkMode") && o.classList.add("dark-mode");
    "true" === localStorage.getItem("dyslexiaFont") && o.classList.add("fonte-dislexia");

    S(localStorage.getItem("focusColor") || "yellow", !1);
  };
  R(), a?.addEventListener("click", () => {
    m?.classList.contains("is-open") && (m.classList.remove("is-open"), m.classList.add("-translate-x-full")), c?.classList.add("is-open"), d && (d.style.display = "block")
  }), r?.addEventListener("click", () => {
    c?.classList.remove("is-open"), m?.classList.contains("is-open") || d && (d.style.display = "none")
  });
  const z = document.getElementById("backToTopBtn");
  z && (window.addEventListener("scroll", () => {
    window.requestAnimationFrame(() => {
        z.style.display = window.scrollY > 200 ? "block" : "none";
    });
  }, { passive: true }), z.addEventListener("click", () => window.scrollTo({
    top: 0,
    behavior: "smooth"
  })));
  inicializarTooltips();
}