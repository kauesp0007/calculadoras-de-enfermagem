const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');

// =====================================================================
// CONFIGURAÇÕES
// =====================================================================

// 1. SUA CHAVE DA API GOOGLE CLOUD (A mais nova que você criou)
const API_KEY = 'AIzaSyCO722vd9K9FHnZgzGrK5UAhIXiWzIW3gA';

// 2. IDIOMA DE DESTINO (nl, pl, sv, uk, vi)
// Pode ser passado como argumento: `node tradutor-final.js nl` (opcional)
const IDIOMA_ALVO = process.argv[2] || 'sv'; 

// 3. PASTA ALVO (por padrão usa o idioma alvo, mas pode ser sobrescrita)
// Pode ser passado como segundo argumento: `node tradutor-final.js nl nl` (opcional)
const PASTA_ALVO = process.argv[3] || IDIOMA_ALVO; 

// 4. DOMÍNIO DO SITE usado para construir canonical (sem '/' final)
// Pode ser configurado via variável de ambiente SITE_DOMAIN
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'https://www.calculadorasdeenfermagem.com.br';

// =====================================================================
// SCRIPT HÍBRIDO: CHEERIO (ESTRUTURA) + GOOGLE API (TRADUÇÃO)
// =====================================================================

// URL da API v2
const URL_API = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

const files = glob.sync(`${PASTA_ALVO}/**/*.html`, {
    ignore: ['**/node_modules/**', '**/assets/**', '**/css/**', '**/js/**'],
    nodir: true
});

// Função que conversa com o Google
async function traduzirNoGoogle(textoArray, opts = {}) {
    // opts.format -> 'text' | 'html'
    // opts.source -> optional source language code
    if (textoArray.length === 0) return [];

    const chunkSize = 10; // reduzimos tamanho por precaução para HTML maiores
    const chunks = [];
    for (let i = 0; i < textoArray.length; i += chunkSize) {
        chunks.push(textoArray.slice(i, i + chunkSize));
    }

    let resultadosFinais = [];

    for (const chunk of chunks) {
        try {
            const bodyPayload = {
                q: chunk,
                target: IDIOMA_ALVO,
                format: opts.format || 'text'
            };

            if (opts.source) bodyPayload.source = opts.source;

            const response = await fetch(URL_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

            if (data.data && data.data.translations) {
                const traduzidos = data.data.translations.map(t => t.translatedText);
                resultadosFinais = resultadosFinais.concat(traduzidos);
            } else {
                // caso inesperado, devolve originais
                resultadosFinais = resultadosFinais.concat(chunk);
            }
        } catch (e) {
            console.error(`   ⚠️ Erro no lote Google: ${e.message}`);
            resultadosFinais = resultadosFinais.concat(chunk);
        }
    }

    return resultadosFinais;
}

(async () => {
    console.log(`\n=== TRADUTOR HÍBRIDO (CHEERIO + GOOGLE CLOUD) ===`);
    console.log(`Alvo: ${IDIOMA_ALVO.toUpperCase()} | Arquivos: ${files.length}`);

    for (const [index, file] of files.entries()) {
        console.log(`[${index + 1}/${files.length}] Processando: ${path.basename(file)}...`);

        try {
            let content = fs.readFileSync(file, 'utf8');
            const $ = cheerio.load(content, { decodeEntities: false });

            // Tradução: envia o HTML completo ao Google com `format: 'html'`.
            console.log(`   -> Traduzindo HTML completo (${Buffer.byteLength(content, 'utf8')} bytes)...`);
            const traducoes = await traduzirNoGoogle([content], { format: 'html' });
            let novoHtml = content;
            if (traducoes && traducoes[0]) {
                novoHtml = traducoes[0];
            }

            // Recarrega o HTML traduzido para ajustes finais via cheerio
            const $$ = cheerio.load(novoHtml, { decodeEntities: false });

            // 5. Ajustes Finais (Lang + Links Imagens) no HTML traduzido
            $$.root().find('html').attr('lang', IDIOMA_ALVO);

            // Corrige imagens para raiz (opcional, igual ao script anterior)
            $$('img').each((i, el) => {
                const src = $$(el).attr('src');
                if (src && !src.startsWith('http') && !src.startsWith('../')) {
                    $$(el).attr('src', `../${src}`);
                }
            });

            // Ajusta o canonical para apontar para a versão completa no idioma alvo
            try {
                // normaliza barras
                let relPath = file.replace(/\\/g, '/');
                // remove barras iniciais
                relPath = relPath.replace(/^\/+/g, '');
                // constrói URL completa sem barras duplicadas
                const canonicalUrl = SITE_DOMAIN.replace(/\/+$/, '') + '/' + relPath.replace(/^\/+/, '');

                if ($$('head').length === 0) {
                    // garante head
                    $$('html').prepend('<head></head>');
                }

                if ($$('head link[rel="canonical"]').length) {
                    $$('head link[rel="canonical"]').attr('href', canonicalUrl);
                } else {
                    $$('head').prepend(`<link rel="canonical" href="${canonicalUrl}">`);
                }
            } catch (e) {
                // não crítico: segue sem alterar canonical
            }

            fs.writeFileSync(file, $$.html(), 'utf8');
            console.log(`   ✅ Concluído.`);

        } catch (error) {
            console.error(`   ❌ FALHA CRÍTICA: ${error.message}`);
        }
    }
    console.log(`\n=== FIM ===`);
})();