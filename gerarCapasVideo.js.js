/* eslint-env node */
const fs = require("fs-extra");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;

// Configura os motores de vídeo e de leitura de tempo
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const VIDEOS_DIR = path.join(__dirname, "videos");
const IMG_DIR = path.join(__dirname, "img");
const JSON_PATH = path.join(__dirname, "biblioteca.json");

async function processarVideos() {
  console.log(
    "🎬 A iniciar a RECRIAÇÃO de capas para vídeos a 10% do tempo...",
  );

  let biblioteca = [];
  try {
    biblioteca = await fs.readJSON(JSON_PATH);
  } catch (e) {
    console.error("Erro ao ler biblioteca.json.", e);
    return;
  }

  await fs.ensureDir(IMG_DIR);

  let videoFiles = [];
  try {
    videoFiles = await fs.readdir(VIDEOS_DIR);
  } catch (e) {
    console.error("Pasta 'videos' não encontrada.");
    return;
  }

  let atualizacoes = 0;

  for (const videoFile of videoFiles.filter(
    (f) => f.endsWith(".mp4") || f.endsWith(".webm"),
  )) {
    const baseName = path.parse(videoFile).name;
    const imagemNome = `${baseName}.webp`;
    const caminhoCapaRelativo = `/img/${imagemNome}`;

    let item = biblioteca.find(
      (i) =>
        path.basename(i.ficheiro) === videoFile && i.categoria === "videos",
    );

    if (!item) continue;

    console.log(
      `⏳ A capturar fotograma a 10% da duração para ${videoFile}...`,
    );

    try {
      await new Promise((resolve, reject) => {
        ffmpeg(path.join(VIDEOS_DIR, videoFile))
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .screenshots({
            count: 1,
            folder: IMG_DIR,
            filename: imagemNome,
            timestamps: ["10%"],
          });
      });

      item.capa = caminhoCapaRelativo;
      atualizacoes++;
    } catch (err) {
      console.error(`❌ Falha ao processar o vídeo ${videoFile}:`, err.message);
    }
  }

  if (atualizacoes > 0) {
    await fs.writeJSON(JSON_PATH, biblioteca, { spaces: 2 });
    console.log(
      `💾 Sucesso! ${atualizacoes} imagens reais foram extraídas, sobrescritas e o JSON atualizado.`,
    );
  } else {
    console.log("Nenhuma capa precisou ser atualizada.");
  }
}

module.exports = processarVideos;
