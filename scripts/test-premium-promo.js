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

for (const pathname of ["/en/missao.html", "/es/ballard.html", "/conta/perfil.html", "/blog/index.html"]) {
  const test = scenario(pathname);
  try {
    test.advance(200_000);
    assert.equal(test.window.document.getElementById("premium-promo-banner"), null, pathname + " must not display the PT promo");
  } finally { test.close(); }
}

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

console.log("Portuguese Premium promo: PASS");
