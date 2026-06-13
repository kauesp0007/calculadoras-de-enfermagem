const fs = require("fs");
const path = require("path");

// Diretórios que devem ser estritamente ignorados conforme a sua regra
const excludeDirs = ["downloads", "biblioteca", "blog", "node_modules", ".git"];

let modifiedCount = 0;
let untouchedCount = 0;

function processFile(filePath) {
  // Garante que só tocamos no menu-global.html autorizado
  if (path.basename(filePath) !== "menu-global.html") return;

  const originalContent = fs.readFileSync(filePath, "utf8");
  let content = originalContent;

  // 1. Correção Cirúrgica do Logotipo (Preservando a tradução do "alt")
  content = content.replace(
    /(<img[^>]*src=["'][^"']*icontopbar1\.webp["'][^>]*)>/gi,
    (match) => {
      let tag = match;
      // Atualiza as dimensões de 100 para os recomendados 48x32
      tag = tag.replace(/width=["']\d+["']/i, 'width="48"');
      tag = tag.replace(/height=["']\d+["']/i, 'height="32"');
      tag = tag.replace(/max-w-\[\d+px\]/i, "max-w-[48px]");
      tag = tag.replace(/max-h-\[\d+px\]/i, "max-h-[32px]");

      // Remove lazy loading (pois LCP não deve ter lazy)
      tag = tag.replace(/\s*loading=["']lazy["']/i, "");

      // Injeta fetchpriority="high" se não estiver presente
      if (!tag.includes("fetchpriority")) {
        tag = tag.replace(/\/?\s*>$/, ' fetchpriority="high" />');
      }
      return tag;
    },
  );

  // 2. Correção de Acessibilidade (ARIA) no menu mobile
  // Captura apenas o bloco da lista principal dentro do offCanvasMenu para não afetar outras áreas
  const mobileMenuRegex =
    /(<div id="offCanvasMenu"[\s\S]*?<ul[^>]*role=["']menu["'][^>]*>)([\s\S]*?)(<\/div>\s*<div id="menuOverlay")/i;
  content = content.replace(
    mobileMenuRegex,
    (match, prefix, menuContent, suffix) => {
      // Injeta role="menuitem" nos botões (apenas se já não tiverem)
      let updatedMenu = menuContent.replace(
        /<button(?![^>]*role=["']menuitem["'])([^>]*)>/gi,
        '<button role="menuitem"$1>',
      );
      // Injeta role="menuitem" nos links (apenas se já não tiverem)
      updatedMenu = updatedMenu.replace(
        /<a(?![^>]*role=["']menuitem["'])([^>]*)>/gi,
        '<a role="menuitem"$1>',
      );

      return prefix + updatedMenu + suffix;
    },
  );

  // Se houve modificações, guarda o ficheiro
  if (originalContent !== content) {
    fs.writeFileSync(filePath, content, "utf8");
    modifiedCount++;
    console.log(`[Corrigido] ${filePath}`);
  } else {
    untouchedCount++;
  }
}

// Varredura recursiva nos diretórios (Raiz + Idiomas)
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
  "Iniciando correção cirúrgica nos menus globais (Logotipo e ARIA)...",
);
walkSync(__dirname);

// Geração do Log requerido
console.log(`\n=== LOG FINAL DA OTIMIZAÇÃO ===`);
console.log(
  `Arquivos 'menu-global.html' corrigidos com sucesso: ${modifiedCount}`,
);
console.log(
  `Arquivos 'menu-global.html' que já estavam corretos: ${untouchedCount}`,
);
console.log(`===============================`);
