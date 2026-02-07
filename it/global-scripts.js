/* =========================
   Camada 4 — Anti-bot leve
   ========================= */
(function () {
  try {
    const ua = navigator.userAgent || "";
    const isBotLike =
      navigator.webdriver === true ||
      ua.length < 10 ||
      !navigator.language ||
      (screen && (screen.width === 0 || screen.height === 0));

    if (isBotLike) {
      // Redireciona para home (não quebra SEO e evita loop)
      if (location.pathname !== "/") {
        location.replace("/");
      }
    }
  } catch (e) {
    // ignora erros
  }
})();

// Executar IMEDIATAMENTE para evitar flash de tamanho de fonte
(function() {
  const savedFontSize = parseInt(localStorage.getItem("fontSize") || "1", 10);
  const fontSizes = ["1em", "1.15em", "1.3em", "1.5em", "2em"];
  const idx = Math.min(Math.max(savedFontSize, 1), fontSizes.length);
  document.documentElement.style.fontSize = fontSizes[idx - 1];
})();
// Registra o Service Worker
"serviceWorker" in navigator && window.addEventListener("load", () => {
  navigator.serviceWorker.register("/sw.js").then(e => {
    console.log("Service Worker registado com sucesso:", e.scope)
  }, e => {
    console.log("Registo do Service Worker falhou:", e)
  })
});

function gerarPDFGlobal(e) {
  const url = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
  console.log("Verificando a biblioteca html2pdf...");

  if (typeof html2pdf === "function") {
    console.log("Biblioteca já carregada. Gerando PDF...");
    executarLogicaDoHtml2Pdf(e);
    return;
  }

  console.log("Biblioteca não encontrada. Carregando script...");
  const script = document.createElement("script");
  script.src = url;
  document.head.appendChild(script);

  script.onload = () => {
    console.log("Biblioteca html2pdf carregada com sucesso. Gerando PDF...");
    executarLogicaDoHtml2Pdf(e);
  };

  script.onerror = () => {
    console.error("Falha ao carregar o script do html2pdf.");
    alert("Erro ao carregar a biblioteca de PDF. Por favor, tente novamente.");
  };
}

function executarLogicaDoHtml2Pdf(e) {
  const {
    titulo: o = "Relatório da Calculadora",
    subtitulo: t = "Relatório de Cálculo Assistencial",
    nomeArquivo: n = "relatorio.pdf",
    seletorConteudo: l = ".main-content-wrapper"
  } = e;
  console.log(`Iniciando geração de PDF para: ${o}`);
  const s = document.querySelector(l);
  if (!s) return alert("Erro: Não foi possível encontrar o conteúdo principal para gerar o PDF."), void console.error(`Elemento com seletor "${l}" não encontrado.`);
  const c = document.createElement("div");
  c.style.padding = "20px", c.style.fontFamily = "Inter, sans-serif";
  const d = document.createElement("div");
  d.style.textAlign = "center", d.style.marginBottom = "25px", d.innerHTML = `<h1 style="font-family: 'Nunito Sans', sans-serif; font-size: 22px; font-weight: bold; color: #1A3E74; margin: 0;">${o}</h1><h2 style="font-size: 14px; color: #666; margin-top: 5px;">${t}</h2><p style="font-size: 10px; color: #999; margin-top: 10px;">Gerado em: ${new Date().toLocaleString("pt-BR")}</p>`, c.appendChild(d);
  const r = s.querySelector("#conteudo");
  if (r) {
    const e = r.cloneNode(!0);
    e.querySelectorAll('input[type="radio"]:not(:checked)').forEach(e => {
      e.closest(".option-row, .option-label")?.remove()
    }), e.querySelectorAll("tbody, .options-group").forEach(e => {
      0 === e.children.length && e.closest(".criterion-section, .criterion-table")?.remove()
    }), c.appendChild(e)
  }
  const i = s.querySelector("#resultado");
  i && !i.classList.contains("hidden") && ((e = i.cloneNode(!0)).style.marginTop = "20px", c.appendChild(e)), c.style.lineHeight = "1.5", c.style.fontSize = "12px", c.style.margin = "0", e = {
    margin: [.5, .5, .5, .5],
    filename: n,
    image: {
      type: "jpeg",
      quality: .98
    },
    html2canvas: {
      scale: 2,
      scrollY: 0,
      useCORS: !0
    },
    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait"
    },
    pagebreak: {
      avoid: ["p", "h1", "h2", "h3", "div", "section"]
    }
  }, html2pdf().set(e).from(c).save().catch(e => {
    console.error("Erro ao gerar PDF: ", e)
  })
}

