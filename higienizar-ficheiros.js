/* eslint-env node */
const fs = require("fs");
const path = require("path");

const PASTA_ALVO = "img"; // Focando na pasta de imagens

function limparNome(nomeOriginal) {
  return nomeOriginal
    .toLowerCase()
    .normalize("NFD") // Remove acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.]+/g, "-") // Substitui espaços, sublinhados e carateres especiais por hífen
    .replace(/-+/g, "-") // Remove hífens duplos
    .replace(/(^-|-$)/g, ""); // Remove hífens no início ou fim
}

const dirPath = path.join(process.cwd(), PASTA_ALVO);

if (fs.existsSync(dirPath)) {
  const arquivos = fs.readdirSync(dirPath);
  let alterados = 0;

  arquivos.forEach(arquivo => {
    const nomeLimpo = limparNome(arquivo);

    if (arquivo !== nomeLimpo) {
      const caminhoAntigo = path.join(dirPath, arquivo);
      const caminhoNovo = path.join(dirPath, nomeLimpo);

      // Verifica se o ficheiro já existe com o nome limpo para não sobrescrever
      if (!fs.existsSync(caminhoNovo)) {
        fs.renameSync(caminhoAntigo, caminhoNovo);
        console.log(`Renomeado: "${arquivo}" -> "${nomeLimpo}"`);
        alterados++;
      } else {
        console.warn(`Aviso: Não foi possível renomear "${arquivo}" porque "${nomeLimpo}" já existe.`);
      }
    }
  });

  console.log(`\n✅ Concluído! ${alterados} ficheiros foram higienizados.`);
} else {
  console.error("Erro: Pasta img não encontrada.");
}