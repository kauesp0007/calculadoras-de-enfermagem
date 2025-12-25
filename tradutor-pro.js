/* eslint-env node */
/**
 * tradutor-pro.js
 *
 * Corrige APENAS strings em português dentro de <script> inline nos HTML
 * de uma pasta de idioma (ex.: en/, es/, fr/, sv/, zh/, etc).
 *
 * - NÃO traduz HTML visível (títulos, parágrafos etc.) -> deixa como está.
 * - NÃO traduz arquivos .js, .json, .css, imagens etc.
 * - Só mexe em: <script> ... </script> SEM atributo src
 * - Traduz apenas "strings humanas" que pareçam PT-BR dentro do JS.
 * - Preserva lógica, nomes de funções/variáveis, ids/classes, seletores e chaves.
 *
 * Uso:
 *   node tradutor-pro.js <sigla-da-pasta>
 *   ex: node tradutor-pro.js sv
 *
 * .env (DeepL Pro):
 *   TRANSLATION_PROVIDER=deepl
 *   DEEPL_AUTH_KEY=...
 *   DEEPL_ENDPOINT=https://api.deepl.com/v2/translate
 *
 * Opcional (desativar backups .bak):
 *   CREATE_BACKUP=false
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const cheerio = require("cheerio");

const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

dotenv.config();

const PROVIDER = (process.env.TRANSLATION_PROVIDER || "").trim().toLowerCase();
if (!["deepl", "azure", "libre"].includes(PROVIDER)) {
  console.error("❌ Defina TRANSLATION_PROVIDER no .env como: deepl | azure | libre");
  process.exit(1);
}

const TARGET_DIR = (process.argv[2] || "").trim();
if (!TARGET_DIR) {
  console.error("❌ Uso: node tradutor-pro.js <sigla-da-pasta>");
  console.error("   Ex: node tradutor-pro.js sv");
  process.exit(1);
}

const ROOT = process.cwd();
const TARGET_ROOT = path.join(ROOT, TARGET_DIR);

if (!fs.existsSync(TARGET_ROOT)) {
  console.error(`❌ Pasta de idioma não encontrada: ${TARGET_ROOT}`);
  process.exit(1);
}

/* =========================
   Config
========================= */
const CONCURRENCY = 3;
const MAX_CHARS_PER_REQUEST = 4500;
const translationCache = new Map(); // key: `${provider}::${target}::${text}` -> translated
let PROVIDER_DOWN = false;

/* =========================
   Heurística PT-BR
========================= */
const PT_HINT_WORDS = [
  "preencha", "campo", "obrigatório", "obrigatoria", "selecione", "selecionar",
  "resultado", "conclusão", "conclusao", "paciente", "pontuação", "pontuacao",
  "idade", "peso", "altura", "dose", "doses", "via", "horário", "horario",
  "atenção", "atencao", "erro", "aviso", "insira", "digite", "calcular",
  "valor", "valores", "mínimo", "minimo", "máximo", "maximo",
  "não", "nao", "sim", "por favor", "deve", "necessário", "necessario",
  "você", "voce", "seu", "sua", "suas", "seus",
  "exibir", "informe", "informa", "informar"
];

function seemsPortuguese(text) {
  if (!text) return false;
  if (/[ãõáàâéêíóôúç]/i.test(text)) return true;
  const t = String(text).toLowerCase();
  return PT_HINT_WORDS.some((w) => t.includes(w));
}

