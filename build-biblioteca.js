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

    /* ===============================
       CONTEÚDO DA PÁGINA
    ================================ */
    const isImagem = item.categoria === "fotos";

const conteudoItem = `
<div class="max-w-4xl mx-auto py-10 px-4">
  <button onclick="history.back()" class="mb-6 inline-block px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
    ⬅ Voltar
  </button>

  <h1 class="text-3xl font-bold mb-4">${item.titulo}</h1>

  <p class="text-gray-600 mb-6">
    ${descricao}
  </p>

  ${
    isImagem
      ? `<img src="${item.ficheiro}" alt="${item.titulo}" class="max-w-full rounded shadow mb-6">`
      : `<a href="${item.ficheiro}" download class="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
           ⬇️ Baixar arquivo
         </a>`
  }
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
