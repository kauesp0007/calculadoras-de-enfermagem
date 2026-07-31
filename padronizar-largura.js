// padronizar-largura.js
// Remove max-w containers e padroniza <main> para ocupar largura total
const fs = require("fs");
const path = require("path");

const SKIP_DIRS = new Set(["downloads","biblioteca","blog","blog-templates","node_modules",".git",".tradutor_cache","automacoes"]);
const SKIP_FILES = new Set(["footer.html","menu-global.html","global-body-elements.html","downloads.html","_language_selector.html","googlefc0a17cdd552164b.html","downloads.template.html"]);
const LANGS = ["en","es","de","it","fr","hi","zh","ar","ja","ru","ko","tr","nl","pl","sv","id","vi","uk"];

let changed = 0, scanned = 0;

// Count div depth from a position
function findMatchingClose(html, startPos) {
    let depth = 1, pos = startPos;
    while (pos < html.length && depth > 0) {
        const nextOpen = html.indexOf("<div", pos);
        const nextClose = html.indexOf("</div>", pos);
        if (nextOpen === -1 && nextClose === -1) return -1;
        const isOpen = nextClose === -1 || (nextOpen !== -1 && nextOpen < nextClose);
        if (isOpen) { depth++; pos = nextOpen + 4; }
        else { depth--; pos = nextClose; if (depth === 0) return pos + 6; pos += 6; }
    }
    return -1;
}

function walk(dir) {
    let items; try { items = fs.readdirSync(dir); } catch(e) { return; }
    for (const name of items) {
        if (SKIP_DIRS.has(name)) continue;
        const full = path.join(dir, name);
        let st; try { st = fs.statSync(full); } catch(e) { continue; }
        if (st.isDirectory()) { walk(full); continue; }
        if (!name.endsWith(".html") || SKIP_FILES.has(name) || name === "index.html") continue;
        scanned++;
        processFile(full);
    }
}

function processFile(filePath) {
    let html; try { html = fs.readFileSync(filePath, "utf8"); } catch(e) { return; }
    const orig = html;
    let mod = false;

    // ----- PASSO 1: Corrigir tag <main> -----
    const mainStart = html.indexOf("<main");
    if (mainStart === -1) return;
    const mainTagEnd = html.indexOf(">", mainStart) + 1;

    const newMain = `<main id="main-content" class="flex-grow p-4 sm:p-8">`;
    const mainTag = html.substring(mainStart, mainTagEnd);
    if (mainTag !== newMain) {
        html = html.substring(0, mainStart) + newMain + html.substring(mainTagEnd);
        mod = true;
    }

    // ----- PASSO 2: Remover wrappers de container dentro do <main> -----
    const mainIdx = html.indexOf("<main");
    const mainBodyStart = html.indexOf(">", mainIdx) + 1;
    const mainClose = html.indexOf("</main>", mainBodyStart);
    if (mainClose === -1) return;
    let mainContent = html.substring(mainBodyStart, mainClose);

    // Padrão A: <div class="...main-content-wrapper..."> ... </div> (qualquer max-w ou mx-auto)
    const wrapperRe = /<div\s+class="[^"]*main-content-wrapper[^"]*"[^>]*>/g;
    let wm;
    let offset = 0;
    while ((wm = wrapperRe.exec(mainContent)) !== null) {
        const absPos = mainBodyStart + wm.index - offset;
        const closePos = findMatchingClose(html, absPos + wm[0].length);
        if (closePos === -1) continue;
        html = html.substring(0, absPos) + html.substring(absPos + wm[0].length);
        html = html.substring(0, closePos - wm[0].length) + html.substring(closePos - wm[0].length + 6);
        offset += wm[0].length + 6;
        mod = true;
        // refresh mainContent after modification
        const newMainIdx = html.indexOf("<main");
        const newBodyStart = html.indexOf(">", newMainIdx) + 1;
        const newClose = html.indexOf("</main>", newBodyStart);
        mainContent = html.substring(newBodyStart, newClose);
        wrapperRe.lastIndex = 0;
    }

    // Padrão B: <div class="...max-w-[4567]xl...mx-auto..."> (wrapper direto do main)
    const maxwRe = /<div\s+class="[^"]*max-w-[4567]xl[^"]*mx-auto[^"]*"[^>]*>/g;
    let mw;
    offset = 0;
    const mcStart = html.indexOf("<main");
    const mcBodyStart = html.indexOf(">", mcStart) + 1;
    const mcClose = html.indexOf("</main>", mcBodyStart);
    let mcContent = mcClose > 0 ? html.substring(mcBodyStart, mcClose) : "";
    while ((mw = maxwRe.exec(mcContent)) !== null) {
        const absPos = mcBodyStart + mw.index - offset;
        const closePos = findMatchingClose(html, absPos + mw[0].length);
        if (closePos === -1) continue;
        html = html.substring(0, absPos) + html.substring(absPos + mw[0].length);
        html = html.substring(0, closePos - mw[0].length) + html.substring(closePos - mw[0].length + 6);
        offset += mw[0].length + 6;
        mod = true;
        // refresh
        const nmIdx = html.indexOf("<main");
        const nmBody = html.indexOf(">", nmIdx) + 1;
        const nmClose = html.indexOf("</main>", nmBody);
        mcContent = html.substring(nmBody, nmClose);
        maxwRe.lastIndex = 0;
    }

    if (mod && html !== orig) {
        fs.writeFileSync(filePath, html, "utf8");
        changed++;
        console.log("[OK] " + filePath);
    }
}

console.log("=== Padronizando largura das paginas ===\n");
walk(".");
LANGS.forEach(l => { const p = path.join(".", l); if (fs.existsSync(p)) walk(p); });
console.log("\nAlterados: " + changed + " / Escaneados: " + scanned);
