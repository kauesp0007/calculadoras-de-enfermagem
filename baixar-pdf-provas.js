// baixar-pdf-provas.js
const fs = require("fs");
const https = require("https");
const path = require("path");

// Carregar o JSON
const biblioteca = JSON.parse(
  fs.readFileSync("./biblioteca-provas.json", "utf8"),
);

// Criar pasta se nao existir
const pastaDownloads = "./provas-pdf";
if (!fs.existsSync(pastaDownloads)) {
  fs.mkdirSync(pastaDownloads);
}

function baixarPDF(url, nomeArquivo) {
  const filePath = path.join(pastaDownloads, nomeArquivo);
  const file = fs.createWriteStream(filePath);

  https
    .get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log(`Baixado: ${nomeArquivo}`);
      });
    })
    .on("error", (err) => {
      console.error(`Erro ao baixar ${nomeArquivo}:`, err.message);
    });
}

// Baixar todas as provas
biblioteca.provas.forEach((prova) => {
  const nomeArquivo = `${prova.id}_${prova.titulo.replace(/\s/g, "_")}.pdf`;
  baixarPDF(prova.pdf_url, nomeArquivo);
});
