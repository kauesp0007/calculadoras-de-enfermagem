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


// Substitui marcador por conteúdo no HTML
function injetar(html, marcador, conteudo) {
  return html.replace(marcador, conteudo);
}


function ensureTemplateHashMarker(html, templateHash) {
  const marker = `<!-- ${TEMPLATE_HASH_MARKER_PREFIX}${templateHash} -->`;
  const re = new RegExp(`<!-- ${TEMPLATE_HASH_MARKER_PREFIX}.*? -->`, "ig");
  if (re.test(html)) return html.replace(re, marker);
  if (html.includes("</head>")) return html.replace("</head>", `\n  ${marker}\n</head>`);
  return `${marker}\n${html}`;
}

// 🔥 A SOLUÇÃO: Função que escreve por cima sem tentar ler o ficheiro gigante antigo!
function forcarEscrita(filepath, content) {
  fs.writeFileSync(filepath, content, "utf8");
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
  console.log("🚀 Iniciando build.js (Modo Força Bruta de Escrita)...");

  if (!fs.existsSync(JSON_DATABASE_FILE)) return console.error("❌ biblioteca.json não encontrado");
  if (!fs.existsSync(TEMPLATE_FILE)) return console.error(`❌ ${TEMPLATE_FILE} não encontrado`);

  // 🔥 Sistema de segurança para identificar qual ficheiro está corrompido
  const statJson = fs.statSync(JSON_DATABASE_FILE);
  const statTemplate = fs.statSync(TEMPLATE_FILE);
  if (statJson.size > 20 * 1024 * 1024) return console.error("🚨 O seu ficheiro biblioteca.json está gigantesco/corrompido!");
  if (statTemplate.size > 20 * 1024 * 1024) return console.error("🚨 O seu ficheiro downloads.template.html está gigantesco/corrompido!");

  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  const templateHash = sha256(template);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  // 🔥 Se a pasta downloads existir, tentar apagá-la primeiro para evitar lixo
  if (fs.existsSync(OUTPUT_DIR)) {
    try {
      fs.rmSync(OUTPUT_DIR, {
        recursive: true,
        force: true
      });
    } catch (e) {}
  }
  fs.mkdirSync(OUTPUT_DIR, {
    recursive: true
  });

  let processados = 0;

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

    html = injetar(html, /<!-- TODOS -->/g, todos);
    html = injetar(html, /<!-- DOCUMENTOS -->/g, documentos);
    html = injetar(html, /<!-- FOTOS -->/g, fotos);
    html = injetar(html, /<!-- VIDEOS -->/g, videos);
    html = injetar(html, /<!-- PAGINATION -->/g, pagination);

    html = injetar(html, /<!-- SEO_TITLE -->/g, seoTitle);
    html = injetar(html, /<!-- SEO_DESCRIPTION -->/g, seoDescription);
    html = injetar(html, /<!-- CANONICAL_URL -->/g, canonicalUrl);

    html = ensureTemplateHashMarker(html, templateHash);

    if (page === 1) {
      forcarEscrita("downloads.html", html);
      processados++;
    } else {
      const output = path.join(OUTPUT_DIR, `page${page}.html`);
      forcarEscrita(output, html);
      processados++;
    }
  }

  console.log("✅ Downloads gerados com sucesso e páginas limpas!");
  console.log(`📄 Total de páginas geradas: ${processados}`);
}

construirPaginas();