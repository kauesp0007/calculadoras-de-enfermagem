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

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// CORREÇÃO CRÍTICA: Uso de split.join é o método mais seguro contra loops infinitos causados por caracteres especiais ($) no replace.
function injetar(html, marcador, conteudo) {
    if (!html || !marcador) return html;
    return html.split(marcador).join(conteudo);
}

function ensureTemplateHashMarker(html, templateHash) {
  const marker = `<!-- ${TEMPLATE_HASH_MARKER_PREFIX}${templateHash} -->`;
  const re = new RegExp(`<!-- ${TEMPLATE_HASH_MARKER_PREFIX}.*? -->`, "ig");
  if (re.test(html)) return html.replace(re, marker);
  if (html.includes("</head>")) return html.replace("</head>", `\n  ${marker}\n</head>`);
  return `${marker}\n${html}`;
}

function forcarEscrita(filepath, content) {
  fs.writeFileSync(filepath, content, "utf8");
}

function criarCartaoHTML(item) {
  let capa = item.capa || item.ficheiro || "";
  if (capa && !capa.startsWith("/")) capa = "/" + capa;

  const titulo = item.titulo || "Sem título";
  const slug = slugify(titulo);

  const descricaoRaw = item.descricao && item.descricao.trim() !== ""
    ? item.descricao
    : `Baixe agora o material completo sobre ${titulo} na nossa Biblioteca de Enfermagem.`;
  const descricaoSegura = escapeHtml(descricaoRaw);

  // Extrair extensão correta para a etiqueta (badge)
  let filePath = item.download || item.ficheiro || "";
  let ext = path.extname(filePath).toLowerCase().replace('.', '');

  if (!ext && filePath.match(/\.(mp4|webm|ogg)$/i)) ext = 'mp4';
  if (!ext && (item.categoria === 'fotos' || item.categoria === 'imagens')) ext = 'png';
  if (!ext && (item.categoria === 'documentos' || item.categoria === 'pdf')) ext = 'pdf';

  let fileTypeBadgeHtml = "";
  if (ext) {
      let label = ext.toUpperCase();
      let bgHex = "#f3f4f6"; // gray-100
      let textHex = "#374151"; // gray-700
      let icon = "fa-solid fa-file";

      if (ext === 'pdf') {
          bgHex = "#fee2e2"; textHex = "#b91c1c"; icon = "fa-solid fa-file-pdf";
      } else if (['doc', 'docx'].includes(ext)) {
          label = "WORD"; bgHex = "#dbeafe"; textHex = "#1d4ed8"; icon = "fa-solid fa-file-word";
      } else if (['xls', 'xlsx'].includes(ext)) {
          label = "EXCEL"; bgHex = "#dcfce3"; textHex = "#15803d"; icon = "fa-solid fa-file-excel";
      } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
          bgHex = "#f3e8ff"; textHex = "#7e22ce"; icon = "fa-solid fa-video";
      } else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
          bgHex = "#d1fae5"; textHex = "#047857"; icon = "fa-solid fa-image";
      }

      fileTypeBadgeHtml = `<div class="absolute top-2 right-2 text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm z-10 flex items-center gap-1" style="background-color: ${bgHex}; color: ${textHex};"><i class="${icon}"></i> ${label}</div>`;
  }

  const cat = String(item.categoria || "").toLowerCase().trim();
  const isVideo = cat === "videos" || cat === "vídeos" || capa.match(/\.(mp4|webm|ogg)$/i);
  const isDocument = cat === "documentos" || cat === "pdf" || cat === "docs" || (item.ficheiro && item.ficheiro.match(/\.(pdf|doc|docx|xls|xlsx)$/i));

  if (isVideo) {
    return `
<div class="file-card group relative flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all" title="Assistir ao vídeo: ${titulo}">
  <div class="relative w-full h-[200px] bg-slate-900 cursor-pointer" onclick="const v = this.querySelector('video'); if(v.paused){v.play(); v.setAttribute('controls', 'controls'); this.querySelector('.play-overlay').classList.add('hidden');}else{v.pause();}">
    ${fileTypeBadgeHtml}
    <video src="${capa}#t=0.1" preload="metadata" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"></video>
    <div class="play-overlay absolute inset-0 flex items-center justify-center">
      <div class="bg-black/60 rounded-full w-14 h-14 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform shadow-lg">
        <i class="fa-solid fa-play text-white text-2xl ml-1"></i>
      </div>
    </div>
  </div>
  <div class="p-2 flex-grow flex flex-col justify-between">
    <a href="/biblioteca/${slug}.html" class="file-card-title text-center text-sm font-bold text-gray-700 hover:text-[#4A90E2] transition-colors block mb-1 line-clamp-2">
      ${titulo}
    </a>
    <div class="item-description-hidden hidden">${descricaoSegura}</div>
  </div>
</div>`;
  } else if (isDocument) {
    return `
<a href="/biblioteca/${slug}.html" class="file-card group relative flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all" title="Acessar documento: ${titulo}">
  <div class="relative w-full h-[200px] bg-[#E2E8F0] flex items-center justify-center p-3 border-b border-gray-100 overflow-hidden">
    ${fileTypeBadgeHtml}
    <img src="${capa}" class="file-card-image max-w-full max-h-full object-contain rounded-sm drop-shadow-md group-hover:scale-105 transition-transform duration-300 bg-white" alt="Capa do documento ${titulo}" loading="lazy">
  </div>
  <div class="p-3 flex-grow flex flex-col justify-between bg-white z-20">
    <span class="file-card-title text-center text-sm font-bold text-gray-700 group-hover:text-[#4A90E2] transition-colors block mb-1 line-clamp-2">
      ${titulo}
    </span>
    <div class="item-description-hidden hidden">${descricaoSegura}</div>
  </div>
</a>`;
  } else {
    return `
<a href="/biblioteca/${slug}.html" class="file-card group relative flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all" title="Acessar imagem: ${titulo}">
  <div class="relative w-full h-[200px] bg-[#f8fafc] border-b border-gray-100">
    ${fileTypeBadgeHtml}
    <img src="${capa}" class="file-card-image w-full h-full object-cover group-hover:opacity-90 transition-opacity" alt="Material sobre ${titulo}" loading="lazy">
  </div>
  <div class="p-3 flex-grow flex flex-col justify-between bg-white z-20">
    <span class="file-card-title text-center text-sm font-bold text-gray-700 group-hover:text-[#4A90E2] transition-colors block mb-1 line-clamp-2">
      ${titulo}
    </span>
    <div class="item-description-hidden hidden">${descricaoSegura}</div>
  </div>
</a>`;
  }
}

