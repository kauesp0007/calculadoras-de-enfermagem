"serviceWorker" in navigator && window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(e => {
        console.log("Service Worker registado com sucesso:", e.scope)
    }, e => {
        console.log("Registo do Service Worker falhou:", e)
    })
});

function gerarPDFGlobal(e) {
    const o = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    console.log("Verificando a biblioteca html2pdf..."), "function" == typeof html2pdf ? (console.log("Biblioteca já carregada. Gerando PDF..."), executarLogicaDoHtml2Pdf(e)) : (console.log("Biblioteca não encontrada. Carregando script..."), script = document.createElement("script"), script.src = o, document.head.appendChild(script), script.onload = () => {
        console.log("Biblioteca html2pdf carregada com sucesso. Gerando PDF..."), executarLogicaDoHtml2Pdf(e)
    }, script.onerror = () => {
        console.error("Falha ao carregar o script do html2pdf."), alert("Erro ao carregar a biblioteca de PDF. Por favor, tente novamente.")
    })
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
    }).catch(e => console.warn("Não foi possível carregar o menu global:", e)), fetch("global-body-elements.html").then(e => e.ok ? e.text() : Promise.reject("Ficheiro global-body-elements.html não encontrado")).then(e => {
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
            localStorage.getItem("cookieConsent") || !e || e.classList.add("show")
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
            "function" == typeof gtag && gtag("consent", "update", e)
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
        h(e), localStorage.setItem("cookieConsent", "managed"), localStorage.setItem("analytics_storage", e.analytics_storage), localStorage.setItem("ad_storage", e.ad_storage), p(), u()
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
        L = e => {
            const o = ["1em", "1.15em", "1.3em", "1.5em", "2em"],
                t = ["Normal", "Médio", "Grande", "Extra Grande", "Máximo"];
            u = u % o.length + 1;
            const l = u - 1;
            body.style.fontSize = o[l], n && (n.textContent = t[l]), localStorage.setItem("fontSize", u), void 0 === e || e && E(`Tamanho da fonte: ${t[l]}`)
        },
        k = e => {
            const o = ["1.5", "1.8", "2.2"],
                t = ["Médio", "Grande", "Extra Grande"];
            g = g % o.length + 1;
            const n = g - 1;
            document.documentElement.style.setProperty("--espacamento-linha", o[n]), l && (l.textContent = t[n]), localStorage.setItem("lineHeight", g), void 0 === e || e && E(`Espaçamento de linha: ${t[n]}`)
        },
        C = e => {
            const o = ["0em", ".05em", ".1em"],
                t = ["Normal", "Médio", "Grande"];
            p = p % o.length + 1;
            const n = p - 1;
            document.documentElement.style.setProperty("--espacamento-letra", o[n]), s && (s.textContent = t[n]), localStorage.setItem("letterSpacing", p), void 0 === e || e && E(`Espaçamento de letra: ${t[n]}`)
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
                o.lang = "pt-BR", o.rate = w[h - 1]?.rate || 1, o.onstart = () => {
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
            h = h % w.length + 1;
            const e = w[h - 1];
            i && (i.textContent = e.label)
        },
        F = () => {
            b && T((b.textContent || b.ariaLabel || b.alt || b.value)?.trim())
        },
        P = () => {
            v && v.cancel(), u = 1, g = 1, p = 1, h = 1, o.style.fontSize = "", document.documentElement.style.setProperty("--espacamento-linha", "1.5"), document.documentElement.style.setProperty("--espacamento-letra", "0em"), o.classList.remove("contraste-alto", "dark-mode", "fonte-dislexia"), localStorage.clear(), L(!1), k(!1), C(!1), i && (i.textContent = "Normal"), S("yellow", !1), E("Configurações de acessibilidade redefinidas")
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
        currentFontSize = 1, L(!1), currentLineHeight = parseInt(localStorage.getItem("lineHeight") || "1", 10), k(!1), currentLetterSpacing = parseInt(localStorage.getItem("letterSpacing") || "1", 10), C(!1), velocidadeLeituraAtual = parseInt(localStorage.getItem("readingSpeed") || "1", 10), i && N(), "true" === localStorage.getItem("highContrast") && o.classList.add("contraste-alto"), "true" === localStorage.getItem("darkMode") && o.classList.add("dark-mode"), "true" === localStorage.getItem("dyslexiaFont") && o.classList.add("fonte-dislexia"), S(localStorage.getItem("focusColor") || "yellow", !1)
    };
    R(), a?.addEventListener("click", () => {
        m?.classList.contains("is-open") && (m.classList.remove("is-open"), m.classList.add("-translate-x-full")), c?.classList.add("is-open"), d && (d.style.display = "block")
    }), r?.addEventListener("click", () => {
        c?.classList.remove("is-open"), m?.classList.contains("is-open") || d && (d.style.display = "none")
    });
    const z = document.getElementById("backToTopBtn");
    z && (window.addEventListener("scroll", () => {
        z.style.display = window.scrollY > 200 ? "block" : "none"
    }), z.addEventListener("click", () => window.scrollTo({
        top: 0,
        behavior: "smooth"
    })));
    const G = () => {
        if (document.querySelector("[vw]")) {
            let e = 0;
            const o = setInterval(() => {
                e++, void 0 !== typeof VLibras ? (new VLibras.Widget("https://vlibras.gov.br/app"), clearInterval(o)) : e >= 50 && (console.warn("VLibras widget could not be initialized."), clearInterval(o))
            }, 200)
        }
    };
    G();
    const U = document.getElementById("page-search-input"),
        W = document.getElementById("search-btn"),
        X = e => {
            let o = document.body.innerHTML;
            const t = new RegExp(`(${e})`, "gi");
            o = o.replace(t, '<span class="highlight">$1</span>'), document.body.innerHTML = o
        },
        Y = () => {
            document.querySelectorAll(".highlight").forEach(e => {
                const o = e.parentNode;
                o.replaceChild(document.createTextNode(e.textContent), e)
            })
        },
        V = () => {
            const e = U.value.trim();
            if (Y(), e.length > 2) {
                if (X(e), !document.querySelector(".highlight")) {
                    alert("Nenhum resultado encontrado.")
                } else e.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                })
            }
        };
    W.addEventListener("click", V), U.addEventListener("keypress", e => {
        "Enter" === e.key && (e.preventDefault(), V())
    }), window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({
            pageLanguage: "pt",
            includedLanguages: "en,es,pt",
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: !1
        }, "language-switcher")
    };
    const Z = document.createElement("script");
    Z.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit", Z.async = !0, document.body.appendChild(Z), window.translatePage = function (e) {
        const o = document.querySelector(".goog-te-combo");
        o && (o.value = e, o.dispatchEvent(new Event("change")))
    }, inicializarTooltips()
}
// Registra o Service Worker para funcionamento offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        console.log('Falha ao registrar Service Worker:', error);
      });
  });
}
/**
 * FILTRO DINÂMICO PARA AS GRELHAS DE CALCULADORAS (PÁGINA INDEX)
 * Este script "ouve" a caixa de pesquisa e filtra os cartões
 * em todas as grelhas da página (calculator-grid).
 */
