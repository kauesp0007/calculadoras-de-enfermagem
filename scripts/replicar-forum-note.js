// scripts/replicar-forum-note.js
// Replica o comentário explicativo (forum-info-note) e o CSS para os 18 idiomas.

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LANGS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];

const NOTE_TEXT = "O site Calculadoras de Enfermagem é traduzido para 19 idiomas sem uso de tradutores e de forma não literal. As páginas de fórum em cada um dos diferentes idiomas são programadas para que todos os comentários se agrupem na mesma página. O botão \"Traduzir\" traduz todos os idiomas para o inglês (americano) — a tradução acontece somente quando você clica no botão. O intuito é aproximar os profissionais com suas diferentes culturas, trocar informações e atualizações, e conhecer novas pessoas na área da enfermagem.";

const REPLACEMENTS = [
    // 1. CSS .forum-info-note (após .patient-warn svg)
    [
        ".patient-warn svg{width:14px;height:14px;flex-shrink:0;margin-top:1px}",
        ".patient-warn svg{width:14px;height:14px;flex-shrink:0;margin-top:1px}\n.forum-info-note{margin-top:10px;padding:10px 12px;border:1px solid #BFDBFE;border-left:3px solid #1A3E74;border-radius:10px;background:#F0F7FF;font-size:12px;color:#1E3E74;line-height:1.6}"
    ],
    // 2. Comentário após patient-warn (antes do counter)
    [
        '<div class="counter" id="char-count">0 / 2000</div>',
        '<p class="forum-info-note">' + NOTE_TEXT + '</p>\n<div class="counter" id="char-count">0 / 2000</div>'
    ]
];

let okCount = 0, failCount = 0;
const failures = [];

for (const lang of LANGS) {
    const file = path.join(ROOT, lang, "forum-enfermagem.html");
    if (!fs.existsSync(file)) { failures.push(lang + "/forum-enfermagem.html (não existe)"); failCount++; continue; }
    let content = fs.readFileSync(file, "utf8");
    content = content.replace(/\r\n/g, "\n");
    let applied = 0;
    for (const [oldStr, newStr] of REPLACEMENTS) {
        if (content.includes(oldStr)) {
            content = content.split(oldStr).join(newStr);
            applied++;
        } else {
            failures.push(lang + "/forum-enfermagem.html: padrão não encontrado -> " + oldStr.slice(0, 50).replace(/\n/g, "\\n"));
        }
    }
    if (applied === REPLACEMENTS.length) {
        fs.writeFileSync(file, content.replace(/\n/g, "\r\n"), "utf8");
        okCount++;
        console.log("✓ " + lang + "/forum-enfermagem.html");
    } else {
        failCount++;
        console.log("✗ " + lang + "/forum-enfermagem.html (" + applied + "/" + REPLACEMENTS.length + ")");
    }
}

console.log("\nRESULTADO: " + okCount + " OK, " + failCount + " falhas.");
if (failures.length) {
    console.log("DETALHES:");
    failures.forEach((f) => console.log("  - " + f));
}
process.exit(failCount > 0 ? 1 : 0);
