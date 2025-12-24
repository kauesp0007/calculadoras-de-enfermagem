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

// Vamos ler APENAS os arquivos `.html` diretamente dentro da pasta alvo `PASTA_ALVO`.
// Não processamos subpastas nem criamos/alteramos outras pastas de idiomas.
if (!fs.existsSync(PASTA_ALVO) || !fs.statSync(PASTA_ALVO).isDirectory()) {
    console.error(`Pasta alvo '${PASTA_ALVO}' não existe ou não é um diretório. Saindo.`);
    process.exit(1);
}

const sourceFiles = glob.sync(`${PASTA_ALVO}/*.html`, {
    nodir: true
});

// Função que conversa com o Google
async function traduzirNoGoogle(textoArray) {
    if (textoArray.length === 0) return [];
    // Modo de teste local: evita chamadas à API e devolve textos marcados
    if (process.env.DRY_RUN === '1') {
        return textoArray.map(t => `[${IDIOMA_ALVO}] ${t}`);
    }
    
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
    console.log(`Alvo: ${IDIOMA_ALVO.toUpperCase()} | Arquivos: ${sourceFiles.length} (origem -> ${PASTA_ALVO}/)`);

    for (const [index, file] of sourceFiles.entries()) {
        const sourcePath = file; // ex: 'sv/arquivo.html'
        const targetPath = sourcePath; // sobrescreve no mesmo local dentro de PASTA_ALVO
        console.log(`[${index + 1}/${sourceFiles.length}] Processando: ${sourcePath} ...`);

        try {
            let content = fs.readFileSync(sourcePath, 'utf8');
            const $ = cheerio.load(content, { decodeEntities: false });

            // 1. Coleta TODOS os textos visíveis, atributos importantes e strings dentro de scripts
            let nodesParaTraduzir = [];
            let attrElements = []; // {el, attrName}
            let scriptStringElements = []; // {el, raw}
            let textosOriginais = [];

            // Seleciona elementos que contém texto direto
            $('body').find('*').each(function() {
                const el = $(this);

                // 1.a Text nodes (visíveis)
                el.contents().each(function() {
                    if (this.type === 'text') {
                        const texto = $(this).text().trim();
                        const parentTag = $(this).parent().get(0).tagName.toLowerCase();
                        if (texto.length > 1 && !['style', 'noscript', 'code'].includes(parentTag)) {
                            textosOriginais.push(texto);
                            nodesParaTraduzir.push(this);
                        }
                    }
                });

                // 1.b Atributos textuais relevantes
                const attrs = el.attr();
                if (attrs) {
                    Object.keys(attrs).forEach(attrName => {
                        const val = attrs[attrName];
                        if (!val || typeof val !== 'string') return;
                        const lower = attrName.toLowerCase();

                        // Traduzir atributos comuns e todos data-* (texto curto, não URLs)
                        const coreAttrs = ['alt', 'placeholder', 'title', 'aria-label', 'aria-labelledby', 'value', 'label'];
                        const idLikeAttrs = ['id', 'name', 'for'];
                        const isDataAttr = lower.startsWith('data-');
                        const looksLikeUrl = /^https?:\/\//i.test(val) || val.includes('/') || val.startsWith('../') || val.startsWith('./');

                        let shouldTranslate = false;
                        if (coreAttrs.includes(lower) || isDataAttr) {
                            shouldTranslate = true;
                        } else if (idLikeAttrs.includes(lower)) {
                            // Só traduzir ids/names/for curtos e sem hífens/underlines (evita quebrar seletores)
                            const shortSafe = /^[\p{L}\d]+$/u.test(val) && val.length > 0 && val.length <= 20 && !val.includes('-') && !val.includes('_');
                            shouldTranslate = shortSafe;
                        }

                        if (shouldTranslate && val.trim().length > 0 && !looksLikeUrl) {
                            textosOriginais.push(val);
                            attrElements.push({ el: el, attrName: attrName });
                        }
                    });
                }

                // 1.c Strings dentro de scripts inline serão coletadas separadamente abaixo
            });

            // 1.d Strings dentro de scripts inline (literais) e JSON-LD
            let jsonLdScripts = []; // {el, originalPlaceholders: [], rawJson}
            $('script').each((i, scriptEl) => {
                const s = $(scriptEl);
                const src = s.attr('src');
                if (src) return; // pula scripts externos
                const scriptType = (s.attr('type') || '').toLowerCase();

                const content = s.html();
                if (!content || !content.trim()) return;

                // Se for JSON-LD, processar como JSON e extrair strings
                if (scriptType.includes('ld+json')) {
                    try {
                        const parsed = JSON.parse(content);
                        const originals = [];
                        let idx = 0;

                        function walkAndPlaceholder(obj) {
                            if (typeof obj === 'string') {
                                const token = `__TRANSLATE_INDEX_${idx}__`;
                                originals.push(obj);
                                idx++;
                                return token;
                            } else if (Array.isArray(obj)) {
                                return obj.map(v => walkAndPlaceholder(v));
                            } else if (obj && typeof obj === 'object') {
                                const out = {};
                                Object.keys(obj).forEach(k => {
                                    out[k] = walkAndPlaceholder(obj[k]);
                                });
                                return out;
                            }
                            return obj;
                        }

                        const placeholderObj = walkAndPlaceholder(parsed);
                        const placeholderJson = JSON.stringify(placeholderObj);
                        // registra para tradução posterior
                        if (originals.length > 0) {
                            textosOriginais = textosOriginais.concat(originals);
                            jsonLdScripts.push({ el: s, originalsCount: originals.length, placeholderJson: placeholderJson });
                        }
                    } catch (e) {
                        // se não for JSON válido, ignora
                    }
                    return;
                }

                // Regex para encontrar literais: '...', "...", `...`
                const regex = /'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`/g;
                const matches = content.match(regex);
                if (matches && matches.length) {
                    // adiciona cada literal sem as aspas
                    matches.forEach(m => {
                        const quote = m[0];
                        const unquoted = m.slice(1, -1);

                        // Se for template literal (`...`) preservamos placeholders ${...}
                        if (quote === '`') {
                            // split preservando placeholders
                            const parts = unquoted.split(/(\$\{[^}]*\})/g);
                            const textPartIndexes = [];
                            parts.forEach((part, idx) => {
                                if (!part) return;
                                if (/^\$\{/.test(part)) return; // placeholder
                                // apenas partes de texto significativas
                                if (part.trim().length > 0) {
                                    textosOriginais.push(part);
                                    textPartIndexes.push(true);
                                } else {
                                    textPartIndexes.push(false);
                                }
                            });
                            // registra o template com infos para reconstrução
                            scriptStringElements.push({ el: s, raw: m, isTemplate: true, parts: parts, textPartCount: textPartIndexes.filter(Boolean).length });
                        } else {
                            // evita traduções de strings que pareçam com código/confiança baixa
                            if (unquoted && unquoted.trim().length > 0) {
                                textosOriginais.push(unquoted);
                                scriptStringElements.push({ el: s, raw: m, isTemplate: false });
                            }
                        }
                    });
                }
            });

            // 2. Coleta Meta Tags (description, twitter, og, keywords, etc.)
            let metaElements = [];
            $('head meta').each((i, el) => {
                const $el = $(el);
                const nameAttr = ($el.attr('name') || '').toLowerCase();
                const propAttr = ($el.attr('property') || '').toLowerCase();
                const content = $el.attr('content') || '';
                if (!content || content.length < 2) return;

                // inclui metas relevantes (description, title, twitter, og, keywords)
                const key = `${nameAttr} ${propAttr}`;
                if (/description|title|twitter|og|keywords|summary/i.test(key)) {
                    textosOriginais.push(content);
                    metaElements.push({ el: el, isMeta: true });
                }
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

                // 4. Aplica as traduções de volta no HTML e scripts
                let contador = 0;

                // 4.a Atualiza textos do corpo
                for (let i = 0; i < nodesParaTraduzir.length; i++) {
                    if (traducoes[contador]) {
                        $(nodesParaTraduzir[i]).replaceWith(traducoes[contador]);
                    }
                    contador++;
                }

                // 4.b Atualiza atributos coletados
                for (let i = 0; i < attrElements.length; i++) {
                    const item = attrElements[i];
                    if (traducoes[contador]) {
                        item.el.attr(item.attrName, traducoes[contador]);
                    }
                    contador++;
                }

                // 4.c Atualiza literais dentro de scripts inline: substitui cada ocorrência textual
                for (let i = 0; i < scriptStringElements.length; i++) {
                    const item = scriptStringElements[i];
                    if (!traducoes[contador]) { contador++; continue; }

                    if (item.isTemplate) {
                        // reconstruir template: substituir apenas as partes de texto na ordem em que foram coletadas
                        const parts = item.parts.slice();
                        const novoParts = [];
                        for (let p = 0; p < parts.length; p++) {
                            const part = parts[p];
                            if (/^\$\{/.test(part)) {
                                novoParts.push(part);
                            } else {
                                // pode ser parte vazia ou texto coletado
                                if (part && part.trim().length > 0) {
                                    const traduzido = traducoes[contador] || part;
                                    contador++;
                                    // escapar crases internas
                                    const safe = traduzido.replace(/`/g, '\\`');
                                    novoParts.push(safe);
                                } else {
                                    novoParts.push(part);
                                }
                            }
                        }
                        const novoLiteral = '`' + novoParts.join('') + '`';
                        // substitui a primeira ocorrência do raw no conteúdo do script
                        let contentScript = item.el.html();
                        const raw = item.raw;
                        const esc = raw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                        const re = new RegExp(esc);
                        contentScript = contentScript.replace(re, novoLiteral);
                        item.el.html(contentScript);
                    } else {
                        // substitui a primeira ocorrência do literal bruto (com aspas) no conteúdo do script
                        let content = item.el.html();
                        // escapando regex para a string literal exata
                        const raw = item.raw;
                        const esc = raw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                        const re = new RegExp(esc);
                        // insere com as mesmas aspas que existiam
                        const quote = raw[0];
                        const novoLiteral = quote + traducoes[contador].replace(new RegExp(quote, 'g'), '\\' + quote) + quote;
                        content = content.replace(re, novoLiteral);
                        item.el.html(content);
                        contador++;
                    }
                }

                // 4.c.2 Atualiza scripts JSON-LD substituindo tokens pelos textos traduzidos
                for (let j = 0; j < jsonLdScripts.length; j++) {
                    const entry = jsonLdScripts[j];
                    const count = entry.originalsCount;
                    // pega as traduções correspondentes
                    const translatedSlice = traducoes.slice(contador, contador + count);
                    contador += count;

                    // substitui cada token "__TRANSLATE_INDEX_i__" (estavam serializados entre aspas)
                    let outJson = entry.placeholderJson;
                    for (let k = 0; k < translatedSlice.length; k++) {
                        const tokenQuoted = `"__TRANSLATE_INDEX_${k}__"`;
                        const replacement = JSON.stringify(translatedSlice[k] || '');
                        outJson = outJson.replace(tokenQuoted, replacement);
                    }

                    // aplica no script
                    try {
                        // formata o JSON com identação mínima
                        const pretty = JSON.stringify(JSON.parse(outJson), null, 2);
                        entry.el.html(pretty);
                    } catch (e) {
                        // se algo falhar, coloca o JSON gerado sem formatação
                        entry.el.html(outJson);
                    }
                }

                // 4.d Atualiza meta tags e <title>
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

            // garante que a pasta alvo exista
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            // Segunda passagem segura: traduz fragmentos residuais detectados como português
            const ptRegex = /\b(Calcule|Calcular|Calcule|Calcule a|Calcule o|Resultado|Resultados|Totalpoäng|Totalpoäng|Total|pontua[cç][ãa]o|pontua[cç]oes)\b/i;
            let residualTexts = [];
            let residualNodes = [];

            $('body').find('*').each(function() {
                const el = $(this);
                // text nodes
                el.contents().each(function() {
                    if (this.type === 'text') {
                        const txt = $(this).text();
                        if (txt && ptRegex.test(txt)) {
                            residualTexts.push(txt.trim());
                            residualNodes.push({ node: this });
                        }
                    }
                });

                // atributos curtos
                const attrs = el.attr();
                if (attrs) {
                    Object.keys(attrs).forEach(attrName => {
                        const val = attrs[attrName];
                        if (val && typeof val === 'string' && ptRegex.test(val)) {
                            residualTexts.push(val);
                            residualNodes.push({ el: el, attrName: attrName });
                        }
                    });
                }
            });

            if (residualTexts.length > 0) {
                try {
                    console.log(`   -> Segunda passagem: traduzindo ${residualTexts.length} fragmentos residuais...`);
                    const traducoes2 = await traduzirNoGoogle(residualTexts);
                    for (let i = 0; i < residualNodes.length; i++) {
                        const target = residualNodes[i];
                        const trad = traducoes2[i] || residualTexts[i];
                        if (target.node) {
                            $(target.node).replaceWith(trad);
                        } else if (target.el && target.attrName) {
                            target.el.attr(target.attrName, trad);
                        }
                    }
                } catch (e) {
                    // não crítico
                    console.error('   ⚠️ Erro na segunda passagem:', e.message);
                }
            }

            fs.writeFileSync(targetPath, $.html(), 'utf8');
            console.log(`   ✅ Concluído.`);

        } catch (error) {
            console.error(`   ❌ FALHA CRÍTICA: ${error.message}`);
        }
    }
    console.log(`\n=== FIM ===`);
})();