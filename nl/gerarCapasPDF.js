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
    density: 150,           // qualidade da imagem
    saveFilename: baseName,
    savePath: path.resolve(IMG_DIR),
    format: "png",
    width: 1024,
    height: 1448
  };

  const storeAsImage = fromPath(path.join(PDF_DIR, pdfFile), options);

  // Gera a primeira página como PNG
  await storeAsImage(1);
  // O pdf2pic pode gerar nomes variados e em pastas diferentes (img/ ou no CWD).
  const candidateNames = [
    `${baseName}.1.png`,
    `${baseName}.01.png`,
    `${baseName}-01.png`,
    `${baseName}-1.png`,
    `${baseName}.png`
  ];

  // Procura primeiro em IMG_DIR, depois na raiz do repo (CWD). Se encontrado na raiz, move para IMG_DIR.
  let actualPngPath = null;
  for (const name of candidateNames) {
    const pImg = path.join(IMG_DIR, name);
    if (await fs.pathExists(pImg)) { actualPngPath = pImg; break; }
  }
  if (!actualPngPath) {
    for (const name of candidateNames) {
      const pRoot = path.join(process.cwd(), name);
      if (await fs.pathExists(pRoot)) {
        // mover para IMG_DIR
        const dest = path.join(IMG_DIR, name);
        await fs.move(pRoot, dest, { overwrite: true });
        actualPngPath = dest;
        break;
      }
    }
  }

  if (!actualPngPath) {
    throw new Error(`Arquivo PNG de saída não encontrado para ${baseName} (tentados: ${candidateNames.join(', ')})`);
  }

  // Converte PNG para WebP
  await sharp(actualPngPath)
    .webp({ quality: 85 })
    .toFile(webpPath);

  // Remove PNG temporário (após converter para webp)
  try {
    await fs.remove(actualPngPath);
  } catch (e) {
    // não bloquear por falha na remoção
  }

  // Retorna caminho com barra inicial para ficar consistente com o site
  return ("/" + path.relative(__dirname, webpPath).replace(/\\/g, "/")).replace(/\/\//g, "/");
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

    // Localiza o item no JSON usando apenas o nome do arquivo
    let item = biblioteca.find(i => path.basename(i.ficheiro) === pdfFile);

    // Se não existir, adiciona novo item
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

    // Se já existe capa, pula a geração
    if (item.capa && item.capa.trim() !== "") {
      console.log(`Pular ${pdfFile} — capa já existente: ${item.capa}`);
      continue;
    }

    // Gera capa apenas para PDFs sem capa
    console.log(`Gerando capa para ${pdfFile}...`);
    try {
      item.capa = await gerarCapa(pdfFile);
    } catch (err) {
      console.error(`Falha ao gerar capa para ${pdfFile}:`, err && err.message ? err.message : err);
    }
  }

  // Salvar JSON atualizado
  await fs.writeJSON(JSON_PATH, biblioteca, { spaces: 2 });
  console.log("✅ biblioteca.json atualizado com capas para todos os PDFs!");
}

// Executa atualização
atualizarBiblioteca().catch(console.error);
