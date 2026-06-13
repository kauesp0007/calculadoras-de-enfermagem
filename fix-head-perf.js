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

function processFile(filePath) {
  const originalContent = fs.readFileSync(filePath, "utf8");
  let content = originalContent;

  // 1. Corrigir o aninhamento inválido do FontAwesome
  const faRegex =
    /<noscript>\s*<link rel="preload"[^>]*font-awesome[^>]*>\s*<noscript><link rel="stylesheet"[^>]*font-awesome[^>]*><\/noscript>\s*<\/noscript>/gi;
  const faReplacement = `<noscript>
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  </noscript>
  <noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></noscript>`;

  content = content.replace(faRegex, faReplacement);

  // 2. Pré-carregar a fonte inter-600.woff2 para quebrar a cadeia crítica do PageSpeed
  if (
    !content.includes("inter-600.woff2") &&
    content.includes("inter-regular.woff2")
  ) {
    const interRegularRegex =
      /(<link rel="preload" href="\/fonts\/inter\/inter-regular\.woff2"[^>]*>)/i;
    content = content.replace(
      interRegularRegex,
      '$1\n  <link rel="preload" href="/fonts/inter/inter-600.woff2" as="font" type="font/woff2" crossorigin>',
    );
  }

  // Se houve modificações, guarda o ficheiro
  if (originalContent !== content) {
    fs.writeFileSync(filePath, content, "utf8");
    modifiedCount++;
    console.log(`[Otimizado] ${filePath}`);
  } else {
    untouchedCount++;
  }
}

// Varredura recursiva
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

console.log("A iniciar a otimização do cabeçalho crítico (LCP/CSS)...");
walkSync(__dirname);

console.log(`\n=== LOG FINAL DA OTIMIZAÇÃO DE DESEMPENHO ===`);
console.log(`Ficheiros otimizados com sucesso: ${modifiedCount}`);
console.log(
  `Ficheiros que já estavam corretos ou não precisaram de alteração: ${untouchedCount}`,
);
console.log(`=============================================`);
