"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const PAGES = [
  "perfil.html",
  "configuracoes.html",
  "favoritos.html",
  "historico.html",
  "assinatura.html",
  "login.html",
  "admin-pagamentos.html"
];
const LANGS = ["en","es","fr","it","de","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"];
const LOCALIZED_ACCOUNT_PAGES = ["perfil.html","configuracoes.html","favoritos.html","historico.html"];

function fail(message) {
  console.error("ACCOUNT PAGES TEST: FAIL");
  console.error(message);
  process.exit(1);
}

for (const file of PAGES) {
  const full = path.join(ROOT, "conta", file);
  if (!fs.existsSync(full)) fail(`${file}: arquivo ausente`);
  const html = fs.readFileSync(full, "utf8");

  for (const required of [
    'id="global-header-container"',
    'id="language-selector-placeholder"',
    'id="footer-placeholder"',
    'src="/global-scripts.js"',
    'src="/lang-selector.js"',
    '/public/output.css',
    '"/global-styles.css"'
  ]) {
    if (!html.includes(required)) fail(`${file}: componente canônico ausente: ${required}`);
  }

  const ids = new Set();
  for (const m of html.matchAll(/\bid=["']([^"']+)["']/g)) ids.add(m[1]);

  const missingRefs = new Set();
  for (const m of html.matchAll(/\$\(["']([^"']+)["']\)/g)) {
    if (!ids.has(m[1])) missingRefs.add(m[1]);
  }
  if (missingRefs.size) {
    fail(`${file}: referências JS sem elemento HTML: ${[...missingRefs].join(", ")}`);
  }

  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .map((m, i) => ({ attrs: m[1], source: m[2], index: i }))
    .filter(x => x.source.trim());

  for (const item of scripts) {
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(item.attrs)) continue;
    try {
      new vm.Script(item.source, { filename: `conta/${file}#inline-${item.index}` });
    } catch (error) {
      fail(`${file}: JavaScript inline inválido no bloco ${item.index}: ${error.message}`);
    }
  }
  if (LOCALIZED_ACCOUNT_PAGES.includes(file)) {
    if (!html.includes("__ENSURE_AUTH") && /window\.Auth\.init\(/.test(html)) {
      fail(`conta/${file}: ainda depende de Auth.init sem bootstrap canônico`);
    }
    if (/window\.Auth\.init\(\),\s*10000/.test(html)) {
      fail(`conta/${file}: timeout antigo de Auth ainda presente`);
    }
  }
}


