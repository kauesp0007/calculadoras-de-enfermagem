/* eslint-env node */
const fs = require("fs");
const path = require("path");

const BIBLIOTECA_JSON = "biblioteca.json";
const TEMPLATE_DOWNLOADS = "downloads.template.html";
const TEMPLATE_ITEM = "item.template.html";
const OUTPUT_DIR = "biblioteca";

const ITENS_POR_PAGINA = 20;

// Pastas monitoradas e suas categorias
const PASTAS = [
  { dir: "img", categoria: "fotos" },
  { dir: "docs", categoria: "documentos" },
  { dir: "videos", categoria: "videos" }
];

// Carrega biblioteca.json existente
function carregarBiblioteca() {
  if (!fs.existsSync(BIBLIOTECA_JSON)) return [];
  return JSON.parse(fs.readFileSync(BIBLIOTECA_JSON, "utf8"));
}

// Salva biblioteca.json formatado
function salvarBiblioteca(data) {
  fs.writeFileSync(BIBLIOTECA_JSON, JSON.stringify(data, null, 2), "utf8");
}

// Gera título legível a partir do nome do ficheiro
function tituloFromFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Gera slug SEO-friendly a partir do título
function slugFromTitulo(titulo) {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Gera descrição automática para SEO
function descricaoAutomatica(titulo) {
  return `Material de enfermagem sobre ${titulo} para apoio educacional e clínico.`;
}

// Detecta tipo de arquivo
function detectarTipo(arquivo) {
  const ext = path.extname(arquivo).toLowerCase();
  if (ext === ".pdf" || ext === ".doc" || ext === ".docx") return "documento";
  if (ext === ".mp4" || ext === ".mov" || ext === ".webm") return "video";
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp") return "imagem";
  return "outro";
}

// Seleciona capa adequada
function selecionarCapa(item) {
  if (item.categoria === "fotos") return item.ficheiro;
  if (item.categoria === "documentos") return "/img/capa-word.webp";
  if (item.categoria === "videos") return "/img/capa-video.webp";
  return "/img/capa-padrao.webp";
}

// Escaneia pastas e adiciona novos itens
function escanearPastas() {
  const biblioteca = carregarBiblioteca();
  const ficheirosExistentes = new Set(biblioteca.map(i => i.ficheiro));
  let adicionados = 0;

  for (const pasta of PASTAS) {
    const dirPath = path.join(process.cwd(), pasta.dir);
    if (!fs.existsSync(dirPath)) continue;

    const arquivos = fs.readdirSync(dirPath);
    for (const arquivo of arquivos) {
      const caminho = `/${pasta.dir}/${arquivo}`;
      if (ficheirosExistentes.has(caminho)) continue;

      const titulo = tituloFromFilename(arquivo);
      const tipo = detectarTipo(arquivo);
      const novoItem = {
        titulo,
        slug: slugFromTitulo(titulo),
        descricao: descricaoAutomatica(titulo),
        categoria: pasta.categoria,
        ficheiro: caminho,
        capa: selecionarCapa({ categoria: pasta.categoria, ficheiro: caminho }),
        tipo,
        tags: titulo.toLowerCase().split(" ")
      };

      biblioteca.push(novoItem);
      adicionados++;
    }
  }

  salvarBiblioteca(biblioteca);
  console.log(`✅ Scanner concluído. Itens adicionados: ${adicionados}`);
  return biblioteca;
}

// Gera HTML do item individual
function gerarItemHTML(item) {
  let template = fs.readFileSync(TEMPLATE_ITEM, "utf8");
  template = template
    .replace(/{{TITULO}}/g, item.titulo)
    .replace(/{{DESCRICAO}}/g, item.descricao)
    .replace(/{{PALAVRAS}}/g, item.tags.join(", "))
    .replace(/{{SLUG}}/g, item.slug)
    .replace(/{{CAPA}}/g, item.capa.replace(/^\//, ""))
    .replace(/{{FICHEIRO}}/g, item.ficheiro.replace(/^\//, ""))
    .replace(/{{CATEGORIA}}/g, item.categoria)
    .replace(/{{TIPO}}/g, item.tipo)
    .replace(/{{TAGS}}/g, item.tags.join(", "));

  // Adiciona menu, rodapé e botão voltar
  const voltar = `<a href="/downloads.html" class="inline-block mb-4 text-blue-700 hover:underline">← Voltar para Biblioteca</a>`;
  template = template.replace(
    /<main class="max-w-3xl mx-auto p-6 mt-10 bg-white rounded-xl shadow">/,
    `<main class="max-w-3xl mx-auto p-6 mt-10 bg-white rounded-xl shadow">\n${voltar}`
  );

  // Header e footer modularizados
  const modular = `
    <div id="global-header-container"></div>
    <div id="footer-placeholder"></div>
    <div id="global-body-elements-container"></div>
    <script>
      function fetchHTML(url, id) {
        return fetch(url).then(r => r.text()).then(html => {
          const el = document.getElementById(id);
          if(el) el.innerHTML = html;
        });
      }
      document.addEventListener("DOMContentLoaded", () => {
        fetchHTML("/menu-global.html", "global-header-container");
        fetchHTML("/footer.html", "footer-placeholder");
        fetchHTML("/global-body-elements.html", "global-body-elements-container");
        const script = document.createElement("script");
        script.src = "/global-body-elements.js";
        script.defer = true;
        document.body.appendChild(script);
      });
    </script>
  `;
  template = template.replace(/<\/body>/, `${modular}\n</body>`);
  return template;
}

// Gera HTML das páginas da biblioteca com paginação e categorias
function gerarDownloadsHTML(biblioteca) {
  const template = fs.readFileSync(TEMPLATE_DOWNLOADS, "utf8");

  // Divisão por categoria
  const categorias = ["todos", "documentos", "fotos", "videos"];
  const htmlCategorias = {};
  categorias.forEach(cat => {
    htmlCategorias[cat] = biblioteca
      .filter(item => cat === "todos" || item.categoria === cat)
      .map(item => gerarCardHTML(item))
      .join("\n");
  });

  // Paginação
  const totalPaginas = Math.ceil(biblioteca.length / ITENS_POR_PAGINA);
  for (let i = 0; i < totalPaginas; i++) {
    const paginaItens = biblioteca.slice(i * ITENS_POR_PAGINA, (i + 1) * ITENS_POR_PAGINA);
    let paginaHTML = template;

    // Gera cards apenas para a página atual
    categorias.forEach(cat => {
      const catItens = paginaItens
        .filter(item => cat === "todos" || item.categoria === cat)
        .map(item => gerarCardHTML(item))
        .join("\n");
      paginaHTML = paginaHTML.replace(`<!-- [GERAR_${cat.toUpperCase()}] -->`, catItens);
    });

    // Gera links de paginação
    let linksPagina = "";
    for (let p = 0; p < totalPaginas; p++) {
      const num = p + 1;
      const ativo = p === i ? "active" : "";
      linksPagina += `<a href="page${num}.html" class="${ativo}">${num}</a>`;
    }
    paginaHTML = paginaHTML.replace("<!-- [PAGINACAO] -->", linksPagina);

    // SEO
    paginaHTML = paginaHTML.replace("<!-- [SEO_TITLE] -->", `Biblioteca de Enfermagem - Página ${i + 1}`);
    paginaHTML = paginaHTML.replace("<!-- [SEO_DESCRIPTION] -->", `Biblioteca de enfermagem - Página ${i + 1}`);
    paginaHTML = paginaHTML.replace("<!-- [SEO_KEYWORDS] -->", "enfermagem, documentos, imagens, vídeos, apostilas, protocolos");

    // Salva arquivo
    const outFile = i === 0 ? "downloads.html" : `page${i + 1}.html`;
    fs.writeFileSync(outFile, paginaHTML, "utf8");
  }
}

// Gera card individual
function gerarCardHTML(item) {
  return `
    <a href="/biblioteca/${item.slug}.html" class="file-card">
      <img src="${item.capa}" alt="Capa de ${item.titulo}" loading="lazy" />
      <div class="file-card-title">${item.titulo}</div>
    </a>
  `;
}

// Cria diretório se não existir
function garantirDiretorio(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Cria HTMLs individuais
function criarItensHTML(biblioteca) {
  garantirDiretorio(OUTPUT_DIR);
  biblioteca.forEach(item => {
    const html = gerarItemHTML(item);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${item.slug}.html`), html, "utf8");
  });
}

// EXECUÇÃO
function main() {
  const biblioteca = escanearPastas();
  criarItensHTML(biblioteca);
  gerarDownloadsHTML(biblioteca);
  console.log("✅ Biblioteca atualizada com sucesso!");
}

main();
