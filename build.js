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

// Substituição segura: substitui TODAS as ocorrências sem Regex e sem split/join
function injetar(html, marcador, conteudo) {
    if (!html || !marcador) return html;
    let resultado = html;
    while (resultado.includes(marcador)) {
        resultado = resultado.replace(marcador, conteudo);
    }
    return resultado;
}

function ensureTemplateHashMarker(html, templateHash) {
  const marker = `<!-- ${TEMPLATE_HASH_MARKER_PREFIX}${templateHash} -->`;
  const re = new RegExp(`<!-- ${TEMPLATE_HASH_MARKER_PREFIX}.*? -->`, "ig");
  if (re.test(html)) return html.replace(re, marker);
  if (html.includes("</head>")) return html.replace("</head>", `\n  ${marker}\n</head>`);
  return `${marker}\n${html}`;
}

// Função que escreve por cima sem tentar ler o ficheiro gigante antigo (Evita memory leak)
function forcarEscrita(filepath, content) {
  fs.writeFileSync(filepath, content, "utf8");
}

function criarCartaoHTML(item) {
  let capa = item.capa || item.ficheiro || "";
  if (capa && !capa.startsWith("/")) capa = "/" + capa;

  const titulo = item.titulo || "Sem título";
  const slug = slugify(titulo);

  // Tratamento da descrição para o Lightbox. Caso não exista, gera um texto padrão.
  const descricaoRaw = item.descricao && item.descricao.trim() !== ""
    ? item.descricao
    : `Baixe agora o material completo sobre ${titulo} na nossa Biblioteca de Enfermagem.`;
  const descricaoSegura = escapeHtml(descricaoRaw);

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
    <!-- Div oculta com a descrição para o Lightbox -->
    <div class="item-description-hidden hidden">${descricaoSegura}</div>
  </figure>
</a>`;
}

function linkPagina(pageNum) {
  return pageNum === 1 ? `/downloads.html` : `/downloads/page${pageNum}.html`;
}

// -------------------------------------------------------------------------
// NOVA PAGINAÇÃO: ESTILO GOOGLE SEARCH (Moderna, limpa e funcional)
// -------------------------------------------------------------------------
function gerarPaginacao(total, atual) {
  if (total <= 1) return "";

  let html = '<nav class="flex items-center justify-center space-x-1 md:space-x-2 my-8">';

  // Botão "Anterior"
  if (atual > 1) {
    html += `<a href="${linkPagina(atual - 1)}" class="flex items-center px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-[#4A90E2] font-bold hover:underline transition-all" title="Página Anterior"><i class="fa-solid fa-chevron-left mr-1 md:mr-2 text-xs"></i> Anterior</a>`;
  } else {
    html += `<span class="flex items-center px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-gray-400 font-bold cursor-not-allowed"><i class="fa-solid fa-chevron-left mr-1 md:mr-2 text-xs"></i> Anterior</span>`;
  }

  // Números da Página (Janela deslizante de 10 páginas máximo)
  let startPage = Math.max(1, atual - 4);
  let endPage = Math.min(total, atual + 5);

  // Ajuste fino para sempre mostrar um bom bloco de números
  if (startPage === 1) endPage = Math.min(total, 10);
  if (endPage === total) startPage = Math.max(1, total - 9);

  if (startPage > 1) {
    html += `<a href="${linkPagina(1)}" class="px-3 py-2 text-sm md:text-base text-[#4A90E2] hover:underline transition-all font-medium">1</a>`;
    if (startPage > 2) html += `<span class="px-2 py-2 text-sm text-gray-500">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === atual) {
      // Página atual: Negrito e sem link
      html += `<span class="px-3 py-2 text-sm md:text-base text-gray-900 font-black cursor-default">${i}</span>`;
    } else {
      html += `<a href="${linkPagina(i)}" class="px-3 py-2 text-sm md:text-base text-[#4A90E2] hover:underline transition-all font-medium">${i}</a>`;
    }
  }

  if (endPage < total) {
    if (endPage < total - 1) html += `<span class="px-2 py-2 text-sm text-gray-500">...</span>`;
    html += `<a href="${linkPagina(total)}" class="px-3 py-2 text-sm md:text-base text-[#4A90E2] hover:underline transition-all font-medium">${total}</a>`;
  }

  // Botão "Próxima"
  if (atual < total) {
    html += `<a href="${linkPagina(atual + 1)}" class="flex items-center px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-[#4A90E2] font-bold hover:underline transition-all" title="Próxima Página">Próxima <i class="fa-solid fa-chevron-right ml-1 md:ml-2 text-xs"></i></a>`;
  } else {
    html += `<span class="flex items-center px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-gray-400 font-bold cursor-not-allowed">Próxima <i class="fa-solid fa-chevron-right ml-1 md:ml-2 text-xs"></i></span>`;
  }

  html += '</nav>';
  return html;
}

function construirPaginas() {
  console.log("🚀 Iniciando build.js (Paginação Estilo Google & Otimização SEO)...");

  if (!fs.existsSync(JSON_DATABASE_FILE)) return console.error("❌ biblioteca.json não encontrado");
  if (!fs.existsSync(TEMPLATE_FILE)) return console.error(`❌ ${TEMPLATE_FILE} não encontrado`);

  // Sistema de segurança para identificar qual ficheiro está corrompido
  const statJson = fs.statSync(JSON_DATABASE_FILE);
  const statTemplate = fs.statSync(TEMPLATE_FILE);
  if (statJson.size > 20 * 1024 * 1024) return console.error("🚨 O seu ficheiro biblioteca.json está gigantesco/corrompido!");
  if (statTemplate.size > 20 * 1024 * 1024) return console.error("🚨 O seu ficheiro downloads.template.html está gigantesco/corrompido!");

  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  const templateHash = sha256(template);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  // Limpa o diretório de destino
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

    // Configuração do Schema.org para Coleção de Páginas
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

    // Configuração do Breadcrumbs
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

    // Dentro da função construirPaginas, substitua o bloco de injeção por este:
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

  console.log("✅ Downloads gerados com sucesso (Paginação estilo Google aplicada)!");
  console.log(`📄 Total de páginas geradas: ${processados}`);
}

construirPaginas();