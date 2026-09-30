"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const source = fs.readFileSync(path.join(__dirname, "../js/access/premium-banner-manager.js"), "utf8");

function scenario(pathname, initialPlan = "guest") {
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

for (const pathname of ["/conta/perfil.html", "/blog/index.html", "/en/conta/perfil.html", "/xx/index.html"]) {
  const test = scenario(pathname);
  try {
    test.advance(200_000);
    assert.equal(test.window.document.getElementById("premium-promo-banner"), null, pathname + " must not display the promo");
  } finally { test.close(); }
}

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
    assert.equal(root.querySelector("img").getAttribute("src"), "/img/ilustracao_enfermeira.webp");
    assert.equal(root.querySelectorAll("li svg").length, 2);
    assert.equal(root.querySelector("[data-premium-promo-subscribe]").getAttribute("href"), "/conta/assinatura.html?lang=" + lang);
    assert.equal(root.querySelector("[data-premium-promo-subscribe]").style.backgroundColor, "rgb(250, 204, 21)");
    assert.ok(root.querySelector("[data-premium-promo-close]").textContent.trim());
    assert.ok(root.querySelector("img").getAttribute("alt"));
    assert.ok(root.textContent.trim().length > 45, lang + " translation missing");
    assert.doesNotMatch(root.textContent, /Por apenas|Aceitamos Pix|Clique para assinar|Elimine todos/);
    assert.doesNotMatch(root.textContent, /\bPix\b/i);
    assert.match(root.textContent, euroLanguages.has(lang) ? /€ 5,00/ : /US\$ 5,00/);
    test.advance(1500);
    assert.equal(root.style.display, "block");
    test.advance(10000 + 180);
    assert.equal(root.style.display, "none");
    test.advance(180000 - 10000 - 180);
    assert.equal(root.style.display, "block", lang + " must repeat after three minutes");
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

const test = scenario("/missao.html");
try {
  const root = test.window.document.getElementById("premium-promo-banner");
  assert.ok(root);
  assert.equal(root.style.display, "none");
  assert.match(root.textContent, /Faça parte da Equipe PREMIUM/);
  assert.match(root.textContent, /Faça parte do Plano PREMIUM/);
  assert.match(root.textContent, /Elimine todos os anúncios do site/);
  assert.match(root.textContent, /calculadoras, escalas, formulários e simulados/);
  assert.match(root.textContent, /R\$ 5,00 mensais.*Pix e cartões/);
  assert.equal(root.querySelectorAll("li svg").length, 2);
  assert.equal(root.querySelector("img").getAttribute("src"), "/img/ilustracao_enfermeira.webp");
  assert.equal(root.querySelector("[data-premium-promo-subscribe]").getAttribute("href"), "/conta/assinatura.html");

  test.advance(1499);
  assert.equal(root.style.display, "none");
  test.advance(1);
  assert.equal(root.style.display, "block");
  test.advance(9999);
  assert.equal(root.style.display, "block");
  test.advance(1 + 180);
  assert.equal(root.style.display, "none", "promo must disappear after ten seconds");
  test.advance(169_819);
  assert.equal(root.style.display, "none");
  test.advance(1);
  assert.equal(root.style.display, "block", "promo must repeat three minutes after its last display");

  root.querySelector("[data-premium-promo-close]").click();
  test.advance(180);
  assert.equal(root.style.display, "none", "close button must hide the card");
  test.advance(179_820);
  assert.equal(root.style.display, "block", "close button must not disable the recurring schedule");
} finally { test.close(); }

console.log("Localized Premium promo (PT + 18 languages): PASS");
