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
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function injetar(html, marcador, conteudo) {
    if (!html || !marcador) return html;
    return html.split(marcador).join(conteudo);
}

function ensureTemplateHashMarker(html, templateHash) {
  const marker = ``;
  const re = new RegExp(``, "ig");
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
  const descricaoRaw = item.descricao && item.descricao.trim() !== "" ? item.descricao : `Baixe agora o material completo sobre ${titulo}.`;
  const descricaoSegura = escapeHtml(descricaoRaw);

  let filePath = item.download || item.ficheiro || "";
  let ext = path.extname(filePath).toLowerCase().replace('.', '');
  if (!ext && filePath.match(/\.(mp4|webm|ogg)$/i)) ext = 'mp4';
  if (!ext && (item.categoria === 'fotos' || item.categoria === 'imagens')) ext = 'png';
  if (!ext && (item.categoria === 'documentos' || item.categoria === 'pdf')) ext = 'pdf';

  let fileTypeBadgeHtml = "";
  if (ext) {
      let label = ext.toUpperCase();
      let bgHex = "#f3f4f6"; let textHex = "#374151"; let icon = "fa-solid fa-file";
      if (ext === 'pdf') { bgHex = "#fee2e2"; textHex = "#b91c1c"; icon = "fa-solid fa-file-pdf"; }
      else if (['doc', 'docx'].includes(ext)) { label = "WORD"; bgHex = "#dbeafe"; textHex = "#1d4ed8"; icon = "fa-solid fa-file-word"; }
      else if (['mp4', 'webm', 'ogg'].includes(ext)) { bgHex = "#f3e8ff"; textHex = "#7e22ce"; icon = "fa-solid fa-video"; }
      else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) { bgHex = "#d1fae5"; textHex = "#047857"; icon = "fa-solid fa-image"; }
      fileTypeBadgeHtml = `<div class="absolute top-2 right-2 text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm z-20 flex items-center gap-1" style="background-color: ${bgHex}; color: ${textHex};"><i class="${icon}"></i> ${label}</div>`;
  }

  const cat = String(item.categoria || "").toLowerCase().trim();
  const isVideo = cat === "videos" || cat === "vídeos" || capa.match(/\.(mp4|webm|ogg)$/i);

  // A MUDANÇA PRINCIPAL: Todo o cartão é um link <a>. Isso elimina qualquer problema de "clique" ou "trava".
  // Removemos o onclick do div e deixamos o link navegar.
  return `
<a href="/biblioteca/${slug}.html" class="file-card group relative flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all focus:outline-none focus:ring-0">
  <div class="relative w-full h-[200px] ${isVideo ? 'bg-slate-900' : 'bg-[#E2E8F0]'} flex items-center justify-center overflow-hidden">
    ${fileTypeBadgeHtml}
    ${isVideo ? `
    <video src="${capa}#t=0.1" class="w-full h-full object-cover opacity-90 group-hover:opacity-100"></video>
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="bg-black/60 rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm"><i class="fa-solid fa-play text-white text-xl"></i></div>
    </div>` : `
    <img src="${capa}" class="max-w-full max-h-full object-contain" alt="${titulo}" loading="lazy">`}
  </div>
  <div class="p-3 flex-grow flex flex-col justify-center">
    <span class="file-card-title text-center text-sm font-bold text-gray-700 group-hover:text-[#4A90E2] transition-colors line-clamp-2">${titulo}</span>
  </div>
</a>`;
}

// ... (O restante da estrutura do seu build.js permanece o mesmo para a paginação)
function linkPagina(pageNum) { return pageNum === 1 ? `/downloads.html` : `/downloads/page${pageNum}.html`; }
// ... (Copie o resto da estrutura do seu arquivo anterior aqui)