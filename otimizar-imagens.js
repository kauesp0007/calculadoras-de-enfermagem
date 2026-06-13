const fs = require("fs");
const path = require("path");

// Mapeamento rigoroso de diretórios e arquivos
const pastasPermitidas = [
  "",
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

const pastasIgnoradas = [
  "downloads",
  "biblioteca",
  "blog",
  "node_modules",
  ".git",
];

const arquivosIgnorados = [
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html",
];

let arquivosAlterados = 0;
let arquivosNaoAlterados = 0;

function deveIgnorar(caminhoArquivo, nomeArquivo) {
  // Verifica se o arquivo está na lista de ignorados
  if (arquivosIgnorados.includes(nomeArquivo)) return true;

  // Verifica se pertence a alguma pasta bloqueada
  for (const pasta of pastasIgnoradas) {
    if (
      caminhoArquivo.includes(path.sep + pasta + path.sep) ||
      caminhoArquivo.startsWith(pasta + path.sep)
    ) {
      return true;
    }
  }
  return false;
}

function processarDiretorio(diretorioAtual) {
  const itens = fs.readdirSync(diretorioAtual);

  for (const item of itens) {
    const caminhoCompleto = path.join(diretorioAtual, item);
    const stat = fs.statSync(caminhoCompleto);

    if (stat.isDirectory()) {
      // Se for diretório, entra apenas se for uma pasta de idioma na raiz
      const nomePasta = path.basename(caminhoCompleto);
      if (
        diretorioAtual === __dirname &&
        pastasPermitidas.includes(nomePasta) &&
        nomePasta !== ""
      ) {
        processarDiretorio(caminhoCompleto);
      }
    } else if (stat.isFile() && item.endsWith(".html")) {
      // Processa apenas arquivos HTML não ignorados
      if (!deveIgnorar(caminhoCompleto, item)) {
        // Aqui entrará a lógica de manipulação do HTML no Passo 2
        arquivosNaoAlterados++; // Temporário para teste estrutural
      }
    }
  }
}

// Inicia a varredura a partir da raiz do repositório
console.log("Iniciando varredura para otimização de imagens LCP...");
processarDiretorio(__dirname);

// Exibe o log final conforme a regra de automatizadores
console.log("==================================================");
console.log("Resumo da Otimização de Imagens:");
console.log(`Arquivos alterados: ${arquivosAlterados}`);
console.log(
  `Arquivos que não precisaram de alteração: ${arquivosNaoAlterados}`,
);
console.log("==================================================");
