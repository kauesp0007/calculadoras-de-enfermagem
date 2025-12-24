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
async function traduzirNoGoogle(textoArray) {
    if (textoArray.length === 0) return [];
    
    // Google V2 aceita arrays de strings (batch)
    // Mas vamos limitar a 50 frases por vez para não travar
    const chunks = [];
    const chunkSize = 50;
    
    for (let i = 0; i < textoArray.length; i += chunkSize) {
        chunks.push(textoArray.slice(i, i + chunkSize));
    }

    let resultadosFinais = [];

    for (const chunk of chunks) {
        try {
            const response = await fetch(URL_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: chunk,            // Envia lista de frases
                    target: IDIOMA_ALVO,
                    format: 'text',      // Como já limpamos o HTML, mandamos como texto
                    source: 'pt'
                })
            });

            const data = await response.json();
            
            if (data.error) throw new Error(data.error.message);
            
            if (data.data && data.data.translations) {
                const traduzidos = data.data.translations.map(t => t.translatedText);
                resultadosFinais = resultadosFinais.concat(traduzidos);
            }
        } catch (e) {
            console.error(`   ⚠️ Erro no lote Google: ${e.message}`);
            // Se falhar, devolve o original para não quebrar
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

            // 1. Coleta TODOS os textos visíveis
            let nodesParaTraduzir = [];
            let textosOriginais = [];

            // Seleciona elementos que contém texto direto
            $('body').find('*').contents().each(function() {
                if (this.type === 'text') {
                    const texto = $(this).text().trim();
                    const parentTag = $(this).parent().get(0).tagName.toLowerCase();
                    
                    // Ignora scripts, estilos e textos vazios
                    if (texto.length > 1 && !['script', 'style', 'noscript', 'code'].includes(parentTag)) {
                        textosOriginais.push(texto);
                        nodesParaTraduzir.push(this);
                    }
                }
            });

            // 2. Coleta Meta Tags (Description, OG tags, Title)
            const metaSelectors = ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]'];
            let metaElements = [];
            
            metaSelectors.forEach(sel => {
                $(sel).each((i, el) => {
                    const txt = $(el).attr('content');
                    if (txt && txt.length > 1) {
                        textosOriginais.push(txt);
                        metaElements.push({ el: el, isMeta: true });
                    }
                });
            });

            // Inclui o <title> para tradução (garante que será traduzido também)
            const titleEl = $('head').find('title').get(0);
            if (titleEl) {
                const titleTxt = $(titleEl).text().trim();
                if (titleTxt && titleTxt.length > 0) {
                    textosOriginais.push(titleTxt);
                    metaElements.push({ el: titleEl, isTitle: true });
                }
            }

            // 3. Envia para o Google Traduzir tudo de uma vez (Batch)
            if (textosOriginais.length > 0) {
                console.log(`   -> Traduzindo ${textosOriginais.length} segmentos...`);
                const traducoes = await traduzirNoGoogle(textosOriginais);

                // 4. Aplica as traduções de volta no HTML
                let contador = 0;
                
                // Atualiza textos do corpo
                for (let i = 0; i < nodesParaTraduzir.length; i++) {
                    if (traducoes[contador]) {
                        $(nodesParaTraduzir[i]).replaceWith(traducoes[contador]);
                    }
                    contador++;
                }

                // Atualiza meta tags e <title>
                for (let i = 0; i < metaElements.length; i++) {
                    if (traducoes[contador]) {
                        if (metaElements[i].isTitle) {
                            $(metaElements[i].el).text(traducoes[contador]);
                        } else {
                            $(metaElements[i].el).attr('content', traducoes[contador]);
                        }
                    }
                    contador++;
                }
            }

            // 5. Ajustes Finais (Lang + Links Imagens)
            $('html').attr('lang', IDIOMA_ALVO);
            
            // Corrige imagens para raiz (opcional, igual ao script anterior)
            $('img').each((i, el) => {
                const src = $(el).attr('src');
                if (src && !src.startsWith('http') && !src.startsWith('../')) {
                    $(el).attr('src', `../${src}`);
                }
            });

            // Ajusta o canonical para apontar para a versão completa no idioma alvo
            try {
                // normaliza barras
                let relPath = file.replace(/\\/g, '/');
                // remove barras iniciais
                relPath = relPath.replace(/^\/+/, '');
                // constrói URL completa sem barras duplicadas
                const canonicalUrl = SITE_DOMAIN.replace(/\/+$/, '') + '/' + relPath.replace(/^\/+/, '');

                if ($('head').length === 0) {
                    // garante head
                    $('html').prepend('<head></head>');
                }

                if ($('head link[rel="canonical"]').length) {
                    $('head link[rel="canonical"]').attr('href', canonicalUrl);
                } else {
                    $('head').prepend(`<link rel="canonical" href="${canonicalUrl}">`);
                }
            } catch (e) {
                // não crítico: segue sem alterar canonical
            }

            fs.writeFileSync(file, $.html(), 'utf8');
            console.log(`   ✅ Concluído.`);

        } catch (error) {
            console.error(`   ❌ FALHA CRÍTICA: ${error.message}`);
        }
    }
    console.log(`\n=== FIM ===`);
})();