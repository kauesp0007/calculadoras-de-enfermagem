/* eslint-env node */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/* ===============================
   CONFIGURAÇÕES
================================ */
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "item.template.html";
const OUTPUT_DIR = "biblioteca";

/**
 * Marker com hash do template.
 * Ex.: <!-- BIBLIOTECA_ITEM_TEMPLATE_HASH:abc123... -->
 */
const TEMPLATE_HASH_MARKER_PREFIX = "BIBLIOTECA_ITEM_TEMPLATE_HASH:";

/**
 * Se true, remove arquivos órfãos (existem em /biblioteca mas não existem mais no biblioteca.json).
 * Você NÃO pediu remoção, então deixei false.
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

function extractTemplateHashFromHtml(html) {
  const re = new RegExp(`${TEMPLATE_HASH_MARKER_PREFIX}([a-f0-9]{8,64})`, "i");
  const m = String(html || "").match(re);
  return m ? m[1].toLowerCase() : null;
}

function ensureTemplateHashMarker(html, templateHash) {
  const marker = `<!-- ${TEMPLATE_HASH_MARKER_PREFIX}${templateHash} -->`;

  // Se já tem marker, substitui pelo novo hash
  const re = new RegExp(`<!--\\s*${TEMPLATE_HASH_MARKER_PREFIX}[a-f0-9]{8,64}\\s*-->`, "ig");
  if (re.test(html)) {
    return html.replace(re, marker);
  }

  // Se não tem, injeta antes do </head>
  if (html.includes("</head>")) {
    return html.replace("</head>", `\n  ${marker}\n</head>`);
  }

  // fallback (muito improvável)
  return `${marker}\n${html}`;
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

  // Usar sempre slugify do titulo para garantir consistência
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
   GERADOR DE HTML DE UM ITEM
================================ */
function gerarHtmlDoItem({ template, templateHash, data, imagens, item, idx }) {
  const slug = item.slug || slugify(item.titulo);
  const descricao = item.descricao || `Material de enfermagem sobre ${item.titulo}.`;
  const categoria = item.categoria || "documentos";
  const tipo = item.tipo || detectarTipoPeloArquivo(item.ficheiro);
  const nav = buildPrevNext(data, idx);
  const capa = item.capa || item.ficheiro;

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
    .replace(/{{NEXT_STYLE}}/g, escapeHtml(nav.nextStyle))
    .replace(/{{PREV_CLASS}}/g, escapeHtml(nav.prevClass))
    .replace(/{{NEXT_CLASS}}/g, escapeHtml(nav.nextClass));

  // Fotos: transforma a hero em “clicável” e injeta lightbox
  if (categoria === "fotos") {
    const indiceImagem = imagens.findIndex((i) => i.slug === slug);

    html = html.replace(
      /<img[^>]*class="w-full[^"]*biblioteca-hero-img"[^>]*>/i,
      `<img src="${item.ficheiro}" alt="Capa de ${escapeHtml(item.titulo)}" class="w-full rounded-xl mb-6 biblioteca-hero-img cursor-zoom-in" loading="lazy" decoding="async" onclick="abrirLightbox(${indiceImagem})">`
    );

    const bloco = montarBlocoLightbox(imagens);
    html = html.replace("</body>", `\n${bloco}\n</body>`);
  }

  // Marker com hash do template usado
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

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  // Lista de imagens (para lightbox)
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

    const { slug, html } = gerarHtmlDoItem({
      template,
      templateHash,
      data,
      imagens,
      item,
      idx,
    });

    expectedSlugs.add(slug);

    const outFile = path.join(OUTPUT_DIR, `${slug}.html`);

    // Se existe, só reescreve se o CONTEÚDO mudou
    if (fs.existsSync(outFile)) {
      const current = fs.readFileSync(outFile, "utf8");

      // comparação direta: se igual, não toca no arquivo
      if (current === html) {
        inalterados++;
        return;
      }

      // (opcional) também dá pra usar hash do marker como “atalho”,
      // mas a comparação total é mais segura porque inclui dados do item (prev/next, etc.)
      fs.writeFileSync(outFile, html, "utf8");
      atualizados++;
      return;
    }

    // Não existe → cria
    fs.writeFileSync(outFile, html, "utf8");
    criados++;
  });

  // (Opcional) Remover órfãos
  if (DELETE_ORPHANS) {
    const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.toLowerCase().endsWith(".html"));
    let removidos = 0;

    for (const f of files) {
      const slug = f.replace(/\.html$/i, "");
      if (!expectedSlugs.has(slug)) {
        fs.unlinkSync(path.join(OUTPUT_DIR, f));
        removidos++;
      }
    }

    console.log(`🧹 ${removidos} arquivos órfãos removidos (DELETE_ORPHANS=true).`);
  }

  console.log("✅ build-biblioteca concluído");
  console.log(`➕ Criados: ${criados}`);
  console.log(`♻️ Atualizados: ${atualizados}`);
  console.log(`⏭️ Inalterados: ${inalterados}`);
  if (puladosPorErro) console.log(`⚠️ Itens pulados (sem titulo/ficheiro): ${puladosPorErro}`);
  console.log(`🔖 Template hash atual: ${templateHash}`);
}

construirBiblioteca();