#!/usr/bin/env node
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const loader=fs.readFileSync("js/access/premium-content-loader.js","utf8");
const lang=fs.readFileSync("lang-selector.js","utf8");
const layout=loader.slice(loader.indexOf("function ensurePremiumLocalizedFormLayoutAfterWrite()"),loader.indexOf("async function ensurePremiumFooterAfterWrite()"));
for(const prefix of ["","en/","es/","fr/","it/","de/","hi/","zh/","ja/","ru/","ko/","tr/","nl/","pl/","sv/","id/","vi/","uk/","ar/"]){
  const styles=[];
  const context={window:{location:{pathname:"/"+prefix+"formulario_escala_de_asa.html"}},document:{
    querySelector:()=>({}),getElementById:id=>styles.find(s=>s.id===id),createElement:()=>({}),head:{appendChild:s=>styles.push(s)}
  }};
  vm.createContext(context);vm.runInContext(layout,context);
  assert.equal(context.ensurePremiumLocalizedFormLayoutAfterWrite(),true,prefix);
  assert.equal(context.ensurePremiumLocalizedFormLayoutAfterWrite(),true,prefix);
  assert.equal(styles.length,1,"Não duplicar CSS");
  assert(styles[0].textContent.includes("z-index:0!important"));
  context.window.location.pathname="/"+prefix+"formularios_de_escalas_assistenciais.html";
  assert.equal(context.ensurePremiumLocalizedFormLayoutAfterWrite(),false,"Não alterar hero do catálogo");
}
assert(loader.includes('await window.__INIT_LANGUAGE_SELECTOR();'),"Loader deve reinicializar após chrome");
assert(loader.indexOf('await window.__INIT_LANGUAGE_SELECTOR();')>loader.indexOf('await window.__ENSURE_GLOBAL_CHROME();'));
const boot=lang.slice(lang.indexOf("let languageSelectorMarkupPromise"),lang.indexOf("function collapseLegacyLanguagePlaceholder"));
async function lifecycle(){
  let fetches=0,writes=0,inits=0,syncs=0,resolveTarget;
  const oldRoot={},newRoot={};
  const target={isConnected:true,querySelector:()=>null};
  Object.defineProperty(target,"innerHTML",{set(){writes++;}});
  const document={readyState:"loading",documentElement:oldRoot,getElementById:()=>null,addEventListener(){}};
  const context={document,window:{},console,fetch:async()=>{fetches++;return {ok:true,text:async()=>"<button/>"};},
    collapseLegacyLanguagePlaceholder(){},resolveLanguageSelectorTarget:()=>new Promise(resolve=>{resolveTarget=resolve;}),
    langSelectorInit(){inits++;},accountLanguageSync(){syncs++;},
    loadAccountMenuLocalizer(){},loadForumModerationBridge(){},loadAccountExtraLocalizer(){}};
  vm.createContext(context);vm.runInContext(boot,context);
  const old=context.window.__INIT_LANGUAGE_SELECTOR();
  for(let n=0;n<6;n++)await Promise.resolve();
  assert(resolveTarget);
  const oldResolve=resolveTarget;document.documentElement=newRoot;
  context.resolveLanguageSelectorTarget=async()=>target;
  const fresh=context.window.__INIT_LANGUAGE_SELECTOR();
  assert.equal(context.window.__INIT_LANGUAGE_SELECTOR(),fresh,"Coalescer chamadas simultâneas");
  oldResolve(target);
  assert.equal(await old,false,"Ignorar montagem do documento destruído");
  assert.equal(await fresh,true);
  await context.window.__INIT_LANGUAGE_SELECTOR();
  assert.equal(fetches,1,"Reutilizar markup");
  assert.equal(writes,1,"Uma montagem no novo documento");
  assert.equal(inits,1);assert.equal(syncs,1);
}
lifecycle().then(()=>console.log("PASS: 19 rotas, CSS idempotente, reidratação após troca de DOM e inicialização sem duplicação.")).catch(e=>{console.error(e);process.exitCode=1;});


const generator=fs.readFileSync("scripts/shellify-premium-public-pages.mjs","utf8");
const versionFunction=generator.slice(generator.indexOf("function versionChromeAssets("),generator.indexOf("const PLACEHOLDER="));
const versionContext={CHROME_ASSET_VERSIONS:{"premium-content-loader.js":"loaderhash","lang-selector.js":"langhash"}};
vm.createContext(versionContext);vm.runInContext(versionFunction,versionContext);
const shell='<script src="/lang-selector.js" defer></script><script src="/js/access/premium-content-loader.js?old=1" defer></script><script src="/global-scripts.js" defer></script>';
const versioned=versionContext.versionChromeAssets(shell);
assert(versioned.includes('/lang-selector.js?v=langhash"'));
assert(versioned.includes('/js/access/premium-content-loader.js?v=loaderhash"'));
assert(versioned.includes('/global-scripts.js"'));
assert.equal(versionContext.versionChromeAssets(versioned),versioned,"Versionamento idempotente");
assert(generator.includes("return versionChromeAssets(source);"),"Shells existentes também devem atualizar as URLs");
console.log("PASS: versionamento dos dois assets sem alterar demais scripts.");
