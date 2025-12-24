const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');
const axios = require('axios'); 

// ============================================================================
// --- CONFIGURAÇÕES ---
// ============================================================================

const API_KEY = "AIzaSyCO722vd9K9FHnZgzGrK5UAhIXiWzIW3gA";

// Idioma de destino (ex: 'sv', 'es', 'en')
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
  'node_modules', 'tradutor.js', 'package.json', 'package-lock.json'
];

const targetDir = `./${TARGET_LANG_CODE}`;

// ============================================================================
// --- LÓGICA DE TRADUÇÃO (API V2) ---
// ============================================================================

async function translateTextBatch(texts) {
    if (texts.length === 0) return [];

    const inputs = texts.map((t, i) => ({ index: i, text: t.trim() }))
                        .filter(item => item.text.length > 1 && isNaN(item.text));

    if (inputs.length === 0) return texts;

    const BATCH_SIZE = 50; 
    const translationsMap = {}; 

    for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
        const chunk = inputs.slice(i, i + BATCH_SIZE);
        const qParams = chunk.map(c => c.text);

        try {
            const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
            
            const response = await axios.post(url, {
                q: qParams,
                target: TARGET_LANG_CODE,
                format: 'text',
                source: 'pt'
            });

            const translatedData = response.data.data.translations;

            translatedData.forEach((t, idx) => {
                const originalIndex = chunk[idx].index;
                translationsMap[originalIndex] = t.translatedText;
            });

        } catch (error) {
            console.error(`      ⚠️ Erro na API V2:`, error.response ? error.response.data : error.message);
        }
    }

    const finalTranslations = texts.map((original, i) => {
        let translated = translationsMap[i] || original;
        // Limpeza de entidades HTML
        translated = translated.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return translated;
    });

    return finalTranslations;
}

