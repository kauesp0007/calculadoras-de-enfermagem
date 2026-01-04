#!/usr/bin/env node
/**
 * Reescreve dinamicamente o JSON-LD (schema.org) em todos os HTML do site,
 * usando dados do próprio arquivo (title/meta/canonical) no idioma correto.
 *
 * ✅ Inclui também SoftwareApplication (SEM rating), com preço grátis (0).
 * ✅ BreadcrumbList é extraído do <nav class="breadcrumb"> do próprio HTML (fiel ao conteúdo),
 *    com regras especiais:
 *    - href="#" / "#..." => NÃO cria item
 *    - href="index.html" (ou "./index.html") => vira home correta do idioma (https://.../de/ etc.)
 *
 * Regras atendidas:
 * - Varre raiz + pastas de idiomas
 * - NÃO altera /downloads e /biblioteca
 * - NÃO altera HTML específicos listados
 * - NÃO altera arquivos não-HTML
 * - Encontra <script type="application/ld+json"> ... </script> mesmo com variações de espaços/quebras
 * - Reescreve o schema com URL correta por idioma
 * - Log: total, corrigidos, ignorados, erros
 * - Opcional: roda 3 comandos no final (com flag)
 *
 * Uso:
 *   node fix-schema-all-html.js --dry
 *   node fix-schema-all-html.js --apply
 *   node fix-schema-all-html.js --apply --post
 */

const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const { execSync } = require("child_process");

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry") || !args.has("--apply"); // padrão seguro: dry-run
const RUN_POST = args.has("--post");

const SITE_BASE = "https://www.calculadorasdeenfermagem.com.br";

// Pastas de idiomas (raiz = pt)
const LANG_DIRS = new Set([
  "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl",
  "pl", "sv", "id", "vi", "uk"
]);

// Arquivos HTML que NÃO podem ser alterados (em qualquer lugar)
const DO_NOT_TOUCH_HTML = new Set([
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html",
]);

// Excluir pastas do sistema e as duas que você pediu
const EXCLUDES = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.github/**",
  "**/.vscode/**",
  "**/dist/**",
  "**/build/**",
  "**/downloads/**",
  "**/biblioteca/**",
];

// Mapeia pasta -> BCP47 para inLanguage
const IN_LANGUAGE = {
  "pt": "pt-BR",
  "en": "en",
  "es": "es",
  "de": "de",
  "it": "it",
  "fr": "fr",
  "hi": "hi",
  "zh": "zh",
  "ar": "ar",
  "ja": "ja",
  "ru": "ru",
  "ko": "ko",
  "tr": "tr",
  "nl": "nl",
  "pl": "pl",
  "sv": "sv",
  "id": "id",
  "vi": "vi",
  "uk": "uk",
};

function isExcludedHtml(filePath) {
  const base = path.basename(filePath);
  if (DO_NOT_TOUCH_HTML.has(base)) return true;

  // redundância de segurança:
  const norm = filePath.replace(/\\/g, "/");
  if (norm.includes("/downloads/") || norm.includes("/biblioteca/")) return true;

  return false;
}

function getLangFromPath(filePath) {
  const norm = filePath.replace(/\\/g, "/");
  const first = norm.split("/")[0];
  if (LANG_DIRS.has(first)) return first;
  return "pt"; // raiz do repositório = pt-BR
}

function extractTagContent(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const m = html.match(re);
  return m ? m[1].trim().replace(/\s+/g, " ") : "";
}

function extractMetaDescription(html) {
  const re = /<meta\b[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/i;
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function extractCanonical(html) {
  const re = /<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i;
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function normalizeUrl(url) {
  return url.trim();
}

function buildUrlFromFile(filePath, lang) {
  const norm = filePath.replace(/\\/g, "/");
  let rel = norm;

  if (lang === "pt") {
    rel = norm.replace(/^\/+/, "");
  } else {
    if (!rel.startsWith(lang + "/")) rel = `${lang}/${path.basename(norm)}`;
  }

  return `${SITE_BASE}/${rel}`;
}

function cleanTitleForName(title) {
  return title || "";
}

/**
 * (somente para SoftwareApplication)
 * Cria nome curto a partir do <title>, removendo sufixos comuns.
 */
