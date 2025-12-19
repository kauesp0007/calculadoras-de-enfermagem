const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');
const sizeOf = require('image-size');
const sharp = require('sharp');

// =====================================================================
// CONFIGURAÇÕES GERAIS E DE SEGURANÇA
// =====================================================================

const SITE_URL = 'https://www.calculadorasdeenfermagem.com.br';
const AUTHOR_NAME = 'Calculadoras de Enfermagem';
const DEFAULT_IMAGE = `${SITE_URL}/assets/logo-share.jpg`;

// 1. PASTAS BLOQUEADAS
const PASTAS_PROIBIDAS = [
    'biblioteca', 'downloads', 'node_modules', '.git', 'assets/js', 'css'
];

// 2. ARQUIVOS DE SISTEMA BLOQUEADOS (Modularização)
// Estes arquivos serão totalmente ignorados pelo script
const ARQUIVOS_PROIBIDOS = [
    '_language_selector.html', 'footer.html', 'menu-global.html', 
    'global-body-elements.html', 'downloads.html'
];

console.log("--- INICIANDO OTIMIZADOR MASTER (CORREÇÃO DE DOCTYPE) ---");

// =====================================================================
// BUSCA DE ARQUIVOS
// =====================================================================
const files = glob.sync('**/*.html', {
    ignore: ['**/biblioteca/**', '**/downloads/**', '**/node_modules/**', '**/.git/**'],
    nodir: true
});

// =====================================================================
// PROCESSAMENTO
// =====================================================================

