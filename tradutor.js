const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');
const axios = require('axios'); // Necessário para a API V2

// ============================================================================
// --- CONFIGURAÇÕES ---
// ============================================================================

const API_KEY = "AIzaSyCO722vd9K9FHnZgzGrK5UAhIXiWzIW3gA";

// Idioma de destino (cria a pasta automaticamente, ex: sv, es, de, en)
const TARGET_LANG_CODE = 'sv'; 

const SOURCE_DIR = './';

// Deixe vazio [] para traduzir TODOS os arquivos HTML da pasta
const FILES_TO_TRANSLATE = []; 

const ARQUIVOS_IGNORADOS = [
  'avaliacaomeem.html', 'exemplo.html', 'googlef8af7cdb552164b.html', 'modelo.html',
  'novolayout.html', 'politicaapp.html', 'sitemapexemplo.html', 'vacinas_improved.html',
  'carreiras.html', 'checagem.html', 'como-procurar-emprego.html', 'concurso.html',
  'concursos-publicos.html', 'curriculo-ideal.html', 'curriculos.html', 'cursos.html',
  'dimensionamento.html', 'dinamicas-de-grupo.html', 'doacoes.html', 'educacao-continuada.html',
  'empreendedorismo-enfermagem.html', 'etarismo-enfermagem.html', 'gerador-curriculo-enfermagem.html',
  'guia-entrevista-enfermagem.html', 'legislacoes.html', 'marca-pessoal-enfermagem.html',
  'metasinternacionais.html', 'nandatax.html', 'notificacao-compulsoria.html', 'regrasmedicacoes.html',
  'salarios-e-perspectivas.html', 'site-de-vagas.html', 'soft-skills-enfermagem.html',
  'tabelas-vacinas-crianca.html', 'transicao-carreira-enfermagem.html', 'vacinas_improved.html',
  'vigilancia.html', 'rodape.html', 'nanda.html', 'insulina.html', 'heparina.html',
  'googlefc0a17cdd552164b.html', 'downloads.html', 'downloads.template.html', 'item.template.html',
  'node_modules'
];

const targetDir = `./${TARGET_LANG_CODE}`;

// ============================================================================
// --- LÓGICA DE TRADUÇÃO (API V2) ---
// ============================================================================

async function translateTextBatch(texts) {
    if (texts.length === 0) return [];

    // Filtra textos muito curtos ou apenas numéricos para economizar cota e tempo
    // Mantemos o índice original para remontar depois
    const inputs = texts.map((t, i) => ({ index: i, text: t.trim() }))
                        .filter(item => item.text.length > 1 && isNaN(item.text));

    if (inputs.length === 0) return texts;

    // A API V2 aceita arrays de strings no parâmetro 'q'
    // Vamos enviar em lotes de até 100 strings para não exceder limites de payload
    const BATCH_SIZE = 100;
    const translationsMap = {}; // Armazena índice -> tradução

    // Divide em sub-lotes
    for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
        const chunk = inputs.slice(i, i + BATCH_SIZE);
        const qParams = chunk.map(c => c.text);

        try {
            const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
            
            const response = await axios.post(url, {
                q: qParams,
                target: TARGET_LANG_CODE,
                format: 'text', // Usamos 'text' pois o Cheerio já limpou as tags HTML
                source: 'pt'    // Força origem em Português
            });

            const translatedData = response.data.data.translations;

            // Mapeia de volta
            translatedData.forEach((t, idx) => {
                const originalIndex = chunk[idx].index;
                translationsMap[originalIndex] = t.translatedText;
            });

        } catch (error) {
            console.error(`      ⚠️ Erro na API V2:`, error.response ? error.response.data : error.message);
            // Se der erro, mantemos o original para não quebrar o fluxo
        }
    }

    // Reconstrói o array original com as traduções
    const finalTranslations = texts.map((original, i) => {
        // Retorna a tradução se existir, senão retorna o original.
        // Decodifica entidades HTML que a API de tradução pode retornar (ex: &#39; -> ')
        let translated = translationsMap[i] || original;
        
        // Pequena limpeza de entidades HTML comuns que a API V2 gosta de inserir
        translated = translated.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        
        return translated;
    });

    return finalTranslations;
}

