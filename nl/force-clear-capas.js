#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const DB = path.join(process.cwd(), 'biblioteca.json');
const BAK = path.join(process.cwd(), `biblioteca.json.bak-${Date.now()}`);
if (!fs.existsSync(DB)) {
  console.error('biblioteca.json não encontrado. Abortando.');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(DB,'utf8'));
let changed = 0;
for(const it of data){
  if(it && it.categoria === 'documentos' && it.capa && it.capa.trim() !== ''){
    it.capa = '';
    changed++;
  }
}
fs.copyFileSync(DB, BAK);
fs.writeFileSync(DB, JSON.stringify(data,null,2),'utf8');
console.log(`Backup criado: ${path.basename(BAK)}. Campos 'capa' limpos em ${changed} itens.`);
