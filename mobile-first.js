/**
 * mobile-first.js
 * Versão segura – somente ajustes mobile-first definidos.
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = process.cwd();

const LANGUAGE_DIRS = [
  "en","es","de","it","fr","hi","zh","ar","ja","ru",
  "ko","tr","nl","pl","sv","id","vi","uk"
];

const EXCLUDED_DIRS = ["downloads", "biblioteca"];

const EXCLUDED_FILES = [
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html"
];

let alteredFiles = [];
let untouchedFiles = [];


/* ================================
   VALIDAÇÕES DE SEGURANÇA
================================ */

function shouldProcessFile(filePath) {
  const fileName = path.basename(filePath);

  if (!fileName.endsWith(".html")) return false;
  if (EXCLUDED_FILES.includes(fileName)) return false;

  for (const dir of EXCLUDED_DIRS) {
    if (filePath.includes(path.sep + dir + path.sep)) return false;
  }

  return true;
}

function collectHtmlFiles(dir) {
  let results = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (EXCLUDED_DIRS.includes(item)) continue;
      results = results.concat(collectHtmlFiles(fullPath));
    } else {
      if (shouldProcessFile(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}


/* ================================
   CORREÇÕES MOBILE-FIRST
================================ */

function applyMobileFixes(content) {

  let changed = false;
  let reasons = [];

  /* 1️⃣ grid-cols-2 → grid-cols-1 sm:grid-cols-2 */
  const gridRegex = /\bgrid-cols-2\b/g;

  if (gridRegex.test(content) && !content.includes("sm:grid-cols-2")) {
    content = content.replace(gridRegex, "grid-cols-1 sm:grid-cols-2");
    changed = true;
    reasons.push("Corrigido grid-cols-2 para mobile-first");
  }


  /* 2️⃣ Tooltip width fixa */
  const tooltipWidthRegex = /width:\s*180px\s*;/g;

  if (tooltipWidthRegex.test(content)) {
    content = content.replace(
      tooltipWidthRegex,
      "width: min(180px, 80vw);\n      max-width: 80vw;"
    );
    changed = true;
    reasons.push("Corrigido tooltip width fixa para responsivo");
  }


  /* 3️⃣ box-sizing global (somente se não existir) */
  if (!content.includes("box-sizing: border-box")) {
    const styleTagMatch = content.match(/<style[^>]*>/i);
    if (styleTagMatch) {
      content = content.replace(
        styleTagMatch[0],
        styleTagMatch[0] +
        "\n*, *::before, *::after { box-sizing: border-box; }\n"
      );
      changed = true;
      reasons.push("Adicionado box-sizing global");
    }
  }


  /* 4️⃣ Corrigir SOMENTE padding-right: 2rem dentro do style */
  const dropdownRegex = /(<div[^>]*id=["']language-dropdown-wrapper["'][^>]*style=["'])([^"']*)(["'][^>]*>)/i;

  const match = content.match(dropdownRegex);

  if (match) {
    let fullMatch = match[0];
    let styleContent = match[2];

    if (styleContent.includes("padding-right: 2rem")) {

      // Remove apenas o padding-right
      const updatedStyle = styleContent
        .replace(/padding-right:\s*2rem;?\s*/g, "")
        .trim();

      const newDiv = match[1] + updatedStyle + match[3];

      content = content.replace(fullMatch, newDiv);

      changed = true;
      reasons.push("Removido apenas padding-right inline do dropdown");
    }
  }


  /* 5️⃣ Remover overflow-x:hidden */
  const overflowRegex = /overflow-x:\s*hidden;?/g;

  if (overflowRegex.test(content)) {
    content = content.replace(overflowRegex, "");
    changed = true;
    reasons.push("Removido overflow-x:hidden");
  }


  return { content, changed, reasons };
}


/* ================================
   EXECUÇÃO
================================ */

function run() {

  console.log("\n🔎 Iniciando análise mobile-first...\n");

  const htmlFiles = collectHtmlFiles(ROOT_DIR);

  htmlFiles.forEach(file => {

    const original = fs.readFileSync(file, "utf8");
    const result = applyMobileFixes(original);

    if (result.changed) {
      fs.writeFileSync(file, result.content, "utf8");
      alteredFiles.push({ file, reasons: result.reasons });
    } else {
      untouchedFiles.push({
        file,
        reason: "Nenhuma alteração necessária"
      });
    }

  });

  console.log("=========== RELATÓRIO FINAL ===========\n");

  console.log("Arquivos alterados:", alteredFiles.length);
  alteredFiles.forEach(f => {
    console.log("✔", f.file);
    f.reasons.forEach(r => console.log("   -", r));
  });

  console.log("\nArquivos não alterados:", untouchedFiles.length);
  untouchedFiles.forEach(f => {
    console.log("➖", f.file);
    console.log("   -", f.reason);
  });

  console.log("\n✅ Processo concluído com segurança.\n");
}

run();
