/**
 * pdf-renderer — N-026
 * Renderiza o HTML de impressao a partir do DTO validado. A conversao em PDF
 * acessivel (PDF/UA-1, tagged) e feita por tools/build-pdf.py, e o resultado e
 * conferido pelo pdf-validator.
 */
import { esc } from './page-renderer.mjs';
export const VERSION = '1.0.0';

const CSS = `
@page { size: A4; margin: 18mm 16mm 20mm 16mm; }
body { font-family: Inter, Arial, sans-serif; color:#1E293B; font-size: 10.5pt; line-height:1.5; }
h1 { font-size: 18pt; color:#1A3E74; margin:0 0 4mm; }
h2 { font-size: 12.5pt; color:#1A3E74; margin:6mm 0 2mm; }
.meta { width:100%; border-collapse:collapse; margin:3mm 0; }
.meta th, .meta td { border:1px solid #CBD5E1; padding:2mm 3mm; text-align:left; vertical-align:top; font-size:9.5pt; }
.meta th { width:34%; background:#F1F5F9; color:#334155; }
.note { border-left:3pt solid #D97706; background:#FFFBEB; padding:3mm; font-size:9pt; color:#78350F; }
.foot { margin-top:6mm; font-size:8.5pt; color:#475569; border-top:1px solid #CBD5E1; padding-top:2mm; }
a { color:#1D4ED8; }
`;

export function renderPdfHtml(dto, meta) {
  const p = dto.payload;
  const kind = dto.projection_id.split('/')[1];
  const heading = kind === 'summary' ? 'Resumo do ato regional' : 'Guia de bolso do ato regional';
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8">
<title>${esc(p.identifier)} — ${esc(heading)}</title>
<meta name="author" content="${esc(meta.author)}">
<meta name="description" content="${esc(meta.subject)}">
<style>${CSS}</style>
</head>
<body>
<h1>${esc(p.identifier)}</h1>
<p><strong>${esc(p.title)}</strong></p>
<h2>Identificação canônica</h2>
<table class="meta">
<tbody>
<tr><th scope="row">ID canônico</th><td>${esc(p.canonical_id)}</td></tr>
<tr><th scope="row">Tipo de ato</th><td>${esc(p.act_type)}</td></tr>
<tr><th scope="row">Data</th><td>${esc(p.date || 'não registrada')}</td></tr>
<tr><th scope="row">Emissor</th><td>${esc(p.issuer.name)}</td></tr>
<tr><th scope="row">Jurisdição</th><td>${esc(p.jurisdiction.state)}, ${esc(p.jurisdiction.country)}</td></tr>
<tr><th scope="row">Estado jurídico</th><td>${esc(p.legal_status_display.text)}</td></tr>
<tr><th scope="row">Fonte oficial</th><td><a href="${esc(p.source.url)}">${esc(p.source.url)}</a></td></tr>
<tr><th scope="row">Página canônica</th><td>${esc(p.canonical_url || '')}</td></tr>
</tbody>
</table>
<h2>${esc(heading)}</h2>
<p>${esc(p.summary)}</p>
<h2>Qualificação epistêmica</h2>
<p class="note">${esc(p.legal_status_display.note)} Nível de conteúdo sustentado pela fonte: ${esc(dto.act_content_level)}.
O texto integral e os dispositivos não estão materializados neste artefato; nada é inferido ou reconstruído.</p>
<p class="foot">Projeção ${esc(dto.projection_id)} · DTO ${esc(dto.dto_version)} · gerado em ${esc(dto.generated_at)} ·
lineage ${esc(meta.lineage_id)} · fonte da verdade: documento oficial do conselho regional.</p>
</body>
</html>`;
}
