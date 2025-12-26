/* eslint-env node */
const fs = require("fs");
const path = require("path");

/* ===============================
   CONFIGURAÇÕES
================================ */
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "item.template.html";
const OUTPUT_DIR = "biblioteca";

// ✅ NOVO MARKER: força rebuild uma vez (V3)
const GENERATED_MARKER = "BIBLIOTECA_ITEM_TEMPLATE_V3";

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

/* ===============================
   PREV/NEXT (URLS SEMPRE /biblioteca/slug.html)
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

  const prevSlug = prev ? (prev.slug || slugify(prev.titulo || "")) : "";
  const nextSlug = next ? (next.slug || slugify(next.titulo || "")) : "";

  const prevUrl = montarUrlBiblioteca(prevSlug);
  const nextUrl = montarUrlBiblioteca(nextSlug);

  return {
    prevUrl,
    nextUrl,
    prevStyle: prevUrl ? "" : "display:none",
    nextStyle: nextUrl ? "" : "display:none",
  };
}

/* ===============================
   LIGHTBOX (mantém funcionalidades já existentes)
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
    <img id="lightbox-img"
      class="max-w-full max-h-[85vh] mx-auto rounded-lg touch-pan-x touch-pan-y"
      style="touch-action: pinch-zoom;" />

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
    document.getElementById("lightbox-legenda").textContent =
      item.titulo + " — " + (item.descricao || "");
    document.getElementById("contador").textContent =
      "Imagem " + (indiceAtual + 1) + " / " + imagens.length;
    preload();
  }

  function preload() {
    [indiceAtual - 1, indiceAtual + 1].forEach(i => {
      if (imagens[i]) new Image().src = imagens[i].ficheiro;
    });
  }

  function nextImagem() {
    indiceAtual = (indiceAtual + 1) % imagens.length;
    atualizar();
  }

  function prevImagem() {
    indiceAtual = (indiceAtual - 1 + imagens.length) % imagens.length;
    atualizar();
  }

  function toggleFullscreen() {
    const lb = document.getElementById("lightbox");
    if (!document.fullscreenElement) lb.requestFullscreen();
    else document.exitFullscreen();
  }

  document.getElementById("lightbox").addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });

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
@keyframes fade {
  from { opacity: 0 }
  to { opacity: 1 }
}
.animate-fade { animation: fade .25s ease-in-out }
</style>
`;
}

/* ===============================
   CONSTRUTOR PRINCIPAL
================================ */
function construirBiblioteca() {
  if (!fs.existsSync(JSON_DATABASE_FILE)) {
    console.error("❌ biblioteca.json não encontrado");
    return;
  }
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error(`❌ ${TEMPLATE_FILE} não encontrado`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  // Lista de imagens (para lightbox)
  const imagens = data
    .filter((i) => i.categoria === "fotos")
    .map((i) => ({
      titulo: i.titulo || "",
      descricao: i.descricao || "",
      ficheiro: i.ficheiro || "",
      slug: i.slug || slugify(i.titulo || ""),
    }));

  let gerados = 0;
  let ignorados = 0;

  data.forEach((item, idx) => {
    if (!item || !item.titulo || !item.ficheiro) return;

    const slug = item.slug || slugify(item.titulo);
    const descricao = item.descricao || `Material de enfermagem sobre ${item.titulo}.`;
    const categoria = item.categoria || "documentos";
    const tipo = item.tipo || detectarTipoPeloArquivo(item.ficheiro);

    const nav = buildPrevNext(data, idx);
    const capa = item.capa || item.ficheiro;

    const outFile = path.join(OUTPUT_DIR, `${slug}.html`);

    // ✅ Agora só ignora se já for V3
    if (fs.existsSync(outFile)) {
      const current = fs.readFileSync(outFile, "utf8");
      if (current.includes(GENERATED_MARKER)) {
        ignorados++;
        return;
      }
    }

    let html = template;

    html = html
      .replace(/{{TITULO}}/g, escapeHtml(item.titulo))
      .replace(/{{DESCRICAO}}/g, escapeHtml(descricao))
      .replace(/{{TAGS}}/g, escapeHtml(item.tags || item.titulo))
      .replace(/{{SLUG}}/g, escapeHtml(slug))
      .replace(/{{CAPA}}/g, escapeHtml(capa).replace(/^\/+/, ""))
      .replace(/{{FICHEIRO}}/g, escapeHtml(item.ficheiro).replace(/^\/+/, ""))
      .replace(/{{CATEGORIA}}/g, escapeHtml(categoria))
      .replace(/{{TIPO}}/g, escapeHtml(tipo))
      .replace(/{{PREV_URL}}/g, escapeHtml(nav.prevUrl))
      .replace(/{{NEXT_URL}}/g, escapeHtml(nav.nextUrl))
      .replace(/{{PREV_STYLE}}/g, escapeHtml(nav.prevStyle))
      .replace(/{{NEXT_STYLE}}/g, escapeHtml(nav.nextStyle));

    if (categoria === "fotos") {
      const indiceImagem = imagens.findIndex((i) => i.slug === slug);

      html = html.replace(
        /<img[^>]*class="w-full[^"]*biblioteca-hero-img"[^>]*>/i,
        `<img src="${item.ficheiro}" alt="Capa de ${escapeHtml(item.titulo)}" class="w-full rounded-xl mb-6 biblioteca-hero-img cursor-zoom-in" loading="lazy" decoding="async" onclick="abrirLightbox(${indiceImagem})">`
      );

      const bloco = montarBlocoLightbox(imagens);
      html = html.replace("</body>", `\n${bloco}\n</body>`);
    }

    // ✅ Injeta marker V3
    if (!html.includes(GENERATED_MARKER)) {
      html = html.replace("</head>", `\n<!-- ${GENERATED_MARKER} -->\n</head>`);
    }

    fs.writeFileSync(outFile, html, "utf8");
    gerados++;
  });

  console.log(`✅ ${gerados} páginas da biblioteca geradas/atualizadas com sucesso`);
  console.log(`⏭️ ${ignorados} páginas já estavam atualizadas e foram ignoradas`);
}

construirBiblioteca();
