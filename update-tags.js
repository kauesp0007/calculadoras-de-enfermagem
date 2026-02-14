const fs = require('fs');
const path = require('path');

/**
 * CONFIGURAÇÕES DE ALVOS E EXCLUSÕES
 */
const idiomas = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const pastasExcluidas = ['downloads', 'biblioteca', 'node_modules', '.git', 'public', 'src', 'img', 'docs', 'videos'];
const arquivosExcluidos = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

/**
 * BLOCO NOVO (OTIMIZADO - LAZY LOAD TOTAL)
 */
const novoBlocoTags = `<script>
/* =========================================================
   MODO ADMIN + GOOGLE TAG + CONSENT + ADSENSE (LAZY LOAD TOTAL)
   (VERSÃO ATUALIZADA: G-PFM06B7TS5 PRINCIPAL + OUTROS GA4 + 2 AW + ADSENSE)
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

    /* ✅ Carrega o gtag.js do GA4 principal TS5 */
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=G-PFM06B7TS5";
    document.head.appendChild(s);

    /* ✅ Configura consentimento default antes de qualquer config */
    gtag("consent","default",{
      analytics_storage: aState,
      ad_storage: adState,
      ad_user_data: adState,
      ad_personalization: adState,
      wait_for_update: 500
    });

    gtag("js", new Date());

    /* GA4 (múltiplas propriedades/destinos) */
    gtag("config","G-PFM06B7TS5");    // TAG PRINCIPAL
    gtag("config","G-MJDKPDPJ26");
    gtag("config","G-M7DHHF38EJ");
    gtag("config","G-8FLJ59XXDK");
    gtag("config","G-VVDP5JGEX8");
    gtag("config","G-EX8");

    /* Google Ads - mantém as duas tags */
    gtag("config","AW-952633102");
    gtag("config","AW-9277197961");

    console.log("📈 Analytics carregado via Lazy Load.");
  }

  function loadAdSenseOnce() {
    if (window.__adsenseLoaded || adsBlocked) return;
    window.__adsenseLoaded = true;
    var ad = document.createElement("script");
    ad.async = true;
    ad.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
    ad.crossOrigin = "anonymous";
    document.head.appendChild(ad);
    console.log("💰 AdSense carregado via Lazy Load.");
  }

  // --- FUNÇÃO DE CARREGAMENTO UNIFICADO (LAZY LOAD TOTAL) ---
  function onUserInteraction(){
    loadAnalytics(); // Agora o Analytics só carrega aqui
    loadAdSenseOnce();

    // Remove os ouvintes para garantir execução única
    window.removeEventListener("scroll", onUserInteraction);
    window.removeEventListener("mousemove", onUserInteraction);
    window.removeEventListener("touchstart", onUserInteraction);
    window.removeEventListener("keydown", onUserInteraction);
  }

  // Se não estiver bloqueado, aguarda interação ou tempo limite (fallback)
  if (!adsBlocked){
    window.addEventListener("scroll", onUserInteraction, {passive:true});
    window.addEventListener("mousemove", onUserInteraction, {passive:true});
    window.addEventListener("touchstart", onUserInteraction, {passive:true});
    window.addEventListener("keydown", onUserInteraction, {passive:true});

    // Fallback: Se o usuário não interagir, carrega tudo após 4 segundos
    setTimeout(onUserInteraction, 4000);
  }

  function applyConsent(consent){
    gtag("consent","update", consent);
    if (consent.ad_storage === "granted"){
      adsBlocked = false;
      onUserInteraction(); // Tenta carregar tudo se o consentimento for dado
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

/**
 * REGEX PARA IDENTIFICAR O BLOCO ANTIGO
 * Procura por um bloco <script> que contenha o cabeçalho "LAZY LOAD" sem o termo "TOTAL"
 */
const regexBlocoAntigo = /<script>[\s\S]*?MODO ADMIN \+ GOOGLE TAG \+ CONSENT \+ ADSENSE \(LAZY LOAD\)[\s\S]*?<\/script>/g;

let arquivosAlterados = 0;
let arquivosNaoAlterados = [];

function processarArquivo(filePath) {
    const fileName = path.basename(filePath);

    // Verificação de arquivos excluídos
    if (arquivosExcluidos.includes(fileName)) {
        arquivosNaoAlterados.push({ arquivo: filePath, motivo: "Arquivo protegido na lista de exclusão" });
        return;
    }

    // Apenas arquivos HTML
    if (path.extname(filePath) !== '.html') {
        return;
    }

    try {
        let conteudo = fs.readFileSync(filePath, 'utf8');

        if (conteudo.match(regexBlocoAntigo)) {
            const novoConteudo = conteudo.replace(regexBlocoAntigo, novoBlocoTags);
            fs.writeFileSync(filePath, novoConteudo, 'utf8');
            arquivosAlterados++;
        } else {
            // Verifica se já está atualizado para não logar como erro
            if (conteudo.includes('LAZY LOAD TOTAL')) {
                arquivosNaoAlterados.push({ arquivo: filePath, motivo: "Já atualizado (Lazy Load Total encontrado)" });
            } else {
                arquivosNaoAlterados.push({ arquivo: filePath, motivo: "Bloco de script antigo não localizado" });
            }
        }
    } catch (err) {
        console.error(`Erro ao processar ${filePath}:`, err);
    }
}

function varrerRepositorio(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Se for uma pasta de idioma ou a raiz, e não estiver na lista de exclusão
            if (!pastasExcluidas.includes(file)) {
                varrerRepositorio(fullPath);
            }
        } else {
            processarArquivo(fullPath);
        }
    });
}

// Início da execução
console.log("🚀 Iniciando varredura para atualização de tags...");

// 1. Processa a raiz
const arquivosRaiz = fs.readdirSync('.');
arquivosRaiz.forEach(file => {
    const fullPath = path.join('.', file);
    if (fs.statSync(fullPath).isFile()) {
        processarArquivo(fullPath);
    }
});

// 2. Processa as pastas de idiomas
idiomas.forEach(idioma => {
    const pastaIdioma = path.join('.', idioma);
    if (fs.existsSync(pastaIdioma)) {
        varrerRepositorio(pastaIdioma);
    }
});

// LOG FINAL
console.log("\n====================================================");
console.log("📊 RELATÓRIO DE ATUALIZAÇÃO");
console.log(`✅ Arquivos modificados: ${arquivosAlterados}`);
console.log(`ℹ️  Arquivos não modificados: ${arquivosNaoAlterados.length}`);
console.log("====================================================\n");

if (arquivosNaoAlterados.length > 0) {
    console.log("DETALHES DOS ARQUIVOS NÃO MODIFICADOS:");
    arquivosNaoAlterados.forEach(item => {
        console.log(`- ${item.arquivo}: ${item.motivo}`);
    });
}