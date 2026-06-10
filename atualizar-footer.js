/**
 * ==========================================================================
 * AUTOMATIZADOR DE LOCALIZAÇÃO DO RODAPÉ (FOOTER)
 * Varre recursivamente o repositório e atualiza o carregamento do rodapé
 * injetando as traduções correspondentes para cada um dos 18 idiomas.
 * * Uso: node atualizar-footer.js
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÕES DE EXCLUSÃO (CONFORME REGRAS DO REPOSITÓRIO) ---
const ARQUIVOS_EXCLUIDOS = new Set([
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html"
]);

const PASTAS_EXCLUIDAS = new Set([
  "downloads",
  "biblioteca",
  "blog",
  "node_modules",
  ".git"
]);

// Lista dos 18 idiomas suportados em subpastas
const IDIOMAS_SUPORTADOS = [
  'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// --- REGEX ROBUSTA PARA CAPTURAR O SCRIPT LEGADO ---
// Suporta variações de espaços normais, quebras de linha (\r\n), aspas duplas/simples e non-breaking spaces (\u00A0).
const regexScriptLegado = /<div\s+id=["']footer-placeholder["']>\s*<\/div>[\s\u00A0]*<script>[\s\u00A0]*fetch\(\s*["']footer\.html["']\s*\)[\s\u00A0]*\.then\(\s*\(?response\)?\s*=>\s*response\.text\(\)\s*\)[\s\u00A0]*\.then\(\s*\(\s*(data|d)\s*\)\s*=>\s*\{\s*document\.getElementById\(\s*["']footer-placeholder["']\s*\)\.innerHTML\s*=\s*(data|d)\s*;?\s*\}\s*\);?[\s\u00A0]*<\/script>/gi;

// Contadores para o relatório final
let totalArquivosAlterados = 0;
let totalArquivosSemNecessidade = 0;

/**
 * Identifica o idioma correto com base no caminho relativo do arquivo HTML
 * @param {string} relativePath Caminho relativo do arquivo a partir da raiz do projeto
 * @returns {string} Código do idioma ('pt' para raiz, ou código da subpasta)
 */
function obterIdiomaPeloCaminho(relativePath) {
  const partes = relativePath.split(path.sep);
  if (partes.length > 1 && IDIOMAS_SUPORTADOS.includes(partes[0].toLowerCase())) {
    return partes[0].toLowerCase();
  }
  return 'pt';
}

/**
 * Cria a nova estrutura de script traduzido e performático com caminho absoluto /footer.html
 * @param {string} lang Código do idioma
 * @returns {string} Script HTML atualizado
 */
function gerarNovoScriptFooter(lang) {
  return `<div id="footer-placeholder"></div>
<script>
  fetch("/footer.html")
    .then(response => response.text())
    .then((data) => {
      document.getElementById("footer-placeholder").innerHTML = data;
      carregarTraducoes('${lang}', 'footer.json');
      carregarTraducoes('${lang}', 'cookies.json');
    });
</script>`;
}

/**
 * Processa um arquivo HTML individual, realizando a substituição se necessário
 * @param {string} fullPath Caminho completo no sistema de arquivos
 * @param {string} relativePath Caminho relativo a partir da execução do script
 */
function processarArquivoHtml(fullPath, relativePath) {
  try {
    const conteudoOriginal = fs.readFileSync(fullPath, 'utf8');

    // Verifica se o arquivo contém o script legível para substituição
    if (regexScriptLegado.test(conteudoOriginal)) {
      const idioma = obterIdiomaPeloCaminho(relativePath);
      const novoScript = gerarNovoScriptFooter(idioma);

      // Realiza a substituição de todas as ocorrências encontradas
      const novoConteudo = conteudoOriginal.replace(regexScriptLegado, novoScript);

      fs.writeFileSync(fullPath, novoConteudo, 'utf8');
      console.log(`\x1b[32m✔ Alterado:\x1b[0m ${relativePath} [\x1b[36mIdioma: ${idioma.toUpperCase()}\x1b[0m]`);
      totalArquivosAlterados++;
    } else {
      totalArquivosSemNecessidade++;
    }
  } catch (erro) {
    console.error(`\x1b[31m✖ Erro ao ler/escrever arquivo ${relativePath}:\x1b[0m`, erro);
    totalArquivosSemNecessidade++;
  }
}

/**
 * Varre o diretório de forma recursiva aplicando os filtros de ignorar arquivos e pastas
 * @param {string} dir Caminho do diretório atual
 */
function escanearDiretorios(dir) {
  const arquivos = fs.readdirSync(dir);

  for (const item of arquivos) {
    const caminhoCompleto = path.join(dir, item);
    const caminhoRelativo = path.relative(process.cwd(), caminhoCompleto);
    const info = fs.statSync(caminhoCompleto);

    if (info.isDirectory()) {
      // Ignora pastas na lista negra do projeto
      if (PASTAS_EXCLUIDAS.has(item.toLowerCase())) {
        continue;
      }
      escanearDiretorios(caminhoCompleto);
    } else if (info.isFile()) {
      // Filtra apenas arquivos .html e que não estejam na lista de excluídos
      if (path.extname(item).toLowerCase() === '.html') {
        if (ARQUIVOS_EXCLUIDOS.has(item)) {
          totalArquivosSemNecessidade++;
          continue;
        }
        processarArquivoHtml(caminhoCompleto, caminhoRelativo);
      }
    }
  }
}

// --- EXECUÇÃO INICIAL ---
console.log("\x1b[33m🚀 Iniciando automação de atualização do rodapé global...\x1b[0m\n");

const diretorioRaiz = process.cwd();
escanearDiretorios(diretorioRaiz);

// --- LOG FINAL DE SAÍDA NO TERMINAL ---
console.log("\n========================================================");
console.log("\x1b[34m📊 RELATÓRIO DE EXECUÇÃO:\x1b[0m");
console.log(`  • Arquivos alterados com sucesso: \x1b[32m${totalArquivosAlterados}\x1b[0m`);
console.log(`  • Arquivos que não precisaram de alteração: \x1b[33m${totalArquivosSemNecessidade}\x1b[0m`);
console.log("========================================================\n");