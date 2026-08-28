/* eslint-env node */
/**
 * fix-broken-links.js — corrige links internos quebrados da raiz cujo destino correto EXISTE.
 * Correção cirúrgica: apenas substitui o alvo dentro de href="..." / href="/...".
 * NÃO toca: pastas/arquivos proibidos. Cria backup em backups-temporarios/links-quebrados/.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKUP = path.join(ROOT, 'backups-temporarios', 'links-quebrados');

// Mapa de destinos inequívocos (alvo quebrado -> arquivo existente)
const MAPA = {
    'rass.html': 'richmond.html',
    'calculo-ferias.html': 'calculo-de-ferias.html',
    'checklist-cirurgia-segura.html': 'checklist-cirurgico-seguro.html',
    'biblioteca.html': 'downloads.html',
    'curativos.html': 'biblioteca-curativo.html',
    'lei8080-sus.html': 'lei-organica-saude-8080-1990.html'
};

const FILES_PROIBIDOS = new Set(['footer.html', 'menu-global.html', 'global-body-elements.html', 'downloads.html', 'menu-lateral.html', '_language_selector.html', 'googlefc0a17cdd552164b.html']);

fs.mkdirSync(BACKUP, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);

let totalArquivos = 0, totalTrocas = 0;
for (const nome of fs.readdirSync(ROOT)) {
    if (!nome.endsWith('.html')) continue;
    if (FILES_PROIBIDOS.has(nome)) continue;
    const fp = path.join(ROOT, nome);
    const original = fs.readFileSync(fp, 'utf8');
    let conteudo = original;
    let trocas = 0;

    for (const [oldName, newName] of Object.entries(MAPA)) {
        const antes1 = `href="${oldName}"`, depois1 = `href="${newName}"`;
        const antes2 = `href="/${oldName}"`, depois2 = `href="/${newName}"`;
        const re1 = new RegExp(antes1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const re2 = new RegExp(antes2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const c1 = (conteudo.match(re1) || []).length;
        const c2 = (conteudo.match(re2) || []).length;
        if (c1 + c2 === 0) continue;
        conteudo = conteudo.replace(re1, depois1).replace(re2, depois2);
        trocas += c1 + c2;
        console.log(`${nome}: ${oldName} -> ${newName} (${c1 + c2})`);
    }

    if (trocas > 0) {
        fs.copyFileSync(fp, path.join(BACKUP, `${nome}.${ts}.bak`));
        fs.writeFileSync(fp, conteudo, 'utf8');
        totalArquivos++;
        totalTrocas += trocas;
    }
}

console.log(`\nArquivos alterados: ${totalArquivos} | substituições: ${totalTrocas}`);
