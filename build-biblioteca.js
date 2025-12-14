/* eslint-env node */
const fs = require("fs");
const path = require("path");

// ================= CONFIGURAÇÕES =================
const BIBLIOTECA_JSON = "biblioteca.json";
const TEMPLATE_ITEM = "item.template.html";
const TEMPLATE_DOWNLOADS = "downloads.template.html";
const OUTPUT_DIR = "biblioteca";
const OUTPUT_DOWNLOADS = "downloads.html";
const BASE_URL = "https://www.calculadorasdeenfermagem.com.br";
const ITENS_POR_PAGINA = 20;

// Pastas monitoradas
const PASTAS = [
  { dir: "img", categoria: "fotos" },
  { dir: "docs", categoria: "documentos" },
  { dir: "videos", categoria: "videos" }
];

// Miniaturas padrão
const CAPA_PDF = "img/capa-word.webp";
const CAPA_VIDEO = "img/capa-video.webp";
// =================================================

// ================= FUNÇÕES =================
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function gerarDescricao(item) {
  return item.descricao || `Baixe gratuitamente ${item.titulo}. Material de enfermagem disponível na Biblioteca de Enfermagem com acesso rápido e seguro.`;
}

function gerarPalavrasChave(item) {
  const base = ["enfermagem","biblioteca de enfermagem","downloads enfermagem","material enfermagem"];
  return [...base, item.titulo.toLowerCase()].join(", ");
}

function detectarTipoArquivo(ficheiro) {
  const ext = path.extname(ficheiro).toLowerCase();
  if ([".pdf"].includes(ext)) return "Documento PDF";
  if ([".doc", ".docx"].includes(ext)) return "Documento de Texto";
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return "Imagem";
  if ([".mp4", ".webm", ".ogg"].includes(ext)) return "Vídeo";
  return "Arquivo";
}

function gerarTags(item) {
  const palavrasTitulo = item.titulo.toLowerCase().replace(/[^\w\s]/g,"").split(" ");
  const base = ["enfermagem", "biblioteca", item.categoria];
  return Array.from(new Set([...base, ...palavrasTitulo])).join(", ");
}

function carregarBiblioteca() {
  if (!fs.existsSync(BIBLIOTECA_JSON)) return [];
  return JSON.parse(fs.readFileSync(BIBLIOTECA_JSON,"utf8"));
}

function salvarBiblioteca(data) {
  fs.writeFileSync(BIBLIOTECA_JSON, JSON.stringify(data,null,2),"utf8");
}

function lerTemplate(file) {
  return fs.readFileSync(file,"utf8");
}

function escreverArquivo(filePath, content) {
  fs.writeFileSync(filePath, content,"utf8");
}

function criarCapa(item) {
  if (item.categoria === "fotos") return item.ficheiro.replace(/^\/+/,"");
  if (item.categoria === "documentos") return CAPA_PDF;
  if (item.categoria === "videos") return CAPA_VIDEO;
  return item.ficheiro.replace(/^\/+/,"");
}

function gerarHTMLItem(item, template) {
  const slug = slugify(item.titulo);
  const descricao = gerarDescricao(item);
  const palavras = gerarPalavrasChave(item);
  const tipo = detectarTipoArquivo(item.ficheiro);
  const tags = gerarTags(item);
  const capa = criarCapa(item);

  return template
    .replace(/{{TITULO}}/g,item.titulo)
    .replace(/{{DESCRICAO}}/g,descricao)
    .replace(/{{PALAVRAS}}/g,palavras)
    .replace(/{{SLUG}}/g,slug)
    .replace(/{{CAPA}}/g,capa)
    .replace(/{{FICHEIRO}}/g,item.ficheiro.replace(/^\/+/,""))
    .replace(/{{CATEGORIA}}/g,item.categoria)
    .replace(/{{TIPO}}/g,tipo)
    .replace(/{{TAGS}}/g,tags);
}

function gerarCardsHTML(itens) {
  return itens.map(item=>{
    const slug = slugify(item.titulo);
    const capa = criarCapa(item);
    return `<a href="/biblioteca/${slug}.html" class="file-card">
      <img src="/${capa}" alt="${item.titulo}" loading="lazy"/>
      <div class="file-card-title">${item.titulo}</div>
    </a>`;
  }).join("\n");
}

