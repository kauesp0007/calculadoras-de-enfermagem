const fs = require('fs');
const path = require('path');

// ==============================================================================
// CONFIGURAÇÕES E DADOS
// ==============================================================================

// Diretórios de idiomas a serem verificados (além da raiz)
const targetFolders = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Pastas a serem ignoradas completamente
const excludedFolders = ['downloads', 'biblioteca', 'node_modules', '.git', 'img', 'docs', 'videos', 'css', 'js'];

// Arquivos específicos a serem ignorados (conforme suas regras de memória)
const excludedFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// ==============================================================================
// BLOCOS DE CÓDIGO (LITERAIS)
// ==============================================================================

// REGEX PARA IDENTIFICAR O BLOCO ANTIGO (A versão G-VVDP5JGEX8)
// Procura pela tag <script>, o cabeçalho específico da versão anterior
// e vai até o fechamento </script> desse bloco.
const oldCodeRegex = /<script>\s*\/\*\s*={10,}[\s\S]*?\(VERSÃO ATUALIZADA: G-VVDP5JGEX8 \+ OUTROS GA4 \+ ADS \+ ADSENSE\)[\s\S]*?={10,}\s*\*\/[\s\S]*?<\/script>/;

// O NOVO BLOCO DE CÓDIGO (Exatamente como fornecido, versão G-PFM06B7TS5)
const newCodeBlock = `<script>
/* =========================================================
   MODO ADMIN + GOOGLE TAG + CONSENT + ADSENSE (LAZY LOAD)
   (VERSÃO ATUALIZADA: G-PFM06B7TS5 + OUTROS GA4 + ADS + ADSENSE)
   ========================================================= */

if (
  localStorage.getItem('admin_mode') === 'true' ||
  new URLSearchParams(window.location.search).get('admin') === '1'
) {
  console.log('🚧 Modo Admin: Bloqueado.');
  if (new URLSearchParams(window.location.search).get('admin') === '1') {
    localStorage.setItem('admin_mode','true');
  }
} else {
  var savedConsent = localStorage.getItem("cookieConsent");
  var isRefused = (savedConsent === "refused");
  var isManaged = (savedConsent === "managed");
  var adsBlocked = isRefused || (isManaged && localStorage.getItem("ad_storage") === "denied");

  window.__metricsLoaded = false;
  window.__adsenseLoaded = false;
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;

  function loadAnalytics() {
    if (window.__metricsLoaded) return;
    window.__metricsLoaded = true;

    var aState = isRefused ? "denied" : (localStorage.getItem("analytics_storage") || "granted");
    var adState = adsBlocked ? "denied" : "granted";

    /* ✅ Ajuste essencial: carrega o gtag.js o mais cedo possível */
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=G-PFM06B7TS5";
    document.head.appendChild(s);

    /* ✅ Consent default antes de qualquer config */
    gtag("consent","default",{
      analytics_storage: aState,
      ad_storage: adState,
      ad_user_data: adState,
      ad_personalization: adState,
      wait_for_update: 500
    });

    gtag("js", new Date());

    /* GA4 (múltiplas propriedades/destinos) */
    gtag("config","G-PFM06B7TS5");

    /* Google Ads */
    gtag("config","AW-952633102");
  }

  function loadAdSenseOnce() {
    if (window.__adsenseLoaded || adsBlocked) return;
    window.__adsenseLoaded = true;
    var ad = document.createElement("script");
    ad.async = true;
    ad.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
    ad.crossOrigin = "anonymous";
    document.head.appendChild(ad);
  }

  loadAnalytics();

  function onUserInteraction(){
    loadAdSenseOnce();
    window.removeEventListener("scroll", onUserInteraction);
    window.removeEventListener("mousemove", onUserInteraction);
    window.removeEventListener("touchstart", onUserInteraction);
  }

  if (!adsBlocked){
    window.addEventListener("scroll", onUserInteraction, {passive:true});
    window.addEventListener("mousemove", onUserInteraction, {passive:true});
    window.addEventListener("touchstart", onUserInteraction, {passive:true});
    setTimeout(loadAdSenseOnce, 3500);
  }

  function applyConsent(consent){
    gtag("consent","update", consent);
    if (consent.ad_storage === "granted"){
      adsBlocked = false;
      loadAdSenseOnce();
    } else {
      adsBlocked = true;
      document.querySelectorAll("ins.adsbygoogle, .google-auto-placed")
        .forEach(ad => { ad.style.display="none"; ad.innerHTML=""; });
    }
    localStorage.setItem("analytics_storage", consent.analytics_storage);
    localStorage.setItem("ad_storage", consent.ad_storage);
  }

  window.acceptAllCookies = function(){
    localStorage.setItem("cookieConsent","accepted");
    applyConsent({
      analytics_storage:"granted",
      ad_storage:"granted",
      ad_user_data:"granted",
      ad_personalization:"granted"
    });
  };

  window.rejectAllCookies = function(){
    localStorage.setItem("cookieConsent","refused");
    applyConsent({
      analytics_storage:"denied",
      ad_storage:"denied",
      ad_user_data:"denied",
      ad_personalization:"denied"
    });
  };
}
</script>`;

