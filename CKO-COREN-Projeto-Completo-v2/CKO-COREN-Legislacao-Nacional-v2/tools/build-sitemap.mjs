#!/usr/bin/env node
/**
 * tools/build-sitemap.mjs
 *
 * Sitemap XML das rotas publicáveis. Só entram rotas do release liberado:
 * páginas de índice e de ato. Artefatos derivados (recursos, social, PDF de
 * origem) são noindex e ficam fora por contrato.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOW = process.env.CKO_BUILD_NOW || new Date().toISOString();
const day = NOW.slice(0, 10);

const routes = JSON.parse(await readFile(path.join(ROOT, 'registry/routes.registry.json'), 'utf8'));
const PRIORITY = { national: '0.9', regional: '0.8', type: '0.6', act: '0.7' };

const urls = routes.entries
  .filter(e => ['national', 'regional', 'type', 'act'].includes(e.kind))
  .map(e => `  <url>
    <loc>${e.canonical_url}</loc>
    <lastmod>${day}</lastmod>
    <changefreq>${e.kind === 'act' ? 'monthly' : 'weekly'}</changefreq>
    <priority>${PRIORITY[e.kind]}</priority>
  </url>`).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Gerado por tools/build-sitemap.mjs a partir de registry/routes.registry.json.
     Contém apenas rotas do escopo liberado pelo release gate. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

await writeFile(path.join(ROOT, 'generated/sitemap-legislacao-coren.xml'), xml);
console.log(JSON.stringify({ urls: routes.entries.filter(e =>
  ['national', 'regional', 'type', 'act'].includes(e.kind)).length }, null, 2));
