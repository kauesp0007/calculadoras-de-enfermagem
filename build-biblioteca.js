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
  const markerString = `<!-- ${TEMPLATE_HASH_MARKER_PREFIX}${templateHash} -->`;
  if (html.includes(TEMPLATE_HASH_MARKER_PREFIX)) {
    return html.replace(
      /<!-- BIBLIOTECA_ITEM_TEMPLATE_HASH:.*? -->/,
      markerString,
    );
  }
  return html + "\n" + markerString;
}

function gerarHtmlDoItem({ template, templateHash, item }) {
  let html = template;
  const slug = item.slug || slugify(item.titulo);
  const canonicalUrl = `https://www.calculadorasdeenfermagem.com.br/biblioteca/${slug}.html`;

  const seoTitle = `${item.titulo} - Download PDF, Vídeos e Imagens - Enfermagem`;
  const seoDesc =
    item.meta_descricao ||
    item.descricao ||
    `Baixe ou visualize ${item.titulo} focado em ${item.categoria} de enfermagem. Material de apoio educacional e clínico grátis.`;
  const seoKeywords =
    Array.isArray(item.keywords) && item.keywords.length > 0
      ? item.keywords.join(", ")
      : "enfermagem, saúde, material de apoio";

  let iconOverlay = "";
  let categoryBadge = "";
  let botaoAcao = "";

  if (item.categoria === "documentos") {
    iconOverlay = `<div class="icon-overlay"><i class="fa-regular fa-file-pdf text-red-500 text-xl"></i></div>`;
    categoryBadge = `<i class="fa-regular fa-file-pdf"></i> Documento PDF`;
    botaoAcao = `<a href="${item.ficheiro}" download class="w-full flex items-center justify-center gap-2 bg-[#1A3E74] hover:bg-[#153260] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"><i class="fa-solid fa-download"></i> Baixar Documento</a>`;
  } else if (item.categoria === "fotos") {
    iconOverlay = `<div class="icon-overlay"><i class="fa-regular fa-image text-blue-500 text-xl"></i></div>`;
    categoryBadge = `<i class="fa-regular fa-image"></i> Imagem / Infográfico`;
    botaoAcao = `<a href="${item.ficheiro}" download class="w-full flex items-center justify-center gap-2 bg-[#1A3E74] hover:bg-[#153260] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"><i class="fa-solid fa-download"></i> Baixar Imagem</a>`;
  } else if (item.categoria === "videos") {
    iconOverlay = `<div class="icon-overlay"><i class="fa-solid fa-play text-green-500 text-xl"></i></div>`;
    categoryBadge = `<i class="fa-solid fa-video"></i> Vídeo Clínico`;
    botaoAcao = `<a href="${item.ficheiro}" target="_blank" class="w-full flex items-center justify-center gap-2 bg-[#1A3E74] hover:bg-[#153260] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"><i class="fa-solid fa-play"></i> Visualizar Vídeo</a>`;
  }

  // =========================================================
  // INJEÇÃO DA DATA E PALAVRAS-CHAVE (Implementação do Passo 4)
  // =========================================================
  const dataAdicao = item.data_adicao || "Data não registrada";
  let keywordsHtml = "";

  if (Array.isArray(item.keywords) && item.keywords.length > 0) {
    // Converte o array de palavras num HTML de tags visuais
    keywordsHtml = item.keywords
      .map(
        (kw) =>
          `<span class="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm border border-gray-300">${escapeHtml(kw)}</span>`,
      )
      .join("");
  } else {
    keywordsHtml = `<span class="text-xs text-gray-500 italic">Nenhuma tag registrada</span>`;
  }
  // =========================================================

  const schemaOrgObj = {
    "@context": "https://schema.org",
    "@type": item.categoria === "videos" ? "VideoObject" : "CreativeWork",
    name: item.titulo,
    description: item.descricao,
    url: canonicalUrl,
    datePublished: item.data_adicao
      ? item.data_adicao.split("/").reverse().join("-")
      : "2024-01-01",
    keywords: seoKeywords,
    publisher: {
      "@type": "Organization",
      name: "Calculadoras de Enfermagem",
      logo: {
        "@type": "ImageObject",
        url: "https://www.calculadorasdeenfermagem.com.br/img/iconrodape1-160.webp",
      },
    },
  };

  if (item.categoria === "videos") {
    schemaOrgObj.thumbnailUrl = `https://www.calculadorasdeenfermagem.com.br${item.capa}`;
    schemaOrgObj.contentUrl = `https://www.calculadorasdeenfermagem.com.br${item.ficheiro}`;
  } else if (item.categoria === "fotos") {
    schemaOrgObj.image = `https://www.calculadorasdeenfermagem.com.br${item.ficheiro}`;
  }

  html = injetar(html, "<!-- SEO_TITLE -->", escapeHtml(seoTitle));
  html = injetar(html, "<!-- SEO_DESCRIPTION -->", escapeHtml(seoDesc));
  html = injetar(html, "<!-- SEO_KEYWORDS -->", escapeHtml(seoKeywords));
  html = injetar(html, "<!-- CANONICAL_URL -->", canonicalUrl);
  html = injetar(html, "<!-- ITEM_TITULO -->", escapeHtml(item.titulo));
  html = injetar(
    html,
    "<!-- ITEM_CAPA -->",
    escapeHtml(item.capa || "/img/placeholder.png"),
  );
  html = injetar(html, "<!-- ICONE_FORMATO_OVERLAY -->", iconOverlay);
  html = injetar(html, "<!-- ICONE_CATEGORIA_NOME -->", categoryBadge);
  html = injetar(html, "<!-- ITEM_DESCRICAO -->", escapeHtml(item.descricao));

  // Injeção dos novos marcadores
  html = injetar(html, "<!-- DATA_ADICAO -->", escapeHtml(dataAdicao));
  html = injetar(html, "<!-- KEYWORDS_HTML -->", keywordsHtml);

  html = injetar(html, "<!-- BOTAO_DOWNLOAD_VISUALIZAR -->", botaoAcao);
  html = injetar(
    html,
    "<!-- SCHEMA_ORG -->",
    `<script type="application/ld+json">\n${JSON.stringify(schemaOrgObj, null, 2)}\n</script>`,
  );

  html = ensureTemplateHashMarker(html, templateHash);
  return { slug, html };
}

function construirBiblioteca() {
  console.log("🚀 Iniciando build-biblioteca.js...");
  if (!fs.existsSync(JSON_DATABASE_FILE))
    return console.error("❌ biblioteca.json não encontrado");
  if (!fs.existsSync(TEMPLATE_FILE))
    return console.error(`❌ ${TEMPLATE_FILE} não encontrado`);

  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  const templateHash = sha256(template);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  let criados = 0,
    atualizados = 0,
    inalterados = 0;
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
    } else {
      fs.writeFileSync(outFile, html, "utf8");
      criados++;
    }
  });

  console.log(
    `✅ Build concluído: ${criados} criados, ${atualizados} atualizados, ${inalterados} inalterados.`,
  );
}

construirBiblioteca();
