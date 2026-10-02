#!/usr/bin/env node
/**
 * Tripla auditoria do acesso FREE / PREMIUM.
 *
 * Camada 1 — catálogo/arquitetura:
 *   um único manifesto define o conteúdo Premium.
 * Camada 2 — frontend:
 *   após a shellificação, todo HTML Premium é shell + loader;
 *   durante o estágio pré-shell do pipeline, conteúdo completo é aceito
 *   como fonte intermediária válida e será convertido pelo deploy.
 * Camada 3 — backend:
 *   a Edge Function valida Firebase ID token + entitlement Supabase e
 *   entrega somente conteúdo privado armazenado em premium_content_pages.
 *
 * Não altera arquivos. Falha com exit code 1.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT=process.cwd();
const CATALOG=JSON.parse(fs.readFileSync(path.join(ROOT,"premium-content-manifest.json"),"utf8"));
const LANGS=new Set(CATALOG.scope.languages);
const EXACT=new Set(CATALOG.exact.map(x=>x.toLowerCase()));
const PATTERNS=CATALOG.patterns.map(x=>new RegExp(x,"i"));
const PROTECTED_DIRS=new Set([".git","node_modules","downloads","biblioteca","blog","blog-templates","locales","fonts","public","img","automacoes","assets","css","font","js","admin","src","dist",".vscode","institucionais"]);
let checks=0, failures=[];

function ok(label){checks++;console.log("  ✓ "+label);}
function fail(label){failures.push(label);console.log("  ✗ "+label);}
function read(rel){return fs.readFileSync(path.join(ROOT,rel),"utf8");}

function isPremiumFile(rel){
  const parts=rel.split("/").filter(Boolean);
  if(!(parts.length===1||(parts.length===2&&LANGS.has(parts[0])))) return false;
  const file=parts.at(-1).toLowerCase();
  return EXACT.has(file)||PATTERNS.some(re=>re.test(file));
}

function walkScoped(dir=ROOT,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(PROTECTED_DIRS.has(e.name)) continue;
    const abs=path.join(dir,e.name);
    if(e.isDirectory()) walkScoped(abs,out);
    else if(e.isFile()&&e.name.toLowerCase().endsWith(".html")){
      out.push(path.relative(ROOT,abs).split(path.sep).join("/"));
    }
  }
  return out;
}

function isPremiumShell(html){
  return /premium-content-loader\.js/i.test(html) &&
         /premium-content-placeholder/i.test(html);
}

function isCompletePremiumSource(html){
  // Pré-shell legítimo: conteúdo completo aguardando a etapa de shellificação.
  // Evita aceitar stubs vazios como fonte.
  return html.length >= 5000 &&
         /<html\b/i.test(html) &&
         /<body\b/i.test(html) &&
         /<(?:main|form|section)\b/i.test(html) &&
         !/premium-content-placeholder/i.test(html);
}

console.log("=== CAMADA 1 — CATÁLOGO CANÔNICO ===");
if(CATALOG.model==="FREE / PREMIUM") ok("modelo comercial canônico");
else fail("modelo comercial inválido");
if(CATALOG.authority.includes("premium_content_pages")) ok("autoridade aponta para conteúdo privado");
else fail("autoridade não aponta para premium_content_pages");
if(CATALOG.scope.root&&LANGS.size===18) ok("escopo root + 18 idiomas");
else fail("escopo de idiomas incompleto");
if(EXACT.size===CATALOG.exact.length) ok("rotas exatas sem duplicidade");
else fail("rotas exatas duplicadas");
for(const freeRoute of ["braden.html","fugulin.html","dimensionamento.html"]){
  if(EXACT.has(freeRoute)) fail(freeRoute+" ainda consta no catálogo Premium");
  else ok(freeRoute+" não consta no catálogo Premium");
}
if(PATTERNS.length) ok("padrões para simulados/formulários registrados");
else fail("padrões de simulados/formulários ausentes");

console.log("\n=== CAMADA 2 — FRONTEND ===");
const loader=read("js/access/premium-content-loader.js");
const global=read("global-scripts.js");
const router=read("js/access/access-router.js");
const routeGuard=read("js/auth/route-guard.js");
const policy=read("js/access/content-policy.js");
if(loader.includes("window.__IS_PREMIUM_ROUTE = true;")) ok("loader marca rota Premium");
else fail("loader não marca rota Premium");
if(!global.includes("__PREMIUM_PATHS")&&!global.includes("Premium gate central")) ok("global-scripts sem catálogo/gate Premium legado");
else fail("global-scripts ainda contém catálogo/gate Premium legado");
if(!/<script[^>]+premium-content-loader\\.js/i.test(global)) ok("global não injeta o loader diretamente");
else fail("global-scripts injeta o loader diretamente");
if(router.includes("if (window.__IS_PREMIUM_ROUTE === true) return true;")) ok("access-router bypassa Premium");
else fail("access-router pode interceptar Premium");
if(routeGuard.includes("if (window.__IS_PREMIUM_ROUTE === true) return true;")) ok("route-guard bypassa Premium");
else fail("route-guard pode interceptar Premium");
if(!policy.includes("PREMIUM_PAGE_IDS")&&!policy.includes("RESTRICTED_CONTENT")) ok("content-policy sem catálogo Premium duplicado");
else fail("content-policy ainda duplica catálogo Premium");

for(const file of CATALOG.exact){
  if(fs.existsSync(path.join(ROOT,file))) ok(file+" existe no catálogo raiz");
  else fail(file+" está no catálogo mas não existe na raiz");
}

const premiumFiles=walkScoped().filter(isPremiumFile);
let shellFailures=0;
let sourceStage=0;
for(const rel of premiumFiles){
  const html=read(rel);
  const hasLoader=/premium-content-loader\.js/i.test(html);
  const hasPlaceholder=/premium-content-placeholder/i.test(html);
  const directSubscription=/(?:location\.(?:href|replace|assign)|window\.open|href\s*=)[^\n]{0,260}conta\/assinatura\.html/i.test(html);

  if(directSubscription){
    shellFailures++;
    fail(rel+" contém redirecionamento direto para assinatura");
    continue;
  }

  if(isPremiumShell(html)){
    continue;
  }

  if(isCompletePremiumSource(html)){
    sourceStage++;
    continue;
  }

  shellFailures++;
  fail(rel+" não é nem shell Premium válido nem fonte completa pré-shell");
}

if(!shellFailures){
  if(sourceStage){
    ok("todos os "+premiumFiles.length+" HTMLs Premium estão em estado válido: "+sourceStage+" fonte(s) pré-shell e o restante shell");
  }else{
    ok("todos os "+premiumFiles.length+" HTMLs Premium no escopo são shells protegidos");
  }
}else{
  fail(shellFailures+" HTML(s) Premium em estado inválido");
}

console.log("\n=== AUDITORIA DE ROTAS FREE EXCEPCIONADAS ===");
// O painel pode reclassificar as antigas exceções Free. O manifesto é a
// configuração inicial; nunca sobrescrever escolhas vigentes do desenvolvedor.
const livePolicy=process.argv.includes("--live-policy");
const policyFile=process.argv.find(a=>a.startsWith("--policy-file="))?.slice("--policy-file=".length);
const policyRows=policyFile ? JSON.parse(read(policyFile)) : null;
for(const rel of ["braden.html","fugulin.html","dimensionamento.html"]){
  const html=read(rel);
  let route=null;
  try{
    if(policyRows) route=policyRows.find(row=>row.path===rel);
    else if(livePolicy){
      const url="https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/developer-admin?public=policy&path="+encodeURIComponent(rel);
      const res=await fetch(url,{signal:AbortSignal.timeout(15000),cache:"no-store"});
      if(!res.ok) throw new Error("HTTP "+res.status);
      route=(await res.json()).route;
    }
    if((livePolicy||policyRows)&&(!route||typeof route.premium_required!=="boolean")) throw new Error("política de rota inválida");
  }catch(error){fail(rel+" política dinâmica indisponível: "+error.message);continue;}
  const hasLoader=/premium-content-loader\.js/i.test(html);
  const hasPlaceholder=/premium-content-placeholder/i.test(html);
  if(hasLoader!==hasPlaceholder){fail(rel+" possui shell incompleto");continue;}
  if(route?.premium_required===true){
    if(route.enforcement!=="protected_content") fail(rel+" Premium sem enforcement privado");
    else if(!isPremiumShell(html)) fail(rel+" Premium expõe conteúdo público");
    else ok(rel+" Premium dinâmico possui shell protegido");
  }else if(isPremiumShell(html)){
    ok(rel+(route ? " Free servido pelo loader e política do backend" : " shell válido; plano verificado pelo backend"));
  }else if(isCompletePremiumSource(html)&&!/__IS_PREMIUM_ROUTE|required-plan|content-access/i.test(html)){
    ok(rel+" possui conteúdo público completo sem marcador Premium");
  }else fail(rel+" não possui conteúdo público completo nem shell válido");
}

console.log("\n=== CAMADA 3 — BACKEND ===");
const edge=read("supabase/functions/premium-content/index.ts");
if(edge.includes("jwtVerify")) ok("backend valida Firebase ID token");
else fail("backend sem validação JWT");
if(edge.includes("billing_identities")&&edge.includes("user_entitlements")) ok("backend resolve entitlement no Supabase");
else fail("backend sem validação de entitlement");
if(edge.includes('ent.plan==="premium"')) ok("backend exige plano Premium");
else fail("backend não exige Premium");
if(edge.includes("premium_content_pages")) ok("backend lê conteúdo privado");
else fail("backend não usa tabela privada Premium");
if(edge.includes("Cache-Control")&&edge.includes("private, no-store")) ok("backend usa resposta privada sem cache");
else fail("backend sem proteção de cache privado");

console.log("\n=== RESULTADO ===");
const result={ok:failures.length===0,checks,premiumHtmlAudited:premiumFiles.length,preShellSources:sourceStage,failures,generatedAt:new Date().toISOString()};
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exit(1);
