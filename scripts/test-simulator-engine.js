const assert = require("assert");
const path = require("path");
const { JSDOM } = require("jsdom");

function loadEngine(dom) {
  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  const enginePath = path.resolve(__dirname, "../js/simulados/simulator-engine.js");
  delete require.cache[enginePath];
  return require(enginePath);
}

(function run() {
  const dom = new JSDOM(
    "<!doctype html><html><body><div id=\"root\"></div></body></html>",
    { url: "https://www.calculadorasdeenfermagem.com.br/simulado-teste.html" }
  );
  dom.window.confirm = () => true;
  dom.window.gtag = () => {};
  let printCalls = 0;
  dom.window.print = () => { printCalls += 1; };

  const engine = loadEngine(dom);

  assert.strictEqual(engine.version, "1.0.1-p0");

  const normalized = engine.normalizeQuestions([
    { id: 1, question: "Questão 1", options: ["A", "B"], answerIndex: 1, ref: "Fonte 1" },
    { id: 2, prompt: "Questão 2", options: ["A", "B"], correctIndex: 0, explanation: "Comentário 2" }
  ]);

  assert.strictEqual(normalized.length, 2);
  assert.strictEqual(normalized[0].prompt, "Questão 1");
  assert.strictEqual(normalized[0].reference, "Fonte 1");
  assert.strictEqual(normalized[1].explanation, "Comentário 2");

  assert.deepStrictEqual(
    engine.scoreAttempt(normalized, [1, null]),
    { hits: 1, errors: 0, unanswered: 1, total: 2, percent: 50 }
  );
  assert.strictEqual(engine.progressBucket(1, 2), 50);
  assert.strictEqual(engine.scoreBucket(91), "90_100");
  assert.strictEqual(engine.storageKey("teste"), "ce_simulator_attempt_v1:teste");

  const simulator = engine.create({
    id: "teste",
    title: "Simulado de teste",
    contentVersion: "2026-10-04",
    mode: "study",
    allowModeChoice: false,
    timer: false,
    print: true,
    analytics: false,
    storage: true,
    root: "#root",
    questions: normalized
  }).mount();

  const root = dom.window.document.getElementById("root");
  const start = root.querySelector(".ce-sim-btn-primary");
  assert.ok(start, "botão iniciar deve existir");
  start.click();

  assert.ok(root.querySelector(".ce-sim-question-panel"), "painel de questão deve existir");
  assert.strictEqual(root.querySelector("progress").max, 2);
  assert.strictEqual(root.querySelector("progress").value, 0);

  const firstCorrect = root.querySelector(
    'input[name="ce-sim-q-teste-0"][value="1"]'
  );
  assert.ok(firstCorrect, "alternativa correta da questão 1 deve existir");
  firstCorrect.checked = true;
  firstCorrect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));

  assert.strictEqual(root.querySelector("progress").value, 1);
  assert.ok(root.querySelector(".ce-sim-feedback.is-correct"), "modo estudo deve mostrar feedback");
  assert.ok(dom.window.localStorage.getItem(engine.storageKey("teste")), "tentativa deve ser persistida");

  const next = Array.from(root.querySelectorAll("button")).find(
    (button) => button.textContent.trim() === "Próxima"
  );
  assert.ok(next, "botão próxima deve existir");
  next.click();

  const secondCorrect = root.querySelector(
    'input[name="ce-sim-q-teste-1"][value="0"]'
  );
  secondCorrect.checked = true;
  secondCorrect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));

  const finish = Array.from(root.querySelectorAll("button")).find(
    (button) => button.textContent.trim() === "Finalizar simulado"
  );
  assert.ok(finish, "botão finalizar deve existir");
  finish.click();

  const resultText = root.textContent;
  assert.ok(resultText.includes("Resultado"));
  assert.ok(resultText.includes("100%"));
  assert.ok(resultText.includes("Não respondidas"));

  const printButton = Array.from(root.querySelectorAll("button")).find(
    (button) => button.textContent.trim() === "Imprimir"
  );
  assert.ok(printButton, "botão imprimir deve existir quando print=true");
  assert.ok(root.querySelector("[data-ce-sim-print-sheet]"), "folha de impressão deve ser preparada");
  printButton.click();
  assert.strictEqual(printCalls, 1, "impressão deve usar window.print");
  const printText = root.querySelector("[data-ce-sim-print-sheet]").textContent;
  assert.ok(printText.includes("Questão 1"));
  assert.ok(printText.includes("Gabarito: B) B"));
  assert.ok(printText.includes("Referência: Fonte 1"));

  const saved = JSON.parse(dom.window.localStorage.getItem(engine.storageKey("teste")));
  assert.ok(saved.completedAt, "tentativa concluída deve permanecer salva");
  assert.strictEqual(saved.answers[0], 1);
  assert.strictEqual(saved.answers[1], 0);

  simulator.destroy();

  delete global.window;
  delete global.document;
  delete global.localStorage;

  console.log("OK - simulator-engine P0");
})();
