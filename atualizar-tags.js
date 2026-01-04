const fs = require('fs');
const path = require('path');

// =============================================================================
// ⚙️ CONFIGURAÇÕES
// =============================================================================

// 1. Pastas permitidas para atualização (Raiz + pastas de idiomas)
const targetDirs = [
    '.', 'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

const excludedFiles = [
    'downloads.html', 'footer.html', 'menu-global.html',
    'global-body-elements.html', '_language_selector.html',
    'sw.js', 'package.json', 'googlefc0a17cdd552164b.html'
];

const excludedFolders = ['biblioteca', 'downloads', 'node_modules', '.git', '.vscode'];

// =============================================================================
// 📝 BLOCOS DE CÓDIGO
// =============================================================================

// O bloco ANTIGO (VERSÃO OPT-OUT exata do seu prompt)
const oldCodeBlock = `<script>
    /* =========================================================
       MODO ADMIN + GOOGLE TAG + CONSENT + ADSENSE (LAZY LOAD)
       (VERSÃO OTIMIZADA: Prioridade para o PageSpeed)
       ========================================================= */

    if (localStorage.getItem('admin_mode') === 'true') {
      console.log('🚧 Modo Admin: Bloqueado.');
    } else {
      var savedConsent = localStorage.getItem("cookieConsent");
      var isRefused = (savedConsent === "refused");
      var isManaged = (savedConsent === "managed");
      var adsBlocked = isRefused || (isManaged && localStorage.getItem("ad_storage") === "denied");

      window.__metricsLoaded = false;
      window.__adsenseLoaded = false;
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      window.gtag = gtag;

      function loadAnalytics() {
        if (window.__metricsLoaded) return;
        window.__metricsLoaded = true;

        var scriptGA = document.createElement('script');
        scriptGA.async = true;
        // ID Primário do seu site de Enfermagem
        scriptGA.src = "https://www.googletagmanager.com/gtag/js?id=G-8FLJ59XXDK";
        document.head.appendChild(scriptGA);

        var aState = isRefused ? "denied" : (localStorage.getItem("analytics_storage") || "granted");
        var adState = adsBlocked ? "denied" : "granted";

        gtag("consent", "default", {
          analytics_storage: aState,
          ad_storage: adState,
          ad_user_data: adState,
          ad_personalization: adState,
          wait_for_update: 500
        });

        gtag("js", new Date());
        gtag("config", "G-8FLJ59XXDK"); // Site Enfermagem
        gtag("config", "G-VVDP5JGEX8"); // Site Principal
        gtag("config", "AW-952633102"); // Ads
      }

      function loadAdSense() {
        if (window.__adsenseLoaded || adsBlocked) return;
        window.__adsenseLoaded = true;
        var scriptAd = document.createElement('script');
        scriptAd.async = true;
        scriptAd.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
        scriptAd.crossOrigin = "anonymous";
        document.head.appendChild(scriptAd);
      }

      loadAnalytics();

      function onUserInteraction() {
        loadAdSense();
        window.removeEventListener('scroll', onUserInteraction);
        window.removeEventListener('mousemove', onUserInteraction);
        window.removeEventListener('touchstart', onUserInteraction);
      }

      if (!adsBlocked) {
        window.addEventListener('scroll', onUserInteraction, {passive: true});
        window.addEventListener('mousemove', onUserInteraction, {passive: true});
        window.addEventListener('touchstart', onUserInteraction, {passive: true});
        setTimeout(loadAdSense, 3500);
      }

      window.acceptAllCookies = function () {
        localStorage.setItem("cookieConsent", "accepted");
        gtag("consent", "update", { analytics_storage: "granted", ad_storage: "granted" });
        loadAdSense();
      };

      window.rejectAllCookies = function () {
        localStorage.setItem("cookieConsent", "refused");
        gtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied" });
        var ads = document.querySelectorAll('ins.adsbygoogle, .google-auto-placed');
        ads.forEach(function (ad) { ad.style.display = 'none'; ad.innerHTML = ''; });
      };
    }
</script>`;

// O bloco NOVO (Com G-8FLJ59XXDK como fonte principal e Lazy Load para PageSpeed)
const newCodeBlock = `<script>
    /* =========================================================
       MODO ADMIN + GOOGLE TAG + CONSENT + ADSENSE (LAZY LOAD)
       (VERSÃO ATUALIZADA: G-8FLJ59XXDK + G-VVDP5JGEX8 + ADS)
       ========================================================= */

    if (localStorage.getItem('admin_mode') === 'true') {
      console.log('🚧 Modo Admin: Bloqueado.');
    } else {
      var savedConsent = localStorage.getItem("cookieConsent");
      var isRefused = (savedConsent === "refused");
      var isManaged = (savedConsent === "managed");
      var adsBlocked = isRefused || (isManaged && localStorage.getItem("ad_storage") === "denied");

      window.__metricsLoaded = false;
      window.__adsenseLoaded = false;
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      window.gtag = gtag;

      function loadAnalytics() {
        if (window.__metricsLoaded) return;
        window.__metricsLoaded = true;

        var scriptGA = document.createElement('script');
        scriptGA.async = true;
        // ID Primário (G-8FLJ59XXDK) - Conforme seu painel Analytics
        scriptGA.src = "https://www.googletagmanager.com/gtag/js?id=G-8FLJ59XXDK";
        document.head.appendChild(scriptGA);

        var aState = isRefused ? "denied" : (localStorage.getItem("analytics_storage") || "granted");
        var adState = adsBlocked ? "denied" : "granted";

        gtag("consent", "default", {
          analytics_storage: aState,
          ad_storage: adState,
          ad_user_data: adState,
          ad_personalization: adState,
          wait_for_update: 500
        });

        gtag("js", new Date());
        gtag("config", "G-8FLJ59XXDK"); // Fluxo específico do site
        gtag("config", "G-VVDP5JGEX8"); // Site Principal
        gtag("config", "AW-952633102"); // Google Ads
      }

      function loadAdSenseOnce() {
        if (window.__adsenseLoaded || adsBlocked) return;
        window.__adsenseLoaded = true;
        var scriptAd = document.createElement('script');
        scriptAd.async = true;
        scriptAd.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
        scriptAd.crossOrigin = "anonymous";
        document.head.appendChild(scriptAd);
        console.log("🚀 AdSense iniciado via Lazy Load.");
      }

      loadAnalytics();

      function onUserInteraction() {
        loadAdSenseOnce();
        window.removeEventListener('scroll', onUserInteraction);
        window.removeEventListener('mousemove', onUserInteraction);
        window.removeEventListener('touchstart', onUserInteraction);
      }

      if (!adsBlocked) {
        window.addEventListener('scroll', onUserInteraction, {passive: true});
        window.addEventListener('mousemove', onUserInteraction, {passive: true});
        window.addEventListener('touchstart', onUserInteraction, {passive: true});
        setTimeout(loadAdSenseOnce, 3500);
      }

      function applyConsent(consent) {
        gtag("consent", "update", consent);
        if (consent.ad_storage === "granted") {
          adsBlocked = false;
          loadAdSenseOnce();
        } else {
          adsBlocked = true;
          var ads = document.querySelectorAll('ins.adsbygoogle, .google-auto-placed');
          ads.forEach(function (ad) { ad.style.display = 'none'; ad.innerHTML = ''; });
        }
        try {
          localStorage.setItem("analytics_storage", consent.analytics_storage);
          localStorage.setItem("ad_storage", consent.ad_storage);
        } catch (e) {}
      }

      window.acceptAllCookies = function () {
        localStorage.setItem("cookieConsent", "accepted");
        applyConsent({ analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
      };

      window.rejectAllCookies = function () {
        localStorage.setItem("cookieConsent", "refused");
        applyConsent({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      };

      window.applyGranularCookies = function (analyticsGranted, adsGranted) {
        localStorage.setItem("cookieConsent", "managed");
        var aSt = analyticsGranted ? "granted" : "denied";
        var dSt = adsGranted ? "granted" : "denied";
        applyConsent({ analytics_storage: aSt, ad_storage: dSt, ad_user_data: dSt, ad_personalization: dSt });
      };
    }
</script>`;

// =============================================================================
// 🚀 LÓGICA DE REGEX E SUBSTITUIÇÃO (ÂNCORAS ELÁSTICAS)
// =============================================================================

/**
 * Este Regex foi aprimorado para ser "elástico":
 * 1. Âncora Inicial: Procura o <script> e o cabeçalho de "VERSÃO OTIMIZADA".
 * 2. Miolo ([\s\S]*?): Captura qualquer caractere (espaços, quebras, abas) de
 * forma não-gananciosa até encontrar a âncora final.
 * 3. Âncora Final: Localiza o fechamento da função rejectAllCookies e a tag </script>.
 */
const regexFinder = /<script>[\s]*\/\*[\s!=]+MODO ADMIN \+ GOOGLE TAG \+ CONSENT \+ ADSENSE \(LAZY LOAD\)[\s\S]*?\(VERSÃO OTIMIZADA: Prioridade para o PageSpeed\)[\s\S]*?window\.rejectAllCookies = function[\s\S]*?ad\.innerHTML = '';[\s\S]*?};[\s\S]*?}[\s\S]*?<\/script>/g;

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Resetamos o lastIndex pois o uso da flag /g com .test() move o cursor de busca
        regexFinder.lastIndex = 0;

        if (regexFinder.test(content)) {
            // Resetamos novamente para garantir que a substituição ocorra em todo o arquivo
            regexFinder.lastIndex = 0;
            const newContent = content.replace(regexFinder, newCodeBlock);

            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✅ Atualizado: ${filePath}`);
            return true;
        }
    } catch (err) {
        console.error(`❌ Erro ao processar ${filePath}:`, err.message);
    }
    return false;
}

// Execução recursiva nas pastas do projeto (Raiz e Idiomas)
let count = 0;
targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;

    // Filtra apenas arquivos HTML e ignora os arquivos excluídos na configuração
    const files = fs.readdirSync(dir).filter(f =>
        f.endsWith('.html') && !excludedFiles.includes(f)
    );

    files.forEach(f => {
        const fullPath = path.join(dir, f);
        if (processFile(fullPath)) count++;
    });
});

console.log(`-----------------------------------`);
console.log(`🏁 Fim! ${count} arquivos atualizados no total.`);