async function processFile(filePath) {
    const fileName = path.basename(filePath);
    const targetPath = path.join(targetDir, fileName);

    console.log(`\n🚀 Processando: ${fileName}`);

    // Lê o HTML
    let htmlContent = await fs.readFile(filePath, 'utf-8');
    
    // Carrega no Cheerio (modo relaxado para não quebrar HTML5 e não codificar caracteres)
    const $ = cheerio.load(htmlContent, { decodeEntities: false, xmlMode: false });

    // --- 1. COLETA DE TEXTOS VISÍVEIS (DOM) ---
    const textNodes = [];
    const attrNodes = []; 

    // Percorre elementos de texto visíveis
    $('body').find('*').contents().each(function() {
        if (this.type === 'text') {
            const text = $(this).text().trim();
            // Ignora scripts, estilos e textos vazios
            if (text.length > 1 && !$(this).parent().is('script, style, noscript')) {
                textNodes.push({ node: this, text: text });
            }
        }
    });

    // Percorre atributos importantes
    $('input, img, button, a').each(function() {
        const el = $(this);
        ['placeholder', 'title', 'alt', 'aria-label'].forEach(attr => {
            const val = el.attr(attr);
            if (val && val.trim().length > 1) {
                attrNodes.push({ el: el, attr: attr, text: val });
            }
        });
    });

    // Percorre Meta Tags de SEO
    const metaNodes = [];
    $('meta[name="description"], meta[name="keywords"], meta[property^="og:"], meta[name^="twitter:"]').each(function() {
        const content = $(this).attr('content');
        if (content && content.trim().length > 1) {
            metaNodes.push({ el: $(this), text: content });
        }
    });

    // --- 2. EXTRAÇÃO DE STRINGS NO JAVASCRIPT ---
    const jsRegex = /(description|conduta|classificacao|titulo|subtitulo|texto|msg|resposta):\s*(["'`])((?:(?=(\\?))\4.)*?)\2/g;
    let match;
    const jsMatches = [];
    
    // Executa regex no HTML bruto para achar strings dentro de scripts
    while ((match = jsRegex.exec(htmlContent)) !== null) {
        if (match[3].length > 2) { 
            jsMatches.push({ 
                fullMatch: match[0], 
                key: match[1], 
                quote: match[2], 
                text: match[3] 
            });
        }
    }

    // --- 3. TRADUÇÃO EM LOTES ---
    
    // Traduz Textos do DOM
    if (textNodes.length > 0) {
        console.log(`      Traduzindo ${textNodes.length} elementos de texto (DOM)...`);
        const domTexts = textNodes.map(n => n.text);
        const translatedDomTexts = await translateTextBatch(domTexts);
        textNodes.forEach((item, i) => { item.node.data = translatedDomTexts[i]; });
    }

    // Traduz Atributos
    if (attrNodes.length > 0) {
        const attrTexts = attrNodes.map(n => n.text);
        const translatedAttrTexts = await translateTextBatch(attrTexts);
        attrNodes.forEach((item, i) => { item.el.attr(item.attr, translatedAttrTexts[i]); });
    }

    // Traduz Meta Tags
    if (metaNodes.length > 0) {
        const metaTexts = metaNodes.map(n => n.text);
        const translatedMetaTexts = await translateTextBatch(metaTexts);
        metaNodes.forEach((item, i) => { item.el.attr('content', translatedMetaTexts[i]); });
    }

    // --- 4. FINALIZAÇÃO E JAVASCRIPT ---
    
    // Atualiza o atributo lang
    $('html').attr('lang', TARGET_LANG_CODE);
    
    // Gera o HTML base modificado pelo Cheerio
    let finalHtml = $.html();

    // Aplica traduções no JavaScript (substituição direta no texto final)
    if (jsMatches.length > 0) {
        console.log(`      Traduzindo ${jsMatches.length} strings dentro de Scripts...`);
        const jsTexts = jsMatches.map(m => m.text);
        const translatedJsTexts = await translateTextBatch(jsTexts);

        // Substituição segura
        for (let i = 0; i < jsMatches.length; i++) {
            const original = jsMatches[i].text;
            const translated = translatedJsTexts[i];
            
            if (original !== translated && translated) {
                const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regexReplace = new RegExp(`${jsMatches[i].key}:\\s*${jsMatches[i].quote}${escapedOriginal}${jsMatches[i].quote}`, 'g');
                
                finalHtml = finalHtml.replace(regexReplace, `${jsMatches[i].key}: ${jsMatches[i].quote}${translated}${jsMatches[i].quote}`);
            }
        }
    }

    // Fix de segurança para inputs numéricos (evita scroll mudando valor)
    if (finalHtml.includes('type="number"') && !finalHtml.includes('addEventListener(\'wheel\'')) {
        const scrollFix = `
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        document.querySelectorAll('input[type="number"]').forEach(function(input) {
          input.addEventListener('wheel', function(e) { input.blur(); });
        });
      });
    </script>
    </body>`;
        finalHtml = finalHtml.replace('</body>', scrollFix);
    }

    // Salva o arquivo
    await fs.ensureDir(targetDir);
    await fs.writeFile(targetPath, finalHtml);
    console.log(`   ✅ Salvo em: ${targetPath}`);
}

async function main() {
    try {
        console.log("🔍 Configurando tradução (API V2)...");
        
        let filesToProcess = [];

        if (FILES_TO_TRANSLATE.length === 0) {
            const allFiles = glob.sync(`${SOURCE_DIR}/*.html`);
            
            filesToProcess = allFiles.filter(file => {
                const baseName = path.basename(file);
                return !ARQUIVOS_IGNORADOS.includes(baseName) && !baseName.startsWith('_');
            });
        } else {
            filesToProcess = FILES_TO_TRANSLATE.map(f => path.join(SOURCE_DIR, f));
        }

        if (filesToProcess.length === 0) {
            console.log("⚠️ Nenhum arquivo para traduzir.");
            return;
        }

        console.log(`📝 Encontrados ${filesToProcess.length} arquivos.`);

        for (const file of filesToProcess) {
            await processFile(file);
        }

        console.log("\n🎉 Tradução em massa finalizada!");

    } catch (error) {
        console.error("❌ Erro fatal no script:", error);
    }
}

main();