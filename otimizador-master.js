/* eslint-env node */
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const cheerio = require("cheerio");
const sizeOf = require("image-size");
const sharp = require("sharp");
const { execSync } = require("child_process");

// =====================================================================
// CONFIGURAÇÕES
// =====================================================================
const SITE_URL = "https://www.calculadorasdeenfermagem.com.br";
const AUTHOR_NAME = "Calculadoras de Enfermagem";
const DEFAULT_IMAGE = `${SITE_URL}/assets/logo-share.jpg`;

// ✅ Pastas de idiomas a otimizar
const IDIOMAS_PERMITIDOS = [
  "en",
  "es",
  "fr",
  "it",
  "de",
  "hi",
  "zh",
  "ja",
  "ru",
  "ko",
  "tr",
  "nl",
  "pl",
  "sv",
  "id",
  "vi",
  "uk",
  "ar",
];

// ✅ Português: arquivos HTML SOMENTE na raiz (./*.html)
const OTIMIZAR_PORTUGUES_RAIZ = true;

// Arquivos que nunca devem ser mexidos (em qualquer lugar)
const ARQUIVOS_PROIBIDOS = [
  "_language_selector.html",
  "footer.html",
  "menu-global.html",
  "global-body-elements.html",
  "downloads.html",
];

// Pastas que nunca devem ser tocadas (nem por engano)
const PASTAS_BLOQUEADAS_GLOBAIS = [
  "node_modules",
  ".git",
  "downloads",
  "biblioteca",
  "img",
  "assets",
  "css",
];

// Markers (compatível com versões antigas)
const MARKER_V2 = "OTIMIZADOR_MASTER_V2";
const MARKER_V3 = "OTIMIZADOR_MASTER_V3";

// IDs fixos para evitar duplicar blocos
const RESPONSIVE_STYLE_ID = "otimizador-master-responsive";
const SCHEMA_SCRIPT_ID = "otimizador-master-schema";

// ✅ Rodar comandos ao final
const RODAR_TAILWIND_AO_FINAL = true;


// =====================================================================
// LOCALIZAÇÃO / SEO POR IDIOMA
// =====================================================================
const LOCALE_MAP = {
  "pt-br": "pt_BR",
  pt: "pt_BR",
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  it: "it_IT",
  de: "de_DE",
  hi: "hi_IN",
  zh: "zh_CN",
  ja: "ja_JP",
  ru: "ru_RU",
  ko: "ko_KR",
  tr: "tr_TR",
  nl: "nl_NL",
  pl: "pl_PL",
  sv: "sv_SE",
  id: "id_ID",
  vi: "vi_VN",
  uk: "uk_UA",
  ar: "ar_SA",
};

const IFRAME_TITLE_MAP = {
  "pt-br": "Conteúdo incorporado",
  en: "Embedded content",
  es: "Contenido incrustado",
  fr: "Contenu intégré",
  it: "Contenuto incorporato",
  de: "Eingebettete Inhalte",
  hi: "एम्बेडेड सामग्री",
  zh: "嵌入内容",
  ja: "埋め込みコンテンツ",
  ru: "Встроенный контент",
  ko: "임베드된 콘텐츠",
  tr: "Gömülü içerik",
  nl: "Ingesloten inhoud",
  pl: "Osadzona treść",
  sv: "Inbäddat innehåll",
  id: "Konten tersemat",
  vi: "Nội dung nhúng",
  uk: "Вбудований вміст",
  ar: "محتوى مضمن",
};

// =====================================================================
// UTIL
// =====================================================================
function normalizarParaUrl(p) {
  return p.split(path.sep).join("/");
}

function isExternalOrDataUrl(src) {
  return (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("//") ||
    src.startsWith("data:")
  );
}

function temPastaBloqueadaNoCaminho(filePath) {
  const parts = normalizarParaUrl(filePath).split("/");
  return parts.some((p) => PASTAS_BLOQUEADAS_GLOBAIS.includes(p));
}

function estaNaRaiz(filePath) {
  return !normalizarParaUrl(filePath).includes("/");
}

