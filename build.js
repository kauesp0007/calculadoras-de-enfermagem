/* eslint-env node */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "downloads.template.html";
const ITEMS_PER_PAGE = 20;
const OUTPUT_DIR = "downloads";

/**
 * Marker com hash do template.
 * Ex.: <!-- DOWNLOADS_TEMPLATE_HASH:abc123... -->
 */
const TEMPLATE_HASH_MARKER_PREFIX = "DOWNLOADS_TEMPLATE_HASH:";

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

function sha256(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

function ensureTemplateHashMarker(html, templateHash) {
  const marker = `<!-- ${TEMPLATE_HASH_MARKER_PREFIX}${templateHash} -->`;

  // Se já tem marker, substitui pelo novo hash
  const re = new RegExp(`<!--\\s*${TEMPLATE_HASH_MARKER_PREFIX}[a-f0-9]{8,64}\\s*-->`, "ig");
  if (re.test(html)) {
    return html.replace(re, marker);
  }

  // Se não tem, injeta antes do </head>
  if (html.includes("</head>")) {
    return html.replace("</head>", `\n  ${marker}\n</head>`);
  }

  // fallback (muito improvável)
  return `${marker}\n${html}`;
}

/**
 * Escreve arquivo somente se o conteúdo mudou.
 * Retorna: "created" | "updated" | "unchanged"
 */
function writeIfChanged(filepath, content) {
  if (fs.existsSync(filepath)) {
    const current = fs.readFileSync(filepath, "utf8");
    if (current === content) return "unchanged";
    fs.writeFileSync(filepath, content, "utf8");
    return "updated";
  }
  fs.writeFileSync(filepath, content, "utf8");
  return "created";
}

/* ===============================
   CRIA CARD HTML
================================ */

function criarCartaoHTML(item) {
  return `
<a href="/biblioteca/${slugify(item.titulo)}.html" class="file-card">
  <img src="${item.capa}" class="file-card-image" alt="Capa de ${item.titulo}">
  <h4 class="file-card-title">${item.titulo}</h4>
</a>`;
}

/* ===============================
   PAGINAÇÃO (page 1 = /downloads.html)
================================ */

function linkPagina(pageNum) {
  if (pageNum === 1) return `/downloads.html`;
  return `/downloads/page${pageNum}.html`;
}

function gerarPaginacao(total, atual) {
  let html = "";

  if (atual > 1) {
    html += `<a class="btn" href="${linkPagina(atual - 1)}">« Anterior</a>`;
  }

  for (let i = 1; i <= total; i++) {
    const link = linkPagina(i);
    html += `<a class="btn ${i === atual ? "active" : ""}" href="${link}">${i}</a>`;
  }

  if (atual < total) {
    html += `<a class="btn" href="${linkPagina(atual + 1)}">Próxima »</a>`;
  }

  return html;
}

/* ===============================
   CONSTRUTOR PRINCIPAL
================================ */

function construirPaginas() {
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

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const items = data.slice(start, start + ITEMS_PER_PAGE);

    let todos = "";
    let documentos = "";
    let fotos = "";
    let videos = "";

    items.forEach((item) => {
      const card = criarCartaoHTML(item);

      todos += card;

      if (item.categoria === "documentos") documentos += card;
      if (item.categoria === "fotos") fotos += card;
      if (item.categoria === "videos") videos += card;
    });

    const pagination = gerarPaginacao(totalPages, page);

    // SEO
    const seoTitle = `Biblioteca de Enfermagem — Página ${page}`;
    const seoDescription = `Biblioteca de Enfermagem com materiais, apostilas e documentos para download — Página ${page} de ${totalPages}.`;
    const seoKeywords =
      `biblioteca de enfermagem, apostilas de enfermagem, protocolos clínicos, manuais oficiais, materiais para estudo, documentos para download, enfermagem`;

    // Canonical: page 1 = /downloads.html (raiz), demais = /downloads/pageX.html
    const canonicalUrl =
      page === 1
        ? `https://www.calculadorasdeenfermagem.com.br/downloads.html`
        : `https://www.calculadorasdeenfermagem.com.br/downloads/page${page}.html`;

    let html = template
      .replace("<!-- [GERAR_TODOS] -->", todos)
      .replace("<!-- [GERAR_DOCUMENTOS] -->", documentos)
      .replace("<!-- [GERAR_FOTOS] -->", fotos)
      .replace("<!-- [GERAR_VIDEOS] -->", videos)
      // importante: seu template tem o placeholder 2x (topo e rodapé)
      .replaceAll("<!-- [PAGINACAO] -->", pagination)

      // SEO placeholders do template (alguns aparecem escapados)
      .replace(/<!-- \[SEO_TITLE\] -->/g, seoTitle)
      .replace(/&lt;!-- \[SEO_TITLE\] --&gt;/g, seoTitle)
      .replace(/<!-- \[SEO_DESCRIPTION\] -->/g, seoDescription)
      .replace(/&lt;!-- \[SEO_DESCRIPTION\] --&gt;/g, seoDescription)
      .replace(/<!-- \[SEO_KEYWORDS\] -->/g, seoKeywords)
      .replace(/&lt;!-- \[SEO_KEYWORDS\] --&gt;/g, seoKeywords)

      // URL placeholders (canonical / og:url / schema)
      .replace(/<!-- \[CANONICAL_URL\] -->/g, canonicalUrl)
      .replace(/<!-- \[SEO_URL\] -->/g, canonicalUrl)

      // Fallbacks (caso o template não tenha placeholders)
      .replace(/<title>.*<\/title>/, `<title>${seoTitle}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*>/i,
        `<meta name="description" content="${seoDescription}">`
      )
      .replace(
        /<meta name="keywords" content="[^"]*"\s*>/i,
        `<meta name="keywords" content="${seoKeywords}">`
      )
      .replace(
        /<link rel="canonical" href="[^"]*"\s*>/i,
        `<link rel="canonical" href="${canonicalUrl}">`
      )
      .replace(
        /<meta property="og:url" content="[^"]*"\s*>/i,
        `<meta property="og:url" content="${canonicalUrl}">`
      )
      .replace(
        /https:\/\/www\.calculadorasdeenfermagem\.com\.br\/downloads\.template\.html/g,
        canonicalUrl
      )
      .replace(
        /https:\/\/www\.calculadorasdeenfermagem\.com\.br\/downloads\.html/g,
        canonicalUrl
      );

    // ✅ injeta marker com hash do template no <head>
    html = ensureTemplateHashMarker(html, templateHash);

    // ✅ Saídas:
    // - Página 1 também gera o arquivo raiz "downloads.html"
    // - Páginas 2+ ficam em /downloads/pageX.html
    if (page === 1) {
      const r1 = writeIfChanged("downloads.html", html);
      if (r1 === "created") created++;
      else if (r1 === "updated") updated++;
      else unchanged++;

      // (opcional e seguro) mantém /downloads/page1.html caso exista link antigo
      const outputLegacy = path.join(OUTPUT_DIR, `page1.html`);
      const r2 = writeIfChanged(outputLegacy, html);
      if (r2 === "created") created++;
      else if (r2 === "updated") updated++;
      else unchanged++;
    } else {
      const output = path.join(OUTPUT_DIR, `page${page}.html`);
      const r = writeIfChanged(output, html);
      if (r === "created") created++;
      else if (r === "updated") updated++;
      else unchanged++;
    }
  }

  console.log("✅ Downloads gerados com atualização inteligente por template!");
  console.log(`➕ Criados: ${created}`);
  console.log(`♻️ Atualizados: ${updated}`);
  console.log(`⏭️ Inalterados: ${unchanged}`);
  console.log(`🔖 Template hash atual: ${templateHash}`);
}

construirPaginas();
