/* eslint-env node */
// Importa os módulos 'fs' (para ler/escrever ficheiros) e 'path' (para lidar com caminhos)
const fs = require('fs');
const path = require('path');

// Define os nomes dos nossos ficheiros
const JSON_DATABASE_FILE = 'biblioteca.json';
const TEMPLATE_FILE = 'downloads.template.html';
const OUTPUT_FILE = 'downloads.html'; // O ficheiro final que será visto no site

/**
 * Gera o HTML para um único cartão.
 * @param {object} item - O objeto do item vindo do JSON.
 * @returns {string} - O HTML do cartão.
 */
function criarCartaoHTML(item) {
  // Define os atributos de download (só para documentos)
  const isDocument = item.categoria === 'documentos';
  const target = isDocument ? 'target="_blank"' : '';
  const download = item.download ? `download="${item.download}"` : '';
  const label = isDocument ? 'Baixar' : 'Ver';

  // Cria o HTML do cartão (COM o onerror de volta)
  return `
<!-- Item: ${item.titulo} -->
<a
  href="${item.ficheiro}"
  class="file-card"
  ${target}
  ${download}
  aria-label="${label} ${item.titulo}"
>
  <img 
    src="${item.capa}" 
    alt="Capa de ${item.titulo}" 
    class="file-card-image"
    onerror="this.src='https://placehold.co/400x480/EBF8FF/1A3E74?text=Erro';"
  >
  <h4 class="file-card-title">${item.titulo}</h4>
</a>`;
}

/**
 * Função principal que constrói a página.
 */
function construirPagina() {
  try {
    // 1. LER O "BANCO DE DADOS" JSON
    const jsonPath = path.join(__dirname, JSON_DATABASE_FILE);
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const biblioteca = JSON.parse(jsonData);

    // 2. LER O "MOLDE" HTML
    const templatePath = path.join(__dirname, TEMPLATE_FILE);
    let templateHtml = fs.readFileSync(templatePath, 'utf8');

    // 3. GERAR OS BLOCOS DE HTML
    const htmlGerado = {
      todos: [],
      documentos: [],
      fotos: [],
      videos: [],
    };

    // Itera por cada item no nosso "banco de dados"
    for (const item of biblioteca) {
      const cartaoHtml = criarCartaoHTML(item);
      htmlGerado.todos.push(cartaoHtml);
      if (item.categoria === 'documentos') {
        htmlGerado.documentos.push(cartaoHtml);
      } else if (item.categoria === 'fotos') {
        htmlGerado.fotos.push(cartaoHtml);
      } else if (item.categoria === 'videos') {
        htmlGerado.videos.push(cartaoHtml);
      }
    }

    // 4. SUBSTITUIR OS MARCADORES NO MOLDE
    templateHtml = templateHtml.replace('<!-- [GERAR_TODOS] -->', htmlGerado.todos.join('\n'));
    templateHtml = templateHtml.replace('<!-- [GERAR_DOCUMENTOS] -->', htmlGerado.documentos.join('\n'));
    templateHtml = templateHtml.replace('<!-- [GERAR_FOTOS] -->', htmlGerado.fotos.join('\n'));
    templateHtml = templateHtml.replace('<!-- [GERAR_VIDEOS] -->', htmlGerado.videos.join('\n'));

    // 5. ESCREVER O FICHEIRO FINAL 'downloads.html'
    const outputPath = path.join(__dirname, OUTPUT_FILE);
    fs.writeFileSync(outputPath, templateHtml);

    console.log(`\x1b[32m%s\x1b[0m`, `✅ Sucesso! O ficheiro '${OUTPUT_FILE}' foi (re)construído com ${biblioteca.length} itens.`);

  } catch (error) {
    console.error(`\x1b[31m%s\x1b[0m`, `❌ ERRO AO CONSTRUIR A PÁGINA:`);
    console.error(error);
  }
}

// Executa a função principal
construirPagina();