function inicializarFiltroIndex() {
  // 1. Encontra os elementos na página
  const input = document.getElementById('filtro-calculadoras-input');
  const grids = document.querySelectorAll('.calculator-grid');

  // 2. Se não houver caixa de pesquisa nesta página, não faz nada
  if (!input || grids.length === 0) {
    return;
  }

  // 3. Função que faz o filtro
  function filtrarCartoes() {
    const termo = input.value.toLowerCase().trim();
    let totalVisivel = 0;

    // 4. Passa por cada grelha (ex: "Calculadoras", "Escalas", "Vacinas")
    grids.forEach(grid => {
      let cartoesNaGrelha = 0;
      let cartoesVisiveisNestaGrelha = 0;

      const cartoes = grid.querySelectorAll('a'); // Apanha todos os cartões (links)

      // 5. Passa por cada cartão dentro da grelha
      cartoes.forEach(cartao => {
        cartoesNaGrelha++;
        const titulo = cartao.querySelector('h3')?.textContent.toLowerCase() || '';
        const descricao = cartao.querySelector('p')?.textContent.toLowerCase() || '';

        // 6. Verifica se o texto do cartão corresponde ao termo da pesquisa
        if (titulo.includes(termo) || descricao.includes(termo)) {
          cartao.style.display = 'flex'; // Mostra o cartão
          cartoesVisiveisNestaGrelha++;
        } else {
          cartao.style.display = 'none'; // Esconde o cartão
        }
      });

      // 7. Se uma grelha inteira ficar vazia, esconde o seu título (H2)
      const tituloGrelha = grid.previousElementSibling;
      if (tituloGrelha && tituloGrelha.tagName === 'H2') {
        if (cartoesVisiveisNestaGrelha === 0) {
          tituloGrelha.style.display = 'none';
        } else {
          tituloGrelha.style.display = 'block';
        }
      }

      totalVisivel += cartoesVisiveisNestaGrelha;
    });

    // 8. (Opcional) Mostra uma mensagem se NENHUM cartão for encontrado
    // Pode criar um <div id="filtro-sem-resultados" class="hidden">...</div>
    const msgSemResultados = document.getElementById('filtro-sem-resultados');
    if (msgSemResultados) {
      if (totalVisivel === 0) {
        msgSemResultados.style.display = 'block';
      } else {
        msgSemResultados.style.display = 'none';
      }
    }
  }

  // 9. "Ouve" o evento de digitação no input
  input.addEventListener('input', filtrarCartoes);
}

// Garante que o script só corre depois de a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarFiltroIndex);
} else {
  inicializarFiltroIndex(); // Corre imediatamente se o DOM já estiver carregado
}