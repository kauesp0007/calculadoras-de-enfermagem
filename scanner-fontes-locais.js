const fs = require("fs");
const path = require("path");

// ============================================================================
// 1. REGRAS DE DIRETÓRIOS E SEGURANÇA
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
// 2. MOTOR DE CORREÇÃO E INJEÇÃO INTELIGENTE DE FONTES
// ============================================================================
function otimizarFontesLocais(conteudoOriginal) {
  let novoConteudo = conteudoOriginal;

  // A) Trava de segurança: Se a página já foi otimizada, ignora.
  if (novoConteudo.includes("<!-- Fontes Locais")) {
    return novoConteudo;
  }

  // B) REMOÇÃO DO GOOGLE FONTS
  // Remove todos os links (preconnect, preload, stylesheet) apontando para o Google
  novoConteudo = novoConteudo.replace(
    /<link[^>]*href=["']https:\/\/fonts\.(googleapis|gstatic)\.com[^>]*>\s*/gi,
    "",
  );

  // Limpeza: Se sobrou um <noscript> vazio por conta da remoção acima, apaga ele também
  novoConteudo = novoConteudo.replace(/<noscript>\s*<\/noscript>\s*/gi, "");

  // C) IDENTIFICAÇÃO DO IDIOMA DA PÁGINA
  const matchIdioma = novoConteudo.match(/<html[^>]*lang=["']([^"']+)["']/i);
  const idiomaReal = matchIdioma ? matchIdioma[1].toLowerCase() : "pt-br";

  // Pegar apenas os 2 primeiros caracteres para facilitar (ex: 'pt-br' -> 'pt', 'es-es' -> 'es')
  const lang = idiomaReal.substring(0, 2);

  // D) DEFINIÇÃO DO PRELOAD POR IDIOMA
  let blocosPreload = "";

  if (lang === "ar") {
    blocosPreload = `<!-- Fontes Locais (Alta Prioridade) -->
  <link rel="preload" href="/fonts/arabic/arabic-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/arabic/arabic-700.woff2" as="font" type="font/woff2" crossorigin>`;
  } else if (lang === "hi") {
    blocosPreload = `<!-- Fontes Locais (Alta Prioridade) -->
  <link rel="preload" href="/fonts/devanagari/devanagari-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/devanagari/devanagari-700.woff2" as="font" type="font/woff2" crossorigin>`;
  } else if (lang === "zh") {
    blocosPreload = `<!-- Fontes Locais (Alta Prioridade) -->
  <link rel="preload" href="/fonts/chinese/chinese-regular.woff2" as="font" type="font/woff2" crossorigin>`;
  } else if (lang === "ja") {
    blocosPreload = `<!-- Fontes Locais (Alta Prioridade) -->
  <link rel="preload" href="/fonts/japanese/japanese-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/japanese/japanese-700.woff2" as="font" type="font/woff2" crossorigin>`;
  } else if (lang === "ko") {
    blocosPreload = `<!-- Fontes Locais (Alta Prioridade) -->
  <link rel="preload" href="/fonts/korean/korean-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/korean/korean-700.woff2" as="font" type="font/woff2" crossorigin>`;
  } else {
    // Padrão para PT, EN, ES, FR, IT, DE, etc. (Inclui Inter e Nunito)
    blocosPreload = `<!-- Fontes Locais (Alta Prioridade) -->
  <link rel="preload" href="/fonts/inter/inter-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/inter/inter-700.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/nunito/nunito-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/nunito/nunito-700.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/nunito/nunito-900.woff2" as="font" type="font/woff2" crossorigin>`;
  }

  // E) INJEÇÃO CIRÚRGICA
  // Procura a linha onde o global-styles.css é chamado e injeta os preloads locais logo acima dele
  const regexGlobalStyles =
    /(<link[^>]*href=["']\/global-styles\.css["'][^>]*>)/i;
  novoConteudo = novoConteudo.replace(
    regexGlobalStyles,
    `${blocosPreload}\n  $1`,
  );

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
    const conteudoCorrigido = otimizarFontesLocais(conteudo);

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
console.log(
  "Iniciando Otimização de Fontes (Remoção do Google Fonts e Injeção Local)...",
);
scanearDiretorio("./");

// ============================================================================
// 6. RELATÓRIO FINAL
// ============================================================================
console.log("\n====================================================");
console.log("      RELATÓRIO: OTIMIZAÇÃO DE FONTES LOCAIS        ");
console.log("====================================================");
console.log(`🔍 Total de arquivos HTML avaliados:  ${totalLidos}`);
console.log(`✅ Arquivos que já estavam corretos:  ${arquivosNaoModificados}`);
console.log(`🛠️  Arquivos MODIFICADOS e salvos:    ${arquivosModificados}`);
console.log("====================================================");
console.log(
  "Cirurgia concluída. Fontes agora carregam diretamente do seu repositório.",
);
