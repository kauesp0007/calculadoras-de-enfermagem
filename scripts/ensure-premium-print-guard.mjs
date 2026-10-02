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

const PRINT_LOCK_ID = "premium-print-fail-closed";
const PRINT_LOCK_STYLE = `<style id="${PRINT_LOCK_ID}">
@media print{
html:not([data-premium-print-access="premium"]) body{margin:0!important;background:#fff!important;color:#1a3e74!important}
html:not([data-premium-print-access="premium"]) body>*{display:none!important}
html:not([data-premium-print-access="premium"]) body::before{content:"Impressão e Salvar como PDF estão disponíveis apenas para assinantes Premium.";display:block!important;box-sizing:border-box!important;width:100%!important;padding:32mm 18mm!important;text-align:center!important;font:700 18pt/1.45 Arial,sans-serif!important;color:#1a3e74!important;background:#fff!important}
html[lang^="en"]:not([data-premium-print-access="premium"]) body::before{content:"Printing and Save as PDF are available to Premium subscribers only."}
html[lang^="es"]:not([data-premium-print-access="premium"]) body::before{content:"Imprimir y Guardar como PDF están disponibles solo para suscriptores Premium."}
html[lang^="fr"]:not([data-premium-print-access="premium"]) body::before{content:"L’impression et l’enregistrement en PDF sont réservés aux abonnés Premium."}
html[lang^="it"]:not([data-premium-print-access="premium"]) body::before{content:"La stampa e il salvataggio in PDF sono disponibili solo per gli abbonati Premium."}
html[lang^="de"]:not([data-premium-print-access="premium"]) body::before{content:"Drucken und Als PDF speichern sind nur für Premium-Abonnenten verfügbar."}
html[lang^="hi"]:not([data-premium-print-access="premium"]) body::before{content:"प्रिंट और PDF के रूप में सहेजना केवल Premium सदस्यों के लिए उपलब्ध है।"}
html[lang^="zh"]:not([data-premium-print-access="premium"]) body::before{content:"打印和另存为 PDF 仅向 Premium 订阅用户开放。"}
html[lang^="ja"]:not([data-premium-print-access="premium"]) body::before{content:"印刷と PDF 保存は Premium 会員のみ利用できます。"}
html[lang^="ru"]:not([data-premium-print-access="premium"]) body::before{content:"Печать и сохранение в PDF доступны только подписчикам Premium."}
html[lang^="ko"]:not([data-premium-print-access="premium"]) body::before{content:"인쇄 및 PDF 저장은 Premium 구독자만 사용할 수 있습니다."}
html[lang^="tr"]:not([data-premium-print-access="premium"]) body::before{content:"Yazdırma ve PDF olarak kaydetme yalnızca Premium abonelere açıktır."}
html[lang^="nl"]:not([data-premium-print-access="premium"]) body::before{content:"Afdrukken en opslaan als PDF zijn alleen beschikbaar voor Premium-abonnees."}
html[lang^="pl"]:not([data-premium-print-access="premium"]) body::before{content:"Drukowanie i zapisywanie jako PDF są dostępne tylko dla subskrybentów Premium."}
html[lang^="sv"]:not([data-premium-print-access="premium"]) body::before{content:"Utskrift och Spara som PDF är endast tillgängligt för Premium-prenumeranter."}
html[lang^="id"]:not([data-premium-print-access="premium"]) body::before{content:"Cetak dan Simpan sebagai PDF hanya tersedia untuk pelanggan Premium."}
html[lang^="vi"]:not([data-premium-print-access="premium"]) body::before{content:"In và Lưu dưới dạng PDF chỉ dành cho người đăng ký Premium."}
html[lang^="uk"]:not([data-premium-print-access="premium"]) body::before{content:"Друк і збереження у PDF доступні лише передплатникам Premium."}
html[lang^="ar"]:not([data-premium-print-access="premium"]) body::before{content:"الطباعة والحفظ بصيغة PDF متاحان فقط لمشتركي Premium.";direction:rtl!important}
}
</style>`;

function hasPrintAction(html) {
  return PRINT_SIGNALS.some((re) => re.test(html));
}

function hasGlobalScripts(html) {
  return /<script\b[^>]*\bsrc=["']\/global-scripts\.js(?:[?#][^"']*)?["'][^>]*>/i.test(html);
}

function hasPrintLock(html) {
  return html.includes('id="' + PRINT_LOCK_ID + '"') ||
    html.includes("id='" + PRINT_LOCK_ID + "'");
}

function injectPrintLock(html) {
  if (hasPrintLock(html)) return html;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, PRINT_LOCK_STYLE + "\n</head>");
  return PRINT_LOCK_STYLE + "\n" + html;
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
const missingScripts = [];
const missingLocks = [];

for (const file of files) {
  let html = await fs.readFile(file.abs, "utf8");
  if (!hasPrintAction(html)) continue;

  printable.push(file.rel);
  var changedHere = false;

  if (!hasGlobalScripts(html)) {
    missingScripts.push(file.rel);
    if (APPLY) {
      html = injectGlobalScripts(html);
      changedHere = true;
    }
  }

  if (!hasPrintLock(html)) {
    missingLocks.push(file.rel);
    if (APPLY) {
      html = injectPrintLock(html);
      changedHere = true;
    }
  }

  if (APPLY && changedHere) {
    await fs.writeFile(file.abs, html, "utf8");
    changed.push(file.rel);
  }
}

const remainingScripts = [];
const remainingLocks = [];
if (APPLY) {
  for (const rel of printable) {
    const abs = path.join(ROOT, ...rel.split("/"));
    const html = await fs.readFile(abs, "utf8");
    if (!hasGlobalScripts(html)) remainingScripts.push(rel);
    if (!hasPrintLock(html)) remainingLocks.push(rel);
  }
} else {
  remainingScripts.push(...missingScripts);
  remainingLocks.push(...missingLocks);
}

const ok = remainingScripts.length === 0 && remainingLocks.length === 0;

console.log(JSON.stringify({
  ok,
  scannedHtml: files.length,
  printableHtml: printable.length,
  changed: changed.length,
  missingScriptsBeforeApply: missingScripts.length,
  missingLocksBeforeApply: missingLocks.length,
  missingScriptsAfterApply: remainingScripts.length,
  missingLocksAfterApply: remainingLocks.length,
  printable,
  changedPaths: changed,
  missingScriptPaths: remainingScripts,
  missingLockPaths: remainingLocks
}, null, 2));

if ((AUDIT || APPLY) && !ok) process.exit(2);
