const chokidar = require("chokidar");
const sharp = require("sharp");
const path = require("path");

const imgFolder = path.join(__dirname, "img");

// evita reprocessar mesma imagem
const processed = new Set();

function convert(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (![".png", ".jpg", ".jpeg"].includes(ext)) return;

  const output = filePath.replace(ext, ".webp");

  // se já existe webp, não faz nada
  if (processed.has(output)) return;

  processed.add(output);

  sharp(filePath)
    .webp({ quality: 85 })
    .toFile(output)
    .then(() => {
      console.log("✔ convertido:", output);
    })
    .catch((err) => {
      console.log("erro:", err.message);
    });
}

console.log("🟢 Watch incremental ativo");

chokidar
  .watch(imgFolder, {
    ignoreInitial: true, // 🔥 ESSENCIAL
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 200,
    },
  })
  .on("add", convert); // 🔥 só arquivos novos
