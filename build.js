/* eslint-env node */
const fs = require("fs");
const path = require("path");

// Arquivos base
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_LISTA = "downloads.template.html";
const TEMPLATE_ITEM = "item.template.html";
const OUTPUT_LISTA = "downloads.html"; // Arquivo raiz (página 1)
const OUTPUT_PASTA_ITEM = "biblioteca"; // Pasta para os arquivos individuais
const OUTPUT_PASTA_PAGINAS = "downloads"; // Pasta para as páginas de paginação (page2, page3...)

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
  
  // CORREÇÃO CRÍTICA AQUI:
  // Adicionada a barra "/" antes de ${item.capa} para garantir caminho absoluto.
  // Isso resolve o problema da imagem quebrada na página 2.
  return `
<a href="/biblioteca/${slug}.html" class="file-card">
  <img src="/${item.capa}" class="file-card-image" alt="Capa de ${item.titulo}">
  <h4 class="file-card-title">${item.titulo}</h4>
</a>`;
}

// ----------------------------
// CONSTRUIR TODA A BIBLIOTECA
// ----------------------------
function construirPaginas() {
  console.log("\n🔧 Construindo Biblioteca…");

  // 1 — LER JSON
  if (!fs.existsSync(JSON_DATABASE_FILE)) {
    console.error(`❌ Erro: O arquivo ${JSON_DATABASE_FILE} não foi encontrado.`);
    return;
  }
  const json = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));

  // 2 — CRIAR PASTAS SE NÃO EXISTIREM
  if (!fs.existsSync(OUTPUT_PASTA_ITEM)) fs.mkdirSync(OUTPUT_PASTA_ITEM, { recursive: true });
  if (!fs.existsSync(OUTPUT_PASTA_PAGINAS)) fs.mkdirSync(OUTPUT_PASTA_PAGINAS, { recursive: true });

  // 3 — CARREGAR TEMPLATES
  const templateListaOriginal = fs.readFileSync(TEMPLATE_LISTA, "utf8");
  const templateItem = fs.readFileSync(TEMPLATE_ITEM, "utf8");

  // ----------------------------
  // A. GERAR PÁGINAS INDIVIDUAIS (ITEM POR ITEM)
  // ----------------------------
  json.forEach((item) => {
    const slug = gerarSlug(item.titulo);
    const descricao = gerarDescricao(item);
    const keywords = gerarKeywords(item);

    // Nota: Aqui também adicionei barras "/" nos caminhos para garantir integridade
    let htmlItem = templateItem
      .replace(/{{TITULO}}/g, item.titulo)
      .replace(/{{DESCRICAO}}/g, descricao)
      .replace(/{{PALAVRAS}}/g, keywords)
      .replace(/{{CAPA}}/g, item.capa)     // Se o template já tiver src="/{{CAPA}}", ok. Se não, ajustamos.
      .replace(/{{FICHEIRO}}/g, item.ficheiro)
      .replace(/{{DOWNLOAD}}/g, item.download || "")
      .replace(/{{SLUG}}/g, slug);

    fs.writeFileSync(`${OUTPUT_PASTA_ITEM}/${slug}.html`, htmlItem);
    // console.log(`📄 Página criada: biblioteca/${slug}.html`); // Comentei para não poluir o log
  });
  console.log(`✅ ${json.length} páginas individuais criadas em /biblioteca/`);

  // ----------------------------
  // B. PAGINAÇÃO (LISTAS)
  // ----------------------------
  const totalPaginas = Math.ceil(json.length / ITENS_POR_PAGINA);

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    
    // Itens que vão aparecer nesta página específica
    const itensPagina = json.slice(inicio, fim);

    // 1. Gera o bloco "TODOS" (Misturado)
    const blocosTodos = itensPagina.map((item) => criarCartaoHTML(item)).join("\n");

    // 2. Gera os blocos filtrados por categoria (CORREÇÃO DE FUNCIONALIDADE)
    // Filtramos apenas os itens DESTA PÁGINA para preencher as abas
    const blocosDocs = itensPagina
      .filter(item => item.categoria.toLowerCase().includes('documentos') || item.categoria.toLowerCase().includes('pdf'))
      .map(item => criarCartaoHTML(item))
      .join("\n");

    const blocosFotos = itensPagina
      .filter(item => item.categoria.toLowerCase().includes('fotos') || item.categoria.toLowerCase().includes('imagem'))
      .map(item => criarCartaoHTML(item))
      .join("\n");
      
    const blocosVideos = itensPagina
      .filter(item => item.categoria.toLowerCase().includes('videos'))
      .map(item => criarCartaoHTML(item))
      .join("\n");

    // 3. NAV DE PAGINAÇÃO
    let nav = `<div class="pagination">`;

    // Botão Anterior
    if (pagina > 1) {
      // Se for voltar para a página 1, usamos /downloads.html (opcional, mas bom para SEO) ou /downloads/page1.html
      // Vamos manter o padrão da pasta para simplificar a navegação relativa
      nav += `<a href="/downloads/page${pagina - 1}.html" class="btn">« Anterior</a>`;
    }

    // Botões Numéricos
    for (let p = 1; p <= totalPaginas; p++) {
      const activeClass = (p === pagina) ? 'active' : '';
      nav += `<a href="/downloads/page${p}.html" class="btn ${activeClass}">${p}</a>`;
    }

    // Botão Próxima
    if (pagina < totalPaginas) {
      nav += `<a href="/downloads/page${pagina + 1}.html" class="btn">Próxima »</a>`;
    }
    nav += `</div>`;

    // SEO específico por página
    const SEO_TITLE = `Biblioteca de Enfermagem — Página ${pagina}`;
    const SEO_DESCRIPTION = `Downloads gratuitos de enfermagem — página ${pagina} com recursos profissionais.`;
    const SEO_KEYWORDS = "enfermagem, downloads, pdf, imagens, biblioteca";

    // 4. Substituições Finais no Template
    let htmlPagina = templateListaOriginal
      .replace("", blocosTodos)
      .replace("", blocosDocs)
      .replace("", blocosFotos)
      .replace("", blocosVideos)
      .replace("", SEO_TITLE)
      .replace("", SEO_DESCRIPTION)
      .replace("", SEO_KEYWORDS)
      .replace("", nav);

    fs.writeFileSync(`${OUTPUT_PASTA_PAGINAS}/page${pagina}.html`, htmlPagina);
    console.log(`📘 Criada página: downloads/page${pagina}.html`);
  }

  // ================================
  // C. CRIAR downloads.html (A RAIZ = PÁGINA 1)
  // ================================
  const page1Path = path.join(OUTPUT_PASTA_PAGINAS, "page1.html");

  if (fs.existsSync(page1Path)) {
    try {
      // Copiar a page1.html para a raiz downloads.html
      fs.copyFileSync(page1Path, OUTPUT_LISTA);
      console.log("📌 'downloads.html' criado com sucesso na raiz (cópia de page1).");
    } catch (err) {
      console.error("❌ Erro ao criar downloads.html:", err);
    }
  } else {
    console.error("⚠️ page1.html não existe — nada foi copiado!");
  }

  console.log("\n✅ Processo concluído!");
  console.log(`📌 Total de páginas geradas: ${totalPaginas}`);
}

construirPaginas();