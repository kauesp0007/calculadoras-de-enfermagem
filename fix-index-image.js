const fs = require("fs");
const path = require("path");

// Diretórios a ignorar (respeitando a sua arquitetura)
const excludeDirs = ["downloads", "biblioteca", "blog", "node_modules", ".git"];

let modifiedCount = 0;
let untouchedCount = 0;

function processFile(filePath) {
  // Garante que só tocamos no index.html
  if (path.basename(filePath) !== "index.html") return;

  const originalContent = fs.readFileSync(filePath, "utf8");
  let content = originalContent;

  // Correção Cirúrgica Dinâmica: Captura estritamente a tag img do iconpages.webp
  content = content.replace(
    /(<img[^>]*src=["'][^"']*iconpages\.webp["'][^>]*)>/gi,
    (match) => {
      let tag = match;

      // Reduz o tamanho de exibição no HTML para que a imagem original de 128x192
      // atenda aos requisitos de alta densidade de pixels (DPR 1.5x) do PageSpeed.
      // 128 / 1.5 = 85.33px -> Usaremos 85px de largura.
      tag = tag.replace(/width=["']128["']/i, 'width="85"');
      tag = tag.replace(/height=["']192["']/i, 'height="128"');

      // Substitui as classes Tailwind w-32 h-48 (128x192) por w-[85px] h-[128px]
      tag = tag.replace(/w-32 h-48/i, "w-[85px] h-[128px] object-contain");

      return tag;
    },
  );

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
  "Iniciando correção cirúrgica de resolução (PageSpeed) no index.html...",
);
walkSync(__dirname);

// Geração do Log requerido
console.log(`\n=== LOG FINAL DA OTIMIZAÇÃO DE RESOLUÇÃO DE IMAGEM ===`);
console.log(`Arquivos 'index.html' corrigidos com sucesso: ${modifiedCount}`);
console.log(`Arquivos 'index.html' que já estavam corretos: ${untouchedCount}`);
console.log(`=======================================================`);