function getShortToolNameFromTitle(title) {
  if (!title) return "";

  const patterns = [
    /\s[-–—]\sCalculadoras de Enfermagem\s*$/i,
    /\s[-–—]\sCalculadoras de Enfermer[ií]a\s*$/i,
    /\s[-–—]\sNursing Calculators\s*$/i,
    /\s[-–—]\s.*Calculadoras.*\s*$/i,
  ];

  let out = title.trim();
  for (const p of patterns) out = out.replace(p, "").trim();
  out = out.replace(/\s\|\s.*$/i, "").trim();

  return out || title;
}

function detectIndentBeforeScript(html, scriptIndex) {
  const lineStart = html.lastIndexOf("\n", scriptIndex);
  if (lineStart === -1) return "";
  const before = html.slice(lineStart + 1, scriptIndex);
  const match = before.match(/^[\t ]+/);
  return match ? match[0] : "";
}

function findJsonLdScriptBlocks(html) {
  const re = /<script\b([\s\S]*?)type\s*=\s*["']application\/ld\+json["']([\s\S]*?)>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push({
      full: m[0],
      a1: m[1],
      a2: m[2],
      inner: m[3],
      index: m.index,
    });
  }
  return blocks;
}

function parseExistingDatesFromJsonLd(innerText) {
  const raw = innerText.trim();
  try {
    const obj = JSON.parse(raw);
    const pages = [];
    if (obj && Array.isArray(obj["@graph"])) pages.push(...obj["@graph"]);
    else pages.push(obj);

    const page = pages.find(x => x && (x["@type"] === "MedicalWebPage" || x["@type"] === "WebPage")) || null;
    if (!page) return {};
    const out = {};
    if (typeof page.datePublished === "string") out.datePublished = page.datePublished;
    if (typeof page.dateModified === "string") out.dateModified = page.dateModified;
    return out;
  } catch {
    return {};
  }
}

/**
 * ✅ NOVA função (trocada): resolve href para URL absoluta,
 * com regras:
 * - "#" / "#..." => null (não criar item)
 * - "index.html" ou "./index.html" => home do idioma (https://.../de/ etc.)
 */
