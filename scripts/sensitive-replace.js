const fs = require('fs');
const path = require('path');

const root = process.cwd();
const backupDir = path.join(root,'_backups_sensitive');
if(!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

const convMap = {
  'unimed':'Plano de Saúde',
  'amil':'Plano de Saúde',
  'bradesco':'Plano de Saúde',
  'sulamerica':'Plano de Saúde',
  'sulamérica':'Plano de Saúde',
  'porto seguro':'Plano de Saúde',
  'hapvida':'Plano de Saúde',
  'allianz':'Plano de Saúde',
  'dasa':'Plano de Saúde',
  'fleury':'Plano de Saúde',
  'einstein':'Plano de Saúde'
};

const exts = ['.html','.htm','.js','.md','.txt','.json'];
const excludeDirs = ['backups_seo','.tradutor_cache','automacoes/backups_botoes','automacoes','.git','node_modules','_backups_sensitive'];

function isExcluded(p){
  return excludeDirs.some(d=>p.includes(path.sep + d + path.sep) || p.endsWith(path.sep + d));
}

function walk(dir, files=[]){
  const items = fs.readdirSync(dir);
  for(const it of items){
    const fp = path.join(dir,it);
    const st = fs.statSync(fp);
    if(st.isDirectory()){
      if(!isExcluded(fp)) walk(fp,files);
    } else if(st.isFile()){
      if(exts.includes(path.extname(it).toLowerCase())) files.push(fp);
    }
  }
  return files;
}

function backupFile(fp){
  const rel = path.relative(root, fp);
  const dst = path.join(backupDir, rel.replace(/[\\/]/g,'__'));
  fs.copyFileSync(fp,dst);
}

function replaceContent(content){
  // neutralize convênios simple mapping
  for(const k in convMap){
    const re = new RegExp('\\b'+k+'\\b','ig');
    content = content.replace(re, convMap[k]);
  }
  // Replace explicit labels for Nome do Paciente -> 'Paciente (iniciais)'
  content = content.replace(/Nome do Paciente/ig,'Paciente (iniciais)');
  content = content.replace(/<label[^>]*>\s*Nome:\s*<\\\/?label>/ig, '');
  content = content.replace(/Paciente:\s*[A-Za-zÀ-ÿ'\- ]{2,}/ig, 'Paciente: A.B.');
  return content;
}

console.log('Scanning files for replacements...');
const files = walk(root);
let changed = 0;
for(const f of files){
  const rel = path.relative(root,f);
  let content = fs.readFileSync(f,'utf8');
  const newContent = replaceContent(content);
  if(newContent!==content){
    backupFile(f);
    fs.writeFileSync(f,newContent,'utf8');
    changed++;
    console.log('Patched:',rel);
  }
}
console.log('Done. Patched files:',changed,'Backup dir:',backupDir);
