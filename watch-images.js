const chokidar = require("chokidar");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const imgFolder = path.join(__dirname, "img");

// evita conversão duplicada
const processed = new Set();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function convert(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(ext)) return;

  const output = filePath.replace(ext, ".webp");

  // evita duplicação
  if (processed.has(output)) return;
  processed.add(output);

  // espera arquivo terminar de ser escrito
  await wait(800);

  try {
    await sharp(filePath).webp({ quality: 85 }).toFile(output);

    console.log("✔ WEBP criado:", output);
  } catch (err) {
    console.log("Erro conversão:", err.message);
  }
}

console.log("🟢 Watcher ativo em /img");

chokidar
  .watch(imgFolder, {
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1200,
      pollInterval: 200,
    },
  })
  .on("add", convert)
  .on("change", convert)
  .on("error", (err) => console.log("Watcher error:", err.message));
