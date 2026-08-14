const fs = require('fs');
const path = require('path');

const root = process.cwd();
const outDir = path.join(root, 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const excludeDirs = [
  'backups_seo',
  '.tradutor_cache',
  'automacoes/backups_botoes',
  'automacoes',
  'backups',
  'node_modules',
  '.git',
  '.cache'
];

const exts = ['.html', '.htm', '.js', '.txt', '.json', '.md'];

const convList = [
  'unimed','amil','bradesco','sulamerica','sulamérica','porto seguro','hapvida','allianz',
  'dasa','fleury','einstein','pró-cardíaco','procardíaco','pro-cardíaco','sirio-libanês','sírio-libanês',
  'pró-cardiaco','procardiaco','hospital s[oó]rio','hospital s[oó]rio-liban','hospital s[oó]rio'
];
const convRegex = new RegExp('\\b(' + convList.join('|') + ')\\b', 'ig');
const hospRegex = /Hospital\s+[A-ZÀ-Ÿ][\wÀ-Öà-ö'’\-\.\s]*/g;
const piiRegex = /Nome do Paciente|Nome:\s|Paciente:\s|nome do paciente/ig;

function isExcluded(p) {
  return excludeDirs.some(d => p.includes(path.sep + d + path.sep) || p.endsWith(path.sep + d));
}

function walk(dir, files=[]) {
  const items = fs.readdirSync(dir);
  for (const it of items) {
    const fp = path.join(dir, it);
    const rel = path.relative(root, fp);
    try {
      const st = fs.statSync(fp);
      if (st.isDirectory()) {
        if (!isExcluded(fp)) walk(fp, files);
      } else if (st.isFile()) {
        if (exts.includes(path.extname(it).toLowerCase())) files.push(fp);
      }
    } catch (e) {
      // ignore
    }
  }
  return files;
}

console.log('Scanning workspace for sensitive terms...');
const files = walk(root);
console.log('Files to scan:', files.length);

const results = [];
let totalConv = 0, totalHosp = 0, totalPii = 0;
for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, '/');
  // Skip reports folder
  if (rel.startsWith('reports/')) continue;
  // Small files only
  let content = '';
  try { content = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  const convMatches = content.match(convRegex) || [];
  const hospMatches = content.match(hospRegex) || [];
  const piiMatches = content.match(piiRegex) || [];
  const convCount = convMatches.length;
  const hospCount = hospMatches.length;
  const piiCount = piiMatches.length;
  const total = convCount + hospCount + piiCount;
  if (total>0) {
    results.push({path: rel, convCount, hospCount, piiCount, total});
    totalConv += convCount; totalHosp += hospCount; totalPii += piiCount;
  }
}

results.sort((a,b)=>b.total - a.total);
const csvPath = path.join(outDir, 'sensitive-files.csv');
const header = 'path,convCount,hospCount,piiCount,total\n';
fs.writeFileSync(csvPath, header + results.map(r=>`${r.path},${r.convCount},${r.hospCount},${r.piiCount},${r.total}`).join('\n'));

const summary = `Scanned ${files.length} files. Found ${results.length} files with sensitive matches. conv:${totalConv} hosp:${totalHosp} pii:${totalPii} -> CSV: ${csvPath}`;
console.log(summary);
fs.writeFileSync(path.join(outDir,'sensitive-scan-summary.txt'), summary + '\n');
