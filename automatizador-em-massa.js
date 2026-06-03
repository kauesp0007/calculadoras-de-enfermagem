const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÕES DO REPOSITÓRIO E IDIOMAS
// =============================================================================
const ROOT_DIR = '.';
const LANGUAGES = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const TARGET_FILE = 'global-scripts.js'; // Exceção ativada apenas para este arquivo

let filesChangedCount = 0;
let filesSkippedCount = 0;

// O bloco exato de código a ser injetado no final do arquivo
const NOVO_BLOCO_CODIGO = `
/* =========================================================
   MODO ADMIN + GOOGLE TAG + CONSENT + ADSENSE (OTIMIZADO PARA INP)
   ========================================================= */

// Função que engloba toda a lógica que estava nos HTMLs
function initLazyLoadServices() {
  if (
    localStorage.getItem('admin_mode') === 'true' ||
    new URLSearchParams(window.location.search).get('admin') === '1'
  ) {
    console.log('🚧 Modo Admin: Bloqueado.');
    if (new URLSearchParams(window.location.search).get('admin') === '1') {
      localStorage.setItem('admin_mode', 'true');
    }
  } else {
    var savedConsent = localStorage.getItem("cookieConsent");
    var isRefused = (savedConsent === "refused");
    var isManaged = (savedConsent === "managed");
    var adsBlocked = isRefused || (isManaged && localStorage.getItem("ad_storage") === "denied");

    window.__metricsLoaded = false;
    window.__adsenseLoaded = false;
    window.dataLayer = window.dataLayer || [];

    function gtag() {
      dataLayer.push(arguments);
    }
    window.gtag = gtag;

    function loadAnalytics() {
      if (window.__metricsLoaded) return;
      window.__metricsLoaded = true;

      var aState = isRefused ? "denied" : (localStorage.getItem("analytics_storage") || "granted");
      var adState = adsBlocked ? "denied" : "granted";

      var s = document.createElement("script");
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
      gtag("config", "G-EX8");
      gtag("config", "AW-952633102");
      gtag("config", "AW-9277197961");

      console.log("📈 Analytics carregado via Lazy Load (Otimizado).");
    }

    function loadAdSenseOnce() {
      if (window.__adsenseLoaded || adsBlocked) return;
      window.__adsenseLoaded = true;
      var ad = document.createElement("script");
      ad.async = true;
      ad.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
      ad.crossOrigin = "anonymous";
      document.head.appendChild(ad);
      console.log("💰 AdSense carregado via Lazy Load (Otimizado).");
    }

    // --- A SOLUÇÃO DO INP ESTÁ AQUI ---
    // Envolvemos o carregamento para não bloquear a Thread Principal
    function executeServices() {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(function () {
          loadAnalytics();
          loadAdSenseOnce();
        });
      } else {
        setTimeout(function () {
          loadAnalytics();
          loadAdSenseOnce();
        }, 100); // Pequeno atraso para liberar a interação
      }
    }

    function onUserInteraction() {
      executeServices();

      window.removeEventListener("scroll", onUserInteraction);
      window.removeEventListener("mousemove", onUserInteraction);
      window.removeEventListener("touchstart", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
    }

    if (!adsBlocked) {
      window.addEventListener("scroll", onUserInteraction, {
        passive: true
      });
      window.addEventListener("mousemove", onUserInteraction, {
        passive: true
      });
      window.addEventListener("touchstart", onUserInteraction, {
        passive: true
      });
      window.addEventListener("keydown", onUserInteraction, {
        passive: true
      });

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
    }

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
}

// Inicializa a função assim que o DOM estiver pronto
document.addEventListener("DOMContentLoaded", initLazyLoadServices);
`;

/**
 * Inicia o processo de injeção
 */
function start() {
    console.log('--- Iniciando Atualização do global-scripts.js ---');

    // 1. Processar arquivo na raiz
    processarArquivo(ROOT_DIR);

    // 2. Processar arquivo nas pastas de idioma
    LANGUAGES.forEach(lang => {
        const langPath = path.join(ROOT_DIR, lang);
        if (fs.existsSync(langPath)) {
            processarArquivo(langPath);
        }
    });

    console.log('\\n==================================================');
    console.log('               RELATÓRIO DE EXECUÇÃO');
    console.log('==================================================');
    console.log(`Arquivos JS alterados: ${filesChangedCount}`);
    console.log(`Arquivos JS ignorados (já atualizados): ${filesSkippedCount}`);
    console.log('==================================================');
}

/**
 * Verifica o arquivo na pasta e injeta o código se necessário
 */
function processarArquivo(pasta) {
    const filePath = path.join(pasta, TARGET_FILE);

    if (fs.existsSync(filePath)) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');

            // Verifica se a função nova já existe no arquivo
            if (!content.includes('function initLazyLoadServices()')) {
                // Adiciona uma quebra de linha por segurança antes de injetar
                content += '\\n' + NOVO_BLOCO_CODIGO;
                fs.writeFileSync(filePath, content, 'utf8');
                filesChangedCount++;
                console.log(`[ATUALIZADO] ${filePath}`);
            } else {
                filesSkippedCount++;
                console.log(`[IGNORADO - CÓDIGO JÁ PRESENTE] ${filePath}`);
            }
        } catch (err) {
            console.error(`Erro ao processar ${filePath}: ${err.message}`);
        }
    }
}

start();