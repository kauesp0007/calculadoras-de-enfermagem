/* eslint-env node */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/* ===============================
   CONFIGURAÇÕES GERAIS E SEO
================================ */
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "item.template.html";
const OUTPUT_DIR = "biblioteca";
const BASE_URL = "https://www.calculadorasdeenfermagem.com.br";

/**
 * Marker com hash do template.
 */
const TEMPLATE_HASH_MARKER_PREFIX = "BIBLIOTECA_ITEM_TEMPLATE_HASH:";

/**
 * Se true, remove arquivos órfãos (existem em /biblioteca mas não existem mais no biblioteca.json).
 */
const DELETE_ORPHANS = false;

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

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function detectarTipoPeloArquivo(ficheiro) {
  const f = String(ficheiro || "").toLowerCase();
  const ext = f.split("?")[0].split("#")[0].split(".").pop();

  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return "Imagem";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "Vídeo";
  if (["pdf"].includes(ext)) return "PDF";
  if (["doc", "docx"].includes(ext)) return "Word";
  if (["ppt", "pptx"].includes(ext)) return "PowerPoint";
  if (["xls", "xlsx", "csv"].includes(ext)) return "Planilha";
  return "Arquivo";
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

function ensureTemplateHashMarker(html, templateHash) {
  const marker = `<!-- ${TEMPLATE_HASH_MARKER_PREFIX}${templateHash} -->`;
  const re = new RegExp(`<!--\\s*${TEMPLATE_HASH_MARKER_PREFIX}[a-f0-9]{8,64}\\s*-->`, "ig");
  if (re.test(html)) {
    return html.replace(re, marker);
  }
  if (html.includes("</head>")) {
    return html.replace("</head>", `\n  ${marker}\n</head>`);
  }
  return `${marker}\n${html}`;
}

/* ===============================
   PREV/NEXT ADAPTADO PARA IDIOMAS
================================ */
function normalizarSlugParaArquivo(slug) {
  let s = String(slug || "").trim();
  s = s.replace(/^\/+/, "");
  s = s.replace(/^biblioteca\//i, "");
  s = s.split("?")[0].split("#")[0];
  s = s.replace(/\.html$/i, "");
  return s;
}

function montarUrlBiblioteca(slug) {
  const s = normalizarSlugParaArquivo(slug);
  if (!s) return "";
  return `/biblioteca/${s}.html`;
}

function buildPrevNext(data, idx) {
  const prev = idx > 0 ? data[idx - 1] : null;
  const next = idx < data.length - 1 ? data[idx + 1] : null;

  const prevSlug = prev ? slugify(prev.titulo || "") : "";
  const nextSlug = next ? slugify(next.titulo || "") : "";

  const prevUrl = montarUrlBiblioteca(prevSlug);
  const nextUrl = montarUrlBiblioteca(nextSlug);

  return {
    prevUrl,
    nextUrl,
    prevStyle: prevUrl ? "" : "display:none",
    nextStyle: nextUrl ? "" : "display:none",
    prevClass: prevUrl ? "" : "disabled",
    nextClass: nextUrl ? "" : "disabled",
  };
}

/* ===============================
   LIGHTBOX
================================ */
function montarBlocoLightbox(imagens) {
  return `
<!-- LIGHTBOX -->
<div id="lightbox" class="fixed inset-0 bg-black/90 hidden z-50 flex items-center justify-center animate-fade">
  <button onclick="fecharLightbox()" class="absolute top-6 right-6 text-white text-3xl" aria-label="Fechar">✕</button>
  <button onclick="toggleFullscreen()" class="absolute top-6 left-6 text-white text-xl" aria-label="Tela cheia">⛶</button>
  <button onclick="prevImagem()" class="absolute left-6 text-white text-4xl" aria-label="Anterior">←</button>
  <button onclick="nextImagem()" class="absolute right-6 text-white text-4xl" aria-label="Próxima">→</button>
  <div class="text-center px-4">
    <img id="lightbox-img" class="max-w-full max-h-[85vh] mx-auto rounded-lg touch-pan-x touch-pan-y" style="touch-action: pinch-zoom;" />
    <p id="contador" class="text-gray-300 text-sm mt-2"></p>
    <p id="lightbox-legenda" class="text-gray-400 text-sm mt-1"></p>
  </div>
</div>
<script>
  const imagens = ${JSON.stringify(imagens)};
  let indiceAtual = 0;
  let startX = 0;
  function abrirLightbox(i) {
    indiceAtual = i;
    atualizar();
    document.getElementById("lightbox").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function fecharLightbox() {
    document.getElementById("lightbox").classList.add("hidden");
    document.body.style.overflow = "";
    if (document.fullscreenElement) document.exitFullscreen();
  }
  function atualizar() {
    const item = imagens[indiceAtual];
    document.getElementById("lightbox-img").src = item.ficheiro;
    document.getElementById("lightbox-legenda").textContent = item.titulo + " — " + (item.descricao || "");
    document.getElementById("contador").textContent = "Imagem " + (indiceAtual + 1) + " / " + imagens.length;
    preload();
  }
  function preload() {
    [indiceAtual - 1, indiceAtual + 1].forEach(i => {
      if (imagens[i]) new Image().src = imagens[i].ficheiro;
    });
  }
  function nextImagem() { indiceAtual = (indiceAtual + 1) % imagens.length; atualizar(); }
  function prevImagem() { indiceAtual = (indiceAtual - 1 + imagens.length) % imagens.length; atualizar(); }
  function toggleFullscreen() {
    const lb = document.getElementById("lightbox");
    if (!document.fullscreenElement) lb.requestFullscreen();
    else document.exitFullscreen();
  }
  document.getElementById("lightbox").addEventListener("touchstart", e => { startX = e.touches[0].clientX; });
  document.getElementById("lightbox").addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) nextImagem();
    if (endX - startX > 50) prevImagem();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") nextImagem();
    if (e.key === "ArrowLeft") prevImagem();
    if (e.key === "Escape") fecharLightbox();
  });
</script>
<style>
@keyframes fade { from { opacity: 0 } to { opacity: 1 } }
.animate-fade { animation: fade .25s ease-in-out }
</style>
`;
}

/* ===============================
   GERADOR DE HTML DE UM ITEM (APENAS IDIOMA PADRÃO)
================================ */
function gerarHtmlDoItem({ template, templateHash, data, imagens, item, idx }) {
  const slug = item.slug || slugify(item.titulo);
  const descricao = item.descricao || `Material de enfermagem sobre ${item.titulo}.`;
  const categoria = item.categoria || "documentos";
  const tipo = item.tipo || detectarTipoPeloArquivo(item.ficheiro);
  const nav = buildPrevNext(data, idx);
  const capa = item.capa || item.ficheiro;

  // SEO VARIÁVEIS ABSOLUTAS
  const canonicalUrl = `${BASE_URL}/biblioteca/${slug}.html`;
  const seoTitle = `${escapeHtml(item.titulo)} – Biblioteca de Enfermagem`;
  const seoDesc = escapeHtml(descricao);
  const seoKeywords = escapeHtml(item.tags || item.titulo);
  const ogImage = `${BASE_URL}/${escapeHtml(capa).replace(/^\/+/, "")}`;

  // GERADOR DE HREFLANG (Apenas pt-br e x-default para a raiz)
  let hreflangTags = `  <link rel="alternate" hreflang="pt-br" href="${canonicalUrl}">\n`;
  hreflangTags += `  <link rel="alternate" hreflang="x-default" href="${canonicalUrl}">\n`;

  // GERADOR DE BREADCRUMBS
  const breadcrumbsHtml = `
    <ol class="flex items-center space-x-2 w-full truncate">
      <li><a href="/" class="hover:text-blue-600 transition-colors">Início</a></li>
      <li><span class="text-gray-400">/</span></li>
      <li><a href="/downloads.html" class="hover:text-blue-600 transition-colors">Biblioteca</a></li>
      <li><span class="text-gray-400">/</span></li>
      <li class="text-gray-800 font-semibold truncate" aria-current="page" title="${escapeHtml(item.titulo)}">${escapeHtml(item.titulo)}</li>
    </ol>
  `;

  // SCHEMA.ORG (JSON-LD)
  const schemaObj = {
    "@context": "https://schema.org",
    "@type": categoria === 'fotos' ? "ImageObject" : "Article",
    "name": escapeHtml(item.titulo),
    "headline": escapeHtml(item.titulo),
    "description": seoDesc,
    "image": ogImage,
    "url": canonicalUrl,
    "author": { "@type": "Organization", "name": "Calculadoras de Enfermagem", "url": BASE_URL },
    "publisher": { "@type": "Organization", "name": "Calculadoras de Enfermagem", "logo": { "@type": "ImageObject", "url": `${BASE_URL}/iconpages.webp` } }
  };
  const schemaJson = JSON.stringify(schemaObj, null, 2);

  let html = template;

  // SUBSTITUIÇÃO DAS VARIÁVEIS SEO E CONTEÚDO
  html = html
    .replace(/{{SEO_TITLE}}/g, seoTitle)
    .replace(/{{SEO_DESCRIPTION}}/g, seoDesc)
    .replace(/{{SEO_KEYWORDS}}/g, seoKeywords)
    .replace(/{{CANONICAL_URL}}/g, canonicalUrl)
    .replace(/{{HREFLANG_TAGS}}/g, hreflangTags)
    .replace(/{{OG_IMAGE}}/g, ogImage)
    .replace(/{{SCHEMA_JSON}}/g, schemaJson)
    .replace(/{{BREADCRUMBS_HTML}}/g, breadcrumbsHtml)
    .replace(/{{TITULO}}/g, escapeHtml(item.titulo))
    .replace(/{{DESCRICAO}}/g, seoDesc)
    .replace(/{{TAGS}}/g, seoKeywords)
    .replace(/{{SLUG}}/g, escapeHtml(slug))
    .replace(/{{CAPA}}/g, escapeHtml(capa).replace(/^\/+/, ""))
    .replace(/{{FICHEIRO}}/g, escapeHtml(item.ficheiro).replace(/^\/+/, ""))
    .replace(/{{CATEGORIA}}/g, escapeHtml(categoria))
    .replace(/{{TIPO}}/g, escapeHtml(tipo))
    .replace(/{{PREV_URL}}/g, escapeHtml(nav.prevUrl))
    .replace(/{{NEXT_URL}}/g, escapeHtml(nav.nextUrl))
    .replace(/{{PREV_STYLE}}/g, escapeHtml(nav.prevStyle))
    .replace(/{{NEXT_STYLE}}/g, escapeHtml(nav.nextStyle))
    .replace(/{{PREV_CLASS}}/g, escapeHtml(nav.prevClass))
    .replace(/{{NEXT_CLASS}}/g, escapeHtml(nav.nextClass));

  if (categoria === "fotos") {
    const indiceImagem = imagens.findIndex((i) => i.slug === slug);
    html = html.replace(
      /<img[^>]*class="w-full[^"]*biblioteca-hero-img"[^>]*>/i,
      `<img src="${item.ficheiro}" alt="Capa de ${escapeHtml(item.titulo)}" class="w-full rounded-xl mb-6 biblioteca-hero-img cursor-zoom-in" loading="lazy" decoding="async" onclick="abrirLightbox(${indiceImagem})">`
    );
    const bloco = montarBlocoLightbox(imagens);
    html = html.replace("</body>", `\n${bloco}\n</body>`);
  }

  html = ensureTemplateHashMarker(html, templateHash);
  return { slug, html };
}

/* ===============================
   CONSTRUTOR PRINCIPAL
================================ */
function construirBiblioteca() {
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

  if (!Array.isArray(data)) {
    console.error("❌ biblioteca.json precisa ser um ARRAY de itens");
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const imagens = data
    .filter((i) => i && i.categoria === "fotos")
    .map((i) => ({
      titulo: i.titulo || "",
      descricao: i.descricao || "",
      ficheiro: i.ficheiro || "",
      slug: i.slug || slugify(i.titulo || ""),
    }));

  const expectedSlugs = new Set();
  let criados = 0;
  let atualizados = 0;
  let inalterados = 0;
  let puladosPorErro = 0;

  data.forEach((item, idx) => {
    if (!item || !item.titulo || !item.ficheiro) {
      puladosPorErro++;
      return;
    }

    const itemSlug = item.slug || slugify(item.titulo);
    expectedSlugs.add(itemSlug);

    const { slug, html } = gerarHtmlDoItem({
      template,
      templateHash,
      data,
      imagens,
      item,
      idx
    });

    const outFile = path.join(OUTPUT_DIR, `${slug}.html`);

    if (fs.existsSync(outFile)) {
      const current = fs.readFileSync(outFile, "utf8");
      if (current === html) {
        inalterados++;
        return;
      }
      fs.writeFileSync(outFile, html, "utf8");
      atualizados++;
    } else {
      fs.writeFileSync(outFile, html, "utf8");
      criados++;
    }
  });

  // Remover órfãos
  if (DELETE_ORPHANS) {
    if (fs.existsSync(OUTPUT_DIR)) {
      const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.toLowerCase().endsWith(".html"));
      let removidos = 0;
      for (const f of files) {
        const slug = f.replace(/\.html$/i, "");
        if (!expectedSlugs.has(slug)) {
          fs.unlinkSync(path.join(OUTPUT_DIR, f));
          removidos++;
        }
      }
      if (removidos > 0) console.log(`🧹 ${removidos} arquivos órfãos removidos em ${OUTPUT_DIR}.`);
    }
  }

  console.log("✅ build-biblioteca concluído com Motor de SEO (Apenas PT-BR)");
  console.log(`➕ Ficheiros Criados: ${criados}`);
  console.log(`♻️ Ficheiros Atualizados: ${atualizados}`);
  console.log(`⏭️ Ficheiros Inalterados: ${inalterados}`);
  if (puladosPorErro) console.log(`⚠️ Itens com erro na base (pulados): ${puladosPorErro}`);
  console.log(`🔖 Template hash atual: ${templateHash}`);
}

construirBiblioteca();