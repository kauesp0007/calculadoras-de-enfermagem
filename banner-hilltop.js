#!/usr/bin/env node
/**
 * banner-hilltop.js
 *
 * O que faz:
 * - Varre arquivos .html:
 *   - na raiz do repositório (somente os .html em PT)
 *   - e dentro das pastas de idiomas:
 *     en/, es/, de/, it/, fr/, hi/, zh/, ar/, ja/, ru/, ko/, tr/, nl/, pl/, sv/, id/, vi/, uk/
 * - NÃO avalia nada dentro de: downloads/ e biblioteca/ (em qualquer profundidade)
 * - NÃO altera arquivos HTML com nomes específicos (lista abaixo)
 * - Em cada HTML elegível:
 *   - Se já existir <div id="hilltop-ref-banner"></div> (ou o id em qualquer <div>), não altera.
 *   - Se NÃO existir, insere exatamente:
 *       <div id="hilltop-ref-banner"></div>
 *     logo acima (antes) da linha:
 *       <script src="/lang-selector.js" defer=""></script>
 *     (aceita variações de defer e aspas)
 * - Ao final, imprime no terminal:
 *   - total analisados
 *   - alterados
 *   - já conformes (não precisaram)
 *   - ignorados por regra
 *   - sem âncora (não encontrou o script do lang-selector)
 *
 * Como usar:
 *   node banner-hilltop.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const LANG_DIRS = new Set([
  "en","es","de","it","fr","hi","zh","ar","ja","ru","ko","tr","nl","pl","sv","id","vi","uk"
]);

const EXCLUDED_DIRS = new Set(["downloads", "biblioteca"]);

const EXCLUDED_FILENAMES = new Set([
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html"
]);

const PLACEHOLDER_HTML = `<div id="hilltop-ref-banner"></div>`;

// âncora: <script src="/lang-selector.js" defer=""></script>
// Aceita: defer, defer="", defer=''
// Aceita espaços/atributos extras, aspas simples/duplas, e fechamento </script>
const LANG_SELECTOR_SCRIPT_RE = /<script\b[^>]*\bsrc\s*=\s*["']\/lang-selector\.js["'][^>]*>\s*<\/script>/i;

// detectar se já tem o placeholder (id) em qualquer div
const HAS_PLACEHOLDER_RE = /<div\b[^>]*\bid\s*=\s*["']hilltop-ref-banner["'][^>]*>/i;

function isHtmlFile(p) {
  return p.toLowerCase().endsWith(".html");
}

function shouldScanPath(relPath) {
  // Nunca tocar em pastas do sistema (node_modules/.git/etc.)
  // (Você disse “não alterar arquivos/pastas do sistema”; isso ajuda a evitar isso.)
  const parts = relPath.split(path.sep).filter(Boolean);
  if (parts.length === 0) return true;

  const top = parts[0];
  if (top.startsWith(".")) return false; // .git, .github, etc.
  if (top === "node_modules") return false;

  // excluir downloads/ e biblioteca/ em qualquer profundidade
  if (parts.some(p => EXCLUDED_DIRS.has(p))) return false;

  return true;
}

function isInAllowedScope(relPath) {
  // permitido:
  // - html na raiz
  // - html dentro das pastas de idiomas listadas (qualquer profundidade)
  const parts = relPath.split(path.sep).filter(Boolean);
  if (parts.length === 1) {
    // raiz
    return true;
  }
  const top = parts[0];
  return LANG_DIRS.has(top);
}

function walkDir(dirAbs, relBase = "") {
  let results = [];
  const items = fs.readdirSync(dirAbs, { withFileTypes: true });

  for (const it of items) {
    const abs = path.join(dirAbs, it.name);
    const rel = path.join(relBase, it.name);

    if (!shouldScanPath(rel)) continue;

    if (it.isDirectory()) {
      // só descer em diretórios relevantes:
      // - raiz (relBase == "")
      // - ou diretórios de idioma (top-level)
      if (relBase === "") {
        // na raiz: só entra se for um idioma permitido
        if (LANG_DIRS.has(it.name)) {
          results = results.concat(walkDir(abs, rel));
        }
        // não entra em outras pastas na raiz (evita “sistema” e pastas do seu app)
        continue;
      } else {
        // dentro de um idioma: pode descer normalmente (exceto pastas excluídas)
        results = results.concat(walkDir(abs, rel));
      }
    } else if (it.isFile()) {
      if (!isHtmlFile(it.name)) continue;
      if (!isInAllowedScope(rel)) continue;
      if (EXCLUDED_FILENAMES.has(it.name)) continue;

      results.push({ abs, rel });
    }
  }

  return results;
}

function injectPlaceholderBeforeLangSelector(html) {
  if (HAS_PLACEHOLDER_RE.test(html)) {
    return { changed: false, reason: "already_ok", html };
  }

  const m = html.match(LANG_SELECTOR_SCRIPT_RE);
  if (!m) {
    return { changed: false, reason: "no_anchor", html };
  }

  // Inserir imediatamente ANTES do primeiro match do script de lang-selector
  // Com quebra de linha “limpa”: tenta respeitar estilo (se houver \r\n, usa \r\n)
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  const insert = PLACEHOLDER_HTML + nl;

  const newHtml = html.replace(LANG_SELECTOR_SCRIPT_RE, insert + m[0]);

  // Segurança: se por algum motivo não mudou, marca como não alterado
  if (newHtml === html) {
    return { changed: false, reason: "no_change", html };
  }

  return { changed: true, reason: "injected", html: newHtml };
}

function main() {
  const files = [];

  // 1) HTML da raiz
  const rootItems = fs.readdirSync(ROOT, { withFileTypes: true });
  for (const it of rootItems) {
    if (!it.isFile()) continue;
    if (!isHtmlFile(it.name)) continue;
    if (EXCLUDED_FILENAMES.has(it.name)) continue;

    const abs = path.join(ROOT, it.name);
    const rel = it.name;
    files.push({ abs, rel });
  }

  // 2) HTML dos idiomas
  for (const lang of LANG_DIRS) {
    const langAbs = path.join(ROOT, lang);
    if (fs.existsSync(langAbs) && fs.statSync(langAbs).isDirectory()) {
      files.push(...walkDir(langAbs, lang));
    }
  }

  let altered = 0;
  let alreadyOk = 0;
  let noAnchor = 0;
  let ignored = 0; // aqui fica 0 porque já filtramos antes; mantido para clareza
  let scanned = 0;

  for (const f of files) {
    scanned++;

    let html;
    try {
      html = fs.readFileSync(f.abs, "utf8");
    } catch (e) {
      console.warn(`⚠️ Falha ao ler: ${f.rel} (${e.message})`);
      continue;
    }

    const res = injectPlaceholderBeforeLangSelector(html);

    if (res.changed) {
      try {
        fs.writeFileSync(f.abs, res.html, "utf8");
        altered++;
        console.log(`✅ Alterado: ${f.rel}`);
      } catch (e) {
        console.warn(`⚠️ Falha ao escrever: ${f.rel} (${e.message})`);
      }
    } else {
      if (res.reason === "already_ok") {
        alreadyOk++;
      } else if (res.reason === "no_anchor") {
        noAnchor++;
        console.log(`ℹ️ Sem âncora (lang-selector não encontrado): ${f.rel}`);
      } else {
        alreadyOk++; // fallback
      }
    }
  }

  console.log("\n==================== RESUMO ====================");
  console.log(`Total analisados:              ${scanned}`);
  console.log(`Arquivos alterados:            ${altered}`);
  console.log(`Já estavam em conformidade:    ${alreadyOk}`);
  console.log(`Sem âncora do lang-selector:   ${noAnchor}`);
  console.log(`Ignorados por regra:           ${ignored}`);
  console.log("================================================\n");
}

main();
