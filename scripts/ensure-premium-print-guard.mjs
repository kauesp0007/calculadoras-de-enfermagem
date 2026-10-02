#!/usr/bin/env node
/**
 * Garante que todo HTML de usuário da raiz e das 18 pastas de idioma que
 * contenha uma ação real de impressão carregue /global-scripts.js.
 *
 * --apply  adiciona o script global quando estiver ausente.
 * --audit  falha se restar alguma página imprimível sem o guard central.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const LANGS = ["en","es","fr","it","de","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"];
const APPLY = process.argv.includes("--apply");
const AUDIT = process.argv.includes("--audit");

const EXCLUDED_NAMES = new Set([
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "_language_selector.html",
  "menu-lateral.html",
  "googlefc0a17cdd552164b.html"
]);

const PRINT_SIGNALS = [
  /\bwindow\s*\.\s*print\s*\(/i,
  /\b[a-z_$][\w$]*\s*\.\s*print\s*\(/i,
  /data-(?:action|form-action|premium-print)\s*=\s*["'][^"']*(?:print|imprim)/i,
  /onclick\s*=\s*["'][^"']*(?:print|imprim|impression|stampa|druck|afdruk|drukuj|wydruk|yazd[ıi]r|cetak|печ|друк|印刷|打印|인쇄|प्रिंट|طباعة)/i,
  /\b(?:print|imprim\w*|impression\w*|stampa\w*|druck\w*|afdruk\w*|drukuj\w*|wydruk\w*|yazd[ıi]r\w*|cetak\w*|распечат\w*|надрук\w*)\s*\(/i
];

function hasPrintAction(html) {
  return PRINT_SIGNALS.some((re) => re.test(html));
}

function hasGlobalScripts(html) {
  return /<script\b[^>]*\bsrc=["']\/global-scripts\.js(?:[?#][^"']*)?["'][^>]*>/i.test(html);
}

function injectGlobalScripts(html) {
  const tag = '<script src="/global-scripts.js" defer></script>';
  if (hasGlobalScripts(html)) return html;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, tag + "\n</head>");
  if (/<body\b/i.test(html)) return html.replace(/<body\b/i, tag + "\n<body");
  return tag + "\n" + html;
}

async function directHtmlFiles(dir, prefix = "") {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html") && !EXCLUDED_NAMES.has(entry.name))
    .map((entry) => ({
      abs: path.join(dir, entry.name),
      rel: prefix ? prefix + "/" + entry.name : entry.name
    }));
}

let files = await directHtmlFiles(ROOT);
for (const lang of LANGS) {
  files = files.concat(await directHtmlFiles(path.join(ROOT, lang), lang));
}

const printable = [];
const changed = [];
const missing = [];

for (const file of files) {
  let html = await fs.readFile(file.abs, "utf8");
  if (!hasPrintAction(html)) continue;

  printable.push(file.rel);
  if (hasGlobalScripts(html)) continue;

  missing.push(file.rel);
  if (APPLY) {
    html = injectGlobalScripts(html);
    await fs.writeFile(file.abs, html, "utf8");
    changed.push(file.rel);
  }
}

let remaining = [];
if (APPLY) {
  for (const rel of printable) {
    const abs = path.join(ROOT, ...rel.split("/"));
    const html = await fs.readFile(abs, "utf8");
    if (!hasGlobalScripts(html)) remaining.push(rel);
  }
} else {
  remaining = missing.slice();
}

console.log(JSON.stringify({
  ok: remaining.length === 0,
  scannedHtml: files.length,
  printableHtml: printable.length,
  changed: changed.length,
  missingBeforeApply: missing.length,
  missingAfterApply: remaining.length,
  printable,
  changedPaths: changed,
  missingPaths: remaining
}, null, 2));

if ((AUDIT || APPLY) && remaining.length) process.exit(2);
