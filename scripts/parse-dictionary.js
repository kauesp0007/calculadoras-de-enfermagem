// Parse medical terms from termos_medicos_extraido.txt and merge into terminologias.json
const fs = require('fs');
const path = require('path');

const txtPath = path.join(__dirname, '..', 'termos_medicos_extraido.txt');
const jsonPath = path.join(__dirname, '..', 'terminologias.json');

// Read and clean the text
let text = fs.readFileSync(txtPath, 'utf-8');

// Remove the front matter (everything before the dictionary starts)
// Find first real term - "A, AN" or "AA" at start of a line
const dictStart = text.search(/\nA, AN - /);
if (dictStart === -1) {
  // Try alternative start patterns
  const altStart = text.search(/\nAA\n+AA - /);
  text = altStart !== -1 ? text.substring(altStart) : text;
} else {
  text = text.substring(dictStart);
}

// Remove page numbers (standalone numbers on their own lines, usually 1-3 digits)
text = text.replace(/\n\d{1,3}\n/g, '\n');

// Remove page headers (short uppercase text on own line like "ABO", "ABS", "ACE")
text = text.replace(/\n[A-Z]{2,4}\n/g, '\n');

// Remove the postamble (everything after the last real entry)
// Find "473" near the end which is the last page number
const lastPage = text.lastIndexOf('\n473\n');
if (lastPage !== -1) {
  // Keep some content after but trim
  const after = text.substring(lastPage + 5);
  if (after.trim().length < 200) {
    text = text.substring(0, lastPage);
  }
}

// Split into lines
const lines = text.split('\n');

// Parse entries
const entries = [];
let currentTerm = null;
let currentDef = [];
let inEntry = false;

// Regex to detect a new term: starts with ALL CAPS (possibly with commas, slashes, hyphens, spaces) followed by " - "
const termStartRegex = /^[A-ZÀ-Ü][A-ZÀ-Ü0-9\s,;\/\(\)\-\.\+%º°'']+ - /;

// Known non-term patterns to skip
const skipPatterns = [
  /^[A-ZÀ-Ü]{2,4}$/,           // Page headers like "ABO", "ABS"
  /^\d{1,3}$/,                  // Page numbers
  /^Sou Enfermagem/,           // Watermark
  /^Dicionário de termos/,     // Title
  /^ISBN/,                      // ISBN
  /^© Copyright/,              // Copyright
  /^Proibida/,                 // Legal
];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (!line) {
    // Empty line - could be end of an entry
    if (inEntry && currentDef.length > 0) {
      // Check if next non-empty line starts a new term
      let nextLine = '';
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nl = lines[j].trim();
        if (nl) { nextLine = nl; break; }
      }
      
      if (termStartRegex.test(nextLine) || !nextLine) {
        // End current entry
        entries.push({
          term: currentTerm,
          meaning: currentDef.join(' ').replace(/\s+/g, ' ').trim()
        });
        currentTerm = null;
        currentDef = [];
        inEntry = false;
      } else if (nextLine && !nextLine.startsWith('-')) {
        // Might be continuation, but if it looks like a new term, end current
        if (/^[A-ZÀ-Ü]{3,}/.test(nextLine) && !nextLine.includes(' - ')) {
          entries.push({
            term: currentTerm,
            meaning: currentDef.join(' ').replace(/\s+/g, ' ').trim()
          });
          currentTerm = null;
          currentDef = [];
          inEntry = false;
        }
      }
    }
    continue;
  }
  
  // Skip known non-term patterns
  let shouldSkip = false;
  for (const pat of skipPatterns) {
    if (pat.test(line)) { shouldSkip = true; break; }
  }
  if (shouldSkip) continue;
  
  // Check if this line starts a new term
  if (termStartRegex.test(line)) {
    // Save previous entry if exists
    if (inEntry && currentTerm && currentDef.length > 0) {
      entries.push({
        term: currentTerm,
        meaning: currentDef.join(' ').replace(/\s+/g, ' ').trim()
      });
    }
    
    // Parse new term
    const dashIdx = line.indexOf(' - ');
    const termRaw = line.substring(0, dashIdx).trim();
    const defStart = line.substring(dashIdx + 3).trim();
    
    // Clean the term: remove hyphenation artifacts
    let term = termRaw.replace(/-\s*$/, ''); // Remove trailing hyphen from line break
    
    currentTerm = term;
    currentDef = defStart ? [defStart] : [];
    inEntry = true;
    continue;
  }
  
  // Continuation of definition
  if (inEntry) {
    let cleanLine = line;
    
    // Remove leading "- " from sub-entries
    cleanLine = cleanLine.replace(/^-\s+/, '');
    
    // Check if this is a hyphenated continuation of the term
    // e.g., "CAS -" on one line followed by the rest on next
    if (/^[A-ZÀ-Ü]{3,}\s*-$/.test(cleanLine)) {
      // This is likely a line-broken term, store it
      currentTerm += ' ' + cleanLine.replace(/\s*-$/, '');
    } else if (cleanLine.endsWith('-')) {
      // Hyphenated word continuation
      currentDef.push(cleanLine.slice(0, -1));
    } else {
      currentDef.push(cleanLine);
    }
  }
}

