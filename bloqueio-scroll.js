const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO ---

// Lista estrita de arquivos a serem processados
const targetFiles = [
    'gasometria.html',
    'gotejamento.html',
    'balancohidrico.html',
    'insulina.html',
    'heparina.html',
    'dimensionamento.html',
    'imc.html',
    'medicamentos.html'
];

// Lista de idiomas do site
const languages = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// O bloco de código exato a ser inserido
const codeToInsert = `
      /* * BLOQUEIO DE SCROLL NOS INPUTS NUMÉRICOS
       * Evita alteração acidental de valores ao rolar a página com o mouse sobre o input.
       */
      document.querySelectorAll('input[type=number]').forEach(input => {
        input.addEventListener('wheel', function(e) {
          // Impede o comportamento padrão (alterar número)
          e.preventDefault();
          // Remove o foco do input para garantir que o scroll continue na página
          this.blur();
        });
      });`;

// Marcador para identificar se o código já existe no arquivo
const markerToCheck = "BLOQUEIO DE SCROLL NOS INPUTS NUMÉRICOS";

// --- ESTATÍSTICAS ---
const stats = {
    modified: [],
    skipped: [],
    notFound: [],
    errors: []
};

// --- FUNÇÃO DE PROCESSAMENTO ---

function processFile(filePath) {
    try {
        // Verifica se arquivo existe
        if (!fs.existsSync(filePath)) {
            stats.notFound.push(filePath);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');

        // 1. Verifica se já possui a funcionalidade
        if (content.includes(markerToCheck)) {
            stats.skipped.push(filePath);
            return;
        }

        let newContent = content;
        let injected = false;

        // 2. Estratégia de Inserção: Dentro de um DOMContentLoaded existente
        // Procura por variações comuns de declaração
        const domPatterns = [
            'document.addEventListener("DOMContentLoaded", () => {',
            "document.addEventListener('DOMContentLoaded', () => {",
            'document.addEventListener("DOMContentLoaded", function() {',
            'document.addEventListener("DOMContentLoaded", function () {',
            'window.addEventListener("DOMContentLoaded", () => {'
        ];

        for (const pattern of domPatterns) {
            if (content.includes(pattern)) {
                // Inserir logo após a abertura da função
                // replace substitui apenas a primeira ocorrência, o que é ideal aqui (script principal)
                newContent = content.replace(pattern, `${pattern}\n${codeToInsert}`);
                injected = true;
                break;
            }
        }

        // 3. Estratégia de Fallback: Criar novo script antes do </body>
        if (!injected) {
            const scriptTag = `
  <script>
    document.addEventListener("DOMContentLoaded", function() {
${codeToInsert}
    });
  </script>
`;
            if (content.includes('</body>')) {
                newContent = content.replace('</body>', `${scriptTag}</body>`);
                injected = true;
            } else {
                throw new Error("Arquivo sem tag </body> ou estrutura compatível.");
            }
        }

        // 4. Salvar Alterações
        if (injected) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            stats.modified.push(filePath);
        }

    } catch (err) {
        stats.errors.push(`${filePath} - ${err.message}`);
    }
}

// --- EXECUÇÃO ---

console.log("Iniciando varredura para implementação do Bloqueio de Scroll...");

// 1. Varrer Raiz
targetFiles.forEach(file => {
    processFile(path.join('.', file));
});

// 2. Varrer Pastas de Idiomas
languages.forEach(lang => {
    const langDir = path.join('.', lang);
    // Verifica se a pasta do idioma existe antes de tentar acessar
    if (fs.existsSync(langDir)) {
        targetFiles.forEach(file => {
            processFile(path.join(langDir, file));
        });
    }
});

// --- RELATÓRIO FINAL ---

console.log("\n================ LOG DE EXECUÇÃO ================");
console.log(`Arquivos Modificados: ${stats.modified.length}`);
if (stats.modified.length > 0) {
    // Listar alguns exemplos se houver muitos, ou todos se forem poucos
    stats.modified.forEach(f => console.log(`  [OK] ${f}`));
}

console.log(`\nArquivos Pulados (Já possuem a função): ${stats.skipped.length}`);
if (stats.skipped.length > 0) {
    stats.skipped.forEach(f => console.log(`  [--] ${f}`));
}

console.log(`\nArquivos Não Encontrados: ${stats.notFound.length}`);
// Descomente a linha abaixo se quiser ver quais não foram encontrados
// stats.notFound.forEach(f => console.log(`  [NF] ${f}`));

console.log(`\nErros: ${stats.errors.length}`);
stats.errors.forEach(e => console.log(`  [ERRO] ${e}`));
console.log("=================================================");