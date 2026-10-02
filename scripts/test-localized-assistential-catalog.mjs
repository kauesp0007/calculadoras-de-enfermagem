#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";

const ROOT=process.cwd();
const LANGS=["en","es","fr","it","de","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"];
const client=fs.readFileSync(path.join(ROOT,"js/access/assistential-forms-catalog.js"),"utf8");
const edge=fs.readFileSync(path.join(ROOT,"supabase/functions/premium-content/index.ts"),"utf8");
const loader=fs.readFileSync(path.join(ROOT,"js/access/premium-content-loader.js"),"utf8");

for(const lang of LANGS) assert(client.includes(lang),"Idioma ausente no resolver do catálogo: "+lang);
assert(client.includes('return pattern.test(p) ? p : "formularios_de_escalas_assistenciais.html"'),"Cliente precisa preservar o path localizado");
assert(/FORMULARIOS_DE_ESCALAS\\\/.*EN\|ES/.test(edge)||edge.includes('(?:EN|ES)'),"Backend precisa permitir PDFs EN e ES");
assert(edge.includes('select("id,email")'),"premium-content deve poder validar grant pelo e-mail da identidade");
assert(!loader.includes('if(actionAccess==="free"&&!force){setPrintAccess(false);return false;}'),"Decisão Free não pode ficar cacheada indefinidamente");

function pdfs(dir){
  return fs.readdirSync(dir).filter(x=>x.toLowerCase().endsWith(".pdf")).sort();
}
function sha(file){
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
const esDir=path.join(ROOT,"FORMULARIOS_DE_ESCALAS","ES");
const enDir=path.join(ROOT,"FORMULARIOS_DE_ESCALAS","EN");
const esPdfs=pdfs(esDir), enPdfs=pdfs(enDir);
assert.equal(esPdfs.length,63,"ES deve ter 63 PDFs");
assert.equal(enPdfs.length,63,"EN deve ter 63 PDFs");
assert.deepEqual(esPdfs,enPdfs,"EN e ES devem possuir os mesmos slugs de PDF");
for(const name of esPdfs){
  assert.notEqual(sha(path.join(esDir,name)),sha(path.join(enDir,name)),"PDF ES não pode ser cópia byte a byte do EN: "+name);
}


const esPreviewMap=JSON.parse(fs.readFileSync(path.join(ROOT,"scripts/spanish-assistential-preview-map.json"),"utf8"));
assert.equal(esPreviewMap.length,63,"ES deve ter 63 prévias mapeadas");
assert.equal(new Set(esPreviewMap.map(item=>item.id)).size,63,"IDs de prévias ES duplicados");
for(const item of esPreviewMap){
  assert(item.pdf.startsWith("FORMULARIOS_DE_ESCALAS/ES/"),"Prévia ES precisa usar PDF espanhol");
  assert(fs.existsSync(path.join(ROOT,item.pdf)),"Fonte ES ausente: "+item.pdf);
  const bytes=fs.readFileSync(path.join(ROOT,"img/formularios-previas/es",item.id+".webp"));
  assert(bytes.length>2048 && bytes.subarray(0,4).toString()==="RIFF" && bytes.subarray(8,12).toString()==="WEBP","Prévia ES inválida: "+item.id);
}

const base=String(process.env.SUPABASE_URL||"").replace(/\/$/,"");
const key=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
if(base&&key){
  async function get(resource){
    const res=await fetch(base+"/rest/v1/"+resource,{headers:{apikey:key,Authorization:"Bearer "+key,Accept:"application/json"}});
    if(!res.ok) throw new Error("Supabase "+res.status+": "+await res.text());
    return res.json();
  }
  const paths=["formularios_de_escalas_assistenciais.html","en/formularios_de_escalas_assistenciais.html","es/formularios_de_escalas_assistenciais.html"];
  const rows=await get("premium_content_pages?select=path,content&path=in.("+paths.map(encodeURIComponent).join(",")+")");
  const byPath=new Map(rows.map(r=>[r.path,r]));
  assert.equal(byPath.size,3,"Os três catálogos privados devem existir");
  function registry(p){
    const html=byPath.get(p)?.content||"";
    const m=html.match(/<script\b[^>]*id=["']assistential-form-downloads["'][^>]*>([\s\S]*?)<\/script>/i);
    assert(m,"Registro privado ausente: "+p);
    return JSON.parse(m[1]);
  }
  const esHtml=byPath.get(paths[2]).content;
  assert(!esHtml.includes("/img/formularios-previas/en/"),"Catálogo ES não pode exibir prévias inglesas");
  const esSources=[...esHtml.matchAll(/src=["'](\/img\/formularios-previas\/es\/form-\d+\.webp)(?:\?v=[^"']+)?["']/g)].map(m=>m[1]);
  assert.equal(esSources.length,63,"Catálogo ES precisa exibir 63 prévias espanholas");
  for(const item of esPreviewMap) assert(esSources.includes("/img/formularios-previas/es/"+item.id+".webp"),"Prévia ES ausente: "+item.id);
  const root=registry(paths[0]), en=registry(paths[1]), es=registry(paths[2]);
  assert.equal(root.length,66,"Raiz deve ter 66 formulários");
  assert.equal(en.length,63,"EN deve ter 63 formulários");
  assert.equal(es.length,63,"ES deve ter 63 formulários");
  for(const item of en){
    assert(item.pdf.startsWith("/FORMULARIOS_DE_ESCALAS/EN/"),"PDF EN com prefixo incorreto: "+item.id);
    assert(fs.existsSync(path.join(ROOT,item.pdf.replace(/^\//,""))),"PDF EN inexistente: "+item.pdf);
  }
  for(const item of es){
    assert(item.pdf.startsWith("/FORMULARIOS_DE_ESCALAS/ES/"),"PDF ES com prefixo incorreto: "+item.id);
    assert(fs.existsSync(path.join(ROOT,item.pdf.replace(/^\//,""))),"PDF ES inexistente: "+item.pdf);
  }

  const rules=await get("developer_premium_route_rules?select=path,premium_required,enforcement&path=in.("+paths.map(encodeURIComponent).join(",")+")");
  const rulesByPath=new Map(rules.map(r=>[r.path,r]));
  for(const p of paths){
    const rule=rulesByPath.get(p);
    assert(rule,"Regra ausente: "+p);
    assert.equal(rule.premium_required,false,p+" deve ser catálogo consultável no Free");
    assert.equal(rule.enforcement,"catalog_only",p+" deve usar catalog_only");
  }
}

console.log("PASS: catálogos assistenciais localizados, PDFs EN/ES distintos, paths corretos e política catalog_only.");
