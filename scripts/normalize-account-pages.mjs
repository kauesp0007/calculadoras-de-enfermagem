#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT=process.cwd();
const LANGS=["en","es","fr","it","de","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"];
const PAGES=["perfil.html","configuracoes.html","favoritos.html","historico.html"];
const APPLY=process.argv.includes("--apply");
const AUDIT=process.argv.includes("--audit");

function accountFiles(){
  const out=PAGES.map(page=>({lang:"pt",rel:"conta/"+page}));
  for(const lang of LANGS){
    for(const page of PAGES) out.push({lang,rel:lang+"/conta/"+page});
  }
  return out;
}

function normalizePrefetch(html,lang){
  const prefix=lang==="pt"?"/":"/"+lang+"/";
  return html.replace(/<link\b([^>]*\brel=["']prefetch["'][^>]*)>/gi,function(tag,attrs){
    var next=tag;
    if(/href=["'](?:\.\/)?global-body-elements\.html["']/i.test(next)||
       /href=["']\/global-body-elements\.html["']/i.test(next)){
      next=next.replace(/href=["'][^"']*global-body-elements\.html["']/i,'href="'+prefix+'global-body-elements.html"');
    }
    if(/href=["'](?:\.\/)?footer\.html["']/i.test(next)||
       /href=["']\/footer\.html["']/i.test(next)){
      next=next.replace(/href=["'][^"']*footer\.html["']/i,'href="'+prefix+'footer.html"');
    }
    return next;
  });
}

function removeLegacyFooterFetchers(html){
  return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,function(block,attrs,body){
    if(/fetch\s*\(\s*["'][^"']*footer\.html["']/i.test(body)&&/footer-placeholder/i.test(body)){
      return "";
    }
    return block;
  });
}

function repairNestedProfileStyles(html){
  if(!html.includes('id="perfil-professional-ui"')) return html;
  var marker='<style id="perfil-professional-ui">';
  var idx=html.indexOf(marker);
  if(idx<0) return html;
  var before=html.slice(0,idx);
  // O bloco conta-card-shadows antigo ficou sem fechamento em algumas cópias.
  if(before.lastIndexOf('<style id="conta-card-shadows">')>before.lastIndexOf("</style>")){
    html=html.slice(0,idx)+"</style>\n"+html.slice(idx);
    idx=html.indexOf(marker);
    var doubleClose=html.indexOf("</style></style>",idx);
    if(doubleClose>=0){
      html=html.slice(0,doubleClose)+"</style>"+html.slice(doubleClose+"</style></style>".length);
    }
  }
  return html;
}

function normalizeAccountAuth(html){
  var next=html;

  // Padrão antigo: o HTML dependia de window.Auth já existir e abortava antes
  // do bootstrap global terminar. Agora aguarda o bootstrap canônico.
  next=next.replace(
    /if\s*\(\s*!window\.Auth\s*\|\|\s*!window\.Auth\.init\s*\)\s*throw new Error\((?:["'][^"']*["'])\);\s*await\s+(timeout|race)\(window\.Auth\.init\(\),\s*10000\s*\);/g,
    function(_,helper){
      return 'if(typeof window.__ENSURE_AUTH==="function"){await '+helper+'(window.__ENSURE_AUTH(),20000);}else{if(!window.Auth||!window.Auth.init)throw new Error("auth_unavailable");await '+helper+'(window.Auth.init(),20000);}';
    }
  );

  // Login sempre preserva idioma/returnUrl através do helper central.
  next=next.replace(
    /location\.replace\("\/conta\/login\.html\?returnUrl="\+encodeURIComponent\(location\.pathname\+location\.search\)\);/g,
    'location.replace(typeof window.__ACCOUNT_LOGIN_URL==="function"?window.__ACCOUNT_LOGIN_URL(location.pathname+location.search):"/conta/login.html?returnUrl="+encodeURIComponent(location.pathname+location.search));'
  );

  return next;
}

function normalize(html,lang){
  var next=html;
  next=normalizePrefetch(next,lang);
  next=removeLegacyFooterFetchers(next);
  next=repairNestedProfileStyles(next);
  next=normalizeAccountAuth(next);
  return next;
}

function problems(html,lang,rel){
  const list=[];
  const prefix=lang==="pt"?"/":"/"+lang+"/";
  if(!/src=["']\/global-scripts\.js["']/i.test(html)) list.push("global-scripts ausente");
  if(!/id=["']global-header-container["']/i.test(html)) list.push("global-header-container ausente");
  if(!/id=["']footer-placeholder["']/i.test(html)) list.push("footer-placeholder ausente");
  if(/fetch\s*\(\s*["'][^"']*footer\.html["']/i.test(html)) list.push("fetch de footer duplicado");
  if(/href=["'](?:\.\/)?global-body-elements\.html["']/i.test(html)) list.push("prefetch relativo de global-body-elements");
  if(lang!=="pt" && /<link\b[^>]*\brel=["']prefetch["'][^>]*href=["']\/global-body-elements\.html["']/i.test(html)) list.push("prefetch global-body aponta para raiz PT");
  if(lang!=="pt" && /<link\b[^>]*\brel=["']prefetch["'][^>]*href=["']\/footer\.html["']/i.test(html)) list.push("prefetch footer aponta para raiz PT");
  if(html.includes('<style id="conta-card-shadows">')&&html.includes('<style id="perfil-professional-ui">')){
    const a=html.indexOf('<style id="conta-card-shadows">');
    const b=html.indexOf('<style id="perfil-professional-ui">',a);
    const close=html.indexOf("</style>",a);
    if(b>=0&&(close<0||b<close)) list.push("style perfil aninhado/malformado");
  }
  if(/if\s*\(\s*!window\.Auth\s*\|\|\s*!window\.Auth\.init\s*\)\s*throw new Error\((?:["'][^"']*["'])\);\s*await\s+(?:timeout|race)\(window\.Auth\.init\(\),\s*10000\s*\);/.test(html)) list.push("bootstrap Auth legado de 10s");
  if(/location\.replace\("\/conta\/login\.html\?returnUrl="/.test(html)) list.push("redirect de login não canônico");
  if(!html.includes("__ENSURE_AUTH") && /window\.Auth\.init\(/.test(html)) list.push("página de conta não usa bootstrap canônico");
  if(lang!=="pt"){
    const expectedBody=prefix+"global-body-elements.html";
    const expectedFooter=prefix+"footer.html";
    if(html.includes('rel="prefetch"')&&html.includes("global-body-elements.html")&&!html.includes('href="'+expectedBody+'"')) list.push("prefetch global-body não localizado");
    if(html.includes('rel="prefetch"')&&html.includes("footer.html")&&!html.includes('href="'+expectedFooter+'"')) list.push("prefetch footer não localizado");
  }
  return list.map(x=>rel+": "+x);
}

const changed=[];
const missing=[];
for(const file of accountFiles()){
  const abs=path.join(ROOT,...file.rel.split("/"));
  try{await fs.access(abs);}catch{missing.push(file.rel);continue;}
  const html=await fs.readFile(abs,"utf8");
  const next=normalize(html,file.lang);
  if(APPLY&&next!==html){
    await fs.writeFile(abs,next,"utf8");
    changed.push(file.rel);
  }
}

const errors=[];
for(const file of accountFiles()){
  const abs=path.join(ROOT,...file.rel.split("/"));
  try{
    const html=await fs.readFile(abs,"utf8");
    errors.push(...problems(html,file.lang,file.rel));
  }catch{}
}

console.log(JSON.stringify({
  ok:missing.length===0&&errors.length===0,
  files:accountFiles().length,
  changed:changed.length,
  missing,
  errors,
  changedPaths:changed
},null,2));

if((APPLY||AUDIT)&&(missing.length||errors.length)) process.exit(2);
