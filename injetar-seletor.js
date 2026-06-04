const fs = require('fs');
const path = require('path');

const targetDirs = ['.', 'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const ignoreDirs = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git', '.vscode'];

const linhaBusca = '}).catch(e => console.warn("Não foi possível carregar os elementos globais do corpo:", e));';

const codigoInjecao = `
// Função para carregar o Seletor de Idiomas
fetch("/_language_selector.html")
  .then(response => response.text())
  .then(data => {
    const container = document.getElementById("language-selector-placeholder");
    if (container) {
      container.innerHTML = data;

      // DISPARAR EVENTO: Informa que o seletor foi carregado
      const event = new CustomEvent("langSelectorLoaded");
      document.dispatchEvent(event);
    }
  })
  .catch(err => console.error("Erro ao carregar seletor de idiomas:", err));`;

function injetarCodigo() {
    let alterados = 0;
    let naoAlterados = 0;

    targetDirs.forEach(dir => {
        const filePath = path.join(dir, 'global-scripts.js');

        if (fs.existsSync(filePath)) {
            let conteudo = fs.readFileSync(filePath, 'utf8');

            // Verifica se a linha de busca existe e se o código já não foi injetado
            if (conteudo.includes(linhaBusca) && !conteudo.includes('// Função para carregar o Seletor de Idiomas')) {
                // Insere o código após a linha de busca
                const novoConteudo = conteudo.replace(linhaBusca, linhaBusca + '\n' + codigoInjecao);
                fs.writeFileSync(filePath, novoConteudo, 'utf8');
                alterados++;
            } else {
                naoAlterados++;
            }
        }
    });

    console.log(`Log de execução: ${alterados} arquivos alterados, ${naoAlterados} arquivos não precisaram de alterações.`);
}

injetarCodigo();