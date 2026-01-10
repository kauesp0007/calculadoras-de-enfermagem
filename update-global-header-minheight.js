/**
 * update-global-header-minheight.js
 *
 * Substitui em arquivos .html:
 *   <div id="global-header-container" style="min-height: 30px;"></div>
 * por:
 *   <div id="global-header-container" style="min-height: 70px;"></div>
 *
 * Regras:
 * - Só altera arquivos .html
 * - Ignora pastas: downloads/ e biblioteca/
 * - Ignora arquivos: downloads.html, footer.html, menu-global.html, global-body-elements.html,
 *                   _language_selector.html, googlefc0a17cdd552164b.html
 * - Varre raiz e pastas de idiomas (en/, es/, etc.) — automaticamente, pois varre o projeto inteiro
 * - Ignora pastas de sistema comuns (.git, node_modules, etc.)
 *
 * Uso:
 *   node update-global-header-minheight.js --dry
 *   node update-global-header-minheight.js --apply
 */

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

const IGNORE_DIRS = new Set([
  "downloads",
  "biblioteca",
  "node_modules",
  ".git",
  ".github",
  ".vscode",
  ".idea",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".cache",
]);

const IGNORE_FILES = new Set([
  "downloads.html",
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html",
]);

// Pega flags
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry") || !args.has("--apply");

// Regex robusta: aceita variações de espaço, aspas simples/duplas e ordem dentro do style,
// mas exige id="global-header-container" e min-height: 30px
const pattern = /<div\s+id=(["'])global-header-container\1\s+style=(["'])([^"']*?)\2\s*>\s*<\/div>/gi;

function updateDivTag(originalTag) {
  // Se não tiver min-height: 30px dentro do style, não mexe
  const hasMinHeight30 = /min-height\s*:\s*30px\s*;?/i.test(originalTag);
  if (!hasMinHeight30) return null;

  // Troca só o valor 30 -> 70, preservando o resto do style
  const updated = originalTag.replace(/min-height\s*:\s*30px(\s*;?)/i, "min-height: 70px$1");
  return updated === originalTag ? null : updated;
}

async function walk(dir) {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch (err) {
    // Sem permissão ou pasta inexistente: ignora
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Ignora symlinks (evita loops)
    if (entry.isSymbolicLink()) continue;

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      // Ignora pastas ocultas por padrão (ex.: .something), exceto se você quiser permitir
      if (entry.name.startsWith(".")) continue;

      await walk(fullPath);
      continue;
    }

    if (!entry.isFile()) continue;

    // Só .html
    if (!entry.name.toLowerCase().endsWith(".html")) continue;

    // Arquivos ignorados (em qualquer pasta)
    if (IGNORE_FILES.has(entry.name)) continue;

    await processFile(fullPath);
  }
}

async function processFile(filePath) {
  let content;
  try {
    content = await fsp.readFile(filePath, "utf8");
  } catch {
    return;
  }

  let changed = false;
  let countInFile = 0;

  const newContent = content.replace(pattern, (match) => {
    const updated = updateDivTag(match);
    if (updated) {
      changed = true;
      countInFile += 1;
      return updated;
    }
    return match;
  });

  if (!changed) return;

  if (DRY_RUN) {
    console.log(`[DRY] ${filePath}  (${countInFile} substituição(ões))`);
    return;
  }

  // Backup opcional: descomente se quiser criar .bak na primeira execução real
  // await fsp.copyFile(filePath, filePath + ".bak");

  await fsp.writeFile(filePath, newContent, "utf8");
  console.log(`[OK ] ${filePath}  (${countInFile} substituição(ões))`);
}

(async () => {
  const root = process.cwd();

  console.log("========================================");
  console.log("Atualizador: global-header-container min-height");
  console.log("Pasta raiz:", root);
  console.log("Modo:", DRY_RUN ? "DRY RUN (simulação)" : "APPLY (alterando arquivos)");
  console.log("Ignorando pastas:", Array.from(IGNORE_DIRS).join(", "));
  console.log("Ignorando arquivos:", Array.from(IGNORE_FILES).join(", "));
  console.log("========================================\n");

  await walk(root);

  console.log("\nConcluído.");
  if (DRY_RUN) {
    console.log("Nenhum arquivo foi modificado (modo --dry).");
    console.log("Para aplicar de verdade: node update-global-header-minheight.js --apply");
  }
})();
