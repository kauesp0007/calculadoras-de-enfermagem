#!/usr/bin/env node
/* eslint-env node */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process"); // Adicionado para rodar comandos do terminal

/**
 * =========================
 * CONFIG
 * =========================
 */
const SITE = "https://www.calculadorasdeenfermagem.com.br";

// Ordem EXATA que você quer
const LANGS = [
  { hreflang: "pt-br", folder: "" },   // raiz
  { hreflang: "en", folder: "en" },
  { hreflang: "es", folder: "es" },
  { hreflang: "fr", folder: "fr" },
  { hreflang: "de", folder: "de" },
  { hreflang: "it", folder: "it" },
  { hreflang: "ja", folder: "ja" },
  { hreflang: "zh", folder: "zh" },
  { hreflang: "hi", folder: "hi" },
  { hreflang: "ar", folder: "ar" },
  { hreflang: "ru", folder: "ru" },
  { hreflang: "tr", folder: "tr" },
  { hreflang: "ko", folder: "ko" },
  { hreflang: "nl", folder: "nl" },
  { hreflang: "pl", folder: "pl" },
  { hreflang: "sv", folder: "sv" },
  { hreflang: "id", folder: "id" },
  { hreflang: "vi", folder: "vi" },
  { hreflang: "uk", folder: "uk" },
  { hreflang: "x-default", folder: "" }, // x-default aponta para raiz
];

// Pastas/arquivos que NÃO podem ser alterados
const EXCLUDE_DIRS = new Set(["downloads", "biblioteca"]);
const EXCLUDE_FILES = new Set([
  "downloads.html",
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html",
]);

// Só atualizar arquivos que JÁ têm hreflang?
const ONLY_IF_HAS_HREFLANG = true;

// Se true, só imprime o que faria (não grava)
const DRY_RUN = false;

// Se false, só inclui hreflang se o arquivo existir naquele idioma
const INCLUDE_MISSING_FILES = false;

/**
 * =========================
 * HELPERS
 * =========================
 */
function isHtmlFile(p) {
  return p.toLowerCase().endsWith(".html");
}

function normalizeSlashes(p) {
  return p.split(path.sep).join("/");
}

function getAllHtmlFiles(rootDir) {
  const out = [];
  const stack = [rootDir];

  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });

    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        if (EXCLUDE_DIRS.has(ent.name)) continue;
        stack.push(full);
      } else if (ent.isFile()) {
        if (!isHtmlFile(ent.name)) continue;
        if (EXCLUDE_FILES.has(ent.name)) continue;
        out.push(full);
      }
    }
  }
  return out;
}

/**
 * Dado o caminho do arquivo (no repo), detecta:
 * - idioma da pasta (se existir)
 * - "basePath" do arquivo dentro do idioma (ex.: apache.html, calculadoras/foo.html)
 *
 * Ex:
 * /de/apache.html => langFolder="de", basePath="apache.html"
 * /apache.html    => langFolder="", basePath="apache.html"
 * /en/sub/x.html  => langFolder="en", basePath="sub/x.html"
 */
function detectLangAndBasePath(repoRoot, filePath) {
  const rel = normalizeSlashes(path.relative(repoRoot, filePath));
  const parts = rel.split("/").filter(Boolean);

  if (parts.length === 0) return { langFolder: "", basePath: "" };

  const first = parts[0];
  const knownLangFolders = new Set(LANGS.map(l => l.folder).filter(Boolean));

  if (knownLangFolders.has(first)) {
    return {
      langFolder: first,
      basePath: parts.slice(1).join("/"),
    };
  }

  return {
    langFolder: "",
    basePath: parts.join("/"),
  };
}

function buildHref(langFolder, basePath) {
  // raiz
  if (!langFolder) {
    return `${SITE}/${basePath}`;
  }
  return `${SITE}/${langFolder}/${basePath}`;
}

function fileExistsForLang(repoRoot, langFolder, basePath) {
  const full = langFolder
    ? path.join(repoRoot, langFolder, ...basePath.split("/"))
    : path.join(repoRoot, ...basePath.split("/"));
  return fs.existsSync(full);
}

function hasHreflangBlock(html) {
  return /<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["'][^"']+["'][^>]*>/i.test(html);
}

