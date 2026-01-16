/**
 * replace-analytics-adsense.js
 * node replace-analytics-adsense.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

/* ===== CONFIGURAÇÃO ===== */

const LANG_DIRS = [
  "en","es","de","it","fr","hi","zh","ar","ja","ru","ko","tr","nl","pl","sv","id","vi","uk"
];

const BLOCKED_DIRS = ["downloads", "biblioteca"];

const BLOCKED_FILES = new Set([
  "downloads.html",
  "footer.html",
  "global-body-elements.html",
  "menu-global.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html"
]);

/* ===== NOVO SCRIPT ===== */

const NEW_SCRIPT = `
<script>
  /* =========================================================
     MODO ADMIN + GOOGLE TAG + CONSENT + ADSENSE (LAZY LOAD)
     (VERSÃO: APENAS G-8FLJ59XXDK + ADS)
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

      gtag("consent","default",{
        analytics_storage: aState,
        ad_storage: adState,
        ad_user_data: adState,
        ad_personalization: adState,
        wait_for_update: 500
      });

      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=G-8FLJ59XXDK";
      document.head.appendChild(s);

      gtag("js", new Date());
      gtag("config","G-8FLJ59XXDK");
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
</script>
`.trim();

/* ===== FUNÇÕES ===== */

function shouldProcess(filePath){
  const name = path.basename(filePath).toLowerCase();
  if (!name.endsWith(".html")) return false;
  if (BLOCKED_FILES.has(name)) return false;

  const rel = path.relative(ROOT, filePath);
  const parts = rel.split(path.sep);

  if (BLOCKED_DIRS.some(d => parts.includes(d))) return false;

  if (parts.length === 1) return true; // RAIZ

  return LANG_DIRS.includes(parts[0]);
}

function walk(dir){
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()){
      if (!BLOCKED_DIRS.includes(entry.name)) walk(full);
      continue;
    }

    if (!shouldProcess(full)) continue;

    let html = fs.readFileSync(full,"utf8");

    // 🔑 ÂNCORA REAL (AdSense client)
    const regex = /<script>[\s\S]*?adsbygoogle\.js\?client=ca-pub-6472730056006847[\s\S]*?<\/script>/i;

    if (regex.test(html)){
      html = html.replace(regex, NEW_SCRIPT + "\n");
      fs.writeFileSync(full, html, "utf8");
      console.log("✔ Atualizado:", path.relative(ROOT, full));
    }
  }
}

/* ===== EXECUÇÃO ===== */

console.log("🚀 Atualizando scripts (inclui RAIZ pt)...");
walk(ROOT);
console.log("✅ Finalizado.");
