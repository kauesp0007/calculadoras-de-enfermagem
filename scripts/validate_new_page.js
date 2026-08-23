#!/usr/bin/env node
// validate_new_page.js
// Validação simples para novas páginas HTML:
// - verifica presença da barra de ações compactas (botões especificados) logo após o H1
// - verifica existência da seção de Referências (com indicação de link/"Disponível em:" ou classe text-sm)
// Uso: node scripts\validate_new_page.js [arquivos...]

const fs = require('fs');
const path = require('path');

const ACTION_LABELS = [
  'Favoritar',
  'Compartilhar',
  'Imprimir',
  'Reportar correção',
  'Ver resultado',
  'Ir para a calculadora',
  'Diagnósticos NANDA',
  'Recursos',
  'Evidências'
];

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    console.error('Erro lendo', p, e.message);
    return null;
  }
}

function findFirstH1Index(html) {
  const re = /<h1[^>]*>([\s\S]*?)<\/h1>/i;
  const m = re.exec(html);
  if (!m) return -1;
  return m.index + m[0].length; // position immediately after </h1>
}

function checkActionBar(html) {
  const idx = findFirstH1Index(html);
  if (idx === -1) return { ok: false, reason: 'H1 não encontrado' };
  // search the next chunk (10KB) for labels
  const chunk = html.slice(idx, Math.min(html.length, idx + 10000));
  const missing = [];
  for (const label of ACTION_LABELS) {
    if (chunk.indexOf(label) === -1) missing.push(label);
  }
  if (missing.length === 0) return { ok: true };
  return { ok: false, reason: 'Labels faltando após H1', missing };
}

function checkReferencesSection(html) {
  // find heading for references
  const reRefs = /<h[2-4][^>]*>([\s\S]{0,200}refer[eê]ncias[\s\S]{0,50})<\/h[2-4]>/i;
  const m = reRefs.exec(html);
  if (!m) return { ok: false, reason: 'Cabeçalho de Referências não encontrado (Referências/Referências Bibliográficas)' };
  const start = m.index + m[0].length;
  const chunk = html.slice(start, Math.min(html.length, start + 2000));
  // heurísticas: verificar se há link, "Disponível em:" ou classe text-sm
  const hasLink = /<a\s+href=/.test(chunk);
  const hasDisponivel = /Dispon[ií]vel em[:]/i.test(chunk);
  const hasTextSm = /class\s*=\s*"[^"]*text-sm[^"]*"/i.test(chunk) || /class\s*=\s*'[^']*text-sm[^']*'/i.test(chunk);
  const hasYear = /\b\d{4}\b/.test(chunk);
  if (hasLink || hasDisponivel || hasTextSm || hasYear) return { ok: true };
  return { ok: false, reason: 'Seção de referências encontrada, mas não parece seguir o padrão (sem links/"Disponível em:"/class text-sm/ano)' };
}

function scanFile(filePath) {
  const html = readFile(filePath);
  if (html === null) return { file: filePath, ok: false, error: 'read_error' };
  const action = checkActionBar(html);
  const refs = checkReferencesSection(html);
  const ok = action.ok && refs.ok;
  return { file: filePath, ok, action, refs };
}

function findDefaultFiles() {
  // scan repository root for integracoes_*.html and guia_rapido_*.html
  const cwd = process.cwd();
  const files = fs.readdirSync(cwd).filter(f => {
    return (f.startsWith('integracoes_') || f.startsWith('guia_rapido_')) && f.endsWith('.html');
  });
  return files.map(f => path.join(cwd, f));
}

function main() {
  const args = process.argv.slice(2);
  const targets = args.length ? args : findDefaultFiles();
  if (!targets.length) {
    console.error('Nenhum arquivo especificado e nenhum arquivo padrão encontrado (integracoes_*.html).');
    process.exit(2);
  }

  let exitFail = false;
  for (const t of targets) {
    const res = scanFile(t);
    console.log('\nArquivo:', t);
    if (res.error) {
      console.log('  Erro:', res.error);
      exitFail = true;
      continue;
    }
    if (res.ok) {
      console.log('  ✓ OK: ação e referências detectadas.');
      continue;
    }
    console.log('  ✗ Falha na validação:');
    if (!res.action.ok) {
      console.log('    - Ação:', res.action.reason);
      if (res.action.missing) console.log('      Labels faltando:', res.action.missing.join(', '));
    }
    if (!res.refs.ok) {
      console.log('    - Referências:', res.refs.reason);
    }
    exitFail = true;
  }

  if (exitFail) {
    console.error('\nValidação falhou (código de saída 1). Corrija os itens indicados antes de publicar.');
    process.exit(1);
  }
  console.log('\nValidação concluída: todos os arquivos passaram.');
  process.exit(0);
}

main();
