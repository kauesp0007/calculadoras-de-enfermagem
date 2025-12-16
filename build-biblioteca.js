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

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  let gerados = 0;

  data.forEach(item => {
    if (!item.titulo || !item.ficheiro) return;

    const slug = item.slug || slugify(item.titulo);
    const descricao =
      item.descricao ||
      `Material de enfermagem sobre ${item.titulo} para apoio educacional e clínico.`;

    const isImagem = item.categoria === "fotos";

    /* ===============================
       CONTEÚDO DA PÁGINA
    ================================ */
    const conteudoItem = `
<div class="max-w-4xl mx-auto py-10 px-4">
  
  <!-- CARD -->
  <div class="bg-white rounded-xl shadow-md overflow-hidden">

    <!-- CABEÇALHO -->
    <div class="p-6">
      <button onclick="history.back()"
        class="mb-4 inline-flex items-center px-4 py-2 bg-blue-900/80 text-white rounded-lg hover:bg-blue-900 transition">
        ← Voltar
      </button>

      <h1 class="text-3xl font-bold text-gray-800 mb-3">
        ${item.titulo}
      </h1>

      <p class="text-gray-600 text-base">
        ${descricao}
      </p>
    </div>

    ${
  isImagem
    ? `
    <!-- IMAGEM EM TAMANHO GRANDE (FORA DO CARD) -->
    </div> <!-- FECHA CARD -->

    <div class="max-w-4xl mx-auto px-4">
      <img
        src="${item.ficheiro}"
        alt="${item.titulo}"
        class="w-full rounded-lg shadow-md mb-6 cursor-zoom-in"
        onclick="abrirLightbox()"
      >
    </div>

    <div class="max-w-4xl mx-auto px-4">
    `
    : ``
}


    <!-- AÇÕES -->
    <div class="p-6">
      <a href="${item.ficheiro}" download
        class="inline-flex items-center justify-center px-6 py-3 bg-blue-900/80 text-white rounded-lg hover:bg-blue-900 transition">
        ⬇️ Baixar arquivo
      </a>
    </div>

  </div>
</div>
`;

    /* ===============================
       HTML FINAL
    ================================ */
    let html = template
      .replace("<!-- [GERAR_TODOS] -->", conteudoItem)
      .replace("<!-- [GERAR_DOCUMENTOS] -->", "")
      .replace("<!-- [GERAR_FOTOS] -->", "")
      .replace("<!-- [GERAR_VIDEOS] -->", "")
      .replace("<!-- [PAGINACAO] -->", "")
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

    const outputPath = path.join(OUTPUT_DIR, `${slug}.html`);
    fs.writeFileSync(outputPath, html, "utf8");
    gerados++;
  });

  console.log(`✅ ${gerados} páginas individuais da biblioteca geradas com sucesso`);
}

construirBiblioteca();
