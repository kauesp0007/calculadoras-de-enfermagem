/**
 * Watch de sitemap automático — Calculadoras de Enfermagem
 *
 * Observa criação/alteração/exclusão de arquivos .html nas pastas que alimentam
 * o sitemap (raiz pt-BR, 18 idiomas, escalas-de-enfermagem, downloads,
 * biblioteca, blog e concurso_publico) e, com debounce, roda:
 *   node generate-sitemap.js
 *
 * Registrado como tarefa em segundo plano (.vscode/tasks.json) com runOn: folderOpen,
 * então inicia sozinho ao abrir a pasta no VS Code.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = __dirname;

// Segmentos de caminho que NÃO disparam a geração (evita loop e ruído)
const IGNORED_SEGMENTS = [
    "node_modules",
    ".git",
    "backups-temporarios",
    "backups_seco",
    ".tradutor_cache",
    "reports",
    "logs",
    ".chrome-perfil-pci",
    "automacoes",
];

// Arquivos gerados pelo próprio gerador de sitemap (evita loop infinito)
const IGNORED_FILES = new Set([
    "sitemap.xml",
    "sitemap-index.xml",
    "video-sitemap.xml",
]);

function shouldRegenerate(rel) {
    if (!rel) return false;
    rel = rel.replace(/\\/g, "/");
    if (IGNORED_FILES.has(rel)) return false;
    const parts = rel.split("/");
    if (parts.some((p) => IGNORED_SEGMENTS.includes(p))) return false;
    return path.extname(rel).toLowerCase() === ".html";
}

function run() {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, ["generate-sitemap.js"], {
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
let running = false;
let queued = false;

async function runSitemap() {
    if (running) {
        queued = true;
        return;
    }
    running = true;
    const t0 = Date.now();
    console.log(`\n🗺️ [${new Date().toLocaleTimeString()}] Gerando sitemap...`);

    const ok = await run();

    running = false;
    console.log(
        `${ok ? "✅" : "❌"} Sitemap concluído em ${((Date.now() - t0) / 1000).toFixed(1)}s`
    );

    if (queued) {
        queued = false;
        schedule();
    }
}

function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        runSitemap();
    }, 2000);
}

// Janela de "recenticidade": só considera alterações com mtime recente.
// Ignora a rajada de eventos "change" que o fs.watch recursivo do Windows
// emite para arquivos já existentes durante a varredura inicial.
const RECENT_MS = 5000;

function isRecent(rel) {
    try {
        const st = fs.statSync(path.join(ROOT, rel));
        return Date.now() - st.mtimeMs < RECENT_MS;
    } catch {
        return false;
    }
}

console.log("🟢 Watch de sitemap ativo — crie/altere/exclua um HTML para atualizar o sitemap.xml automaticamente.");

fs.watch(ROOT, { recursive: true }, (eventType, filename) => {
    if (!shouldRegenerate(filename)) return;

    // Exclusão de página: arquivo não existe mais — regenera para removê-lo do sitemap
    if (eventType === "rename" && !fs.existsSync(path.join(ROOT, filename))) {
        console.log(`  ↪ excluído: ${filename}`);
        schedule();
        return;
    }

    if (!isRecent(filename)) return;
    console.log(`  ↪ ${eventType}: ${filename}`);
    schedule();
});
