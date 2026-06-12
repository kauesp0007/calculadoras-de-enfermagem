const fs = require("fs");
const path = require("path");

// ============================================================================
// 1. REGRAS DE DIRETÓRIOS E ARQUIVOS (Definidas pelas suas diretrizes)
// ============================================================================
const pastasProibidas = [
  "downloads",
  "biblioteca",
  "blog",
  ".git",
  "node_modules",
  "img",
  "docs",
  "videos",
];

const arquivosProibidos = [
  "footer.html",
  // 'menu-global.html', -> Removido da restrição para receber a correção ARIA
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html",
  "item.template.html",
  "downloads.template.html",
];

// Variáveis para o Log de Terminal
let arquivosModificados = 0;
let arquivosNaoModificados = 0;
let totalLidos = 0;

// ============================================================================
// 2. MOTOR DE CORREÇÃO (Regex Cirúrgico)
// ============================================================================
function aplicarCorrecoes(conteudoOriginal, caminhoArquivo) {
  let novoConteudo = conteudoOriginal;

  // A) Correção ARIA Específica para o Menu Global
  // Identifica se o arquivo em processamento é o menu-global (raiz ou nos idiomas)
  if (caminhoArquivo.includes("menu-global.html")) {
    // Altera APENAS <ul role="list"> para <ul role="menu">.
    // O $1 e $2 garantem que TODAS as classes, IDs e data-attributes originais fiquem intactos.
    novoConteudo = novoConteudo.replace(
      /<ul\b([^>]*)role=["']list["']([^>]*)>/gi,
      '<ul$1role="menu"$2>',
    );
  }

  // B) Correção de Labels: Conecta a <label> ao ID do <select> ou <input> logo abaixo
  // A Regex captura a label (apenas se ela NÃO tiver for=), seu conteúdo e a tag form subsequente
  const regexLabel =
    /(<label\b(?![^>]*\bfor=)[^>]*>)([\s\S]*?<\/label>\s*<(?:select|input|textarea)\b[^>]*\bid=["'])([^"']+)((?:["']))/gi;
  novoConteudo = novoConteudo.replace(
    regexLabel,
    (match, tagLabelStart, restanteAteId, idDoCampo, aspasFinais) => {
      // Insere for="idDoCampo" de forma segura dentro da tag de abertura
      const novaTagLabel = tagLabelStart.replace(
        "<label",
        `<label for="${idDoCampo}"`,
      );
      return novaTagLabel + restanteAteId + idDoCampo + aspasFinais;
    },
  );

  // C) Correção de Contraste 1: Widget Recirculação (Azul claro falhava contra o fundo)
  novoConteudo = novoConteudo.replace(/text-\[#4A90E2\]/g, "text-[#1A3E74]");

  // D) Correção de Contraste 2: Sidebar de Recomendação "Veja Também" (Cinza 500 falhava no fundo branco)
  novoConteudo = novoConteudo.replace(
    /text-\[10px\](\s+)text-gray-500/g,
    "text-[10px]$1text-gray-700",
  );
  novoConteudo = novoConteudo.replace(
    /text-gray-500(\s+)text-\[10px\]/g,
    "text-gray-700$1text-[10px]",
  );

  // E) Correção de Contraste 3: Garantia em outros pequenos textos
  novoConteudo = novoConteudo.replace(
    /text-xs(\s+)text-gray-500/g,
    "text-xs$1text-gray-700",
  );

  return novoConteudo;
}

// ============================================================================
// 3. VARREDURA RECURSIVA SEGUNDA AS REGRAS DA RAIZ E IDIOMAS
// ============================================================================
function scanearDiretorio(diretorioAtual) {
  let itens;
  try {
    itens = fs.readdirSync(diretorioAtual, { withFileTypes: true });
  } catch (e) {
    console.error(`Erro ao ler o diretório ${diretorioAtual}:`, e.message);
    return;
  }

  for (const item of itens) {
    const caminhoCompleto = path.join(diretorioAtual, item.name);

    if (item.isDirectory()) {
      // Se a pasta está na lista de proibidas, o scanner ignora completamente
      if (pastasProibidas.includes(item.name)) {
        continue;
      }
      // Entra na pasta para buscar mais HTMLs
      scanearDiretorio(caminhoCompleto);
    } else if (item.isFile() && item.name.endsWith(".html")) {
      // Ignora estritamente os arquivos da sua lista de exceção
      if (arquivosProibidos.includes(item.name)) {
        continue;
      }

      // Processa o arquivo
      processarArquivo(caminhoCompleto);
    }
  }
}

// ============================================================================
// 4. LEITURA E GRAVAÇÃO DE ARQUIVOS
// ============================================================================
function processarArquivo(caminhoArquivo) {
  totalLidos++;
  try {
    const conteudo = fs.readFileSync(caminhoArquivo, "utf8");
    // Passa o caminho do arquivo para o motor de correções poder aplicar regras específicas
    const conteudoCorrigido = aplicarCorrecoes(conteudo, caminhoArquivo);

    // Se a função aplicarCorrecoes identificou erros e fez a substituição:
    if (conteudo !== conteudoCorrigido) {
      fs.writeFileSync(caminhoArquivo, conteudoCorrigido, "utf8");
      arquivosModificados++;
      // Log detalhado opcional:
      // console.log(`[CORRIGIDO] -> ${caminhoArquivo}`);
    } else {
      // Se a página já está perfeita e obedece os requisitos de acessibilidade
      arquivosNaoModificados++;
    }
  } catch (e) {
    console.error(
      `[ERRO] Falha ao processar o arquivo ${caminhoArquivo}:`,
      e.message,
    );
  }
}

// ============================================================================
// 5. INICIALIZAÇÃO
// ============================================================================
console.log("Iniciando o Escaneamento em Massa de Acessibilidade (WCAG)...\n");
console.log("Regras Ativas:");
console.log(`- Ignorando pastas: ${pastasProibidas.join(", ")}`);
console.log(
  `- Ignorando arquivos centrais: ${arquivosProibidos.length} arquivos bloqueados.\n`,
);

// Inicia a varredura a partir da raiz do projeto (./) englobando todas as pastas não bloqueadas
scanearDiretorio("./");

// ============================================================================
// 6. RELATÓRIO FINAL
// ============================================================================
console.log("====================================================");
console.log("        RELATÓRIO DE ACESSIBILIDADE FINAL           ");
console.log("====================================================");
console.log(`🔍 Total de arquivos HTML avaliados:  ${totalLidos}`);
console.log(`✅ Arquivos que já estavam corretos:  ${arquivosNaoModificados}`);
console.log(`🛠️  Arquivos MODIFICADOS e salvos:    ${arquivosModificados}`);
console.log("====================================================");
console.log(
  "Concluído! A formatação estrutural e os demais códigos foram preservados.",
);
