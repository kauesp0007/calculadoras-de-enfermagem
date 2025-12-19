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
   CRIA CARD HTML (CORRIGIDO)
================================ */

function criarCartaoHTML(item) {
  return `
<a href="/biblioteca/${slugify(item.titulo)}.html" class="file-card">
  <img src="${item.capa}" class="file-card-image" alt="Capa de ${item.titulo}">
  <h4 class="file-card-title">${item.titulo}</h4>
</a>`;
}

/* ===============================
   PAGINAÇÃO
================================ */

function gerarPaginacao(total, atual) {
  let html = "";

  if (atual > 1) {
    html += `<a class="btn" href="/downloads/page${atual - 1}.html">« Anterior</a>`;
  }

  for (let i = 1; i <= total; i++) {
    const link = `/downloads/page${i}.html`;
    html += `<a class="btn ${i === atual ? "active" : ""}" href="${link}">${i}</a>`;
  }

  if (atual < total) {
    html += `<a class="btn" href="/downloads/page${atual + 1}.html">Próxima »</a>`;
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

    items.forEach(item => {
      const card = criarCartaoHTML(item);

      todos += card;

      if (item.categoria === "documentos") documentos += card;
      if (item.categoria === "fotos") fotos += card;
      if (item.categoria === "videos") videos += card;
    });

    const pagination = gerarPaginacao(totalPages, page);

    let html = template
      .replace("<!-- [GERAR_TODOS] -->", todos)
      .replace("<!-- [GERAR_DOCUMENTOS] -->", documentos)
      .replace("<!-- [GERAR_FOTOS] -->", fotos)
      .replace("<!-- [GERAR_VIDEOS] -->", videos)
      .replace("<!-- [PAGINACAO] -->", pagination)
      .replace(
        /<title>.*<\/title>/,
        `<title>Biblioteca de Enfermagem — Página ${page}</title>`
      )
      .replace(
        /<link rel="canonical".*>/,
        `<link rel="canonical" href="https://www.calculadorasdeenfermagem.com.br/nl/downloads/page${page}.html">`
      );

    const output = path.join(OUTPUT_DIR, `page${page}.html`);

    fs.writeFileSync(output, html);
    console.log(`📘 Criada página: ${output}`);
  }

  console.log("✅ Biblioteca gerada com imagens, categorias e paginação corretas!");
}

construirPaginas();
