const fs = require('fs');
const path = require('path');

const IGNORE_FILE = '.automationignore';

/**
 * Lê o arquivo .automationignore e carrega as regras na memória.
 */
function loadRules() {
  if (!fs.existsSync(IGNORE_FILE)) return [];

  const content = fs.readFileSync(IGNORE_FILE, 'utf8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')); // Ignora linhas vazias e comentários
}

const rules = loadRules();

/**
 * Verifica se um arquivo ou caminho está na lista de protegidos.
 * @param {string} filePath - O caminho do arquivo a ser verificado (ex: "biblioteca/arquivo.js" ou "footer.html")
 * @returns {boolean} - Retorna TRUE se o arquivo for protegido (NÃO MEXER), ou FALSE se estiver livre.
 */
function isProtected(filePath) {
  // Normaliza as barras para evitar confusão entre Windows (\) e Linux (/)
  const normalizedPath = filePath.split(path.sep).join('/');

  for (const rule of rules) {
    // 1. Regra de Pasta: Se a regra termina com "/", verifica se o arquivo está dentro dessa pasta
    if (rule.endsWith('/')) {
      // Ex: regra "biblioteca/" protege "biblioteca/livro.pdf" e "biblioteca/pasta/script.js"
      if (normalizedPath.startsWith(rule) || normalizedPath.includes('/' + rule)) {
        return true;
      }
    }
    // 2. Regra de Arquivo Exato
    else {
      // Verifica se é o arquivo exato (ex: "footer.html")
      if (normalizedPath === rule) return true;

      // Verifica se é o arquivo no final do caminho (ex: "src/footer.html" se a regra for só "footer.html")
      // Nota: Ajuste isso se quiser que "footer.html" só proteja o da raiz.
      if (normalizedPath.endsWith('/' + rule)) return true;
    }
  }

  return false; // Não está na lista, pode mexer
}

module.exports = { isProtected };