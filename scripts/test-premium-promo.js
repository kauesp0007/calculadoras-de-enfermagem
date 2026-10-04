"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM, VirtualConsole } = require("jsdom");

const source = fs.readFileSync(path.join(__dirname, "../js/access/premium-banner-manager.js"), "utf8");

function scenario(pathname, initialPlan = "guest", premiumRoute = false, lastShownAt = null) {
  const dom = new JSDOM('<!doctype html><html><body><div id="global-header-container"></div></body></html>', {
    url: "https://www.calculadorasdeenfermagem.com.br" + pathname,
    runScripts: "outside-only"
  });
  const { window } = dom;
  const timers = new Map();
  let nextId = 0;
  let now = 1_000_000;
  let onAuthChange = null;
  let onProfileChange = null;
  let plan = initialPlan;

  window.Date.now = () => now;
  window.__IS_PREMIUM_ROUTE = premiumRoute;
  if (lastShownAt !== null) {
    window.localStorage.setItem("premiumPromoLastShownAt", String(lastShownAt));
  }
  window.setTimeout = (callback, delay) => {
    const id = ++nextId;
    timers.set(id, { callback, at: now + Number(delay) });
    return id;
  };
  window.clearTimeout = id => timers.delete(id);
  window.requestAnimationFrame = callback => callback();
  window.Auth = {
    isInitialized: () => true,
    currentUser: () => plan === "guest" ? null : { uid: "test-user" },
    billingStatus: () => ({ resolved: plan !== "pending", unavailable: plan === "unavailable", plan }),
    hasPlan: () => plan === "premium",
    onAuthChange: listener => { onAuthChange = listener; },
    onProfileChange: listener => { onProfileChange = listener; }
  };
  window.eval(source);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  window.AccessModules.bannerManager.mount();

  function advance(ms) {
    const end = now + ms;
    for (let i = 0; i < 50; i++) {
      const due = [...timers.entries()].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      now = due[1].at;
      timers.delete(due[0]);
      due[1].callback();
    }
    now = end;
  }

  return {
    window, advance,
    setPlan: (nextPlan, event = "profile") => {
      plan = nextPlan;
      if (event === "auth" && onAuthChange) onAuthChange();
      if (event === "profile" && onProfileChange) onProfileChange();
    },
    close: () => window.close()
  };
}

for (const pathname of ["/blog/index.html", "/conta/perfil.html", "/en/conta/perfil.html"]) {
  const test = scenario(pathname);
  try {
    const root = test.window.document.getElementById("premium-promo-banner");
    assert.ok(root, pathname + " promo missing");
    assert.equal(root.getAttribute("lang"), pathname.startsWith("/en/") ? "en" : "pt-BR");
  } finally { test.close(); }
}
const unsupported = scenario("/xx/index.html");
assert.equal(unsupported.window.document.getElementById("premium-promo-banner").getAttribute("lang"), "pt-BR");
unsupported.close();

