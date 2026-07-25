/**
 * Automatizador de Correção de Badges v2
 * 
 * Corrige a cor verde (escore 0) nos badges dos cards de formulário
 * em TODOS os HTMLs que possuem o sistema atualizarCardIndividual.
 * 
 * Estratégia: Abordagem linha-por-linha (não depende de regex complexo)
 * 
 * Uso: node corrigir-badges.js [--dry-run] [--verbose] [--only=filename]
 */

const fs = require('fs');
const path = require('path');

// ===================== CONFIGURAÇÃO =====================

const ROOT_DIR = __dirname;
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const ONLY = process.argv.find(a => a.startsWith('--only='))?.split('=')[1] || null;

const EXCLUDED_DIRS = [
  'downloads', 'biblioteca', 'blog', 'blog-templates', 'locales',
  'fonts', 'node_modules', '.git', 'public', 'img', 'automacoes',
  'assets', 'css', 'font', 'js', 'admin', 'src', 'dist', '.vscode',
  'institucionais'
];

const EXCLUDED_FILES = [
  'footer.html', 'menu-global.html', 'global-body-elements.html',
  'downloads.html', 'menu-lateral.html', '_language_selector.html',
  'googlefc0a17cdd552164b.html'
];

// ===================== FUNÇÕES AUXILIARES =====================

function shouldExcludeDir(dirName) {
  return EXCLUDED_DIRS.includes(dirName.toLowerCase());
}

function shouldExcludeFile(fileName) {
  return EXCLUDED_FILES.includes(fileName.toLowerCase());
}

function walkDir(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shouldExcludeDir(entry.name)) {
        walkDir(fullPath, fileList);
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      if (!shouldExcludeFile(entry.name)) {
        if (!ONLY || entry.name === ONLY) {
          fileList.push(fullPath);
        }
      }
    }
  }
  return fileList;
}

// ===================== CORREÇÃO PRINCIPAL =====================

/**
 * Corrige o arquivo adicionando badge.style.* após bar.style.backgroundColor.
 * Funciona para AMBOS os padrões.
 * Retorna o conteúdo corrigido, ou null se não precisar de correção.
 */
function fixBadgeColors(content) {
  if (/badge\.style\.background/.test(content)) return null;
  if (!content.includes('atualizarCardIndividual')) return null;
  if (!content.includes('bar.style.backgroundColor')) return null;

  const lines = content.split('\n');

  let funcStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function atualizarCardIndividual')) {
      funcStart = i;
      break;
    }
  }
  if (funcStart === -1) return null;

  let barraGlobalLine = -1;
  for (let i = funcStart; i < lines.length; i++) {
    if (lines[i].includes('atualizarBarraGlobal()')) {
      barraGlobalLine = i;
      break;
    }
  }
  if (barraGlobalLine === -1) return null;

  // Padrão A: já tem cor variable
  let corLine = -1;
  for (let i = funcStart; i <= barraGlobalLine; i++) {
    if (/bar\.style\.backgroundColor\s*=\s*cor\s*;/.test(lines[i])) {
      corLine = i;
      break;
    }
  }

  if (corLine !== -1) {
    return fixPatternA(lines, corLine);
  }

  // Padrão B: if/else inline
  return fixPatternB(lines, funcStart, barraGlobalLine);
}

function fixPatternA(lines, corLine) {
  const indent = lines[corLine].match(/^(\s*)/)[1];
  const badgeLines = [
    '',
    indent + '// Badge tamb\u00E9m muda de cor conforme escore',
    indent + 'badge.style.backgroundColor = cor === "transparent" ? "" : `${cor}15`;',
    indent + 'badge.style.color = cor === "transparent" ? "" : cor;',
    indent + 'badge.style.borderColor = cor === "transparent" ? "" : `${cor}30`;',
  ];
  const newLines = [...lines];
  newLines.splice(corLine + 1, 0, ...badgeLines);
  return newLines.join('\n');
}

