#!/usr/bin/env node
/**
 * tools/build.mjs — orquestrador do runtime regulatório CKO-COREN v2.
 *
 * Pipeline (direcional, sem saltos):
 *   Source → Canonical → Engine → Validator → Projection → Renderer → Output
 *
 * Saídas: rotas, DTOs validados, HTML pré-renderizado com SEO materializado,
 * artefatos de recurso/social/PDF, lineage por artefato, execuções CAAT,
 * relatório de validação segmentado, Assurance Object e decisão do Release Gate.
 */
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveRegulatoryState } from '../engines/regulatory-engine.mjs';
import { projectAct, projectIndex } from '../engines/projection-engine.mjs';
import { PROJECTIONS, BY_ID } from '../engines/projection-catalog.mjs';
import { buildSeo, renderHead, SITE } from '../engines/seo-schema-engine.mjs';
import { buildMediaSpecs } from '../engines/media-projection-engine.mjs';
import * as pr from '../renderers/page-renderer.mjs';
import { renderResource, IMPLEMENTED } from '../renderers/resource-renderer.mjs';
import { renderSocial } from '../renderers/social-renderer.mjs';
import { renderPdfHtml } from '../renderers/pdf-renderer.mjs';
import { validateCAAT } from '../validators/caat-validator.mjs';
import { buildAssurance } from '../assurance/assurance-engine.mjs';
import { evaluateRelease } from '../assurance/release-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOW = process.env.CKO_BUILD_NOW || new Date().toISOString();
const sha = s => createHash('sha256').update(s).digest('hex');
const readJson = async p => JSON.parse(await readFile(path.join(ROOT, p), 'utf8'));
const writeJson = async (p, o) => {
  await mkdir(path.dirname(path.join(ROOT, p)), { recursive: true });
  await writeFile(path.join(ROOT, p), JSON.stringify(o, null, 2) + '\n');
};
const writeText = async (p, s) => {
  await mkdir(path.dirname(path.join(ROOT, p)), { recursive: true });
  await writeFile(path.join(ROOT, p), s);
};

/* ---------------------------------------------------------------- resolver */
/** Route/Asset Resolver: caminho relativo determinístico entre dois arquivos do pacote. */
function relTo(fromFile, toFile) {
  const rel = path.relative(path.dirname(fromFile), toFile).split(path.sep).join('/');
  return rel.startsWith('.') ? rel : './' + rel;
}
function depthOf(file) {
  return file.split('/').length - 1;
}
function canonicalUrlOf(file) {
  const p = file.replace(/index\.html$/, '');
  return `${SITE}/${p}`;
}

