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
let totalImagensCorrigidas = 0;

console.log(
  "Iniciando Otimização Cirúrgica de Imagens (LCP + CLS + Acessibilidade)...\n",
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
      let modificouNesteArquivo = false;

      // Encontra todas as tags de imagem <img> de forma segura
      const imgRegex = /<img([^>]+)>/gi;

      conteudoModificado = conteudoModificado.replace(
        imgRegex,
        (match, atributos) => {
          imgCount++;
          let cleanAttrs = atributos;
          let attrModificado = false;

          // --- 1. REGRA LCP (Core Web Vitals) ---
          const attrsAntes = cleanAttrs;
          cleanAttrs = cleanAttrs
            .replace(/\s+loading=["'][a-zA-Z]+["']/gi, "")
            .replace(/\s+fetchpriority=["'][a-zA-Z]+["']/gi, "");

          if (imgCount === 1) {
            cleanAttrs += ' loading="eager" fetchpriority="high"';
          } else {
            cleanAttrs += ' loading="lazy"';
          }
          if (cleanAttrs !== attrsAntes) attrModificado = true;

          // --- 2. REGRA DE ACESSIBILIDADE (SEO / Leitores de tela) ---
          if (!/alt=["']/i.test(cleanAttrs)) {
            cleanAttrs +=
              ' alt="Imagem ilustrativa - Calculadoras de Enfermagem"';
            attrModificado = true;
          }

          // --- 3. REGRA DE CLS (Width e Height em proporção 4:3 para o Mobile calcular) ---
          if (!/width=["']/i.test(cleanAttrs)) {
            cleanAttrs += ' width="800"';
            attrModificado = true;
          }
          if (!/height=["']/i.test(cleanAttrs)) {
            cleanAttrs += ' height="600"';
            attrModificado = true;
          }

          // --- 4. REGRA DE DECODING ---
          if (!/decoding=["']/i.test(cleanAttrs)) {
            cleanAttrs += ' decoding="async"';
            attrModificado = true;
          }

          if (attrModificado) {
            modificouNesteArquivo = true;
            totalImagensCorrigidas++;
          }

          // Remove espaços extras deixados no HTML e monta a tag de volta
          cleanAttrs = cleanAttrs.replace(/\s+/g, " ");
          return `<img${cleanAttrs}>`;
        },
      );

      // Só salva se houve alteração real para poupar o disco e recursos
      if (modificouNesteArquivo && conteudoOriginal !== conteudoModificado) {
        fs.writeFileSync(caminhoCompleto, conteudoModificado, "utf8");
        arquivosAlterados++;
        console.log(
          `[OTIMIZADO] ${caminhoCompleto} (${imgCount} imagens escaneadas e adequadas)`,
        );
      } else {
        arquivosNaoPrecisaram++;
      }
    }
  }
}

processarFicheiros(".");

console.log("\n=======================================");
console.log("RELATÓRIO FINAL DE OTIMIZAÇÃO (IMAGENS)");
console.log("=======================================");
console.log(`Arquivos HTML atualizados com sucesso: ${arquivosAlterados}`);
console.log(`Arquivos HTML intactos (já adequados): ${arquivosNaoPrecisaram}`);
console.log(
  `Total de imagens processadas e corrigidas: ${totalImagensCorrigidas}`,
);
console.log("=======================================");