function gerarPaginacaoHTML(totalPaginas) {
  let html = "";
  for (let i=1;i<=totalPaginas;i++){
    html += `<a href="downloads.html?page=${i}" class="${i===1?"active":""}">${i}</a>\n`;
  }
  return html;
}

function gerarPaginas(itens) {
  const totalPaginas = Math.ceil(itens.length / ITENS_POR_PAGINA);
  const paginas = [];
  for (let i=0;i<totalPaginas;i++){
    const inicio = i*ITENS_POR_PAGINA;
    const fim = inicio+ITENS_POR_PAGINA;
    paginas.push(itens.slice(inicio,fim));
  }
  return paginas;
}

function atualizarDownloadsHTML(itens) {
  const template = lerTemplate(TEMPLATE_DOWNLOADS);

  const todosHTML = gerarCardsHTML(itens);
  const documentosHTML = gerarCardsHTML(itens.filter(i=>i.categoria==="documentos"));
  const fotosHTML = gerarCardsHTML(itens.filter(i=>i.categoria==="fotos"));
  const videosHTML = gerarCardsHTML(itens.filter(i=>i.categoria==="videos"));

  const totalPaginas = Math.ceil(itens.length/ITENS_POR_PAGINA);
  const paginacaoHTML = gerarPaginacaoHTML(totalPaginas);

  let finalHTML = template
    .replace("<!-- [GERAR_TODOS] -->",todosHTML)
    .replace("<!-- [GERAR_DOCUMENTOS] -->",documentosHTML)
    .replace("<!-- [GERAR_FOTOS] -->",fotosHTML)
    .replace("<!-- [GERAR_VIDEOS] -->",videosHTML)
    .replace("<!-- [PAGINACAO] -->",paginacaoHTML)
    .replace("<!-- [SEO_DESCRIPTION] -->","Biblioteca de Enfermagem com materiais, documentos e vídeos atualizados para download.")
    .replace("<!-- [SEO_KEYWORDS] -->","enfermagem,biblioteca,enfermagem,documentos,imagens,videos,downloads")
    .replace("<!-- [SEO_TITLE] -->","Biblioteca de Enfermagem: Documentos, imagens e vídeos para download");

  escreverArquivo(OUTPUT_DOWNLOADS,finalHTML);
  console.log(`✅ Arquivo ${OUTPUT_DOWNLOADS} atualizado com sucesso!`);
}

// ================= SCANNER AUTOMÁTICO =================
function escanearPastas() {
  const biblioteca = carregarBiblioteca();
  const existentes = new Set(biblioteca.map(i=>i.ficheiro));

  let adicionados = 0;

  for (const pasta of PASTAS){
    const pastaPath = path.join(process.cwd(),pasta.dir);
    if (!fs.existsSync(pastaPath)) continue;
    const arquivos = fs.readdirSync(pastaPath);
    for (const arquivo of arquivos){
      const caminho = `/${pasta.dir}/${arquivo}`;
      if (existentes.has(caminho)) continue;

      const titulo = arquivo.replace(/\.[^/.]+$/,"").replace(/[-_]/g," ").replace(/\b\w/g,l=>l.toUpperCase());

      const novoItem = {
        titulo,
        slug: slugify(titulo),
        descricao: gerarDescricao({titulo}),
        categoria: pasta.categoria,
        ficheiro: caminho
      };

      biblioteca.push(novoItem);
      adicionados++;
    }
  }

  salvarBiblioteca(biblioteca);
  console.log(`✅ Scanner concluído: ${adicionados} itens adicionados.`);
  return biblioteca;
}

// ================= EXECUÇÃO =================
function executarBuildCompleto() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
  const biblioteca = escanearPastas();
  const templateItem = lerTemplate(TEMPLATE_ITEM);

  biblioteca.forEach(item=>{
    const slug = slugify(item.titulo);
    const outputFile = path.join(OUTPUT_DIR,`${slug}.html`);
    const htmlItem = gerarHTMLItem(item,templateItem);
    escreverArquivo(outputFile,htmlItem);
    console.log(`📄 HTML criado/atualizado: ${outputFile}`);
  });

  atualizarDownloadsHTML(biblioteca);
  console.log("✅ Build completo da biblioteca finalizado!");
}

// ================= INICIAR =================
executarBuildCompleto();