function fixPatternB(lines, funcStart, barraGlobalLine) {
  // Coleta todas as cores no bloco if/else
  const colorLines = [];
  for (let i = funcStart; i <= barraGlobalLine; i++) {
    const m = lines[i].match(/bar\.style\.backgroundColor\s*=\s*"(#[0-9a-fA-F]+)"/);
    if (m) colorLines.push({ idx: i, color: m[1] });
  }
  if (colorLines.length === 0) return null;

  // Encontra onde começa o bloco if/else (primeiro if antes do primeiro colorLine)
  let blockStart = -1;
  for (let i = colorLines[0].idx; i >= funcStart; i--) {
    if (lines[i].includes('if (val')) { blockStart = i; break; }
  }
  if (blockStart === -1) return null;

  // Encontra fim do bloco (último bar.style.backgroundColor = "transparent" ou último colorLine)
  let blockEnd = colorLines[colorLines.length - 1].idx;
  for (let i = blockEnd + 1; i <= barraGlobalLine; i++) {
    if (lines[i].includes('bar.style.backgroundColor') && lines[i].includes('transparent')) {
      blockEnd = i;
    }
    if (lines[i].trim() === '') break; // para na primeira linha vazia
  }

  // Inclui comentário antes do bloco se existir
  if (blockStart > 0 && lines[blockStart - 1].trim().startsWith('//') && lines[blockStart - 1].trim().toLowerCase().includes('cor')) {
    blockStart = blockStart - 1;
  }

  const indent = lines[blockStart].match(/^(\s*)/) ? (lines[blockStart].match(/^(\s*)/)[1]) : '';

  // Extrai condições
  const blockText = lines.slice(blockStart, blockEnd + 1).join('\n');
  const condRegex = /(?:else\s+)?if\s*\(val\s*([=!]+=)\s*(\d+)\)/g;
  const conditions = [];
  let cm;
  while ((cm = condRegex.exec(blockText)) !== null) {
    conditions.push({ op: cm[1], val: parseInt(cm[2]) });
  }

  if (conditions.length === 0) {
    // Fallback: valores sequenciais
    for (let i = 0; i < colorLines.length; i++) {
      conditions.push({ op: '===', val: i });
    }
  }

  if (conditions.length !== colorLines.length) {
    // Tenta ajustar: pode ter mais conditions que colors (se alguns branches não têm cores)
    // Usa só as cores que temos
    const n = Math.min(conditions.length, colorLines.length);
    conditions.length = n;
    colorLines.length = n;
  }

  // Constrói novo bloco
  const newBlock = [];
  
  // Comentário (mantém se já existia)
  const firstLine = lines[blockStart].trim();
  if (firstLine.startsWith('//')) {
    newBlock.push(lines[blockStart]);
  } else {
    newBlock.push(indent + '// Cores baseadas na gravidade');
  }
  
  newBlock.push(indent + 'let cor = "transparent";');

  conditions.forEach((cond, i) => {
    const prefix = i === 0 ? 'if' : 'else if';
    newBlock.push(`${indent}${prefix} (val ${cond.op} ${cond.val}) cor = "${colorLines[i].color}";`);
  });

  newBlock.push('');
  newBlock.push(indent + 'bar.style.backgroundColor = cor;');
  newBlock.push('');
  newBlock.push(indent + '// Badge tamb\u00E9m muda de cor conforme escore');
  newBlock.push(indent + 'badge.style.backgroundColor = cor === "transparent" ? "" : `${cor}15`;');
  newBlock.push(indent + 'badge.style.color = cor === "transparent" ? "" : cor;');
  newBlock.push(indent + 'badge.style.borderColor = cor === "transparent" ? "" : `${cor}30`;');

  const newLines = [...lines];
  const removeCount = blockEnd - blockStart + 1;
  newLines.splice(blockStart, removeCount, ...newBlock);

  return newLines.join('\n');
}

// ===================== MAIN =====================

function main() {
  console.log('=== AUTOMATIZADOR DE CORRECAO DE BADGES v2 ===');
  console.log(DRY_RUN ? '[MODO DRY-RUN]\n' : '[MODO REAL]\n');
  if (ONLY) console.log(`[FILTRO: apenas ${ONLY}]\n`);

  console.log('Escaneando arquivos HTML...');
  const allFiles = walkDir(ROOT_DIR);
  console.log(`   ${allFiles.length} arquivos encontrados\n`);

  let fixed = 0, alreadyOk = 0, skipped = 0, errors = 0;

  for (const filePath of allFiles) {
    const relPath = path.relative(ROOT_DIR, filePath);
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      if (!content.includes('atualizarCardIndividual') || !content.includes('bar.style.backgroundColor')) {
        skipped++;
        continue;
      }

      if (/badge\.style\.background/.test(content)) {
        alreadyOk++;
        continue;
      }

      const newContent = fixBadgeColors(content);
      if (newContent === null || newContent === content) {
        skipped++;
        if (VERBOSE) console.log(`   ? ${relPath} - padrao nao reconhecido`);
        continue;
      }

      if (!DRY_RUN) {
        fs.writeFileSync(filePath, newContent, 'utf8');
      }
      console.log(`   OK ${relPath} - Corrigido${DRY_RUN ? ' (dry-run)' : ''}`);
      fixed++;
    } catch (err) {
      console.log(`   ERRO ${relPath} - ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== RESUMO ===`);
  console.log(`   Corrigidos:  ${fixed}`);
  console.log(`   Ja OK:       ${alreadyOk}`);
  console.log(`   Nao aplica:  ${skipped}`);
  console.log(`   Erros:       ${errors}`);

  if (DRY_RUN) {
    console.log('\nMODO DRY-RUN - Execute sem --dry-run para aplicar.');
  }
}

main();