function looksLikeNotHuman(text) {
  if (!text) return true;
  const t = text.trim();
  if (!t) return true;

  if (t.length <= 1) return true;
  if (/^[\d\s.,;:!?()%\-_/\\|]+$/.test(t)) return true;

  if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return true;
  if (/^(\.\/|\.\.\/|\/)/.test(t)) return true;
  if (/\.(js|css|png|jpe?g|webp|svg|pdf|docx?|mp4|json)(\?.*)?$/i.test(t)) return true;

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t)) return true;
  if (/^[#.][A-Za-z0-9_-]+$/.test(t)) return true;

  if (/[{}<>]/.test(t)) return true;

  return false;
}

function normalizeSpacesKeepEdges(original, translated) {
  const lead = original.match(/^\s*/)?.[0] ?? "";
  const tail = original.match(/\s*$/)?.[0] ?? "";
  return lead + translated.trim() + tail;
}

/* =========================
   Idioma alvo (folder -> provider)
========================= */
function targetLangForProvider(folderLang) {
  const lang = folderLang.toLowerCase();

  if (PROVIDER === "deepl") {
    const map = {
      en: "EN",
      es: "ES",
      fr: "FR",
      it: "IT",
      de: "DE",
      hi: "HI",
      zh: "ZH",
      ja: "JA",
      ru: "RU",
      ko: "KO",
      tr: "TR",
      nl: "NL",
      pl: "PL",
      sv: "SV",
      id: "ID",
      vi: "VI",
      uk: "UK"
    };
    return map[lang] || lang.toUpperCase();
  }

  return lang;
}

/* =========================
   Providers
========================= */
async function translateWithDeepL(text, targetFolder) {
  const key = process.env.DEEPL_AUTH_KEY;
  const endpoint = process.env.DEEPL_ENDPOINT || "https://api.deepl.com/v2/translate";
  if (!key) throw new Error("DEEPL_AUTH_KEY não definido no .env");

  const target = targetLangForProvider(targetFolder);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      "Authorization": `DeepL-Auth-Key ${key}`
    },
    body: new URLSearchParams({
      text,
      target_lang: target,
      source_lang: "PT"
    }).toString()
  });

  const dataTxt = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`DeepL HTTP ${res.status}: ${dataTxt}`);

  const data = JSON.parse(dataTxt);
  const translated = data?.translations?.[0]?.text;
  if (!translated) return text;
  return translated;
}

async function translateWithAzure(text, targetFolder) {
  const key = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION;
  if (!key || !region) throw new Error("AZURE_TRANSLATOR_KEY ou AZURE_TRANSLATOR_REGION não definido no .env");

  const target = targetLangForProvider(targetFolder);
  const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${encodeURIComponent(target)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Ocp-Apim-Subscription-Key": key,
      "Ocp-Apim-Subscription-Region": region
    },
    body: JSON.stringify([{ text }])
  });

  const dataTxt = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Azure HTTP ${res.status}: ${dataTxt}`);

  const data = JSON.parse(dataTxt);
  const translated = data?.[0]?.translations?.[0]?.text;
  if (!translated) return text;
  return translated;
}

async function translateWithLibre(text, targetFolder) {
  const url = process.env.LIBRETRANSLATE_URL;
  const apiKey = process.env.LIBRETRANSLATE_API_KEY || "";
  if (!url) throw new Error("LIBRETRANSLATE_URL não definido no .env");

  const target = targetLangForProvider(targetFolder);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      q: text,
      source: "pt",
      target,
      format: "text",
      api_key: apiKey || undefined
    })
  });

  const dataTxt = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`LibreTranslate HTTP ${res.status}: ${dataTxt}`);

  const data = JSON.parse(dataTxt);
  const translated = data?.translatedText;
  if (!translated) return text;
  return translated;
}

async function providerTranslate(text, targetFolder) {
  if (PROVIDER === "deepl") return translateWithDeepL(text, targetFolder);
  if (PROVIDER === "azure") return translateWithAzure(text, targetFolder);
  return translateWithLibre(text, targetFolder);
}

/* =========================
   Tradução segura (com cache + detecção PT)
========================= */
async function translatePtOnly(text, targetFolder) {
  const raw = text;

  if (PROVIDER_DOWN) return raw;

  if (looksLikeNotHuman(raw)) return raw;
  if (!seemsPortuguese(raw)) return raw;

  const cacheKey = `${PROVIDER}::${targetFolder}::${raw}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

  if (raw.length > MAX_CHARS_PER_REQUEST) {
    const parts = raw.split(/(\n+)/);
    const translatedParts = [];
    for (const part of parts) {
      if (/^\n+$/.test(part)) translatedParts.push(part);
      else translatedParts.push(await translatePtOnly(part, targetFolder));
    }
    const joined = translatedParts.join("");
    translationCache.set(cacheKey, joined);
    return joined;
  }

  try {
    const translated = await providerTranslate(raw, targetFolder);
    const finalText = normalizeSpacesKeepEdges(raw, translated);
    translationCache.set(cacheKey, finalText);
    return finalText;
  } catch (err) {
    PROVIDER_DOWN = true;
    console.error("❌ Falha no provedor de tradução. Vou parar de tentar traduzir para evitar spam.");
    console.error("Detalhe:", err?.message || err);
    return raw;
  }
}

