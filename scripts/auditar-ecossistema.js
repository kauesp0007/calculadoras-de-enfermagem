// auditar-ecossistema.js — auditoria DETERMINÍSTICA do ecossistema de agentes/hooks.
// Substitui a parte mecânica do agente "Auditor do Ecossistema" (sem IA, sem créditos).
// Verifica: contagens, frontmatter, pareamento JSON<->PS1, consistência catálogo<->arquivos.
// Uso: node scripts/auditar-ecossistema.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const agentsDir = path.join(ROOT, '.github', 'agents');
const hooksJsonDir = path.join(ROOT, '.github', 'hooks');
const hooksPsDir = path.join(ROOT, 'scripts', 'hooks');
const catalogoDir = path.join(ROOT, 'CATALOGO_DOS_AGENTES_E_HOOKS');

const issues = [];
const info = [];

function listFiles(dir, ext) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.endsWith(ext)).sort();
}

// 1. Contagens
const agents = listFiles(agentsDir, '.agent.md');
const hooksJson = listFiles(hooksJsonDir, '.json');
const hooksPs = listFiles(hooksPsDir, '.ps1');
info.push(`agentes=${agents.length} hooks_json=${hooksJson.length} hooks_ps1=${hooksPs.length}`);

// 2. Frontmatter dos agentes
for (const f of agents) {
    const c = fs.readFileSync(path.join(agentsDir, f), 'utf8').slice(0, 800);
    if (!/name\s*:\s*["']/.test(c)) issues.push(`[frontmatter] ${f}: sem "name"`);
    if (!/tools\s*:\s*\[/.test(c)) issues.push(`[frontmatter] ${f}: sem "tools"`);
    if (!/user-invocable\s*:\s*true/.test(c)) issues.push(`[frontmatter] ${f}: sem "user-invocable: true"`);
}

// 3. Pareamento JSON de hook -> script .ps1
for (const j of hooksJson) {
    const content = fs.readFileSync(path.join(hooksJsonDir, j), 'utf8');
    const refs = content.match(/scripts\/hooks\/([\w-]+\.ps1)/g);
    if (!refs || refs.length === 0) {
        issues.push(`[hook] ${j}: sem referência a script .ps1`);
        continue;
    }
    const jsonBase = j.replace(/\.json$/, '');
    for (const ref of refs) {
        const ps = ref.replace('scripts/hooks/', '');
        if (!fs.existsSync(path.join(hooksPsDir, ps))) {
            issues.push(`[hook] ${j}: script inexistente -> ${ps}`);
        } else {
            const psBase = ps.replace(/\.ps1$/, '');
            if (jsonBase !== psBase) {
                issues.push(`[hook] ${j}: nome divergente JSON<->PS1 (JSON=${jsonBase}, PS1=${psBase})`);
            }
        }
    }
}

// 4. Scripts .ps1 órfãos (nenhum JSON referenciando)
for (const ps of hooksPs) {
    let referenced = false;
    for (const j of hooksJson) {
        const c = fs.readFileSync(path.join(hooksJsonDir, j), 'utf8');
        if (c.includes(ps)) { referenced = true; break; }
    }
    if (!referenced) issues.push(`[hook] ${ps}: script sem JSON referenciando (órfão)`);
}

// 5. Consistência catálogo x arquivos reais
const agentesCatalog = path.join(catalogoDir, 'CATALOGO_DOS_AGENTES.md');
const hooksCatalog = path.join(catalogoDir, 'CATALOGO_DOS_HOOKS.md');
if (fs.existsSync(agentesCatalog)) {
    const c = fs.readFileSync(agentesCatalog, 'utf8');
    for (const f of agents) {
        if (!c.includes(f)) issues.push(`[catalogo] agente ${f} NÃO listado em CATALOGO_DOS_AGENTES.md`);
    }
} else {
    issues.push('[catalogo] CATALOGO_DOS_AGENTES.md não encontrado');
}
if (fs.existsSync(hooksCatalog)) {
    const c = fs.readFileSync(hooksCatalog, 'utf8');
    for (const j of hooksJson) {
        if (!c.includes(j)) issues.push(`[catalogo] hook ${j} NÃO listado em CATALOGO_DOS_HOOKS.md`);
    }
} else {
    issues.push('[catalogo] CATALOGO_DOS_HOOKS.md não encontrado');
}

// 6. Registro de conformidade (validade JSON + contagem)
const regFile = path.join(catalogoDir, 'registro-conformidade.json');
if (fs.existsSync(regFile)) {
    try {
        const reg = JSON.parse(fs.readFileSync(regFile, 'utf8'));
        info.push(`registro_conformidade=${(reg.componentes || []).length} entradas`);
    } catch (e) {
        issues.push(`[registro] registro-conformidade.json inválido: ${e.message}`);
    }
} else {
    issues.push('[registro] registro-conformidade.json não encontrado');
}

// Saída compacta
console.log('=== AUDITORIA DETERMINÍSTICA DO ECOSSISTEMA ===');
for (const i of info) console.log('INFO  ' + i);
if (issues.length === 0) {
    console.log('RESULTADO: CONSISTENTE — sem divergências.');
} else {
    for (const x of issues) console.log('PROBLEMA  ' + x);
    console.log(`RESULTADO: ${issues.length} divergência(s).`);
}
process.exitCode = issues.length > 0 ? 1 : 0;
