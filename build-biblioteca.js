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
<div class="max-w-5xl mx-auto py-12 px-4 text-center">

  <!-- BOTÃO VOLTAR -->
  <div class="mb-6">
    <button
      onclick="history.back()"
      class="inline-flex items-center px-6 py-3 bg-blue-900/80 text-white rounded-lg hover:bg-blue-900 transition"
    >
      ← Voltar
    </button>
  </div>

  <!-- TÍTULO -->
  <h1 class="text-3xl font-bold text-gray-800 mb-4">
    ${item.titulo}
  </h1>

  <!-- DESCRIÇÃO -->
  <p class="text-gray-600 text-base max-w-3xl mx-auto mb-8">
    ${descricao}
  </p>

  ${
    isImagem
      ? `
      <!-- IMAGEM GRANDE CENTRALIZADA -->
      <div class="flex justify-center mb-10">
        <img
          src="${item.ficheiro}"
          alt="${item.titulo}"
          class="w-full max-w-4xl rounded-lg shadow-md cursor-zoom-in"
          onclick="abrirLightbox()"
        >
      </div>
      `
      : ``
  }

  <!-- BOTÃO BAIXAR -->
  <div class="mt-4">
    <a
      href="${item.ficheiro}"
      download
      class="inline-flex items-center justify-center px-8 py-4 bg-blue-900/80 text-white rounded-lg hover:bg-blue-900 transition"
    >
      ⬇️ Baixar arquivo
    </a>
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