async function processFile(filePath) {
    const fileName = path.basename(filePath);
    const targetPath = path.join(targetDir, fileName);

    console.log(`\n🚀 Processando: ${fileName}`);

    let htmlContent = await fs.readFile(filePath, 'utf-8');

    // --- PROTEÇÃO DE SCRIPTS (PASSO CRÍTICO) ---
    // Removemos os scripts temporariamente para o Cheerio não estragar a lógica JS (ex: mudar && para &amp;&amp;)
    const scripts = [];
    htmlContent = htmlContent.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, (match) => {
        scripts.push(match);
        return `<!--SCRIPT_PLACEHOLDER_${scripts.length - 1}-->`;
    });
    
    // Carrega HTML sem scripts no Cheerio
    const $ = cheerio.load(htmlContent, { decodeEntities: false, xmlMode: false });

    // --- 1. COLETA E TRADUÇÃO DE TEXTOS VISÍVEIS (DOM) ---
    const textNodes = [];
    const attrNodes = []; 
    const metaNodes = [];
    const titleNodes = [];

    // Título
    $('title').each(function() {
        const text = $(this).text().trim();
        if (text.length > 1) titleNodes.push({ el: $(this), text: text });
    });

    // Body Texts
    $('body').find('*').contents().each(function() {
        if (this.type === 'text') {
            const text = $(this).text().trim();
            if (text.length > 1 && !$(this).parent().is('style, noscript')) {
                textNodes.push({ node: this, text: text });
            }
        }
    });

    // Atributos
    $('input, img, button, a').each(function() {
        const el = $(this);
        ['placeholder', 'title', 'alt', 'aria-label'].forEach(attr => {
            const val = el.attr(attr);
            if (val && val.trim().length > 1) {
                attrNodes.push({ el: el, attr: attr, text: val });
            }
        });
    });

    // Meta Tags
    $('meta[name="description"], meta[name="keywords"], meta[property^="og:"], meta[name^="twitter:"]').each(function() {
        const content = $(this).attr('content');
        if (content && content.trim().length > 1) {
            metaNodes.push({ el: $(this), text: content });
        }
    });

    // --- EXECUTA TRADUÇÃO DO DOM ---
    if (titleNodes.length > 0) {
        console.log(`      Traduzindo título...`);
        const trans = await translateTextBatch(titleNodes.map(n => n.text));
        titleNodes.forEach((item, i) => { item.el.text(trans[i]); });
    }

    if (textNodes.length > 0) {
        console.log(`      Traduzindo ${textNodes.length} textos do corpo...`);
        const trans = await translateTextBatch(textNodes.map(n => n.text));
        textNodes.forEach((item, i) => { item.node.data = trans[i]; });
    }

    if (attrNodes.length > 0) {
        const trans = await translateTextBatch(attrNodes.map(n => n.text));
        attrNodes.forEach((item, i) => { item.el.attr(item.attr, trans[i]); });
    }

    if (metaNodes.length > 0) {
        const trans = await translateTextBatch(metaNodes.map(n => n.text));
        metaNodes.forEach((item, i) => { item.el.attr('content', trans[i]); });
    }

    // Atualiza Lang
    $('html').attr('lang', TARGET_LANG_CODE);
    
    // Recupera HTML base traduzido
    let finalHtml = $.html();

    // --- 2. TRADUÇÃO E RESTAURAÇÃO DOS SCRIPTS ---
    console.log(`      Processando ${scripts.length} blocos de script...`);
    
    // Regex poderosa para capturar strings dentro de JS
    // Captura: chaves comuns (description: "...") OU atribuições diretas (innerHTML = "...") OU alertas (alert("..."))
    // Adicionado 'alert', 'confirm', 'prompt' e atribuições de variáveis
    const jsRegex = /(description|conduta|classificacao|titulo|subtitulo|texto|msg|resposta|resultadoTexto|equipoTexto|unidadeTexto|innerHTML|textContent|placeholder|alert|confirm|prompt)\s*[:=\(]\s*(["'`])((?:(?=(\\?))\4[\s\S])*?)\2/g;

    for (let i = 0; i < scripts.length; i++) {
        let scriptCode = scripts[i];
        const jsMatches = [];
        let match;

        // Encontra strings traduzíveis no script
        while ((match = jsRegex.exec(scriptCode)) !== null) {
            // match[3] é o conteúdo. Ignora se for curto ou parecer código
            if (match[3] && match[3].length > 2 && !match[3].includes('$(') && !match[3].includes('document.')) { 
                jsMatches.push({ 
                    fullMatch: match[0], 
                    key: match[1], 
                    quote: match[2], 
                    text: match[3] 
                });
            }
        }

        if (jsMatches.length > 0) {
            const jsTexts = jsMatches.map(m => m.text);
            const translatedJsTexts = await translateTextBatch(jsTexts);

            // Substitui no código do script
            for (let j = 0; j < jsMatches.length; j++) {
                const original = jsMatches[j].text;
                const translated = translatedJsTexts[j];
                
                if (original !== translated && translated) {
                    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    
                    // Reconstrói o padrão para substituir (Key + Separador + Quote + Texto + Quote)
                    // Usa a parte inicial do match original (ex: 'alert(') para manter a sintaxe
                    const prefix = jsMatches[j].fullMatch.split(jsMatches[j].quote)[0]; 
                    
                    const regexReplace = new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${jsMatches[j].quote}${escapedOriginal}${jsMatches[j].quote}`);
                    
                    scriptCode = scriptCode.replace(regexReplace, `${prefix}${jsMatches[j].quote}${translated}${jsMatches[j].quote}`);
                }
            }
        }

        // Devolve o script processado para o HTML final
        finalHtml = finalHtml.replace(`<!--SCRIPT_PLACEHOLDER_${i}-->`, scriptCode);
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

    await fs.ensureDir(targetDir);
    await fs.writeFile(targetPath, finalHtml);
    console.log(`   ✅ Salvo em: ${targetPath}`);
}

async function main() {
    try {
        console.log(`🔍 Configurando tradução (API V2) para ${TARGET_LANG_CODE}...`);
        
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