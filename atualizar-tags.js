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
       (VERSÃO ULTRA RÁPIDA: Adia anúncios para ganho de PageSpeed)
       ========================================================= */

    // 🛡️ MODO ADMIN — bloqueia tudo
    if (localStorage.getItem('admin_mode') === 'true') {
      console.log('🚧 Modo Admin: Analytics e AdSense NÃO foram carregados.');
    } else {
      var savedConsent = localStorage.getItem("cookieConsent");
      var isRefused = (savedConsent === "refused");
      var isManaged = (savedConsent === "managed");

      // Define se anúncios começam bloqueados (Recusado ou Gerenciado c/ Ad negado)
      var adsBlocked = isRefused;
      if (isManaged) {
        var savedAdStorage = localStorage.getItem("ad_storage");
        if (savedAdStorage === "denied") {
          adsBlocked = true;
        }
      }

      // Flags para evitar duplo carregamento
      window.__metricsLoaded = false;
      window.__adsenseLoaded = false;

      // Filas globais
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      window.gtag = window.gtag || gtag;

      /* -----------------------------------------------------
         1) FUNÇÃO: CARREGAR ANALYTICS (GTAG)
         ----------------------------------------------------- */
      function loadAnalytics() {
        if (window.__metricsLoaded) return;
        window.__metricsLoaded = true;

        var scriptGA = document.createElement('script');
        scriptGA.async = true;
        // ID Principal (G-VVDP5JGEX8)
        scriptGA.src = "https://www.googletagmanager.com/gtag/js?id=G-VVDP5JGEX8";
        document.head.appendChild(scriptGA);

        // Define status inicial baseado no histórico
        var analyticsState = "granted";
        var adsState = "granted";

        if (isRefused) {
          analyticsState = "denied";
          adsState = "denied";
        } else if (isManaged) {
          analyticsState = localStorage.getItem("analytics_storage") || "denied";
          adsState = localStorage.getItem("ad_storage") || "denied";
        }

        gtag("consent", "default", {
          analytics_storage: analyticsState,
          ad_storage: adsState,
          ad_user_data: adsState,
          ad_personalization: adsState,
          wait_for_update: 500
        });

        gtag("js", new Date());

        // Configs
        gtag("config", "G-VVDP5JGEX8");
        gtag("config", "AW-952633102");
      }

      /* -----------------------------------------------------
         2) FUNÇÃO: CARREGAR ADSENSE (LAZY LOAD)
         ----------------------------------------------------- */
      function loadAdSense() {
        // Só carrega se não foi carregado E não está bloqueado
        if (window.__adsenseLoaded || adsBlocked) return;
        window.__adsenseLoaded = true;

        var scriptAd = document.createElement('script');
        scriptAd.async = true;
        scriptAd.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
        scriptAd.crossOrigin = "anonymous";
        document.head.appendChild(scriptAd);

        console.log("🚀 AdSense iniciado via Lazy Load.");
      }

      /* -----------------------------------------------------
         3) GATILHOS DE PERFORMANCE (A Mágica do PageSpeed)
         ----------------------------------------------------- */
      // Carrega Analytics imediatamente (é leve e respeita a config acima)
      loadAnalytics();

      // Carrega AdSense (pesado) apenas na interação do usuário
      function onUserInteraction() {
        loadAdSense();
        // Remove ouvintes para não rodar de novo
        window.removeEventListener('scroll', onUserInteraction);
        window.removeEventListener('mousemove', onUserInteraction);
        window.removeEventListener('touchstart', onUserInteraction);
      }

      // Se não estiver bloqueado, prepara o carregamento
      if (!adsBlocked) {
        // 1. Espera interação (scroll, mouse, toque)
        window.addEventListener('scroll', onUserInteraction, { passive: true });
        window.addEventListener('mousemove', onUserInteraction, { passive: true });
        window.addEventListener('touchstart', onUserInteraction, { passive: true });

        // 2. Fallback: Se usuário ficar parado 3.5s, carrega mesmo assim
        setTimeout(loadAdSense, 3500);
      }

      /* -----------------------------------------------------
         4) FUNÇÕES DE CONSENTIMENTO (Update)
         ----------------------------------------------------- */
      function applyConsent(consent) {
        gtag("consent", "update", consent);

        // Salva localmente
        try {
          localStorage.setItem("analytics_storage", consent.analytics_storage);
          localStorage.setItem("ad_storage", consent.ad_storage);
        } catch (e) { }

        // Se deu permissão de ads, libera o carregamento
        if (consent.ad_storage === "granted") {
          adsBlocked = false;
          loadAdSense(); // Carrega se ainda não carregou
        } else {
          adsBlocked = true;
          // Nota: O AdSense não tem função de "unload", teria que recarregar a página
          // para parar de exibir totalmente se já carregou, mas visualmente removemos abaixo.
        }
      }

      /* -----------------------------------------------------
         5) API GLOBAL E RESTAURAÇÃO
         ----------------------------------------------------- */
      window.acceptAllCookies = function () {
        localStorage.setItem("cookieConsent", "accepted");
        applyConsent({
          analytics_storage: "granted",
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted"
        });
      };

      window.rejectAllCookies = function () {
        localStorage.setItem("cookieConsent", "refused");
        applyConsent({
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied"
        });
        // Remove visualmente
        var ads = document.querySelectorAll('ins.adsbygoogle, .google-auto-placed');
        ads.forEach(function (ad) { ad.style.display = 'none'; ad.innerHTML = ''; });
      };

      window.applyGranularCookies = function (analyticsGranted, adsGranted) {
        localStorage.setItem("cookieConsent", "managed");
        var statusAnalytics = analyticsGranted ? "granted" : "denied";
        var statusAds = adsGranted ? "granted" : "denied";

        applyConsent({
          analytics_storage: statusAnalytics,
          ad_storage: statusAds,
          ad_user_data: statusAds,
          ad_personalization: statusAds
        });

        if (!adsGranted) {
          var ads = document.querySelectorAll('ins.adsbygoogle, .google-auto-placed');
          ads.forEach(function (ad) { ad.style.display = 'none'; ad.innerHTML = ''; });
        }
      };
    }
  </script>`;

// O bloco NOVO (Com G-8FLJ59XXDK como fonte principal e Lazy Load para PageSpeed)
const newCodeBlock = `<script>
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

// =============================================================================
// 🚀 LÓGICA DE REGEX E SUBSTITUIÇÃO
// =============================================================================

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Normaliza o bloco antigo para uma Regex que ignora variações de espaços/quebras
const normalizedOldPattern = oldCodeBlock
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(escapeRegExp)
    .join('\\s*');

const regexFinder = new RegExp(normalizedOldPattern, 'g');

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (regexFinder.test(content)) {
            const newContent = content.replace(regexFinder, newCodeBlock);
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✅ Atualizado: ${filePath}`);
            return true;
        }
    } catch (err) {
        console.error(`❌ Erro em ${filePath}:`, err.message);
    }
    return false;
}

// Execução recursiva simples nas pastas permitidas
let count = 0;
targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && !excludedFiles.includes(f));
    files.forEach(f => { if(processFile(path.join(dir, f))) count++; });
});

console.log(`-----------------------------------\n🏁 Fim! ${count} arquivos atualizados.`);