const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "conta/developer-route-catalog.json"), "utf8"));
assert.ok(catalog.paths.length > 1900);
assert.ok(catalog.paths.includes("ar/missao.html"));
assert.ok(catalog.paths.includes("en/braden.html"));
assert.ok(!catalog.paths.includes("en/menu-global.html"));

const html = fs.readFileSync(path.join(root, "conta/desenvolvedor.html"), "utf8");
const dom = new JSDOM(html, { url: "https://www.calculadorasdeenfermagem.com.br/conta/desenvolvedor.html", runScripts: "outside-only" });
const { window } = dom;
const routes = [
  { path: "braden.html", premium_required: false, enforcement: "catalog_only" },
  { path: "en/braden.html", premium_required: false, enforcement: "catalog_only" },
  { path: "missao.html", premium_required: false, enforcement: "catalog_only" },
  { path: "perroca.html", premium_required: true, enforcement: "client_guard" },
  { path: "en/perroca.html", premium_required: true, enforcement: "client_guard" }
];
window.Auth = {
  init: async () => {},
  currentUser: () => ({ uid: "developer", email: "ciadeenfermagem@gmail.com", getIdToken: async () => "test-token" })
};
let pending = true;
const mutations = [];
window.fetch = async (url, options = {}) => ({
  ok: true,
  json: async () => {
    if (String(url).endsWith(".json")) return catalog;
    if (options.method === "POST") {
      const body = JSON.parse(options.body);
      mutations.push(body);
      if (body.path === "ar/missao.html" && body.premium_required === false) pending = false;
      return { route: { path: body.path, premium_required: body.premium_required } };
    }
    return { settings: {}, routes, activation_requests: pending ? [{ path: "ar/missao.html", status: "pending" }] : [], grants: [], billing: {} };
  },
  text: async () => ""
});

const script = [...window.document.scripts].find((item) => item.textContent.includes("function catalogRows()"));
assert.ok(script);
window.eval(script.textContent);
window.document.dispatchEvent(new window.Event("DOMContentLoaded"));

setTimeout(async () => {
  try {
    const { document } = window;
    assert.match(document.getElementById("route-summary").textContent, /Free/);
    assert.ok(document.getElementById("route-category").textContent.includes("Idioma: AR"));
    const search = document.getElementById("route-search");
    for (const [route, expected] of [["en/braden.html", false], ["en/perroca.html", true], ["ar/missao.html", true], ["missao.html", false]]) {
      search.value = route;
      search.dispatchEvent(new window.Event("input"));
      const input = document.querySelector('[data-route="' + route + '"]');
      assert.ok(input, route + " missing from catalog");
      assert.equal(input.checked, expected, route + " has wrong access state");
      if (route === "ar/missao.html") {
        assert.match(input.closest("[data-route-row]").textContent, /Aguardando publicação/);
        assert.match(input.closest("[data-route-row]").textContent, /Free liberado/);
        assert.equal(input.checked, true, "pending request should be visually on for cancellation");
        assert.equal(input.dataset.pending, "true");
      }
      if (route === "missao.html") assert.match(input.closest("[data-route-row]").textContent, /acesso Free integral/);
    }
    search.value = "ar/missao.html";
    search.dispatchEvent(new window.Event("input"));
    const pendingInput = document.querySelector('[data-route="ar/missao.html"]');
    pendingInput.checked = false;
    pendingInput.dispatchEvent(new window.Event("change", { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(mutations.at(-1)?.premium_required, false, "turning off a pending switch should cancel the request");
    assert.doesNotMatch(document.querySelector('[data-route-row="ar/missao.html"]').textContent, /Aguardando publicação/);
    window.close();
    console.log("Developer route catalog UI: PASS");
  } catch (error) {
    window.close();
    console.error(error);
    process.exitCode = 1;
  }
}, 50);