function obterTopFolder(filePath) {
  const parts = normalizarParaUrl(filePath).split("/");
  return parts[0];
}

function ehArquivoDeIdioma(filePath) {
  const top = obterTopFolder(filePath);
  return IDIOMAS_PERMITIDOS.includes(top);
}

function obterLangDoArquivo(filePath) {
  if (estaNaRaiz(filePath)) return "pt-br";
  const top = obterTopFolder(filePath);
  if (IDIOMAS_PERMITIDOS.includes(top)) return top;
  return "pt-br";
}

function montarUrlCanonica(filePath) {
  const urlPath = normalizarParaUrl(filePath);
  return `${SITE_URL}/${urlPath}`;
}

function temClasseQueIndicaOverflow($, el) {
  const cls = ($(el).attr("class") || "").toLowerCase();
  return (
    cls.includes("overflow-x") ||
    cls.includes("overflow-auto") ||
    cls.includes("table-responsive")
  );
}

// =====================================================================
// BUSCA DE ARQUIVOS (APENAS raiz + pastas de idioma)
// =====================================================================
let files = [];

// 1) PT-BR raiz (somente *.html)
if (OTIMIZAR_PORTUGUES_RAIZ) {
  const rootHtml = glob.sync("*.html", {
    nodir: true,
    ignore: [
      "**/node_modules/**",
      "**/.git/**",
      "**/downloads/**",
      "**/biblioteca/**",
      "**/img/**",
      "**/assets/**",
      "**/css/**",
    ],
  });
  files.push(...rootHtml);
}

// 2) Idiomas (lang/**/*.html)
const langPatterns = IDIOMAS_PERMITIDOS.map((lang) => `${lang}/**/*.html`);
const langFiles = langPatterns.flatMap((pattern) =>
  glob.sync(pattern, {
    nodir: true,
    ignore: [
      "**/node_modules/**",
      "**/.git/**",
      "**/downloads/**",
      "**/biblioteca/**",
      "**/img/**",
      "**/assets/**",
      "**/css/**",
    ],
  })
);

files.push(...langFiles);
files = Array.from(new Set(files));

