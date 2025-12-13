/* eslint-env node */
const fs = require("fs");
const path = require("path");

const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "downloads.template.html";
const OUTPUT_ROOT = "downloads";
const ITEMS_PER_PAGE = 20;

function criarCartaoHTML(item) {
  return `
<a href="/biblioteca/${slugify(item.titulo)}.html" class="file-card">
  <img src="${item.capa}" class="file-card-image" alt="Capa de ${item.titulo}">
  <h4 class="file-card-title">${item.titulo}</h4>
</a>`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function gerarPaginacao(totalPages, currentPage) {
  let html = "";

  if (currentPage > 1) {
    html += `<a href="/downloads/${currentPage === 2 ? "" : "page" + (currentPage - 1) + ".html"}" class="btn">« Anterior</a>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    const link =
      i === 1 ? "/downloads.html" : `/downloads/page${i}.html`;
    html += `<a href="${link}" class="btn ${
      i === currentPage ? "active" : ""
    }">${i}</a>`;
  }

  if (currentPage < totalPages) {
    html += `<a href="/downloads/page${currentPage + 1}.html" class="btn">Próxima »</a>`;
  }

  return html;
}

function construirPaginas() {
  const json = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

  const totalPages = Math.ceil(json.length / ITEMS_PER_PAGE);

  if (!fs.existsSync(OUTPUT_ROOT)) {
    fs.mkdirSync(OUTPUT_ROOT);
  }

  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const itensPagina = json.slice(start, end);

    const cardsHTML = itensPagina.map(criarCartaoHTML).join("\n");
    const paginacaoHTML = gerarPaginacao(totalPages, page);

    let htmlFinal = template
      .replace("<!-- [GERAR_TODOS] -->", cardsHTML)
      .replace("<!-- [PAGINACAO] -->", paginacaoHTML)
      .replace(
        "<title>",
        `<title>Biblioteca de Enfermagem — Página ${page} | `
      )
      .replace(
        `<link rel="canonical" href="https://www.calculadorasdeenfermagem.com.br/downloads.html">`,
        `<link rel="canonical" href="https://www.calculadorasdeenfermagem.com.br/${
          page === 1 ? "downloads.html" : "downloads/page" + page + ".html"
        }">`
      );

    const outputFile =
      page === 1
        ? "downloads.html"
        : path.join(OUTPUT_ROOT, `page${page}.html`);

    fs.writeFileSync(outputFile, htmlFinal);
    console.log(`📘 Página criada: ${outputFile}`);
  }

  console.log(`✅ Paginação finalizada: ${totalPages} páginas`);
}

construirPaginas();
