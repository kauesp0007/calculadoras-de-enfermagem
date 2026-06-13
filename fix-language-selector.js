const fs = require("fs");
const path = require("path");

// Diretórios a ignorar (respeitando a sua arquitetura)
const excludeDirs = ["downloads", "biblioteca", "blog", "node_modules", ".git"];

let modifiedCount = 0;
let untouchedCount = 0;

function processFile(filePath) {
  // Garante que só tocamos no _language_selector.html
  if (path.basename(filePath) !== "_language_selector.html") return;

  const originalContent = fs.readFileSync(filePath, "utf8");
  let content = originalContent;

  // Correção Cirúrgica Dinâmica: Captura estritamente as tags <img>
  content = content.replace(/<img([^>]*)>/gi, (match) => {
    let tag = match;

    // Corrige os atributos HTML para a proporção real 1:1 exigida pelo PageSpeed (20x20)
    tag = tag.replace(/width=["']20["']/i, 'width="20"');
    tag = tag.replace(/height=["']16["']/i, 'height="20"');

    // Corrige as classes Tailwind e adiciona 'object-cover' para perfeito enquadramento visual
    tag = tag.replace(/w-5 h-4/i, "w-5 h-5 object-cover");

    return tag;
  });

  // Se houve modificações, guarda o ficheiro e exibe o log personalizado
  if (originalContent !== content) {
    fs.writeFileSync(filePath, content, "utf8");
    modifiedCount++;

    const isRoot = path.dirname(filePath) === __dirname;
    if (isRoot) {
      console.log(`[CORRIGIDO - RAIZ (PT)] ${filePath}`);
    } else {
      const idioma = path.basename(path.dirname(filePath));
      console.log(`[CORRIGIDO - IDIOMA: ${idioma.toUpperCase()}] ${filePath}`);
    }
  } else {
    untouchedCount++;
  }
}

// Varredura recursiva nos diretórios
function walkSync(currentDirPath) {
  if (!fs.existsSync(currentDirPath)) return;
  const dirents = fs.readdirSync(currentDirPath, { withFileTypes: true });

  for (const dirent of dirents) {
    const res = path.resolve(currentDirPath, dirent.name);
    if (dirent.isDirectory()) {
      if (!excludeDirs.includes(dirent.name)) {
        walkSync(res);
      }
    } else {
      processFile(res);
    }
  }
}

console.log(
  "Iniciando correção cirúrgica do Aspect Ratio no _language_selector.html...",
);
walkSync(__dirname);

// Geração do Log requerido
console.log(`\n=== LOG FINAL DA OTIMIZAÇÃO DE IMAGENS (PAGE SPEED) ===`);
console.log(
  `Arquivos '_language_selector.html' corrigidos com sucesso: ${modifiedCount}`,
);
console.log(
  `Arquivos '_language_selector.html' que já estavam corretos: ${untouchedCount}`,
);
console.log(`========================================================`);