// Save last entry
if (inEntry && currentTerm && currentDef.length > 0) {
  entries.push({
    term: currentTerm,
    meaning: currentDef.join(' ').replace(/\s+/g, ' ').trim()
  });
}

console.log(`Parsed ${entries.length} entries from the dictionary.`);

// Show first 10 entries
console.log('\n--- First 10 entries ---');
entries.slice(0, 10).forEach((e, i) => {
  console.log(`${i + 1}. ${e.term}`);
  console.log(`   ${e.meaning.substring(0, 120)}...`);
});

// Show last 5 entries
console.log('\n--- Last 5 entries ---');
entries.slice(-5).forEach((e, i) => {
  console.log(`${entries.length - 5 + i + 1}. ${e.term}`);
  console.log(`   ${e.meaning.substring(0, 120)}...`);
});

// Merge with existing terminologias.json
let existing = [];
if (fs.existsSync(jsonPath)) {
  existing = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`\nExisting terminologias.json has ${existing.length} entries.`);
}

// Build set of existing normalized terms for dedup
const existingTerms = new Set();
existing.forEach(e => {
  const norm = (e.term || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9\s]/g, '').trim();
  existingTerms.add(norm);
});

// Add new entries, skipping duplicates
let newCount = 0;
let dupCount = 0;
let nextId = existing.length > 0 ? Math.max(...existing.map(e => e.id || 0)) + 1 : 1;

for (const entry of entries) {
  const norm = (entry.term || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9\s]/g, '').trim();
  
  // Skip very short terms or clearly non-medical entries
  if (norm.length < 2) continue;
  
  // Skip if meaning is too short
  if ((entry.meaning || '').length < 10) continue;
  
  if (existingTerms.has(norm)) {
    dupCount++;
    continue;
  }
  
  existing.push({
    id: nextId++,
    term: entry.term,
    meaning: entry.meaning
  });
  existingTerms.add(norm);
  newCount++;
}

console.log(`Added ${newCount} new entries. Skipped ${dupCount} duplicates.`);
console.log(`Total entries in terminologias.json: ${existing.length}`);

// Sort alphabetically by term
existing.sort((a, b) => (a.term || '').localeCompare(b.term || '', 'pt-BR'));

// Re-number IDs
existing.forEach((e, i) => { e.id = i + 1; });

fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2), 'utf-8');
console.log(`Saved ${existing.length} entries to ${jsonPath}`);

// Save parsed entries separately for verification
const parsedPath = path.join(__dirname, '..', 'termos_medicos_parsed.json');
fs.writeFileSync(parsedPath, JSON.stringify(entries, null, 2), 'utf-8');
console.log(`Raw parsed entries saved to ${parsedPath}`);
