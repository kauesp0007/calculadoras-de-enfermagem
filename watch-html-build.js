/**
 * Watch de build automático — Calculadoras de Enfermagem
 *
 * Observa alterações em arquivos HTML/CSS/JS e, com debounce, roda o build
 * obrigatório do projeto:
 *   1) Tailwind CSS (src/input.css -> public/output.css)
 *   2) node gerar-sw.js (novo CACHE_NAME com timestamp)
 *
 * Registrado como tarefa em segundo plano (.vscode/tasks.json) com runOn: folderOpen,
 * então inicia sozinho ao abrir a pasta.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = __dirname;

// Extensões que disparam o build
const TRACKED_EXT = new Set([".html", ".css", ".js"]);

// Segmentos de caminho que NÃO disparam o build (evita loop com os próprios outputs)
const IGNORED_SEGMENTS = [
  "node_modules",
  ".git",
  "backups-temporarios",
  "backups_seco",
  ".tradutor_cache",
  "reports",
  "logs",
  ".chrome-perfil-pci",
];

// Arquivos específicos gerados pelo próprio build
const IGNORED_FILES = new Set(["public/output.css", "sw.js"]);

function shouldBuild(rel) {
  if (!rel) return false;
  rel = rel.replace(/\\/g, "/");
  if (IGNORED_FILES.has(rel)) return false;
  const parts = rel.split("/");
  if (parts.some((p) => IGNORED_SEGMENTS.includes(p))) return false;
  return TRACKED_EXT.has(path.extname(rel).toLowerCase());
}

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (d) => process.stdout.write(d));
    child.stderr.on("data", (d) => process.stderr.write(d));
    child.on("error", (err) => {
      console.log("❌ ERRO:", err.message);
      resolve(false);
    });
    child.on("close", (code) => resolve(code === 0));
  });
}

let timer = null;
let buildRunning = false;
let rebuildQueued = false;

async function runBuild() {
  if (buildRunning) {
    rebuildQueued = true;
    return;
  }
  buildRunning = true;
  const t0 = Date.now();
  console.log(`\n🔨 [${new Date().toLocaleTimeString()}] Build iniciado (Tailwind + SW)...`);

  const okCss = await run([
    "node_modules/tailwindcss/lib/cli.js",
    "-i", "./src/input.css",
    "-o", "./public/output.css",
    "--minify",
  ]);

  let okSw = false;
  if (okCss) {
    okSw = await run(["gerar-sw.js"]);
  } else {
    console.log("⚠️ Tailwind falhou; service worker não foi regenerado.");
  }

  buildRunning = false;
  console.log(
    `${okCss && okSw ? "✅" : "❌"} Build concluído em ${((Date.now() - t0) / 1000).toFixed(1)}s`
  );

  if (rebuildQueued) {
    rebuildQueued = false;
    schedule();
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    runBuild();
  }, 1500);
}

// Janela de "recenticidade": só considera alterações com mtime recente.
// Isso ignora a rajada de eventos "change" que o fs.watch recursivo do Windows
// emite para arquivos já existentes durante a varredura inicial (sem build na abertura).
const RECENT_MS = 5000;

function isRecent(rel) {
  try {
    const st = fs.statSync(path.join(ROOT, rel));
    return Date.now() - st.mtimeMs < RECENT_MS;
  } catch {
    return false;
  }
}

console.log("🟢 Watch de build ativo — altere/crie um HTML, CSS ou JS para disparar o build automaticamente.");

fs.watch(ROOT, { recursive: true }, (eventType, filename) => {
  if (!shouldBuild(filename)) return;
  if (!isRecent(filename)) return;
  console.log(`  ↪ ${eventType}: ${filename}`);
  schedule();
});
