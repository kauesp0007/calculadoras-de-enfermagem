/* eslint-env node */
const fs = require("fs-extra");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const { createCanvas } = require("canvas");
const sharp = require("sharp");

const PDF_DIR = path.join(__dirname, "docs");
const IMG_DIR = path.join(__dirname, "img");
const JSON_PATH = path.join(__dirname, "biblioteca.json");

// Função para gerar capa do PDF
async function gerarCapa(pdfFile) {
  const baseName = path.parse(pdfFile).name;
  const pdfPath = path.join(PDF_DIR, pdfFile);
  const webpPath = path.join(IMG_DIR, baseName + ".webp");

  // Lê PDF
  const pdfBytes = await fs.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Pega a primeira página
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();

  // Cria canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fundo branco
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Renderiza texto básico (apenas título do PDF)
  ctx.fillStyle = "#000000";
  ctx.font = "bold 20px Arial";
  ctx.fillText(baseName, 50, 50);

  // Salva como PNG temporário
  const buffer = canvas.toBuffer("image/png");

  // Converte para WebP
  await sharp(buffer)
    .resize(1024, 1448, { fit: "inside" })
    .webp({ quality: 85 })
    .toFile(webpPath);

  return path.relative(__dirname, webpPath).replace(/\\/g, "/");
}

// Atualiza biblioteca.json
async function atualizarBiblioteca() {
  await fs.ensureFile(JSON_PATH);
  let biblioteca = [];
  try {
    biblioteca = await fs.readJSON(JSON_PATH);
  } catch (e) {
    console.log("JSON vazio ou inválido, criando novo...");
  }

  const pdfFiles = await fs.readdir(PDF_DIR);

  for (const pdfFile of pdfFiles.filter(f => f.endsWith(".pdf"))) {
    const slug = path.parse(pdfFile).name;

    let item = biblioteca.find(i => path.basename(i.ficheiro) === pdfFile);

    if (!item) {
      item = {
        titulo: slug.replace(/[-_]/g, " "),
        slug,
        descricao: "",
        categoria: "documentos",
        ficheiro: `/docs/${pdfFile}`,
        capa: "",
        download: `/docs/${pdfFile}`
      };
      biblioteca.push(item);
    }

    console.log(`Gerando capa para ${pdfFile}...`);
    item.capa = await gerarCapa(pdfFile);
  }

  await fs.writeJSON(JSON_PATH, biblioteca, { spaces: 2 });
  console.log("✅ biblioteca.json atualizado com capas para todos os PDFs!");
}

// Executa atualização
atualizarBiblioteca().catch(console.error);