/* =========================
   Regras para NÃO quebrar JS
========================= */
function isSelectorLike(s) {
  const t = String(s || "").trim();
  if (!t) return false;
  if (/^[#.][A-Za-z0-9_-]+$/.test(t)) return true;
  if (t.includes("[") && t.includes("]")) return true;
  return false;
}

function isDomQueryCall(stringPath) {
  const p = stringPath.parentPath;
  if (!p || !p.isCallExpression()) return false;

  const call = p.node;
  const callee = call.callee;

  const name =
    callee.type === "MemberExpression"
      ? callee.property?.name
      : callee.type === "Identifier"
        ? callee.name
        : null;

  const domFns = new Set([
    "getElementById",
    "querySelector",
    "querySelectorAll",
    "getElementsByClassName",
    "getElementsByName"
  ]);

  return name && domFns.has(name);
}

function isAddEventListenerEventType(stringPath) {
  const p = stringPath.parentPath;
  if (!p || !p.isCallExpression()) return false;

  const call = p.node;
  const callee = call.callee;
  if (callee.type !== "MemberExpression") return false;
  if (callee.property?.name !== "addEventListener") return false;

  return call.arguments?.[0] === stringPath.node;
}

function isSetAttributeName(stringPath) {
  const p = stringPath.parentPath;
  if (!p || !p.isCallExpression()) return false;

  const call = p.node;
  const callee = call.callee;
  if (callee.type !== "MemberExpression") return false;
  if (callee.property?.name !== "setAttribute") return false;

  return call.arguments?.[0] === stringPath.node;
}

function isStorageKey(stringPath) {
  const p = stringPath.parentPath;
  if (!p || !p.isCallExpression()) return false;

  const call = p.node;
  const callee = call.callee;
  if (callee.type !== "MemberExpression") return false;

  const obj = callee.object;
  const prop = callee.property?.name;

  const isStorageObj =
    (obj.type === "Identifier" && (obj.name === "localStorage" || obj.name === "sessionStorage")) ||
    (obj.type === "MemberExpression" && obj.property?.name === "localStorage");

  const storageFns = new Set(["getItem", "setItem", "removeItem"]);
  return isStorageObj && prop && storageFns.has(prop) && call.arguments?.[0] === stringPath.node;
}

/* =========================
   AST: traduz só strings PT no JS inline
========================= */
async function translateInlineScriptJs(jsCode, targetFolder) {
  let ast;
  try {
    ast = babelParser.parse(jsCode, {
      sourceType: "unambiguous",
      plugins: ["jsx", "classProperties", "optionalChaining", "nullishCoalescingOperator"]
    });
  } catch {
    return { changed: false, code: jsCode };
  }

  const tasks = [];

  traverse(ast, {
    StringLiteral(p) {
      const value = p.node.value;
      if (!value) return;

      if (looksLikeNotHuman(value)) return;
      if (!seemsPortuguese(value)) return;

      if (isSelectorLike(value)) return;
      if (isDomQueryCall(p) || isSetAttributeName(p) || isAddEventListenerEventType(p) || isStorageKey(p)) return;

      tasks.push({ kind: "StringLiteral", path: p, original: value });
    },

    TemplateLiteral(p) {
      const quasis = p.node.quasis || [];
      for (const quasi of quasis) {
        const raw = quasi.value.raw;
        if (!raw) continue;

        if (looksLikeNotHuman(raw)) continue;
        if (!seemsPortuguese(raw)) continue;
        if (isSelectorLike(raw)) continue;

        tasks.push({ kind: "TemplateQuasi", quasi, original: raw });
      }
    }
  });

  let changed = false;

  for (const t of tasks) {
    const translated = await translatePtOnly(t.original, targetFolder);
    if (!translated || translated === t.original) continue;

    changed = true;

    if (t.kind === "StringLiteral") {
      t.path.node.value = translated;
    } else {
      t.quasi.value.raw = translated;
      t.quasi.value.cooked = translated;
    }
  }

  if (!changed) return { changed: false, code: jsCode };

  const out = generate(ast, { retainLines: true, jsescOption: { minimal: true } }, jsCode).code;
  return { changed: true, code: out };
}

/* =========================
   Arquivos HTML
========================= */
function listHtmlFilesRecursive(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listHtmlFilesRecursive(full));
    else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === ".html" || ext === ".htm") out.push(full);
    }
  }
  return out;
}