function linkPagina(pageNum) {
  return pageNum === 1 ? `/downloads.html` : `/downloads/page${pageNum}.html`;
}

function gerarPaginacao(total, atual) {
  if (total <= 1) return "";
  let html = '<nav class="flex items-center justify-center space-x-1 md:space-x-2 my-8">';
  if (atual > 1) {
    html += `<a href="${linkPagina(atual - 1)}" class="flex items-center px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-[#4A90E2] font-bold hover:underline transition-all" title="Página Anterior"><i class="fa-solid fa-chevron-left mr-1 md:mr-2 text-xs"></i> Anterior</a>`;
  } else {
    html += `<span class="flex items-center px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-gray-400 font-bold cursor-not-allowed"><i class="fa-solid fa-chevron-left mr-1 md:mr-2 text-xs"></i> Anterior</span>`;
  }
  let startPage = Math.max(1, atual - 4);
  let endPage = Math.min(total, atual + 5);
  if (startPage === 1) endPage = Math.min(total, 10);
  if (endPage === total) startPage = Math.max(1, total - 9);
  if (startPage > 1) {
    html += `<a href="${linkPagina(1)}" class="px-3 py-2 text-sm md:text-base text-[#4A90E2] hover:underline transition-all font-medium">1</a>`;
    if (startPage > 2) html += `<span class="px-2 py-2 text-sm text-gray-500">...</span>`;
  }
  for (let i = startPage; i <= endPage; i++) {
    if (i === atual) {
      html += `<span class="px-3 py-2 text-sm md:text-base text-gray-900 font-black cursor-default">${i}</span>`;
    } else {
      html += `<a href="${linkPagina(i)}" class="px-3 py-2 text-sm md:text-base text-[#4A90E2] hover:underline transition-all font-medium">${i}</a>`;
    }
  }
  if (endPage < total) {
    if (endPage < total - 1) html += `<span class="px-2 py-2 text-sm text-gray-500">...</span>`;
    html += `<a href="${linkPagina(total)}" class="px-3 py-2 text-sm md:text-base text-[#4A90E2] hover:underline transition-all font-medium">${total}</a>`;
  }
  if (atual < total) {
    html += `<a href="${linkPagina(atual + 1)}" class="flex items-center px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-[#4A90E2] font-bold hover:underline transition-all" title="Próxima Página">Próxima <i class="fa-solid fa-chevron-right ml-1 md:ml-2 text-xs"></i></a>`;
  } else {
    html += `<span class="flex items-center px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-gray-400 font-bold cursor-not-allowed">Próxima <i class="fa-solid fa-chevron-right ml-1 md:ml-2 text-xs"></i></span>`;
  }
  html += '</nav>';
  return html;
}

