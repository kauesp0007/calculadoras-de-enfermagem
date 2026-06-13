const fs = require("fs");
const path = require("path");

// Diretórios a ignorar (respeitando a sua arquitetura)
const excludeDirs = ["downloads", "biblioteca", "blog", "node_modules", ".git"];

let modifiedCount = 0;
let untouchedCount = 0;

function processFile(filePath) {
  // Garante que só tocamos no footer.html
  if (path.basename(filePath) !== "footer.html") return;

  // PROTEÇÃO ABSOLUTA: Ignora completamente o footer da raiz!
  const isRoot = path.dirname(filePath) === __dirname;
  if (isRoot) {
    console.log(`[IGNORADO - RAIZ] ${filePath}`);
    return;
  }

  const originalContent = fs.readFileSync(filePath, "utf8");
  let content = originalContent;

  // Correção Cirúrgica Dinâmica: Captura h2, h3, h4 ou h5 apenas nos idiomas.
  const headingRegex = /<h([2-5])([^>]*)>([\s\S]*?)<\/h\1>/gi;

  content = content.replace(
    headingRegex,
    (match, nivel, atributos, textoInterior) => {
      // Mantém todos os atributos originais (incluindo id, classes extras, etc.)
      let novasClasses = atributos;

      // Injeta a classe de estilo se não existir para manter a aparência visual de título
      if (!novasClasses.includes("class=")) {
        novasClasses += ' class="font-bold mb-2"';
      } else if (!novasClasses.includes("font-bold")) {
        novasClasses = novasClasses.replace(
          /class=["']([^"']*)["']/i,
          'class="font-bold mb-2 $1"',
        );
      }

      // Transforma em <div> mantendo TUDO o que estava dentro (a tradução do idioma)
      return `<div${novasClasses}>${textoInterior}</div>`;
    },
  );

  // Se houve modificações, guarda o ficheiro e exibe o log personalizado
  if (originalContent !== content) {
    fs.writeFileSync(filePath, content, "utf8");
    modifiedCount++;

    const idioma = path.basename(path.dirname(filePath));
    console.log(`[CORRIGIDO - IDIOMA: ${idioma.toUpperCase()}] ${filePath}`);
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
  "Iniciando correção semântica cirúrgica APENAS nos rodapés dos 18 idiomas...",
);
walkSync(__dirname);

// Geração do Log requerido
console.log(`\n=== LOG FINAL DA OTIMIZAÇÃO DE ACESSIBILIDADE ===`);
console.log(`Arquivos 'footer.html' corrigidos com sucesso: ${modifiedCount}`);
console.log(
  `Arquivos 'footer.html' que já estavam corretos: ${untouchedCount}`,
);
console.log(`=================================================`);
