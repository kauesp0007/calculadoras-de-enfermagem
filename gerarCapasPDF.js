/* eslint-env node */
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const { fromPath } = require("pdf2pic");

const PDF_DIR = path.join(__dirname, "docs");
const IMG_DIR = path.join(__dirname, "img");
const JSON_PATH = path.join(__dirname, "biblioteca.json");

// Função para gerar capa a partir do PDF
async function gerarCapa(pdfFile) {
  const baseName = path.parse(pdfFile).name;
  const pngPath = path.join(IMG_DIR, baseName + ".png");
  const webpPath = path.join(IMG_DIR, baseName + ".webp");

  // Configurações pdf2pic
  const options = {
    density: 150, // qualidade da imagem
    saveFilename: baseName,
    savePath: path.resolve(IMG_DIR),
    format: "png",
    width: 1024,
    height: 1448,
  };

  const storeAsImage = fromPath(path.join(PDF_DIR, pdfFile), options);

  // Gera a primeira página como PNG
  await storeAsImage(1);

  // O pdf2pic pode gerar nomes variados e em pastas diferentes (img/ ou no CWD).
  const candidateNames = [
    `${baseName}.1.png`,
    `${baseName}.01.png`,
    `${baseName}.png`,
  ];

  let actualPngPath = null;
  for (const name of candidateNames) {
    const tempPath = path.join(IMG_DIR, name);
    if (await fs.pathExists(tempPath)) {
      actualPngPath = tempPath;
      break;
    }
  }

  if (!actualPngPath) {
    throw new Error(
      "Não foi possível encontrar a imagem PNG gerada pelo pdf2pic.",
    );
  }

  // Converte para WEBP e redimensiona
  await sharp(actualPngPath)
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(webpPath);

  // Remove o PNG temporário
  await fs.remove(actualPngPath);

  return `/img/${baseName}.webp`;
}

async function processarPDFs() {
  console.log("📚 A iniciar a verificação e geração de capas para PDFs...");
  await fs.ensureDir(IMG_DIR);

  let biblioteca = [];
  try {
    biblioteca = await fs.readJSON(JSON_PATH);
  } catch (e) {
    console.log("JSON vazio ou inválido, criando novo...");
  }

  let pdfFiles = [];
  try {
    pdfFiles = await fs.readdir(PDF_DIR);
  } catch (e) {
    console.error("Pasta 'docs' não encontrada.");
    return;
  }

  let atualizacoes = 0;

  for (const pdfFile of pdfFiles.filter((f) => f.endsWith(".pdf"))) {
    const slug = path.parse(pdfFile).name;

    // Localiza o item no JSON usando apenas o nome do arquivo
    let item = biblioteca.find(
      (i) =>
        path.basename(i.ficheiro) === pdfFile && i.categoria === "documentos",
    );

    // Se não existir, adiciona novo item
    if (!item) {
      item = {
        titulo: slug.replace(/[-_]/g, " "),
        slug,
        descricao: "",
        categoria: "documentos",
        ficheiro: `/docs/${pdfFile}`,
        capa: "",
        download: `/docs/${pdfFile}`,
      };
      biblioteca.push(item);
    }

    // NOVA REGRA DE BLINDAGEM: Se já existe capa, pula a geração
    if (item.capa && item.capa.trim() !== "") {
      console.log(`⏭️ Pular ${pdfFile} — capa já existente: ${item.capa}`);
      continue;
    }

    // Gera capa apenas para PDFs sem capa
    console.log(`⏳ Gerando capa para ${pdfFile}...`);
    try {
      item.capa = await gerarCapa(pdfFile);
      atualizacoes++;
    } catch (err) {
      console.error(`❌ Erro ao gerar capa para ${pdfFile}:`, err);
    }
  }

  // Só grava no JSON se houve alguma modificação para economizar disco
  if (atualizacoes > 0) {
    await fs.writeJSON(JSON_PATH, biblioteca, { spaces: 2 });
    console.log(
      `✅ ${atualizacoes} nova(s) capa(s) de PDF gerada(s) e salva(s) no biblioteca.json!`,
    );
  } else {
    console.log(
      "✅ Nenhuma nova capa de PDF precisou ser gerada (todas já existem).",
    );
  }
}

processarPDFs();
module.exports = processarPDFs;
