/**
 * mass-move-footer-to-end.js
 * ------------------------------------------------------------
 * Move o bloco do footer modularizado (placeholder + fetch footer.html)
 * para o FINAL do <body> (imediatamente antes de </body>).
 *
 * Objetivo: deixar o footer SEMPRE depois do bloco de comentários,
 * evitando que os comentários fiquem abaixo do rodapé.
 *
 * Regras:
 *  - Processa APENAS .html
 *  - Raiz (pt) + pastas de idiomas
 *  - NÃO entra/alterar: downloads/ e biblioteca/
 *  - NÃO altera arquivos/pastas bloqueados listados
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = process.cwd();

// Pastas de idiomas (como você listou)
const LANG_DIRS = [
  "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko",
  "tr", "nl", "pl", "sv", "id", "vi", "uk"
];

// Pastas que NUNCA podem ser tocadas
const ALWAYS_SKIP_DIRS = new Set(["downloads", "biblioteca"]);

// Pastas bloqueadas (não mexer em nenhum HTML dentro delas)
const BLOCKED_DIRS = new Set([
  "footer",
  "global-body-elements",
  "menu-global",
  "tecnologiaverde",
  "termos",
  "objetivos",
  "mapa-do-site",
  "politica",
  "missao",
  "nosso compromisso",
  "forum-enfermagem",
  "fale",
  "index"
]);

// Arquivos HTML específicos bloqueados
const BLOCKED_FILES = new Set([
  "downloads.html",
  "googlefc0a17cdd552164b.html",
  "index.html"
]);

function normSegments(p) {
  return p
    .split(path.sep)
    .filter(Boolean)
    .map(s => s.trim().toLowerCase());
}

function isHtmlFile(filePath) {
  return filePath.toLowerCase().endsWith(".html");
}

function shouldSkipByPath(filePath) {
  const rel = path.relative(REPO_ROOT, filePath);
  const segs = normSegments(rel);

  if (segs.some(s => ALWAYS_SKIP_DIRS.has(s))) return true;
  if (segs.some(s => BLOCKED_DIRS.has(s))) return true;

  const base = path.basename(filePath).toLowerCase();
  if (BLOCKED_FILES.has(base)) return true;

  return false;
}

function walkDir(dirPath, fileList = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dirPath, ent.name);

    if (ent.isDirectory()) {
      const nameLower = ent.name.toLowerCase();
      if (ALWAYS_SKIP_DIRS.has(nameLower)) continue;
      if (BLOCKED_DIRS.has(nameLower)) continue;
      walkDir(full, fileList);
      continue;
    }

    if (ent.isFile()) {
      if (!isHtmlFile(full)) continue;
      if (shouldSkipByPath(full)) continue;
      fileList.push(full);
    }
  }
  return fileList;
}

function getTargets() {
  const targets = [];

  // 1) HTML na raiz
  const rootEntries = fs.readdirSync(REPO_ROOT, { withFileTypes: true });
  for (const ent of rootEntries) {
    if (!ent.isFile()) continue;
    const full = path.join(REPO_ROOT, ent.name);
    if (!isHtmlFile(full)) continue;
    if (shouldSkipByPath(full)) continue;

    const base = ent.name.toLowerCase();
    const baseNoExt = base.replace(/\.html$/i, "");
    if (BLOCKED_DIRS.has(baseNoExt)) continue;
    if (BLOCKED_FILES.has(base)) continue;

    targets.push(full);
  }

  // 2) HTML nas pastas de idiomas
  for (const lang of LANG_DIRS) {
    const langPath = path.join(REPO_ROOT, lang);
    if (!fs.existsSync(langPath) || !fs.statSync(langPath).isDirectory()) continue;
    targets.push(...walkDir(langPath, []));
  }

  return targets;
}

/**
 * Regex robusto para pegar o bloco TODO do footer:
 * 1) procura <div id="footer-placeholder"...></div>
 * 2) em seguida pega um <script ...> ... fetch("footer.html" / '../footer.html' / './footer.html') ... </script>
 *
 * Aceita:
 *  - espaços, quebras, identação
 *  - <script> ou <script type="..."> ou <script defer> etc
 *  - aspas simples ou duplas
 *  - fetch("footer.html") / fetch('./footer.html') / fetch('../footer.html') / fetch("../../footer.html")
 */
function findFooterBlock(html) {
  const re = new RegExp(
    String.raw`(<div\b[^>]*\bid\s*=\s*["']footer-placeholder["'][^>]*>\s*<\/div>\s*` +
      String.raw`<script\b[^>]*>[\s\S]*?fetch\s*\(\s*["'](?:\.\/|(?:\.\.\/)*)?footer\.html["']\s*\)[\s\S]*?<\/script>)`,
    "i"
  );

  const m = html.match(re);
  if (!m) return null;
  return { fullMatch: m[1], index: m.index };
}

function moveFooterToEnd(html) {
  // precisa existir </body>
  const hasBodyClose = /<\/body\s*>/i.test(html);
  if (!hasBodyClose) return { changed: false, html };

  // encontrar bloco
  const found = findFooterBlock(html);
  if (!found) return { changed: false, html };

  // remover o bloco onde estiver
  let out = html.replace(found.fullMatch, "");

  // inserir no final do body (antes de </body>)
  out = out.replace(/<\/body\s*>/i, "\n" + found.fullMatch + "\n</body>");

  // limpeza leve de excesso de linhas em branco (sem “reformatar” o arquivo)
  out = out.replace(/\n{5,}/g, "\n\n\n\n");

  return { changed: out !== html, html: out };
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8");
  const res = moveFooterToEnd(original);
  if (!res.changed) return { changed: false };
  fs.writeFileSync(filePath, res.html, "utf8");
  return { changed: true };
}

function main() {
  const targets = getTargets();
  let changedCount = 0;
  let skippedCount = 0;
  const changedFiles = [];

  for (const f of targets) {
    try {
      const res = processFile(f);
      if (res.changed) {
        changedCount++;
        changedFiles.push(path.relative(REPO_ROOT, f));
      } else {
        skippedCount++;
      }
    } catch (err) {
      console.error("Erro em:", f);
      console.error(err);
    }
  }

  console.log("==============================================");
  console.log("Finalizado (mover footer para o fim do body).");
  console.log("Arquivos analisados:", targets.length);
  console.log("Arquivos modificados:", changedCount);
  console.log("Arquivos sem alteração (não tinha bloco ou sem </body>):", skippedCount);
  console.log("==============================================");

  if (changedFiles.length) {
    console.log("Lista de arquivos modificados:");
    for (const rel of changedFiles) console.log("-", rel);
  }
}

main();