for (const lang of LANGS) {
  for (const file of LOCALIZED_ACCOUNT_PAGES) {
    const full = path.join(ROOT, lang, "conta", file);
    if (!fs.existsSync(full)) fail(`${lang}/conta/${file}: arquivo localizado ausente`);
    const html = fs.readFileSync(full, "utf8");

    for (const required of [
      'id="global-header-container"',
      'id="footer-placeholder"',
      'src="/global-scripts.js"',
      'src="/lang-selector.js"'
    ]) {
      if (!html.includes(required)) fail(`${lang}/conta/${file}: componente canônico ausente: ${required}`);
    }

    if (/fetch\s*\(\s*["'][^"']*footer\.html["']/i.test(html)) {
      fail(`${lang}/conta/${file}: não deve carregar footer diretamente; global-scripts é a fonte única`);
    }
    if (/href=["'](?:\.\/)?global-body-elements\.html["']/i.test(html)) {
      fail(`${lang}/conta/${file}: prefetch relativo incorreto de global-body-elements`);
    }
    if (/<link\b[^>]*\brel=["']prefetch["'][^>]*href=["']\/global-body-elements\.html["']/i.test(html)) {
      fail(`${lang}/conta/${file}: prefetch aponta para global-body PT em vez do idioma`);
    }
    if (/<link\b[^>]*\brel=["']prefetch["'][^>]*href=["']\/footer\.html["']/i.test(html)) {
      fail(`${lang}/conta/${file}: prefetch aponta para footer PT em vez do idioma`);
    }
    if (!html.includes("__ENSURE_AUTH") && /window\.Auth\.init\(/.test(html)) {
      fail(`${lang}/conta/${file}: ainda depende de Auth.init sem bootstrap canônico`);
    }
    if (/window\.Auth\.init\(\),\s*10000/.test(html)) {
      fail(`${lang}/conta/${file}: timeout antigo de Auth ainda presente`);
    }
    if (/location\.replace\(["']\/conta\/login\.html\?returnUrl=/.test(html)) {
      fail(`${lang}/conta/${file}: redirect de login perde helper canônico/idioma`);
    }

    const shadows = html.indexOf('<style id="conta-card-shadows">');
    const professional = html.indexOf('<style id="perfil-professional-ui">', shadows);
    const close = shadows >= 0 ? html.indexOf("</style>", shadows) : -1;
    if (shadows >= 0 && professional >= 0 && (close < 0 || professional < close)) {
      fail(`${lang}/conta/${file}: bloco style aninhado/malformado`);
    }
  }

  for (const component of ["menu-global.html","global-body-elements.html","footer.html"]) {
    if (!fs.existsSync(path.join(ROOT, lang, component))) {
      fail(`${lang}: componente global localizado ausente: ${component}`);
    }
  }
}

const langSelector = fs.readFileSync(path.join(ROOT, "lang-selector.js"), "utf8");
for (const required of [
  "const accountMatch = pathName.match(",
  '"/conta/" + accountFileName',
  '"/" + targetLang + "/conta/" + accountFileName'
]) {
  if (!langSelector.includes(required)) fail(`lang-selector.js: roteamento de conta localizada ausente: ${required}`);
}
if (langSelector.includes('const isAccountPage = pathName.indexOf("/conta/") === 0')) {
  fail("lang-selector.js: detector antigo root-only de conta ainda presente.");
}

const authUi = fs.readFileSync(path.join(ROOT, "js", "auth", "auth-ui.js"), "utf8");
if (authUi.includes('normalizedReturn.indexOf("/conta/") === 0')) {
  fail("auth-ui.js: retorno de login ainda usa detector root-only de conta.");
}
for (const required of [
  'normalizedReturn === "/conta/assinatura.html"',
  'sessionStorage.setItem("billing_login_completed"'
]) {
  if (!authUi.includes(required)) fail(`auth-ui.js: retorno canônico da assinatura sem rastreabilidade: ${required}`);
}
for (const lang of LANGS) {
  if (authUi.includes('normalizedReturn === "/' + lang + '/conta/assinatura.html"')) {
    fail(`auth-ui.js: não deve criar rota secundária de assinatura em ${lang}.`);
  }
}
const premiumBanner = fs.readFileSync(path.join(ROOT, "js", "access", "premium-banner-manager.js"), "utf8");
if (premiumBanner.includes('window.location.pathname || "").indexOf("/conta/") === 0')) {
  fail("premium-banner-manager.js: detector root-only ainda permite promo na conta localizada.");
}
const accountLangSelector = fs.readFileSync(path.join(ROOT, "lang-selector.js"), "utf8");
if (!accountLangSelector.includes("const pathMatch = (window.location.pathname || \"\").match(")) {
  fail("lang-selector.js: idioma da conta não possui fallback pelo path localizado.");
}

const routeLocalizer = fs.readFileSync(path.join(ROOT, "js", "access", "route-localizer.js"), "utf8");
if (routeLocalizer.includes("max-width:86px!important")) {
  fail("route-localizer.js: hotfix antigo ainda comprime o menu global da conta.");
}
for (const required of [
  "#global-header-container .header-content{max-width:none!important",
  "#global-header-container .desktop-nav>ul",
  "@media(max-width:1180px)"
]) {
  if (!routeLocalizer.includes(required)) fail(`route-localizer.js: correção responsiva do menu de conta ausente: ${required}`);
}

const globalScripts = fs.readFileSync(path.join(ROOT, "global-scripts.js"), "utf8");
if (!globalScripts.includes("__ACCOUNT_AUTH_BOOTSTRAP_PROMISE")) {
  fail("global-scripts.js: bootstrap antecipado da sessão na área de conta ausente.");
}

const subscriptionPage = fs.readFileSync(path.join(ROOT, "conta", "assinatura.html"), "utf8");
for (const eventName of [
  "subscription_page_view",
  "subscription_login_required",
  "subscription_login_completed",
  "subscription_checkout_click",
  "subscription_checkout_request",
  "subscription_checkout_created",
  "subscription_checkout_redirect",
  "subscription_checkout_error",
  "subscription_page_error"
]) {
  if (!subscriptionPage.includes(eventName)) fail(`conta/assinatura.html: evento do funil ausente: ${eventName}`);
}

const asaasCheckout = fs.readFileSync(path.join(ROOT, "supabase", "functions", "asaas-checkout", "index.ts"), "utf8");
for (const required of [
  "provider_subscription_linked",
  "asaas_customer_id",
  'trace("checkout_created"',
  'trace("checkout_error"'
]) {
  if (!asaasCheckout.includes(required)) fail(`asaas-checkout: identificador/rastreabilidade ausente: ${required}`);
}

const asaasWebhook = fs.readFileSync(path.join(ROOT, "supabase", "functions", "asaas-webhook", "index.ts"), "utf8");
for (const required of [
  "findSubByCustomerIdentity",
  'strategy:"asaas_customer_email"',
  'trace("webhook_correlation_recovered"',
  'trace("webhook_orphan"',
  'trace("webhook_processed"',
  'trace("webhook_error"'
]) {
  if (!asaasWebhook.includes(required)) fail(`asaas-webhook: correlação/rastreabilidade ausente: ${required}`);
}

const notFound = fs.readFileSync(path.join(ROOT, "404.html"), "utf8");
for (const required of [
  "(perfil|configuracoes|favoritos|historico)",
  '"/conta/"+match[2].toLowerCase()+".html"',
  "window.location.replace(target)"
]) {
  if (!notFound.includes(required)) fail(`404.html: fallback de rota antiga de conta ausente: ${required}`);
}

const authCore = fs.readFileSync(path.join(ROOT, "js", "auth", "auth-core.js"), "utf8");
if (!authCore.includes("function ensureFirebaseInit()")) {
  fail("auth-core.js: bootstrap cooperativo de Firebase ausente.");
}

const config = fs.readFileSync(path.join(ROOT, "conta", "configuracoes.html"), "utf8");
for (const required of [
  'id="btn-save-professional"',
  'id="btn-save-settings"',
  'id="btn-save-all"',
  "function scheduleAutosave",
  "function saveLocalDraft",
  "function restoreLocalDraft",
  'req("PATCH",{metadata:metadata,preferences:preferences})'
]) {
  if (!config.includes(required)) fail(`configuracoes.html: persistência obrigatória ausente: ${required}`);
}

const profile = fs.readFileSync(path.join(ROOT, "conta", "perfil.html"), "utf8");
for (const required of [
  "function professionalData",
  "institution:String(m.institution",
  "course:String(m.course",
  "city:String(m.city",
  "state:String(m.state",
  "function durationParts(value)",
  "function durationFromDate(value)",
  "function renderCareer()",
  "metadata.professional"
]) {
  if (!profile.includes(required)) fail(`perfil.html: sincronização profissional ausente: ${required}`);
}

const banner = fs.readFileSync(path.join(ROOT, "js", "access", "premium-banner-manager.js"), "utf8");
for (const required of [
  "var DISPLAY_MS = 20000;",
  "var INTERVAL_MS = 2 * 60 * 1000;",
  "mountSubscriptionPromo();",
  '"/conta/assinatura.html?lang=" + lang',
  'data-premium-promo-close'
]) {
  if (!banner.includes(required)) fail(`premium-banner-manager.js: regra do banner ausente: ${required}`);
}
const mountStart = banner.indexOf("function mount(opts)");
const mountEnd = banner.indexOf("function unmount()", mountStart);
if (mountStart < 0 || mountEnd < 0) fail("premium-banner-manager.js: função mount ausente.");
const mountBody = banner.slice(mountStart, mountEnd);
if (mountBody.includes("root.innerHTML") || mountBody.includes("premiumCard(")) {
  fail("premium-banner-manager.js: o mount ainda injeta o antigo card global.");
}

console.log("ACCOUNT PAGES TEST: PASS — estrutura, referências, scripts, persistência e banner verificados.");
require("./test-premium-promo.js");