const euroLanguages = new Set(["es", "de", "it", "fr", "ru", "tr", "nl", "pl", "sv", "uk"]);
const internationalLanguages = ["en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];
const subscriptionPage = fs.readFileSync(path.join(__dirname, "../conta/assinatura.html"), "utf8");
const stripeCheckout = fs.readFileSync(path.join(__dirname, "../supabase/functions/stripe-checkout/index.ts"), "utf8");
function languageSet(source, expression) {
  const match = source.match(expression);
  assert.ok(match, "currency list missing from checkout");
  return [...match[1].matchAll(/"([a-z]{2})"/g)].map(result => result[1]).sort();
}
const expectedEur = [...euroLanguages].sort();
assert.deepEqual(languageSet(source, /var EUR_LANGS = \[([^\]]+)\]/), expectedEur);
assert.deepEqual(languageSet(subscriptionPage, /var stripeEur=\[([^\]]+)\]/), expectedEur);
assert.deepEqual(languageSet(stripeCheckout, /const EUR=\[([^\]]+)\]/), expectedEur);
assert.deepEqual(languageSet(stripeCheckout, /const INTERNATIONAL=\[([^\]]+)\]/), [...internationalLanguages].sort());
for (const lang of internationalLanguages) {
  assert.ok(fs.existsSync(path.join(__dirname, "..", lang, "index.html")), lang + " landing page missing");
  const test = scenario("/" + lang + "/index.html");
  try {
    const root = test.window.document.getElementById("premium-promo-banner");
    assert.ok(root, lang + " promo missing");
    assert.equal(root.getAttribute("lang"), lang);
    assert.equal(root.getAttribute("dir"), lang === "ar" ? "rtl" : null);
    assert.equal(root.querySelector("img").getAttribute("src"), "/Imagens_autorais/enfermeira-de-mascara-azul.svg");
    assert.equal(root.querySelectorAll("li svg").length, 9);
    assert.equal(root.querySelector("[data-premium-promo-subscribe]").getAttribute("href"), "/conta/assinatura.html?lang=" + lang);
    assert.match(root.querySelector("[data-premium-promo-subscribe]").className, /premium-promo-subscribe/);
    assert.ok(root.querySelector("[data-premium-promo-close]").textContent.trim());
    assert.ok(root.querySelector("img").getAttribute("alt"));
    assert.ok(root.textContent.trim().length > 45, lang + " translation missing");
    assert.doesNotMatch(root.textContent, /Por apenas|Aceitamos Pix|Clique para assinar|Elimine todos/);
    assert.doesNotMatch(root.textContent, /\bPix\b/i);
    assert.match(root.textContent, euroLanguages.has(lang) ? /€ 3,00/ : /US\$ 3,00/);
    test.advance(1500);
    assert.equal(root.style.display, "block");
    test.advance(20000 + 180);
    assert.equal(root.style.display, "none");
    test.advance(120000 - 20000 - 180);
    assert.equal(root.style.display, "block", lang + " must repeat after two minutes");
    root.querySelector("[data-premium-promo-close]").click();
    test.advance(180);
    assert.equal(root.style.display, "none");
  } finally { test.close(); }

  const subscribed = scenario("/" + lang + "/index.html", "premium");
  assert.equal(subscribed.window.document.getElementById("premium-promo-banner"), null);
  subscribed.close();
  const pending = scenario("/" + lang + "/index.html", "pending");
  pending.advance(200000);
  assert.equal(pending.window.document.getElementById("premium-promo-banner"), null);
  pending.close();
}
assert.match(subscriptionPage, /stripeEur\?"€ 5,00":"US\$ 5,00"/);
assert.match(stripeCheckout, /EUR\.includes\(lang\)\?"EUR":"USD"/);