function construirPaginas() {
  console.log("🚀 Iniciando build.js (Correção de injeção ativada e Badges preservados)...");

  if (!fs.existsSync(JSON_DATABASE_FILE)) return console.error("❌ biblioteca.json não encontrado");
  if (!fs.existsSync(TEMPLATE_FILE)) return console.error(`❌ ${TEMPLATE_FILE} não encontrado`);

  const rawData = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));

  // Mantendo a lógica de ordem invertida para mostrar as novidades primeiro
  const data = rawData.reverse();

  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  const templateHash = sha256(template);
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  if (fs.existsSync(OUTPUT_DIR)) {
    try {
      fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    } catch (e) {}
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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
    const seoKeywords = "enfermagem, documentos de enfermagem, biblioteca de enfermagem, pdf enfermagem, escalas de enfermagem, materiais de estudo enfermagem";
    const canonicalUrl = page === 1 ? `https://www.calculadorasdeenfermagem.com.br/downloads.html` : `https://www.calculadorasdeenfermagem.com.br/downloads/page${page}.html`;

    const schemaOrgObj = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": seoTitle,
      "description": seoDescription,
      "url": canonicalUrl,
      "publisher": {
        "@type": "Organization",
        "name": "Calculadoras de Enfermagem",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.calculadorasdeenfermagem.com.br/iconpages.webp"
        }
      }
    };
    const schemaOrg = JSON.stringify(schemaOrgObj);

    const breadcrumbsObj = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Início",
          "item": "https://www.calculadorasdeenfermagem.com.br/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Biblioteca de Enfermagem",
          "item": "https://www.calculadorasdeenfermagem.com.br/downloads.html"
        }
      ]
    };
    const breadcrumbs = JSON.stringify(breadcrumbsObj);

    let html = template;

    html = injetar(html, "<!-- TODOS -->", todos);
    html = injetar(html, "<!-- DOCUMENTOS -->", documentos);
    html = injetar(html, "<!-- FOTOS -->", fotos);
    html = injetar(html, "<!-- VIDEOS -->", videos);
    html = injetar(html, "<!-- PAGINATION -->", pagination);

    html = injetar(html, "<!-- SEO_TITLE -->", seoTitle);
    html = injetar(html, "<!-- SEO_DESCRIPTION -->", seoDescription);
    html = injetar(html, "<!-- SEO_KEYWORDS -->", seoKeywords);
    html = injetar(html, "<!-- CANONICAL_URL -->", canonicalUrl);
    html = injetar(html, "<!-- SCHEMA_ORG -->", schemaOrg);
    html = injetar(html, "<!-- BREADCRUMBS -->", breadcrumbs);

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

  console.log("✅ Downloads gerados com sucesso (Falhas de memória corrigidas)!");
  console.log(`📄 Total de páginas geradas: ${processados}`);
}

construirPaginas();