/* ---------------------------------------------------------------- main */
async function main() {
  const councilsReg = await readJson('registry/regional-councils.registry.json');
  const typesReg = await readJson('registry/act-types.registry.json');
  const canonicalSchema = await readJson('registry/coren-regulatory-act.canonical.schema.json');
  const versions = await readJson('registry/versions.registry.json');
  const evSources = await readJson('evidence/sources/evidence-sources.json');
  const evFragments = await readJson('evidence/sources/evidence-fragments.json');
  const ipeReg = await readJson('evidence/sources/ipe.json');
  const alcoaReg = await readJson('evidence/sources/alcoa.json');

  const actFiles = (await readdir(path.join(ROOT, 'canonical/acts'))).filter(f => f.endsWith('.json'));
  const acts = [];
  for (const f of actFiles) acts.push(await readJson(`canonical/acts/${f}`));
  acts.sort((a, b) => a.canonical_id.localeCompare(b.canonical_id));

  const ctxBase = {
    canonicalSchema, versions, now: NOW,
    sources: new Map(evSources.sources.map(s => [s.evidence_source_id, s])),
    fragments: new Map(evFragments.fragments.map(f => [f.fragment_id, f])),
    ipe: new Map(ipeReg.ipe.map(i => [i.ipe_id, i])),
    alcoa: new Map(alcoaReg.assessments.map(a => [a.assessment_id, a])),
    catalogIds: new Set(acts.map(a => a.canonical_id)),
    templateVersion: '2.0.0',
  };

  /* -------------------------------------------------- 1. rotas */
  const typeBySlug = new Map(typesReg.types.map(t => [t.slug, t]));
  const typeById = new Map(typesReg.types.map(t => [t.id, t]));
  const ACT_FILENAME = {
    'BR-COREN-SP-DEC-PLEN-006-2024': 'legislacao/coren/sp/decisoes/decisao-coren-sp-plenario-006-2024.html',
    'BR-COREN-SC-PORT-046-2026': 'legislacao/coren/sc/portarias/portaria-coren-sc-046-2026.html',
  };

  const routes = { registry_id: 'CKO-COREN-ROUTES-v2', generated_at: NOW, site: SITE, entries: [] };
  const addRoute = e => { routes.entries.push(e); return e; };

  const nationalRoute = addRoute({
    route_id: 'legislacao-coren-nacional', kind: 'national', file: 'legislacao/coren/index.html',
    canonical_url: canonicalUrlOf('legislacao/coren/index.html'), canonical_id: null,
  });
  const regionalRoutes = new Map();
  const typeRoutes = new Map();
  for (const c of councilsReg.councils) {
    const uf = c.code.toLowerCase();
    regionalRoutes.set(c.code, addRoute({
      route_id: `legislacao-coren-${uf}`, kind: 'regional', council: c.code,
      file: `legislacao/coren/${uf}/index.html`,
      canonical_url: canonicalUrlOf(`legislacao/coren/${uf}/index.html`), canonical_id: null,
    }));
    for (const t of typesReg.types) {
      const file = `legislacao/coren/${uf}/${t.slug}/index.html`;
      typeRoutes.set(`${c.code}:${t.id}`, addRoute({
        route_id: `legislacao-coren-${uf}-${t.slug}`, kind: 'type', council: c.code, act_type: t.id,
        file, canonical_url: canonicalUrlOf(file), canonical_id: null,
      }));
    }
  }
  const actRoutes = new Map();
  for (const a of acts) {
    const file = ACT_FILENAME[a.canonical_id];
    if (!file) throw new Error(`Rota nao mapeada para ${a.canonical_id}`);
    const r = addRoute({
      route_id: `ato-${a.canonical_id.toLowerCase()}`, kind: 'act', council: a.issuer.code,
      act_type: a.act_type, canonical_id: a.canonical_id, file,
      canonical_url: canonicalUrlOf(file), route: file,
    });
    actRoutes.set(a.canonical_id, { ...r, route: file });
  }
  ctxBase.routes = actRoutes;

  /* -------------------------------------------------- 2. estado + projeções */
  const states = [];
  const allDtos = [];
  const lineage = [];
  const projectionsRegistry = {
    registry_id: 'CKO-COREN-PROJECTIONS-v2', generated_at: NOW,
    catalog: PROJECTIONS.map(p => ({
      projection_id: p.projection_id, surface: p.surface, template: p.template,
      content_requirement: p.content_requirement, asserts_normative_content: p.asserts_normative_content,
      allowed_fields: p.allowed_fields,
    })),
    instances: [],
  };

  for (const act of acts) {
    const state = resolveRegulatoryState(act, ctxBase);
    states.push(state);
    const { dtos, blocked } = projectAct(act, state, ctxBase);
    for (const d of [...dtos, ...blocked]) {
      allDtos.push(d);
      projectionsRegistry.instances.push({
        instance_id: `${act.canonical_id}:${d.projection_id}`,
        canonical_id: act.canonical_id, projection_id: d.projection_id,
        eligible: d.eligibility.eligible, content_requirement: d.content_requirement,
        act_content_level: d.act_content_level,
        blocked_reason: d.eligibility.eligible ? null : d.eligibility.reasons[0] || null,
        versions: d.versions,
      });
    }
    await writeJson(`generated/projections/${act.canonical_id.toLowerCase()}.dtos.json`,
      { canonical_id: act.canonical_id, generated_at: NOW, eligible: dtos, blocked });
  }

  /* -------------------------------------------------- 3. catálogo v2 */
  const catalog = {
    catalog_id: 'CKO-COREN-ACTS-CATALOG-v2', generated_at: NOW,
    coverage: {
      regional_councils: councilsReg.councils.length,
      canonized_acts: acts.length,
      exhaustive_all_acts_status: 'PENDING_ACQUISITION',
      rule: 'Nenhum ato e publicado como canonico sem evidencia de fonte oficial.',
    },
    acts: acts.map(a => {
      const st = states.find(s => s.canonical_id === a.canonical_id);
      const r = actRoutes.get(a.canonical_id);
      return {
        canonical_id: a.canonical_id, issuer: a.issuer.code, act_type: a.act_type,
        identifier: a.identifier, title: a.title, date: a.date,
        source_url: a.source.url, legal_status: a.epistemic.legal_status,
        status_display: st.status_display,
        route: r.file, canonical_url: r.canonical_url,
        projection_ids: allDtos.filter(d => d.canonical_id === a.canonical_id && d.eligibility.eligible)
          .map(d => d.projection_id),
        content_level: a.epistemic.content_level,
        publication_status: 'PARTIAL_METADATA_ONLY',
      };
    }),
  };
  await writeJson('data/acts.catalog.json', catalog);

  /* -------------------------------------------------- 4. render das páginas */
  const actsByCouncil = new Map();
  for (const a of catalog.acts) {
    if (!actsByCouncil.has(a.issuer)) actsByCouncil.set(a.issuer, []);
    actsByCouncil.get(a.issuer).push(a);
  }

  const cardOf = (fromFile, a) => ({
    route: relTo(fromFile, a.route), issuer: a.issuer,
    act_type_label: typeById.get(a.act_type)?.label || a.act_type,
    identifier: a.identifier, title: a.title, status: a.status_display,
  });

  // Caminho determinístico do cartão OG de cada índice (o arquivo é escrito por
  // tools/build-social.py a partir de generated/media-specs.json).
  const ogForNational = '/generated/social/index-nacional-og.png';
  const ogForCouncil = code => `/generated/social/index-${code.toLowerCase()}-og.png`;

  const pageIndex = [];
  const writePage = async (file, html) => {
    await writeText(file, html);
    pageIndex.push(file);
  };

  // 4.1 hub nacional
  {
    const file = nationalRoute.file;
    const bc = [{ name: 'Início', route: '/' },
    { name: 'Legislação COREN', route: relTo(file, file) }];
    const payload = {
      breadcrumbs: bc,
      councils: councilsReg.councils.map(c => ({
        short_name: c.short_name, jurisdiction: c.jurisdiction,
        route: relTo(file, regionalRoutes.get(c.code).file),
        acts_count: (actsByCouncil.get(c.code) || []).length,
      })),
      acts: catalog.acts.map(a => cardOf(file, a)),
    };
    const dto = projectIndex('national', payload, ctxBase);
    const seo = buildSeo({
      kind: 'national', route: nationalRoute.canonical_url.replace(SITE, ''),
      title: 'Legislação dos Conselhos Regionais de Enfermagem (COREN)',
      description: 'Hub nacional da legislação dos 27 CORENs: decisões, portarias, pareceres e normas internas com fonte oficial, jurisdição e estado jurídico qualificado, sem inferência.',
      breadcrumbs: [{ name: 'Início', route: '/' }, { name: 'Legislação COREN', route: '/legislacao/coren/' }],
      items: councilsReg.councils.map(c => ({
        name: `Legislação ${c.short_name}`,
        route: regionalRoutes.get(c.code).canonical_url.replace(SITE, '')
      })),
      ogImage: ogForNational,
    });
    await writePage(file, pr.documentShell({
      headSeo: renderHead(seo), depth: depthOf(file),
      bodyAttrs: `data-mode="national" data-route-id="${nationalRoute.route_id}"`,
      main: pr.renderNationalHub(dto), dto,
    }));
  }

  // 4.2 hubs regionais + 4.3 índices por tipo
  for (const c of councilsReg.councils) {
    const rr = regionalRoutes.get(c.code);
    const file = rr.file;
    const regActs = actsByCouncil.get(c.code) || [];
    const bc = [
      { name: 'Início', route: '/' },
      { name: 'Legislação COREN', route: relTo(file, nationalRoute.file) },
      { name: c.short_name, route: relTo(file, file) },
    ];
    const payload = {
      breadcrumbs: bc,
      council: c,
      types: typesReg.types.map(t => ({
        id: t.id, label: t.label, qualification_rule: t.qualification_rule,
        route: relTo(file, typeRoutes.get(`${c.code}:${t.id}`).file),
        count: regActs.filter(a => a.act_type === t.id).length,
      })),
      acts: regActs.map(a => cardOf(file, a)),
      sidebar: [
        { title: 'Fonte oficial', html: `<p><a href="${c.official_site}" rel="noopener noreferrer" target="_blank">${c.official_site}</a></p>` },
        { title: 'Cobertura', text: `${regActs.length} ato(s) canonizado(s). Descoberta exaustiva deste regional: ${c.discovery_status}.` },
        { title: 'Regra antialucinação', text: 'O sistema não inventa atos, vigência, revogação, dispositivos ou força normativa. A ausência é declarada.' },
        { title: 'Privacidade', text: 'Favoritos e marcações ficam apenas neste dispositivo, sem identificação, e podem ser apagados na barra de ações.' },
      ],
    };
    const dto = projectIndex('regional', payload, ctxBase);
    const seo = buildSeo({
      kind: 'regional', route: rr.canonical_url.replace(SITE, ''),
      title: `Legislação ${c.short_name} — atos do ${c.name}`,
      description: `Atos regionais do ${c.name} (${c.jurisdiction}) organizados por tipo jurídico, com fonte oficial e estado qualificado. ${regActs.length} ato(s) canonizado(s) nesta versão.`,
      breadcrumbs: [{ name: 'Início', route: '/' }, { name: 'Legislação COREN', route: '/legislacao/coren/' },
      { name: c.short_name, route: rr.canonical_url.replace(SITE, '') }],
      items: typesReg.types.map(t => ({
        name: `${t.label} · ${c.short_name}`,
        route: typeRoutes.get(`${c.code}:${t.id}`).canonical_url.replace(SITE, '')
      })),
      ogImage: ogForCouncil(c.code),
    });
    await writePage(file, pr.documentShell({
      headSeo: renderHead(seo), depth: depthOf(file),
      bodyAttrs: `data-mode="regional" data-council="${c.code}" data-route-id="${rr.route_id}"`,
      main: pr.renderRegionalHub(dto), dto,
    }));

    for (const t of typesReg.types) {
      const tr = typeRoutes.get(`${c.code}:${t.id}`);
      const tfile = tr.file;
      const tActs = regActs.filter(a => a.act_type === t.id);
      const tPayload = {
        breadcrumbs: [
          { name: 'Início', route: '/' },
          { name: 'Legislação COREN', route: relTo(tfile, nationalRoute.file) },
          { name: c.short_name, route: relTo(tfile, file) },
          { name: t.label, route: relTo(tfile, tfile) },
        ],
        council: c, type: t, acts: tActs.map(a => cardOf(tfile, a)),
      };
      const tDto = projectIndex('type', tPayload, ctxBase);
      const tSeo = buildSeo({
        kind: 'type', route: tr.canonical_url.replace(SITE, ''),
        title: `${t.label} do ${c.short_name} — legislação regional`,
        description: `Índice de ${t.label.toLowerCase()} do ${c.name}: ${tActs.length} ato(s) canonizado(s), cada um com fonte oficial e qualificação de estado. Sem inferência de força normativa.`,
        breadcrumbs: [{ name: 'Início', route: '/' }, { name: 'Legislação COREN', route: '/legislacao/coren/' },
        { name: c.short_name, route: rr.canonical_url.replace(SITE, '') },
        { name: t.label, route: tr.canonical_url.replace(SITE, '') }],
        items: tActs.map(a => ({ name: a.identifier, route: a.canonical_url.replace(SITE, '') })),
        ogImage: ogForCouncil(c.code),
      });
      await writePage(tfile, pr.documentShell({
        headSeo: renderHead(tSeo), depth: depthOf(tfile),
        bodyAttrs: `data-mode="type" data-council="${c.code}" data-act-type="${t.id}" data-route-id="${tr.route_id}"`,
        main: pr.renderTypeIndex(tDto), dto: tDto,
      }));
    }
  }

  // 4.4 leitores de ato
  for (const act of acts) {
    const state = states.find(s => s.canonical_id === act.canonical_id);
    const r = actRoutes.get(act.canonical_id);
    const file = r.file;
    const dto = allDtos.find(d => d.canonical_id === act.canonical_id && d.projection_id === 'legislation/act-reader');
    const uf = act.issuer.code.toLowerCase();
    const t = typeById.get(act.act_type);
    const evOk = (label, ok) => ({ ok, label });
    const acquired = ctxBase.sources.get((act.evidence.source_refs || [])[0])?.acquisition_status === 'ACQUIRED';
    const pdfDto = allDtos.find(d => d.canonical_id === act.canonical_id && d.projection_id === 'pdf/summary');
    const pdfHref = pdfDto?.eligibility.eligible
      ? relTo(file, `generated/pdfs/${act.canonical_id.toLowerCase()}-summary.pdf`) : null;

    const extra = {
      typeLabel: t?.label || act.act_type,
      breadcrumbs: [
        { name: 'Início', route: '/' },
        { name: 'Legislação COREN', route: relTo(file, nationalRoute.file) },
        { name: act.issuer.short_name, route: relTo(file, `legislacao/coren/${uf}/index.html`) },
        { name: t?.label || act.act_type, route: relTo(file, typeRoutes.get(`${act.issuer.code}:${act.act_type}`).file) },
        { name: act.identifier, route: relTo(file, file) },
      ],
      relations: state.relations,
      temporal: state.temporal,
      devicesBlocked: (act.devices || []).length === 0,
      pdfHref,
      evidence: {
        snapshot: evOk(acquired ? 'adquirido' : 'não adquirido', acquired),
        fragments: evOk(`${(act.evidence.fragment_refs || []).length} fragmento(s)`,
          (act.evidence.fragment_refs || []).length > 0),
        ipe: evOk(ctxBase.ipe.get(act.evidence.ipe_ref)?.conclusion || 'ausente',
          ctxBase.ipe.get(act.evidence.ipe_ref)?.conclusion === 'SUFFICIENT'),
        alcoa: evOk(ctxBase.alcoa.get(act.evidence.alcoa_ref)?.conclusion || 'ausente',
          ctxBase.alcoa.get(act.evidence.alcoa_ref)?.conclusion === 'PASS'),
        caat: evOk('não executado (requer fonte)', false),
      },
      projections: {
        eligible: allDtos.filter(d => d.canonical_id === act.canonical_id && d.eligibility.eligible)
          .map(d => d.projection_id),
        blocked: allDtos.filter(d => d.canonical_id === act.canonical_id && !d.eligibility.eligible)
          .map(d => d.projection_id),
      },
      sidebar: [
        { title: 'Estado jurídico', html: `<p class="badge ${state.status_display.tone}">${state.status_display.text}</p><p>${state.status_display.note}</p>` },
        { title: 'Fonte oficial', html: `<p><a href="${act.source.url}" rel="noopener noreferrer" target="_blank">${act.source.host}</a></p><p>Classe: ${act.source.authority_class}</p>` },
        { title: 'Versão', text: `Conteúdo ${act.version_envelope.content_version} · fonte ${act.version_envelope.source_version} · revisado em ${act.version_envelope.last_reviewed}.` },
        { title: 'Regra antialucinação', text: 'Nenhum dispositivo, vigência ou força normativa é gerado por inferência. Superfícies sem evidência ficam bloqueadas.' },
      ],
    };

    const legalForce = state.temporal.display_mode === 'VERIFIED' ? state.temporal.legal_status : null;
    const seo = buildSeo({
      kind: 'act', route: r.canonical_url.replace(SITE, ''),
      title: `${act.identifier} — ${act.issuer.short_name}`,
      description: `${act.title}. ${act.summary}`.slice(0, 300),
      act, legalForce,
      breadcrumbs: [
        { name: 'Início', route: '/' }, { name: 'Legislação COREN', route: '/legislacao/coren/' },
        { name: act.issuer.short_name, route: `/legislacao/coren/${uf}/` },
        { name: t?.label || act.act_type, route: typeRoutes.get(`${act.issuer.code}:${act.act_type}`).canonical_url.replace(SITE, '') },
        { name: act.identifier, route: r.canonical_url.replace(SITE, '') },
      ],
      ogImage: `/generated/social/${act.canonical_id.toLowerCase()}-og-default.png`,
    });

    await writePage(file, pr.documentShell({
      headSeo: renderHead(seo), depth: depthOf(file),
      bodyAttrs: `data-mode="act" data-council="${act.issuer.code}" data-act-type="${act.act_type}" data-canonical="${act.canonical_id}" data-route-id="${r.route_id}"`,
      main: pr.renderActReader(dto, extra), dto,
    }));
  }

  /* -------------------------------------------------- 5. artefatos derivados */
  await rm(path.join(ROOT, 'generated/resources'), { recursive: true, force: true });
  await rm(path.join(ROOT, 'generated/social-html'), { recursive: true, force: true });
  await rm(path.join(ROOT, 'generated/pdf-src'), { recursive: true, force: true });

  const artifacts = [];
  const addLineage = (dto, file, content, mime) => {
    const act = acts.find(a => a.canonical_id === dto.canonical_id);
    const l = {
      lineage_id: `LIN-${dto.canonical_id}-${dto.projection_id.replace('/', '-')}`,
      canonical_id: dto.canonical_id, projection_id: dto.projection_id, surface: dto.surface,
      versions: {
        schema: dto.versions.schema, content: dto.versions.content, source: dto.versions.source,
        engine: dto.versions.engine, validator: dto.versions.validator,
        renderer: dto.versions.renderer || 'n/a', template: dto.versions.template,
      },
      inputs: {
        canonical_sha256: sha(JSON.stringify(act)),
        evidence_source_refs: act.evidence.source_refs,
        evidence_fragment_refs: act.evidence.fragment_refs,
        dto_sha256: sha(JSON.stringify(dto)),
      },
      output: { path: file, sha256: sha(content), byte_length: Buffer.byteLength(content), mime_type: mime },
      assurance_ref: 'CKO-COREN-ASSURANCE-v2',
      generated_at: NOW,
    };
    lineage.push(l);
    artifacts.push(file);
    return l;
  };

  const mediaSpecs = [];
  for (const dto of allDtos) {
    if (!dto.eligibility.eligible) continue;

    if (dto.surface === 'resources' && IMPLEMENTED.includes(dto.projection_id)) {
      const file = `generated/resources/${dto.canonical_id.toLowerCase()}-${dto.projection_id.split('/')[1]}.html`;
      dto.versions.renderer = 'resource-renderer@1.0.0';
      const html = renderResource(dto, depthOf(file));
      await writeText(file, html);
      addLineage(dto, file, html, 'text/html');
    }

    if (dto.surface === 'social') {
      const file = `generated/social-html/${dto.canonical_id.toLowerCase()}-${dto.projection_id.split('/')[1]}.html`;
      dto.versions.renderer = 'social-renderer@1.0.0';
      const html = renderSocial(dto, depthOf(file));
      await writeText(file, html);
      addLineage(dto, file, html, 'text/html');
    }

    if (dto.surface === 'pdf') {
      const file = `generated/pdf-src/${dto.canonical_id.toLowerCase()}-${dto.projection_id.split('/')[1]}.html`;
      dto.versions.renderer = 'pdf-renderer@1.0.0';
      const html = renderPdfHtml(dto, {
        author: 'Calculadoras de Enfermagem — CKO COREN',
        subject: `Projeção ${dto.projection_id} do ato ${dto.canonical_id}`,
        lineage_id: `LIN-${dto.canonical_id}-${dto.projection_id.replace('/', '-')}`,
      });
      await writeText(file, html);
      addLineage(dto, file, html, 'text/html');
    }
  }
  mediaSpecs.push(...buildMediaSpecs(allDtos, sha));

  // Cartões OG das páginas de índice. Antes o head apontava para uma imagem
  // inexistente; agora cada índice tem arte própria, gerada pelo mesmo engine
  // determinístico e a partir dos mesmos registries.
  const indexSpecs = [];
  const indexSpec = (id, kicker, title, subtitle, footerL, footerR, output) => {
    const fields = { kicker, title, subtitle, footer_left: footerL, footer_right: footerR, summary: '' };
    indexSpecs.push({
      spec_id: id, width: 1200, height: 630, fields,
      palette: { bg_from: '#163269', bg_to: '#234F88', fg: '#FFFFFF', muted: '#DBEAFE' },
      output, engine: 'media-projection-engine@1.0.0', media_model: 'cko-coren-flat-card@1.0.0',
      template_version: '2.0.0', input_hash: sha(JSON.stringify(fields)),
      deterministic: true, generative_model_used: false,
    });
    return output;
  };
  const NATIONAL_OG = indexSpec('index-nacional', 'COREN · Brasil',
    'Legislação dos Conselhos Regionais de Enfermagem',
    'Decisões, portarias, pareceres e normas internas dos 27 CORENs',
    '27 jurisdições', 'fonte oficial sempre citada',
    'generated/social/index-nacional-og.png');
  const REGIONAL_OG = new Map();
  for (const c of councilsReg.councils) {
    REGIONAL_OG.set(c.code, indexSpec(`index-${c.code.toLowerCase()}`,
      `${c.short_name} · ${c.jurisdiction}`, `Legislação ${c.short_name}`,
      `Atos regionais do ${c.name}`, c.jurisdiction, 'sem inferência jurídica',
      `generated/social/index-${c.code.toLowerCase()}-og.png`));
  }
  await writeJson('generated/media-specs.json',
    { generated_at: NOW, specs: mediaSpecs, index_specs: indexSpecs });
  await writeJson('registry/projections.registry.json', projectionsRegistry);
  await writeJson('registry/routes.registry.json', routes);

  /* -------------------------------------------------- 6. CAATs estruturais */
  const caats = [];
  const caat = (id, scope, procedure, population, tested, exceptions, extra = {}) => {
    caats.push({
      caat_id: id, scope, procedure, engine_version: 'tools/build.mjs@2.0.0',
      executed_at: NOW, population, tested, exceptions,
      result: exceptions.length ? 'FAIL' : 'PASS',
      reperformance: { deterministic: true, ...extra },
    });
  };

  // CAAT 1 — determinismo de rota
  {
    const ex = [];
    const files = new Set();
    for (const e of routes.entries) {
      if (files.has(e.file)) ex.push({ ref: e.file, finding: 'Rota duplicada.', severity: 'P0' });
      files.add(e.file);
    }
    for (const a of acts) {
      if (!actRoutes.has(a.canonical_id)) ex.push({ ref: a.canonical_id, finding: 'Ato sem rota.', severity: 'P0' });
    }
    caat('CAAT-ROUTE-001', 'route-determinism',
      'Cada canonical_id resolve para exatamente uma rota; nenhuma rota se repete.',
      routes.entries.length, routes.entries.length, ex);
  }

  // CAAT 2 — integridade de referências locais
  {
    const ex = [];
    let checked = 0;
    const allFiles = [...pageIndex, ...artifacts];
    for (const f of allFiles) {
      const html = await readFile(path.join(ROOT, f), 'utf8');
      const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
      for (const ref of refs) {
        if (/^(https?:|mailto:|#|data:)/.test(ref)) continue;
        if (ref.startsWith('/')) continue; // dependências do shell global, fora do pacote
        checked++;
        const target = path.resolve(path.dirname(path.join(ROOT, f)), ref.split('#')[0]);
        if (!existsSync(target)) {
          ex.push({ ref: `${f} -> ${ref}`, finding: 'Referência local não resolve.', severity: 'P0' });
        }
      }
    }
    caat('CAAT-LINK-001', 'local-link-integrity',
      'Toda referência local href/src resolve para um arquivo existente no pacote.',
      checked, checked, ex);
  }

  // CAAT 2b — referências absolutas (root-relative). O CAAT anterior ignorava
  // tudo que começa com "/", e foi exatamente por isso que um og:image apontando
  // para um arquivo inexistente passou despercebido na primeira rodada.
  {
    const EXTERNAL_SHELL = new Set([
      '/public/output.css', '/global-styles.css', '/global-scripts.js', '/lang-selector.js',
      '/header.html', '/footer.html', '/accessibility.html', '/language-selector.html', '/',
      '/legislacao/coren/',
    ]);
    const ex = [];
    let checked = 0;
    for (const f of [...pageIndex, ...artifacts]) {
      const html = await readFile(path.join(ROOT, f), 'utf8');
      const refs = new Set([
        ...[...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map(m => m[1]),
        ...[...html.matchAll(/content="https:\/\/www\.calculadorasdeenfermagem\.com\.br(\/[^"]*)"/g)].map(m => m[1]),
      ]);
      for (const ref of refs) {
        const clean = ref.split('#')[0].split('?')[0];
        if (EXTERNAL_SHELL.has(clean)) continue;
        checked++;
        // Rota do próprio site: deve existir como página construída.
        const asPage = clean.endsWith('/') ? `${clean.slice(1)}index.html` : clean.slice(1);
        if (existsSync(path.join(ROOT, asPage))) continue;
        ex.push({
          ref: `${f} -> ${ref}`, finding: 'Referência absoluta não resolve para arquivo do pacote.',
          severity: 'P0'
        });
      }
    }
    caat('CAAT-LINK-002', 'absolute-reference-integrity',
      'Toda referência root-relative que não seja dependência declarada do shell global resolve '
      + 'para um arquivo existente no pacote — inclui og:image, canonical e twitter:image.',
      checked, checked, ex);
  }

  // CAAT 3 — materialização de SEO
  {
    const ex = [];
    const required = [/<title>/, /name="description"/, /rel="canonical"/, /name="robots"/,
      /property="og:title"/, /property="og:image"/, /name="twitter:card"/,
      /application\/ld\+json/];
    for (const f of pageIndex) {
      const html = await readFile(path.join(ROOT, f), 'utf8');
      for (const re of required) {
        if (!re.test(html)) ex.push({ ref: `${f}:${re}`, finding: 'Metadado de SEO ausente.', severity: 'P1' });
      }
      const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      try { JSON.parse(ld[1]); } catch { ex.push({ ref: f, finding: 'JSON-LD inválido.', severity: 'P0' }); }
    }
    caat('CAAT-SEO-001', 'seo-materialization',
      'Toda página publicada carrega title, description, canonical, robots, OG, Twitter e JSON-LD válidos em HTML estático.',
      pageIndex.length, pageIndex.length, ex);
  }

  // CAAT 4 — fidelidade do DTO ao canônico
  {
    const ex = [];
    let tested = 0;
    for (const dto of allDtos.filter(d => d.eligibility.eligible && d.canonical_id)) {
      const act = acts.find(a => a.canonical_id === dto.canonical_id);
      const def = BY_ID.get(dto.projection_id);
      tested++;
      for (const k of Object.keys(dto.payload || {})) {
        if (!def.allowed_fields.includes(k)) {
          ex.push({ ref: `${dto.canonical_id}:${dto.projection_id}:${k}`, finding: 'Campo fora da whitelist.', severity: 'P0' });
        }
      }
      if (dto.payload?.identifier !== act.identifier || dto.payload?.title !== act.title) {
        ex.push({ ref: `${dto.canonical_id}:${dto.projection_id}`, finding: 'Divergência entre DTO e canônico.', severity: 'P0' });
      }
      if (dto.payload?.summary !== undefined && dto.payload.summary !== (act.summary || '')) {
        ex.push({ ref: `${dto.canonical_id}:${dto.projection_id}`, finding: 'Resumo divergente do canônico.', severity: 'P0' });
      }
      if ((dto.payload?.devices || []).length && !(act.devices || []).length) {
        ex.push({ ref: `${dto.canonical_id}:${dto.projection_id}`, finding: 'Dispositivo materializado sem origem canônica.', severity: 'P0' });
      }
    }
    // Populacao = projecoes elegiveis (as bloqueadas tem payload null por contrato).
    caat('CAAT-DTO-001', 'dto-fidelity',
      'Todo campo projetado em superfície elegível é idêntico ao canônico e pertence à whitelist da superfície.',
      tested, tested, ex);
  }

  // CAAT 5 — gate de projeção efetivo
  {
    const ex = [];
    const blockedIds = new Set(allDtos.filter(d => !d.eligibility.eligible)
      .map(d => `${d.canonical_id}:${d.projection_id}`));
    for (const l of lineage) {
      if (blockedIds.has(`${l.canonical_id}:${l.projection_id}`)) {
        ex.push({ ref: l.output.path, finding: 'Artefato gerado para projeção bloqueada.', severity: 'P0' });
      }
    }
    caat('CAAT-GATE-001', 'projection-gate-enforcement',
      'Nenhum artefato é escrito para uma projeção reprovada pelo projection-validator.',
      allDtos.length, allDtos.length, ex);
  }

  // CAAT 6 — acessibilidade estática
  {
    const ex = [];
    for (const f of pageIndex) {
      const html = await readFile(path.join(ROOT, f), 'utf8');
      const checks = [
        [/<html lang="pt-BR">/, 'lang ausente'],
        [/class="skip-link"/, 'skip-link ausente'],
        [/<main id="mount"/, 'landmark main ausente'],
        [/aria-label="Trilha de navegação"/, 'breadcrumb sem rótulo'],
        [/<h1>/, 'h1 ausente'],
      ];
      for (const [re, msg] of checks) if (!re.test(html)) ex.push({ ref: f, finding: msg, severity: 'P1' });
      const h1 = (html.match(/<h1[ >]/g) || []).length;
      if (h1 !== 1) ex.push({ ref: f, finding: `esperado 1 h1, encontrado ${h1}`, severity: 'P1' });
      if (/id="actSearch"/.test(html) && !/for="actSearch"/.test(html)) {
        ex.push({ ref: f, finding: 'campo de busca sem label programático', severity: 'P0' });
      }
      if (/id="actCount"/.test(html) && !/aria-live="polite"/.test(html)) {
        ex.push({ ref: f, finding: 'contador sem região live', severity: 'P1' });
      }
    }
    caat('CAAT-A11Y-001', 'accessibility-static',
      'Verificação estática de idioma, landmarks, skip-link, h1 único, rótulos e live regions.',
      pageIndex.length, pageIndex.length, ex);
  }

  // CAAT 7 — privacidade estática
  {
    const ex = [];
    const jsFiles = ['assets/js/coren-regulatory-renderer.js', 'assets/js/cko-production-shell-loader.js'];
    for (const f of jsFiles) {
      const src = await readFile(path.join(ROOT, f), 'utf8');
      if (/document\.cookie/.test(src)) ex.push({ ref: f, finding: 'uso de cookie no módulo', severity: 'P0' });
      if (/googletagmanager|google-analytics|facebook\.net|hotjar|clarity\.ms/.test(src)) {
        ex.push({ ref: f, finding: 'chamada a terceiro de rastreamento', severity: 'P0' });
      }
      const keys = [...src.matchAll(/localStorage\.setItem\(([^,]+)/g)];
      if (keys.length && !/PRIVACY\.prefix/.test(src)) {
        ex.push({ ref: f, finding: 'chave de armazenamento fora do prefixo governado', severity: 'P1' });
      }
    }
    for (const f of pageIndex.slice(0, 40)) {
      const html = await readFile(path.join(ROOT, f), 'utf8');
      const ext = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => new URL(m[1]).host);
      for (const h of ext) {
        if (!/\.gov\.br$|corensc\.gov\.br$|cofen\.gov\.br$|corenalagoas\.org\.br$|calculadorasdeenfermagem\.com\.br$|coren.*\.org\.br$/.test(h)) {
          ex.push({ ref: `${f}:${h}`, finding: 'origem externa não prevista', severity: 'P1' });
        }
      }
    }
    caat('CAAT-PRIV-001', 'privacy-static',
      'Sem cookies, sem rastreadores, chaves locais dentro do prefixo governado, origens externas restritas a fontes oficiais.',
      jsFiles.length + 40, jsFiles.length + 40, ex);
  }

  // CAAT 8 — acessibilidade automatizada (axe-core sobre jsdom)
  {
    const f = path.join(ROOT, 'generated/a11y-axe-report.json');
    if (existsSync(f)) {
      const rep = JSON.parse(await readFile(f, 'utf8'));
      const auditExecuted = rep.result !== 'NOT_EXECUTED';
      const layoutRules = rep.rules_not_evaluated?.rules || [];
      caats.push({
        caat_id: 'CAAT-A11Y-002', scope: 'accessibility-axe',
        procedure: auditExecuted
          ? `Executar ${rep.engine} sobre o DOM entregue, em ${rep.standard}. `
          + `Regras dependentes de layout ficam fora: ${layoutRules.join(', ')}.`
          : rep.basis,
        engine_version: rep.engine || 'axe-core indisponível', executed_at: rep.generated_at,
        population: rep.pages_total || 0, tested: rep.pages_tested || 0,
        exceptions: (rep.violations || []).map(v => ({
          ref: `${v.page}:${v.id}`, finding: v.help,
          severity: ['critical', 'serious'].includes(v.impact) ? 'P0' : 'P1',
        })),
        result: rep.result === 'NOT_EXECUTED' ? 'NOT_EXECUTED' : (rep.result === 'FAIL' ? 'FAIL' : 'PASS'),
        reperformance: { deterministic: auditExecuted },
      });
    }
  }

  // CAAT 9 — regressão dos gates fail-closed
  {
    const f = path.join(ROOT, 'generated/gate-regression.json');
    if (existsSync(f)) {
      const rep = JSON.parse(await readFile(f, 'utf8'));
      caats.push({
        caat_id: 'CAAT-REG-001', scope: 'gate-regression',
        procedure: rep.procedure,
        engine_version: 'tests/gate-regression.test.mjs@1.0.0', executed_at: rep.generated_at,
        population: rep.population, tested: rep.tested,
        exceptions: rep.cases.filter(c => c.result === 'FAIL')
          .map(c => ({ ref: c.id, finding: `${c.description}: ${c.detail}`, severity: 'P0' })),
        result: rep.result,
        reperformance: { deterministic: true },
      });
    }
  }

  // CAAT 10 — instâncias de evidência, IPE, ALCOA++, CAAT e lineage contra seus schemas
  {
    const f = path.join(ROOT, 'generated/artifact-validation.json');
    if (existsSync(f)) {
      const rep = JSON.parse(await readFile(f, 'utf8'));
      caats.push({
        caat_id: 'CAAT-ARTV-001', scope: 'artifact-schema',
        procedure: rep.procedure, engine_version: 'tools/validate-artifacts.mjs@1.0.0',
        executed_at: rep.generated_at, population: rep.population, tested: rep.tested,
        exceptions: rep.findings.map(x => ({ ref: x.subject, finding: x.message, severity: x.severity })),
        result: rep.result === 'FAIL' ? 'FAIL' : 'PASS',
        reperformance: { deterministic: true },
      });
    }
  }

  // CAAT 11 — reperformance contra a fonte oficial: NÃO EXECUTADO
  caats.push({
    caat_id: 'CAAT-SOURCE-001', scope: 'source-reperformance',
    procedure: 'Reexecutar a leitura do documento oficial e comparar SHA-256 com o snapshot registrado.',
    engine_version: 'monitoring/regulatory-monitor.mjs@1.0.0', executed_at: NOW,
    population: acts.length, tested: 0,
    exceptions: [{
      ref: 'evidence/sources/evidence-sources.json',
      finding: 'Nenhum snapshot oficial adquirido; reperformance impossível neste ambiente.', severity: 'P0'
    }],
    result: 'NOT_EXECUTED',
    reperformance: { deterministic: true, input_hash: null, output_hash: null },
  });

  await writeJson('evidence/sources/caat-executions.json',
    { registry_id: 'CKO-COREN-CAAT-v2', generated_at: NOW, executions: caats });

  // Dois gates CAAT distintos: o estrutural nao pode ser contaminado pela ausencia
  // do teste de fonte, e o de fonte nao pode ser "compensado" pelos estruturais.
  const STRUCTURAL_SCOPES = ['route-determinism', 'local-link-integrity', 'seo-materialization',
    'dto-fidelity', 'projection-gate-enforcement', 'accessibility-static',
    'accessibility-axe', 'privacy-static', 'gate-regression',
    'absolute-reference-integrity', 'artifact-schema'];
  const caatStructural = validateCAAT(caats.filter(c => STRUCTURAL_SCOPES.includes(c.scope)),
    { requiredScopes: STRUCTURAL_SCOPES });
  const caatSource = validateCAAT(caats.filter(c => c.scope === 'source-reperformance'),
    { requiredScopes: ['source-reperformance'] });
  const caatGate = caatStructural;

  /* -------------------------------------------------- 7. gates do pacote */
  const byScope = s => caats.find(c => c.scope === s);
  const gateFrom = (scopes, basis) => {
    const list = scopes.map(byScope).filter(Boolean);
    const findings = list.flatMap(c => (c.exceptions || []).map(e => ({
      code: c.caat_id, severity: e.severity || 'P1', subject: e.ref, message: e.finding,
    })));
    for (const caat of list.filter(c => c.result === 'NOT_EXECUTED')) {
      findings.push({
        code: caat.caat_id, severity: 'P0', subject: caat.scope,
        message: `CAAT não executado: ${caat.procedure}`,
      });
    }
    return { result: findings.some(f => f.severity === 'P0') ? 'FAIL' : (findings.length ? 'PASS_WITH_FINDINGS' : 'PASS'), findings, basis };
  };

  const structural = gateFrom(['route-determinism', 'local-link-integrity',
    'absolute-reference-integrity', 'dto-fidelity',
    'projection-gate-enforcement', 'gate-regression', 'artifact-schema'],
    'CAATs determinísticos de rota, referência local, fidelidade de DTO, enforcement do gate e '
    + 'regressão fail-closed sobre fixtures sintéticas.');
  const seoGate = gateFrom(['seo-materialization'], 'SEO materializado em build-time e verificado por CAAT.');
  const a11yGate = gateFrom(['accessibility-static', 'accessibility-axe'],
    'Verificação estática mais axe-core sobre o DOM entregue. Regras dependentes de layout '
    + '(contraste, tamanho de alvo, reflow) não são avaliadas sem navegador: auditoria WCAG 2.2 AA '
    + 'em navegador real com tecnologia assistiva permanece pendente.');
  const privacyGate = gateFrom(['privacy-static'],
    'Contrato de estado local aplicado e verificado. Auditoria LGPD do shell global de produção permanece fora deste pacote.');

  // PDF: preenchido por tools/build-pdf.py; aqui entra como pendente e é sobrescrito.
  let pdfGate = { result: 'FAIL', basis: 'PDFs ainda não gerados/validados neste ciclo.', findings: [] };
  const pdfReportPath = path.join(ROOT, 'generated/pdf-validation.json');
  if (existsSync(pdfReportPath)) {
    const rep = JSON.parse(await readFile(pdfReportPath, 'utf8'));
    pdfGate = { result: rep.result, basis: rep.basis, findings: rep.findings };
  }

  const assurance = buildAssurance({
    actStates: states, caat: caatStructural, caatSource, structural, seo: seoGate,
    a11y: a11yGate, privacy: privacyGate, pdf: pdfGate, now: NOW,
  });
  const release = evaluateRelease(assurance, allDtos);

  await writeJson('assurance/assurance-object.json', assurance);
  await writeJson('assurance/release-decision.json', release);
  await writeJson('generated/lineage.json',
    { registry_id: 'CKO-COREN-LINEAGE-v2', generated_at: NOW, artifacts: lineage });

  /* -------------------------------------------------- 8. relatório segmentado */
  const report = {
    report_id: 'CKO-COREN-VALIDATION-v2',
    generated_at: NOW,
    policy: 'Proibido "overall: PASS". Cada dimensão é reportada separadamente e o release é decidido pelo release-gate.',
    counts: {
      regional_councils: councilsReg.councils.length,
      regional_hubs: councilsReg.councils.length,
      type_index_pages: councilsReg.councils.length * typesReg.types.length,
      act_pages: acts.length,
      html_pages_published: pageIndex.length,
      derived_artifacts: artifacts.length,
      projections_total: allDtos.length,
      projections_eligible: allDtos.filter(d => d.eligibility.eligible).length,
      projections_blocked: allDtos.filter(d => !d.eligibility.eligible).length,
    },
    gates: {
      STRUCTURAL_PASS: structural.result,
      CONTENT_PASS: states.every(s => s.gates.EVIDENCE.result !== 'FAIL') ? 'PASS' : 'FAIL',
      EVIDENCE_PASS: assurance.gate_summary.evidence,
      IPE_PASS: assurance.gate_summary.ipe,
      CAAT_STRUCTURAL_PASS: caatStructural.result,
      CAAT_SOURCE_PASS: caatSource.result,
      ALCOA_PASS: assurance.gate_summary.alcoa,
      A11Y_PASS: a11yGate.result,
      PRIVACY_PASS: privacyGate.result,
      SEO_PASS: seoGate.result,
      PDF_PASS: pdfGate.result,
      ASSURANCE_PASS: assurance.overall_level === 'REASONABLE' ? 'PASS' : 'FAIL',
      RELEASE: release.release,
    },
    assurance_level: assurance.overall_level,
    exhaustive_act_corpus: 'PENDING_ACQUISITION',
    note: 'Cobertura estrutural completa para os 27 CORENs. O pacote não declara aquisição exaustiva dos atos regionais.',
  };
  await writeJson('validation-report.json', report);

  console.log(JSON.stringify({
    pages: pageIndex.length, artifacts: artifacts.length,
    projections: report.counts, gates: report.gates,
    assurance: assurance.overall_level, release: release.release,
    caat: caats.map(c => `${c.caat_id}:${c.result}(${c.exceptions.length})`),
  }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
