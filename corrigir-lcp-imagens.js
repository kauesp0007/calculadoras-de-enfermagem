const fs = require("fs");
const path = require("path");

// 1. Configurações de diretórios e arquivos
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
  "item.template.html",
  "downloads.template.html",
];

let arquivosAlterados = 0;
let arquivosNaoPrecisaram = 0;

console.log(
  "Iniciando Otimização Cirúrgica de Imagens (LCP - Core Web Vitals)...\n",
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
      let conteudoModificado = conteudoOriginal;
      let imgCount = 0;

      // Encontra todas as tags de imagem <img> de forma segura
      const imgRegex = /<img([^>]+)>/gi;

      conteudoModificado = conteudoModificado.replace(
        imgRegex,
        (match, atributos) => {
          imgCount++;

          // Limpa os atributos de carregamento antigos para evitar duplicações ou erros
          let cleanAttrs = atributos
            .replace(/\s+loading=["'][a-zA-Z]+["']/gi, "")
            .replace(/\s+fetchpriority=["'][a-zA-Z]+["']/gi, "");

          // Aplica a regra cirúrgica
          if (imgCount === 1) {
            // Imagem 1 (Topo/LCP): Máxima prioridade
            cleanAttrs += ' loading="eager" fetchpriority="high"';
          } else {
            // Imagem 2 em diante (Abaixo da dobra): Lazy load
            cleanAttrs += ' loading="lazy"';
          }

          // Remove espaços extras deixados no HTML e monta a tag de volta
          cleanAttrs = cleanAttrs.replace(/\s+/g, " ");
          return `<img${cleanAttrs}>`;
        },
      );

      // Só salva se houve alteração real para poupar o disco
      if (conteudoOriginal !== conteudoModificado) {
        fs.writeFileSync(caminhoCompleto, conteudoModificado, "utf8");
        arquivosAlterados++;
        console.log(
          `[OTIMIZADO] ${caminhoCompleto} (${imgCount} imagens processadas)`,
        );
      } else {
        arquivosNaoPrecisaram++;
      }
    }
  }
}

processarFicheiros(".");

console.log("\n=======================================");
console.log("RELATÓRIO FINAL DE LCP (IMAGENS)");
console.log("=======================================");
console.log(`Arquivos HTML atualizados com sucesso: ${arquivosAlterados}`);
console.log(`Arquivos HTML intactos: ${arquivosNaoPrecisaram}`);
console.log("=======================================");
