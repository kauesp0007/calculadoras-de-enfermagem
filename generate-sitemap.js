// Importa os módulos necessários do Node.js
const fs = require('fs');
const path = require('path');

// --- Configurações ---
const BASE_URL = 'https://www.calculadorasdeenfermagem.com.br';
// O diretório raiz onde seus arquivos HTML estão. '.' significa o diretório atual.
const ROOT_DIR = path.resolve(__dirname); 

// Lista das suas PASTAS de idioma
const LANG_FOLDERS = [
  'en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'hi', 'ar', 
  'ru', 'tr', 'ko', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Lista de arquivos para IGNORAR (com vírgulas)
const IGNORE_FILES = [
  'footer.html',
  'language_selector.html',
  'avaliacaomeem.html',
  'exemplo.html',
  'global-body-elements.html',
  'googlef8af7cdb552164b.html',
  'menu-global.html',
  'modelo.html',
  'novolayout.html',
  'politicaapp.html',
  'sitemapenemplo.html',
  'vacinas_improved.html',
  'rodape.html',
  'avaliacaomeem.html',
];

// Caminho de saída para o sitemap
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');
// --- Fim das Configurações ---

/**
 * Mapeia os códigos de pasta para os códigos de idioma 'hreflang' corretos.
 * 'pt' é mapeado para 'pt-BR' como seu idioma principal.
 */
const langCodeMap = {
  'pt': 'pt-BR', // 'pt' é nossa chave interna para arquivos na raiz
  'en': 'en',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'it': 'it',
  'ja': 'ja',
  'zh': 'zh',
  'hi': 'hi',
  'ar': 'ar',
  'ru': 'ru',
  'tr': 'tr',
  'ko': 'ko',
  'nl': 'nl',
  'pl': 'pl',
  'sv': 'sv',
  'id': 'id',
  'vi': 'vi',
  'uk': 'uk',
};

/**
 * Encontra todos os arquivos .html em um diretório específico.
 * (Esta função está correta, não mudou)
 */
function getHtmlFiles(dir) {
  try {
    // Lê todos os arquivos no diretório
    const files = fs.readdirSync(dir, { withFileTypes: true });
    // Filtra para manter apenas arquivos .html
    return files
      .filter(file => file.isFile() && path.extname(file.name) === '.html')
      .map(file => file.name);
  } catch (error) {
    // Se uma pasta de idioma ainda não existir, apenas retorna uma lista vazia.
    if (error.code === 'ENOENT') {
      console.warn(`Aviso: Pasta não encontrada ${dir}. Ignorando.`);
      return [];
    }
    throw error;
  }
}

/**
 * Gera o conteúdo XML completo do sitemap.
 * (Esta função está correta, não mudou)
 */
function generateSitemapXml(sitemapEntries) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n`;

  // Ordena as páginas por nome de arquivo para um sitemap consistente
  const sortedPages = Object.keys(sitemapEntries).sort();

  for (const pageName of sortedPages) {
    const versions = sitemapEntries[pageName];
    
    // A URL principal (<loc>) e a x-default será a versão em português ('pt')
    // Se não houver 'pt', usa a primeira que encontrar.
    const mainUrl = versions['pt'] || Object.values(versions)[0];
    
    // Se não houver versão em português, não podemos gerar uma entrada válida.
    if (!mainUrl) {
        console.warn(`Aviso: Página ${pageName} não tem versão 'pt' ou qualquer outra. Pulando.`);
        continue;
    }

    const xDefaultUrl = versions['pt'] || mainUrl; // Prefere 'pt' para x-default

    xml += `  <url>\n`;
    xml += `    <loc>${mainUrl}</loc>\n`;

    // Adiciona todas as versões de idioma alternativas
    for (const langKey in versions) {
      // Verifica se o langKey existe no nosso mapa
      if (langCodeMap[langKey]) {
        const hreflang = langCodeMap[langKey];
        const url = versions[langKey];
        xml += `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${url}" />\n`;
      }
    }

    // Adiciona o link x-default
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />\n`;
    xml += `  </url>\n`;
  }

  xml += `\n</urlset>\n`;
  return xml;
}


// --- ATUALIZAÇÃO PRINCIPAL: LÓGICA SIMPLIFICADA E CORRIGIDA ---

/**
 * Função principal que executa o script.
 */
function main() {
  console.log('Iniciando geração do sitemap...');
  
  // Objeto para armazenar todas as páginas e suas versões
  // Ex: { 'index.html': { 'pt': 'url', 'ja': 'url' }, 'aldrete.html': { ... } }
  const sitemapEntries = {};

  // 1. Processa os arquivos da raiz (Português)
  const rootFiles = getHtmlFiles(ROOT_DIR);
  for (const file of rootFiles) {
    
    // Ignora arquivos parciais/de script
    if (file === 'sitemap.html' || 
        file === 'generate-sitemap.js' ||
        IGNORE_FILES.includes(file) || 
        file.startsWith('_')) {
      continue; // Pula este arquivo
    }

    const pageKey = file; // A "chave" é o nome do arquivo, ex: 'index.html'
    let url = `${BASE_URL}/${file}`; // URL padrão

    // --- CORREÇÃO: Trata o index.html DA RAIZ aqui ---
    if (pageKey === 'index.html') {
      url = `${BASE_URL}/`;
    }

    // Cria a entrada para a página se for a primeira vez
    if (!sitemapEntries[pageKey]) {
      sitemapEntries[pageKey] = {};
    }
    sitemapEntries[pageKey]['pt'] = url; // Adiciona a versão 'pt'
  }
  

  // 2. Processa os arquivos das pastas de idioma
  for (const langKey of LANG_FOLDERS) {
    const langDir = path.join(ROOT_DIR, langKey);
    const langFiles = getHtmlFiles(langDir);

    for (const file of langFiles) {
      
      // Ignora arquivos parciais
      if (IGNORE_FILES.includes(file) || file.startsWith('_')) {
        continue; // Pula este arquivo
      }

      const pageKey = file; // A chave é a mesma, ex: 'index.html'
      let url = `${BASE_URL}/${langKey}/${file}`; // URL padrão

      // --- CORREÇÃO: Trata o index.html DAS SUBPASTAS aqui ---
      if (pageKey === 'index.html') {
        url = `${BASE_URL}/${langKey}/`;
      }

      // Cria a entrada para a página se for a primeira vez (ex: um arquivo só existe em 'ja')
      if (!sitemapEntries[pageKey]) {
        sitemapEntries[pageKey] = {};
      }
      sitemapEntries[pageKey][langKey] = url; // Adiciona a versão do idioma
    }
  }

  // 3. Gera o XML
  const xmlContent = generateSitemapXml(sitemapEntries);

  // 4. Salva o arquivo
  fs.writeFileSync(SITEMAP_PATH, xmlContent);

  console.log(`Sitemap gerado com sucesso em ${SITEMAP_PATH}`);
}
// --- FIM DA ATUALIZAÇÃO PRINCIPAL ---


// Executa a função principal
main();