// Importa os módulos essenciais do Node.js para lidar com ficheiros e caminhos
const fs = require("fs");
const path = require("path");

// --- Configuração ---
const config = {
  // Diretório base do projeto
  baseDir: "./",

  // O nosso ficheiro de "molde"
  templateFile: "sw-template.js",

  // O nome do ficheiro final
  outputFile: "sw.js",

  // Marcador exato no molde para a lista de arquivos
  markerFiles: "//INJETAR_ARQUIVOS_AQUI",

  // Marcador exato no molde para a versão automática do cache
  markerCacheVersion: "__CACHE_VERSION__",

  // QUAIS EXTENSÕES PRE-CACHEAR? (App Shell)
  // Removemos .html, .jpg, .webp, etc. para não explodir o cache do utilizador.
  // Ficheiros pesados e páginas serão cacheados dinamicamente durante a navegação.
  extensionsToCache: [
    ".css",
    ".js",
    ".json",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
  ],

  // Pastas e ficheiros a IGNORAR
  filesAndFoldersToIgnore: [
    "node_modules",
    ".git",
    ".github",
    "gerar-sw.js",
    "sw-template.js",
    "sw.js",
    "tailwind.config.js",
    "package.json",
    "package-lock.json",
    ".gitignore",
    "README.md",
    "limpar-cache-buster.js",
  ],
};
// --------------------

const walkSync = (dir, filelist = []) => {
  try {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const fileStat = fs.statSync(filePath);

      const isIgnored = config.filesAndFoldersToIgnore.includes(
        path.basename(filePath),
      );
      if (isIgnored) return;

      if (fileStat.isDirectory()) {
        filelist = walkSync(filePath, filelist);
      } else {
        const extension = path.extname(file);
        if (config.extensionsToCache.includes(extension)) {
          const urlPath = filePath.replace(/\\/g, "/").replace(/^\.\//, "/");

          filelist.push(urlPath);
        }
      }
    });
  } catch (error) {
    if (error.code !== "EPERM" && error.code !== "EACCES") {
      throw error;
    }
  }
  return filelist;
};

function gerarCacheVersion() {
  const d = new Date();
  const pad = (n, w = 2) => String(n).padStart(w, "0");

  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());

  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`; // Versão limpa para servir de Cache Buster
}

try {
  console.log("🤖 Iniciando automação do Service Worker...");

  console.log("🔎 Procurando ficheiros essenciais (App Shell)...");
  const files = walkSync(config.baseDir);

  // Adiciona manualmente páginas cruciais que devem estar sempre offline
  files.push("/offline.html");
  files.push("/index.html");

  // Remover duplicados caso existam
  const uniqueFiles = [...new Set(files)];
  uniqueFiles.sort();

  const filesString = uniqueFiles.map((file) => `'${file}'`).join(",\n  ");

  console.log(`📖 Lendo o molde ${config.templateFile}...`);
  const templateContent = fs.readFileSync(config.templateFile, "utf8");

  const cacheVersion = gerarCacheVersion();
  console.log(`🏷️ Cache version: ${cacheVersion}`);

  console.log("💉 Injetando lista de ficheiros e versão do cache...");
  let finalContent = templateContent.replace(config.markerFiles, filesString);

  if (!finalContent.includes(config.markerCacheVersion)) {
    throw new Error(
      `Marker não encontrado no template: ${config.markerCacheVersion}`,
    );
  }
  finalContent = finalContent.replaceAll(
    config.markerCacheVersion,
    cacheVersion,
  );

  console.log(`💾 Escrevendo o ficheiro final: ${config.outputFile}`);
  fs.writeFileSync(config.outputFile, finalContent, "utf8");

  console.log(
    `\n✅ Sucesso! '${config.outputFile}' atualizado de forma otimizada com ${uniqueFiles.length} ficheiros essenciais.\n` +
      `✅ Novo CACHE_NAME será: calculadoras-enfermagem-cache-${cacheVersion}`,
  );
} catch (error) {
  console.error("\n❌ ERRO ao gerar o Service Worker:", error);
}