const recoveredPages = [
  "de/integracoes_classificacao_wifi.html",
  "it/integracoes_classificacao_wifi.html",
  "fr/guia_rapido_dispositivos.html",
  "tr/integracoes_classificacao_wifi.html",
  "pl/integracoes_classificacao_wifi.html",
  "pl/integracoes_calculadora_de_gasometria.html",
  "sv/guia_rapido_dispositivos.html"
];
const printLocales = { de: "de-DE", it: "it-IT", pl: "pl-PL", tr: "tr-TR", sv: "sv-SE" };
for (const file of recoveredPages) {
  const lang = file.split("/")[0];
  const content = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  assert.match(content, /^<!doctype html>/i, file);
  assert.doesNotMatch(content, /OPENAI_BLOCK_/);
  const page = new JSDOM(content).window;
  try {
    const doc = page.document;
    assert.equal(doc.documentElement.lang.slice(0, 2), lang);
    assert.equal(doc.querySelectorAll('script[src="/global-scripts.js"]').length, 1);
    assert.ok(doc.querySelector("main h1"), file + " missing clinical guide heading");
    assert.ok(doc.getElementById("btnImprimir"), file + " missing print action");
    assert.ok(doc.getElementById("footer-placeholder"), file + " missing footer");
    for (const script of doc.querySelectorAll('script:not([src]):not([type="application/ld+json"])')) {
      assert.doesNotThrow(() => new vm.Script(script.textContent), file + " has broken JavaScript");
    }
    if (lang === "fr") {
      assert.ok(doc.getElementById("btnGerarPDF"), "French PDF action must work");
      assert.match(doc.querySelector("main").textContent, /Dispositifs invasifs/);
    } else {
      assert.notEqual(doc.querySelector("main").lang, "en");
      assert.equal(doc.querySelector('main aside[lang="' + lang + '"][role="note"]'), null,
        file + " still has the temporary English notice");
      assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1);
      assert.equal(doc.querySelector('link[rel="canonical"]').href,
        "https://www.calculadorasdeenfermagem.com.br/" + file);
      assert.equal(doc.querySelector('link[hreflang="x-default"]'), null);
      const sourcePage = new JSDOM(fs.readFileSync(path.join(__dirname, "..", path.basename(file)), "utf8")).window;
      try {
        assert.equal(doc.querySelectorAll("main table").length,
          sourcePage.document.querySelectorAll("main table").length, file + " clinical tables missing");
        assert.equal(doc.querySelectorAll("main tr").length,
          sourcePage.document.querySelectorAll("main tr").length, file + " clinical rows missing");
        assert.ok(doc.querySelector("main").textContent.trim().length > 2000,
          file + " clinical content incomplete");
        if (file.includes("classificacao_wifi")) {
          assert.doesNotMatch(doc.querySelector("main").textContent, /leucócitos|\bou\b/, file + " has Portuguese text in the SIRS criteria");
          assert.match(doc.querySelector("main").textContent, /PaCO₂/);
          const sirs = [...doc.querySelectorAll("main tr")]
            .find(row => /SIRS/.test(row.textContent) && /12[.\s]000/.test(row.textContent));
          assert.ok(sirs, file + " severe infection criteria missing");
          const values = sirs.textContent.replace(/(\d)[.\s](?=\d{3}\b)/g, "$1");
          for (const threshold of ["38", "36", "90", "20", "32", "12000", "4000", "10"]) {
            assert.ok(values.includes(threshold), file + " lost SIRS threshold " + threshold);
          }
        } else if (file.includes("gasometria")) {
          const values = doc.querySelector("main table").textContent.replace(/,/g, ".");
          for (const range of ["7.35", "7.45", "35", "45", "22", "26", "80", "100"]) {
            assert.ok(values.includes(range), file + " lost blood gas reference " + range);
          }
        }
      } finally { sourcePage.close(); }
    }
  } finally { page.close(); }

  const runtimeErrors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", error => runtimeErrors.push(error.message));
  const runtime = new JSDOM(content, {
    url: "https://www.calculadorasdeenfermagem.com.br/" + file,
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
      window.fetch = () => Promise.resolve({ text: () => Promise.resolve("<footer></footer>") });
      window.open = () => ({ document: { write(markup) { window.__printed = markup; }, close() {} } });
    }
  });
  try {
    runtime.window.document.getElementById("btnImprimir").click();
    assert.deepEqual(runtimeErrors, [], file + " has a runtime error");
    assert.ok(runtime.window.__printed && runtime.window.__printed.length > 500, file + " print action failed");
    if (lang !== "fr") {
      assert.match(runtime.window.__printed, new RegExp('<html lang="' + printLocales[lang] + '"'),
        file + " print document language is wrong");
      assert.doesNotMatch(runtime.window.__printed, /Guia Didatico Completo|Guia Rápido: Dispositivos Invasivos|Guia Completo — Interpretacao/,
        file + " printed header is still Portuguese");
    }
  } finally { runtime.window.close(); }

  const guest = scenario("/" + file);
  assert.equal(guest.window.document.querySelector("#premium-promo-banner").getAttribute("lang"), lang);
  assert.equal(guest.window.document.querySelector("[data-premium-promo-subscribe]").getAttribute("href"), "/conta/assinatura.html?lang=" + lang);
  guest.close();
  const premium = scenario("/" + file, "premium");
  assert.equal(premium.window.document.getElementById("premium-promo-banner"), null);
  premium.close();
}


const deepLocalized = scenario("/es/conteudos/guias/index.html");
assert.equal(deepLocalized.window.document.getElementById("premium-promo-banner").getAttribute("lang"), "es");
deepLocalized.close();

const globalScripts = fs.readFileSync(path.join(__dirname, "../global-scripts.js"), "utf8");
assert.match(globalScripts, /function loadPremiumPromoOnly\(\)/);
assert.match(globalScripts, /loadPremiumPromoOnly\(\);/);

// Uma página comum respeita o intervalo global já registrado.
const regularCooldown = scenario("/missao.html", "guest", false, 999_900);
regularCooldown.advance(1500);
assert.equal(regularCooldown.window.document.getElementById("premium-promo-banner").style.display, "none");
regularCooldown.close();

