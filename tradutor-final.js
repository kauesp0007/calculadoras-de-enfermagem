const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');

// =====================================================================
// CONFIGURAÇÕES
// =====================================================================

const API_KEY = 'AIzaSyCO722vd9K9FHnZgzGrK5UAhIXiWzIW3gA';
const IDIOMA_ALVO = process.argv[2] || 'sv';
const PASTA_ALVO = process.argv[3] || IDIOMA_ALVO;
const SITE_DOMAIN =
  process.env.SITE_DOMAIN || 'https://www.calculadorasdeenfermagem.com.br';

// =====================================================================
// GOOGLE API
// =====================================================================

const URL_API = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

const files = glob.sync(`${PASTA_ALVO}/**/*.html`, {
  ignore: ['**/node_modules/**', '**/assets/**', '**/css/**', '**/js/**'],
  nodir: true
});

// =====================================================================
// FUNÇÕES AUXILIARES
// =====================================================================

async function traduzirNoGoogle(textos) {
  if (!textos.length) return [];

  const chunkSize = 50;
  let resultados = [];

  for (let i = 0; i < textos.length; i += chunkSize) {
    const chunk = textos.slice(i, i + chunkSize);

    try {
      const response = await fetch(URL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: chunk,
          target: IDIOMA_ALVO,
          source: 'pt',
          format: 'text'
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      resultados.push(
        ...data.data.translations.map(t => t.translatedText)
      );
    } catch (e) {
      console.error(`⚠️ Google API: ${e.message}`);
      resultados.push(...chunk);
    }
  }

  return resultados;
}

// =====================================================================
// 🔧 FUNÇÃO CORRIGIDA – STRINGS DE SCRIPT
// =====================================================================

function extrairStringsDeScript(js) {
  const regex = /(["'`])((?:\\.|[^\\])*?)\1/g;
  let match;
  let resultados = [];

  while ((match = regex.exec(js)) !== null) {
    const texto = match[2].trim();

    // ignora vazios
    if (texto.length < 2) continue;

    // ignora números puros
    if (/^\d+$/.test(texto)) continue;

    // ignora paths, extensões, urls
    if (/^(\/|\.\/|\.\.\/)/.test(texto)) continue;
    if (/\.js$|\.css$|\.html$|\.png$|\.jpg$|\.webp$/i.test(texto)) continue;
    if (/^https?:\/\//i.test(texto)) continue;

    // ignora template literal
    if (texto.includes('${')) continue;

    // ignora camelCase, snake_case, kebab-case técnicos
    if (
      /^[a-z]+[A-Z]/.test(texto) || // camelCase
      /^[a-z0-9_]+$/.test(texto) ||  // snake_case / ids
      /^[a-z0-9\-]+$/.test(texto)    // kebab-case
    ) {
      // ⚠️ EXCEÇÃO: palavras humanas curtas
      if (!/^(sim|não|nao|ok|voltar|enviar|limpar|calcular)$/i.test(texto)) {
        continue;
      }
    }

    resultados.push({
      original: texto,
      fullMatch: match[0],
      quote: match[1]
    });
  }

  return resultados;
}

// =====================================================================
// EXECUÇÃO
// =====================================================================

(async () => {
  console.log('\n=== TRADUTOR FINAL (HTML + META + ATRIBUTOS + SCRIPT) ===');
  console.log(`Idioma alvo: ${IDIOMA_ALVO.toUpperCase()}`);
  console.log(`Arquivos encontrados: ${files.length}\n`);

  for (const [i, file] of files.entries()) {
    console.log(`[${i + 1}/${files.length}] ${path.basename(file)}`);

    try {
      const content = fs.readFileSync(file, 'utf8');
      const $ = cheerio.load(content, { decodeEntities: false });

      let textos = [];
      let nodesTexto = [];
      let metaNodes = [];
      let attrNodes = [];
      let scriptNodes = [];

      // ==================================================
      // 1. TEXTO VISÍVEL
      // ==================================================
      $('body *')
        .contents()
        .each(function () {
          if (this.type === 'text') {
            const texto = $(this).text().trim();
            const parent = $(this).parent()[0]?.tagName?.toLowerCase();

            if (
              texto.length > 1 &&
              !['script', 'style', 'noscript', 'code'].includes(parent)
            ) {
              textos.push(texto);
              nodesTexto.push(this);
            }
          }
        });

      // ==================================================
      // 2. META TAGS + TITLE
      // ==================================================
      [
        'meta[name="description"]',
        'meta[property="og:title"]',
        'meta[property="og:description"]'
      ].forEach(sel => {
        $(sel).each((_, el) => {
          const txt = $(el).attr('content');
          if (txt && txt.length > 1) {
            textos.push(txt);
            metaNodes.push({ el });
          }
        });
      });

      const titleEl = $('head title').get(0);
      if (titleEl) {
        textos.push($(titleEl).text());
        metaNodes.push({ el: titleEl, isTitle: true });
      }

      // ==================================================
      // 3. ATRIBUTOS (placeholder, aria-label, title)
      // ==================================================
      $('[placeholder], [aria-label], [title]').each((_, el) => {
        ['placeholder', 'aria-label', 'title'].forEach(attr => {
          const val = $(el).attr(attr);
          if (val && val.length > 1) {
            textos.push(val);
            attrNodes.push({ el, attr });
          }
        });
      });

      // ==================================================
      // 4. SCRIPTS
      // ==================================================
      $('script').each((_, el) => {
        const js = $(el).html();
        if (!js) return;

        extrairStringsDeScript(js).forEach(item => {
          textos.push(item.original);
          scriptNodes.push({ el, ...item });
        });
      });

      // ==================================================
      // 5. TRADUÇÃO
      // ==================================================
      if (textos.length) {
        console.log(`   → Traduzindo ${textos.length} segmentos...`);
        const traducoes = await traduzirNoGoogle(textos);
        let c = 0;

        // Texto visível
        nodesTexto.forEach(n => {
          $(n).replaceWith(traducoes[c++] || $(n).text());
        });

        // Meta + title
        metaNodes.forEach(m => {
          if (m.isTitle) $(m.el).text(traducoes[c++]);
          else $(m.el).attr('content', traducoes[c++]);
        });

        // Atributos
        attrNodes.forEach(a => {
          $(a.el).attr(a.attr, traducoes[c++]);
        });

        // Scripts
        scriptNodes.forEach(s => {
          let js = $(s.el).html();
          const traduzido = traducoes[c++]
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'");
          js = js.replace(
            s.fullMatch,
            `${s.quote}${traduzido}${s.quote}`
          );
          $(s.el).html(js);
        });
      }

      // ==================================================
      // 6. AJUSTES FINAIS
      // ==================================================
      $('html').attr('lang', IDIOMA_ALVO);

      $('img').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.startsWith('http') && !src.startsWith('../')) {
          $(el).attr('src', `../${src}`);
        }
      });

      try {
        const rel = file.replace(/\\/g, '/').replace(/^\/+/, '');
        const canonical =
          SITE_DOMAIN.replace(/\/+$/, '') + '/' + rel;

        if (!$('head').length) $('html').prepend('<head></head>');

        if ($('link[rel="canonical"]').length) {
          $('link[rel="canonical"]').attr('href', canonical);
        } else {
          $('head').prepend(
            `<link rel="canonical" href="${canonical}">`
          );
        }
      } catch {}

      fs.writeFileSync(file, $.html(), 'utf8');
      console.log('   ✅ OK\n');
    } catch (e) {
      console.error(`   ❌ ERRO: ${e.message}\n`);
    }
  }

  console.log('=== FIM DO PROCESSO ===\n');
})();
