// Extract text from termos_medicos.docx and parse medical terms into JSON
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const docxPath = path.join(__dirname, '..', 'termos_medicos.docx');
const jsonPath = path.join(__dirname, '..', 'terminologias.json');
const txtOutputPath = path.join(__dirname, '..', 'termos_medicos_extraido.txt');

async function main() {
  console.log('Extracting text from', docxPath, '...');
  
  const result = await mammoth.extractRawText({ path: docxPath });
  const text = result.value;
  
  console.log('Extracted', text.length.toLocaleString(), 'characters.');
  if (result.messages.length) {
    console.log('Messages:', result.messages.slice(0, 5));
  }
  
  // Save raw text for debugging
  fs.writeFileSync(txtOutputPath, text, 'utf-8');
  console.log('Raw text saved to', txtOutputPath);
  
  // Show first 2000 chars for analysis
  console.log('\n--- First 2000 chars ---');
  console.log(text.substring(0, 2000));
  console.log('--- End preview ---\n');
  
  // Show last 500 chars
  console.log('--- Last 500 chars ---');
  console.log(text.substring(Math.max(0, text.length - 500)));
  console.log('--- End ---');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
