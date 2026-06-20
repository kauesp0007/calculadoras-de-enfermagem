const fs = require("fs");
const path = require("path");

// 1. Configurações de diretórios baseadas nas regras do seu projeto
const pastasPermitidas = [
  ".",
  "en",
  "es",
  "fr",
  "it",
  "de",
  "hi",
  "zh",
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
  "ar",
];

const pastasIgnoradas = [
  "downloads",
  "biblioteca",
  "blog",
  "node_modules",
  ".git",
];

const ficheirosIgnorados = [
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html",
];

// Regex para encontrar os links adiados do Tailwind e do Global Styles
// Pega o href exato mantendo a versão dinâmica (?v=...)
const regexPreloadCss =
  /<link[^>]*href="([^"]*(?:output\.css|global-styles\.css)[^"]*)"[^>]*onload=[^>]*>/gi;

// Regex para remover a tag <noscript> associada que se torna inútil
const regexNoscript =
  /<noscript>\s*<link[^>]*href="[^"]*(?:output\.css|global-styles\.css)[^"]*"[^>]*>\s*<\/noscript>/gi;

let arquivosAlterados = 0;
let arquivosJaCorrigidos = 0;

console.log(
  "Iniciando correção de CLS: Revertendo Lazy Load do Tailwind e Global CSS...\n",
);

// 2. Função principal para varrer e processar
function processarFicheiros(diretorio) {
  const itens = fs.readdirSync(diretorio);

  for (const item of itens) {
    const caminhoCompleto = path.join(diretorio, item);
    const estatisticas = fs.statSync(caminhoCompleto);

    if (estatisticas.isDirectory()) {
      const nomePasta = path.basename(caminhoCompleto);
      if (diretorio === "." && !pastasPermitidas.includes(nomePasta)) continue;
      if (pastasIgnoradas.includes(nomePasta)) continue;
      processarFicheiros(caminhoCompleto);
    } else if (estatisticas.isFile() && item.endsWith(".html")) {
      if (ficheirosIgnorados.includes(item)) continue;

      let conteudoOriginal = fs.readFileSync(caminhoCompleto, "utf8");

      // Verifica se o arquivo tem o problema
      if (regexPreloadCss.test(conteudoOriginal)) {
        // Remove a tag noscript associada
        let conteudoModificado = conteudoOriginal.replace(regexNoscript, "");

        // Transforma o preload+onload em stylesheet normal
        conteudoModificado = conteudoModificado.replace(
          regexPreloadCss,
          '<link rel="stylesheet" href="$1">',
        );

        fs.writeFileSync(caminhoCompleto, conteudoModificado, "utf8");
        arquivosAlterados++;
        console.log(`[CORRIGIDO] ${caminhoCompleto}`);
      } else {
        arquivosJaCorrigidos++;
      }
    }
  }
}

processarFicheiros(".");

console.log("\n=======================================");
console.log("RELATÓRIO FINAL DE CORREÇÃO (CSS SYNC / CLS)");
console.log("=======================================");
console.log(`Arquivos HTML atualizados com sucesso: ${arquivosAlterados}`);
console.log(`Arquivos HTML que já estavam corretos: ${arquivosJaCorrigidos}`);
console.log("=======================================");
