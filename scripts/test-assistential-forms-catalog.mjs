import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import {stripTypeScriptTypes} from "node:module";

const sourceFile=process.argv.find(arg=>arg.startsWith("--source="))?.slice(9)||"formularios_de_escalas_assistenciais.html";
let html=fs.readFileSync(sourceFile,"utf8");
if(html.includes('id="premium-content-placeholder"')){
  const base=String(process.env.SUPABASE_URL||"").replace(/\/$/,"");
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base||!key)throw new Error("Shell publicado: teste requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para ler a fonte privada, sem gravar credenciais.");
  const response=await fetch(base+"/rest/v1/premium_content_pages?select=content&path=eq.formularios_de_escalas_assistenciais.html",{headers:{apikey:key,Authorization:"Bearer "+key}});
  if(!response.ok)throw new Error("Fonte privada indisponível: "+response.status);
  const rows=await response.json();html=rows[0]?.content;
  if(!html)throw new Error("Fonte privada ausente");
}
const registry=JSON.parse(html.match(/id="assistential-form-downloads"[^>]*>([\s\S]*?)<\/script>/)[1]);
assert.equal(registry.length,66);
assert.equal(new Set(registry.map(f=>f.id)).size,66);
assert.equal((html.match(/class="form-card"/g)||[]).length,66);
assert(!html.includes("premium-download-note"));
assert(!/<iframe\b/i.test(html));
for(const form of registry){
  assert(fs.existsSync("."+form.pdf),form.pdf);
  assert(fs.existsSync("img/formularios-previas/"+form.id+".webp"),form.id);
}

let handler,plan="free",expiry=null,grant=false,invalidSource=false,fetches=0;
const catalog="formularios_de_escalas_assistenciais.html";
function createClient(){return {from(table){
  const rows={
    premium_content_pages:[{path:catalog,content:html,source_sha:"test"},{path:"formulario_escala_de_zarit.html",content:"<!doctype html><html>protected</html>"}],
    developer_premium_route_rules:[{path:catalog,premium_required:false}],
    developer_premium_email_grants:grant?[{email:"test@example.invalid",active:true}]:[],
    billing_identities:[{id:"test-identity",provider:"firebase",external_subject:"test-user"}],
    user_entitlements:[{user_id:"test-identity",plan,premium_expires_at:expiry}]
  }[table]||[];
  let filtered=rows;
  const query={select(){return query;},eq(key,value){filtered=filtered.filter(r=>r[key]===value);return query;},
    in(key,values){filtered=filtered.filter(r=>values.includes(r[key]));return query;},
    maybeSingle(){return Promise.resolve({data:filtered[0]||null,error:null});},
    then(resolve,reject){return Promise.resolve({data:filtered,error:null}).then(resolve,reject);}};
  return query;
}};}
const ts=fs.readFileSync("supabase/functions/premium-content/index.ts","utf8").replace(/^import .*;\s*$/gm,"");
vm.runInNewContext(stripTypeScriptTypes(ts),{
  serve(fn){handler=fn;},createClient,createRemoteJWKSet(){return {};},
  async jwtVerify(token){
    if(token==="expired"){const e=new Error("expired");e.code="ERR_JWT_EXPIRED";throw e;}
    if(token==="invalid"){const e=new Error("signature");e.code="ERR_JWS_SIGNATURE_VERIFICATION_FAILED";throw e;}
    if(token==="jwks-failure"){const e=new Error("jwks");e.code="ERR_JWKS_TIMEOUT";throw e;}
    return {payload:{sub:"test-user",email:"test@example.invalid"}};
  },
  Deno:{env:{get(){return "test";}}},URL,Request,Response,TextDecoder,AbortSignal,
  async fetch(url){fetches++;return new Response(invalidSource?"not a PDF":fs.readFileSync("."+decodeURIComponent(url.pathname)),{status:200});}
});
async function request(query="",token=null,path=catalog){
  const headers=token?{Authorization:"Bearer "+token}:{};
  return handler(new Request("https://edge.invalid/?path="+encodeURIComponent(path)+query,{headers}));
}
assert.equal((await request()).status,200);
assert(!(await (await request()).text()).includes("assistential-form-downloads"));
assert(!(await (await request("",null,"en/"+catalog)).text()).includes("assistential-form-downloads"),"Language fallback must also strip PDF registry");
assert.equal((await request("&download=form-001")).status,401);
assert.equal((await request("&download=form-001","valid")).status,403);
assert.equal(fetches,0,"Free must never fetch a PDF");
assert.equal((await request("","valid","formulario_escala_de_zarit.html")).status,403);
assert.equal((await request("&download=form-001","valid","formulario_escala_de_zarit.html")).status,404);
plan="premium";
assert.equal((await request("&download=form-001","expired")).status,401);
assert.equal((await request("&download=form-001","invalid")).status,401);
assert.equal((await request("&download=form-001","jwks-failure")).status,500);
for(const id of ["", "form-000", "form-999", "../file", "https://external.invalid/a.pdf"]){
  assert.equal((await request("&download="+encodeURIComponent(id),"valid")).status,404);
}
for(const form of registry){
  const res=await request("&download="+form.id,"valid");assert.equal(res.status,200,form.id);
  assert.equal(res.headers.get("Content-Type"),"application/pdf");
  assert(res.headers.get("Cache-Control").includes("no-store"));
  assert(res.headers.get("Content-Disposition").includes(encodeURIComponent(form.filename)));
  assert.deepEqual(Buffer.from(await res.arrayBuffer()),fs.readFileSync("."+form.pdf),form.id+" must preserve PDF bytes");
}
expiry="2000-01-01T00:00:00Z";
assert.equal((await request("&download=form-001","valid")).status,403);
plan="free";grant=true;
assert.equal((await request("&download=form-001","valid")).status,200,"Administrative grant uses canonical access");
invalidSource=true;
assert.equal((await request("&download=form-001","valid")).status,500,"Never deliver upstream HTML as PDF");
console.log("PASS: 66 cards/assets, Free/visitor denial, Premium original PDF bytes, expired/JWT/grant, registry sanitization, URL allowlist and fail-closed delivery.");
