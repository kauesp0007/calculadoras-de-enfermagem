const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');
const sizeOf = require('image-size');
const sharp = require('sharp');

// =====================================================================
// CONFIGURAÇÕES DE SEGURANÇA E EXCLUSÃO
// =====================================================================

const SITE_URL = 'https://www.calculadorasdeenfermagem.com.br';

// 1. PASTAS QUE O SCRIPT JAMAIS DEVE ENTRAR
const PASTAS_PROIBIDAS = [
    'biblioteca', 
    'downloads', 
    'node_modules', 
    '.git', 
    'assets/js', 
    'css'
];

// 2. ARQUIVOS ESPECÍFICOS QUE JAMAIS DEVEM SER TOCADOS (Modularização)
const ARQUIVOS_PROIBIDOS = [
    '_language_selector.html',
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html'
];

console.log("--- INICIANDO OTIMIZADOR MASTER BLINDADO ---");

// =====================================================================
// LÓGICA DE BUSCA DE ARQUIVOS
// =====================================================================

// Busca apenas arquivos .html, ignorando pastas proibidas na raiz
const files = glob.sync('**/*.html', {
    ignore: [
        '**/biblioteca/**', 
        '**/downloads/**', 
        '**/node_modules/**', 
        '**/.git/**'
    ],
    nodir: true
});

// =====================================================================
// FUNÇÃO DE PROCESSAMENTO
// =====================================================================

