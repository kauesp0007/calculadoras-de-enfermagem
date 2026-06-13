const chokidar = require("chokidar");
const sharp = require("sharp");
const path = require("path");

const imgFolder = path.join(__dirname, "img");

function convert(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (![".png", ".jpg", ".jpeg"].includes(ext)) return;

  const output = filePath.replace(ext, ".webp");

  sharp(filePath)
    .webp({ quality: 85 })
    .toFile(output)
    .then(() => {
      console.log("WEBP criado:", output);
    })
    .catch((err) => {
      console.log("Erro ao converter:", err.message);
    });
}

console.log("🟢 Monitorando /img...");

chokidar
  .watch(imgFolder, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000, // espera 1s arquivo estabilizar
      pollInterval: 100,
    },
  })
  .on("add", convert)
  .on("change", convert)
  .on("error", (error) => {
    console.log("Watcher error ignorado:", error.message);
  });
