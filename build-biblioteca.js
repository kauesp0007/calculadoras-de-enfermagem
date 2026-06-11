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

function injetar(html, marcador, conteudo) {
    if (!html || !marcador) return html;
    return html.split(marcador).join(conteudo);
}

function ensureTemplateHashMarker(html, templateHash) {
    const marker = `<!-- ${TEMPLATE_HASH_MARKER_PREFIX}${templateHash} -->`;
    const re = new RegExp(`<!-- ${TEMPLATE_HASH_MARKER_PREFIX}.*? -->`, "ig");
    if (re.test(html)) return html.replace(re, marker);
    if (html.includes("</head>")) return html.replace("</head>", `\n  ${marker}\n</head>`);
    return `${marker}\n${html}`;
}

function gerarMetadataAutomatico(titulo) {
    const t = String(titulo).toLowerCase();
    let keywords = ["enfermagem", "material de estudo", "protocolos", "saúde"];
    let descricao = `Faça o download do material sobre ${titulo} na nossa Biblioteca de Enfermagem. Conteúdo técnico especializado para profissionais e estudantes.`;

    if (t.includes("escala")) {
        keywords.push("escalas de avaliação", "prática clínica");
        descricao = `Acesse a ${titulo} para avaliação clínica. Material essencial para a prática de enfermagem, facilitando o diagnóstico e monitoramento do paciente.`;
    } else if (t.includes("protocolo")) {
        keywords.push("normas técnicas", "procedimentos hospitalares");
        descricao = `Protocolo completo sobre ${titulo}. Guia passo a passo essencial para a padronização de condutas no ambiente hospitalar e atendimento ao paciente.`;
    } else if (t.includes("manual") || t.includes("guia")) {
        keywords.push("manual técnico", "guia prático");
        descricao = `Manual detalhado sobre ${titulo}. Obtenha orientações seguras e atualizadas para o suporte diário na assistência de enfermagem.`;
    }
    return { descricao, keywords };
}

function extrairDadosDoFicheiro(nomeFicheiro) {
    if (!nomeFicheiro) return null;
    const baseName = path.basename(nomeFicheiro, path.extname(nomeFicheiro));
    const partes = baseName.split('_');
    if (partes.length < 3) return null;
    const formatar = (str) => {
        const formatado = str.replace(/-/g, ' ');
        return formatado.charAt(0).toUpperCase() + formatado.slice(1);
    };
    return {
        titulo: formatar(partes[0]),
        keywords: partes[1].replace(/-/g, ', '),
        descricao: formatar(partes[2])
    };
}

