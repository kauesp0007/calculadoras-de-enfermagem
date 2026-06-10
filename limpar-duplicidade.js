/**
 * ==========================================================================
 * AUTOMATIZADOR DE LIMPEZA E REMOÇÃO DE DUPLICIDADE (FOOTER)
 * Varre recursivamente o repositório para remover blocos redundantes do fetch
 * legado que ficaram pendentes após a migração do rodapé localizado.
 * Uso: node limpar-duplicidade.js
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');

// --- ARQUIVOS E PASTAS EXCLUÍDOS (CONFORME REGRAS PADRÃO DO REPOSITÓRIO) ---
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

// Lista dos 18 subdiretórios de idiomas
const IDIOMAS_PERMITIDOS = [
  'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Contadores de execução do terminal
let arquivosAlterados = 0;
let arquivosNaoAlterados = 0;

/**
 * Coleta todos os caminhos de arquivos HTML da raiz (português) e das subpastas de idiomas
 */
function obterArquivosParaProcessar() {
  const arquivosParaProcessar = [];
  const raiz = process.cwd();

  // 1. Processa arquivos HTML diretamente na raiz do projeto (Português)
  const itensRaiz = fs.readdirSync(raiz);
  for (const item of itensRaiz) {
    const caminhoCompleto = path.join(raiz, item);
    const stats = fs.statSync(caminhoCompleto);

    if (stats.isFile()) {
      if (path.extname(item).toLowerCase() === '.html' && !ARQUIVOS_EXCLUIDOS.has(item)) {
        arquivosParaProcessar.push(caminhoCompleto);
      }
    } else if (stats.isDirectory()) {
      // Se for um diretório de idioma mapeado, faz a varredura recursiva de arquivos
      if (IDIOMAS_PERMITIDOS.includes(item.toLowerCase())) {
        varrerDiretorioRecursivo(caminhoCompleto, arquivosParaProcessar);
      }
    }
  }

  return arquivosParaProcessar;
}

/**
 * Função recursiva de varredura ignorando pastas bloqueadas
 */
function varrerDiretorioRecursivo(diretorio, listaDeArquivos) {
  const itens = fs.readdirSync(diretorio);
  for (const item of itens) {
    const caminhoCompleto = path.join(diretorio, item);
    const stats = fs.statSync(caminhoCompleto);

    if (stats.isDirectory()) {
      const nomePasta = item.toLowerCase();
      // Não entra em nenhuma das pastas do filtro de exclusão
      if (!PASTAS_EXCLUIDAS.has(nomePasta)) {
        varrerDiretorioRecursivo(caminhoCompleto, listaDeArquivos);
      }
    } else if (stats.isFile()) {
      if (path.extname(item).toLowerCase() === '.html' && !ARQUIVOS_EXCLUIDOS.has(item)) {
        listaDeArquivos.push(caminhoCompleto);
      }
    }
  }
}

/**
 * Executa a higienização do código duplicado em cada HTML localizado
 */
function executarHigienizacao() {
  const listaDeArquivos = obterArquivosParaProcessar();

  // Expressão regular resiliente a quebras de linha (\r?\n), tabulações e non-breaking spaces (\u00A0)
  const regexDuplicidade = /fetch\s*\(\s*["']footer\.html["']\s*\)[\s\u00A0]*\.then\s*\(\s*\(?\s*response\s*\)?\s*=>\s*response\.text\(\)\s*\)[\s\u00A0]*\.then\s*\(\s*\(?\s*data\s*\)?\s*=>\s*\{[\s\u00A0]*const\s+footerPlaceholder\s*=\s*document\.getElementById\(\s*["']footer-placeholder["']\s*\)\s*;?[\s\u00A0]*if\s*\(\s*footerPlaceholder\s*\)\s*\{[\s\u00A0]*footerPlaceholder\.innerHTML\s*=\s*data\s*;?[\s\u00A0]*\}[\s\u00A0]*\}\s*\)\s*;?[\s\u00A0]*\}\s*\)\s*;?/gi;

  for (const arquivo of listaDeArquivos) {
    try {
      const conteudoOriginal = fs.readFileSync(arquivo, 'utf8');

      if (regexDuplicidade.test(conteudoOriginal)) {
        // Substitui o bloco duplicado fechando o bloco pai corretamente com "});"
        const novoConteudo = conteudoOriginal.replace(regexDuplicidade, '});');
        fs.writeFileSync(arquivo, novoConteudo, 'utf8');

        const caminhoRelativo = path.relative(process.cwd(), arquivo);
        console.log(`\x1b[32m✔ Limpo:\x1b[0m ${caminhoRelativo}`);
        arquivosAlterados++;
      } else {
        arquivosNaoAlterados++;
      }
    } catch (erro) {
      const caminhoRelativo = path.relative(process.cwd(), arquivo);
      console.error(`\x1b[31m✖ Falha ao ler ou salvar o arquivo ${caminhoRelativo}:\x1b[0m`, erro);
      arquivosNaoAlterados++;
    }
  }

  // Exibição amigável do relatório consolidado no console
  console.log("\n========================================================");
  console.log("\x1b[34m📊 RELATÓRIO DO SCRIPT DE LIMPEZA DE DUPLICIDADE:\x1b[0m");
  console.log(`  • Arquivos higienizados com sucesso: \x1b[32m${arquivosAlterados}\x1b[0m`);
  console.log(`  • Arquivos sem necessidade de alteração: \x1b[33m${arquivosNaoAlterados}\x1b[0m`);
  console.log("========================================================\n");
}

// --- DISPARO DA ROTINA ---
console.log("\x1b[33m⚡ Escaneando repositório para limpar código duplicado...\x1b[0m\n");
executarHigienizacao();