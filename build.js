/* eslint-env node */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const JSON_DATABASE_FILE = "biblioteca.json";
const TEMPLATE_FILE = "downloads.template.html";
const ITEMS_PER_PAGE = 20;
const OUTPUT_DIR = "downloads";

const TEMPLATE_HASH_MARKER_PREFIX = "DOWNLOADS_TEMPLATE_HASH:";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

function ensureTemplateHashMarker(html, templateHash) {
  const marker = "";
  const re = new RegExp("", "ig");

  if (re.test(html)) {
    return html.replace(re, marker);
  }
  if (html.includes("</head>")) {
    return html.replace("</head>", "\n  " + marker + "\n</head>");
  }
  return marker + "\n" + html;
}

function writeIfChanged(filepath, content) {
  if (fs.existsSync(filepath)) {
    const current = fs.readFileSync(filepath, "utf8");
    if (current === content) return "unchanged";
    fs.writeFileSync(filepath, content, "utf8");
    return "updated";
  }
  fs.writeFileSync(filepath, content, "utf8");
  return "created";
}

function criarCartaoHTML(item) {
  const link = "/biblioteca/" + slugify(item.titulo) + ".html";
  return '<a href="' + link + '" class="file-card" title="Acessar documento de enfermagem: ' + item.titulo + '">\n' +
         '  <figure style="margin: 0; padding: 0; width: 100%; height: 100%;">\n' +
         '    <img src="' + item.capa + '" class="file-card-image" alt="Material e documento de enfermagem sobre ' + item.titulo + '" title="' + item.titulo + '" loading="lazy" width="400" height="300" style="object-fit: cover;">\n' +
         '    <figcaption class="file-card-title">' + item.titulo + '</figcaption>\n' +
         '  </figure>\n' +
         '</a>';
}

function linkPagina(pageNum) {
  if (pageNum === 1) return "/downloads.html";
  return "/downloads/page" + pageNum + ".html";
}

function gerarPaginacao(total, atual) {
  let html = "";
  if (atual > 1) {
    html += '<a class="btn btn-mais" href="' + linkPagina(atual - 1) + '">« Anterior</a>';
  }
  for (let i = 1; i <= total; i++) {
    const activeClass = i === atual ? "active" : "";
    html += '<a class="btn ' + activeClass + '" href="' + linkPagina(i) + '">' + i + '</a>';
  }
  if (atual < total) {
    html += '<a class="btn btn-mais" href="' + linkPagina(atual + 1) + '">Próxima »</a>';
  }
  return html;
}

function construirPaginas() {
  if (!fs.existsSync(JSON_DATABASE_FILE)) {
    console.error("❌ biblioteca.json não encontrado");
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error("❌ " + TEMPLATE_FILE + " não encontrado");
    process.exitCode = 1;
    return;
  }

  const data = JSON.parse(fs.readFileSync(JSON_DATABASE_FILE, "utf8"));
  const template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  const templateHash = sha256(template);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const items = data.slice(start, start + ITEMS_PER_PAGE);

    let todos = "";
    let documentos = "";
    let fotos = "";
    let videos = "";

    items.forEach((item) => {
      const card = criarCartaoHTML(item);
      todos += card;
      if (item.categoria === "documentos") documentos += card;
      if (item.categoria === "fotos") fotos += card;
      if (item.categoria === "videos") videos += card;
    });

    const pagination = gerarPaginacao(totalPages, page);

    const seoTitle = "Biblioteca de Enfermagem — Página " + page;
    const seoDescription = "Biblioteca de Enfermagem com materiais, apostilas e documentos para download — Página " + page + " de " + totalPages + ".";
    const seoKeywords = "biblioteca de enfermagem, apostilas de enfermagem, protocolos clínicos, manuais oficiais, materiais para estudo, documentos para download, enfermagem";

    const canonicalUrl = page === 1
        ? "https://www.calculadorasdeenfermagem.com.br/downloads.html"
        : "https://www.calculadorasdeenfermagem.com.br/downloads/page" + page + ".html";

    let html = template;

    // SUBSTITUIÇÃO LINHA POR LINHA PARA EVITAR ERROS DE SINTAXE E ESPAÇAMENTOS
    html = html.replace(//gi, todos);
    html = html.replace(//gi, documentos);
    html = html.replace(//gi, fotos);
    html = html.replace(//gi, videos);
    html = html.replace(//gi, pagination);

    html = html.replace(//gi, seoTitle);
    html = html.replace(/&lt;!--\s*\[SEO_TITLE\]\s*--&gt;/gi, seoTitle);

    html = html.replace(//gi, seoDescription);
    html = html.replace(/&lt;!--\s*\[SEO_DESCRIPTION\]\s*--&gt;/gi, seoDescription);

    html = html.replace(//gi, seoKeywords);
    html = html.replace(/&lt;!--\s*\[SEO_KEYWORDS\]\s*--&gt;/gi, seoKeywords);

    html = html.replace(//gi, canonicalUrl);
    html = html.replace(//gi, canonicalUrl);

    // Fallbacks
    html = html.replace(/<title>.*<\/title>/gi, "<title>" + seoTitle + "</title>");
    html = html.replace(/<meta name="description" content="[^"]*"\s*>/gi, '<meta name="description" content="' + seoDescription + '">');
    html = html.replace(/<meta name="keywords" content="[^"]*"\s*>/gi, '<meta name="keywords" content="' + seoKeywords + '">');
    html = html.replace(/<link rel="canonical" href="[^"]*"\s*>/gi, '<link rel="canonical" href="' + canonicalUrl + '">');
    html = html.replace(/<meta property="og:url" content="[^"]*"\s*>/gi, '<meta property="og:url" content="' + canonicalUrl + '">');
    html = html.replace(/https:\/\/www\.calculadorasdeenfermagem\.com\.br\/downloads\.template\.html/gi, canonicalUrl);
    html = html.replace(/https:\/\/www\.calculadorasdeenfermagem\.com\.br\/downloads\.html/gi, canonicalUrl);

    html = ensureTemplateHashMarker(html, templateHash);

    if (page === 1) {
      const r1 = writeIfChanged("downloads.html", html);
      if (r1 === "created") created++;
      else if (r1 === "updated") updated++;
      else unchanged++;

      const outputLegacy = path.join(OUTPUT_DIR, "page1.html");
      const r2 = writeIfChanged(outputLegacy, html);
      if (r2 === "created") created++;
      else if (r2 === "updated") updated++;
      else unchanged++;
    } else {
      const output = path.join(OUTPUT_DIR, "page" + page + ".html");
      const r = writeIfChanged(output, html);
      if (r === "created") created++;
      else if (r === "updated") updated++;
      else unchanged++;
    }
  }

  console.log("✅ Downloads gerados com atualização inteligente por template!");
  console.log("➕ Criados: " + created);
  console.log("♻️ Atualizados: " + updated);
  console.log("⏭️ Inalterados: " + unchanged);
  console.log("🔖 Template hash atual: " + templateHash);
}

construirPaginas();