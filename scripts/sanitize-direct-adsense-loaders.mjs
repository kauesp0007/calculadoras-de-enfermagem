#!/usr/bin/env node
"use strict";

/**
 * Normalização canônica do carregamento do AdSense.
 *
 * Remove somente tags <script src="...adsbygoogle.js..."> presentes nas
 * páginas públicas da raiz e nas 18 pastas de idioma. O carregamento passa
 * a ficar centralizado exclusivamente em global-scripts.js.
 *
 * Pastas como biblioteca/, blog/, downloads/, automacoes/, js/, etc. não são
 * percorridas. Arquivos globais protegidos também não são alterados.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const LANGUAGE_FOLDERS = [
  "en","es","fr","it","de","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"
];

const PROTECTED_HTML_NAMES = new Set([
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html"
]);

const DIRECT_AD_LOADER = /<script\b[^>]*\bsrc=[\"'][^\"']*pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^\"']*[\"'][^>]*>\s*<\/script>\s*/gi;

function allowedHtmlFiles() {
  const files = [];

  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (
      entry.isFile() &&
      /\.html$/i.test(entry.name) &&
      !PROTECTED_HTML_NAMES.has(entry.name)
    ) {
      files.push(path.join(ROOT, entry.name));
    }
  }

  for (const lang of LANGUAGE_FOLDERS) {
    const dir = path.join(ROOT, lang);
    if (!fs.existsSync(dir)) continue;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (
        entry.isFile() &&
        /\.html$/i.test(entry.name) &&
        !PROTECTED_HTML_NAMES.has(entry.name)
      ) {
        files.push(path.join(dir, entry.name));
      }
    }
  }

  return files;
}

let changedFiles = 0;
let removedLoaders = 0;

for (const file of allowedHtmlFiles()) {
  const original = fs.readFileSync(file, "utf8");
  const matches = original.match(DIRECT_AD_LOADER);
  DIRECT_AD_LOADER.lastIndex = 0;

  if (!matches || matches.length === 0) continue;

  const updated = original.replace(DIRECT_AD_LOADER, "");
  if (updated === original) continue;

  fs.writeFileSync(file, updated, "utf8");
  changedFiles += 1;
  removedLoaders += matches.length;
}

console.log(
  "✅ Normalização AdSense: " +
  removedLoaders +
  " carregador(es) direto(s) removido(s) em " +
  changedFiles +
  " arquivo(s)."
);