// =====================================================================
// RESPONSIVIDADE MOBILE (SAFE)
// =====================================================================
function garantirViewport(head) {
  if (head.find('meta[name="viewport"]').length === 0) {
    head.prepend('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    return true;
  }
  return false;
}

function garantirCssResponsivo(head) {
  if (head.find(`style#${RESPONSIVE_STYLE_ID}`).length > 0) return false;

  const css = `
/* ${MARKER_V3} - RESPONSIVE SAFE */
img, video { max-width: 100%; height: auto; }
iframe { max-width: 100%; }
body { overflow-x: hidden; }
.table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
`;

  head.append(`\n<style id="${RESPONSIVE_STYLE_ID}">${css}\n</style>\n`);
  return true;
}

function enveloparTabelasResponsivas($) {
  let mudou = false;

  $("table").each((i, table) => {
    const $table = $(table);
    const parent = $table.parent();

    // já está em wrapper responsivo?
    if (parent && parent.length) {
      const parentTag = (parent[0].tagName || "").toLowerCase();
      if (parentTag === "div" && temClasseQueIndicaOverflow($, parent)) return;
    }

    // se algum ancestral próximo já é overflow-x, não mexe
    let ancestor = parent;
    let depth = 0;
    while (ancestor && ancestor.length && depth < 4) {
      const tag = (ancestor[0].tagName || "").toLowerCase();
      if (tag === "div" && temClasseQueIndicaOverflow($, ancestor)) return;
      ancestor = ancestor.parent();
      depth++;
    }

    $table.wrap('<div class="table-responsive"></div>');
    mudou = true;
  });

  return mudou;
}

// =====================================================================
// SEO + PERFORMANCE (mantendo regras antigas)
// =====================================================================
function garantirPreconnectFonts(head) {
  let mudou = false;
  const preconnects = ["https://fonts.gstatic.com", "https://fonts.googleapis.com"];
  preconnects.forEach((url) => {
    if (head.find(`link[rel="preconnect"][href^="${url}"]`).length === 0) {
      head.prepend(`<link rel="preconnect" href="${url}" crossorigin>`);
      mudou = true;
    }
  });
  return mudou;
}

function garantirDisplaySwapGoogleFonts(head) {
  let mudou = false;
  head.find('link[href*="fonts.googleapis.com"]').each((i, el) => {
    let href = head.find(el).attr("href");
    if (href && !href.includes("display=swap")) {
      href = href.includes("?") ? `${href}&display=swap` : `${href}?display=swap`;
      head.find(el).attr("href", href);
      mudou = true;
    }
  });
  return mudou;
}

function garantirDeferScripts($) {
  let mudou = false;
  $("script[src]").each((i, el) => {
    const $el = $(el);
    const src = $el.attr("src");
    if (src && !$el.attr("async") && !$el.attr("defer") && !$el.attr("type")) {
      $el.attr("defer", "defer");
      mudou = true;
    }
  });
  return mudou;
}

// =====================================================================
// PROCESSAMENTO
// =====================================================================
async function processarArquivo(filePath) {
  const nomeArquivo = path.basename(filePath);

  if (path.extname(filePath) !== ".html") return false;
  if (ARQUIVOS_PROIBIDOS.includes(nomeArquivo)) return false;
  if (temPastaBloqueadaNoCaminho(filePath)) return false;

  const permitido =
    (OTIMIZAR_PORTUGUES_RAIZ && estaNaRaiz(filePath)) || ehArquivoDeIdioma(filePath);
  if (!permitido) return false;

  const original = fs.readFileSync(filePath, "utf8");
  if (!original || original.trim().length === 0) return false;

  const $ = cheerio.load(original, { decodeEntities: false });
  const lang = obterLangDoArquivo(filePath);
  const ogLocale = LOCALE_MAP[lang] || "pt_BR";
  const iframeTitle = IFRAME_TITLE_MAP[lang] || "Embedded content";

  const head = $("head");
  if (head.length === 0) return false;

  let mudouAlgo = false;

  // ==========================================================
  // 0) NÃO MEXER em canonical/hreflang existentes
  // ==========================================================
  const existeCanonical = head.find('link[rel="canonical"]').length > 0;
  const urlCanonica = montarUrlCanonica(filePath);

  // ==========================================================
  // 1) RESPONSIVIDADE MOBILE (SAFE)
  // ==========================================================
  mudouAlgo = garantirViewport(head) || mudouAlgo;
  mudouAlgo = garantirCssResponsivo(head) || mudouAlgo;
  mudouAlgo = enveloparTabelasResponsivas($) || mudouAlgo;

  // ==========================================================
  // 2) IMAGENS (alt/width/height/lazy/webp)
  // ==========================================================
  let primaryImage = DEFAULT_IMAGE;

  const imgPromises = $("img")
    .map(async (i, el) => {
      const $el = $(el);
      const src = $el.attr("src");
      if (!src) return;
      if (isExternalOrDataUrl(src)) return;

      if (primaryImage === DEFAULT_IMAGE) {
        const low = src.toLowerCase();
        if (!low.includes("logo") && !low.includes("icon")) {
          const abs = `${SITE_URL}/${src}`.replace(/\/+/g, "/").replace("https:/", "https://");
          primaryImage = abs;
        }
      }

      const baseDir = path.dirname(filePath);
      const imgPath = path.join(baseDir, src);
      if (!fs.existsSync(imgPath)) return;

      // alt
      const alt = $el.attr("alt");
      if (!alt || alt.trim() === "") {
        const altText = path.basename(src, path.extname(src)).replace(/[-_]/g, " ");
        $el.attr("alt", altText);
        mudouAlgo = true;
      }

      // loading lazy
      const isLogo = src.toLowerCase().includes("logo");
      if (!isLogo && !$el.attr("loading")) {
        $el.attr("loading", "lazy");
        mudouAlgo = true;
      }

      // width/height (CLS)
      try {
        const d = sizeOf(imgPath);
        if (d) {
          if (!$el.attr("width")) {
            $el.attr("width", d.width);
            mudouAlgo = true;
          }
          if (!$el.attr("height")) {
            $el.attr("height", d.height);
            mudouAlgo = true;
          }
        }
      } catch (_) {}

      // webp (somente jpg/png local)
      try {
        const ext = path.extname(src).toLowerCase();
        if ([".jpg", ".jpeg", ".png"].includes(ext)) {
          const webpPath = imgPath.replace(ext, ".webp");
          const srcWebp = src.replace(ext, ".webp");
          if (!fs.existsSync(webpPath)) {
            await sharp(imgPath).toFile(webpPath);
          }
          if (src !== srcWebp) {
            $el.attr("src", srcWebp);
            mudouAlgo = true;
          }
        }
      } catch (_) {}
    })
    .get();

  await Promise.all(imgPromises);

  // ==========================================================
  // 3) IFRAME / VIDEO
  // ==========================================================
  $("iframe, video").each((i, el) => {
    const $el = $(el);

    if (!$el.attr("loading")) {
      $el.attr("loading", "lazy");
      mudouAlgo = true;
    }

    if (el.tagName === "iframe" && !$el.attr("title")) {
      $el.attr("title", iframeTitle);
      mudouAlgo = true;
    }

    const src = $el.attr("src") || "";
    if (src.includes("youtube") || src.includes("vimeo")) {
      const style = $el.attr("style") || "";
      if (!style.includes("aspect-ratio") && !style.includes("height")) {
        $el.attr(
          "style",
          `${style}; aspect-ratio: 16 / 9; width: 100%;`.replace(/^; /, "")
        );
        mudouAlgo = true;
      }
    }
  });

  // ==========================================================
  // 4) HEAD / SEO (SEM tocar canonical/hreflang)
  // ==========================================================
  const title = $("title").text().trim() || AUTHOR_NAME;
  const rawDesc = head.find('meta[name="description"]').attr("content") || title;
  const description = String(rawDesc).replace(/[\r\n]+/g, " ").substring(0, 320);

  if (head.find('meta[name="author"]').length === 0) {
    head.append(`<meta name="author" content="${AUTHOR_NAME}">`);
    mudouAlgo = true;
  }

  const ogTags = {
    "og:locale": ogLocale,
    "og:type": "website",
    "og:title": title,
    "og:description": description,
    "og:url": urlCanonica,
    "og:site_name": AUTHOR_NAME,
    "og:image": primaryImage,
  };

  for (const [property, content] of Object.entries(ogTags)) {
    if (head.find(`meta[property="${property}"]`).length === 0) {
      head.append(`<meta property="${property}" content="${content}">`);
      mudouAlgo = true;
    }
  }

  const twTags = {
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": primaryImage,
  };

  for (const [name, content] of Object.entries(twTags)) {
    if (head.find(`meta[name="${name}"]`).length === 0) {
      head.append(`<meta name="${name}" content="${content}">`);
      mudouAlgo = true;
    }
  }

  // canonical: só cria se NÃO existir (não mexe no que já existe)
  if (!existeCanonical) {
    head.append(`<link rel="canonical" href="${urlCanonica}">`);
    mudouAlgo = true;
  }

  mudouAlgo = garantirPreconnectFonts(head) || mudouAlgo;
  mudouAlgo = garantirDisplaySwapGoogleFonts(head) || mudouAlgo;
  mudouAlgo = garantirDeferScripts($) || mudouAlgo;

  // Schema: só cria se não existir nenhum ld+json
  const jaTemSchema = head.find('script[type="application/ld+json"]').length > 0;
  if (!jaTemSchema && head.find(`script#${SCHEMA_SCRIPT_ID}`).length === 0) {
    const stats = fs.statSync(filePath);
    const dateModified = stats.mtime.toISOString();
    const datePublished = stats.birthtime.toISOString();

    const breadcrumbList = {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": title, "item": urlCanonica },
      ],
    };

    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          "name": AUTHOR_NAME,
          "url": SITE_URL,
          "logo": { "@type": "ImageObject", "url": `${SITE_URL}/assets/logo.png` },
        },
        {
          "@type": "MedicalWebPage",
          "@id": `${urlCanonica}/#webpage`,
          "url": urlCanonica,
          "name": title,
          "description": description,
          "inLanguage": lang,
          "isPartOf": { "@id": `${SITE_URL}/#website` },
          "primaryImageOfPage": { "@id": `${urlCanonica}/#primaryimage` },
          "datePublished": datePublished,
          "dateModified": dateModified,
          "author": { "@id": `${SITE_URL}/#organization` },
          "audience": { "@type": "MedicalAudience", "audienceType": "Clinician" },
          "specialty": { "@type": "MedicalSpecialty", "name": "Nursing" },
        },
        breadcrumbList,
      ],
    };

    head.append(
      `\n<!-- ${MARKER_V3} -->\n<script type="application/ld+json" id="${SCHEMA_SCRIPT_ID}">${JSON.stringify(
        schemaData
      )}</script>\n`
    );
    mudouAlgo = true;
  } else {
    const headHtml = head.html() || "";
    if (!headHtml.includes(MARKER_V3) && !headHtml.includes(MARKER_V2)) {
      head.append(`\n<!-- ${MARKER_V3} -->\n`);
      mudouAlgo = true;
    }
  }

  // ==========================================================
  // 5) Escrever SOMENTE se mudou
  // ==========================================================
  if (!mudouAlgo) return false;

  const resultado = $.html();
  if (resultado !== original) {
    fs.writeFileSync(filePath, resultado, "utf8");
    console.log(`✅ Otimizado: ${filePath}`);
    return true;
  }

  return false;
}

