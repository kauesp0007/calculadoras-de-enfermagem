/* eslint-env node */
const fs = require("fs");
const path = require("path");

// ================= CONFIGURAÇÕES =================
const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "item.template.html";
const OUTPUT_DIR = "biblioteca";
const BASE_URL = "https://www.calculadorasdeenfermagem.com.br";
// =================================================

// Gera slug amigável
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
  return `Baixe gratuitamente ${item.titulo}. Material de enfermagem disponível na Biblioteca de Enfermagem com acesso rápido, seguro e confiável.`;
}

// Gera palavras-chave SEO automáticas
function gerarPalavrasChave(item) {
  const base = [
    "enfermagem",
    "biblioteca de enfermagem",
    "downloads enfermagem",
    "material de enfermagem",
    "pdf enfermagem",
    "documentos enfermagem",
    "imagens enfermagem",
    "protocolos enfermagem"
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

  const slugsUsados = new Set();

  data.forEach((item) => {
    // Usa slug do JSON se existir, senão gera
    let slug = item.slug ? item.slug : slugify(item.titulo);

    // Garante slug único
    let slugFinal = slug;
    let contador = 1;
    while (slugsUsados.has(slugFinal)) {
      slugFinal = `${slug}-${contador++}`;
    }
    slugsUsados.add(slugFinal);

    const outputFile = path.join(OUTPUT_DIR, `${slugFinal}.html`);

    const descricao = item.descricao || gerarDescricao(item);
    const palavras = item.palavras || gerarPalavrasChave(item);

    let htmlFinal = template
      .replace(/{{TITULO}}/g, item.titulo)
      .replace(/{{DESCRICAO}}/g, descricao)
      .replace(/{{PALAVRAS}}/g, palavras)
      .replace(/{{SLUG}}/g, slugFinal)
      .replace(/{{CAPA}}/g, item.capa.replace(/^\/+/, ""))
      .replace(/{{FICHEIRO}}/g, item.ficheiro.replace(/^\/+/, ""));

    // Trata download (remove se não existir)
    if (item.download) {
      htmlFinal = htmlFinal.replace(/{{DOWNLOAD}}/g, item.download);
    } else {
      htmlFinal = htmlFinal
        .replace(/download="{{DOWNLOAD}}"/g, "")
        .replace(/{{DOWNLOAD}}/g, "");
    }

    fs.writeFileSync(outputFile, htmlFinal);
    console.log(`📄 Criado: ${outputFile}`);
  });

  console.log("✅ Biblioteca gerada com sucesso!");
}

// Executa
construirBiblioteca();
