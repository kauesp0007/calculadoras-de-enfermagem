import assert from 'node:assert/strict';
import fs from 'node:fs';
import {protectFormPdfPreview} from '../supabase/functions/premium-content/form-pdf-preview.mjs';
const entries=[{id:'form-011',pdf:'/FORMULARIOS_DE_ESCALAS/Ficha_Impressao_Escala_Downton-v2.pdf',catalog:'formularios_de_escalas_assistenciais.html'}];
const source='<!doctype html><html><body><button data-action="print">Imprimir</button><iframe src="'+entries[0].pdf+'#toolbar=0"></iframe><a href="'+entries[0].pdf+'" download>Downloads</a><script>window.open("'+entries[0].pdf+'","_blank")</script></body></html>';
const safe=protectFormPdfPreview(source,entries);
assert(!safe.includes(entries[0].pdf),'Original source must not reach a public viewer/link/script');
assert(!/<iframe\b/i.test(safe));
assert(safe.includes('/img/formularios-previas/form-011.webp'));
assert(safe.includes('data-protected-pdf-action="print"'));
assert(safe.includes('data-protected-pdf-action="download"'));
assert(!/\sdownload(?:\s|>)/i.test(safe));
assert(safe.includes('/js/access/protected-form-pdf.js?v=1'));
assert(safe.includes('max-width:900px!important'),'Preview must not enlarge its source raster');
assert(safe.includes('height:auto!important'),'Preserve natural image ratio and remove oversized wrapper');
assert(safe.includes(':has(>img:not([hidden]))'),'Size limit applies to image preview, not authorized PDF iframe');
assert(safe.includes('img[hidden]{display:none!important}'),'Premium viewer must hide the image despite inline display');
for(const type of ['iframe','object','embed']){const attribute=type==='object'?'data':'src';const html='<body><'+type+' '+attribute+' = "'+entries[0].pdf+'"></'+type+'></body>';assert(protectFormPdfPreview(html,entries).includes('protected-pdf-viewer'));}
const unknown=protectFormPdfPreview('<body><iframe src="/FORMULARIOS_DE_ESCALAS/unknown.pdf"></iframe></body>',entries);
assert(!unknown.includes('unknown.pdf'));assert(!unknown.includes('<iframe'));
const linkOnly=protectFormPdfPreview('<body><a href="'+entries[0].pdf+'">Download</a></body>',entries);assert(linkOnly.includes('data-protected-pdf-action="download"'));
const printAnchor=protectFormPdfPreview('<body><a data-action="print" href="'+entries[0].pdf+'">Print</a></body>',entries);assert.equal((printAnchor.match(/data-protected-pdf-action=/g)||[]).length,1);assert(printAnchor.includes('data-protected-pdf-action="print"'));
assert.equal(protectFormPdfPreview('<body><h1>HTML form</h1></body>',entries),'<body><h1>HTML form</h1></body>');
const edge=fs.readFileSync('supabase/functions/premium-content/index.ts','utf8');
assert(edge.includes('storage.from("assistential-pdfs-private").download(object)'));
assert(!edge.includes('fetch(new URL(form.pdf'),'No public original fallback');
const entitlement=edge.indexOf('if(!(await premiumForUser(user)))',edge.indexOf('url.searchParams.has("download")'));
assert(entitlement>=0&&entitlement<edge.indexOf('.download(object)'),'Server entitlement precedes bytes');
console.log('PASS: PDF preview fail-closed, protected print/download, private storage and unconditional server Premium check.');

const {formPdfStorageObject}=await import('../supabase/functions/premium-content/form-pdf-preview.mjs');
assert.equal(formPdfStorageObject('/FORMULARIOS_DE_ESCALAS/formulário.pdf'),'formul_C3_A1rio.pdf');
assert.equal(formPdfStorageObject('/FORMULARIOS_DE_ESCALAS/EN/test.pdf'),'EN/test.pdf');


// Executa o script real: menu/arraste são restritos à prévia, sem gate paralelo.
const {runInNewContext}=await import('node:vm');
for(const lang of ['pt-BR','en','es']){
  const listeners={},image={style:{},hidden:false};
  const viewer={querySelectorAll:selector=>selector==='img'?[image]:[],querySelector:()=>image};
  const document={documentElement:{lang},querySelectorAll:()=>[viewer],querySelector:()=>null,addEventListener:(name,handler)=>{listeners[name]=handler;}};
  const window={addEventListener:()=>{}};
  runInNewContext(fs.readFileSync('js/access/protected-form-pdf.js','utf8'),{window,document,URL:{revokeObjectURL:()=>{}},Set});
  assert.equal(image.draggable,false);assert.equal(image.style.webkitTouchCallout,'none');
  for(const eventName of ['contextmenu','dragstart']){
    assert.equal(typeof listeners[eventName],'function');
    for(const preview of [true,false]){
      let prevented=false;
      listeners[eventName]({target:{closest:selector=>{assert.equal(selector,'.protected-pdf-viewer img');return preview?image:null;}},preventDefault:()=>{prevented=true;}});
      assert.equal(prevented,preview,eventName+' '+lang+' preview='+preview);
    }
    listeners[eventName]({target:{},preventDefault:()=>assert.fail('Non-image target blocked')});
  }
  assert.equal(typeof listeners.click,'function','Existing protected PDF actions remain attached');
  listeners['auth:logout']();assert.equal(image.hidden,false,'Logout restores the same protected preview');
}
console.log('PASS: PT/EN/ES preview context menu and drag blocked; unrelated targets and protected PDF controls preserved.');
