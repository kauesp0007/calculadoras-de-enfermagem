const fs = require("fs");
const path = require("path");

// Configurações
const BIBLIOTECA_JSON = "biblioteca.json";
const TEMPLATE_ITEM = "item.template.html";
const TEMPLATE_DOWNLOADS = "downloads.template.html";
const PASTAS = [
  { dir: "img", categoria: "fotos" },
  { dir: "docs", categoria: "documentos" },
  { dir: "videos", categoria: "videos" }
];
const ITENS_POR_PAGINA = 20;

// Miniaturas padrão
const CAPA_WORD = "/img/capa-word.webp";
const CAPA_VIDEO = "/img/capa-video.webp";

// Funções auxiliares
function tituloFromFilename(filename) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function slugFromTitulo(titulo) {
  return titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function descricaoAutomatica(titulo) {
  return `Material de enfermagem sobre ${titulo} para apoio educacional e clínico.`;
}

function tipoArquivo(ficheiro) {
  const ext = path.extname(ficheiro).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return "imagem";
  if ([".pdf", ".doc", ".docx"].includes(ext)) return "documento";
  if ([".mp4", ".mov", ".webm"].includes(ext)) return "video";
  return "outro";
}

function capaPadrao(item) {
  if (item.categoria === "fotos") return item.ficheiro;
  if (item.categoria === "documentos") return CAPA_WORD;
  if (item.categoria === "videos") return CAPA_VIDEO;
  return "/img/capa-padrao.webp";
}

// Carregar e salvar biblioteca
function carregarBiblioteca() {
  if (!fs.existsSync(BIBLIOTECA_JSON)) return [];
  return JSON.parse(fs.readFileSync(BIBLIOTECA_JSON, "utf8"));
}

function salvarBiblioteca(data) {
  fs.writeFileSync(BIBLIOTECA_JSON, JSON.stringify(data, null, 2), "utf8");
}

// Gerar HTML do item
function gerarItemHTML(item) {
  let template = fs.readFileSync(TEMPLATE_ITEM, "utf8");
  template = template
    .replace(/{{TITULO}}/g, item.titulo)
    .replace(/{{DESCRICAO}}/g, item.descricao)
    .replace(/{{PALAVRAS}}/g, item.tags || "")
    .replace(/{{SLUG}}/g, item.slug)
    .replace(/{{CAPA}}/g, item.capa)
    .replace(/{{FICHEIRO}}/g, item.ficheiro)
    .replace(/{{CATEGORIA}}/g, item.categoria)
    .replace(/{{TIPO}}/g, tipoArquivo(item.ficheiro))
    .replace(/{{TAGS}}/g, item.tags || "");
  return template;
}

// Gerar HTML de grid para downloads.html
function gerarGridHTML(items) {
  return items.map(item => {
    const slug = item.slug;
    const capa = item.capa;
    const titulo = item.titulo;
    const categoria = item.categoria;
    return `
<a href="/biblioteca/${slug}.html" class="file-card">
  <img src="/${capa}" alt="Capa de ${titulo}" loading="lazy" />
  <div class="file-card-title">${titulo}</div>
</a>`;
  }).join("\n");
}

// Paginação
function dividirPaginas(items) {
  const paginas = [];
  for (let i = 0; i < items.length; i += ITENS_POR_PAGINA) {
    paginas.push(items.slice(i, i + ITENS_POR_PAGINA));
  }
  return paginas;
}

// Atualizar downloads.html e pages
function gerarDownloadsHTML(biblioteca) {
  let template = fs.readFileSync(TEMPLATE_DOWNLOADS, "utf8");

  const porCategoria = {
    todos: biblioteca,
    documentos: biblioteca.filter(i => i.categoria === "documentos"),
    fotos: biblioteca.filter(i => i.categoria === "fotos"),
    videos: biblioteca.filter(i => i.categoria === "videos")
  };

  // Gerar grids por categoria
  template = template.replace("<!-- [GERAR_TODOS] -->", gerarGridHTML(porCategoria.todos));
  template = template.replace("<!-- [GERAR_DOCUMENTOS] -->", gerarGridHTML(porCategoria.documentos));
  template = template.replace("<!-- [GERAR_FOTOS] -->", gerarGridHTML(porCategoria.fotos));
  template = template.replace("<!-- [GERAR_VIDEOS] -->", gerarGridHTML(porCategoria.videos));

  // Salvar downloads.html principal
  fs.writeFileSync("downloads.html", template, "utf8");

  // Paginação
  const paginas = dividirPaginas(biblioteca);
  paginas.forEach((paginaItems, index) => {
    const pageTemplate = template.replace("<!-- [GERAR_TODOS] -->", gerarGridHTML(paginaItems));
    const pageName = `downloads-page${index + 1}.html`;
    fs.writeFileSync(pageName, pageTemplate, "utf8");
  });
}

// Scanner e atualização biblioteca.json
function executarScanner() {
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
      const novoItem = {
        titulo,
        slug: slugFromTitulo(titulo),
        descricao: descricaoAutomatica(titulo),
        categoria: pasta.categoria,
        ficheiro: caminho,
        capa: capaPadrao({ categoria: pasta.categoria, ficheiro: caminho }),
        tags: titulo.split(" ").map(w => w.toLowerCase()).join(", ")
      };

      biblioteca.push(novoItem);

      // Gerar HTML individual
      const itemHTML = gerarItemHTML(novoItem);
      const itemPath = path.join("biblioteca", `${novoItem.slug}.html`);
      fs.writeFileSync(itemPath, itemHTML, "utf8");

      adicionados++;
    }
  }

  salvarBiblioteca(biblioteca);
  gerarDownloadsHTML(biblioteca);

  console.log(`✅ Scanner concluído. Itens adicionados: ${adicionados}`);
  console.log("✅ downloads.html e páginas atualizadas com sucesso!");
}

// Executar
executarScanner();