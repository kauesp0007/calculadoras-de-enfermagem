/**
 * REMOVER CÍRCULO + ÍCONE SVG DOS HERO CARDS H1
 * =============================================
 * Abordagem cirúrgica: identifica o wrapper flex do ícone (md:w-1/3 + rounded-full)
 * dentro de hero cards com h1 e remove apenas esse bloco.
 * Preserva: layout, cores, fontes, dimensões do hero card.
 * Preserva: SVGs de botões, outros cards, NANDA spinner, e index.html.
 */

const fs = require('fs');
const path = require('path');

const ROOT = '.';
const LANGS = ['en','es','de','it','fr','hi','zh','ar','ja','ru','ko','tr','nl','pl','sv','id','vi','uk'];
const SKIP_DIRS = new Set(['downloads','biblioteca','blog','blog-templates','node_modules','.git','.tradutor_cache','automacoes']);
const SKIP_FILES = new Set(['footer.html','menu-global.html','global-body-elements.html','downloads.html','_language_selector.html','googlefc0a17cdd552164b.html']);

let changed = 0, scanned = 0;

function walk(dir) {
    let items; try { items = fs.readdirSync(dir); } catch { return; }
    for (const name of items) {
        if (SKIP_DIRS.has(name)) continue;
        const full = path.join(dir, name);
        let st; try { st = fs.statSync(full); } catch { continue; }
        if (st.isDirectory()) { walk(full); continue; }
        if (!name.endsWith('.html') || SKIP_FILES.has(name)) continue;
        if (name === 'index.html') { scanned++; continue; }
        processFile(full);
    }
}

function processFile(filePath) {
    scanned++;
    let html; try { html = fs.readFileSync(filePath, 'utf8'); } catch { return; }
    let fileModified = false;

    // Marcador único do círculo: bg-white/10 + rounded-full
    const marker = 'bg-white/10 rounded-full';
    let searchPos = 0;

    while ((searchPos = html.indexOf(marker, searchPos)) !== -1) {
        // 1. Encontrar o wrapper flex do ícone (indo para trás)
        const before = html.substring(Math.max(0, searchPos - 600), searchPos);
        const flexMatch = before.match(/<div\s+class="[^"]*md:w-1\/3[^"]*"[^>]*>/g);
        if (!flexMatch) { searchPos += marker.length; continue; }

        const flexTag = flexMatch[flexMatch.length - 1];
        const flexIdx = before.lastIndexOf(flexTag);
        const flexGlobal = Math.max(0, searchPos - 600) + flexIdx;

        // 2. Verificar se está dentro de um hero card com h1
        const heroCheck = html.substring(Math.max(0, flexGlobal - 3000), flexGlobal);
        const isHero = heroCheck.includes('-card-navy') ||
                       heroCheck.includes('bg-gradient-to-br');
        const hasH1 = heroCheck.includes('<h1');
        if (!isHero || !hasH1) { searchPos += marker.length; continue; }

        // 3. Encontrar o fechamento do wrapper flex (contando divs)
        const fromFlex = html.substring(flexGlobal);
        const tagEnd = fromFlex.indexOf('>') + 1;
        let depth = 1, pos = tagEnd;
        while (pos < fromFlex.length && depth > 0) {
            const nextOpen = fromFlex.indexOf('<div', pos);
            const nextClose = fromFlex.indexOf('</div>', pos);
            if (nextOpen === -1 && nextClose === -1) break;
            const isOpen = nextClose === -1 || (nextOpen !== -1 && nextOpen < nextClose);
            if (isOpen) { depth++; pos = nextOpen + 4; }
            else { depth--; pos = nextClose + 6; }
        }
        if (depth !== 0) { searchPos += marker.length; continue; }
        const flexEnd = flexGlobal + pos;

        // 4. Verificar comentário "cone" antes do wrapper (em qualquer idioma)
        let removeStart = flexGlobal;
        const prefix = html.substring(Math.max(0, flexGlobal - 80), flexGlobal);
        const cmtMatch = prefix.match(/(<!--[^>]*[CcOoIi][OoIi][Nn][NnEe][^>]*-->)\s*$/);
        if (cmtMatch) {
            removeStart = flexGlobal - cmtMatch[0].length;
        }

        // 5. Remover o bloco
        html = html.substring(0, removeStart) + html.substring(flexEnd);
        fileModified = true;
        searchPos = removeStart; // continuar busca a partir da remoção
    }

    if (fileModified) {
        fs.writeFileSync(filePath, html, 'utf8');
        changed++;
        console.log('[OK] ' + filePath);
    }
}

console.log('=== Removendo circulo + SVG dos hero cards h1 ===\n');
walk(ROOT);
LANGS.forEach(l => { const p = path.join(ROOT, l); if (fs.existsSync(p)) walk(p); });
console.log('\nEscaneados: ' + scanned + ' | Alterados: ' + changed);
