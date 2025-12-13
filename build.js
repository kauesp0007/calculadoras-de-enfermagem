/* eslint-env node */
const fs = require("fs");
const path = require("path");

// Arquivos base
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_LISTA = "downloads.template.html";
const TEMPLATE_ITEM = "item.template.html";
const OUTPUT_LISTA = "downloads.html";
const OUTPUT_PASTA_ITEM = "biblioteca";
const OUTPUT_PASTA_PAGINAS = "downloads";

// Configuração da paginação
const ITENS_POR_PAGINA = 20;

// Gera slug SEO
function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Descrição SEO automática
function gerarDescricao(item) {
  return `Download de ${item.titulo} — arquivo da categoria ${item.categoria}, disponível gratuitamente na Biblioteca de Enfermagem.`;
}

// Palavras-chave automáticas
function gerarKeywords(item) {
  const base = [
    "enfermagem",
    "biblioteca",
    "download",
    "PDF",
    "formulários",
    "protocolos",
    "escalas",
    "imagens",
  ];
  const tituloWords = item.titulo.toLowerCase().split(" ");
  return [...new Set([...base, ...tituloWords])].join(", ");
}

// Cartão HTML para cada item
function criarCartaoHTML(item) {
  const slug = gerarSlug(item.titulo);
  return `
<a href="/biblioteca/${slug}.html" class="file-card">
  <img src="${item.capa}" class="file-card-image" alt="Capa de ${item.titulo}">
  <h4 class="file-card-title">${item.titulo}</h4>
</a>`;
}

// ----------------------------
// CONSTRUIR TODA A BIBLIOTECA
// ----------------------------
function construirPaginas() {
  console.log("\n🔧 Construindo Biblioteca…");

  // 1 — LER JSON
  const json = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));

  // 2 — CRIAR PASTAS SE NÃO EXISTIREM
  if (!fs.existsSync(OUTPUT_PASTA_ITEM)) fs.mkdirSync(OUTPUT_PASTA_ITEM);
  if (!fs.existsSync(OUTPUT_PASTA_PAGINAS)) fs.mkdirSync(OUTPUT_PASTA_PAGINAS);

  // 3 — CARREGAR TEMPLATES
  const templateListaOriginal = fs.readFileSync(TEMPLATE_LISTA, "utf8");
  const templateItem = fs.readFileSync(TEMPLATE_ITEM, "utf8");

  // ----------------------------
  // GERAR PÁGINAS INDIVIDUAIS
  // ----------------------------
  json.forEach((item) => {
    const slug = gerarSlug(item.titulo);
    const descricao = gerarDescricao(item);
    const keywords = gerarKeywords(item);

    let htmlItem = templateItem
      .replace(/{{TITULO}}/g, item.titulo)
      .replace(/{{DESCRICAO}}/g, descricao)
      .replace(/{{PALAVRAS}}/g, keywords)
      .replace(/{{CAPA}}/g, item.capa)
      .replace(/{{FICHEIRO}}/g, item.ficheiro)
      .replace(/{{DOWNLOAD}}/g, item.download || "")
      .replace(/{{SLUG}}/g, slug);

    fs.writeFileSync(`${OUTPUT_PASTA_ITEM}/${slug}.html`, htmlItem);
    console.log(`📄 Página criada: biblioteca/${slug}.html`);
  });

  // ----------------------------
  // PAGINAÇÃO REAL
  // ----------------------------
  const totalPaginas = Math.ceil(json.length / ITENS_POR_PAGINA);

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const itensPagina = json.slice(inicio, fim);

    // Criar cartões desta página
    const blocos = itensPagina.map((item) => criarCartaoHTML(item)).join("\n");

    // NAV DE PAGINAÇÃO
    let nav = `<div class="pagination">`;

    if (pagina > 1) {
      nav += `<a href="/downloads/page${pagina - 1}.html" class="btn">« Anterior</a>`;
    }

    for (let p = 1; p <= totalPaginas; p++) {
      nav += `<a href="/downloads/page${p}.html" class="btn ${p === pagina ? 'active' : ''}">${p}</a>`;
    }

    if (pagina < totalPaginas) {
      nav += `<a href="/downloads/page${pagina + 1}.html" class="btn">Próxima »</a>`;
    }

    nav += `</div>`;

    // SEO específico por página
    const SEO_TITLE = `Biblioteca de Enfermagem — Página ${pagina}`;
    const SEO_DESCRIPTION = `Downloads gratuitos de enfermagem — página ${pagina} com recursos profissionais.`;
    const SEO_KEYWORDS = "enfermagem, downloads, pdf, imagens, biblioteca";

    let htmlPagina = templateListaOriginal
      .replace("<!-- [GERAR_TODOS] -->", blocos)
      .replace("<!-- [SEO_TITLE] -->", SEO_TITLE)
      .replace("<!-- [SEO_DESCRIPTION] -->", SEO_DESCRIPTION)
      .replace("<!-- [SEO_KEYWORDS] -->", SEO_KEYWORDS)
      .replace("<!-- [PAGINACAO] -->", nav);

    fs.writeFileSync(`${OUTPUT_PASTA_PAGINAS}/page${pagina}.html`, htmlPagina);

    console.log(`📘 Criada página: downloads/page${pagina}.html`);
  }

  // ================================
// CRIAR downloads.html (página 1)
// ================================
const page1Path = path.join(OUTPUT_PASTA_PAGINAS, "page1.html");

if (fs.existsSync(page1Path)) {
  try {
    // Copiar a page1.html para downloads.html
    fs.copyFileSync(page1Path, OUTPUT_LISTA);
    console.log("📌 'downloads.html' criado com sucesso (cópia de page1).");
  } catch (err) {
    console.error("❌ Erro ao criar downloads.html:", err);
  }
} else {
  console.error("⚠️ page1.html não existe — nada foi copiado!");
}


  console.log("\n✅ Paginação criada com sucesso!");
  console.log(`📌 Total de páginas: ${totalPaginas}`);
  console.log(`📌 downloads.html agora é a página 1\n`);
}

construirPaginas();