document.addEventListener("DOMContentLoaded", function () {
  fetch("menu-global.html").then(e => e.ok ? e.text() : Promise.reject("Ficheiro menu-global.html não encontrado")).then(e => {
    const o = document.getElementById("global-header-container");
    o && (o.innerHTML = e, initializeNavigationMenu())
  }).catch(e => console.warn("Não foi possível carregar o menu global:", e)),
  fetch("global-body-elements.html").then(e => e.ok ? e.text() : Promise.reject("Ficheiro global-body-elements.html não encontrado")).then(e => {
    document.body.insertAdjacentHTML("beforeend", e), initializeGlobalFunctions()
  }).catch(e => console.warn("Não foi possível carregar os elementos globais do corpo:", e))
});

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
  // Elementos do DOM (Banner e Modal)
  const e = document.getElementById("cookieConsentBanner"),
    l = document.getElementById("granularCookieModal"),
    c = document.getElementById("cookieAnalytics"),
    r = document.getElementById("cookieMarketing");

  // Funções Lógicas
  const h = (param) => {
      // Atualiza consentimento no GTM/GA4
      if (typeof gtag === "function") {
        gtag("consent", "update", param);
      }
      // Salva preferências granulares
      try {
        localStorage.setItem("analytics_storage", param.analytics_storage);
        localStorage.setItem("ad_storage", param.ad_storage);
      } catch (_) {}
    },
    u = () => {
      e && e.classList.remove("show")
    },
    g = () => {
      if (l) {
        if (c) c.checked = "granted" === localStorage.getItem("analytics_storage");
        if (r) r.checked = "granted" === localStorage.getItem("ad_storage");
        l.classList.remove("hidden");
        setTimeout(() => { l.classList.add("show") }, 10);
      }
    },
    p = () => {
      if (l) {
        l.classList.remove("show");
        setTimeout(() => { l.classList.add("hidden") }, 300);
      }
    },
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
      if (!saved && e) e.classList.add("show");
    };

  // Delegação de Eventos (Resolve o problema de carregamento assíncrono do rodapé)
  document.addEventListener("click", (event) => {
    const target = event.target;
    // Verifica se o clique foi em um dos botões de interesse ou dentro deles
    const btn = target.closest("button");
    const id = target.id || (btn ? btn.id : null);

    if (!id) return;

    if (id === "acceptAllCookiesBtn") {
        h({ analytics_storage: "granted", ad_storage: "granted" });
        localStorage.setItem("cookieConsent", "accepted");
        u();
    } else if (id === "refuseAllCookiesBtn") {
        h({ analytics_storage: "denied", ad_storage: "denied" });
        localStorage.setItem("cookieConsent", "refused");
        u();
    } else if (id === "manageCookiesBtn" || id === "openGranularCookieModalBtn") {
        g(); // Abre o modal
    } else if (id === "granularModalCloseButton" || id === "cancelGranularPreferencesBtn") {
        p(); // Fecha o modal
    } else if (id === "saveGranularPreferencesBtn") {
        const prefs = {
            analytics_storage: (c && c.checked) ? "granted" : "denied",
            ad_storage: (r && r.checked) ? "granted" : "denied"
        };
        h(prefs);
        localStorage.setItem("cookieConsent", "managed");
        p();
        u();
    }
  });

  // Executa verificação inicial
  m();
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
    // ACESSIBILIDADE: ajustes (corrigido)
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
      // 1. Cancela leitura de voz se houver
      v && v.cancel();

      // 2. Reseta as variáveis de controle para o índice 1 (Início)
      u = 1; // Fonte (1 = Normal)
      g = 1; // Linha (1 = Médio no array de labels)
      p = 1; // Letra (1 = Normal)
      h = 1; // Velocidade (1 = Normal)

      // 3. APLICA FORÇADAMENTE OS VALORES PADRÃO (Isso corrige o texto e o visual)
      // O 'false' no segundo parâmetro evita que o leitor de tela fale 4 vezes seguidas
      applyFontSize(1, false);      // Força Fonte: Normal
      applyLineHeight(1, false);    // Força Linha: Médio
      applyLetterSpacing(1, false); // Força Letra: Normal
      applyReadingSpeed(1, false);  // Força Velocidade: Normal

      // 4. Limpa classes de alto contraste/dark mode
      o.classList.remove("contraste-alto", "dark-mode", "fonte-dislexia");

      // 5. Reseta cor de foco para amarelo
      S("yellow", false);

      // 6. Limpa memória
      localStorage.clear();

      // 7. Feedback visual único
      E("Configurações redefinidas para o padrão");
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

