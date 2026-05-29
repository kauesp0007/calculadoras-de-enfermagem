/* eslint-env node */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/* ===============================
   CONFIGURAÇÕES
================================ */
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "item.template.html";
const OUTPUT_DIR = "biblioteca";
const TEMPLATE_HASH_MARKER_PREFIX = "BIBLIOTECA_ITEM_TEMPLATE_HASH:";
const DELETE_ORPHANS = false;

/* ===============================
   UTILIDADES
================================ */
function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

function ensureTemplateHashMarker(html, templateHash) {
  const marker = ``;
  const re = new RegExp(``, "ig");
  if (re.test(html)) {
    return html.replace(re, marker);
  }
  if (html.includes("</head>")) {
    return html.replace("</head>", `\n  ${marker}\n</head>`);
  }
  return `${marker}\n${html}`;
}

/* ===============================
   GERADOR DE HTML DE UM ITEM
================================ */
function gerarHtmlDoItem({ template, templateHash, item }) {
  const slug = item.slug || slugify(item.titulo);
  const descricao = item.descricao || `Material de enfermagem sobre ${item.titulo}. Excelente para consulta rápida, estudos e prática clínica.`;
  const categoria = item.categoria || "documentos";

  // Assegurar caminhos absolutos para não quebrar as imagens na sub-pasta /biblioteca/
  let capa = item.capa || item.ficheiro;
  if (!capa.startsWith("/")) capa = "/" + capa;

  let download = item.download || item.ficheiro;
  if (!download.startsWith("/")) download = "/" + download;

  // Título curto para o breadcrumb superior
  const tituloCurto = item.titulo.length > 35 ? item.titulo.substring(0, 35) + "..." : item.titulo;

  let html = template;

  // Substituição inteligente usando o padrão do novo molde
  html = html.replaceAll("", escapeHtml(item.titulo));
  html = html.replaceAll("", escapeHtml(tituloCurto));
  html = html.replaceAll("", escapeHtml(descricao));
  html = html.replaceAll("", capa);
  html = html.replaceAll("", download);
  html = html.replaceAll("", escapeHtml(categoria.toUpperCase()));

  // SEO focado exclusivamente em Português
  const seoTitle = `${item.titulo} - Download Biblioteca de Enfermagem`;
  const canonicalUrl = `https://www.calculadorasdeenfermagem.com.br/biblioteca/${slug}.html`;
  const hreflangTags = `  <link rel="alternate" hreflang="pt-br" href="${canonicalUrl}">`;

  html = html.replaceAll("", escapeHtml(seoTitle));
  html = html.replaceAll("", escapeHtml(descricao));
  html = html.replaceAll("", canonicalUrl);
  html = html.replaceAll("", hreflangTags);

  // Marker de identificação
  html = ensureTemplateHashMarker(html, templateHash);

  return { slug, html };
}

/* ===============================
   CONSTRUTOR PRINCIPAL
================================ */
function construirBiblioteca() {
  if (!fs.existsSync(JSON_DATABASE_FILE)) {
    console.error("❌ biblioteca.json não encontrado");
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error(`❌ ${TEMPLATE_FILE} não encontrado`);
    process.exitCode = 1;
    return;
  }

  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  const templateHash = sha256(template);

  if (!Array.isArray(data)) {
    console.error("❌ biblioteca.json precisa ser um ARRAY de itens");
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  const expectedSlugs = new Set();
  let criados = 0;
  let atualizados = 0;
  let inalterados = 0;
  let puladosPorErro = 0;

  data.forEach((item) => {
    if (!item || !item.titulo || !item.ficheiro) {
      puladosPorErro++;
      return;
    }

    const { slug, html } = gerarHtmlDoItem({
      template,
      templateHash,
      item
    });

    expectedSlugs.add(slug);
    const outFile = path.join(OUTPUT_DIR, `${slug}.html`);

    if (fs.existsSync(outFile)) {
      const current = fs.readFileSync(outFile, "utf8");
      if (current === html) {
        inalterados++;
        return;
      }
      fs.writeFileSync(outFile, html, "utf8");
      atualizados++;
      return;
    }

    fs.writeFileSync(outFile, html, "utf8");
    criados++;
  });

  if (DELETE_ORPHANS) {
    const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.toLowerCase().endsWith(".html"));
    let removidos = 0;

    for (const f of files) {
      const slug = f.replace(/\.html$/i, "");
      if (!expectedSlugs.has(slug)) {
        fs.unlinkSync(path.join(OUTPUT_DIR, f));
        removidos++;
      }
    }
    console.log(`🧹 ${removidos} arquivos órfãos removidos.`);
  }

  console.log("✅ build-biblioteca (Apenas PT) otimizado e concluído!");
  console.log(`➕ Criados/Recriados: ${criados}`);
  console.log(`♻️ Atualizados: ${atualizados}`);
  console.log(`⏭️ Inalterados: ${inalterados}`);
  if (puladosPorErro) console.log(`⚠️ Itens pulados por falta de dados: ${puladosPorErro}`);
}

construirBiblioteca();