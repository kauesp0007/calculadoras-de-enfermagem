const PDF_URL = /["'](\/FORMULARIOS_DE_ESCALAS\/(?:(?:EN|ES)\/)?[^"'?#<>]+\.pdf)(?:[?#][^"']*)?["']/gi;
const escape = value => String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
// The existing WebP previews are 439px wide. Never enlarge their raster pixels.
const PREVIEW_STYLE = '<style id="protected-pdf-preview-size">'+
  '.protected-pdf-viewer:has(>img:not([hidden])),:is(div,section,figure):has(>.protected-pdf-viewer>img:not([hidden])){width:100%!important;max-width:439px!important;height:auto!important;min-height:0!important;aspect-ratio:auto!important;margin-inline:auto!important}'+
  '.protected-pdf-viewer>img{max-width:439px!important;width:100%!important;height:auto!important;object-fit:contain}'+
  '.protected-pdf-viewer>img[hidden]{display:none!important}'+
  '</style>';
export function formPdfStorageObject(value) {
  return decodeURIComponent(value.replace(/^\/FORMULARIOS_DE_ESCALAS\//,'')).split('/').map(part => encodeURIComponent(part).replace(/%/g,'_')).join('/');
}
export function protectFormPdfPreview(html, catalogEntries) {
  const normalize = value => {try{return decodeURIComponent(value);}catch(_){return value;}};
  const byPdf = new Map(catalogEntries.map(e => [normalize(e.pdf),e]));
  let protectedCount = 0;
  let primary = null;
  const metadata = e => 'data-protected-pdf-id="'+escape(e.id)+'" data-protected-pdf-catalog="'+escape(e.catalog)+'"';
  let out = html.replace(/<(iframe|object|embed)\b[^>]*>(?:[\s\S]*?<\/\1>)?/gi, tag => {
    const source = tag.match(/(?:src|data)\s*=\s*["'](\/FORMULARIOS_DE_ESCALAS\/[^"'?#]+\.pdf)(?:[?#][^"']*)?["']/i);
    if(!source) return tag;
    protectedCount++;
    const e = byPdf.get(normalize(source[1]));
    if(!e) return '<p role="status">PDF indisponível. PDF unavailable. PDF no disponible.</p>';
    primary ||= e;
    const lang = e.catalog.startsWith('en/')?'en':e.catalog.startsWith('es/')?'es':'pt';
    const preview = '/img/formularios-previas/'+(lang==='pt'?'':lang+'/')+e.id+'.webp';
    const alt = lang==='en'?'Form preview':lang==='es'?'Vista previa del formulario':'Prévia do formulário';
    return '<div class="protected-pdf-viewer" '+metadata(e)+' style="width:100%;height:100%;position:relative"><img src="'+preview+'" alt="'+alt+'" width="439" height="620" loading="lazy" decoding="async" style="display:block;width:100%;height:100%;object-fit:contain"><p class="protected-pdf-status" role="status" aria-live="polite" style="position:absolute;bottom:0;left:0;margin:0;background:#fff;color:#1a3e74"></p></div>';
  });
  out = out.replace(/<a\b[^>]*href=["'](\/FORMULARIOS_DE_ESCALAS\/[^"'?#]+\.pdf)(?:[?#][^"']*)?["'][^>]*>/gi,(tag,pdf) => {
    protectedCount++;
    const e = byPdf.get(normalize(pdf));
    primary ||= e;
    if(!e) return tag.replace(/href=["'][^"']*["']/i,'href="#" aria-disabled="true"').replace(/\sdownload(?:=["'][^"']*["'])?/i,'');
    return tag.replace(/href=["'][^"']*["']/i,'href="#protected-form-pdf" '+metadata(e)+' data-protected-pdf-action="download"').replace(/\sdownload(?:=["'][^"']*["'])?/i,'');
  });
  if(!protectedCount) return html;
  if(primary) out = out.replace(/<(?:button|a)\b[^>]*data-action=["']print["'][^>]*>/gi,tag=>tag.replace(/\sdata-protected-pdf-(?:action|id|catalog)="[^"]*"/gi,'').slice(0,-1)+' '+metadata(primary)+' data-protected-pdf-action="print">');
  // Remove legacy inline window.open and source URLs from the public document.
  out = out.replace(PDF_URL,'"#protected-form-pdf"');
  return out.replace(/<\/body>/i,PREVIEW_STYLE+'<script src="/js/access/protected-form-pdf.js?v=1" defer></script></body>');
}
