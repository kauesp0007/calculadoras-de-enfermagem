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
// 2. MOTOR DE CORREÇÃO (Quebrando a Cadeia Crítica do Footer)
// ============================================================================
function otimizarRodapeChain(conteudoOriginal) {
  // PADRÃO 1: Raiz (PT-BR) -> Usa fetch("/footer.html") e chama carregarTraducoes
  const regexFooterPT =
    /<script>\s*fetch\(['"]\/footer\.html['"]\)[\s\S]*?carregarTraducoes\(['"]([a-z]{2,3})['"]\s*,\s*['"]footer\.json['"]\)[\s\S]*?<\/script>/gi;

  // PADRÃO 2: Idiomas (18 Pastas) -> Usa fetch("footer.html") e NÃO chama traduções
  const regexFooterIdiomas =
    /<script>\s*fetch\(['"]footer\.html['"]\)\s*\.then\(\(response\)\s*=>\s*response\.text\(\)\)\s*\.then\(\(data\)\s*=>\s*\{\s*document\.getElementById\(['"]footer-placeholder['"]\)\.innerHTML\s*=\s*data;\s*\}\);\s*<\/script>/gi;

  let novoConteudo = conteudoOriginal;

  // Aplica otimização para a Raiz (PT-BR)
  novoConteudo = novoConteudo.replace(regexFooterPT, (match, idioma) => {
    if (match.includes("DOMContentLoaded")) return match;

    return `<script>
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      fetch("/footer.html")
        .then(response => response.text())
        .then((data) => {
          document.getElementById("footer-placeholder").innerHTML = data;
          carregarTraducoes('${idioma}', 'footer.json');
          carregarTraducoes('${idioma}', 'cookies.json');
        });
    }, 150);
  });
</script>`;
  });

  // Aplica otimização para as Pastas de Idiomas
  novoConteudo = novoConteudo.replace(regexFooterIdiomas, (match) => {
    if (match.includes("DOMContentLoaded")) return match;

    return `<script>
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      fetch("footer.html")
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("footer-placeholder").innerHTML = data;
        });
    }, 150);
  });
</script>`;
  });

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
    const conteudoCorrigido = otimizarRodapeChain(conteudo);

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
console.log("Iniciando Otimização da Cadeia de Solicitações do Rodapé...");
scanearDiretorio("./");

// ============================================================================
// 6. RELATÓRIO FINAL
// ============================================================================
console.log("\n====================================================");
console.log("    RELATÓRIO: QUEBRA DA CADEIA CRÍTICA (FOOTER)    ");
console.log("====================================================");
console.log(`🔍 Total de arquivos HTML avaliados:  ${totalLidos}`);
console.log(`✅ Arquivos que já estavam corretos:  ${arquivosNaoModificados}`);
console.log(`🛠️  Arquivos MODIFICADOS e salvos:    ${arquivosModificados}`);
console.log("====================================================");
console.log(
  "Cirurgia concluída. O rodapé e as traduções não bloquearão mais a renderização.",
);
