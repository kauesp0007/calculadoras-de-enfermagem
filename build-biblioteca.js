/* eslint-env node */
const fs = require("fs");
const path = require("path");

// ================= CONFIGURAÇÕES =================
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "item.template.html";
const OUTPUT_DIR = "biblioteca";
const BASE_URL = "https://www.calculadorasdeenfermagem.com.br";

// =================================================

// Gera slug amigável para URL
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Gera descrição SEO automática
function gerarDescricao(item) {
  return `Baixe gratuitamente ${item.titulo}. Material de enfermagem disponível na Biblioteca de Enfermagem com acesso rápido e seguro.`;
}

// Gera palavras-chave SEO automáticas
function gerarPalavrasChave(item) {
  const base = [
    "enfermagem",
    "biblioteca de enfermagem",
    "downloads enfermagem",
    "material enfermagem",
    "pdf enfermagem",
    "documentos enfermagem"
  ];

  return [...base, item.titulo.toLowerCase()].join(", ");
}

// Função principal
function construirBiblioteca() {
  console.log("📚 Iniciando geração das páginas da biblioteca...");

  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");

  // Cria pasta /biblioteca se não existir
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
    console.log("📁 Pasta /biblioteca criada");
  }

  data.forEach((item) => {
    const slug = slugify(item.titulo);
    const outputFile = path.join(OUTPUT_DIR, `${slug}.html`);

    const descricao = gerarDescricao(item);
    const palavras = gerarPalavrasChave(item);

    const htmlFinal = template
      .replace(/{{TITULO}}/g, item.titulo)
      .replace(/{{DESCRICAO}}/g, descricao)
      .replace(/{{PALAVRAS}}/g, palavras)
      .replace(/{{SLUG}}/g, slug)
      .replace(/{{CAPA}}/g, item.capa.replace(/^\/?/, "")) // garante sem //
      .replace(/{{FICHEIRO}}/g, item.ficheiro.replace(/^\/?/, ""))
      .replace(/{{DOWNLOAD}}/g, item.download || "");

    fs.writeFileSync(outputFile, htmlFinal);
    console.log(`📄 Criado: ${outputFile}`);
  });

  console.log("✅ Biblioteca gerada com sucesso!");
}

// Executa
construirBiblioteca();
