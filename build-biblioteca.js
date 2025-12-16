/* eslint-env node */
const fs = require("fs");
const path = require("path");

/* ===============================
   CONFIGURAÇÕES
================================ */
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "downloads.template.html";
const OUTPUT_DIR = "biblioteca";

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
   CONSTRUTOR PRINCIPAL
================================ */
function construirBiblioteca() {
  if (!fs.existsSync(JSON_DATABASE_FILE)) {
    console.error("❌ biblioteca.json não encontrado");
    return;
  }

  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  const imagens = data.filter(i => i.categoria === "fotos");
  let gerados = 0;

  data.forEach(item => {
    if (!item.titulo || !item.ficheiro) return;

    const slug = item.slug || slugify(item.titulo);
    const descricao =
      item.descricao || `Material de enfermagem sobre ${item.titulo}.`;
    const isImagem = item.categoria === "fotos";
    const indiceImagem = imagens.findIndex(i => i.ficheiro === item.ficheiro);

    /* ===============================
       SCHEMA IMAGEOBJECT
    ================================ */
    const schemaImage = isImagem
      ? `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "name": "${item.titulo}",
  "description": "${descricao}",
  "contentUrl": "https://www.calculadorasdeenfermagem.com.br${item.ficheiro}",
  "caption": "${item.titulo}",
  "inLanguage": "pt-BR"
}
</script>`
      : "";

    /* ===============================
       CONTEÚDO
    ================================ */
    const conteudoItem = `
<div class="max-w-6xl mx-auto py-12 px-4 text-center">

  <button onclick="history.back()"
    class="mb-8 inline-flex items-center px-6 py-3 bg-blue-900/80 text-white rounded-lg hover:bg-blue-900 transition">
    ← Voltar
  </button>

  <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
    ${item.titulo}
  </h1>

  <p class="text-gray-600 text-lg max-w-6xl mx-auto mb-10">
    ${descricao}
  </p>

  ${
    isImagem
      ? `
      <img
        src="${item.ficheiro}"
        alt="${item.titulo}"
        loading="lazy"
        decoding="async"
        class="w-full max-w-6xl mx-auto rounded-lg shadow-md cursor-zoom-in"
        onclick="abrirLightbox(${indiceImagem})"
      >

      <p class="text-sm text-gray-500 mt-4">
        ${item.titulo} — ${descricao}
      </p>
      `
      : ""
  }

  <a href="${item.ficheiro}" download
    class="mt-10 inline-flex px-8 py-4 bg-blue-900/80 text-white rounded-lg hover:bg-blue-900 transition">
    ⬇️ Baixar arquivo
  </a>
</div>

<!-- LIGHTBOX -->
<div id="lightbox" class="fixed inset-0 bg-black/90 hidden z-50 flex items-center justify-center animate-fade">

  <button onclick="fecharLightbox()" class="absolute top-6 right-6 text-white text-3xl">✕</button>
  <button onclick="toggleFullscreen()" class="absolute top-6 left-6 text-white text-xl">⛶</button>

  <button onclick="prevImagem()" class="absolute left-6 text-white text-4xl">←</button>
  <button onclick="nextImagem()" class="absolute right-6 text-white text-4xl">→</button>

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
      item.titulo + " — " + item.descricao;
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

    let html = template
  // REMOVE COMPLETAMENTE A ÁREA DE GRID
  .replace(
    /<div class="bg-white p-6 rounded-lg shadow">[\s\S]*?<\/div>\s*<!-- PAGINAÇÃO -->[\s\S]*?<\/div>/,
    conteudoItem
  )

  // limpa paginação
  .replace("<!-- [PAGINACAO] -->", "")

  // SEO
  .replace("</head>", schemaImage + "\n</head>")
  .replace(
    /<title>.*<\/title>/,
    `<title>${item.titulo} | Biblioteca de Enfermagem</title>`
  )
  .replace(
    /<meta name="description".*>/,
    `<meta name="description" content="${descricao}">`
  )
  .replace(
    /<link rel="canonical".*>/,
    `<link rel="canonical" href="https://www.calculadorasdeenfermagem.com.br/biblioteca/${slug}.html">`
  );


    fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), html, "utf8");
    gerados++;
  });

  console.log(`✅ ${gerados} páginas da biblioteca geradas com sucesso`);
}

construirBiblioteca();
