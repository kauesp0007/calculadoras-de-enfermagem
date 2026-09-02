// cwv-core.js — FONTE ÚNICA das regras de auditoria e correção CWV/performance.
// Compartilhado por: auditar-cwv.js (massa), corrigir-cwv.js (massa) e cwv-gate.js (gate automático).
// Somente funções puras (não fazem I/O): analyze() e correct().
'use strict';

function heroRegion(content) {
    const h1 = content.indexOf('<h1');
    if (h1 === -1) return null;
    const start = Math.max(0, content.lastIndexOf('<main', h1));
    const endSec = content.indexOf('</section>', h1);
    const end = endSec !== -1 ? endSec + 10 : Math.min(content.length, h1 + 1500);
    return {
        start,
        end,
        text: content.slice(start, end),
        h1Tag: content.slice(h1, content.indexOf('>', h1) + 1)
    };
}

// Análise estática. Retorna { flags: {...} } com todas as detecções.
function analyze(content) {
    const r = { flags: {} };
    const f = r.flags;
    const hero = heroRegion(content);
    const heroText = hero ? hero.text : '';
    f.hero_backdrop_blur = /backdrop-blur[\w-]*/.test(heroText); f.hero_blur_pesado = /blur-(2xl|3xl)/.test(heroText);
    f.hero_drop_shadow = /drop-shadow(-\w+)?/.test(heroText);
    f.hero_shadow_pesado = /shadow-(2xl|3xl)/.test(heroText);
    f.font_inter = /\bfont-inter\b/.test(content);
    f.h1_font_sans = hero ? /font-sans/.test(hero.h1Tag) : true;
    f.body_font_sans = /<body\b[^>]*\bfont-sans\b/.test(content);

    // Nunito: preloads ociosos quando a família não é usada fora de @font-face/preload
    const lines = content.split('\n');
    let nunitoUso = 0;
    lines.forEach((l) => {
        if (l.includes('Nunito') && !l.includes('@font-face') && !l.includes('preload')) nunitoUso++;
    });
    const nunitoPreloads = lines.filter((l) => l.includes('preload') && l.includes('/nunito/')).length;
    f.nunito_preloads_ociosos = nunitoUso === 0 && nunitoPreloads > 0;

    // Imagens (ignora comentários HTML)
    const semComentarios = content.replace(/<!--[\s\S]*?-->/g, '');
    const imgs = [...semComentarios.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    let firstImg = true;
    let semLazy = 0;
    let semAlt = 0;
    let semDecoding = 0;
    let semDims = 0;
    let total = 0;
    imgs.forEach((tag) => {
        if (/id="lightboxImg"/.test(tag) || /src=""\s/.test(tag) || /src=""/.test(tag)) return;
        total++;
        if (!/alt=/.test(tag)) semAlt++;
        if (!/loading=/.test(tag) && !firstImg) semLazy++;
        if (!/decoding=/.test(tag)) semDecoding++;
        if (!/width=/.test(tag) || !/height=/.test(tag)) semDims++;
        firstImg = false;
    });
    f.imgs_total = total;
    f.imgs_sem_lazy = semLazy;
    f.imgs_sem_alt = semAlt;
    f.imgs_sem_decoding = semDecoding;
    f.imgs_sem_dimensoes = semDims;

    return r;
}

// Traduz flags em problemas estruturados. autoFixable = pode ser corrigido com segurança.
function problems(analysis) {
    const f = analysis.flags;
    const out = [];
    const add = (id, rule, severity, autoFixable, detail) =>
        out.push({ id, rule, severity, autoFixable, detail });

    if (f.font_inter) add('font-inter', 'classe font-inter inexistente', 'high', true, 'trocar font-inter → font-sans');
    if (f.hero_blur_pesado) add('hero-blur-pesado', 'blur 2xl/3xl no hero', 'medium', true, 'reduzir para blur-xl');
    if (f.hero_drop_shadow) add('hero-drop-shadow', 'drop-shadow pesado no hero', 'medium', true, 'remover drop-shadow');
    if (f.hero_shadow_pesado) add('hero-shadow-pesado', 'shadow 2xl/3xl no hero', 'medium', true, 'reduzir para shadow-lg');
    if (!f.h1_font_sans) add('h1-font-sans', 'H1 sem font-sans', 'low', true, 'adicionar font-sans ao H1');
    if (!f.body_font_sans) add('body-font-sans', 'body sem font-sans', 'low', false, 'revisar classe do body');
    if (f.nunito_preloads_ociosos) add('nunito-ocioso', 'preloads de Nunito ociosos', 'medium', true, 'remover preloads ociosos');
    if (f.imgs_sem_decoding > 0) add('img-decoding', `${f.imgs_sem_decoding} imagem(ns) sem decoding="async"`, 'low', true, 'adicionar decoding="async"');
    if (f.imgs_sem_lazy > 0) add('img-lazy', `${f.imgs_sem_lazy} imagem(ns) sem loading="lazy"`, 'medium', true, 'adicionar loading="lazy"');
    if (f.imgs_sem_alt > 0) add('img-alt', `${f.imgs_sem_alt} imagem(ns) sem alt`, 'medium', false, 'alt exige texto semântico (não auto-corrigível)');
    if (f.imgs_sem_dimensoes > 0) add('img-dimensoes', `${f.imgs_sem_dimensoes} imagem(ns) sem width/height (risco de CLS)`, 'medium', false, 'dimensões exigem metadados da imagem (não auto-corrigível)');

    return out;
}

function limparClasses(html) {
    return html.replace(/class="([^"]+)"/g, (m, c) => 'class="' + c.replace(/\s+/g, ' ').trim() + '"');
}

