/* eslint-env node */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "downloads.template.html";
const ITEMS_PER_PAGE = 20;
const OUTPUT_DIR = "downloads";
const TEMPLATE_HASH_MARKER_PREFIX = "DOWNLOADS_TEMPLATE_HASH:";

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

// 🔥 A MÁGICA ESTÁ AQUI: Função SEGURA que ignora o motor de Regex do Node.js
function injetar(html, marcador, conteudo) {
  return html.split(marcador).join(conteudo);
}

function ensureTemplateHashMarker(html, templateHash) {
  const marker = ``;
  const re = new RegExp(``, "ig");
  if (re.test(html)) return html.replace(re, marker);
  if (html.includes("</head>")) return html.replace("</head>", `\n  ${marker}\n</head>`);
  return `${marker}\n${html}`;
}

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

function criarCartaoHTML(item) {
  let capa = item.capa || item.ficheiro || "";
  if (capa && !capa.startsWith("/")) capa = "/" + capa;

  const titulo = item.titulo || "Sem título";
  const slug = slugify(titulo);

  return `
<a href="/biblioteca/${slug}.html" class="file-card" title="Acessar documento: ${titulo}">
  <figure style="margin: 0; padding: 0; width: 100%; height: 100%;">
    <img src="${capa}"
         class="file-card-image"
         alt="Material sobre ${titulo}"
         title="${titulo}"
         loading="lazy"
         style="width: 100%; height: 200px; object-fit: cover; border-radius: 0.5rem; background-color: #f8fafc;">
    <figcaption class="file-card-title p-2 text-center text-sm font-bold text-gray-700">${titulo}</figcaption>
  </figure>
</a>`;
}

function linkPagina(pageNum) {
  return pageNum === 1 ? `/downloads.html` : `/downloads/page${pageNum}.html`;
}

function gerarPaginacao(total, atual) {
  let html = "";
  if (atual > 1) html += `<a class="btn" href="${linkPagina(atual - 1)}">« Anterior</a>`;

  let startPage = Math.max(1, atual - 2);
  let endPage = Math.min(total, atual + 2);

  if (startPage > 1) html += `<a class="btn" href="${linkPagina(1)}">1</a><span class="px-2 text-gray-400">...</span>`;

  for (let i = startPage; i <= endPage; i++) {
    html += `<a class="btn ${i === atual ? "active" : ""}" href="${linkPagina(i)}">${i}</a>`;
  }

  if (endPage < total) html += `<span class="px-2 text-gray-400">...</span><a class="btn" href="${linkPagina(total)}">${total}</a>`;
  if (atual < total) html += `<a class="btn" href="${linkPagina(atual + 1)}">Próxima »</a>`;

  return html;
}

function construirPaginas() {
  if (!fs.existsSync(JSON_DATABASE_FILE)) return console.error("❌ biblioteca.json não encontrado");
  if (!fs.existsSync(TEMPLATE_FILE)) return console.error(`❌ ${TEMPLATE_FILE} não encontrado`);

  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  const templateHash = sha256(template);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  let created = 0,
    updated = 0,
    unchanged = 0;

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

      const cat = String(item.categoria || "").toLowerCase().trim();
      if (cat === "documentos" || cat === "pdf" || cat === "docs") documentos += card;
      else if (cat === "fotos" || cat === "imagens" || cat === "img") fotos += card;
      else if (cat === "videos" || cat === "vídeos") videos += card;
    });

    const pagination = gerarPaginacao(totalPages, page);
    const seoTitle = `Biblioteca de Enfermagem — Página ${page}`;
    const seoDescription = `Biblioteca de Enfermagem com materiais, apostilas e documentos para download — Página ${page} de ${totalPages}.`;
    const canonicalUrl = page === 1 ? `https://www.calculadorasdeenfermagem.com.br/downloads.html` : `https://www.calculadorasdeenfermagem.com.br/downloads/page${page}.html`;

    let html = template;

    // 🔥 Substituição à prova de erros!
    html = injetar(html, "", todos);
    html = injetar(html, "", documentos);
    html = injetar(html, "", fotos);
    html = injetar(html, "", videos);
    html = injetar(html, "", pagination);

    html = injetar(html, "", seoTitle);
    html = injetar(html, "", seoDescription);
    html = injetar(html, "", canonicalUrl);
    html = injetar(html, "", canonicalUrl);

    html = ensureTemplateHashMarker(html, templateHash);

    if (page === 1) {
      const r1 = writeIfChanged("downloads.html", html);
      if (r1 === "created") created++;
      else if (r1 === "updated") updated++;
      else unchanged++;
    } else {
      const output = path.join(OUTPUT_DIR, `page${page}.html`);
      const r = writeIfChanged(output, html);
      if (r === "created") created++;
      else if (r === "updated") updated++;
      else unchanged++;
    }
  }

  console.log("✅ Downloads gerados com sucesso!");
  console.log(`➕ Criados/Recriados: ${created}`);
  console.log(`♻️ Atualizados: ${updated}`);
  console.log(`⏭️ Inalterados: ${unchanged}`);
}

construirPaginas();