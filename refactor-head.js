/**
 * refactor-head.js (HEAD-ORDER + CSS PRELOAD) - SEM PRELOAD IMAGE MOVE
 *
 * Faz:
 * - Reorganiza SOMENTE o <head>
 * - Converte CSS principal (output/global) para preload+noscript (sem alterar href)
 * - Converte CSS com print-hack para preload+noscript (sem alterar href)
 * - Organiza preload fetch (as="fetch")
 * - NÃO reorganiza nem mexe nos preload de imagens (as="image") -> fica como está
 * - Mantém title/meta/canonical/hreflang intactos
 * - Não altera caminhos (href/src) nem body
 * - Remove apenas AdSense incorreto ca-pub-9472305505608641
 * - Formata com js-beautify (não minifica)
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const beautify = require("js-beautify").html;

// -------------------- CONFIG --------------------
const ROOT = process.cwd();
const DRY_RUN = false;

const IGNORE_DIRS = new Set(["downloads", "biblioteca"]);
const IGNORE_FILES = new Set([
  "downloads.html",
  "footer.html",
  "global-body-elements.html",
  "menu-global.html",
  "_language_selector.html",
]);

const BAD_ADSENSE_CLIENT = "ca-pub-9472305505608641";
const HINT_RELS = new Set(["preconnect", "dns-prefetch"]);

// CSS principal (reconhece por “terminar com”, sem mudar href)
const MAIN_CSS_MATCHERS = [
  /(^|\/)public\/output\.css(\?|#|$)/i,
  /(^|\/)global-styles\.css(\?|#|$)/i
];

// -------------------- HELPERS --------------------
function isHtmlFile(fp) {
  return fp.toLowerCase().endsWith(".html");
}

function shouldIgnoreFile(fp) {
  const base = path.basename(fp);
  if (IGNORE_FILES.has(base)) return true;

  const parts = fp.split(path.sep);
  if (parts.some(p => IGNORE_DIRS.has(p))) return true;

  return false;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      out.push(...walk(full));
    } else if (entry.isFile()) {
      if (isHtmlFile(full) && !shouldIgnoreFile(full)) out.push(full);
    }
  }
  return out;
}

function formatHtml(html) {
  return beautify(html, {
    indent_size: 2,
    preserve_newlines: true,
    max_preserve_newlines: 2,
    wrap_line_length: 0,
    end_with_newline: true,
    unformatted: ["code", "pre", "textarea"],
  });
}

function isBadAdsenseScriptSrc(src) {
  if (!src) return false;
  return (
    src.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js") &&
    src.includes(`client=${BAD_ADSENSE_CLIENT}`)
  );
}

function isPrintHackStylesheet($el) {
  const rel = ($el.attr("rel") || "").toLowerCase();
  const media = ($el.attr("media") || "").toLowerCase();
  const onload = ($el.attr("onload") || "");
  return rel === "stylesheet" && media === "print" && /media\s*=\s*['"]?all['"]?/i.test(onload);
}

function isMainCssHref(href) {
  if (!href) return false;
  const h = href.trim();
  return MAIN_CSS_MATCHERS.some(rx => rx.test(h));
}

function makePreloadStyleBlock($, href, extraAttrs = {}) {
  const preload = $("<link>");
  preload.attr("rel", "preload");
  preload.attr("as", "style");
  preload.attr("href", href);
  preload.attr("onload", "this.onload=null;this.rel='stylesheet'");

  Object.entries(extraAttrs).forEach(([k, v]) => {
    if (v != null && v !== "") preload.attr(k, v);
  });

  const noscript = $("<noscript></noscript>");
  const stylesheet = $("<link>");
  stylesheet.attr("rel", "stylesheet");
  stylesheet.attr("href", href);

  Object.entries(extraAttrs).forEach(([k, v]) => {
    if (v != null && v !== "") stylesheet.attr(k, v);
  });

  noscript.append(stylesheet);
  return { preload, noscript };
}

function dedupByOuterHtml($, arr) {
  const seen = new Set();
  const out = [];
  for (const node of arr) {
    const html = $.html(node);
    if (seen.has(html)) continue;
    seen.add(html);
    out.push(node);
  }
  return out;
}

// -------------------- HEAD TRANSFORM --------------------
function removeBadAdsense($, $head) {
  let changed = false;
  $head.find("script[src]").each((_, el) => {
    const $el = $(el);
    const src = ($el.attr("src") || "").trim();
    if (isBadAdsenseScriptSrc(src)) {
      $el.remove();
      changed = true;
    }
  });
  return changed;
}

function classifyHead($, $head) {
  const nodes = $head.contents().toArray();

  const descriptive = [];     // meta/title/canonical/alternate/manifest/icon (ordem original)
  const hints = [];           // preconnect/dns-prefetch
  const cssMain = [];         // output/global convertido
  const cssOther = [];        // outros CSS (print-hack convertido)
  const fonts = [];           // google fonts
  const preloadFetch = [];    // preload as=fetch
  const preloadOther = [];    // preload outros (inclui as=image aqui, MAS NÃO VAMOS MOVER)
  const scripts = [];
  const stylesInline = [];
  const others = [];

  for (const node of nodes) {
    if (node.type === "text" || node.type === "comment") {
      others.push(node);
      continue;
    }

    const tag = (node.name || "").toLowerCase();
    const $node = $(node);

    if (tag === "meta" || tag === "title") {
      descriptive.push(node);
      continue;
    }

    if (tag === "link") {
      const rel = ($node.attr("rel") || "").toLowerCase();
      const href = ($node.attr("href") || "");

      if (rel === "canonical" || rel === "alternate") {
        descriptive.push(node);
        continue;
      }

      if (rel === "manifest" || rel === "icon" || rel === "apple-touch-icon") {
        descriptive.push(node);
        continue;
      }

      if (HINT_RELS.has(rel)) {
        hints.push(node);
        continue;
      }

      if (rel === "preload") {
        const as = ($node.attr("as") || "").toLowerCase();
        if (as === "fetch") preloadFetch.push(node);
        else preloadOther.push(node); // aqui fica image + outros (NÃO moveremos separadamente)
        continue;
      }

      if (rel === "stylesheet") {
        if (typeof href === "string" && href.includes("fonts.googleapis.com")) {
          fonts.push(node);
        } else {
          cssOther.push(node);
        }
        continue;
      }

      others.push(node);
      continue;
    }

    if (tag === "style") {
      stylesInline.push(node);
      continue;
    }

    if (tag === "script") {
      scripts.push(node);
      continue;
    }

    others.push(node);
  }

  return {
    descriptive,
    hints,
    cssMain,
    cssOther,
    fonts,
    preloadFetch,
    preloadOther,
    scripts,
    stylesInline,
    others
  };
}

function convertCssToPreload($, groups) {
  const newCssOther = [];

  for (const node of groups.cssOther) {
    const $node = $(node);
    const href = ($node.attr("href") || "").trim();

    // principal -> preload+noscript
    if (isMainCssHref(href)) {
      const block = makePreloadStyleBlock($, href);
      groups.cssMain.push(block.preload[0]);
      groups.cssMain.push(block.noscript[0]);
      continue;
    }

    // print-hack -> preload+noscript (mantém crossorigin/referrerpolicy)
    if (isPrintHackStylesheet($node)) {
      const extra = {};
      const crossorigin = $node.attr("crossorigin");
      const refpol = $node.attr("referrerpolicy");
      if (crossorigin) extra.crossorigin = crossorigin;
      if (refpol) extra.referrerpolicy = refpol;

      const block = makePreloadStyleBlock($, href, extra);
      newCssOther.push(block.preload[0]);
      newCssOther.push(block.noscript[0]);
      continue;
    }

    newCssOther.push(node);
  }

  groups.cssOther = newCssOther;

  groups.cssMain = dedupByOuterHtml($, groups.cssMain);
  groups.cssOther = dedupByOuterHtml($, groups.cssOther);
}

function rebuildHead($, $head, groups) {
  groups.hints = dedupByOuterHtml($, groups.hints);
  groups.fonts = dedupByOuterHtml($, groups.fonts);
  groups.preloadFetch = dedupByOuterHtml($, groups.preloadFetch);
  // preloadOther fica como está (não reordenamos dentro dele além de dedup leve)
  groups.preloadOther = dedupByOuterHtml($, groups.preloadOther);

  const $frag = $("<div></div>");
  const append = (arr) => arr.forEach(n => $frag.append(n));

  // ✅ ORDEM FINAL
  // 1) descritivo
  // 2) hints
  // 3) css principal (preload+noscript)
  // 4) outros css (inclui print-hack convertido)
  // 5) fontes
  // 6) preload fetch
  // 7) preloadOther (inclui imagens, mantido como estava dentro da ordem do arquivo, só dedup)
  // 8) scripts
  // 9) style inline
  // 10) outros

  append(groups.descriptive);
  append(groups.hints);
  append(groups.cssMain);
  append(groups.cssOther);
  append(groups.fonts);
  append(groups.preloadFetch);
  append(groups.preloadOther);
  append(groups.scripts);
  append(groups.stylesInline);
  append(groups.others);

  $head.empty();
  $head.append($frag.html());
}

// -------------------- PROCESS FILE --------------------
function processFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8");

  const doctypeMatch = original.match(/<!doctype[^>]*>/i);
  const originalDoctype = doctypeMatch ? doctypeMatch[0] : "";

  const $ = cheerio.load(original, {
    decodeEntities: false,
    xmlMode: false,
    recognizeSelfClosing: true,
  });

  const $head = $("head");
  if (!$head.length) return { changed: false, reason: "sem <head>" };

  let changed = false;

  if (removeBadAdsense($, $head)) changed = true;

  const groups = classifyHead($, $head);
  convertCssToPreload($, groups);
  rebuildHead($, $head, groups);
  changed = true;

  let updated = $.html();

  if (originalDoctype) {
    updated = updated.replace(/<!doctype[^>]*>\s*/i, "");
    updated = originalDoctype + "\n" + updated;
  }

  updated = formatHtml(updated);

  if (formatHtml(original) === updated) return { changed: false, reason: "sem mudanças efetivas" };

  if (!DRY_RUN) fs.writeFileSync(filePath, updated, "utf8");
  return { changed: true };
}

// -------------------- RUN --------------------
const files = walk(ROOT);

let changedCount = 0;
let skipped = 0;

for (const fp of files) {
  try {
    const res = processFile(fp);
    if (res.changed) changedCount++;
    else skipped++;
  } catch (err) {
    console.error("Erro ao processar:", fp, err.message);
  }
}

console.log(`✅ Concluído. Arquivos alterados: ${changedCount}. Sem mudanças: ${skipped}.`);
console.log(DRY_RUN ? "🧪 DRY_RUN=true: nada foi salvo." : "🔎 Revise no GitHub Desktop (diff) antes de commitar.");
