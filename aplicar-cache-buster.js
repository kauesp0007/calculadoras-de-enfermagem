const fs = require("fs");
const path = require("path");

// 1. Configurações de diretórios baseadas nas regras do projeto
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

const arquivosIgnorados = [
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html",
];

// 2. Ficheiros críticos que precisam de "Cache Buster" nas tags HTML
const ficheirosAlvo = [
  "/global-styles.css",
  "/public/output.css",
  "/global-scripts.js",
  "/lang-selector.js",
];

// 3. Gerar a string de versão baseada no timestamp atual (Ex: 202606141720)
const agora = new Date();
const versao = `${agora.getFullYear()}${(agora.getMonth() + 1).toString().padStart(2, "0")}${agora.getDate().toString().padStart(2, "0")}${agora.getHours().toString().padStart(2, "0")}${agora.getMinutes().toString().padStart(2, "0")}`;

let alterados = 0;
let naoAlterados = 0;

// 4. Função principal de processamento de cada ficheiro HTML
function processarFicheiro(caminho) {
  const nomeFicheiro = path.basename(caminho);

  // Regra: Não alterar ficheiros modulares bloqueados ou ficheiros que não sejam .html
  if (arquivosIgnorados.includes(nomeFicheiro) || !caminho.endsWith(".html")) {
    return;
  }

  const conteudoOriginal = fs.readFileSync(caminho, "utf-8");
  let conteudoModificado = conteudoOriginal;

  // Regra: Procurar pelas chamadas dos CSS e JS e aplicar o novo ?v=versao
  ficheirosAlvo.forEach((alvo) => {
    // Escapar os pontos do nome do ficheiro para a Regex
    const alvoEscapado = alvo.replace(/\./g, "\\.");

    // Regex para encontrar <link href="/ficheiro.css?v=123"> ou <script src="/ficheiro.js?v=123">
    const regexCss = new RegExp(
      `href=["']${alvoEscapado}(\\?v=[0-9a-zA-Z]+)?["']`,
      "g",
    );
    const regexJs = new RegExp(
      `src=["']${alvoEscapado}(\\?v=[0-9a-zA-Z]+)?["']`,
      "g",
    );

    conteudoModificado = conteudoModificado.replace(
      regexCss,
      `href="${alvo}?v=${versao}"`,
    );
    conteudoModificado = conteudoModificado.replace(
      regexJs,
      `src="${alvo}?v=${versao}"`,
    );
  });

  // Validar se houve realmente alteração para atualizar os contadores
  if (conteudoOriginal !== conteudoModificado) {
    fs.writeFileSync(caminho, conteudoModificado, "utf-8");
    alterados++;
  } else {
    naoAlterados++;
  }
}

// 5. Execução: Percorrer apenas as pastas autorizadas
console.log(
  "A iniciar varrimento do repositório para aplicação de Cache Buster...",
);

pastasPermitidas.forEach((pasta) => {
  const caminhoPasta = path.join(__dirname, pasta);

  if (fs.existsSync(caminhoPasta)) {
    const ficheiros = fs.readdirSync(caminhoPasta);

    ficheiros.forEach((ficheiro) => {
      const caminhoCompleto = path.join(caminhoPasta, ficheiro);
      const stats = fs.statSync(caminhoCompleto);

      // Regra: Avaliar apenas ficheiros na raiz das pastas permitidas (ignora subpastas como /downloads, /img)
      if (stats.isFile() && ficheiro.endsWith(".html")) {
        processarFicheiro(caminhoCompleto);
      }
    });
  }
});

// 6. Registo (Log) final obrigatório
console.log("\n================================================");
console.log("          RELATÓRIO DO CACHE BUSTER             ");
console.log("================================================");
console.log(`Versão injetada: ?v=${versao}`);
console.log(`Número de arquivos alterados: ${alterados}`);
console.log(
  `Número de arquivos que não precisaram ser alterados: ${naoAlterados}`,
);
console.log("================================================\n");