// ==============================================================================
// LÓGICA DE PROCESSAMENTO
// ==============================================================================

let stats = {
    processed: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    notModifiedList: []
};

function processFile(filePath) {
    const fileName = path.basename(filePath);

    // Verificações de exclusão de arquivo
    if (!fileName.endsWith('.html')) return;
    if (excludedFiles.includes(fileName)) return;

    stats.processed++;

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Verifica se o arquivo tem o bloco antigo
        if (oldCodeRegex.test(content)) {
            // Realiza a substituição exata
            const newContent = content.replace(oldCodeRegex, newCodeBlock);
            fs.writeFileSync(filePath, newContent, 'utf8');
            stats.updated++;
        } else {
            // Se não achou o antigo, verificamos o motivo para o log
            if (content.includes('G-PFM06B7TS5')) {
                stats.notModifiedList.push(`${filePath} (Já atualizado anteriormente)`);
            } else {
                stats.notModifiedList.push(`${filePath} (Bloco antigo não encontrado ou padrão diferente)`);
            }
            stats.unchanged++;
        }
    } catch (err) {
        console.error(`Erro ao processar ${filePath}: ${err.message}`);
        stats.errors++;
    }
}

function traverseDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Se for diretório, verificar se é um dos idiomas alvo
            // E garantir que NÃO é uma pasta excluída
            if (targetFolders.includes(item) && !excludedFolders.includes(item)) {
                // Processa recursivamente a pasta do idioma
                traverseLanguageFolder(fullPath);
            }
        } else {
            // Se for arquivo na raiz
            if (dir === '.' || dir === './') {
                processFile(fullPath);
            }
        }
    });
}

function traverseLanguageFolder(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        // Não entra em subpastas dentro dos idiomas (ex: en/img ou en/downloads não devem ser tocadas se existirem)
        // Apenas processa arquivos HTML na raiz da pasta do idioma
        if (!stat.isDirectory()) {
            processFile(fullPath);
        }
    });
}

// ==============================================================================
// EXECUÇÃO
// ==============================================================================

console.log('🚀 Iniciando atualização das Tags (Ads/Analytics/AdSense)...');
console.log('-------------------------------------------------------------');

// 1. Processa a raiz
const rootItems = fs.readdirSync('.');
rootItems.forEach(item => {
    const fullPath = path.join('.', item);
    const stat = fs.statSync(fullPath);

    if (stat.isFile()) {
        processFile(fullPath);
    } else if (stat.isDirectory() && targetFolders.includes(item)) {
        // 2. Processa as pastas de idioma
        traverseLanguageFolder(fullPath);
    }
});

// ==============================================================================
// RELATÓRIO FINAL
// ==============================================================================

console.log('\n================ RESUMO DA OPERAÇÃO ================');
console.log(`📂 Arquivos analisados: ${stats.processed}`);
console.log(`✅ Arquivos atualizados: ${stats.updated}`);
console.log(`zzz Arquivos não modificados: ${stats.unchanged}`);
console.log(`❌ Erros de leitura/escrita: ${stats.errors}`);

if (stats.notModifiedList.length > 0) {
    console.log('\n📄 Lista de arquivos NÃO modificados (Amostra):');
    stats.notModifiedList.slice(0, 10).forEach(f => console.log(` - ${f}`));
    if (stats.notModifiedList.length > 10) {
        console.log(`   ... e mais ${stats.notModifiedList.length - 10} arquivos.`);
    }
}

console.log('====================================================');