function removeAllHreflangLinks(html) {
  // remove apenas <link rel="alternate" hreflang="..."> (não mexe em alternates sem hreflang)
  return html.replace(
    /^\s*<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["'][^"']+["'][^>]*>\s*$/gim,
    ""
  );
}

function insertHreflangBlock(html, block) {
  // tenta inserir logo após canonical
  const canonicalRe = /<link\s+[^>]*rel=["']canonical["'][^>]*>\s*/i;
  if (canonicalRe.test(html)) {
    return html.replace(canonicalRe, (m) => `${m}\n${block}\n`);
  }

  // fallback: inserir no fim do <head> (antes de </head>)
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `\n${block}\n</head>`);
  }

  // fallback final: adiciona no topo
  return `${block}\n${html}`;
}

function buildHreflangBlock(repoRoot, basePath) {
  const lines = [];

  for (const lang of LANGS) {
    const langFolder = lang.folder;
    const hreflang = lang.hreflang;

    // x-default segue a mesma regra do pt-br (raiz)
    const effectiveFolder = hreflang === "x-default" ? "" : langFolder;

    if (!INCLUDE_MISSING_FILES) {
      if (!fileExistsForLang(repoRoot, effectiveFolder, basePath)) continue;
    }

    const href = buildHref(effectiveFolder, basePath);
    lines.push(`<link rel="alternate" hreflang="${hreflang}" href="${href}">`);
  }

  return lines.join("\n");
}

/**
 * =========================
 * MAIN
 * =========================
 */
function main() {
  const repoRoot = process.cwd();
  const files = getAllHtmlFiles(repoRoot);

  let updated = 0;
  let skippedNoHreflang = 0;
  let skippedNoHead = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    if (!/<head[\s>]/i.test(raw)) {
      skippedNoHead++;
      continue;
    }

    if (ONLY_IF_HAS_HREFLANG && !hasHreflangBlock(raw)) {
      skippedNoHreflang++;
      continue;
    }

    const { basePath } = detectLangAndBasePath(repoRoot, file);
    if (!basePath) continue;

    const cleaned = removeAllHreflangLinks(raw);

    const block = buildHreflangBlock(repoRoot, basePath);

    // Se por algum motivo não gerou nenhum link (ex.: arquivos faltando e INCLUDE_MISSING_FILES=false)
    if (!block.trim()) continue;

    const next = insertHreflangBlock(cleaned, block);

    if (next !== raw) {
      updated++;
      if (DRY_RUN) {
        console.log(`(DRY_RUN) Atualizaria: ${normalizeSlashes(path.relative(repoRoot, file))}`);
      } else {
        fs.writeFileSync(file, next, "utf8");
        console.log(`✅ Atualizado: ${normalizeSlashes(path.relative(repoRoot, file))}`);
      }
    }
  }

  console.log("\n=== RESUMO ===");
  console.log(`Arquivos analisados: ${files.length}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Pulados (sem hreflang): ${skippedNoHreflang}`);
  console.log(`Pulados (sem <head>): ${skippedNoHead}`);
  console.log(`DRY_RUN: ${DRY_RUN ? "ON" : "OFF"}`);
  console.log(`INCLUDE_MISSING_FILES: ${INCLUDE_MISSING_FILES ? "ON" : "OFF"}`);

  // -------------------------------------------------------------
  // NOVOS COMANDOS DE AUTOMAÇÃO PÓS-PROCESSAMENTO
  // -------------------------------------------------------------
  if (!DRY_RUN) {
    console.log("\n=== INICIANDO PROCESSOS PÓS-ATUALIZAÇÃO ===");

    try {
      // 1- node biblioteca-automation.js
      console.log("> Executando: node biblioteca-automation.js");
      execSync("node biblioteca-automation.js", { stdio: "inherit" });

      // 2- tailwindcss
      console.log("> Executando: Tailwind CSS Build");
      execSync(
        ".\\node_modules\\.bin\\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
        { stdio: "inherit" }
      );

      // 3- node gerar-sw.js
      console.log("> Executando: node gerar-sw.js");
      execSync("node gerar-sw.js", { stdio: "inherit" });

      console.log("\n✅ Todos os processos de automação foram concluídos com sucesso.");
    } catch (error) {
      console.error("\n❌ Erro durante a execução dos comandos de automação:");
      console.error(error.message);
      // Opcional: process.exit(1) se quiser que o script falhe completamente
    }
  }
}

main();