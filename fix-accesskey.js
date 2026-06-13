const fs = require("fs");
const path = require("path");

// Regras de exclusão baseadas nas suas diretrizes
const excludeDirs = ["downloads", "biblioteca", "blog", "node_modules", ".git"];
const excludeFiles = [
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html",
];

let modifiedCount = 0;
let untouchedCount = 0;

// Função cirúrgica para processar o HTML
function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  // Regex: Busca a tag <a> que contém href="#backToTopBtn" e remove com precisão o accesskey="T"
  const regex =
    /(<a[^>]*href=["']#backToTopBtn["'][^>]*?)\s*accesskey=["']T["']([^>]*>)/gi;

  if (regex.test(content)) {
    const newContent = content.replace(regex, "$1$2");
    fs.writeFileSync(filePath, newContent, "utf8");
    modifiedCount++;
    console.log(`[Corrigido] ${filePath}`);
  } else {
    untouchedCount++;
  }
}

// Varredura recursiva de diretórios
function walkSync(currentDirPath) {
  const dirents = fs.readdirSync(currentDirPath, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(currentDirPath, dirent.name);
    if (dirent.isDirectory()) {
      if (!excludeDirs.includes(dirent.name)) {
        walkSync(res);
      }
    } else {
      if (
        dirent.name.endsWith(".html") &&
        !excludeFiles.includes(dirent.name)
      ) {
        processFile(res);
      }
    }
  }
}

// Inicia a execução na raiz do repositório
console.log("Iniciando escaneamento cirúrgico dos arquivos HTML...");
walkSync(__dirname);

// Gera o log final exigido
console.log(`\n=== LOG FINAL DA OPERAÇÃO ===`);
console.log(`Arquivos alterados com sucesso: ${modifiedCount}`);
console.log(`Arquivos que não precisaram de alteração: ${untouchedCount}`);
console.log(`=============================`);
