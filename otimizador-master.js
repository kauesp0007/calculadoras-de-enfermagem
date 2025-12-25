/* eslint-env node */
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const cheerio = require("cheerio");
const sizeOf = require("image-size");
const sharp = require("sharp");

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

// Marker: se o arquivo já foi processado/tem regra, ignorar
const MARKER_COMMENT = "OTIMIZADOR_MASTER_V2";
const MARKER_REGEX = new RegExp(`<!--\\s*${MARKER_COMMENT}\\s*-->`, "i");

// =====================================================================
// LOCALIZAÇÃO / SEO POR IDIOMA
// =====================================================================
const LOCALE_MAP = {
  // raiz (pt-br) será tratada como pt_BR
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
  // pt-br
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
  // raiz: não pode ter "/" no caminho normalizado
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
  // Se está na raiz: pt-br
  if (estaNaRaiz(filePath)) return "pt-br";
  // Se está numa pasta de idioma: retorna a pasta
  const top = obterTopFolder(filePath);
  if (IDIOMAS_PERMITIDOS.includes(top)) return top;
  // fallback
  return "pt-br";
}

function montarUrlCanonica(filePath) {
  const urlPath = normalizarParaUrl(filePath);
  return `${SITE_URL}/${urlPath}`;
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

// remove duplicados
files = Array.from(new Set(files));

// =====================================================================
// PROCESSAMENTO
// =====================================================================
async function processarArquivo(filePath) {
  const nomeArquivo = path.basename(filePath);

  // segurança global
  if (path.extname(filePath) !== ".html") return;
  if (ARQUIVOS_PROIBIDOS.includes(nomeArquivo)) return;
  if (temPastaBloqueadaNoCaminho(filePath)) return;

  // ✅ Só permite: raiz OU pastas de idioma
  const permitido =
    (OTIMIZAR_PORTUGUES_RAIZ && estaNaRaiz(filePath)) || ehArquivoDeIdioma(filePath);

  if (!permitido) return;

  let original = fs.readFileSync(filePath, "utf8");
  if (!original || original.trim().length === 0) return;

  // Se já tem marker: ignora
  if (MARKER_REGEX.test(original)) return;

  const $ = cheerio.load(original, { decodeEntities: false });
  const lang = obterLangDoArquivo(filePath);
  const ogLocale = LOCALE_MAP[lang] || "pt_BR";
  const iframeTitle = IFRAME_TITLE_MAP[lang] || "Embedded content";

  const head = $("head");
  if (head.length === 0) return;

  // ==========================================================
  // 0) NÃO MEXER em canonical/hreflang existentes
  // ==========================================================
  const existeCanonical = head.find('link[rel="canonical"]').length > 0;
  const existemAlternates = head.find('link[rel="alternate"][hreflang]').length > 0;
  void existemAlternates; // deixa explícito: não mexemos em hreflang

  const urlCanonica = montarUrlCanonica(filePath);

  // ==========================================================
  // 1) IMAGENS (alt/width/height/lazy/webp) — sem quebrar layout
  // ==========================================================
  let primaryImage = DEFAULT_IMAGE;

  const imgPromises = $("img")
    .map(async (i, el) => {
      let src = $(el).attr("src");
      if (!src) return;
      if (isExternalOrDataUrl(src)) return;

      // imagem primária (evita logo/icon)
      if (primaryImage === DEFAULT_IMAGE) {
        const low = src.toLowerCase();
        if (!low.includes("logo") && !low.includes("icon")) {
          const abs = `${SITE_URL}/${src}`.replace(/\/+/g, "/").replace("https:/", "https://");
          primaryImage = abs;
        }
      }

      // Resolve caminho físico: se estiver na raiz, relativo ao repo;
      // se estiver em pasta de idioma, relativo ao arquivo.
      const baseDir = path.dirname(filePath);
      const imgPath = path.join(baseDir, src);

      if (!fs.existsSync(imgPath)) return;

      // alt
      const alt = $(el).attr("alt");
      if (!alt || alt.trim() === "") {
        const altText = path.basename(src, path.extname(src)).replace(/[-_]/g, " ");
        $(el).attr("alt", altText);
      }

      // loading lazy (não forçar em logos)
      const isLogo = src.toLowerCase().includes("logo");
      if (!isLogo && !$(el).attr("loading")) {
        $(el).attr("loading", "lazy");
      }

      // width/height (CLS)
      try {
        const d = sizeOf(imgPath);
        if (d) {
          if (!$(el).attr("width")) $(el).attr("width", d.width);
          if (!$(el).attr("height")) $(el).attr("height", d.height);
        }
      } catch (_) {
        // ignora
      }

      // webp (somente jpg/png local)
      try {
        const ext = path.extname(src).toLowerCase();
        if ([".jpg", ".jpeg", ".png"].includes(ext)) {
          const webpPath = imgPath.replace(ext, ".webp");
          const srcWebp = src.replace(ext, ".webp");
          if (!fs.existsSync(webpPath)) {
            await sharp(imgPath).toFile(webpPath);
          }
          $(el).attr("src", srcWebp);
        }
      } catch (_) {
        // não quebra
      }
    })
    .get();

  await Promise.all(imgPromises);

  // ==========================================================
  // 2) IFRAME / VIDEO (loading + title localizado)
  // ==========================================================
  $("iframe, video").each((i, el) => {
    if (!$(el).attr("loading")) $(el).attr("loading", "lazy");

    if (el.tagName === "iframe" && !$(el).attr("title")) {
      $(el).attr("title", iframeTitle);
    }

    const src = $(el).attr("src") || "";
    if (src.includes("youtube") || src.includes("vimeo")) {
      const style = $(el).attr("style") || "";
      if (!style.includes("aspect-ratio") && !style.includes("height")) {
        $(el).attr(
          "style",
          `${style}; aspect-ratio: 16 / 9; width: 100%;`.replace(/^; /, "")
        );
      }
    }
  });

  // ==========================================================
  // 3) HEAD / SEO (SEM tocar canonical/hreflang existentes)
  // ==========================================================
  const title = $("title").text().trim() || AUTHOR_NAME;
  const rawDesc = head.find('meta[name="description"]').attr("content") || title;
  const description = String(rawDesc).replace(/[\r\n]+/g, " ").substring(0, 320);

  // viewport
  if (head.find('meta[name="viewport"]').length === 0) {
    head.prepend('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  }

  // author
  if (head.find('meta[name="author"]').length === 0) {
    head.append(`<meta name="author" content="${AUTHOR_NAME}">`);
  }

  // Open Graph
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
    }
  }

  // Twitter Cards
  const twTags = {
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": primaryImage,
  };

  for (const [name, content] of Object.entries(twTags)) {
    if (head.find(`meta[name="${name}"]`).length === 0) {
      head.append(`<meta name="${name}" content="${content}">`);
    }
  }

  // Canonical: só adiciona se NÃO existir (e não mexe em blocos existentes)
  if (!existeCanonical) {
    head.append(`<link rel="canonical" href="${urlCanonica}">`);
  }

  // font-display swap
  head.find('link[href*="fonts.googleapis.com"]').each((i, el) => {
    let href = $(el).attr("href");
    if (href && !href.includes("display=swap")) {
      href = href.includes("?") ? `${href}&display=swap` : `${href}?display=swap`;
      $(el).attr("href", href);
    }
  });

  // preconnect
  const preconnects = ["https://fonts.gstatic.com", "https://fonts.googleapis.com"];
  preconnects.forEach((url) => {
    if (head.find(`link[rel="preconnect"][href^="${url}"]`).length === 0) {
      head.prepend(`<link rel="preconnect" href="${url}" crossorigin>`);
    }
  });

  // defer scripts (não mexe em scripts que já tenham async/defer/type)
  $("script[src]").each((i, el) => {
    const src = $(el).attr("src");
    if (src && !$(el).attr("async") && !$(el).attr("defer") && !$(el).attr("type")) {
      $(el).attr("defer", "defer");
    }
  });

  // Schema: só adiciona se NÃO tiver nenhum ld+json
  const jaTemSchema = head.find('script[type="application/ld+json"]').length > 0;

  if (!jaTemSchema) {
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
      `\n<!-- ${MARKER_COMMENT} -->\n<script type="application/ld+json" id="otimizador-master-v2-schema">${JSON.stringify(
        schemaData
      )}</script>\n`
    );
  } else {
    // Se já tem schema, ainda marca para pular em próximas rodadas (sem remover nada)
    if (!head.html().includes(MARKER_COMMENT)) {
      head.append(`\n<!-- ${MARKER_COMMENT} -->\n`);
    }
  }

  // ==========================================================
  // 4) Escrever SOMENTE se mudou
  // ==========================================================
  const resultado = $.html();

  if (resultado !== original) {
    fs.writeFileSync(filePath, resultado, "utf8");
    console.log(`✅ Otimizado: ${filePath}`);
  }
}

// =====================================================================
// EXECUTOR
// =====================================================================
(async () => {
  console.log("--- INICIANDO OTIMIZADOR MASTER V2 (RAIZ PT + PASTAS DE IDIOMA) ---");
  console.log(`PT na raiz: ${OTIMIZAR_PORTUGUES_RAIZ ? "SIM (somente *.html)" : "NÃO"}`);
  console.log(`Pastas de idioma: ${IDIOMAS_PERMITIDOS.join(", ")}`);
  console.log(`Total de arquivos HTML selecionados: ${files.length}`);

  for (const file of files) {
    try {
      await processarArquivo(file);
    } catch (e) {
      console.error(`❌ Erro: ${file}:`, e.message);
    }
  }

  console.log("--- OTIMIZAÇÃO CONCLUÍDA ---");
})();
