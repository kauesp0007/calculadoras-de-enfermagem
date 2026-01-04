const fs = require('fs');
const path = require('path');

// =============================================================================
// ⚙️ CONFIGURAÇÕES
// =============================================================================

// 1. Pastas permitidas para atualização
const targetDirs = [
    '.', // Raiz
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// 2. Arquivos e pastas a IGNORAR completamente
const excludedFiles = [
    'downloads.html',
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    '_language_selector.html',
    'sw.js',
    'package.json',
    'package-lock.json',
    'googlefc0a17cdd552164b.html'
];

const excludedFolders = [
    'biblioteca',
    'downloads',
    'node_modules',
    '.git',
    '.vscode'
];

// =============================================================================
// 📝 BLOCOS DE CÓDIGO
// =============================================================================

// O bloco ANTIGO (Script OPT-OUT atual do seu site)
const oldCodeBlock = `<script>
    /* =========================================================
       MODO ADMIN + GOOGLE TAG + CONSENT + ADSENSE
       (VERSÃO OPT-OUT: Carrega anúncios por padrão)
       ========================================================= */

    // 🛡️ MODO ADMIN — bloqueia tudo
    if (localStorage.getItem('admin_mode') === 'true') {
      console.log('🚧 Modo Admin: Analytics e AdSense NÃO foram carregados.');
    } else {

      // 0) VERIFICAÇÃO INICIAL (Novo)
      var savedConsent = localStorage.getItem("cookieConsent");
      var isRefused = (savedConsent === "refused");

      // Proteções globais
      window.__metricsLoaded = window.__metricsLoaded || false;
      window.__adsenseLoaded = window.__adsenseLoaded || false;

      /* -----------------------------------------------------
          1) GOOGLE TAG (gtag.js)
          ----------------------------------------------------- */
      if (!window.__metricsLoaded) {
        window.__metricsLoaded = true;

        var scriptGA = document.createElement('script');
        scriptGA.async = true;
        // 💡 MELHORIA: Carregar direto da origem do Analytics (G-...) em vez do Ads (AW-...)
        // Usei o ID G-VVDP5JGEX8 que está no seu print como "Site Principal".
        // Se você tiver certeza que quer usar o antigo (G-8FLJ...), mantenha o antigo, mas recomendo o do print.
        scriptGA.src = "https://www.googletagmanager.com/gtag/js?id=G-VVDP5JGEX8";
        document.head.appendChild(scriptGA);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        window.gtag = window.gtag || gtag;

        // Definir consentimento ANTES de iniciar a config
        if (isRefused) {
          gtag("consent", "default", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",        // Novo parâmetro v2
            ad_personalization: "denied",  // Novo parâmetro v2
            wait_for_update: 500
          });
        } else {
          gtag("consent", "default", {
            analytics_storage: "granted",
            ad_storage: "granted",
            ad_user_data: "granted",
            ad_personalization: "granted",
            wait_for_update: 500
          });
        }

        gtag("js", new Date());

        // Configuração dos IDs
        gtag("config", "G-VVDP5JGEX8"); // ⚡ Atualizado para o ID do "Site Principal"
        gtag("config", "AW-952633102"); // Google Ads (Mantido)
      }

      /* -----------------------------------------------------
          2) FUNÇÃO INTERNA: carrega AdSense uma única vez
          ----------------------------------------------------- */
      function loadAdSenseOnce() {
        if (window.__adsenseLoaded) return;
        window.__adsenseLoaded = true;

        var scriptAd = document.createElement('script');
        scriptAd.async = true;
        scriptAd.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
        scriptAd.crossOrigin = "anonymous";
        document.head.appendChild(scriptAd);

        console.log("🟢 AdSense carregado (Modo Opt-out).");
      }

      // ⚡ MUDANÇA: Se não estiver recusado, carrega ANÚNCIOS IMEDIATAMENTE
      if (!isRefused) {
        loadAdSenseOnce();
      }

      /* -----------------------------------------------------
          3) FUNÇÃO CENTRAL DE CONSENTIMENTO
          ----------------------------------------------------- */
      function applyConsent(consent) {
        if (typeof window.gtag === "function") {
          gtag("consent", "update", consent);
        }
        if (consent && consent.ad_storage === "granted") {
          loadAdSenseOnce();
        }
        try {
          localStorage.setItem("analytics_storage", consent.analytics_storage);
          localStorage.setItem("ad_storage", consent.ad_storage);
        } catch (e) { }
      }

      /* -----------------------------------------------------
          4) REAPLICA CONSENTIMENTO AO ENTRAR NA PÁGINA
          ----------------------------------------------------- */
      (function restoreConsent() {
        try {
          const saved = localStorage.getItem("cookieConsent");
          if (saved === "accepted") {
            applyConsent({ analytics_storage: "granted", ad_storage: "granted" });
          }
          if (saved === "refused") {
            applyConsent({ analytics_storage: "denied", ad_storage: "denied" });
          }
          if (saved === "managed") {
            applyConsent({
              analytics_storage: localStorage.getItem("analytics_storage") || "denied",
              ad_storage: localStorage.getItem("ad_storage") || "denied"
            });
          }
        } catch (e) { }
      })();

      /* -----------------------------------------------------
          5) API GLOBAL PARA O BANNER DE COOKIES
          ----------------------------------------------------- */
      window.acceptAllCookies = function () {
        localStorage.setItem("cookieConsent", "accepted");
        applyConsent({ analytics_storage: "granted", ad_storage: "granted" });
      };

      window.rejectAllCookies = function () {
        localStorage.setItem("cookieConsent", "refused");
        applyConsent({ analytics_storage: "denied", ad_storage: "denied" });
        // Remove visualmente
        var ads = document.querySelectorAll('ins.adsbygoogle, .google-auto-placed');
        ads.forEach(function (ad) { ad.style.display = 'none'; ad.innerHTML = ''; });
        console.log("🔴 Consentimento revogado e anúncios ocultados.");
      };

      window.applyGranularCookies = function (analyticsGranted, adsGranted) {
        localStorage.setItem("cookieConsent", "managed");
        applyConsent({
          analytics_storage: analyticsGranted ? "granted" : "denied",
          ad_storage: adsGranted ? "granted" : "denied"
        });
        if (!adsGranted) {
          var ads = document.querySelectorAll('ins.adsbygoogle, .google-auto-placed');
          ads.forEach(function (ad) { ad.style.display = 'none'; ad.innerHTML = ''; });
        }
      };
    }
  </script>`;

// O bloco NOVO (Script Otimizado com Lazy Load)
const newCodeBlock = `<script>
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
        window.addEventListener('scroll', onUserInteraction, {passive: true});
        window.addEventListener('mousemove', onUserInteraction, {passive: true});
        window.addEventListener('touchstart', onUserInteraction, {passive: true});

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
        } catch (e) {}

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

// =============================================================================
// 🚀 LÓGICA DO SCRIPT
// =============================================================================

// Função auxiliar para escapar caracteres especiais de Regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Cria uma Regex flexível a partir do bloco de código antigo
// Transforma qualquer sequência de espaços/quebras de linha em \s+
const normalizedOldCodePattern = oldCodeBlock
    .split(/\r?\n/) // Divide por linhas
    .map(line => line.trim()) // Remove espaços nas pontas de cada linha
    .filter(line => line.length > 0) // Remove linhas vazias
    .map(escapeRegExp) // Escapa caracteres regex
    .join('\\s+'); // Junta tudo permitindo qualquer espaço em branco entre as linhas

const regexFinder = new RegExp(normalizedOldCodePattern, 'g');

let totalFilesProcessed = 0;
let totalFilesUpdated = 0;
let totalErrors = 0;

function processDirectory(dir) {
    // Verificar se a pasta existe
    if (!fs.existsSync(dir)) {
        console.log(`⚠️  Pasta não encontrada (pulando): ${dir}`);
        return;
    }

    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        // Se for diretório, não entramos recursivamente a menos que esteja na lista targetDirs
        // Mas como targetDirs já lista as pastas explicitamente, nós só processamos arquivos na raiz do dir atual.

        if (stat.isFile()) {
            // Verifica extensão .html
            if (!item.endsWith('.html')) return;

            // Verifica exclusões
            if (excludedFiles.includes(item)) return;

            processFile(fullPath);
        }
    });
}

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Verifica se o arquivo tem o código antigo
        // O match é feito usando a regex flexível
        if (regexFinder.test(content)) {
            // Realiza a substituição
            // Nota: Como a regex consome espaços variados, a substituição direta é segura
            const newContent = content.replace(regexFinder, newCodeBlock);

            if (newContent !== content) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`✅ Atualizado: ${filePath}`);
                totalFilesUpdated++;
            } else {
                console.log(`ℹ️  Nada mudou (match falhou na substituição): ${filePath}`);
            }
        } else {
            // Opcional: Descomente para ver arquivos que não tinham o código antigo
            // console.log(`⚪ Ignorado (código antigo não encontrado): ${filePath}`);
        }

        totalFilesProcessed++;
    } catch (err) {
        console.error(`❌ Erro ao processar ${filePath}:`, err.message);
        totalErrors++;
    }
}

// =============================================================================
// ▶️ EXECUÇÃO
// =============================================================================

console.log("🚀 Iniciando atualização de Tags do Google Analytics/Ads...");
console.log("---------------------------------------------------------");

targetDirs.forEach(dir => {
    // Proteção extra: não processar pastas excluídas se elas estiverem em targetDirs por engano
    if (excludedFolders.includes(dir)) return;

    processDirectory(dir);
});

console.log("---------------------------------------------------------");
console.log("🏁 Concluído!");
console.log(`📂 Arquivos analisados: ${totalFilesProcessed}`);
console.log(`✅ Arquivos atualizados: ${totalFilesUpdated}`);
console.log(`❌ Erros: ${totalErrors}`);

if (totalFilesUpdated === 0) {
    console.log("\n⚠️  AVISO: Nenhum arquivo foi atualizado. Possíveis motivos:");
    console.log("1. O código antigo já foi removido.");
    console.log("2. A indentação do código nos arquivos é muito diferente da string de busca.");
    console.log("3. Você já rodou este script antes.");
}