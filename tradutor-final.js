/* eslint-env node */
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const cheerio = require("cheerio");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

/* =====================================================
   CONFIGURAÇÕES
===================================================== */

// 🔑 Google Cloud Translation API
const API_KEY = "SUA_CHAVE_AQUI";

// Idioma alvo (ex: sv, en, fr)
const IDIOMA_ALVO = process.argv[2] || "sv";

// Pasta alvo (normalmente igual ao idioma)
const PASTA_ALVO = process.argv[3] || IDIOMA_ALVO;

// Domínio do site
const SITE_DOMAIN =
  process.env.SITE_DOMAIN ||
  "https://www.calculadorasdeenfermagem.com.br";

// API Google v2
const URL_API = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

/* =====================================================
   ARQUIVOS HTML (IGNORA JS / CSS)
===================================================== */
const files = glob.sync(`${PASTA_ALVO}/**/*.html`, {
  ignore: ["**/node_modules/**", "**/assets/**"],
  nodir: true,
});

/* =====================================================
   FUNÇÃO GOOGLE TRANSLATE (BATCH)
===================================================== */
async function traduzir(textos) {
  if (!textos.length) return [];

  const CHUNK = 50;
  let traduzidos = [];

  for (let i = 0; i < textos.length; i += CHUNK) {
    const parte = textos.slice(i, i + CHUNK);

    try {
      const res = await fetch(URL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: parte,
          target: IDIOMA_ALVO,
          source: "pt",
          format: "text",
        }),
      });

      const data = await res.json();

      if (data?.data?.translations) {
        traduzidos.push(
          ...data.data.translations.map((t) => t.translatedText)
        );
      } else {
        traduzidos.push(...parte);
      }
    } catch {
      traduzidos.push(...parte);
    }
  }

  return traduzidos;
}

/* =====================================================
   PROCESSAMENTO PRINCIPAL
===================================================== */
(async () => {
  console.log("\n=== TRADUTOR FINAL — MODO SEGURO ===");
  console.log(`Idioma: ${IDIOMA_ALVO} | Arquivos: ${files.length}\n`);

  for (const [i, file] of files.entries()) {
    console.log(`[${i + 1}/${files.length}] ${path.basename(file)}`);

    const html = fs.readFileSync(file, "utf8");
    const $ = cheerio.load(html, { decodeEntities: false });

    let textos = [];
    let alvos = [];

    /* ===============================
       1. TEXTO VISÍVEL (SEM SCRIPT)
    ================================ */
    $("body")
      .find("*")
      .contents()
      .each(function () {
        if (this.type === "text") {
          const texto = $(this).text().trim();
          const parent = $(this).parent().prop("tagName")?.toLowerCase();

          if (
            texto.length > 1 &&
            !["script", "style", "noscript", "code"].includes(parent)
          ) {
            textos.push(texto);
            alvos.push({ node: this, tipo: "text" });
          }
        }
      });

    /* ===============================
       2. ATRIBUTOS TRADUZÍVEIS
    ================================ */
    const attrs = ["placeholder", "title", "aria-label", "alt"];

    attrs.forEach((attr) => {
      $(`[${attr}]`).each((_, el) => {
        const val = $(el).attr(attr);
        if (val && val.length > 1) {
          textos.push(val);
          alvos.push({ node: el, tipo: "attr", attr });
        }
      });
    });

    /* ===============================
       3. META TAGS + TITLE
    ================================ */
    [
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
    ].forEach((sel) => {
      $(sel).each((_, el) => {
        const val = $(el).attr("content");
        if (val && val.length > 1) {
          textos.push(val);
          alvos.push({ node: el, tipo: "meta" });
        }
      });
    });

    const title = $("head title");
    if (title.length) {
      textos.push(title.text());
      alvos.push({ node: title, tipo: "title" });
    }

    /* ===============================
       4. TRADUÇÃO
    ================================ */
    const traduzidos = await traduzir(textos);

    let idx = 0;
    for (const alvo of alvos) {
      const t = traduzidos[idx++];
      if (!t) continue;

      if (alvo.tipo === "text") {
        $(alvo.node).replaceWith(t);
      } else if (alvo.tipo === "attr") {
        $(alvo.node).attr(alvo.attr, t);
      } else if (alvo.tipo === "meta") {
        $(alvo.node).attr("content", t);
      } else if (alvo.tipo === "title") {
        alvo.node.text(t);
      }
    }

    /* ===============================
       5. AJUSTES FINAIS
    ================================ */
    $("html").attr("lang", IDIOMA_ALVO);

    // Canonical
    try {
      const rel = file.replace(/\\/g, "/").replace(/^\/+/, "");
      const canonical =
        SITE_DOMAIN.replace(/\/+$/, "") + "/" + rel;

      if ($('link[rel="canonical"]').length) {
        $('link[rel="canonical"]').attr("href", canonical);
      } else {
        $("head").prepend(
          `<link rel="canonical" href="${canonical}">`
        );
      }
    } catch {}

    fs.writeFileSync(file, $.html(), "utf8");
    console.log("   ✔ OK");
  }

  console.log("\n=== FINALIZADO COM SEGURANÇA ===\n");
})();
