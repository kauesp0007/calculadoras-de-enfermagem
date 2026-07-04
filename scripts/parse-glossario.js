const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'terminologias-de-enfermagem.html');
const outPath = path.join(__dirname, '..', 'terminologias.json');

const html = fs.readFileSync(htmlPath, 'utf8');

const containerRe = /<div class="term-container">([\s\S]*?)<\/div>/g;

function stripTags(s){
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const entries = [];
let m;
while ((m = containerRe.exec(html)) !== null) {
  const block = m[1];
  const titleMatch = block.match(/<p class="term-title">([\s\S]*?)<\/p>/);
  if (!titleMatch) continue;
  const titleRaw = titleMatch[1].replace(/\n/g, ' ').trim();
  let id = null;
  let term = titleRaw;
  const titleParts = titleRaw.match(/^\s*(\d+)\s*-\s*(.*)$/);
  if (titleParts) {
    id = parseInt(titleParts[1], 10);
    term = titleParts[2].trim();
  } else {
    term = titleRaw.replace(/^\d+\s*-\s*/, '').trim();
  }

  const meaningMatch = block.match(/<p class="term-meaning">([\s\S]*?)<\/p>/);
  let meaningRaw = meaningMatch ? meaningMatch[1] : '';
  // remove the meaning label span
  meaningRaw = meaningRaw.replace(/<span[^>]*>[\s\S]*?<\/span>/i, '');
  const meaning = stripTags(meaningRaw);

  entries.push({ id, term, meaning });
}

fs.writeFileSync(outPath, JSON.stringify(entries, null, 2), 'utf8');
console.log('Saved', entries.length, 'entries to', outPath);
