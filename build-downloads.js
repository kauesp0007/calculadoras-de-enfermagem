/* eslint-env node */
const fs = require("fs");
const path = require("path");

const JSON_DATABASE = "biblioteca.json";
const TEMPLATE_FILE = "downloads.template.html";
const ITEMS_PER_PAGE = 250;

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function gerarCardGoogleImages(item) {
  const titulo = item.titulo || "Sem título";
  const slug = item.slug || slugify(titulo);
  let imagePath = item.capa || item.ficheiro || "";
  if (imagePath && !imagePath.startsWith("/")) imagePath = "/" + imagePath;

  let ext = path.extname(item.ficheiro || "").toLowerCase().replace(".", "");
  if (!ext && (item.categoria === "fotos" || item.categoria === "imagens")) ext = "png";
  if (!ext && (item.categoria === "documentos" || item.categoria === "pdf")) ext = "pdf";

  // Pequeno símbolo (badge) acima do card
  let badgeConfig = { bg: "#f3f4f6", text: "#374151", icon: "fa-solid fa-file", label: ext.toUpperCase() || "ARQUIVO" };
  if (ext === "pdf") badgeConfig = { bg: "#fee2e2", text: "#b91c1c", icon: "fa-solid fa-file-pdf", label: "PDF" };
  else if (["doc", "docx"].includes(ext)) badgeConfig = { bg: "#dbeafe", text: "#1d4ed8", icon: "fa-solid fa-file-word", label: "WORD" };
  else if (["xls", "xlsx"].includes(ext)) badgeConfig = { bg: "#dcfce3", text: "#15803d", icon: "fa-solid fa-file-excel", label: "EXCEL" };
  else if (["mp4", "webm"].includes(ext)) badgeConfig = { bg: "#f3e8ff", text: "#7e22ce", icon: "fa-solid fa-video", label: "VÍDEO" };
  else if (["png", "jpg", "jpeg", "webp", "svg"].includes(ext)) badgeConfig = { bg: "#d1fae5", text: "#047857", icon: "fa-solid fa-image", label: ext.toUpperCase() };

  const badgeHtml = `<div class="absolute top-2 right-2 text-[9px] font-black uppercase px-2 py-1 rounded shadow-sm z-20 flex items-center gap-1 backdrop-blur-md" style="background-color: ${badgeConfig.bg}; color: ${badgeConfig.text};"><i class="${badgeConfig.icon}"></i> ${badgeConfig.label}</div>`;

  // LÓGICA DE CORREÇÃO DE MÍDIA: Previne "broken image" para PDFs e Vídeos sem capa
  const isImagePathValidImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(imagePath);
  let mediaVisualHtml = "";

  if (isImagePathValidImage) {
    // Se for formato válido de imagem, exibe a imagem de capa (Google Images original)
    mediaVisualHtml = `<img src="${imagePath}" class="max-w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90" alt="${titulo}" loading="lazy">`;
  } else {
    // Fallback visual para Documentos e Vídeos que tentam carregar no img
    mediaVisualHtml = `
      <div class="w-full h-full flex flex-col items-center justify-center transition-colors bg-gray-50 group-hover:bg-gray-100">
        <i class="${badgeConfig.icon} text-5xl mb-2 transition-transform duration-300 group-hover:scale-110" style="color: ${badgeConfig.text}90;"></i>
        <span class="text-[9px] font-black uppercase tracking-widest text-gray-400">Ver Arquivo</span>
      </div>`;
  }

  return `
<a href="/biblioteca/${slug}.html" data-slug="${slug}" class="file-card group relative flex flex-col bg-transparent rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 block">
  <!-- Imagem ou Ícone em destaque -->
  <div class="relative w-full h-[160px] md:h-[180px] bg-gray-100 flex items-center justify-center overflow-hidden rounded-xl border border-gray-200">
    ${badgeHtml}
    ${mediaVisualHtml}
  </div>
  <!-- Texto minimalista logo abaixo -->
  <div class="pt-2 pb-1 flex flex-col justify-start">
    <span class="file-card-title text-left text-xs md:text-sm font-medium text-gray-800 group-hover:text-[#1A3E74] transition-colors line-clamp-2 leading-snug">${titulo}</span>
  </div>
</a>`;
}

