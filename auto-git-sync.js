/**
 * Auto Git Sync — Calculadoras de Enfermagem
 *
 * Automatiza o fluxo git local:
 *   1) Ao salvar arquivo (debounce de 3s): git add -A → commit → pull --rebase → push.
 *   2) A cada 5 minutos: pull --rebase da origem (traz mudanças remotas).
 *
 * A branch atual é detectada em tempo real, então funciona em qualquer branch.
 * Registrado como tarefa em segundo plano (.vscode/tasks.json) com runOn: folderOpen.
 */

const { spawn } = require("child_process");
const path = require("path");
const chokidar = require("chokidar");

const ROOT = __dirname;
const PULL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const DEBOUNCE_MS = 3000; // 3s após o último evento de salvamento

// Segmentos de caminho que NÃO disparam commit (ruído/artefatos locais)
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

function log(msg) {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function shouldTrack(rel) {
    if (!rel) return false;
    rel = rel.replace(/\\/g, "/");
    const parts = rel.split("/");
    return !parts.some((p) => IGNORED_SEGMENTS.includes(p));
}

function git(args) {
    return new Promise((resolve) => {
        const child = spawn("git", args, {
            cwd: ROOT,
            stdio: ["ignore", "pipe", "pipe"],
        });
        let out = "";
        let err = "";
        child.stdout.on("data", (d) => (out += d));
        child.stderr.on("data", (d) => (err += d));
        child.on("error", (e) => {
            log(`❌ git indisponível: ${e.message}`);
            resolve({ code: 1, out: "", err: String(e.message) });
        });
        child.on("close", (code) => resolve({ code, out, err }));
    });
}

async function currentBranch() {
    const r = await git(["rev-parse", "--abbrev-ref", "HEAD"]);
    const b = r.out.trim();
    return r.code === 0 && b && b !== "HEAD" ? b : null;
}

async function hasStagedChanges() {
    const r = await git(["diff", "--cached", "--quiet"]);
    return r.code !== 0; // exit 1 = há mudanças staged
}

async function abortRebaseIfNeeded() {
    // Tenta abortar um rebase em andamento (conflito); ignora se não houver.
    await git(["rebase", "--abort"]);
}

let syncing = false;
let pending = false;
let debounceTimer = null;

async function pullOnly() {
    const branch = await currentBranch();
    if (!branch) {
        log("⚠️ branch não detectada; pull periódico ignorado.");
        return;
    }
    const r = await git(["pull", "--rebase", "origin", branch]);
    if (r.code !== 0) {
        log("⚠️ pull periódico com conflito; abortando rebase...");
        await abortRebaseIfNeeded();
        log("❌ Conflito no pull. Resolva manualmente com: git status / git rebase --continue.");
        return;
    }
    const msg = (r.out + r.err).trim();
    if (msg && !msg.includes("Already up to date")) {
        log("✅ pull periódico trouxe mudanças da origem.");
    }
}

async function commitPullPush() {
    const branch = await currentBranch();
    if (!branch) {
        log("⚠️ branch não detectada; commit ignorado.");
        return;
    }

    // 1. Commit local (se houver mudanças)
    await git(["add", "-A"]);
    if (await hasStagedChanges()) {
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const c = await git(["commit", "-m", `chore: auto-commit ${ts}`]);
        if (c.code === 0) log("✅ commit realizado.");
        else log(`ℹ️ commit: ${(c.err || c.out).trim().split("\n")[0]}`);
    }

    // 2. Pull --rebase (traz a origem antes de publicar)
    const pull = await git(["pull", "--rebase", "origin", branch]);
    if (pull.code !== 0) {
        log("⚠️ pull com conflito; abortando rebase...");
        await abortRebaseIfNeeded();
        log("❌ Conflito no pull. Resolva manualmente com: git status / git rebase --continue.");
        return;
    }

    // 3. Push
    const push = await git(["push", "-u", "origin", branch]);
    if (push.code === 0) {
        log("✅ push ok.");
    } else {
        log(`⚠️ push: ${(push.err || push.out).trim().split("\n").slice(0, 2).join(" | ")}`);
    }
}

async function runSync() {
    if (syncing) {
        pending = true;
        return;
    }
    syncing = true;
    try {
        await commitPullPush();
    } catch (e) {
        log(`❌ erro: ${e.message}`);
    } finally {
        syncing = false;
        if (pending) {
            pending = false;
            scheduleSync();
        }
    }
}

function scheduleSync() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        debounceTimer = null;
        runSync();
    }, DEBOUNCE_MS);
}

// Watch de arquivos: dispara commit+pull+push ao salvar
const watcher = chokidar.watch(ROOT, {
    ignored: (p) => !shouldTrack(path.relative(ROOT, p)),
    ignoreInitial: true,
    persistent: true,
});

watcher.on("all", (event) => {
    if (event === "add" || event === "change" || event === "unlink") {
        scheduleSync();
    }
});

// Pull periódico da origem
setInterval(pullOnly, PULL_INTERVAL_MS);

log("🟢 Auto Git Sync ativo — commit+pull+push ao salvar e pull periódico a cada 5 min.");
