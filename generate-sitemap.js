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
  'testemeem.html',
  'site-de-vagas.html',
  'item.template.html',
  'downloads.template.html',
  // Novos templates do blog para ignorar
  'post.template.html',
  'index.template.html'
];

// Função auxiliar para pegar arquivos HTML de um diretório
function getHtmlFiles(dir) {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(file => file.endsWith('.html'));
  } catch (err) {
    console.error(`Erro ao ler diretório ${dir}:`, err);
    return [];
  }
}

// Objeto para armazenar as URLs (evita duplicatas e organiza por página/idioma)
const sitemapEntries = {};

// 1. Processa a RAIZ (Português - pt-BR)
console.log('Processando raiz (pt-BR)...');
const rootFiles = getHtmlFiles(ROOT_DIR);

for (const file of rootFiles) {
  // Ignora arquivos da lista negra ou que começam com "_" ou "google" (verificação extra)
  if (IGNORE_FILES.includes(file) || file.startsWith('_') || file.startsWith('google')) {
    continue;
  }

  const pageKey = file; // A chave é o nome do arquivo (ex: 'gasometria.html')
  let url = `${BASE_URL}/${file}`;

  // Trata o index.html da raiz
  if (file === 'index.html') {
    url = `${BASE_URL}/`;
  }

  if (!sitemapEntries[pageKey]) {
    sitemapEntries[pageKey] = {};
  }
  sitemapEntries[pageKey]['pt-br'] = url; // Define pt-br como padrão da raiz
}

// 2. Processa as PASTAS DE IDIOMA
for (const langKey of LANG_FOLDERS) {
  const dirPath = path.join(ROOT_DIR, langKey);
  console.log(`Processando idioma: ${langKey}...`);
  const htmlFiles = getHtmlFiles(dirPath);

  for (const file of htmlFiles) {
    if (IGNORE_FILES.includes(file) || file.startsWith('_')) {
      continue;
    }

    const pageKey = file; // A chave é a mesma, ex: 'index.html'
    let url = `${BASE_URL}/${langKey}/${file}`; // URL padrão

    // Trata o index.html DAS SUBPASTAS aqui
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

// 3. Processa PASTAS ESPECIAIS (downloads, biblioteca e agora BLOG)
// ADICIONADO: 'blog' para ser escaneado na raiz
const SPECIAL_FOLDERS = ['downloads', 'biblioteca', 'blog'];

for (const folder of SPECIAL_FOLDERS) {
  const dirPath = path.join(ROOT_DIR, folder);
  console.log(`Processando pasta especial: ${folder}...`);
  const htmlFiles = getHtmlFiles(dirPath);

  for (const file of htmlFiles) {

    // Ignora templates se estiverem misturados aqui
    if (IGNORE_FILES.includes(file) || file.startsWith('_')) {
      continue;
    }

    // A chave precisa incluir a pasta para não colidir com arquivos da raiz
    const pageKey = `${folder}/${file}`;
    const url = `${BASE_URL}/${folder}/${file}`;

    if (!sitemapEntries[pageKey]) {
      sitemapEntries[pageKey] = {};
    }

    // Consideramos estas páginas como conteúdo principal (geralmente pt-BR ou neutro)
    sitemapEntries[pageKey]['pt-br'] = url;
  }
}

// --- GERA O XML ---
console.log('Gerando XML...');

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

// Itera sobre as entradas agrupadas
for (const pageKey in sitemapEntries) {
  const versions = sitemapEntries[pageKey];

  // Pegamos a URL "principal". Preferência para pt-br, senão a primeira que achar.
  const mainUrl = versions['pt-br'] || Object.values(versions)[0];

  // Data de modificação (hoje)
  const today = new Date().toISOString().split('T')[0];

  xml += `  <url>
    <loc>${mainUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${pageKey === 'index.html' ? '1.0' : '0.8'}</priority>
`;

  // Adiciona as tags xhtml:link para TODOS os idiomas disponíveis desta página (incluindo o principal)
  for (const lang in versions) {
    xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${versions[lang]}" />
`;
  }

  // Adiciona o x-default apontando para pt-br (ou o principal que escolhemos)
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${mainUrl}" />
`;

  xml += `  </url>
`;
}

xml += `</urlset>`;

// Salva o arquivo
const outputPath = path.join(ROOT_DIR, 'sitemap.xml');
fs.writeFileSync(outputPath, xml, 'utf8');

console.log(`✅ Sitemap gerado com sucesso em: ${outputPath}`);