function gerarPaginacaoHTML(currentPage, totalPages) {
  if (totalPages <= 1) return "";

  let html = `<nav class="flex items-center justify-center space-x-1 md:space-x-2 my-8">`;

  // Botão Anterior
  if (currentPage > 1) {
    const prevLink = currentPage === 2 ? "/downloads.html" : `/downloads/page${currentPage - 1}.html`;
    html += `<a href="${prevLink}" class="flex items-center px-3 py-2 text-sm md:text-base text-[#4A90E2] font-bold hover:underline"><i class="fa-solid fa-chevron-left mr-1"></i> Anterior</a>`;
  } else {
    html += `<span class="flex items-center px-3 py-2 text-sm md:text-base text-gray-400 font-bold cursor-not-allowed"><i class="fa-solid fa-chevron-left mr-1"></i> Anterior</span>`;
  }

  // Lógica simples de páginas
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<span class="px-3 py-2 text-sm md:text-base text-gray-900 font-black border-b-2 border-gray-900">${i}</span>`;
    } else {
      const link = i === 1 ? "/downloads.html" : `/downloads/page${i}.html`;
      // Mostra as 3 primeiras, as 3 últimas, e a página ao redor da atual
      if (i <= 3 || i >= totalPages - 2 || Math.abs(i - currentPage) <= 1) {
        html += `<a href="${link}" class="px-3 py-2 text-sm md:text-base text-gray-500 hover:text-[#4A90E2] hover:underline transition-all">${i}</a>`;
      } else if (i === 4 && currentPage > 5) {
        html += `<span class="px-2 py-2 text-sm text-gray-400">...</span>`;
      } else if (i === totalPages - 3 && currentPage < totalPages - 4) {
        html += `<span class="px-2 py-2 text-sm text-gray-400">...</span>`;
      }
    }
  }

  // Botão Próxima
  if (currentPage < totalPages) {
    html += `<a href="/downloads/page${currentPage + 1}.html" class="flex items-center px-3 py-2 text-sm md:text-base text-[#4A90E2] font-bold hover:underline">Próxima <i class="fa-solid fa-chevron-right ml-1"></i></a>`;
  }

  html += `</nav>`;
  return html;
}

function construirPaginas() {
  console.log("🚀 Iniciando geração de Downloads...");
  if (!fs.existsSync(JSON_DATABASE) || !fs.existsSync(TEMPLATE_FILE)) {
    return console.error("❌ biblioteca.json ou template ausentes.");
  }

  const biblioteca = JSON.parse(fs.readFileSync(JSON_DATABASE, "utf8"));
  const templateRaw = fs.readFileSync(TEMPLATE_FILE, "utf8");

  const totalPages = Math.ceil(biblioteca.length / ITEMS_PER_PAGE);

  if (!fs.existsSync("downloads")) fs.mkdirSync("downloads");

  for (let page = 1; page <= totalPages; page++) {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const itemsDaPagina = biblioteca.slice(startIndex, endIndex);

    let htmlTodos = "", htmlDocs = "", htmlFotos = "", htmlVideos = "";

    itemsDaPagina.forEach((item) => {
      const card = gerarCardGoogleImages(item);
      htmlTodos += card;
      const cat = String(item.categoria || "").toLowerCase().trim();
      
      // Maior tolerância na distribuição de categorias para não perder itens nas abas
      if (cat.includes("doc") || cat.includes("pdf")) htmlDocs += card;
      if (cat.includes("foto") || cat.includes("ima") || cat === "png" || cat === "jpg") htmlFotos += card;
      if (cat.includes("video") || cat.includes("vídeo") || cat === "mp4") htmlVideos += card;
    });

    let resultHtml = templateRaw
      .replace("<!-- TODOS -->", htmlTodos)
      .replace("<!-- DOCUMENTOS -->", htmlDocs)
      .replace("<!-- FOTOS -->", htmlFotos)
      .replace("<!-- VIDEOS -->", htmlVideos)
      .replace("<!-- PAGINATION -->", gerarPaginacaoHTML(page, totalPages));

    // SEO Metas
    const title = `Biblioteca de Enfermagem — Página ${page}`;
    const desc = `Biblioteca de Enfermagem com materiais, apostilas e documentos para download — Página ${page} de ${totalPages}.`;
    const canonical = page === 1 ? `https://www.calculadorasdeenfermagem.com.br/downloads.html` : `https://www.calculadorasdeenfermagem.com.br/downloads/page${page}.html`;

    resultHtml = resultHtml
      .replace(/<!-- SEO_TITLE -->/g, title)
      .replace(/<!-- SEO_DESCRIPTION -->/g, desc)
      .replace(/<!-- SEO_KEYWORDS -->/g, "enfermagem, biblioteca de enfermagem, pdf enfermagem, imagens de enfermagem, materiais de estudo")
      .replace(/<!-- CANONICAL_URL -->/g, canonical);

    const outputPath = page === 1 ? "downloads.html" : `downloads/page${page}.html`;
    fs.writeFileSync(outputPath, resultHtml, "utf8");
    console.log(`✅ Página ${page} gerada com ${itemsDaPagina.length} itens. Caminho: ${outputPath}`);
  }
}

construirPaginas();