function gerarHtmlDoItem({ template, templateHash, item }) {
    let html = template;
    const dadosArquivo = extrairDadosDoFicheiro(item.ficheiro);
    const titulo = item.titulo || (dadosArquivo ? dadosArquivo.titulo : "Sem título");
    const slug = item.slug || slugify(titulo);
    const automatico = gerarMetadataAutomatico(titulo);

    const descricaoRaw = (item.meta_descricao && item.meta_descricao.trim() !== "")
        ? item.meta_descricao
        : (item.descricao && item.descricao.length > 50 ? item.descricao : (dadosArquivo ? dadosArquivo.descricao : automatico.descricao));

    const descricao = escapeHtml(descricaoRaw);
    const tagsDoJson = (item.keywords && Array.isArray(item.keywords)) ? item.keywords.join(", ") : "";
    const keywords = tagsDoJson
        ? `${tagsDoJson}, ${automatico.keywords.join(", ")}`
        : (dadosArquivo
            ? `${dadosArquivo.keywords}, ${automatico.keywords.join(", ")}`
            : `${automatico.keywords.join(", ")}, ${titulo.toLowerCase()}, pdf, biblioteca de enfermagem`);

    const canonicalUrl = `https://www.calculadorasdeenfermagem.com.br/biblioteca/${slug}.html`;

    let imagePath = item.capa || item.ficheiro || "";
    if (imagePath && !imagePath.startsWith("/")) imagePath = "/" + imagePath;

    let filePath = item.download || item.ficheiro || "";
    if (filePath && !filePath.startsWith("/")) filePath = "/" + filePath;

    let ext = path.extname(filePath).toLowerCase().replace('.', '');
    if (!ext && filePath.match(/\.(mp4|webm|ogg)$/i)) ext = 'mp4';
    if (!ext && (item.categoria === 'fotos' || item.categoria === 'imagens')) ext = 'png';
    if (!ext && (item.categoria === 'documentos' || item.categoria === 'pdf')) ext = 'pdf';

    let fileTypeBadgeHtml = "";
    if (ext) {
        let label = ext.toUpperCase();
        let bgHex = "#f3f4f6";
        let textHex = "#374151";
        let icon = "fa-solid fa-file";

        if (ext === 'pdf') { bgHex = "#fee2e2"; textHex = "#b91c1c"; icon = "fa-solid fa-file-pdf"; }
        else if (['doc', 'docx'].includes(ext)) { label = "WORD"; bgHex = "#dbeafe"; textHex = "#1d4ed8"; icon = "fa-solid fa-file-word"; }
        else if (['xls', 'xlsx'].includes(ext)) { label = "EXCEL"; bgHex = "#dcfce3"; textHex = "#15803d"; icon = "fa-solid fa-file-excel"; }
        else if (['mp4', 'webm', 'ogg'].includes(ext)) { bgHex = "#f3e8ff"; textHex = "#7e22ce"; icon = "fa-solid fa-video"; }
        else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) { bgHex = "#d1fae5"; textHex = "#047857"; icon = "fa-solid fa-image"; }

        fileTypeBadgeHtml = `<div class="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black rounded uppercase tracking-wider w-fit shadow-sm" style="background-color: ${bgHex}; color: ${textHex};"><i class="${icon}"></i> ARQUIVO ${label}</div>`;
    }

    const cat = String(item.categoria || "").toLowerCase().trim();
    const isVideo = cat === "videos" || cat === "vídeos" || filePath.match(/\.(mp4|webm|ogg)$/i);

    let mediaPlayerHtml = "";
    if (isVideo) {
        mediaPlayerHtml = `
        <video controls preload="metadata" class="w-full rounded-lg shadow-sm" style="max-height: 600px; background-color: #0f172a;">
            <source src="${filePath}" type="video/mp4">
            <source src="${filePath}" type="video/webm">
            O seu navegador não suporta a reprodução de vídeo.
        </video>`;
    } else {
        mediaPlayerHtml = `<img src="${imagePath}" alt="${titulo}" class="max-w-full h-auto object-contain rounded-lg shadow-sm" style="max-height: 600px;">`;
    }

    const schemaOrgObj = {
        "@context": "https://schema.org",
        "@type": "ItemPage",
        "name": titulo,
        "description": descricaoRaw,
        "url": canonicalUrl,
        "image": imagePath ? `https://www.calculadorasdeenfermagem.com.br${imagePath}` : "https://www.calculadorasdeenfermagem.com.br/iconpages.webp",
        "publisher": { "@type": "Organization", "name": "Calculadoras de Enfermagem", "logo": { "@type": "ImageObject", "url": "https://www.calculadorasdeenfermagem.com.br/iconpages.webp" } }
    };

    html = injetar(html, "<!-- SEO_TITLE -->", titulo);
    html = injetar(html, "<!-- SEO_DESCRIPTION -->", descricao);
    html = injetar(html, "<!-- SEO_KEYWORDS -->", escapeHtml(keywords));
    html = injetar(html, "<!-- CANONICAL_URL -->", canonicalUrl);
    html = injetar(html, "<!-- [TITLE] -->", titulo);
    html = injetar(html, "<!-- [DESCRIPTION] -->", descricaoRaw);
    html = injetar(html, "<!-- [FILE] -->", filePath);
    html = injetar(html, "<!-- [MEDIA_PLAYER] -->", mediaPlayerHtml);
    html = injetar(html, "<!-- [FILE_TYPE] -->", fileTypeBadgeHtml);
    html = injetar(html, "<!-- SCHEMA_ORG -->", JSON.stringify(schemaOrgObj));

    html = ensureTemplateHashMarker(html, templateHash);
    return { slug, html };
}

function construirBiblioteca() {
    console.log("🚀 Iniciando build-biblioteca.js...");
    if (!fs.existsSync(JSON_DATABASE_FILE)) return console.error("❌ biblioteca.json não encontrado");
    if (!fs.existsSync(TEMPLATE_FILE)) return console.error(`❌ ${TEMPLATE_FILE} não encontrado`);

    const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
    const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
    const templateHash = sha256(template);

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

    let criados = 0, atualizados = 0, inalterados = 0;
    data.forEach((item) => {
        if (!item || !item.titulo || !item.ficheiro) return;
        const { slug, html } = gerarHtmlDoItem({ template, templateHash, item });
        const outFile = path.join(OUTPUT_DIR, `${slug}.html`);

        if (fs.existsSync(outFile)) {
            const current = fs.readFileSync(outFile, "utf8");
            if (current === html) { inalterados++; return; }
            fs.writeFileSync(outFile, html, "utf8");
            atualizados++;
        } else {
            fs.writeFileSync(outFile, html, "utf8");
            criados++;
        }
    });
    console.log(`✅ Concluído! Criados: ${criados} | Atualizados: ${atualizados} | Inalterados: ${inalterados}`);
}

construirBiblioteca();