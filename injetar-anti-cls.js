const fs = require("fs");
const path = require("path");

// 1. Configurações baseadas nas regras do seu projeto
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

// O bloco de CSS crítico que resolve o CLS globalmente (Sem regras de AdSense)
const cssCritico = `
    <!-- =====================================================
    CSS CRÍTICO ANTI-CLS (Esqueleto Estrutural)
    ===================================================== -->
    <style id="critical-layout-css">
      *, *::before, *::after { box-sizing: border-box; }
      #global-header-container { display: block; width: 100%; min-height: 96px !important; background-color: #fff; }
      #language-selector-placeholder { display: block; width: 100%; min-height: 40px; }
      #footer-placeholder { display: block; width: 100%; min-height: 520px; background-color: #1a3e74; }
      @media (min-width: 768px) { #footer-placeholder { min-height: 277px; } }
    </style>
</head>`;

let arquivosAlterados = 0;
let arquivosNaoPrecisaram = 0;

// 2. Função principal para varrer e processar
function processarFicheiros(diretorio) {
  const itens = fs.readdirSync(diretorio);

  for (const item of itens) {
    const caminhoCompleto = path.join(diretorio, item);
    const estatisticas = fs.statSync(caminhoCompleto);

    if (estatisticas.isDirectory()) {
      // Se for diretório, verifica se pode entrar
      // (Verifica se está na lista de permitidos, ou se o diretório pai é a raiz)
      const nomePasta = path.basename(caminhoCompleto);

      if (diretorio === "." && !pastasPermitidas.includes(nomePasta)) {
        continue; // Ignora pastas na raiz que não sejam de idiomas
      }
      if (pastasIgnoradas.includes(nomePasta)) {
        continue; // Ignora estritamente biblioteca, blog, etc
      }

      processarFicheiros(caminhoCompleto);
    } else if (estatisticas.isFile() && item.endsWith(".html")) {
      // Verifica se é um ficheiro HTML ignorado
      if (ficheirosIgnorados.includes(item)) {
        continue;
      }

      // Lê o conteúdo do HTML
      let conteudo = fs.readFileSync(caminhoCompleto, "utf8");

      // Verifica se já tem o código para não duplicar
      if (conteudo.includes('id="critical-layout-css"')) {
        arquivosNaoPrecisaram++;
        continue;
      }

      // Injeta o CSS Crítico exatamente antes do fechamento da tag </head>
      if (conteudo.includes("</head>")) {
        conteudo = conteudo.replace("</head>", cssCritico);
        fs.writeFileSync(caminhoCompleto, conteudo, "utf8");
        arquivosAlterados++;
        console.log(`[ATUALIZADO] ${caminhoCompleto}`);
      } else {
        console.warn(`[AVISO] Faltando </head> em: ${caminhoCompleto}`);
      }
    }
  }
}

// 3. Execução
console.log("Iniciando varredura para injetar CSS Crítico Anti-CLS...");
processarFicheiros(".");

// 4. Log final conforme suas regras
console.log("\n=======================================");
console.log("RELATÓRIO FINAL DE ATUALIZAÇÃO (ANTI-CLS)");
console.log("=======================================");
console.log(`Arquivos HTML alterados com sucesso: ${arquivosAlterados}`);
console.log(
  `Arquivos HTML que já estavam atualizados: ${arquivosNaoPrecisaram}`,
);
console.log("=======================================");
