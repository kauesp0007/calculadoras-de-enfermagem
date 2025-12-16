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
        <!-- IMAGEM GRANDE -->
        <div class="w-full flex justify-center bg-gray-50 py-6">
          <img
            src="${item.ficheiro}"
            alt="${item.titulo}"
            class="w-[90%] max-w-full cursor-zoom-in rounded-lg shadow-md"
            onclick="abrirLightbox()"
          >
        </div>

        <!-- LIGHTBOX -->
        <div id="lightbox" style="
          display:none;
          position:fixed;
          inset:0;
          background:rgba(0,0,0,0.9);
          z-index:9999;
          justify-content:center;
          align-items:center;
          flex-direction:column;
        " onclick="fecharLightbox(event)">

          <button style="
            position:absolute;
            top:20px;
            right:30px;
            font-size:32px;
            color:white;
            background:none;
            border:none;
            cursor:pointer;
          ">✕</button>

          <img
            src="${item.ficheiro}"
            alt="${item.titulo}"
            id="lightbox-img"
            style="
              max-width:90%;
              max-height:80%;
              object-fit:contain;
            "
          >

          <p style="
            color:#ddd;
            margin-top:15px;
            font-size:16px;
            text-align:center;
            max-width:80%;
          ">
            ${item.titulo}
          </p>
        </div>

        <script>
          let zoom = 1;

          function abrirLightbox() {
            document.getElementById('lightbox').style.display = 'flex';
            zoom = 1;
            document.getElementById('lightbox-img').style.transform = 'scale(1)';
          }

          function fecharLightbox(e) {
            if (e.target.id === 'lightbox' || e.target.tagName === 'BUTTON') {
              document.getElementById('lightbox').style.display = 'none';
            }
          }

          document.addEventListener('wheel', function(e) {
            const lb = document.getElementById('lightbox');
            if (lb && lb.style.display === 'flex') {
              e.preventDefault();
              zoom += e.deltaY * -0.001;
              zoom = Math.min(Math.max(1, zoom), 3);
              document.getElementById('lightbox-img').style.transform = 'scale(' + zoom + ')';
            }
          }, { passive: false });
        </script>
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
