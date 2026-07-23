// watch-pdfs.js — Monitora a pasta provas-pdf e atualiza o JSON automaticamente
const chokidar = require("chokidar");
const path = require("path");
const { adicionarPDF } = require("./build-pdf_provas_de_concursos.js");

const pdfFolder = path.join(__dirname, "provas-pdf");

console.log("🟢 Watch de PDFs ativo — monitorando pasta provas-pdf/");

chokidar
  .watch(pdfFolder, {
    ignoreInitial: true, // não processa arquivos existentes ao iniciar
    awaitWriteFinish: {
      stabilityThreshold: 2000, // espera 2s após término da cópia
      pollInterval: 300,
    },
  })
  .on("add", (filePath) => {
    const nomeArquivo = path.basename(filePath);
    console.log(`\n📄 Novo PDF detectado: ${nomeArquivo}`);
    adicionarPDF(nomeArquivo);
  })
  .on("error", (err) => {
    console.error("Erro no watcher:", err);
  });
