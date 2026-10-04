const assert = require("assert");
const fs = require("fs");
const path = require("path");

(function run() {
  const root = path.resolve(__dirname, "..");
  const catalogPath = path.join(root, "data", "simulados", "catalog.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  assert.strictEqual(catalog.schemaVersion, 1);
  assert.ok(Array.isArray(catalog.simulators));
  assert.strictEqual(catalog.simulators.length, 20, "catálogo deve conter as 20 rotas auditadas");

  const ids = new Set();
  const routes = new Set();
  const allowedTypes = new Set(["general", "thematic", "exam", "flashcards"]);

  for (const simulator of catalog.simulators) {
    assert.ok(simulator.id, "simulator.id obrigatório");
    assert.ok(simulator.route, "simulator.route obrigatório");
    assert.ok(simulator.title, "simulator.title obrigatório");
    assert.ok(allowedTypes.has(simulator.type), "tipo de simulado inválido");
    assert.ok(Number.isInteger(simulator.questionCount) && simulator.questionCount > 0);
    assert.ok(!ids.has(simulator.id), "id duplicado: " + simulator.id);
    assert.ok(!routes.has(simulator.route), "rota duplicada: " + simulator.route);
    ids.add(simulator.id);
    routes.add(simulator.route);

    assert.ok(
      fs.existsSync(path.join(root, simulator.route)),
      "shell público não encontrado: " + simulator.route
    );

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(simulator, "premiumRequired"),
      false,
      "catálogo não pode hardcodar Premium"
    );
  }

  const hidden = catalog.simulators.filter((item) => item.menuVisible === false).map((item) => item.route).sort();
  assert.deepStrictEqual(hidden, [
    "simulado-de-enfermagem4.html",
    "simulado_bloco-operatorio.html"
  ].sort());

  const ethics = catalog.simulators.find((item) => item.route === "simulado_codigo_de_etica_enfermagem.html");
  const flashcards = catalog.simulators.find((item) => item.route === "flashcards_quiz.html");
  assert.strictEqual(ethics.questionCount, 58);
  assert.strictEqual(ethics.hasExplanations, true);
  assert.strictEqual(flashcards.questionCount, 24);
  assert.strictEqual(flashcards.type, "flashcards");

  console.log("OK - simulator catalog");
})();
