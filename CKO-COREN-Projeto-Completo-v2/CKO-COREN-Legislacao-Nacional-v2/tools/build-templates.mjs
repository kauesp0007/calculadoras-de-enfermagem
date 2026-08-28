#!/usr/bin/env node
/**
 * tools/build-templates.mjs
 *
 * Gera os 26 templates de superfície (14 recursos + 7 social + 5 PDF) a partir
 * do projection-catalog. Os templates deixam de ser scaffolds soltos:
 *  - o token de URL canônica dos scaffolds v1 foi eliminado;
 *  - cada template declara a projeção que o alimenta, o nível de conteúdo
 *    exigido e o renderer responsável;
 *  - os slots usam exclusivamente campos da whitelist da superfície, então um
 *    template não consegue exibir um campo que o gate não liberou;
 *  - os caminhos de asset são resolvidos pela profundidade real do arquivo.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTIONS } from '../engines/projection-catalog.mjs';
import { FORMATS } from '../renderers/social-renderer.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const RENDERER = {
  resources: 'renderers/resource-renderer.mjs',
  social: 'renderers/social-renderer.mjs',
  pdf: 'renderers/pdf-renderer.mjs',
};

const SLOT = f => `{{${f}}}`;

function slotsFor(def) {
  const fields = def.allowed_fields.filter(f => f !== 'route');
  return fields.map(f => `      <div class="slot" data-field="${f}">${SLOT(f)}</div>`).join('\n');
}

function template(def) {
  const depth = def.template.split('/').length - 1;   // templates/<familia>/<arquivo>
  const rel = '../'.repeat(depth);
  const family = def.projection_id.split('/')[1];
  const fmt = FORMATS[def.projection_id];
  const gate = def.asserts_normative_content
    ? 'REQUER_EVIDENCIA — bloqueado enquanto não houver fragmento de evidência resolvido'
    : 'LIBERADO_PARA_METADADOS — publica apenas o que o canônico sustenta';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<title>Template · ${def.projection_id}</title>
<link href="/public/output.css" rel="stylesheet">
<link href="/global-styles.css" rel="stylesheet">
<link href="${rel}assets/css/coren-regulatory-production.css" rel="stylesheet">
<script src="${rel}assets/js/cko-production-shell-loader.js" defer></script>
</head>
<body
  data-template="${family}"
  data-surface="${def.surface}"
  data-projection-id="${def.projection_id}"
  data-content-requirement="${def.content_requirement}"
  data-asserts-normative-content="${def.asserts_normative_content}"
  data-renderer="${RENDERER[def.surface]}"
  data-dto-contract="ValidatedProjectionDTO@1.0.0"
  ${fmt ? `data-media-size="${fmt.w}x${fmt.h}"` : ''}>
<a href="#template-mount" class="skip-link">Pular para o conteúdo principal</a>
<div id="accessibility-placeholder"></div>
<div id="global-header-container"></div>
<div id="language-selector-placeholder"></div>
<main id="template-mount" class="main-content">
  <section class="panel">
    <h1>${family}</h1>
    <p class="rule-note">
      Superfície <code>${def.projection_id}</code> · nível de conteúdo exigido:
      <code>${def.content_requirement}</code> · renderer: <code>${RENDERER[def.surface]}</code>.
    </p>
    <p class="status-note">
      <strong>Gate desta superfície:</strong> ${gate}.
      O template não carrega canônico por conta própria: ele é preenchido pelo renderer
      a partir de um ValidatedProjectionDTO já aprovado pelo projection-validator.
      Campos fora da whitelist da superfície são rejeitados no build.
    </p>
    <div class="slots">
${slotsFor(def)}
    </div>
  </section>
</main>
<div id="footer-placeholder"></div>
</body>
</html>
`;
}

const targets = PROJECTIONS.filter(p => p.template.startsWith('templates/'));
for (const def of targets) {
  const file = path.join(ROOT, def.template);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, template(def));
}
console.log(JSON.stringify({ templates: targets.length }, null, 2));
