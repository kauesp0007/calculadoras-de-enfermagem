// Script: remove old static glossary content from terminologias-de-enfermagem.html
// Keeps the dynamic loader + glossary-wrapper, removes old A-Z sections

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'terminologias-de-enfermagem.html');
let html = fs.readFileSync(filePath, 'utf-8');

// Find the end of the glossary loader script and the start of orphaned static content
// Pattern: </script> followed by whitespace and orphaned <div class="letter-heading">A</div>
const orphanedPattern = /<\/script>\s*\n\s*<div class="letter-heading">A<\/div>/;
const orphanedMatch = html.match(orphanedPattern);

// Find References section
const refsMarker = '<!-- Referências Bibliográficas -->';

if (!orphanedMatch) {
  console.error('Could not find orphaned A section after loader script.');
  process.exit(1);
}

const scriptEndIdx = html.indexOf('</script>', html.indexOf('glossary-wrapper'));
if (scriptEndIdx === -1) {
  console.error('Could not find glossary loader </script>.');
  process.exit(1);
}

const refsIdx = html.indexOf(refsMarker);
if (refsIdx === -1) {
  console.error('Could not find Referências Bibliográficas marker.');
  process.exit(1);
}

// Keep everything up to and including </script>, then everything from refs onwards
const keepBefore = html.substring(0, scriptEndIdx + '</script>'.length);
const keepAfter = html.substring(refsIdx);

const cleaned = keepBefore + '\n\n' + keepAfter;

fs.writeFileSync(filePath, cleaned, 'utf-8');
console.log('Removed old static glossary content. File size reduced from', html.length.toLocaleString(), 'to', cleaned.length.toLocaleString(), 'bytes.');
console.log('Saved to', filePath);