async function processarArquivo(filePath) {
    const nomeArquivo = path.basename(filePath);

    // --- BARREIRA DE SEGURANÇA 1: Extensão ---
    if (path.extname(filePath) !== '.html') return;

    // --- BARREIRA DE SEGURANÇA 2: Arquivos Proibidos (Exatos) ---
    if (ARQUIVOS_PROIBIDOS.includes(nomeArquivo)) {
        console.log(`[PROTEGIDO] Ignorando arquivo de sistema: ${filePath}`);
        return;
    }

    // --- BARREIRA DE SEGURANÇA 3: Pastas Proibidas (Redundância) ---
    const caminhoNormalizado = filePath.split(path.sep);
    if (caminhoNormalizado.some(pasta => PASTAS_PROIBIDAS.includes(pasta))) {
        console.log(`[PROTEGIDO] Ignorando pasta proibida: ${filePath}`);
        return;
    }

    console.log(`Otimizando: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // MODO SEGURO: (null, false) impede que o Cheerio adicione <html>/<body> 
    // em arquivos que não devem ter (caso algum escape), mantendo a modularização intacta.
    const $ = cheerio.load(content, null, false); 
    
    const dirName = path.dirname(filePath);

    // =========================================================
    // 1. IMAGENS (CLS, WebP, Lazy, Alt)
    // =========================================================
    const imgPromises = $('img').map(async (i, el) => {
        let src = $(el).attr('src');
        // Ignora: externas, base64, svgs, ou se não tiver src
        if (!src || src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return; 

        const imgPath = path.join(dirName, src);
        
        if (fs.existsSync(imgPath)) {
            
            // A. Alt Text (Se não existir ou for vazio)
            if (!$(el).attr('alt') || $(el).attr('alt').trim() === "") {
                const altText = path.basename(src, path.extname(src)).replace(/[-_]/g, ' ');
                $(el).attr('alt', altText);
            }

            // B. Lazy Loading (Exceto logo e header)
            const parentClass = $(el).parent().attr('class') || '';
            const isLogo = src.toLowerCase().includes('logo');
            const isHeader = parentClass.includes('header');
            
            if (!isLogo && !isHeader) {
                $(el).attr('loading', 'lazy');
            }

            // C. DIMENSÕES EXPLICITAS (Anti-CLS)
            try {
                const dimensions = sizeOf(imgPath);
                if(dimensions) {
                    // Só aplica se não tiver definido
                    if (!$(el).attr('width')) $(el).attr('width', dimensions.width);
                    if (!$(el).attr('height')) $(el).attr('height', dimensions.height);
                }

                // D. Conversão WebP
                const ext = path.extname(src).toLowerCase();
                if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                    const webpPath = imgPath.replace(ext, '.webp');
                    const srcWebp = src.replace(ext, '.webp');
                    
                    // Gera WebP se não existir
                    if (!fs.existsSync(webpPath)) {
                       await sharp(imgPath).toFile(webpPath);
                    }
                    // Atualiza HTML
                    $(el).attr('src', srcWebp);
                }

            } catch (err) {
                // Ignora erros de leitura de imagem para não parar o script
            }
        }
    }).get();

    await Promise.all(imgPromises);

    // =========================================================
    // 2. IFRAMES E VÍDEOS (CLS)
    // =========================================================
    $('iframe, video').each((i, el) => {
        if (!$(el).attr('loading')) $(el).attr('loading', 'lazy');
        if (el.tagName === 'iframe' && !$(el).attr('title')) $(el).attr('title', 'Conteúdo incorporado');
    });

    // =========================================================
    // 3. HEAD (Performance & SEO)
    // =========================================================
    // Só executa se o arquivo tiver <head>. Protege fragmentos HTML.
    const head = $('head');
    
    if (head.length > 0) {
        
        // DNS Prefetch
        const prefetchs = [
            '//pagead2.googlesyndication.com',
            '//googleads.g.doubleclick.net',
            '//www.googletagservices.com'
        ];
        prefetchs.forEach(url => {
            if (head.find(`link[rel="dns-prefetch"][href="${url}"]`).length === 0) {
                head.prepend(`<link rel="dns-prefetch" href="${url}">`);
            }
        });

        // Google Fonts (Preconnect)
        if (content.includes('fonts.googleapis.com')) {
            if (head.find('link[href*="fonts.gstatic.com"]').length === 0) {
                head.prepend(`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`);
                head.prepend(`<link rel="preconnect" href="https://fonts.googleapis.com">`);
            }
        }

        // Preload CSS (Local)
        $('link[rel="stylesheet"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && !href.startsWith('http') && href.includes('style.css')) {
                if (head.find(`link[rel="preload"][href="${href}"]`).length === 0) {
                     $(el).before(`<link rel="preload" href="${href}" as="style">`);
                }
            }
        });

        // Scripts Defer
        $('script[src]').each((i, el) => {
            const src = $(el).attr('src');
            if (src && !$(el).attr('async') && !$(el).attr('defer') && !$(el).attr('type')) {
                $(el).attr('defer', 'defer');
            }
        });

        // SCHEMA.ORG (MedicalWebPage)
        const title = $('title').text() || 'Calculadoras de Enfermagem';
        const description = $('meta[name="description"]').attr('content') || title;
        const urlCanonica = `${SITE_URL}/${nomeArquivo}`;

        $('script[type="application/ld+json"]').remove(); // Limpa antigos

        const schemaData = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Organization",
                    "@id": `${SITE_URL}/#organization`,
                    "name": "Calculadoras de Enfermagem",
                    "url": SITE_URL,
                    "logo": {
                        "@type": "ImageObject",
                        "url": `${SITE_URL}/assets/logo.png`
                    }
                },
                {
                    "@type": "MedicalWebPage",
                    "@id": `${urlCanonica}/#webpage`,
                    "url": urlCanonica,
                    "name": title,
                    "description": description.substring(0, 300),
                    "isPartOf": { "@id": `${SITE_URL}/#website` },
                    "audience": "Clinician"
                }
            ]
        };

        head.append(`<script type="application/ld+json">${JSON.stringify(schemaData)}</script>`);
    }

    // =========================================================
    // SALVAR
    // =========================================================
    fs.writeFileSync(filePath, $.html(), 'utf8');
}

// --- EXECUTOR ---
(async () => {
    console.log(`Arquivos HTML encontrados: ${files.length}`);
    for (const file of files) {
        try {
            await processarArquivo(file);
        } catch (e) {
            console.error(`Erro ao processar ${file}:`, e.message);
        }
    }
    console.log('--- OTIMIZAÇÃO BLINDADA CONCLUÍDA ---');
})();