function aplicarFontSansEmTag(tag) {
    let t = tag.replace(/\bfont-(inter|nunito)\b/g, '');
    t = limparClasses(t);
    if (/class="/.test(t)) {
        t = t.replace(/class="([^"]*)"/, (m, c) => {
            const classes = c.split(/\s+/).filter(Boolean);
            if (!classes.includes('font-sans')) classes.push('font-sans');
            return 'class="' + classes.join(' ') + '"';
        });
    } else {
        t = t.slice(0, -1) + ' class="font-sans">';
    }
    return t;
}

function heroBounds(content) {
    const h1 = content.indexOf('<h1');
    if (h1 === -1) return null;
    const start = Math.max(0, content.lastIndexOf('<main', h1));
    const endSec = content.indexOf('</section>', h1);
    const end = endSec !== -1 ? endSec + 10 : Math.min(content.length, h1 + 1500);
    return { start, end };
}

// Aplica as correções SEGURAS e DETERMINÍSTICAS. Retorna { content, changed }.
function correct(content) {
    let novo = content;

    // 1. font-inter (classe inexistente) -> font-sans
    novo = novo.replace(/\bfont-inter\b/g, 'font-sans');

    // 2. Correções no hero
    const bounds = heroBounds(novo);
    if (bounds) {
        let hero = novo.slice(bounds.start, bounds.end);
        hero = hero.replace(/backdrop-blur-?[\w-]*/g, '');
        hero = hero.replace(/blur-(2xl|3xl)/g, 'blur-xl');
        hero = hero.replace(/drop-shadow(-\w+)?/g, '');
        hero = hero.replace(/shadow-(2xl|3xl)/g, 'shadow-lg');

        // H1 -> font-sans
        const h1Idx = hero.indexOf('<h1');
        if (h1Idx !== -1) {
            const h1End = hero.indexOf('>', h1Idx) + 1;
            hero = hero.slice(0, h1Idx) + aplicarFontSansEmTag(hero.slice(h1Idx, h1End)) + hero.slice(h1End);
        }
        // Subtítulo do hero (primeiro <p> ou <h2> após o H1) -> font-sans
        const h1Pos = hero.indexOf('<h1');
        if (h1Pos !== -1) {
            const busca = hero.slice(hero.indexOf('>', h1Pos) + 1, hero.indexOf('>', h1Pos) + 1 + 900);
            const pMatch = busca.match(/<(p|h2)\b[^>]*>/);
            if (pMatch) {
                const pAbs = hero.indexOf('>', h1Pos) + 1 + pMatch.index;
                const pEnd = pAbs + pMatch[0].length;
                hero = hero.slice(0, pAbs) + aplicarFontSansEmTag(hero.slice(pAbs, pEnd)) + hero.slice(pEnd);
            }
        }
        novo = novo.slice(0, bounds.start) + hero + novo.slice(bounds.end);
    }

    // 3. Preloads de Nunito ociosos
    const linhas = novo.split('\n');
    let nunitoUso = 0;
    linhas.forEach((l) => {
        if (l.includes('Nunito') && !l.includes('@font-face') && !l.includes('preload')) nunitoUso++;
    });
    if (nunitoUso === 0) {
        const filtradas = linhas.filter((l) => !(l.includes('preload') && l.includes('/nunito/')));
        if (filtradas.length !== linhas.length) novo = filtradas.join('\n');
    }

    // 4. Imagens: decoding + lazy (exceto 1ª img e lightbox)
    let firstImg = true;
    novo = novo.replace(/<img\b[^>]*>/g, (tag) => {
        if (/id="lightboxImg"/.test(tag) || /src=""/.test(tag)) return tag;
        let t = tag;
        if (!/decoding=/.test(t)) t = t.slice(0, -1) + ' decoding="async">';
        if (!/loading=/.test(t) && !firstImg) t = t.slice(0, -1) + ' loading="lazy">';
        firstImg = false;
        return t;
    });

    // 5. Limpeza de espaços duplos em classes
    novo = limparClasses(novo);

    return { content: novo, changed: novo !== content };
}

module.exports = { analyze, correct, problems, heroRegion };
