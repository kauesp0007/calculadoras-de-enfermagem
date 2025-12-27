// Importa os módulos essenciais do Node.js para lidar com ficheiros e caminhos
const fs = require('fs');
const path = require('path');

// --- Configuração ---
const config = {
  // Diretório base do projeto (onde o script vai começar a procurar)
  baseDir: './',

  // O nosso ficheiro de "molde"
  templateFile: 'sw-template.js',

  // O nome do ficheiro final que o navegador vai usar
  outputFile: 'sw.js',

  // Marcador exato no molde para a lista de arquivos
  markerFiles: "//INJETAR_ARQUIVOS_AQUI",

  // Marcador exato no molde para a versão automática do cache
  markerCacheVersion: "__CACHE_VERSION__",

  // Quais extensões de ficheiro queremos salvar no cache?
  extensionsToCache: [
    '.html',
    '.css',
    '.js',
    '.json',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
    '.ico',
    '.woff',
    '.woff2'
  ],

  // Quais pastas ou ficheiros devemos IGNORAR?
  filesAndFoldersToIgnore: [
    'node_modules',
    '.git',
    '.github',
    'gerar-sw.js',
    'sw-template.js',
    'sw.js',
    'tailwind.config.js',
    'package.json',
    'package-lock.json',
    '.gitignore',
    'README.md'
  ]
};
// --------------------

/**
 * Função auxiliar que "anda" (walk) por todas as pastas recursivamente
 * e retorna uma lista de todos os ficheiros que encontra.
 */
const walkSync = (dir, filelist = []) => {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const fileStat = fs.statSync(filePath);

      const isIgnored = config.filesAndFoldersToIgnore.includes(path.basename(filePath));
      if (isIgnored) return;

      if (fileStat.isDirectory()) {
        filelist = walkSync(filePath, filelist);
      } else {
        const extension = path.extname(file);
        if (config.extensionsToCache.includes(extension)) {
          const urlPath = filePath
            .replace(/\\/g, '/')
            .replace(/^\.\//, '/');

          filelist.push(urlPath);
        }
      }
    });
  } catch (error) {
    // Ignora erros de permissão de leitura de pastas do sistema
    if (error.code !== 'EPERM' && error.code !== 'EACCES') {
      throw error;
    }
  }
  return filelist;
};

/**
 * Gera uma versão automática pro cache:
 * - muda a cada execução
 * - segura para usar em string
 */
function gerarCacheVersion() {
  // Exemplo: 20251227-142233-123 (data-hora-ms)
  const d = new Date();
  const pad = (n, w = 2) => String(n).padStart(w, '0');

  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const ms = pad(d.getMilliseconds(), 3);

  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}-${ms}`;
}

// --- Execução Principal ---
try {
  console.log('🤖 Iniciando automação do Service Worker...');

  // 1. Encontrar todos os ficheiros válidos para o cache
  console.log('🔎 Procurando ficheiros...');
  const files = walkSync(config.baseDir);

  // (Opcional) ordenar para manter o sw.js sempre “estável” na ordem
  files.sort();

  // 2. Formatar a lista para array JS
  const filesString = files.map(file => `'${file}'`).join(',\n  ');

  // 3. Ler o molde
  console.log(`📖 Lendo o molde ${config.templateFile}...`);
  const templateContent = fs.readFileSync(config.templateFile, 'utf8');

  // 4. Gerar versão automática do cache e injetar tudo
  const cacheVersion = gerarCacheVersion();
  console.log(`🏷️ Cache version: ${cacheVersion}`);

  console.log('💉 Injetando lista de ficheiros e versão do cache...');
  let finalContent = templateContent.replace(config.markerFiles, filesString);

  if (!finalContent.includes(config.markerCacheVersion)) {
    throw new Error(
      `Marker de versão do cache não encontrado no template: ${config.markerCacheVersion}`
    );
  }
  finalContent = finalContent.replaceAll(config.markerCacheVersion, cacheVersion);

  // 5. Escrever o sw.js final
  console.log(`💾 Escrevendo o ficheiro final: ${config.outputFile}`);
  fs.writeFileSync(config.outputFile, finalContent, 'utf8');

  console.log(
    `\n✅ Sucesso! '${config.outputFile}' atualizado com ${files.length} ficheiros cacheados.\n` +
    `✅ Novo CACHE_NAME será: calculadoras-enfermagem-cache-${cacheVersion}`
  );

} catch (error) {
  console.error('\n❌ ERRO ao gerar o Service Worker:', error);
}
