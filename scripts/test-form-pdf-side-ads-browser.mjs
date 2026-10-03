import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createRequire} from 'node:module';
import {protectFormPdfPreview} from '../supabase/functions/premium-content/form-pdf-preview.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const fixturesRoot=process.env.FORM_AD_FIXTURES||'/tmp/form-pdf-side-ad-fixtures';
const qaRoot=process.env.FORM_AD_QA||'/tmp/form-pdf-side-ad-qa';
fs.mkdirSync(fixturesRoot,{recursive:true});fs.mkdirSync(qaRoot,{recursive:true});
if(!fs.readdirSync(fixturesRoot).length){
 const rows=JSON.parse(gunzipSync(fs.readFileSync(root+'/scripts/fixtures/form-pdf-side-ads.json.gz')));
 for(const row of rows){assert(/^((en|es)\/)?formulario_[^/]+\.html$/i.test(row.path));assert(!row.html.includes('/FORMULARIOS_DE_ESCALAS/'));const file=path.join(fixturesRoot,row.path);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,row.html);}
}
const global=fs.readFileSync(root+'/global-scripts.js','utf8');
const start=global.indexOf('const CONTROLLED_AD_CLIENT');
const end=global.indexOf('\ndocument.addEventListener("DOMContentLoaded", function () {',start);
const policy=global.slice(start,end);
assert(start>0&&end>start);
const registry=JSON.parse(fs.readFileSync(root+'/scripts/assistential-preview-map.json'));
const fixtures=fs.readdirSync(fixturesRoot,{recursive:true}).filter(f=>f.endsWith('.html'));
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox']});
let total=0;
async function setup(file='formulario_escala_de_downton.html',width=1440,bill=null,consent='accepted',hold=false,shell=false,requestPath=file){
 const context=await browser.newContext({viewport:{width,height:1000}});
 const page=await context.newPage();let sdkRequests=0,release;
 const original=fs.readFileSync(fixturesRoot+'/'+file,'utf8');
 let html=protectFormPdfPreview(original,registry).replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<ins\b[\s\S]*?<\/ins>/gi,'');
 if(shell)html='<html lang="pt"><head></head><body><main id="premium-content-placeholder"></main></body></html>';
 html=html.replace(/src="(\/img\/formularios-previas\/[^"?]+)(?:\?[^" ]*)?"/g,(_,p)=>'src="data:image/webp;base64,'+fs.readFileSync(root+p).toString('base64')+'"');
 await context.route('**/*',async route=>{
  const url=route.request().url();
  if(url.startsWith('http://forms.test/'))return route.fulfill({contentType:'text/html',body:html});
  if(url.includes('/pagead/js/adsbygoogle.js')){
   sdkRequests++;if(hold)await new Promise(r=>release=r);
   return route.fulfill({contentType:'application/javascript',body:'window._sdkLoaded=true;window._adPushes=window._adPushes||0;window.adsbygoogle={push:function(){window._adPushes++;var a=Array.from(document.querySelectorAll("ins.adsbygoogle")).find(a=>!a.hasAttribute("data-adsbygoogle-status")&&a.getBoundingClientRect().width>0);if(a){a.setAttribute("data-adsbygoogle-status","done");a.style.background="#edf2f7";a.textContent="AdSense test 160 × 600";}}};'});
  }
  return route.abort();
 });
 await page.goto('http://forms.test/'+requestPath);
 await page.evaluate(({bill,consent})=>{
  localStorage.setItem('cookieConsent',consent);window.__IS_PREMIUM_ROUTE=true;window._bill=bill;window._adPushes=0;window._authHandlers=[];
  window.Auth={init:async()=>{if(window._authHold)await new Promise(r=>window._authRelease=r);},currentUser:()=>window._bill?{uid:'fixture'}:null,billingStatus:()=>window._bill,refreshProfile:async()=>{},onAuthChange:f=>window._authHandlers.push(f),onProfileChange:f=>window._authHandlers.push(f)};
 },{bill,consent});
 await page.addScriptTag({content:policy});
 await page.evaluate(()=>{initLazyLoadServices();window.__INIT_FORM_PDF_SIDE_ADS();});
 return {page,context,get requests(){return sdkRequests;},release:()=>release&&release()};
}
const premium={resolved:true,plan:'premium',premium_expires_at:new Date(Date.now()+86400000).toISOString()};
const unavailable={resolved:false,plan:'verifying',billingUnavailable:true};
const free={resolved:true,plan:'free',premium_expires_at:null};
for(const file of ['formulario_escala_de_downton.html','en/formulario_escala_de_flacc.html','es/formulario_escala_de_flacc.html','formulario_meem.html']){
 const t=await setup(file);await t.page.waitForFunction(()=>window._adPushes===2);
 const b=await t.page.evaluate(()=>{const q=s=>document.querySelector(s).getBoundingClientRect();return {card:q('.form-pdf-ad-card').width,rail:q('.form-pdf-side-ad').width,height:q('.form-pdf-side-ad ins').height,overflow:document.documentElement.scrollWidth>innerWidth,count:document.querySelectorAll('[data-ad-slot="1045005779"]').length};});
 assert(b.card<=780&&b.rail===160&&b.height===600&&!b.overflow&&b.count===2,JSON.stringify(b));
 await t.page.evaluate(()=>window.__INIT_FORM_PDF_SIDE_ADS());await t.page.waitForTimeout(30);assert.equal(await t.page.evaluate(()=>window._adPushes),2);
 if(!file.includes('meem'))await t.page.locator('.form-pdf-ad-layout').screenshot({path:qaRoot+'/qa-'+file.replaceAll('/','-')+'.png'});
 await t.page.setViewportSize({width:375,height:900});assert.equal(await t.page.evaluate(()=>getComputedStyle(document.querySelector('.form-pdf-side-ad')).display),'none');assert.equal(await t.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await t.context.close();total++;
}
for(const [bill,consent] of [[premium,'accepted'],[unavailable,'accepted'],[free,'refused']]){
 const t=await setup(undefined,1440,bill,consent);await t.page.waitForTimeout(150);assert.equal(t.requests,0);assert.equal(await t.page.locator('.form-pdf-side-ad').count(),0);await t.context.close();total++;
}
const mobile=await setup(undefined,375);await mobile.page.waitForTimeout(150);assert.equal(await mobile.page.evaluate(()=>window._adPushes),0);await mobile.page.setViewportSize({width:1440,height:1000});await mobile.page.waitForFunction(()=>window._adPushes===2);await mobile.context.close();total++;
for(const route of ['fr/formulario_escala_de_flacc.html','formularios_de_escalas_assistenciais.html','morse.html']){const t=await setup(undefined,1440,null,'accepted',false,false,route);await t.page.waitForTimeout(100);assert.equal(t.requests,0);await t.context.close();total++;}
const shell=await setup(undefined,1440,null,'accepted',false,true);await shell.page.waitForTimeout(100);assert.equal(shell.requests,0);await shell.context.close();total++;
for(const kind of ['consent','premium','unavailable']){
 const t=await setup(undefined,1440,free,'accepted',true);await t.page.waitForFunction(()=>document.querySelector('script[src*="adsbygoogle.js"]'));
 for(let n=0;n<50&&t.requests===0;n++)await t.page.waitForTimeout(10);
 assert.equal(t.requests,1,'SDK route must be waiting before the transition');
 if(kind==='consent')await t.page.evaluate(()=>window.applyConsent({ad_storage:'denied',analytics_storage:'denied'}));
 else await t.page.evaluate(b=>{window._authHold=true;window._bill=b;window._authHandlers[0]();},{...kind==='premium'?premium:unavailable});
 t.release();await t.page.waitForFunction(()=>window._sdkLoaded);assert.equal(await t.page.evaluate(()=>window._adPushes),0);
 assert.equal(await t.page.evaluate(()=>getComputedStyle(document.querySelector('.form-pdf-side-ad')).display),'none');
 if(kind!=='consent')await t.page.evaluate(()=>{window._authHold=false;window._authRelease();});
 await t.context.close();total++;
}
const restored=await setup(undefined,1440,null);await restored.page.waitForFunction(()=>window._adPushes===2);
await restored.page.evaluate(b=>{window._bill=b;window._authHandlers[0]();},premium);await restored.page.waitForFunction(()=>__premiumAdState.premium);
assert.equal(await restored.page.evaluate(()=>document.querySelector('.form-pdf-ad-card').getBoundingClientRect().width),900);
await restored.page.evaluate(b=>{window._bill=b;window._authHandlers[0]();},free);await restored.page.waitForFunction(()=>getComputedStyle(document.querySelector('.form-pdf-side-ad')).display==='block');assert.equal(await restored.page.evaluate(()=>window._adPushes),2);await restored.context.close();total++;
// Todos os documentos reais: estrutura mantém exatamente um visualizador e duas rails.
const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();await context.route('**/*',r=>r.abort());
for(const file of fixtures){
 let html=protectFormPdfPreview(fs.readFileSync(fixturesRoot+'/'+file,'utf8'),registry).replace(/<script\b[\s\S]*?<\/script>/gi,'');
 await page.setContent(html);await page.addScriptTag({content:global.slice(global.indexOf('var __formPdfAdMediaBound'),global.indexOf('\nwindow.__INIT_FORM_PDF_SIDE_ADS')) .replace('var __formPdfAdMediaBound = false;','var __formPdfAdMediaBound = false;const CONTROLLED_AD_CLIENT="ca-pub-6472730056006847";function isFormPdfSideAdsPage(){return true;}')});
 await page.evaluate(()=>placeFormPdfSideAds());
 assert.equal(await page.locator('.protected-pdf-viewer').count(),1,file+' viewer');assert.equal(await page.locator('.form-pdf-side-ad').count(),2,file+' slots');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,file+' overflow');
 // Novo document/realm para evitar redeclaração dos const no próximo fixture.
 await page.goto('about:blank');
}
await context.close();await browser.close();console.log('PASS browser: '+total+' permission/consent/layout scenarios; '+fixtures.length+' real PT/EN/ES documents; no live AdSense traffic.');
