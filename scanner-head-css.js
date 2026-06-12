const fs = require("fs");
const path = require("path");

// ============================================================================
// 1. REGRAS DE DIRETÓRIOS E ARQUIVOS (Segurança Arquitetural)
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
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
  "menu-lateral.html",
  "_language_selector.html",
  "googlefc0a17cdd552164b.html",
  "item.template.html",
  "downloads.template.html",
];

let arquivosModificados = 0;
let arquivosNaoModificados = 0;
let totalLidos = 0;

// ============================================================================
// 2. MOTOR DE CORREÇÃO (Regex Inteligente para o <head>)
// ============================================================================
function padronizarHeadCSS(conteudoOriginal) {
  let novoConteudo = conteudoOriginal;

  // A) CORREÇÃO DO FONTAWESOME: Localiza link rel="stylesheet" síncrono e transforma em Assíncrono
  // Só substitui se NÃO tiver a palavra "onload" (ou seja, protege as páginas já otimizadas)
  const regexFASincrono =
    /<link(?![^>]*onload)[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*font-awesome[^"']*)["'][^>]*>/gi;
  novoConteudo = novoConteudo.replace(regexFASincrono, (match, url) => {
    return `<link rel="preload" href="${url}" as="style" onload="this.onload=null;this.rel='stylesheet'">\n  <noscript><link rel="stylesheet" href="${url}"></noscript>`;
  });

  // O mesmo Regex invertido (caso o href venha antes do rel)
  const regexFASincronoInvertido =
    /<link(?![^>]*onload)[^>]*href=["']([^"']*font-awesome[^"']*)["'][^>]*rel=["']stylesheet["'][^>]*>/gi;
  novoConteudo = novoConteudo.replace(
    regexFASincronoInvertido,
    (match, url) => {
      return `<link rel="preload" href="${url}" as="style" onload="this.onload=null;this.rel='stylesheet'">\n  <noscript><link rel="stylesheet" href="${url}"></noscript>`;
    },
  );

  // B) CORREÇÃO DO GOOGLE FONTS: Garante display=swap e carregamento assíncrono
  const regexGoogleFonts =
    /<link(?![^>]*onload)[^>]*href=["'](https:\/\/fonts\.googleapis\.com\/css2\?[^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi;
  novoConteudo = novoConteudo.replace(regexGoogleFonts, (match, url) => {
    // Remove os optionals estranhos e adiciona swap
    let urlLimpa = url
      .replace(/&amp;display=optional/g, "")
      .replace(/&display=optional/g, "");
    if (!urlLimpa.includes("display=swap")) {
      urlLimpa += "&display=swap";
    }
    return `<link rel="preload" href="${urlLimpa}" as="style" onload="this.onload=null;this.rel='stylesheet'">\n  <noscript><link rel="stylesheet" href="${urlLimpa}"></noscript>`;
  });

  // C) PRELOAD DE CSS CRÍTICO (Tailwind e Global)
  // Se a página importa o output.css sem preload, nós injetamos o aviso de alta prioridade ANTES dele
  if (
    novoConteudo.includes('href="/public/output.css"') &&
    !novoConteudo.includes('rel="preload" href="/public/output.css"')
  ) {
    novoConteudo = novoConteudo.replace(
      /<link\s+href=["']\/public\/output\.css["']\s+rel=["']stylesheet["']\s*\/?>/i,
      `<link rel="preload" href="/public/output.css" as="style">\n  <link href="/public/output.css" rel="stylesheet">`,
    );
  }

  if (
    novoConteudo.includes('href="/global-styles.css"') &&
    !novoConteudo.includes('rel="preload" href="/global-styles.css"')
  ) {
    novoConteudo = novoConteudo.replace(
      /<link\s+rel=["']stylesheet["']\s+href=["']\/global-styles\.css["']\s*\/?>/i,
      `<link rel="preload" href="/global-styles.css" as="style">\n  <link rel="stylesheet" href="/global-styles.css">`,
    );
  }

  return novoConteudo;
}

// ============================================================================
// 3. VARREDURA RECURSIVA (Raiz e Idiomas)
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
      if (pastasProibidas.includes(item.name)) continue;
      scanearDiretorio(caminhoCompleto);
    } else if (item.isFile() && item.name.endsWith(".html")) {
      if (arquivosProibidos.includes(item.name)) continue;
      processarArquivoHtml(caminhoCompleto);
    }
  }
}

// ============================================================================
// 4. PROCESSAMENTO DO ARQUIVO
// ============================================================================
function processarArquivoHtml(caminhoArquivo) {
  totalLidos++;
  try {
    const conteudo = fs.readFileSync(caminhoArquivo, "utf8");
    const conteudoCorrigido = padronizarHeadCSS(conteudo);

    if (conteudo !== conteudoCorrigido) {
      fs.writeFileSync(caminhoArquivo, conteudoCorrigido, "utf8");
      arquivosModificados++;
    } else {
      arquivosNaoModificados++;
    }
  } catch (e) {
    console.error(`[ERRO] Falha ao processar ${caminhoArquivo}:`, e.message);
  }
}

// ============================================================================
// 5. INICIALIZAÇÃO
// ============================================================================
console.log("Iniciando Otimização de Caminho Crítico (LCP/Render-Blocking)...");
scanearDiretorio("./");

// ============================================================================
// 6. RELATÓRIO FINAL
// ============================================================================
console.log("\n====================================================");
console.log("      RELATÓRIO DE OTIMIZAÇÃO DE RENDERIZAÇÃO       ");
console.log("====================================================");
console.log(`🔍 Total de arquivos HTML avaliados:  ${totalLidos}`);
console.log(`✅ Arquivos que já estavam corretos:  ${arquivosNaoModificados}`);
console.log(`🛠️  Arquivos MODIFICADOS e salvos:    ${arquivosModificados}`);
console.log("====================================================");
console.log("Cirurgia concluída. Bloqueios de renderização eliminados.");
