const fs = require("fs");
const path = require("path");

// 1. Configurações de diretórios rigorosas (Regra do Projeto)
const pastasPermitidas = [
  ".", // Raiz (Português)
  "en",
  "es",
  "de",
  "it",
  "fr",
  "hi",
  "zh",
  "ar",
  "ja",
  "ru",
  "ko",
  "tr",
  "nl",
  "pl",
  "sv",
  "id",
  "vi",
  "uk",
];

// Pastas estritamente ignoradas
const pastasIgnoradas = [
  "downloads",
  "biblioteca",
  "blog",
  "node_modules",
  ".git",
  ".vscode",
];

// Arquivos estritamente ignorados
const arquivosIgnorados = [
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html",
];

// 2. Ficheiros alvo que tiveram a query string injetada
const ficheirosAlvo = [
  "/global-styles.css",
  "/public/output.css",
  "/global-scripts.js",
  "/lang-selector.js",
];

let alterados = 0;
let naoAlterados = 0;

function processarFicheiro(caminho) {
  const nomeFicheiro = path.basename(caminho);

  if (arquivosIgnorados.includes(nomeFicheiro) || !caminho.endsWith(".html")) {
    return;
  }

  const conteudoOriginal = fs.readFileSync(caminho, "utf-8");
  let conteudoModificado = conteudoOriginal;

  // Remove a query string ?v=... deixando apenas o caminho limpo
  ficheirosAlvo.forEach((alvo) => {
    const alvoEscapado = alvo.replace(/\./g, "\\.");

    // Regex para capturar e remover a query string do href ou src
    const regexCss = new RegExp(
      `href=["']${alvoEscapado}(\\?v=[0-9a-zA-Z\\-]+)?["']`,
      "g",
    );
    const regexJs = new RegExp(
      `src=["']${alvoEscapado}(\\?v=[0-9a-zA-Z\\-]+)?["']`,
      "g",
    );

    conteudoModificado = conteudoModificado.replace(regexCss, `href="${alvo}"`);
    conteudoModificado = conteudoModificado.replace(regexJs, `src="${alvo}"`);
  });

  if (conteudoOriginal !== conteudoModificado) {
    fs.writeFileSync(caminho, conteudoModificado, "utf-8");
    alterados++;
  } else {
    naoAlterados++;
  }
}

console.log("🧹 Iniciando limpeza do Cache Buster nos arquivos HTML...");

pastasPermitidas.forEach((pasta) => {
  const caminhoPasta = path.join(__dirname, pasta);

  // Pula se for uma pasta ignorada na raiz
  if (pastasIgnoradas.includes(pasta)) return;

  if (fs.existsSync(caminhoPasta)) {
    const ficheiros = fs.readdirSync(caminhoPasta);

    ficheiros.forEach((ficheiro) => {
      const caminhoCompleto = path.join(caminhoPasta, ficheiro);
      const stats = fs.statSync(caminhoCompleto);

      if (stats.isFile() && ficheiro.endsWith(".html")) {
        processarFicheiro(caminhoCompleto);
      }
    });
  }
});

console.log("\n================================================");
console.log("          RELATÓRIO DE LIMPEZA                  ");
console.log("================================================");
console.log(`Número de arquivos corrigidos/alterados: ${alterados}`);
console.log(`Número de arquivos que já estavam limpos: ${naoAlterados}`);
console.log("================================================\n");