/**
 * ✅ FUNÇÃO CORRIGIDA:
 * - Por padrão cria backup .bak na primeira vez
 * - Se no .env tiver CREATE_BACKUP=false, não cria nada.
 */
function ensureBackupOnce(filePath) {
  const createBackup = (process.env.CREATE_BACKUP || "true").toLowerCase() !== "false";
  if (!createBackup) return;

  const bak = filePath + ".bak";
  if (!fs.existsSync(bak)) fs.copyFileSync(filePath, bak);
}

async function processHtmlFile(filePath, targetFolder) {
  const originalHtml = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(originalHtml, { decodeEntities: false });

  const scripts = $("script").toArray();
  if (scripts.length === 0) return false;

  let fileChanged = false;

  for (const s of scripts) {
    const el = $(s);

    // não mexe se tiver src
    if (el.attr("src")) continue;

    const jsCode = el.html() || "";
    if (!jsCode.trim()) continue;

    const { changed, code } = await translateInlineScriptJs(jsCode, targetFolder);
    if (changed) {
      el.text(code);
      fileChanged = true;
    }
  }

  if (!fileChanged) return false;

  ensureBackupOnce(filePath);
  fs.writeFileSync(filePath, $.html(), "utf8");
  return true;
}

/* =========================
   Runner
========================= */
async function runWithConcurrency(items, worker, concurrency = CONCURRENCY) {
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const item = items[idx++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()));
}

async function main() {
  const files = listHtmlFilesRecursive(TARGET_ROOT);

  console.log(`🌍 Pasta alvo: ${TARGET_DIR}/`);
  console.log(`🔌 Provider: ${PROVIDER}`);
  console.log(`🈯 targetLang (provider): ${targetLangForProvider(TARGET_DIR)}`);
  console.log(`📄 HTML encontrados: ${files.length}`);
  console.log("📌 Regra: corrigir SOMENTE <script> inline e só strings em português.");

  let changedCount = 0;

  await runWithConcurrency(files, async (file) => {
    try {
      const changed = await processHtmlFile(file, TARGET_DIR);
      if (changed) {
        changedCount++;
        console.log(`✅ Corrigido: ${path.relative(ROOT, file)}`);
      }
    } catch (err) {
      console.error(`❌ Erro em ${file}: ${err.message}`);
    }
  });

  console.log("—");
  console.log(`🛠️ Arquivos alterados: ${changedCount}`);
  console.log("💾 Backups .bak: ativados por padrão (desative com CREATE_BACKUP=false no .env).");
  console.log("🎉 Finalizado.");
}

main();
