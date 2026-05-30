/* eslint-env node */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "item.template.html";
const OUTPUT_DIR = "biblioteca";
const TEMPLATE_HASH_MARKER_PREFIX = "BIBLIOTECA_ITEM_TEMPLATE_HASH:";

// Funções Utilitárias
function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function sha256(text) {
    return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

// Substitui marcador por conteúdo no HTML usando REPLACE de forma segura
function injetar(html, marcador, conteudo) {
    return html.replace(marcador, conteudo);
}

function ensureTemplateHashMarker(html, templateHash) {
    const marker = `<!-- ${TEMPLATE_HASH_MARKER_PREFIX}${templateHash} -->`;
    const re = new RegExp(`<!-- ${TEMPLATE_HASH_MARKER_PREFIX}.*? -->`, "ig");
    if (re.test(html)) return html.replace(re, marker);
    if (html.includes("</head>")) return html.replace("</head>", `\n  ${marker}\n</head>`);
    return `${marker}\n${html}`;
}

function gerarHtmlDoItem({ template, templateHash, item }) {
    let html = template;

    const titulo = item.titulo || "Sem título";
    const slug = item.slug || slugify(titulo);

    // Fallback inteligente para descrição caso não exista no JSON
    const descricaoRaw = item.descricao && item.descricao.trim() !== ""
        ? item.descricao
        : `Faça o download do material completo sobre ${titulo} na nossa Biblioteca de Enfermagem. Documentos e protocolos para estudo e prática clínica.`;
    const descricao = escapeHtml(descricaoRaw);

    // Geração de keywords e URL
    const keywords = `enfermagem, ${titulo.toLowerCase()}, material de estudo, pdf, biblioteca de enfermagem, protocolos`;
    const canonicalUrl = `https://www.calculadorasdeenfermagem.com.br/biblioteca/${slug}.html`;

    // Tratamento rigoroso de caminhos (Imagens e Documentos)
    let imagePath = item.capa || item.ficheiro || "";
    if (imagePath && !imagePath.startsWith("/")) imagePath = "/" + imagePath;

    let filePath = item.download || item.ficheiro || "";
    if (filePath && !filePath.startsWith("/")) filePath = "/" + filePath;

    const imageUrlAbsolute = imagePath ? `https://www.calculadorasdeenfermagem.com.br${imagePath}` : "https://www.calculadorasdeenfermagem.com.br/iconpages.webp";

    // Criação do Schema.org (ItemPage)
    const schemaOrgObj = {
        "@context": "https://schema.org",
        "@type": "ItemPage",
        "name": titulo,
        "description": descricaoRaw,
        "url": canonicalUrl,
        "image": imageUrlAbsolute,
        "publisher": {
            "@type": "Organization",
            "name": "Calculadoras de Enfermagem",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.calculadorasdeenfermagem.com.br/iconpages.webp"
            }
        }
    };

    // Criação do Breadcrumbs (JSON-LD)
    const breadcrumbsObj = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Início",
                "item": "https://www.calculadorasdeenfermagem.com.br/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Biblioteca de Enfermagem",
                "item": "https://www.calculadorasdeenfermagem.com.br/downloads.html"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": titulo,
                "item": canonicalUrl
            }
        ]
    };

    // Aplicação das injeções usando marcadores regex EXPLÍCITOS e SEGUROS
    html = injetar(html, /<!-- \[TITLE\] -->/g, titulo);
    html = injetar(html, /<!-- \[DESCRIPTION\] -->/g, descricao);
    html = injetar(html, /<!-- \[KEYWORDS\] -->/g, escapeHtml(keywords));
    html = injetar(html, /<!-- \[CANONICAL_URL\] -->/g, canonicalUrl);
    html = injetar(html, /<!-- \[IMAGE\] -->/g, imagePath);
    html = injetar(html, /<!-- \[FILE\] -->/g, filePath);
    html = injetar(html, /<!-- \[SCHEMA_ORG\] -->/g, JSON.stringify(schemaOrgObj));
    html = injetar(html, /<!-- \[BREADCRUMBS\] -->/g, JSON.stringify(breadcrumbsObj));

    html = ensureTemplateHashMarker(html, templateHash);

    return { slug, html };
}

function construirBiblioteca() {
    console.log("🚀 Iniciando build-biblioteca.js (Gerando itens individuais com Otimização SEO)...");

    if (!fs.existsSync(JSON_DATABASE_FILE)) return console.error("❌ biblioteca.json não encontrado");
    if (!fs.existsSync(TEMPLATE_FILE)) return console.error(`❌ ${TEMPLATE_FILE} não encontrado`);

    const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
    const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
    const templateHash = sha256(template);

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

    let criados = 0;
    let atualizados = 0;
    let inalterados = 0;

    data.forEach((item) => {
        if (!item || !item.titulo || !item.ficheiro) return;

        const { slug, html } = gerarHtmlDoItem({ template, templateHash, item });
        const outFile = path.join(OUTPUT_DIR, `${slug}.html`);

        if (fs.existsSync(outFile)) {
            const current = fs.readFileSync(outFile, "utf8");
            if (current === html) {
                inalterados++;
                return;
            }
            fs.writeFileSync(outFile, html, "utf8");
            atualizados++;
            return;
        }

        fs.writeFileSync(outFile, html, "utf8");
        criados++;
    });

    console.log(`✅ build-biblioteca concluído! Criados: ${criados} | Atualizados: ${atualizados} | Inalterados: ${inalterados}`);
}

construirBiblioteca();