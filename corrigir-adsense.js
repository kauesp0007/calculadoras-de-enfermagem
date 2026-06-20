const fs = require("fs");
const path = require("path");

// 1. As pastas onde os seus global-scripts.js estão localizados
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

// O trecho exato que existe no seu código atual
const trechoOriginal = `adContainer.className = "max-w-7xl mx-auto px-4 my-10";`;

// O novo trecho com a trava de altura (Anti-CLS)
const trechoCorrigido = `adContainer.className = "max-w-7xl mx-auto px-4 my-10";
  
  // ==========================================
  // ANTI-CLS: Reserva de espaço dinâmica para o AdSense Multiplex
  // ==========================================
  adContainer.style.minHeight = window.innerWidth >= 768 ? "90px" : "250px";`;

let arquivosAlterados = 0;
let arquivosJaCorrigidos = 0;
let arquivosNaoEncontrados = 0;

console.log(
  "Iniciando a correção do AdSense nos arquivos global-scripts.js...\n",
);

pastasPermitidas.forEach((pasta) => {
  // Monta o caminho exato para o global-scripts.js de cada pasta
  const caminhoJs = path.join(pasta, "global-scripts.js");

  if (fs.existsSync(caminhoJs)) {
    let conteudo = fs.readFileSync(caminhoJs, "utf8");

    // Verifica se a trava Anti-CLS já foi injetada para evitar duplicação
    if (
      conteudo.includes(
        "ANTI-CLS: Reserva de espaço dinâmica para o AdSense Multiplex",
      )
    ) {
      arquivosJaCorrigidos++;
      console.log(`[IGNORADO] ${caminhoJs} (Já estava corrigido)`);
    }
    // Se ainda não foi corrigido e o trecho original existir
    else if (conteudo.includes(trechoOriginal)) {
      conteudo = conteudo.replace(trechoOriginal, trechoCorrigido);
      fs.writeFileSync(caminhoJs, conteudo, "utf8");
      arquivosAlterados++;
      console.log(`[ATUALIZADO] ${caminhoJs}`);
    } else {
      console.log(
        `[AVISO] Trecho original não encontrado em: ${caminhoJs} (Verifique se o código é diferente nesta pasta)`,
      );
    }
  } else {
    arquivosNaoEncontrados++;
  }
});

console.log("\n=======================================");
console.log("RELATÓRIO FINAL DE CORREÇÃO (ADSENSE CLS)");
console.log("=======================================");
console.log(`Arquivos JS atualizados com sucesso: ${arquivosAlterados}`);
console.log(`Arquivos JS que já estavam corretos: ${arquivosJaCorrigidos}`);
console.log(
  `Arquivos JS não encontrados nas pastas: ${arquivosNaoEncontrados}`,
);
console.log("=======================================");
