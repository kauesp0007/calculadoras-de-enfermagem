const fs = require('fs');
const s = fs.readFileSync('concurso_publico/index.html', 'utf8');
const i = s.indexOf('data-panel="itens"');
const j = s.indexOf('data-panel="status"', i);
const sec = s.slice(i, j);
const re = /<ol start="(\d+)">([\s\S]*?)<\/ol>/g;
let m, total = 0;
while ((m = re.exec(sec)) !== null) {
  const count = (m[2].match(/<li>/g) || []).length;
  console.log('col start', m[1], '=> itens:', count);
  total += count;
}
console.log('TOTAL:', total);