function resolveToAbsoluteUrl(href, pageUrlAbs, lang) {
  if (!href) return null;

  const h = href.trim();

  // placeholders / anchors => não criar item
  if (h === "#" || h === "" || h.startsWith("#")) return null;

  // Home do idioma: index.html ou ./index.html
  if (/^(?:\.\/)?index\.html$/i.test(h)) {
    return (lang === "pt") ? `${SITE_BASE}/` : `${SITE_BASE}/${lang}/`;
  }

  // já é absoluto
  if (/^https?:\/\//i.test(h)) return h;

  // se começa com "/", é raiz do domínio
  if (h.startsWith("/")) return `${SITE_BASE}${h}`;

  // relativo: resolve pelo diretório da página
  try {
    const u = new URL(pageUrlAbs);
    const baseDir = u.pathname.endsWith("/") ? u.pathname : u.pathname.replace(/[^/]+$/, "");
    return `${u.origin}${baseDir}${h}`.replace(/\/\.\//g, "/");
  } catch {
    return `${SITE_BASE}/${h}`;
  }
}

/**
 * ✅ Atualizada: Extrai breadcrumb do HTML e usa resolveToAbsoluteUrl(..., lang)
 */
function extractBreadcrumbFromHtml(html, pageUrlAbs, lang) {
  const navMatch = html.match(/<nav\b[^>]*class\s*=\s*["'][^"']*\bbreadcrumb\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  if (!navMatch) return null;

  const navInner = navMatch[1];

  const olMatch = navInner.match(/<ol\b[^>]*>([\s\S]*?)<\/ol>/i);
  const listHtml = olMatch ? olMatch[1] : navInner;

  const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  const items = [];
  let m;

  while ((m = liRegex.exec(listHtml)) !== null) {
    const liInner = (m[1] || "").trim();

    const aMatch = liInner.match(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);

    if (aMatch) {
      const href = aMatch[1].trim();
      const text = (aMatch[2] || "").replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
      if (!text) continue;

      const abs = resolveToAbsoluteUrl(href, pageUrlAbs, lang);

      const obj = { name: text };
      if (abs) obj.item = abs; // só coloca item se for válido (não #)
      items.push(obj);
    } else {
      const text = liInner.replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");
      if (!text) continue;
      items.push({ name: text });
    }
  }

  return items.length ? items : null;
}

function buildSchema({ lang, url, title, description, existingDates, breadcrumbItems }) {
  const inLanguage = IN_LANGUAGE[lang] || lang;
  const pageName = cleanTitleForName(title) || url;

  const webpageId = `${url}${url.includes("#") ? "" : "/"}#webpage`;
  const primaryImageId = `${url}${url.includes("#") ? "" : "/"}#primaryimage`;

  // IDs globais
  const websiteId = `${SITE_BASE}/#website`;
  const orgId = `${SITE_BASE}/#organization`;

  // ID do app (software)
  const appId = `${url}${url.includes("#") ? "" : "/"}#app`;

  const medicalWebPage = {
    "@type": "MedicalWebPage",
    "@id": webpageId,
    "url": url,
    "name": pageName,
    ...(description ? { "description": description } : {}),
    "inLanguage": inLanguage,
    "isPartOf": { "@id": websiteId },
    "primaryImageOfPage": { "@id": primaryImageId },
    ...(existingDates?.datePublished ? { "datePublished": existingDates.datePublished } : {}),
    ...(existingDates?.dateModified ? { "dateModified": existingDates.dateModified } : {}),
    "author": { "@id": orgId },
    "audience": { "@type": "MedicalAudience", "audienceType": "Clinician" },
    "specialty": { "@type": "MedicalSpecialty", "name": "Nursing" },
  };

  // SoftwareApplication (SEM rating), grátis
  const softwareApplication = {
    "@type": "SoftwareApplication",
    "@id": appId,
    "name": getShortToolNameFromTitle(title) || pageName || url,
    "operatingSystem": "Web",
    "applicationCategory": "HealthApplication",
    "isAccessibleForFree": true,
    "inLanguage": inLanguage,
    "offers": {
      "@type": "Offer",
      "price": 0,
      "priceCurrency": "BRL",
      "url": url
    },
    "publisher": { "@id": orgId }
  };

  // BreadcrumbList do HTML (se existir).
  // Se não existir, cria um breadcrumb mínimo (Home + página).
  let breadcrumbList;
  if (breadcrumbItems && breadcrumbItems.length) {
    breadcrumbList = {
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbItems.map((it, idx) => {
        const o = {
          "@type": "ListItem",
          "position": idx + 1,
          "name": it.name
        };
        if (it.item) o.item = it.item;
        return o;
      })
    };
  } else {
    const homeUrl = (lang === "pt") ? `${SITE_BASE}/` : `${SITE_BASE}/${lang}/`;
    breadcrumbList = {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": homeUrl },
        { "@type": "ListItem", "position": 2, "name": pageName, "item": url }
      ]
    };
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        "name": "Calculadoras de Enfermagem",
        "url": SITE_BASE,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_BASE}/assets/logo.png`
        }
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        "url": SITE_BASE,
        "name": "Calculadoras de Enfermagem",
        "inLanguage": "pt-BR"
      },
      softwareApplication,
      medicalWebPage,
      breadcrumbList
    ]
  };

  return schema;
}

function rewriteFirstJsonLdBlock(html, filePath) {
  const blocks = findJsonLdScriptBlocks(html);
  if (!blocks.length) {
    return { changed: false, reason: "sem_jsonld" };
  }

  // Preferir o que contém "@context" ou "@graph"
  let target = blocks.find(b => /"@context"\s*:/.test(b.inner) || /"@graph"\s*:/.test(b.inner));
  if (!target) target = blocks[0];

  const lang = getLangFromPath(filePath);

  const canonical = extractCanonical(html);
  const url = normalizeUrl(canonical || buildUrlFromFile(filePath, lang));

  const title = extractTagContent(html, "title");
  const description = extractMetaDescription(html) || "";

  const existingDates = parseExistingDatesFromJsonLd(target.inner);

  // ✅ Ajuste de linha: agora passa lang também
  const breadcrumbItems = extractBreadcrumbFromHtml(html, url, lang);

  const schemaObj = buildSchema({ lang, url, title, description, existingDates, breadcrumbItems });

  const pretty = JSON.stringify(schemaObj, null, 2);

  const baseIndent = detectIndentBeforeScript(html, target.index);
  const jsonIndent = baseIndent + "  ";
  const indentedJson = pretty.split("\n").map(line => jsonIndent + line).join("\n");

  const rebuilt =
    `<script${target.a1}type="application/ld+json"${target.a2}>\n` +
    `${indentedJson}\n` +
    `${baseIndent}</script>`;

  const newHtml = html.slice(0, target.index) + rebuilt + html.slice(target.index + target.full.length);

  const changed = newHtml !== html;
  return { changed, newHtml, reason: changed ? "ok" : "igual" };
}

function runPostCommands() {
  const cmds = [
    "node biblioteca-automation.js",
    ".\\node_modules\\.bin\\tailwindcss -i ./src/input.css -o ./public/output.css --minify",
    "node gerar-sw.js",
  ];

  console.log("\n▶ Rodando comandos pós-processamento...");
  for (const cmd of cmds) {
    console.log(`\n$ ${cmd}`);
    execSync(cmd, { stdio: "inherit", shell: true });
  }
}

async function main() {
  const patterns = ["**/*.html"];
  const files = await fg(patterns, { ignore: EXCLUDES, onlyFiles: true, dot: true });

  let scanned = 0;
  let skipped = 0;
  let fixed = 0;
  let unchanged = 0;

  const errors = [];

  for (const file of files) {
    scanned++;

    if (isExcludedHtml(file)) {
      skipped++;
      continue;
    }

    const html = fs.readFileSync(file, "utf8");

    try {
      const res = rewriteFirstJsonLdBlock(html, file);

      if (!res.changed) {
        unchanged++;
        continue;
      }

      fixed++;
      if (!DRY) fs.writeFileSync(file, res.newHtml, "utf8");

    } catch (e) {
      errors.push({ file, message: e.message });
    }
  }

  console.log("\n==================== RELATÓRIO ====================");
  console.log(`Modo:         ${DRY ? "DRY-RUN (não escreveu arquivos)" : "APPLY (alterações gravadas)"}`);
  console.log(`Escaneados:   ${scanned}`);
  console.log(`Ignorados:    ${skipped}`);
  console.log(`Corrigidos:   ${fixed}`);
  console.log(`Sem mudança:  ${unchanged}`);
  console.log(`Erros:        ${errors.length}`);
  console.log("===================================================\n");

  if (errors.length) {
    console.log("⚠ Arquivos com erro (primeiros 50):");
    for (const err of errors.slice(0, 50)) {
      console.log(`- ${err.file}: ${err.message}`);
    }
    if (errors.length > 50) console.log(`... e mais ${errors.length - 50} erro(s).`);
    process.exitCode = 1;
  }

  if (!DRY && RUN_POST) {
    runPostCommands();
  } else if (!DRY && !RUN_POST) {
    console.log("ℹ Pós-comandos não executados. Use --post para rodar os 3 comandos no final.");
  } else {
    console.log("ℹ Você está em DRY-RUN. Para aplicar de verdade, use: node fix-schema-all-html.js --apply");
  }
}

main().catch((e) => {
  console.error("Erro fatal:", e);
  process.exit(1);
});
