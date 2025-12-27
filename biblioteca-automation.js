#!/usr/bin/env node
/* eslint-env node */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const JSON_DB = 'biblioteca.json';
const DOCS_DIR = path.join(process.cwd(), 'docs');
const IMG_DIR = path.join(process.cwd(), 'img');
const BIBLIOTECA_DIR = path.join(process.cwd(), 'biblioteca');
const ITEM_TEMPLATE = 'item.template.html';

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function tituloFromFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function descricaoAutomatica(titulo) {
  return `Material de enfermagem sobre ${titulo} para apoio educacional e clínico.`;
}

function runScanner() {
  console.log('🔎 Executando scanner-biblioteca.js...');
  execSync('node scanner-biblioteca.js', { stdio: 'inherit' });
}

async function gerarCapaParaPDF(pdfFile) {
  // função removida: usar o script dedicado gerarCapasPDF.js para criar capas
  throw new Error('Não chamar gerarCapaParaPDF; use gerarCapasPDF.js via execSync');
}

async function main() {
  // 1) Run scanner to add new files to biblioteca.json (scanner already skips duplicates)
  runScanner();

  // 2) Load biblioteca.json
  if (!fs.existsSync(JSON_DB)) {
    console.error('❌ biblioteca.json não encontrado após scanner. Abortando.');
    process.exit(1);
  }
  const biblioteca = JSON.parse(fs.readFileSync(JSON_DB, 'utf8'));

  // index existing ficheiros
  const ficheirosSet = new Set(biblioteca.map(i => i.ficheiro));

  // 3) Garantir que todos os PDFs em docs/ estejam registrados (se houver novos, adiciona)
  if (fs.existsSync(DOCS_DIR)) {
    const pdfs = fs.readdirSync(DOCS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    let added = 0;
    for (const pdf of pdfs) {
      const caminho = '/docs/' + pdf;
      if (!ficheirosSet.has(caminho)) {
        const titulo = tituloFromFilename(pdf);
        const novo = {
          titulo,
          slug: slugify(titulo),
          descricao: descricaoAutomatica(titulo),
          categoria: 'documentos',
          ficheiro: caminho,
          capa: '',
          download: pdf,
        };
        biblioteca.push(novo);
        ficheirosSet.add(caminho);
        added++;
        console.log('➕ Adicionado ao biblioteca.json:', caminho);
      }
    }
    if (added) fs.writeFileSync(JSON_DB, JSON.stringify(biblioteca, null, 2), 'utf8');
  }

  // 4) Se existirem PDFs sem capa, delegar a geração ao script gerarCapasPDF.js
  const pdfsSemCapa = biblioteca.filter(i => i.categoria === 'documentos' && i.ficheiro && (!i.capa || i.capa === ''));
  if (pdfsSemCapa.length > 0) {
    console.log(`➡ Há ${pdfsSemCapa.length} PDFs sem capa. Executando gerarCapasPDF.js...`);
    try {
      execSync('node gerarCapasPDF.js', { stdio: 'inherit' });
      // recarregar biblioteca.json caso o script tenha atualizado capas
      const novaBiblioteca = JSON.parse(fs.readFileSync(JSON_DB, 'utf8'));
      // substituir referência local
      for (let i = 0; i < biblioteca.length; i++) {
        biblioteca[i] = novaBiblioteca[i] || biblioteca[i];
      }
      console.log('✅ Geração de capas concluída.');
    } catch (err) {
      console.error('❌ Falha ao executar gerarCapasPDF.js:', err && err.message ? err.message : err);
    }
  } else {
    console.log('➡ Nenhum PDF sem capa encontrado. Pular geração de capas.');
  }

  // 5) Gerar/atualizar páginas individuais via build-biblioteca.js (responsável por prev/next + marker + layout)
  console.log('📚 Executando build-biblioteca.js para gerar/atualizar páginas individuais da biblioteca...');
  try {
    execSync('node build-biblioteca.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Falha ao executar build-biblioteca.js:', err && err.message ? err.message : err);
    process.exit(1);
  }

  // 6) Atualizar downloads (reconstruir páginas de listagem)
  console.log('🔧 Executando build.js para atualizar páginas de downloads...');
  execSync('node build.js', { stdio: 'inherit' });

  // 7) Compilar CSS com Tailwind
  console.log('🎨 Executando Tailwind CSS Build...');
  execSync('.\\node_modules\\.bin\\tailwindcss -i ./src/input.css -o ./public/output.css --minify', { stdio: 'inherit' });



  console.log(`
🎯 Processo concluído.
`);
}

main().catch(err => {
  console.error('Erro no processo unificado:', err && err.stack ? err.stack : err);
  process.exit(1);
});
