// Importa os módulos necessários do Node.js
const fs = require('fs');
const path = require('path');

// --- Configurações ---
// O diretório raiz onde seus arquivos HTML estão. '.' significa o diretório atual.
const ROOT_DIR = path.resolve(__dirname); 

// Lista de arquivos para IGNORAR (copiada do sitemap)
const IGNORE_FILES = [
  'footer.html',
  'language_selector.html',
  'avaliacaomeem.html',
  'exemplo.html',
  'global-body-elements.html',
  'googlef8af7cdb552164b.html',
  'menu-global.html',
  'modelo.html',
  'novolayout.html',
  'politicaapp.html',
  'sitemapenemplo.html',
  'vacinas_improved.html',
];
// --- Fim das Configurações ---

/**
 * Encontra todos os arquivos .html em um diretório específico.
 */
function getHtmlFiles(dir) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    return files
      .filter(file => file.isFile() && path.extname(file.name) === '.html')
      .map(file => file.name);
  } catch (error) {
    console.error(`Erro ao ler o diretório ${dir}: ${error.message}`);
    return [];
  }
}

/**
 * Função principal que executa o script.
 */
function main() {
  // 1. Pega o idioma alvo do comando (ex: "ru", "tr", "ko")
  const targetLang = process.argv[2];

  // 2. Verifica se o idioma foi fornecido
  if (!targetLang) {
    console.error('ERRO: Você precisa especificar um idioma.');
    console.log('Exemplo de uso: node scaffold-lang.js ru');
    return; // Para o script
  }

  console.log(`Iniciando preparação para o idioma: "${targetLang}"...`);

  // 3. Define os caminhos
  const sourceDir = ROOT_DIR; // A fonte é a raiz
  const targetDir = path.join(ROOT_DIR, targetLang); // O alvo é a pasta do idioma

  // 4. Cria a pasta de idioma se ela não existir
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Pasta "${targetDir}" criada.`);
  }

  // 5. Pega todos os arquivos .html da pasta Raiz (Português)
  const sourceFiles = getHtmlFiles(sourceDir);
  let filesCopied = 0;
  let filesSkipped = 0;

  // 6. Loop para copiar os arquivos
  for (const file of sourceFiles) {
    // Ignora os arquivos de script, sitemap e da lista IGNORE_FILES
    if (file === 'sitemap.html' || 
        file === 'generate-sitemap.js' ||
        file === 'scaffold-lang.js' || // Ignora a si mesmo
        IGNORE_FILES.includes(file) || 
        file.startsWith('_')) {
      continue; // Pula este arquivo
    }

    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    // 7. Verifica se o arquivo JÁ EXISTE no destino
    if (fs.existsSync(targetPath)) {
      console.warn(`- PULANDO: ${targetPath} (já existe)`);
      filesSkipped++;
    } else {
      // 8. Copia o arquivo
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`+ COPIADO: ${targetPath}`);
      filesCopied++;
    }
  }

  console.log('\n--- Preparação Concluída! ---');
  console.log(`${filesCopied} arquivos copiados para a pasta "${targetLang}".`);
  console.log(`${filesSkipped} arquivos pulados (já existiam).`);
}

// Executa a função principal
main();