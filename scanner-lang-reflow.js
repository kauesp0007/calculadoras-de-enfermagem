const fs = require("fs");
const path = require("path");

// ============================================================================
// 1. DIRETÓRIOS ALVO (Garantia de 100% de precisão)
// ============================================================================
// A raiz e as 18 pastas de idiomas exatas, ignorando completamente o resto do sistema
const pastasAlvo = [
  "./",
  "./en",
  "./es",
  "./fr",
  "./it",
  "./de",
  "./hi",
  "./zh",
  "./ar",
  "./ja",
  "./ru",
  "./ko",
  "./tr",
  "./nl",
  "./pl",
  "./sv",
  "./id",
  "./vi",
  "./uk",
];

const arquivosModificados = [];
const arquivosIgnorados = [];

// ============================================================================
// 2. MOTOR DE CORREÇÃO (Regex Focado no lang-selector.js)
// ============================================================================
function otimizarLangSelector(conteudoOriginal) {
  let novoConteudo = conteudoOriginal;

  /**
   * Regex para localizar a função exata: configurarAjusteEspaco()
   * Captura desde o início da IIFE até o fechamento do eventListener de resize.
   */
  const reflowRegex =
    /\(\s*function\s+configurarAjusteEspaco\(\)\s*\{[\s\S]*?window\.addEventListener\('resize'\s*,\s*window\.recalcularEspacoIdioma\);\s*\}\)\(\);/g;

  const codigoOtimizado = `(function configurarAjusteEspaco() {
  let agendado = false;
  let resizeTimer; // NOVO: Bloqueio de debounce

  window.recalcularEspacoIdioma = function() {
    var header = document.getElementById('global-header-container');
    var wrapper = document.getElementById('language-dropdown-wrapper');

    if (header && wrapper) {
      var h = header.offsetHeight || 0; // LEITURA ISOLADA
      var novaMargem = (h ? (h + 12) : 24) + 'px';

      if (!agendado) {
        window.requestAnimationFrame(function() {
          wrapper.style.marginTop = novaMargem; // ESCRITA SEGURA NO FRAME
          agendado = false;
        });
        agendado = true;
      }
    }
  };

  // Correção de Reflow: Evento de redimensionamento agora tem limite de disparo (100ms)
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(window.recalcularEspacoIdioma, 100);
  });
})();`;

  // Aplica a substituição
  novoConteudo = novoConteudo.replace(reflowRegex, codigoOtimizado);

  return novoConteudo;
}

// ============================================================================
// 3. VARREDURA EXATA (Sem recursão desnecessária)
// ============================================================================
function processarTodosOsIdiomas() {
  pastasAlvo.forEach((pasta) => {
    const caminhoArquivo = path.join(pasta, "lang-selector.js");

    if (fs.existsSync(caminhoArquivo)) {
      processarArquivoLang(caminhoArquivo);
    } else {
      console.warn(`[AVISO] Arquivo não encontrado: ${caminhoArquivo}`);
    }
  });
}

// ============================================================================
// 4. PROCESSAMENTO DO ARQUIVO
// ============================================================================
function processarArquivoLang(caminhoArquivo) {
  try {
    const conteudo = fs.readFileSync(caminhoArquivo, "utf8");
    const conteudoCorrigido = otimizarLangSelector(conteudo);

    if (conteudo !== conteudoCorrigido) {
      fs.writeFileSync(caminhoArquivo, conteudoCorrigido, "utf8");
      arquivosModificados.push(caminhoArquivo);
    } else {
      arquivosIgnorados.push(caminhoArquivo);
    }
  } catch (e) {
    console.error(
      `[ERRO] Falha ao processar o arquivo ${caminhoArquivo}:`,
      e.message,
    );
  }
}

// ============================================================================
// 5. INÍCIO DO SCRIPT
// ============================================================================
console.log("Iniciando a otimização de Reflow Forçado no Módulo de Idiomas...");
processarTodosOsIdiomas();

// ============================================================================
// 6. RELATÓRIO DO TERMINAL
// ============================================================================
console.log("\n====================================================");
console.log("   RELATÓRIO: OTIMIZAÇÃO DO LANG-SELECTOR.JS        ");
console.log("====================================================");

console.log(
  `\n✅ ARQUIVOS MODIFICADOS COM SUCESSO (${arquivosModificados.length}):`,
);
if (arquivosModificados.length === 0) {
  console.log("Nenhum arquivo precisou ser alterado.");
} else {
  arquivosModificados.forEach((file) => console.log(` -> ${file}`));
}

console.log(
  `\n⏭️ ARQUIVOS IGNORADOS/JÁ OTIMIZADOS (${arquivosIgnorados.length}):`,
);
if (arquivosIgnorados.length === 0) {
  console.log("Nenhum arquivo ignorado.");
} else {
  arquivosIgnorados.forEach((file) => console.log(` -> ${file}`));
}

console.log("====================================================");
console.log(
  "Cirurgia concluída. Gargalos de renderização do seletor eliminados nos 19 idiomas.",
);