async function processarArquivo(filePath) {
    const nomeArquivo = path.basename(filePath);

    // --- TRAVAS DE SEGURANÇA ---
    if (path.extname(filePath) !== '.html') return;
    
    // Se estiver na lista de proibidos, pula fora
    if (ARQUIVOS_PROIBIDOS.includes(nomeArquivo)) {
        return; 
    }
    
    const caminhoNormalizado = filePath.split(path.sep);
    if (caminhoNormalizado.some(pasta => PASTAS_PROIBIDAS.includes(pasta))) {
        return;
    }

    console.log(`Otimizando: ${filePath}`);
    
    // Obter dados do arquivo para Schema
    const stats = fs.statSync(filePath);
    const dateModified = stats.mtime.toISOString();
    const datePublished = stats.birthtime.toISOString();
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // =================================================================
    // CORREÇÃO CRÍTICA AQUI:
    // removemos o 'null, false' e adicionamos decodeEntities: false
    // Isso preserva <!DOCTYPE>, <html> e caracteres especiais (acentos)
    // =================================================================
    const $ = cheerio.load(content, { decodeEntities: false });
    
    const dirName = path.dirname(filePath);

    // ---------------------------------------------------------
    // 1. IMAGENS (WebP, Lazy, Alt, Width/Height)
    // ---------------------------------------------------------
    let primaryImage = DEFAULT_IMAGE; 

    const imgPromises = $('img').map(async (i, el) => {
        let src = $(el).attr('src');
        if (!src || src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return; 

        if (primaryImage === DEFAULT_IMAGE && !src.includes('logo') && !src.includes('icon')) {
            primaryImage = `${SITE_URL}/${src}`;
        }

        const imgPath = path.join(dirName, src);
        
        if (fs.existsSync(imgPath)) {
            // Alt Text
            if (!$(el).attr('alt') || $(el).attr('alt').trim() === "") {
                const altText = path.basename(src, path.extname(src)).replace(/[-_]/g, ' ');
                $(el).attr('alt', altText);
            }

            // Lazy Loading (Protegendo Logo e Header)
            const parentClass = $(el).parent().attr('class') || '';
            const isLogo = src.toLowerCase().includes('logo');
            const isHeader = parentClass.includes('header');
            if (!isLogo && !isHeader) {
                $(el).attr('loading', 'lazy');
            }

            // CLS: Width e Height
            try {
                const dimensions = sizeOf(imgPath);
                if(dimensions) {
                    if (!$(el).attr('width')) $(el).attr('width', dimensions.width);
                    if (!$(el).attr('height')) $(el).attr('height', dimensions.height);
                }

                // WebP
                const ext = path.extname(src).toLowerCase();
                if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                    const webpPath = imgPath.replace(ext, '.webp');
                    const srcWebp = src.replace(ext, '.webp');
                    if (!fs.existsSync(webpPath)) await sharp(imgPath).toFile(webpPath);
                    $(el).attr('src', srcWebp);
                }
            } catch (err) {}
        }
    }).get();

    await Promise.all(imgPromises);

    // ---------------------------------------------------------
    // 2. EMBEDS E VÍDEOS (CLS)
    // ---------------------------------------------------------
    $('iframe, video').each((i, el) => {
        if (!$(el).attr('loading')) $(el).attr('loading', 'lazy');
        if (el.tagName === 'iframe' && !$(el).attr('title')) $(el).attr('title', 'Conteúdo incorporado');
        
        const src = $(el).attr('src') || '';
        if (src.includes('youtube') || src.includes('vimeo')) {
            const style = $(el).attr('style') || '';
            if (!style.includes('aspect-ratio') && !style.includes('height')) {
                $(el).attr('style', `${style}; aspect-ratio: 16 / 9; width: 100%;`.replace(/^; /, ''));
            }
        }
    });

    // ---------------------------------------------------------
    // 3. HEAD & META TAGS
    // ---------------------------------------------------------
    const head = $('head');
    if (head.length > 0) {
        
        const title = $('title').text().trim() || 'Calculadoras de Enfermagem';
        const rawDesc = $('meta[name="description"]').attr('content') || title;
        const description = rawDesc.replace(/[\r\n]+/g, ' ').substring(0, 320); 
        const urlCanonica = `${SITE_URL}/${nomeArquivo}`;

        // Viewport
        if (head.find('meta[name="viewport"]').length === 0) {
            head.prepend('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
        }

        // Author
        if (head.find('meta[name="author"]').length === 0) {
            head.append(`<meta name="author" content="${AUTHOR_NAME}">`);
        }

        // Open Graph
        const ogTags = {
            'og:locale': 'pt_BR',
            'og:type': 'website',
            'og:title': title,
            'og:description': description,
            'og:url': urlCanonica,
            'og:site_name': AUTHOR_NAME,
            'og:image': primaryImage
        };

        for (const [property, content] of Object.entries(ogTags)) {
            if (head.find(`meta[property="${property}"]`).length === 0) {
                head.append(`<meta property="${property}" content="${content}">`);
            }
        }

        // Twitter Cards
        const twTags = {
            'twitter:card': 'summary_large_image',
            'twitter:title': title,
            'twitter:description': description,
            'twitter:image': primaryImage
        };

        for (const [name, content] of Object.entries(twTags)) {
            if (head.find(`meta[name="${name}"]`).length === 0) {
                head.append(`<meta name="${name}" content="${content}">`);
            }
        }

        // Canonical
        if (head.find('link[rel="canonical"]').length === 0) {
            head.append(`<link rel="canonical" href="${urlCanonica}">`);
        }

        // Font-display: swap
        $('link[href*="fonts.googleapis.com"]').each((i, el) => {
            let href = $(el).attr('href');
            if (!href.includes('display=swap')) {
                href = href.includes('?') ? `${href}&display=swap` : `${href}?display=swap`;
                $(el).attr('href', href);
            }
        });

        // Preconnect
        const preconnects = ['https://fonts.gstatic.com', 'https://fonts.googleapis.com'];
        preconnects.forEach(url => {
             if (head.find(`link[rel="preconnect"][href^="${url}"]`).length === 0) {
                 head.prepend(`<link rel="preconnect" href="${url}" crossorigin>`);
             }
        });

        // DNS Prefetch
        const prefetchs = ['//pagead2.googlesyndication.com', '//googleads.g.doubleclick.net'];
        prefetchs.forEach(url => {
            if (head.find(`link[rel="dns-prefetch"][href="${url}"]`).length === 0) {
                head.prepend(`<link rel="dns-prefetch" href="${url}">`);
            }
        });

        // Preload CSS
        $('link[rel="stylesheet"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && !href.startsWith('http') && href.includes('style.css')) {
                if (head.find(`link[rel="preload"][href="${href}"]`).length === 0) {
                     $(el).before(`<link rel="preload" href="${href}" as="style">`);
                }
            }
        });

        // Defer Scripts
        $('script[src]').each((i, el) => {
            const src = $(el).attr('src');
            if (src && !$(el).attr('async') && !$(el).attr('defer') && !$(el).attr('type')) {
                $(el).attr('defer', 'defer');
            }
        });

        // Schema.org
        $('script[type="application/ld+json"]').remove();

        const breadcrumbList = {
            "@type": "BreadcrumbList",
            "itemListElement": [{
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_URL
            }, {
                "@type": "ListItem",
                "position": 2,
                "name": title,
                "item": urlCanonica
            }]
        };

        const schemaData = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Organization",
                    "@id": `${SITE_URL}/#organization`,
                    "name": AUTHOR_NAME,
                    "url": SITE_URL,
                    "logo": { "@type": "ImageObject", "url": `${SITE_URL}/assets/logo.png` }
                },
                {
                    "@type": "MedicalWebPage",
                    "@id": `${urlCanonica}/#webpage`,
                    "url": urlCanonica,
                    "name": title,
                    "description": description,
                    "isPartOf": { "@id": `${SITE_URL}/#website` },
                    "primaryImageOfPage": { "@id": `${urlCanonica}/#primaryimage` },
                    "datePublished": datePublished,
                    "dateModified": dateModified,
                    "author": { "@id": `${SITE_URL}/#organization` },
                    "audience": {
                        "@type": "MedicalAudience",
                        "audienceType": "Clinician"
                    },
                    "specialty": {
                        "@type": "MedicalSpecialty",
                        "name": "Nursing"
                    }
                },
                breadcrumbList
            ]
        };
        head.append(`<script type="application/ld+json">${JSON.stringify(schemaData)}</script>`);
    }

    // Só escreve se o arquivo foi carregado corretamente
    if (content) {
        fs.writeFileSync(filePath, $.html(), 'utf8');
    }
}

// --- EXECUTOR ---
(async () => {
    console.log(`Encontrados ${files.length} arquivos HTML elegíveis.`);
    for (const file of files) {
        try {
            await processarArquivo(file);
        } catch (e) {
            console.error(`Erro: ${file}:`, e.message);
        }
    }
    console.log('--- OTIMIZAÇÃO CONCLUÍDA ---');
})();