const fs = require("fs");
const path = require("path");

// =============================================================================
// PAINEL DE CONTROLE - REGRAS DE AUTOMAÇÃO
// =============================================================================

// 1. SUBSTITUIÇÃO SIMPLES (REPLACE)
// Se achar o 'target', substitui a linha toda pela 'newTag', mantendo o recuo.
const REGRA_REPLACE = [
  { target: 'src="global-scripts.js"', newTag: '<script src="/global-scripts.js" defer=""></script>' },
  { target: '/global-scripts.js"', newTag: '<script src="/global-scripts.js" defer=""></script>' }
];

// 2. EXCLUSÃO DE LINHAS (DELETE)
// Se achar a palavra no 'target', a linha inteira é removida do arquivo.
const REGRA_DELETE = [{ target: "" }];

// 3. UNIFICAÇÃO / LIMPEZA DE DUPLICADOS (UNIFY)
// Mantém apenas a primeira ocorrência (transformada na newTag) e apaga as duplicatas.
const REGRA_UNIFY = [{ target1: "", target2: "", newTag: "" }];

// 4. MOVIMENTAÇÃO OU CRIAÇÃO ABAIXO DA ÂNCORA (MOVE / CREATE) DE LINHA ÚNICA
const ANTI_CLS_STYLE = '<style id="anti-cls-placeholders">#global-header-container{display:block;width:100%;min-height:96px;background-color:transparent}@media(max-width:768px){#global-header-container{min-height:60px}}#language-selector-placeholder{display:block;width:100%;min-height:48px;background-color:transparent}#footer-placeholder{display:block;min-height:520px;background-color:transparent}@media(min-width:768px){#footer-placeholder{min-height:277px}}</style>';

const REGRA_MOVE = [
  // Insere o snippet anti-CLS logo após a tag <head> quando ausente
  { moveTarget: "", newTag: ANTI_CLS_STYLE, anchorTarget: "<head" },
];

// =============================================================================
// 5. TRANSFERÊNCIA DE BLOCO INTEIRO (RECORTAR E COLAR EM MASSA)
// =============================================================================
// Ideal para mover um bloco de código que já existe na página para um local novo.
// Exemplo: Mover um grupo de metatags do início da <head> para perto do fechamento </head>.

const REGRA_TRANSFERIR_BLOCO = [
  {
    // 1. O BLOCO: Cole o bloco exato que deseja mover. 
    // DICA: O script usa a PRIMEIRA e a ÚLTIMA linha deste texto para encontrar o bloco no HTML.
    // Garanta que essas linhas identificam bem o bloco.
    bloco_exato: `
    <!-- Exemplo de Bloco -->
    <meta name="theme-color" content="#1A3E74" />
    <meta name="description" content="Minha descrição" />`,

    // 2. ÂNCORA: A linha que servirá de referência de aterragem
    ancora: '</head>',

    // 3. POSIÇÃO: 'above' (colar por cima da âncora) ou 'below' (colar por baixo)
    posicao: 'above'
  }
];

// =============================================================================
// CONFIGURAÇÕES DO REPOSITÓRIO (CALCULADORAS DE ENFERMAGEM)
// =============================================================================
const ROOT_DIR = ".";
const LANGUAGES = [
  "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", 
  "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
];
const IGNORE_FOLDERS = [
  "downloads", "biblioteca", "blog", "blog-templates", "node_modules", ".git"
];
const IGNORE_FILES = [
  "footer.html", "menu-global.html", "global-body-elements.html",
  "downloads.html", "menu-lateral.html", "_language_selector.html",
  "googlefc0a17cdd552164b.html"
];

// NOVO: ALVO ESPECÍFICO DE ARQUIVOS
// Se quiser processar APENAS arquivos com um nome específico nas 18 pastas, insira-os aqui.
// Exemplo: ["morse.html", "ballard.html"]
// Se deixar vazio [], o script vai avaliar TODOS os arquivos HTML do site.
const TARGET_FILES = []; 

let filesChangedCount = 0;
let filesSkippedCount = 0;

/**
 * Inicia a varredura na raiz e nas pastas de idiomas
 */
function start() {
  console.log("--- Iniciando Processamento Inteligente Multilinhas ---");
  
  if (TARGET_FILES.length > 0) {
      console.log(`🎯 MODO FOCO ATIVO: Avaliando APENAS: ${TARGET_FILES.join(", ")}`);
  }

  processDirectory(ROOT_DIR, false);

  LANGUAGES.forEach((lang) => {
    const langPath = path.join(ROOT_DIR, lang);
    if (fs.existsSync(langPath)) processDirectory(langPath, true);
  });

  console.log("\n==================================================");
  console.log("               RELATÓRIO DE EXECUÇÃO");
  console.log("==================================================");
  console.log(`Arquivos alterados (movimentados): ${filesChangedCount}`);
  console.log(`Arquivos verificados/sem mudança: ${filesSkippedCount}`);
  console.log("==================================================");
}

/**
 * Varre os diretórios buscando apenas arquivos .html
 */
function processDirectory(currentPath, isLangFolder) {
  let items = fs.readdirSync(currentPath);
  items.forEach((item) => {
    const fullPath = path.join(currentPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (IGNORE_FOLDERS.includes(item)) return;
      if (isLangFolder) processDirectory(fullPath, true);
    } else if (path.extname(item) === ".html" && !IGNORE_FILES.includes(item)) {
      
      // NOVA LÓGICA: Pula o arquivo se o modo Foco estiver ativo e ele não for um dos alvos
      if (TARGET_FILES.length > 0 && !TARGET_FILES.includes(item)) {
          return; 
      }
        
      processFile(fullPath);
    }
  });
}

