const fs = require('fs');
const path = require('path');

// 1. Definição do bloco de código exato a ser inserido
const blocoCodigoGA4 = `
/* =========================
   GA4 — Evento: clique no botão Calcular
   ========================= */
(function () {
  // 1) Verifica se pode enviar analytics (respeita consentimento, se você usar)
  function podeEnviarAnalytics() {
    try {
      const a = localStorage.getItem("analytics_storage");
      return a !== "denied"; // se estiver denied, não envia
    } catch (_) {
      return true; // se não conseguir ler, permite
    }
  }

  // 2) Envia o evento ao GA4
  function enviarEventoGA(nomeEvento, parametros) {
    if (typeof window.gtag === "function") {
      window.gtag("event", nomeEvento, parametros);
    }
  }

  // 3) “Escuta” qualquer clique no site inteiro
  document.addEventListener("click", function (event) {
    // pega o elemento clicado e procura o botão mais próximo
    const botao = event.target.closest("button");
    if (!botao) return;

    // regra: só dispara se for o botão Calcular padrão
    if (botao.id !== "btnCalcular") return;

    // respeita consentimento (se existir)
    if (!podeEnviarAnalytics()) return;

    // parâmetros úteis para identificar a página
    const parametros = {
      page_path: window.location.pathname,
      page_title: document.title
    };

    // envia o evento
    enviarEventoGA("calcular_click", parametros);
  });
})();
`;

// 2. Lista de diretórios permitidos (Raiz + 18 idiomas)
// Isso garante que não entraremos em 'downloads', 'biblioteca' ou pastas de sistema.
const diretoriosAlvo = [
    '.', // Raiz
    'en', 'es', 'fr', 'it', 'de', 'hi',
    'zh', 'ar', 'ja', 'ru', 'ko', 'tr',
    'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

const nomeArquivoAlvo = 'global-scripts.js';

// Contadores para o Log
let arquivosModificados = 0;
let arquivosIgnorados = 0; // Caso o arquivo não exista
let arquivosJaAtualizados = 0; // Caso o código já exista para evitar duplicação
let erros = 0;

console.log("=== INICIANDO ATUALIZAÇÃO DOS GLOBAL-SCRIPTS.JS ===");

// 3. Função de processamento
diretoriosAlvo.forEach(dir => {
    const caminhoArquivo = path.join(__dirname, dir, nomeArquivoAlvo);

    // Verifica se o arquivo existe
    if (fs.existsSync(caminhoArquivo)) {
        try {
            // Lê o conteúdo atual
            let conteudoAtual = fs.readFileSync(caminhoArquivo, 'utf8');

            // Verificação de segurança: checa se o código já foi inserido anteriormente
            // Procura por um trecho único do seu código
            if (conteudoAtual.includes('GA4 — Evento: clique no botão Calcular')) {
                console.log(`[!] O código já existe em: ${caminhoArquivo} (Pulado)`);
                arquivosJaAtualizados++;
            } else {
                // Insere o bloco no final, garantindo uma quebra de linha antes
                const novoConteudo = conteudoAtual + "\n" + blocoCodigoGA4;

                // Grava o arquivo sem alterar o resto
                fs.writeFileSync(caminhoArquivo, novoConteudo, 'utf8');
                console.log(`[OK] Código inserido em: ${caminhoArquivo}`);
                arquivosModificados++;
            }

        } catch (err) {
            console.error(`[ERRO] Falha ao processar ${caminhoArquivo}: ${err.message}`);
            erros++;
        }
    } else {
        // Arquivo não encontrado na pasta (pode ser normal se alguma pasta de idioma ainda não tiver o script)
        console.log(`[-] Arquivo não encontrado em: ${dir}/${nomeArquivoAlvo}`);
        arquivosIgnorados++;
    }
});

// 4. Log Final
console.log("\n=== RELATÓRIO FINAL ===");
console.log(`Total de arquivos modificados com sucesso: ${arquivosModificados}`);
console.log(`Total de arquivos já contendo o código (pulados): ${arquivosJaAtualizados}`);
console.log(`Total de arquivos não encontrados: ${arquivosIgnorados}`);
console.log(`Total de erros: ${erros}`);
console.log("=======================");