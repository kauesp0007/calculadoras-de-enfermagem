/* eslint-env node */
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const { fromPath } = require("pdf2pic");
const poppler = require("pdf-poppler");

const PDF_DIR = path.join(__dirname, "docs");
const IMG_DIR = path.join(__dirname, "img");
const JSON_PATH = path.join(__dirname, "biblioteca.json");

// Função para gerar capa a partir do PDF
async function gerarCapa(pdfFile) {
  const baseName = path.parse(pdfFile).name;
  const pngPath = path.join(IMG_DIR, baseName + ".png");
  const webpPath = path.join(IMG_DIR, baseName + ".webp");

  // Primeiro tenta usando pdf-poppler (vem com binários embutidos no pacote)
  const pdfPath = path.join(PDF_DIR, pdfFile);
  let converted = false;

  try {
    const popplerOpts = {
      format: "png",
      out_dir: path.resolve(IMG_DIR),
      out_prefix: baseName,
      page: 1,
      scale: 1024, // largura alvo em px
    };

    await poppler.convert(pdfPath, popplerOpts);
    converted = true;
  } catch (popErr) {
    console.warn(
      "pdf-poppler falhou para",
      pdfFile,
      "-",
      popErr && popErr.message ? popErr.message : popErr,
    );
    // Continua para tentar com pdf2pic/Gm como fallback
  }

  if (!converted) {
    // Configurações pdf2pic (fallback)
    const options = {
      density: 72, // reduzir para consumir menos memória (evita EPIPE)
      saveFilename: baseName,
      savePath: path.resolve(IMG_DIR),
      format: "png",
      width: 1024,
      height: 1448,
    };

    const storeAsImage = fromPath(pdfPath, options);

    // Gera a primeira página como PNG
    try {
      await storeAsImage(1);
    } catch (err) {
      // Re-throw para ser capturado pelo chamador
      throw err;
    }
  }

  // O pdf2pic pode gerar nomes variados e em pastas diferentes (img/ ou no CWD).
  const candidateNames = [
    `${baseName}.1.png`,
    `${baseName}.01.png`,
    `${baseName}.png`,
    `${baseName}-1.png`,
    `${baseName}-01.png`,
    `${baseName}-001.png`,
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

  // Lista atual de imagens já presentes no diretório img/
  let existingImgs = [];
  try {
    existingImgs = await fs.readdir(IMG_DIR);
  } catch (e) {
    existingImgs = [];
  }

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const findExistingCover = (baseName) => {
    const re = new RegExp(
      `^${escapeRegExp(baseName)}(?:[.-]\\d+)?\\.(webp|png|jpe?g)$`,
      "i",
    );
    for (const f of existingImgs) {
      if (re.test(f)) return f;
    }
    return null;
  };

  for (const pdfFile of pdfFiles.filter((f) => f.endsWith(".pdf"))) {
    const baseName = path.parse(pdfFile).name;
    const slug = baseName;

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

    // Se o JSON já aponta para uma capa, verifique se o arquivo realmente existe.
    if (item.capa && item.capa.trim() !== "") {
      const capaRel = item.capa.replace(/^\/+/, "");
      const capaAbs = path.join(__dirname, capaRel);
      if (await fs.pathExists(capaAbs)) {
        console.log(`⏭️ Pular ${pdfFile} — capa já existente: ${item.capa}`);
        continue;
      }

      // Capa referenciada ausente fisicamente; tente localizar por nomes semelhantes em img/
      const found = findExistingCover(baseName);
      if (found) {
        item.capa = `/img/${found}`;
        atualizacoes++;
        console.log(`🔗 Associada capa existente ${found} a ${pdfFile}`);
        continue;
      }

      // se não encontramos, prosseguimos para gerar
      console.log(
        `⚠️ Capa registrada em JSON mas arquivo ausente. Gerando nova capa para ${pdfFile}...`,
      );
    } else {
      // Se o JSON não tem capa, verifique se já existe um arquivo no diretório img/
      const found = findExistingCover(baseName);
      if (found) {
        item.capa = `/img/${found}`;
        atualizacoes++;
        console.log(
          `⏭️ Pular ${pdfFile} — capa já existente encontrada: ${item.capa}`,
        );
        continue;
      }
    }

    // Gera capa apenas quando necessário
    console.log(`⏳ Gerando capa para ${pdfFile}...`);
    try {
      item.capa = await gerarCapa(pdfFile);
      atualizacoes++;
      // atualiza lista local de imagens para evitar reprocessar nomes iguais na mesma execução
      existingImgs.push(`${baseName}.webp`);
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
