/* eslint-env node */
const fs = require("fs");
const path = require("path");

// ================= CONFIGURAÇÕES =================
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "item.template.html";
const OUTPUT_DIR = "biblioteca";
const BASE_URL = "https://www.calculadorasdeenfermagem.com.br";
// =================================================

// ================= FUNÇÕES =================

// Slug SEO
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Descrição SEO automática
function gerarDescricao(item) {
  return `Baixe gratuitamente ${item.titulo}. Material de enfermagem disponível na Biblioteca de Enfermagem com acesso rápido e seguro.`;
}

// Palavras-chave SEO
function gerarPalavrasChave(item) {
  const base = [
    "enfermagem",
    "biblioteca de enfermagem",
    "downloads enfermagem",
    "material enfermagem"
  ];
  return [...base, item.titulo.toLowerCase()].join(", ");
}

// Detecta tipo do arquivo
function detectarTipoArquivo(ficheiro) {
  const ext = path.extname(ficheiro).toLowerCase();

  if ([".pdf"].includes(ext)) return "Documento PDF";
  if ([".doc", ".docx"].includes(ext)) return "Documento de Texto";
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return "Imagem";
  if ([".mp4", ".webm", ".ogg"].includes(ext)) return "Vídeo";

  return "Arquivo";
}

// Gera tags automáticas
function gerarTags(item) {
  const palavrasTitulo = item.titulo
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(" ");

  const base = [
    "enfermagem",
    "biblioteca",
    item.categoria
  ];

  const tags = new Set([...base, ...palavrasTitulo]);
  return Array.from(tags).join(", ");
}

// ================= EXECUÇÃO =================

function construirBiblioteca() {
  console.log("📚 Gerando páginas da biblioteca...");

  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
    console.log("📁 Pasta /biblioteca criada");
  }

  data.forEach((item) => {
    const slug = slugify(item.titulo);
    const outputFile = path.join(OUTPUT_DIR, `${slug}.html`);

    const descricao = gerarDescricao(item);
    const palavras = gerarPalavrasChave(item);
    const tipo = detectarTipoArquivo(item.ficheiro);
    const tags = gerarTags(item);

    const htmlFinal = template
      .replace(/{{TITULO}}/g, item.titulo)
      .replace(/{{DESCRICAO}}/g, descricao)
      .replace(/{{PALAVRAS}}/g, palavras)
      .replace(/{{SLUG}}/g, slug)
      .replace(/{{CAPA}}/g, item.capa.replace(/^\/+/, ""))
      .replace(/{{FICHEIRO}}/g, item.ficheiro.replace(/^\/+/, ""))
      .replace(/{{DOWNLOAD}}/g, item.download || "")
      .replace(/{{CATEGORIA}}/g, item.categoria)
      .replace(/{{TIPO}}/g, tipo)
      .replace(/{{TAGS}}/g, tags);

    fs.writeFileSync(outputFile, htmlFinal);
    console.log(`📄 Criado: ${outputFile}`);
  });

  console.log("✅ Biblioteca gerada com sucesso!");
}

// Executa
construirBiblioteca();
