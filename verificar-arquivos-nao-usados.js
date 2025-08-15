const fs = require("fs");
const path = require("path");

const pastaRaiz = "./"; // pasta do seu projeto

// Extensões que vamos verificar
const extensoes = [".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg"];

// Lista todos os arquivos recursivamente
function listarArquivos(diretorio) {
  let arquivos = [];
  fs.readdirSync(diretorio).forEach(arquivo => {
    const caminhoCompleto = path.join(diretorio, arquivo);
    if (fs.statSync(caminhoCompleto).isDirectory()) {
      arquivos = arquivos.concat(listarArquivos(caminhoCompleto));
    } else {
      arquivos.push(caminhoCompleto);
    }
  });
  return arquivos;
}

// Verifica quais arquivos estão sendo usados
function verificarNaoUsados() {
  const todosArquivos = listarArquivos(pastaRaiz)
    .filter(f => extensoes.includes(path.extname(f).toLowerCase()));

  const arquivosFonte = todosArquivos.filter(f => f.endsWith(".html") || f.endsWith(".css") || f.endsWith(".js"));
  let conteudoTotal = "";

  arquivosFonte.forEach(f => {
    conteudoTotal += fs.readFileSync(f, "utf8") + "\n";
  });

  const naoUsados = todosArquivos.filter(f => {
    const nomeArquivo = path.basename(f);
    return !conteudoTotal.includes(nomeArquivo);
  });

  console.log("\n📂 Arquivos NÃO utilizados:");
  naoUsados.forEach(f => console.log(" - " + f));
}

verificarNaoUsados();