// =====================================================================
// RODAR COMANDOS AO FINAL (Tailwind )
// =====================================================================
function rodarComandoNoTerminal(comando) {
  // Executa usando o shell do sistema (Windows/PowerShell/ CMD)
  execSync(comando, { stdio: "inherit", shell: true });
}

function rodarTailwind() {
  if (!RODAR_TAILWIND_AO_FINAL) return;

  const cmd =
    ".\\node_modules\\.bin\\tailwindcss -i ./src/input.css -o ./public/output.css --minify";

  console.log("\n--- RODANDO TAILWIND (build/minify) ---");
  try {
    rodarComandoNoTerminal(cmd);
    console.log("--- TAILWIND OK ---\n");
  } catch (e) {
    console.error("❌ Falha ao rodar Tailwind. Verifique se tailwindcss está instalado e se ./src/input.css existe.");
    console.error(String(e?.message || e));
  }
}



// =====================================================================
// EXECUTOR
// =====================================================================
(async () => {
  console.log("--- INICIANDO OTIMIZADOR MASTER (RAIZ PT + IDIOMAS) + RESPONSIVO SAFE ---");
  console.log(`PT na raiz: ${OTIMIZAR_PORTUGUES_RAIZ ? "SIM (somente *.html)" : "NÃO"}`);
  console.log(`Pastas de idioma: ${IDIOMAS_PERMITIDOS.join(", ")}`);
  console.log(`Total de arquivos HTML selecionados: ${files.length}`);

  let totalOtimizados = 0;

  for (const file of files) {
    try {
      const mudou = await processarArquivo(file);
      if (mudou) totalOtimizados++;
    } catch (e) {
      console.error(`❌ Erro: ${file}:`, e.message);
    }
  }

  console.log(`--- OTIMIZAÇÃO CONCLUÍDA ---`);
  console.log(`Arquivos alterados nesta execução: ${totalOtimizados}`);

  // ✅ Após otimizar: rodar Tailwind 
  // (mesmo se não houve mudanças, pode ser útil rodar; se você preferir,
  // posso condicionar para rodar apenas se totalOtimizados > 0)
  rodarTailwind();
  
})();