// Cada nova página Premium ignora o cooldown anterior apenas na primeira exibição.
const premiumEntry = scenario("/perroca.html", "guest", true, 999_900);
premiumEntry.advance(1499);
assert.equal(premiumEntry.window.document.getElementById("premium-promo-banner").style.display, "none");
premiumEntry.advance(1);
assert.equal(premiumEntry.window.document.getElementById("premium-promo-banner").style.display, "block");
premiumEntry.close();

const premiumSubscriberEntry = scenario("/perroca.html", "premium", true, 999_900);
assert.equal(premiumSubscriberEntry.window.document.getElementById("premium-promo-banner"), null);
premiumSubscriberEntry.close();

const subscribed = scenario("/missao.html", "premium");
assert.equal(subscribed.window.document.getElementById("premium-promo-banner"), null);
subscribed.close();

const pending = scenario("/missao.html", "pending");
pending.advance(200_000);
assert.equal(pending.window.document.getElementById("premium-promo-banner"), null);
pending.setPlan("premium");
assert.equal(pending.window.document.getElementById("premium-promo-banner"), null);
pending.close();

const free = scenario("/missao.html", "pending");
free.setPlan("free");
free.advance(1500);
assert.equal(free.window.document.getElementById("premium-promo-banner").style.display, "block");
free.setPlan("unavailable");
assert.equal(free.window.document.getElementById("premium-promo-banner"), null);
free.close();

const loggedFree = scenario("/index.html", "free");
loggedFree.advance(1500);
assert.equal(loggedFree.window.document.getElementById("premium-promo-banner").style.display, "block");
loggedFree.close();

const internationalFree = scenario("/en/missao.html", "pending");
assert.equal(internationalFree.window.document.getElementById("premium-promo-banner"), null);
internationalFree.setPlan("free");
internationalFree.advance(1500);
assert.equal(internationalFree.window.document.getElementById("premium-promo-banner").style.display, "block");
internationalFree.setPlan("premium");
assert.equal(internationalFree.window.document.getElementById("premium-promo-banner"), null);
internationalFree.advance(200000);
assert.equal(internationalFree.window.document.getElementById("premium-promo-banner"), null);
internationalFree.close();

const home = scenario("/");
assert.ok(home.window.document.getElementById("premium-promo-banner"));
home.close();

const upgraded = scenario("/index.html");
upgraded.advance(1500);
upgraded.setPlan("pending", "auth");
assert.equal(upgraded.window.document.getElementById("premium-promo-banner"), null);
upgraded.setPlan("premium");
assert.equal(upgraded.window.document.getElementById("premium-promo-banner"), null);
upgraded.advance(200_000);
assert.equal(upgraded.window.document.getElementById("premium-promo-banner"), null);
upgraded.close();

// Cenário PT-BR: mantém o ciclo de 20s visível e 2min entre exibições.
const test = scenario("/missao.html");
try {
  const root = test.window.document.getElementById("premium-promo-banner");
  assert.ok(root);
  assert.equal(root.style.display, "none");
  assert.match(root.textContent, /EQUIPE PREMIUM/);
  assert.match(root.textContent, /Faça parte da Equipe Premium/);
  assert.match(root.textContent, /Elimine 100% dos anúncios indesejados/);
  assert.match(root.textContent, /mais de 65 escalas assistenciais interativas/);
  assert.match(root.textContent, /R\$ 5,00 mensais.*Pix e cartões/);
  assert.equal(root.querySelectorAll("li svg").length, 9);
  assert.equal(root.querySelector("img").getAttribute("src"), "/Imagens_autorais/enfermeira-de-mascara-azul.svg");
  assert.equal(root.querySelector("[data-premium-promo-subscribe]").getAttribute("href"), "/conta/assinatura.html");

  test.advance(1499);
  assert.equal(root.style.display, "none");
  test.advance(1);
  assert.equal(root.style.display, "block");
  test.advance(19999);
  assert.equal(root.style.display, "block");
  test.advance(1 + 180);
  assert.equal(root.style.display, "none", "promo must disappear after twenty seconds");
  test.advance(99_819);
  assert.equal(root.style.display, "none");
  test.advance(1);
  assert.equal(root.style.display, "block", "promo must repeat two minutes after its last display");

  root.querySelector("[data-premium-promo-close]").click();
  test.advance(180);
  assert.equal(root.style.display, "none", "close button must hide the card");
  test.advance(119_820);
  assert.equal(root.style.display, "block", "close button must not disable the recurring schedule");
} finally { test.close(); }

console.log("Localized Premium promo (PT + 18 languages): PASS");
