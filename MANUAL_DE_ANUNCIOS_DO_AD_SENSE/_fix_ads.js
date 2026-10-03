// Corrige inconsistências de anúncios:
// 1. COPSOQ: slot legado 5401011816 -> 3341197364 (multiplex controlado)
// 2. data-ad-slot="auto" -> 2979726942 (display pós-hero válido)
// 3. conta/assinatura.html: remove bloco multiplex morto (página excluída)
const fs = require("fs");
const path = require("path");

const ROOT = "c:\\calculadoras-de-enfermagem";
const LANG_DIRS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];
const BACKUP = path.join(ROOT, "backups-temporarios", "anuncios-fix-2026-10-03");

function collectHtml() {
    const files = [];
    for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
        if (e.isFile() && e.name.endsWith(".html")) files.push(path.join(ROOT, e.name));
    }
    for (const l of LANG_DIRS) {
        const d = path.join(ROOT, l);
        if (!fs.existsSync(d)) continue;
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            if (e.isFile() && e.name.endsWith(".html")) files.push(path.join(d, e.name));
        }
    }
    return files;
}

function backup(file) {
    if (!fs.existsSync(BACKUP)) fs.mkdirSync(BACKUP, { recursive: true });
    const rel = path.relative(ROOT, file).replace(/[\\/]/g, "__");
    const dest = path.join(BACKUP, rel);
    fs.copyFileSync(file, dest);
}

let changes = 0;
let changedFiles = [];

for (const file of collectHtml()) {
    let html = fs.readFileSync(file, "utf8");
    const orig = html;

    // 1. COPSOQ slot legado
    html = html.replace(/data-ad-slot="5401011816"/g, 'data-ad-slot="3341197364"');

    // 2. slot "auto" inválido
    html = html.replace(/data-ad-slot="auto"/g, 'data-ad-slot="2979726942"');

    // 3. conta/assinatura.html: remove bloco multiplex morto
    if (file.endsWith("conta" + path.sep + "assinatura.html")) {
        html = html.replace(
            /<!-- MULTIPLEX_AD_RESERVED_START -->[\s\S]*?<!-- MULTIPLEX_AD_RESERVED_END -->\s*/,
            ""
        );
    }

    if (html !== orig) {
        backup(file);
        fs.writeFileSync(file, html, "utf8");
        changes++;
        changedFiles.push(path.relative(ROOT, file).replace(/\\/g, "/"));
    }
}

console.log("Arquivos alterados:", changes);
changedFiles.forEach((f) => console.log("  - " + f));
