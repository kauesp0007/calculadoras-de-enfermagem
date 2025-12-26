/* eslint-env node */
const fs = require("fs");
const path = require("path");

const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "downloads.template.html";
const ITEMS_PER_PAGE = 20;
const OUTPUT_DIR = "downloads";

/* ===============================
   UTILIDADES
================================ */

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

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
    let seoTitle = `Biblioteca de Enfermagem — Página ${page}`;
    let seoDescription = `Biblioteca de Enfermagem com materiais, apostilas e documentos para download — Página ${page} de ${totalPages}.`;
    let seoKeywords =
      `biblioteca de enfermagem, apostilas de enfermagem, protocolos clínicos, manuais oficiais, materiais para estudo, documentos para download, enfermagem`;

    // Canonical: page 1 = /downloads.html (raiz), demais = /downloads/pageX.html
    let canonicalUrl =
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

      // SEO placeholders do template
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

    // ✅ Saídas:
    // - Página 1 também gera o arquivo raiz "downloads.html"
    // - Páginas 2+ ficam em /downloads/pageX.html
    if (page === 1) {
      fs.writeFileSync("downloads.html", html);
      console.log(`📘 Criada página: downloads.html`);

      // (opcional e seguro) mantém /downloads/page1.html caso exista link antigo
      const outputLegacy = path.join(OUTPUT_DIR, `page1.html`);
      fs.writeFileSync(outputLegacy, html);
      console.log(`📘 Criada página: ${outputLegacy}`);
    } else {
      const output = path.join(OUTPUT_DIR, `page${page}.html`);
      fs.writeFileSync(output, html);
      console.log(`📘 Criada página: ${output}`);
    }
  }

  console.log("✅ Biblioteca gerada com imagens, categorias e paginação corretas!");
}

construirPaginas();
