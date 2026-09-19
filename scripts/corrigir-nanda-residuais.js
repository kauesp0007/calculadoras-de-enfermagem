// Correção dos casos residuais não cobertos pelos scripts anteriores:
// 1) richmond (ru/uk): segunda seção NANDA duplicada com h4 "Diagnósticos NANDA
//    Sugeridos" não renomeado (a primeira seção já foi renomeada).
// 2) sistema_sinbad.html: template de impressão com "<h3>Diagnosticos NANDA
//    Sugeridos</h3>" (sem acento) não renomeado.
//
// Extrai título e disclaimer já traduzidos do próprio arquivo para consistência.
//
// Uso: node scripts/corrigir-nanda-residuais.js --dry | --apply

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const APPLY = process.argv.includes('--apply');

if (!DRY && !APPLY) {
    console.log('Informe --dry ou --apply');
    process.exit(0);
}

const ts = Date.now();
const backupDir = path.join(ROOT, 'backups-temporarios', `nanda-residuais-${ts}`);
let n = 0;

function backup(rel, content) {
    if (!APPLY) return;
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(path.join(backupDir, rel.replace(/[\\/]/g, '_')), content, 'utf8');
}

// Extrai o título traduzido do h4 já renomeado (primeira ocorrência "Exempl.../Пример/Приклад").
function getTitle(content) {
    const m = content.match(/<h4 class="text-sm md:text-base font-bold text-navy m-0 uppercase tracking-wide">(Exemplificando com a NANDA|Exemplifying|Ejemplificando|Пример с NANDA|Приклад із NANDA|以NANDA|Veranschaulichung|Illustration|Esemplificando|NANDA के साथ)[^<]*<\/h4>/);
    if (!m) return null;
    return m[0].replace(/^<h4[^>]*>/, '').replace(/<\/h4>$/, '');
}

function getDisclaimer(content) {
    const m = content.match(/<p class="nanda-disclaimer-screen"[^>]*>([\s\S]*?)<\/p>/);
    return m ? m[1].trim() : null;
}

function fixRichmond(rel) {
    const file = path.join(ROOT, rel);
    const content = fs.readFileSync(file, 'utf8');

    const title = getTitle(content);
    const disc = getDisclaimer(content);
    if (!title || !disc) {
        console.log(`[ERRO] ${rel}: título ou disclaimer não extraído`);
        return;
    }

    // Resta apenas UMA ocorrência do h4 antigo (a segunda seção).
    const oldH4 = '<h4 class="text-sm md:text-base font-bold text-navy m-0 uppercase tracking-wide">Diagnósticos NANDA Sugeridos</h4>';
    if (!content.includes(oldH4)) {
        console.log(`[ignorado] ${rel}: h4 antigo não encontrado`);
        return;
    }

    let out = content.replace(oldH4, `<h4 class="text-sm md:text-base font-bold text-navy m-0 uppercase tracking-wide">${title}</h4>`);

    // Insere o disclaimer após o </ul> da segunda seção (a segunda ocorrência de
    // "</ul>" seguida de "</div></div>" sem disclaimer — identificada pela última
    // ocorrência de "</ul>" do arquivo).
    const lastUl = out.lastIndexOf('</ul>');
    if (lastUl === -1) {
        console.log(`[ERRO] ${rel}: </ul> não encontrado`);
        return;
    }
    const discHtml = `<p class="nanda-disclaimer-screen" style="font-size:10px;line-height:1.5;color:#94A3B8;font-style:italic;margin:12px 0 0">${disc}</p>`;
    out = out.slice(0, lastUl + 5) + '\n' + discHtml + out.slice(lastUl + 5);

    if (out === content) {
        console.log(`[sem mudança] ${rel}`);
        return;
    }
    backup(rel, content);
    if (APPLY) fs.writeFileSync(file, out, 'utf8');
    console.log(`[ok] ${rel}: h4 (2ª seção) renomeado + disclaimer`);
    n++;
}

function fixSinbad() {
    const rel = 'sistema_sinbad.html';
    const file = path.join(ROOT, rel);
    const content = fs.readFileSync(file, 'utf8');

    const title = getTitle(content);
    const disc = getDisclaimer(content);
    if (!title || !disc) {
        console.log(`[ERRO] ${rel}: título ou disclaimer não extraído`);
        return;
    }

    const oldH3 = '<h3>Diagnosticos NANDA Sugeridos</h3>';
    if (!content.includes(oldH3)) {
        console.log(`[ignorado] ${rel}: h3 antigo não encontrado`);
        return;
    }

    // Dentro do template literal de impressão: <div class="nanda-box"><h3>...</h3>${nandaHtml}</div>
    const out = content.replace(
        oldH3,
        `<h3>${title}</h3>`
    ).replace(
        `\${nandaHtml}</div>`,
        `\${nandaHtml}<p style="font-size:7pt;line-height:1.3;color:#94a3b8;font-style:italic;margin:8px 0 0">${disc}</p></div>`
    );

    if (out === content) {
        console.log(`[sem mudança] ${rel}`);
        return;
    }
    backup(rel, content);
    if (APPLY) fs.writeFileSync(file, out, 'utf8');
    console.log(`[ok] ${rel}: h3 de impressão renomeado + disclaimer`);
    n++;
}

fixRichmond('ru/richmond.html');
fixRichmond('uk/richmond.html');
fixSinbad();

console.log(`\nArquivos processados: ${n}`);
if (APPLY) console.log(`Backup em: backups-temporarios/nanda-residuais-${ts}`);