/**
 * Aplica as lógicas de edição ao conteúdo do arquivo
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let lines = content.split("\n");
    
    // PASSO 0: LÓGICA DE TRANSFERÊNCIA DE BLOCO (RECORTAR E COLAR)
    for (const r of REGRA_TRANSFERIR_BLOCO) {
      if (!r.bloco_exato || !r.ancora) continue;

      // Limpa linhas vazias no começo e no fim do bloco colado
      let linhasDoBloco = r.bloco_exato.split('\n');
      while(linhasDoBloco.length > 0 && linhasDoBloco[0].trim() === '') linhasDoBloco.shift();
      while(linhasDoBloco.length > 0 && linhasDoBloco[linhasDoBloco.length-1].trim() === '') linhasDoBloco.pop();

      if (linhasDoBloco.length === 0) continue;

      // Pega as assinaturas das pontas do bloco para caçá-lo
      const primeiraLinhaBloco = linhasDoBloco[0].trim();
      const ultimaLinhaBloco = linhasDoBloco[linhasDoBloco.length - 1].trim();

      // Procura o começo do bloco no ficheiro
      let idxInicio = lines.findIndex(l => l.includes(primeiraLinhaBloco));
      let idxFim = -1;

      if (idxInicio !== -1) {
        // A partir do começo, procura o fim do bloco
        idxFim = lines.findIndex((l, i) => i >= idxInicio && l.includes(ultimaLinhaBloco));
      }

      // Se achou o bloco inteiro
      if (idxInicio !== -1 && idxFim !== -1) {
        // 1. Recorta o bloco do local atual
        const blocoExtraido = lines.splice(idxInicio, (idxFim - idxInicio) + 1);

        // 2. Encontra a âncora destino (no array que agora já não tem o bloco)
        let anchorIdx = lines.findIndex(l => l.includes(r.ancora));

        if (anchorIdx !== -1) {
          const targetIdx = r.posicao === 'above' ? anchorIdx : anchorIdx + 1;
          // 3. Cola o bloco na nova posição
          lines.splice(targetIdx, 0, ...blocoExtraido);
        } else {
          // Se de alguma forma não achou a âncora, devolve o bloco ao sítio original em segurança
          lines.splice(idxInicio, 0, ...blocoExtraido);
        }
      }
    }

    let unificacoesExecutadas = new Set();

    // PASSO 1: UNIFICAR, DELETAR E SUBSTITUIR SIMPLES
    lines = lines
      .map((line) => {
        for (let i = 0; i < REGRA_UNIFY.length; i++) {
          const r = REGRA_UNIFY[i];
          if (!r.target1 || !r.target2) continue;
          if (line.includes(r.target1) || line.includes(r.target2)) {
            if (!unificacoesExecutadas.has(i)) {
              unificacoesExecutadas.add(i);
              const indent = line.match(/^(\s*)/)[0];
              return `${indent}${r.newTag}`;
            } else {
              return null; // Apaga duplicado
            }
          }
        }

        for (const r of REGRA_DELETE) {
          if (r.target && line.includes(r.target)) {
            return null; // Apaga linha
          }
        }

        for (const r of REGRA_REPLACE) {
          if (r.target && line.includes(r.target)) {
            if (line.trim() !== r.newTag.trim()) {
              const indent = line.match(/^(\s*)/)[0];
              return `${indent}${r.newTag}`; // Substitui
            }
          }
        }
        return line;
      })
      .filter((line) => line !== null);

    // PASSO 2: LÓGICA DE MOVER OU CRIAR LINHA ÚNICA (REGRA_MOVE)
    for (const r of REGRA_MOVE) {
      if (r.anchorTarget) {
        let anchorIdx = lines.findIndex((l) => l.includes(r.anchorTarget));

        if (anchorIdx !== -1) {
          if (r.moveTarget) {
            let moveIdx = lines.findIndex((l) => l.includes(r.moveTarget));
            if (moveIdx !== -1 && moveIdx !== anchorIdx + 1) {
              const lineToMove = lines.splice(moveIdx, 1)[0];
              anchorIdx = lines.findIndex((l) => l.includes(r.anchorTarget));
              lines.splice(anchorIdx + 1, 0, lineToMove);
            }
          }
          else if (r.newTag) {
            const jaExiste = lines.some((l) => l.includes(r.newTag.trim()));
            if (!jaExiste) {
              const indent = lines[anchorIdx].match(/^(\s*)/)[0];
              lines.splice(anchorIdx + 1, 0, `${indent}${r.newTag}`);
            }
          }
        }
      }
    }

    // VERIFICAÇÃO INTELIGENTE FINAL
    // Compara o conteúdo original com o resultado final. 
    // Só escreve no disco e conta como "alterado" se houver uma mudança real.
    const newContent = lines.join("\n");
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, "utf8");
      filesChangedCount++;
      console.log(`[MOVIMENTADO/ALTERADO] ${filePath}`);
    } else {
      filesSkippedCount++;
    }

  } catch (err) {
    console.error(`Erro ao processar ${filePath}: ${err.message}`);
  }
}

start();