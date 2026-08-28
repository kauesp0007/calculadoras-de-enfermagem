/* eslint-env node */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { iconeSvg } = require("./scripts/icone-svg");

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

    // Novo padrão catalogado: ANO_INSTITUICAO_CODIGO_TITULO
    // Ex: 2024_Ministerio_da_Saude_Protocolo_AVC
    const partes = baseName.split('_');
    if (partes.length < 2) return null;

    const resultado = { ano: null, instituicao: '', titulo: '', tipo: '' };

    // Detecta ano no início (4 dígitos)
    if (/^\d{4}$/.test(partes[0])) {
        resultado.ano = partes[0];
        partes.shift();
    } else if (partes[0] === 'XXXX') {
        partes.shift(); // ano desconhecido
    }

    // Detecta código interno (POP.DEA.006, MA.DENF.001, etc.)
    const codigoPattern = /^[A-Z]{2,}\.[A-Z]{2,}\.\d{3}$|^\d+\/\d{4}|^[A-Z]+\d*_\d+/;
    const codigoIdx = partes.findIndex(p => codigoPattern.test(p));
    if (codigoIdx > 0) {
        resultado.instituicao = partes.slice(0, codigoIdx).join(' ');
        resultado.codigo = partes[codigoIdx];
        partes.splice(0, codigoIdx + 1);
    } else if (partes.length >= 2) {
        const instParts = [];
        while (partes.length > 1 && /^[A-Z]/.test(partes[0])) {
            instParts.push(partes.shift());
        }
        if (instParts.length === 0 && partes.length > 0) {
            instParts.push(partes.shift());
        }
        resultado.instituicao = instParts.join(' ');
    }

    resultado.titulo = partes.join(' ').replace(/-/g, ' ');

    // Detecta tipo documental
    const tl = resultado.titulo.toLowerCase();
    if (tl.includes('resolucao') || tl.includes('resolução')) resultado.tipo = 'Resolução';
    else if (tl.includes('portaria')) resultado.tipo = 'Portaria';
    else if (tl.includes('protocolo') || tl.includes('pop')) resultado.tipo = 'Protocolo';
    else if (tl.includes('manual') || tl.includes('guia')) resultado.tipo = 'Manual';
    else if (tl.includes('diretriz') || tl.includes('guideline')) resultado.tipo = 'Diretriz';
    else if (tl.includes('artigo') || tl.includes('revisão')) resultado.tipo = 'Artigo Científico';
    else if (tl.includes('prova') || tl.includes('concurso')) resultado.tipo = 'Prova';
    else if (tl.includes('codigo') || tl.includes('ética')) resultado.tipo = 'Código de Ética';
    else if (tl.includes('parecer')) resultado.tipo = 'Parecer Técnico';
    else if (tl.includes('nota') && tl.includes('técnica')) resultado.tipo = 'Nota Técnica';
    else if (tl.includes('formul') || tl.includes('ficha')) resultado.tipo = 'Formulário';
    else resultado.tipo = 'Documento';

    return {
        ano: resultado.ano,
        instituicao: resultado.instituicao,
        titulo: resultado.titulo
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace(/\bDe\b/g, 'de')
            .replace(/\bDa\b/g, 'da')
            .replace(/\bDo\b/g, 'do')
            .replace(/\bEm\b/g, 'em')
            .replace(/\bNo\b/g, 'no')
            .replace(/\bNa\b/g, 'na')
            .replace(/\bPara\b/g, 'para')
            .replace(/\bCom\b/g, 'com')
            .replace(/\bDos\b/g, 'dos')
            .replace(/\bDas\b/g, 'das'),
        tipo: resultado.tipo,
        // Gera keywords a partir do título e metadados
        keywords: [
            ...resultado.titulo.toLowerCase().split(' ').filter(w => w.length > 3),
            ...(resultado.instituicao ? resultado.instituicao.toLowerCase().split(' ') : []),
            ...(resultado.tipo ? [resultado.tipo.toLowerCase()] : []),
            ...(resultado.ano ? [resultado.ano] : []),
            'enfermagem', 'download', 'pdf'
        ].filter((v, i, a) => a.indexOf(v) === i).join(', '),
        descricao: resultado.titulo
            ? `${resultado.tipo} sobre ${resultado.titulo}${resultado.instituicao ? ', por ' + resultado.instituicao : ''}${resultado.ano ? ' (' + resultado.ano + ')' : ''}. Material de enfermagem para download gratuito.`
            : null
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

        fileTypeBadgeHtml = `<div class="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black rounded uppercase tracking-wider w-fit shadow-sm" style="background-color: ${bgHex}; color: ${textHex};">${iconeSvg(icon)} ARQUIVO ${label}</div>`;
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
        "image": imagePath ? `https://www.calculadorasdeenfermagem.com.br${imagePath}` : "https://www.calculadorasdeenfermagem.com.br/iconpages-calculadoras-de-enfermagem.webp",
        "publisher": { "@type": "Organization", "name": "Calculadoras de Enfermagem", "logo": { "@type": "ImageObject", "url": "https://www.calculadorasdeenfermagem.com.br/iconpages-calculadoras-de-enfermagem.webp" } }
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