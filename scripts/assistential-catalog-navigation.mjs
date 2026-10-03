/** Catalog consultation is Free; authorization remains on the destination actions. */
const ROOT_TARGETS = [
  'classificacao_wifi.html','formulario_bps.html','formulario_cam.html','cries.html',
  'formulario_escala_curb65.html','formulario_bishop.html','formulario_escala_cincinnati.html',
  'formulario_escala_de_glasgow.html','cornell.html','gds.html','formulario_escala_de_downton.html',
  'formulario_de_fugulin.html','gds.html','formulario_escala_de_gosnell.html',
  'formulario_escala_de_hamilton.html','formulario_escala_de_hendrich.html',
  'formulario_escala_de_humpty.html','formulario_escala_de_johns.html','formulario_escala_de_jouvet.html',
  'katz.html','formulario_morse.html','formulario_escala_de_perroca.html',
  'formulario_escala_de_elpo.html','formulario_escala_de_fast.html','formulario_escala_de_flacc.html',
  'formulario_escala_de_four.html','formulario_meem.html','formulario_capurro.html',
  'formulario_impresso_saep.html','formulario_impresso_sbar.html','formulario_escala_de_lanss.html',
  'formulario_escala_de_lachs.html','formulario_escala_de_lawton.html','formulario_escala_de_meows.html',
  'formulario_escala_de_news.html','formulario_escala_de_nihss.html','formulario_escala_de_nips.html',
  'formulario_escala_de_norton.html','formulario_escala_de_ofras.html','formulario_escala_de_painad.html',
  'formulario_escala_de_aldrete.html','formulario_escala_de_apache.html','formulario_escala_de_apgar.html',
  'formulario_escala_de_asa.html','formulario_escala_de_ballard.html','formulario_escala_de_barthel.html',
  'formulario_escala_de_berg.html','formulario_escala_de_braden.html','formulario_escala_de_downes.html',
  'formulario_escala_de_escalanumerica.html','formulario_escala_de_manchester.html',
  'formulario_escala_de_moca.html','formulario_escala_de_pelod.html','formulario_escala_de_pews.html',
  'formulario_escala_de_prism.html','formulario_escala_de_qsofa.html','formulario_escala_de_ramsay.html',
  'formulario_escala_de_rancholosamigos.html','formulario_escala_de_richmond.html',
  'formulario_escala_de_saps.html','formulario_escala_de_silverman.html',
  'formulario_escala_de_sistema_sinbad.html','formulario_escala_de_sofa.html',
  'formulario_escala_de_tinetti.html','formulario_escala_de_waterlow.html','formulario_escala_de_zarit.html'
];
const TEXT = {
  pt: {button:'Clique para acessar', hint:'Abrir formulário', free:'Consulta livre',
    subtitle:'Clique no formulário para abrir a página HTML. Download e impressão são verificados na página de destino.'},
  en: {button:'Click to access', hint:'Open form', free:'Free browsing',
    subtitle:'Click a form to open its HTML page. Download and printing access is checked on the destination page.'},
  es: {button:'Haz clic para acceder', hint:'Abrir formulario', free:'Consulta gratuita',
    subtitle:'Haz clic en un formulario para abrir su página HTML. El acceso a la descarga y la impresión se verifica en la página de destino.'}
};
const REGISTRY = /<script\b[^>]*id=["']assistential-form-downloads["'][^>]*>([\s\S]*?)<\/script>/i;
export function catalogLanguage(path) {
  if(path==='formularios_de_escalas_assistenciais.html') return 'pt';
  if(path==='en/formularios_de_escalas_assistenciais.html') return 'en';
  if(path==='es/formularios_de_escalas_assistenciais.html') return 'es';
  throw new Error('Unsupported catalog: '+path);
}
export function catalogEntries(html,path) {
  const lang=catalogLanguage(path), match=html.match(REGISTRY);
  if(!match) throw new Error('Private registry missing: '+path);
  const entries=JSON.parse(match[1]);
  if(entries.length!==(lang==='pt'?66:63)) throw new Error('Unexpected catalog size: '+path);
  const seen=new Set();
  return entries.map(entry=>{
    if(!/^form-\d{3}$/.test(entry.id)||seen.has(entry.id)) throw new Error('Invalid/duplicate form ID');
    seen.add(entry.id);
    const n=Number(entry.id.slice(5));
    if(!ROOT_TARGETS[n-1]) throw new Error('Unknown form ID: '+entry.id);
    let target=ROOT_TARGETS[n-1];
    if(lang!=='pt') {
      const prefix='/FORMULARIOS_DE_ESCALAS/'+lang.toUpperCase()+'/';
      if(!entry.pdf.startsWith(prefix)||!/^[a-z0-9_-]+\.pdf$/.test(entry.pdf.slice(prefix.length))) throw new Error('Unexpected localized PDF');
      target=lang+'/'+entry.pdf.slice(prefix.length).replace(/\.pdf$/,'.html');
    }
    return {...entry,href:'/'+target};
  });
}
export function updateCatalogNavigation(html,path) {
  const lang=catalogLanguage(path), text=TEXT[lang], entries=catalogEntries(html,path);
  if(html.includes('id="assistential-catalog-navigation-ui"')) return html;
  const byId=new Map(entries.map(x=>[x.id,x]));
  const seen=new Set();
  let output=html.replace(/<figure\b[^>]*class="form-card"[^>]*>[\s\S]*?<\/figure>/g,card=>{
    const id=card.match(/data-form-id="(form-\d{3})"/)?.[1], entry=byId.get(id);
    const image=card.match(/<img\b[^>]*class="form-preview"[^>]*>/)?.[0];
    const name=card.match(/<span class="form-name">([\s\S]*?)<\/span>/)?.[1];
    if(!entry||!image||!name||seen.has(id)) throw new Error('Invalid catalog card: '+id);
    seen.add(id);
    const label=(text.button+': '+name.replace(/<[^>]*>/g,'')).replace(/"/g,'&quot;');
    return '<figure class="form-card">\n<div class="form-pdf-wrap"><a class="form-preview-link" href="'+entry.href+'" data-premium-action="allow" tabindex="-1" aria-hidden="true">'+image+'</a><span class="access-hint" aria-hidden="true">'+text.hint+'</span></div>\n<figcaption class="form-caption"><span class="form-name">'+name+'</span><a class="form-access-button" href="'+entry.href+'" data-premium-action="allow" aria-label="'+label+'">'+text.button+'</a></figcaption>\n</figure>';
  });
  if(seen.size!==entries.length) throw new Error('Catalog card count mismatch');
  output=output.replace(/<style id="premium-form-download-ui">[\s\S]*?<\/style>/,
    '<style id="assistential-catalog-navigation-ui">\n.form-card{position:relative;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}\n.form-card:hover{transform:translateY(-2px);border-color:#2563eb;box-shadow:0 10px 24px rgba(26,62,116,.13)}\n.form-preview-link{display:block;width:100%;height:100%}\n.form-access-button{position:relative;display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 12px;border:1px solid #1a3e74;border-radius:8px;background:#1a3e74;color:#fff;font:inherit;font-size:12px;font-weight:700;text-decoration:none;flex-shrink:0}\n.form-access-button:hover{background:#1e4d8c}\n.form-access-button:focus-visible{outline:3px solid #2563eb;outline-offset:3px}\n.access-hint{position:absolute;right:8px;top:8px;padding:5px 8px;border:1px solid #bfdbfe;border-radius:999px;background:#eff6ff;color:#1a3e74;font-size:10px;font-weight:800;pointer-events:none}\n@media(prefers-reduced-motion:reduce){.form-card{transition:none}}\n</style>');
  output=output.replace(/<button\b[^>]*data-action="print"[^>]*>[\s\S]*?<\/button>\s*/g,'');
  output=output.replace(/<p\b[^>]*id="download-status"[^>]*>[\s\S]*?<\/p>\s*/g,'');
  output=output.replace(/<dialog\b[^>]*id="forms-plan-dialog"[^>]*>[\s\S]*?<\/dialog>\s*/g,'');
  output=output.replace(/<script\b[^>]*src="\/js\/access\/assistential-forms-catalog\.js(?:\?[^" ]*)?"[^>]*><\/script>\s*/g,'');
  output=output.replace(/<h2 class="font-sans">[\s\S]*?<\/h2>/,'<h2 class="font-sans">'+text.subtitle+'</h2>');
  output=output.replace(/<span class="hero-chip">(?:Download Premium|Premium download|Descarga Premium)<\/span>/g,'<span class="hero-chip">'+text.free+'</span>');
  // Keep the private PDF registry intact: existing server-side authorization still protects legacy download URLs.
  if(output.includes('data-form-action=')||output.includes('form-download-hitarea"')) throw new Error('Legacy action left in catalog');
  return output;
}
export function validateCatalogNavigation(html,path) {
  const lang=catalogLanguage(path), entries=catalogEntries(html,path);
  if(!html.includes('id="assistential-catalog-navigation-ui"')) throw new Error('Navigation styling missing: '+path);
  if(/data-form-id=|data-form-action=|class="form-download-hitarea"|src="\/js\/access\/assistential-forms-catalog\.js/.test(html)) throw new Error('Legacy catalog PDF controls: '+path);
  if(html.includes('id="forms-plan-dialog"')) throw new Error('Catalog still offers subscription instead of navigation');
  const cards=html.match(/<figure\b[^>]*class="form-card"[^>]*>[\s\S]*?<\/figure>/g)||[];
  if(cards.length!==entries.length) throw new Error('Navigation count mismatch: '+path);
  entries.forEach((entry,index)=>{
    const card=cards[index], links=card.match(/<a\b[^>]*>/g)||[];
    if(links.length!==2||links.some(link=>!link.includes('href="'+entry.href+'"')||!link.includes('data-premium-action="allow"'))) throw new Error('Incorrect form destination: '+entry.id);
    if(!card.includes(TEXT[lang].button)||!card.includes('min-height')&& !html.includes('min-height:44px')) throw new Error('Missing localized accessible CTA');
    if(/<button\b|\bdownload\s*(?:=|>)/i.test(card)) throw new Error('PDF action remains in navigation card');
  });
  return entries;
}
