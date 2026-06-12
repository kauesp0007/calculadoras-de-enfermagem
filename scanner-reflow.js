const fs = require("fs");
const path = require("path");

// ============================================================================
// 1. REGRAS DE DIRETÓRIOS (Proteção da Arquitetura)
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

// Listas para o Relatório Final
const arquivosModificados = [];
const arquivosIgnorados = [];

// ============================================================================
// 2. MOTOR DE CORREÇÃO (Regex Dinâmico Avançado)
// ============================================================================
function aplicarCorrecoesReflow(conteudoOriginal) {
  let novoConteudo = conteudoOriginal;

  /**
   * PROBLEMA 1: RESIZE (Layout Thrashing)
   * Procura estritamente o bloco: window.innerWidth > 1024 ... display = "flex"
   * O Regex captura os nomes exatos das variáveis (\1, \2, \3) para não quebrar
   * o código caso o minificador tenha mudado os nomes nos arquivos de idiomas.
   */
  const resizeRegex =
    /function\s+([a-zA-Z0-9_]+)\(\)\s*\{\s*if\s*\(\s*window\.innerWidth\s*>\s*1024\s*\)\s*\{\s*const\s+([a-zA-Z0-9_]+)\s*=\s*document\.getElementById\("barraAcessibilidade"\);\s*\2\s*&&\s*\(\2\.style\.display\s*=\s*"flex"\);\s*const\s+([a-zA-Z0-9_]+)\s*=\s*document\.querySelector\("nav\.desktop-nav"\);\s*\3\s*&&\s*\(\3\.style\.display\s*=\s*"flex"\)\s*\}\s*\}\s*\1\(\),\s*window\.addEventListener\("resize",\s*\1\);/g;

  const resizeOtimizado = `let _resizeTimer;
  function _checkResize() {
    const _w = window.innerWidth;
    if (_w > 1024) {
      window.requestAnimationFrame(() => {
        const _b = document.getElementById("barraAcessibilidade");
        _b && (_b.style.display = "flex");
        const _n = document.querySelector("nav.desktop-nav");
        _n && (_n.style.display = "flex");
      });
    }
  }
  _checkResize();
  window.addEventListener("resize", () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(_checkResize, 100);
  });`;

  novoConteudo = novoConteudo.replace(resizeRegex, resizeOtimizado);

  /**
   * PROBLEMA 2: SCROLL (Leitura e Escrita Sincronizada Incorreta)
   * Separa a leitura do window.scrollY para FORA do requestAnimationFrame
   * criando uma trava (ticking) de performance.
   */
  const scrollRegex =
    /const\s+([a-zA-Z0-9_]+)\s*=\s*document\.getElementById\("backToTopBtn"\);\s*\1\s*&&\s*\(window\.addEventListener\("scroll",\s*\(\)\s*=>\s*\{\s*window\.requestAnimationFrame\(\(\)\s*=>\s*\{\s*\1\.style\.display\s*=\s*window\.scrollY\s*>\s*200\s*\?\s*"block"\s*:\s*"none";?\s*\}\);\s*\}\s*,\s*\{\s*passive:\s*true\s*\}\s*\),\s*\1\.addEventListener\("click",\s*\(\)\s*=>\s*window\.scrollTo\(\{\s*top:\s*0,\s*behavior:\s*"smooth"\s*\}\)\)\);/g;

  const scrollOtimizado = `const zTop = document.getElementById("backToTopBtn");
  if (zTop) {
    let _ticking = false;
    window.addEventListener("scroll", () => {
      const _lastScrollY = window.scrollY; // LEITURA ISOLADA
      if (!_ticking) {
        window.requestAnimationFrame(() => {
          zTop.style.display = _lastScrollY > 200 ? "block" : "none"; // ESCRITA NO QUADRO
          _ticking = false;
        });
        _ticking = true;
      }
    }, { passive: true });
    zTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }`;

  novoConteudo = novoConteudo.replace(scrollRegex, scrollOtimizado);

  return novoConteudo;
}

// ============================================================================
// 3. VARREDURA DE DIRETÓRIOS E IDIOMAS
// ============================================================================
function scanearDiretorio(diretorioAtual) {
  let itens;
  try {
    itens = fs.readdirSync(diretorioAtual, { withFileTypes: true });
  } catch (e) {
    console.error(`Erro ao ler diretório ${diretorioAtual}:`, e.message);
    return;
  }

  for (const item of itens) {
    const caminhoCompleto = path.join(diretorioAtual, item.name);

    if (item.isDirectory()) {
      if (pastasProibidas.includes(item.name)) continue;
      scanearDiretorio(caminhoCompleto);
    } else if (item.isFile()) {
      // Foco 100% EXCLUSIVO nos arquivos com o nome exato "global-scripts.js"
      if (item.name === "global-scripts.js") {
        processarGlobalScript(caminhoCompleto);
      }
    }
  }
}

// ============================================================================
// 4. PROCESSAMENTO CIRÚRGICO
// ============================================================================
function processarGlobalScript(caminhoArquivo) {
  try {
    const conteudo = fs.readFileSync(caminhoArquivo, "utf8");
    const conteudoCorrigido = aplicarCorrecoesReflow(conteudo);

    if (conteudo !== conteudoCorrigido) {
      fs.writeFileSync(caminhoArquivo, conteudoCorrigido, "utf8");
      arquivosModificados.push(caminhoArquivo);
    } else {
      // Se o regex não encontrou falhas, significa que já está otimizado ou diferente
      arquivosIgnorados.push(caminhoArquivo);
    }
  } catch (e) {
    console.error(
      `[ERRO] Falha ao processar o JS: ${caminhoArquivo}:`,
      e.message,
    );
  }
}

// ============================================================================
// 5. START DO SCRIPT
// ============================================================================
console.log("Iniciando cirurgia de performance (PageSpeed Reflow)...");
console.log("Alvo Exclusivo: global-scripts.js");
console.log("Ignorando URLs, caminhos de idiomas e funções base.");

scanearDiretorio("./");

// ============================================================================
// 6. RELATÓRIO DO TERMINAL
// ============================================================================
console.log("\n====================================================");
console.log("   RELATÓRIO DE PERFORMANCE: GLOBAL-SCRIPTS.JS      ");
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
console.log("Finalizado! Layout Thrashing resolvido. Caminhos intactos.");
