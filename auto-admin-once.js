/**
 * auto-admin-once.js
 *
 * Altera SOMENTE em arquivos .html a parte do "admin_mode" do script fornecido,
 * mantendo todo o resto do script exatamente igual.
 *
 * Regras:
 * - Só altera .html
 * - Ignora pastas: downloads/ e biblioteca/
 * - Ignora arquivos: downloads.html, footer.html, menu-global.html, global-body-elements.html,
 *                   _language_selector.html, googlefc0a17cdd552164b.html
 * - Ignora pastas de sistema comuns (.git, node_modules, etc.)
 *
 * Uso:
 *   node auto-admin-once.js --dry
 *   node auto-admin-once.js --apply
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

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry") || !args.has("--apply");

// ALTERAÇÃO 1 (somente esta linha)
const FROM_IF_LINE = "if (localStorage.getItem('admin_mode') === 'true') {";
const TO_IF_LINE =
  "if (localStorage.getItem('admin_mode') === 'true' || new URLSearchParams(window.location.search).get('admin') === '1') {";

// ALTERAÇÃO 2 (somente inserir 1 linha logo após este console.log)
const CONSOLE_LINE = "      console.log('🚧 Modo Admin: Bloqueado.');";
const INSERT_AFTER_CONSOLE =
  "      if (new URLSearchParams(window.location.search).get('admin') === '1') localStorage.setItem('admin_mode','true');\n";

async function walk(dir) {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isSymbolicLink()) continue;

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith(".")) continue;
      await walk(fullPath);
      continue;
    }

    if (!entry.isFile()) continue;

    if (!entry.name.toLowerCase().endsWith(".html")) continue;
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

  // Só mexe se encontrar exatamente o trecho esperado
  if (!content.includes(FROM_IF_LINE)) return;
  if (!content.includes(CONSOLE_LINE)) return;

  let newContent = content;

  // Troca apenas a linha do IF
  newContent = newContent.replace(FROM_IF_LINE, TO_IF_LINE);

  // Insere apenas 1 linha após o console.log (sem alterar o console.log)
  newContent = newContent.replace(
    CONSOLE_LINE,
    CONSOLE_LINE + "\n" + INSERT_AFTER_CONSOLE.trimEnd()
  );

  if (newContent === content) return;

  if (DRY_RUN) {
    console.log(`[DRY] ${filePath}`);
    return;
  }

  await fsp.writeFile(filePath, newContent, "utf8");
  console.log(`[OK ] ${filePath}`);
}

(async () => {
  const root = process.cwd();
  console.log("========================================");
  console.log("Auto Admin (1 vez) - Atualizador HTML");
  console.log("Raiz:", root);
  console.log("Modo:", DRY_RUN ? "DRY (simulação)" : "APPLY (alterando arquivos)");
  console.log("========================================\n");

  await walk(root);

  console.log("\nConcluído.");
  if (DRY_RUN) {
    console.log("Nada foi alterado. Para aplicar: node auto-admin-once.js --apply");
  }
})();
