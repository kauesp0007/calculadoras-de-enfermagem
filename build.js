/* eslint-env node */
const fs = require("fs");
const path = require("path");

// Arquivos base
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_LISTA = "downloads.template.html";
const TEMPLATE_ITEM = "item.template.html";
const OUTPUT_LISTA = "downloads.html";
const OUTPUT_PASTA = "biblioteca"; // pasta onde cada item será criado

// Função auxiliar — gera slug SEO
function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Função auxiliar — descrição SEO automática
function gerarDescricao(item) {
  return `Download de ${item.titulo} — arquivo de ${item.categoria} disponível gratuitamente na Biblioteca de Enfermagem.`;
}

// Função auxiliar — palavras-chave automáticas
function gerarKeywords(item) {
  const base = [
    "enfermagem",
    "biblioteca",
    "download",
    "PDF",
    "formulários",
    "protocolos",
    "escalas",
    "imagens"
  ];
  const tituloWords = item.titulo.toLowerCase().split(" ");
  return [...new Set([...base, ...tituloWords])].join(", ");
}

// Gera HTML de cartão da lista (downloads.html)
function criarCartaoHTML(item) {
  const slug = gerarSlug(item.titulo);
  return `
<!-- Item: ${item.titulo} -->
<a href="/biblioteca/${slug}.html" class="file-card" aria-label="Abrir página de ${item.titulo}">
  <img 
    src="${item.capa}" 
    alt="Capa de ${item.titulo}" 
    class="file-card-image"
    onerror="this.src='https://placehold.co/400x480/EBF8FF/1A3E74?text=Erro';"
  >
  <h4 class="file-card-title">${item.titulo}</h4>
</a>`;
}

// -----------------------------
// Construção das páginas
// -----------------------------
function construirPaginas() {
  console.log("\n🔧 Construindo Biblioteca…");

  // 1 — LER JSON
  const json = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));

  // 2 — CRIAR A PASTA /biblioteca se não existir
  if (!fs.existsSync(OUTPUT_PASTA)) {
    fs.mkdirSync(OUTPUT_PASTA);
  }

  // 3 — LER TEMPLATE GERAL (downloads.template.html)
  let templateLista = fs.readFileSync(TEMPLATE_LISTA, "utf8");

  // 4 — Preparar estrutura de categorias
  const htmlGerado = {
    todos: [],
    documentos: [],
    fotos: [],
    videos: []
  };

  // 5 — Para cada item: gerar cartão e página individual
  const itemTemplate = fs.readFileSync(TEMPLATE_ITEM, "utf8");

  json.forEach(item => {
    const slug = gerarSlug(item.titulo);
    const descricao = gerarDescricao(item);
    const keywords = gerarKeywords(item);

    // --- CRIAR CARTÃO PARA A LISTA ---
    const card = criarCartaoHTML(item);
    htmlGerado.todos.push(card);
    htmlGerado[item.categoria]?.push(card);

    // --- CRIAR PÁGINA INDIVIDUAL ---
    let itemHtml = itemTemplate
      .replace(/{{TITULO}}/g, item.titulo)
      .replace(/{{DESCRICAO}}/g, descricao)
      .replace(/{{PALAVRAS}}/g, keywords)
      .replace(/{{CAPA}}/g, item.capa)
      .replace(/{{FICHEIRO}}/g, item.ficheiro)
      .replace(/{{DOWNLOAD}}/g, item.download || "")
      .replace(/{{SLUG}}/g, slug);

    fs.writeFileSync(`${OUTPUT_PASTA}/${slug}.html`, itemHtml);
    console.log(`📄 Página criada: biblioteca/${slug}.html`);
  });

  // 6 — INSERIR SEO GLOBAL NO TEMPLATE downloads.html
  const SEO_TITLE = "Biblioteca de Enfermagem — Downloads Gratuitos";
  const SEO_DESCRIPTION = "Acesse e baixe documentos, formulários, imagens e vídeos da área da enfermagem.";
  const SEO_KEYWORDS = "enfermagem, biblioteca, pdf, formulários, escalas, imagens, vídeos, downloads";

  templateLista = templateLista
    .replace("<!-- [SEO_TITLE] -->", SEO_TITLE)
    .replace("<!-- [SEO_DESCRIPTION] -->", SEO_DESCRIPTION)
    .replace("<!-- [SEO_KEYWORDS] -->", SEO_KEYWORDS);

  // 7 — PREENCHE AS LISTAS
  templateLista = templateLista
    .replace("<!-- [GERAR_TODOS] -->", htmlGerado.todos.join("\n"))
    .replace("<!-- [GERAR_DOCUMENTOS] -->", htmlGerado.documentos.join("\n"))
    .replace("<!-- [GERAR_FOTOS] -->", htmlGerado.fotos.join("\n"))
    .replace("<!-- [GERAR_VIDEOS] -->", htmlGerado.videos.join("\n"));

  // 8 — SALVAR downloads.html
  fs.writeFileSync(OUTPUT_LISTA, templateLista);

  console.log("\n✅ Biblioteca reconstruída com sucesso!");
  console.log(`📌 Downloads listados: ${json.length}`);
}

construirPaginas();
