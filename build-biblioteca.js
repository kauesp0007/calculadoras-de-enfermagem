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

// Função inteligente que impede o chat ou editores de ocultarem a tag HTML
function tag(nome) {
    return "<" + "!-- [" + nome + "] --" + ">";
}

function ensureTemplateHashMarker(html, templateHash) {
    const marker = "<" + "!-- " + TEMPLATE_HASH_MARKER_PREFIX + templateHash + " --" + ">";
    const re = new RegExp("<" + "!--\\s*" + TEMPLATE_HASH_MARKER_PREFIX + "[a-f0-9]{8,64}\\s*--" + ">", "ig");
    if (re.test(html)) {
        return html.replace(re, marker);
    }
    if (html.includes("</head>")) {
        return html.replace("</head>", `\n  ${marker}\n</head>`);
    }
    return `${marker}\n${html}`;
}

// Substituição segura à prova de bugs de cópia
function gerarHtmlDoItem({
    template,
    templateHash,
    item
}) {
    const slug = item.slug || slugify(item.titulo);
    const descricao = item.descricao || `Material de enfermagem sobre ${item.titulo}. Excelente para consulta rápida, estudos e prática clínica.`;
    const categoria = item.categoria || "documentos";

    let capa = item.capa || item.ficheiro;
    if (!capa.startsWith("/")) capa = "/" + capa;

    let download = item.download || item.ficheiro;
    if (!download.startsWith("/")) download = "/" + download;

    const tituloCurto = item.titulo.length > 35 ? item.titulo.substring(0, 35) + "..." : item.titulo;
    const seoTitle = `${item.titulo} - Download Biblioteca de Enfermagem`;
    const canonicalUrl = `https://www.calculadorasdeenfermagem.com.br/biblioteca/${slug}.html`;
    const hreflangTags = `<link rel="alternate" hreflang="pt-br" href="${canonicalUrl}">`;

    let html = template;
    html = html.replaceAll(tag("TITULO"), escapeHtml(item.titulo));
    html = html.replaceAll(tag("TITULO_CURTO"), escapeHtml(tituloCurto));
    html = html.replaceAll(tag("DESCRICAO"), escapeHtml(descricao));
    html = html.replaceAll(tag("URL_CAPA"), capa);
    html = html.replaceAll(tag("URL_DOWNLOAD"), download);
    html = html.replaceAll(tag("CATEGORIA_NOME"), escapeHtml(categoria.toUpperCase()));
    html = html.replaceAll(tag("SEO_TITLE"), escapeHtml(seoTitle));
    html = html.replaceAll(tag("SEO_DESCRIPTION"), escapeHtml(descricao));
    html = html.replaceAll(tag("CANONICAL_URL"), canonicalUrl);
    html = html.replaceAll(tag("HREFLANG_TAGS"), hreflangTags);

    html = ensureTemplateHashMarker(html, templateHash);
    return {
        slug,
        html
    };
}

// Construção e Logs
function construirBiblioteca() {
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

        const {
            slug,
            html
        } = gerarHtmlDoItem({
            template,
            templateHash,
            item
        });
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

    console.log("✅ build-biblioteca concluído com sucesso!");
    console.log(`Número de arquivos alterados (criados/atualizados): ${criados + atualizados}`);
    console.log(`Número de arquivos que não precisaram ser alterados: ${inalterados}`);
}

construirBiblioteca();