// Importa os módulos necessários do Node.js
const fs = require('fs');
const path = require('path');

// --- Configurações ---
// O diretório raiz onde seus arquivos HTML estão. '.' significa o diretório atual.
const ROOT_DIR = path.resolve(__dirname); 

// Lista de arquivos .html para IGNORAR (não criar)
const IGNORE_FILES = [
  'avaliacaomeem.html',
  'exemplo.html',
  'googlef8af7cdb552164b.html',
  'modelo.html',
  'novolayout.html',
  'politicaapp.html',
  'sitemapexemplo.html',
  'vacinas_improved.html',
  'carreiras.html',
  'checagem.html',
  'como-procurar-emprego.html',
  'concurso.html',
  'concursos-publicos.html',
  'curriculo-ideal.html',
  'curriculos.html',
  'cursos.html',
  'dimensionamento.html',
  'dinamicas-de-grupo.html',
  'doacoes.html',
  'educacao-continuada.html',
  'empreendedorismo-enfermagem.html',
  'etarismo-enfermagem.html',
  'gerador-curriculo-enfermagem.html',
  'guia-entrevista-enfermagem.html',
  'legislacoes.html',
  'marca-pessoal-enfermagem.html',
  'metasinternacionais.html',
  'nandatax.html',
  'notificacao-compulsoria.html',
  'regrasmedicacoes.html',
  'salarios-e-perspectivas.html',
  'site-de-vagas.html',
  'soft-skills-enfermagem.html',
  'tabelas-vacinas-crianca.html',
  'transicao-carreira-enfermagem.html',
  'vacinas_improved.html',
  'vigilancia.html',
  'rodape.html',
  'nanda.html',
  'insulina.html',
  'heparina.html',
  'googlefc0a17cdd552164b.html',
];

// NOVO: Lista de ficheiros específicos (JS, CSS, Imagens) para COPIAR
// Estes ficheiros serão COPIADOS da raiz para a nova pasta de idioma.
const FILES_TO_COPY = [
  // Adicione aqui os nomes exatos dos ficheiros que quer copiar.
  // Por exemplo:
  // 'global-scripts.js',
  // 'global-styles.css',
  // 'imagem-logo.webp',
  // 'lang-selector.js'
  'global-scripts.js',
  'global-styles.css',
  'lang-selector.js',
  'bandeira-alemanha.webp',
  'bandeira-espanha.webp',
  'bandeira-eua.webp',
  'bandeira-franca.webp',
  'bandeira-italia.webp',
  'bandeira-japao.webp',
  'bandeira-arabia.webp',
  'bandeira-china.webp',
  'bandeira-coreia.webp',
  'bandeira-india.webp',
  'bandeira-russia.webp',
  'bandeira-turquia.webp',
  'bandeira-vietna.webp',
  'bandeira-holanda.webp',
  'bandeira-indonesia.webp',
  'bandeira-polonia.webp',
  'bandeira-suecia.webp',
  'bandeira-ucrania.webp',
  'bandeira-brasil.webp',
  'metasinternacionais.webp',
  'pentagono.webp',
];
// --- Fim das Configurações ---
/**
 * Função principal que executa o script.
 */
function main() {
  // 1. Pega o idioma alvo do comando (ex: "ru", "tr", "ko")
  const targetLang = process.argv[2];

  // 2. Verifica se o idioma foi fornecido
  if (!targetLang) {
    console.error('ERRO: Você precisa especificar um idioma.');
    console.log('Exemplo de uso: node scaffold-lang.js ru');
    return; // Para o script
  }

  console.log(`Iniciando preparação para o idioma: "${targetLang}"...`);

  // 3. Define os caminhos
  const sourceDir = ROOT_DIR; // A fonte é a raiz
  const targetDir = path.join(ROOT_DIR, targetLang); // O alvo é a pasta do idioma

  // 4. Cria a pasta de idioma se ela não existir
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Pasta "${targetDir}" criada.`);
  }

  // 5. Pega TODOS os ficheiros da pasta Raiz (Português)
  let allFiles;
  try {
    allFiles = fs.readdirSync(sourceDir, { withFileTypes: true });
  } catch (error) {
    console.error(`Erro ao ler o diretório ${sourceDir}: ${error.message}`);
    return;
  }
  
  let filesCreated = 0;
  let filesCopied = 0; // Adicionada a contagem de ficheiros copiados
  let filesSkipped = 0;

  // 6. Loop para processar os arquivos
  for (const file of allFiles) {
    // Ignorar se não for um ficheiro (ex: é uma pasta como /en, /es)
    if (!file.isFile()) {
      continue;
    }

    const fileName = file.name;

    // Ignora ficheiros de sistema, sitemap, de build e da lista IGNORE_FILES
    if (fileName === 'sitemap.html' || 
        fileName === 'generate-sitemap.js' ||
        fileName === 'gerar-sw.js' ||
        fileName === 'sw-template.js' ||
        fileName === 'sw.js' ||
        fileName === 'scaffold-lang.js' || // Ignora a si mesmo
        fileName === 'package.json' ||
        fileName === 'package-lock.json' ||
        fileName === 'tailwind.config.js' ||
        fileName.startsWith('.') || // Ignora ficheiros como .gitignore
        IGNORE_FILES.includes(fileName) || 
        fileName.startsWith('_')) {
      continue; // Pula este arquivo
    }

    const targetPath = path.join(targetDir, fileName);

    // 7. Verifica se o arquivo JÁ EXISTE no destino
    if (fs.existsSync(targetPath)) {
      console.warn(`- PULANDO: ${targetPath} (já existe)`);
      filesSkipped++;
      continue; // Pula o resto do loop para este ficheiro
    }

    // 8. LÓGICA PRINCIPAL: COPIAR o ficheiro completo para o destino
    // Agora copiamos todos os ficheiros da raiz (não ignorados) para a pasta do idioma,
    // preservando o conteúdo em português.
    try {
      const sourcePath = path.join(sourceDir, fileName);
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`+ COPIADO: ${targetPath}`);
      filesCopied++;
    } catch (err) {
      console.error(`Erro ao copiar ${fileName}: ${err.message}`);
      filesSkipped++;
    }
  }

  console.log('\n--- Preparação Concluída! ---');
  console.log(`${filesCreated} ficheiros .html vazios criados na pasta "${targetLang}".`);
  console.log(`${filesCopied} ficheiros (js/css/webp) copiados para a pasta "${targetLang}".`);
  console.log(`${filesSkipped} ficheiros pulados (já existiam).`);
}

// Executa a função principal
main();