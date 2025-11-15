// Importa os módulos essenciais do Node.js para lidar com ficheiros e caminhos
const fs = require('fs');
const path = require('path');

// --- Configuração ---
// Pode ajustar isto conforme o seu projeto cresce
const config = {
    // Diretório base do projeto (onde o script vai começar a procurar)
    // '.' significa "o diretório atual"
    baseDir: './', 
    
    // O nosso ficheiro de "molde" (do Passo 1)
    templateFile: 'sw-template.js',
    
    // O nome do ficheiro final que o navegador vai usar
    outputFile: 'sw.js',
    
    // O marcador exato que deixámos no molde (CORRIGIDO)
    marker: "//INJETAR_ARQUIVOS_AQUI",
    
    // Quais extensões de ficheiro queremos salvar no cache?
    // Adicione ou remova extensões conforme as suas necessidades
    extensionsToCache: [
        '.html',
        '.css',
        '.js',
        '.json',
        '.png',
        '.jpg',
        '.jpeg',
        '.svg',
        '.webp',
        '.ico',
        '.woff',
        '.woff2'
    ],
    
    // Quais pastas ou ficheiros devemos IGNORAR?
    // Essencial para não adicionar ficheiros desnecessários ou secretos
    filesAndFoldersToIgnore: [
        'node_modules',       // Pasta gigante de dependências
        '.git',               // Pasta de controlo de versão
        '.github',            // Pasta de workflows
        'gerar-sw.js',        // O PRÓPRIO SCRIPT de automação
        'sw-template.js',     // O nosso "molde"
        'sw.js',              // O resultado antigo (será substituído)
        'tailwind.config.js', // Ficheiro de configuração
        'package.json',
        'package-lock.json',
        '.gitignore',
        'README.md'
    ]
};
// --------------------

/**
 * Função auxiliar que "anda" (walk) por todas as pastas recursivamente
 * e retorna uma lista de todos os ficheiros que encontra.
 */
const walkSync = (dir, filelist = []) => {
    try {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const fileStat = fs.statSync(filePath);

            // Verifica se o ficheiro/pasta está na lista de ignorados
            const isIgnored = config.filesAndFoldersToIgnore.includes(path.basename(filePath));

            if (isIgnored) {
                // Se estiver na lista, ignora e não faz nada
                return;
            }

            // Se for um diretório, entra nele (recursivo)
            if (fileStat.isDirectory()) {
                filelist = walkSync(filePath, filelist);
            } 
            // Se for um ficheiro...
            else {
                // Verifica se a extensão é uma das que queremos salvar
                const extension = path.extname(file);
                if (config.extensionsToCache.includes(extension)) {
                    
                    // Formata o caminho para ficar como uma URL de site
                    // ex: 'en\index.html' (Windows) vira '/en/index.html' (URL)
                    const urlPath = filePath
                        .replace(/\\/g, '/')       // Converte barras invertidas para normais
                        .replace(/^\.\//, '/');     // Remove o './' do início e põe só a barra
                    
                    filelist.push(urlPath);
                }
            }
        });
    } catch (error) {
        // Ignora erros de permissão de leitura de pastas do sistema
        if (error.code !== 'EPERM' && error.code !== 'EACCES') {
            throw error;
        }
    }
    return filelist;
};

// --- Execução Principal ---
try {
    console.log('🤖 Iniciando automação do Service Worker...');
    
    // 1. Encontrar todos os ficheiros válidos para o cache
    console.log('🔎 Procurando ficheiros...');
    const files = walkSync(config.baseDir);
    
    // 2. Formatar a lista de ficheiros para o formato de array do JS
    // Ex: '/index.html',
    //     '/global-styles.css',
    //     '/en/index.html'
    const filesString = files.map(file => `'${file}'`).join(',\n  ');
    
    // 3. Ler o conteúdo do nosso "molde" (sw-template.js)
    console.log('📖 Lendo o molde sw-template.js...');
    const templateContent = fs.readFileSync(config.templateFile, 'utf8');
    
    // 4. Substituir o marcador pela nossa lista de ficheiros (CORRIGIDO)
    console.log('💉 Injetando a lista de ficheiros...');
    const finalContent = templateContent.replace(config.marker, filesString);
    
    // 5. Escrever o resultado no ficheiro final (sw.js)
    console.log(`💾 Escrevendo o ficheiro final: ${config.outputFile}`);
    fs.writeFileSync(config.outputFile, finalContent, 'utf8');
    
    console.log(`\n✅ Sucesso! O ficheiro '${config.outputFile}' foi criado/atualizado com ${files.length} ficheiros cacheados.`);
    
} catch (error) {
    console.error('\n❌ ERRO ao gerar o Service Worker:', error);
}