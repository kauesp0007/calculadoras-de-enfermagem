#!/usr/bin/env node
/**
 * Restaura as três páginas públicas a partir dos originais preservados no Supabase.
 * Executar em checkout limpo, na raiz, primeiro sem --apply.
 * NÃO exclui linhas do banco: preservar backup e permitir rollback.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
const ROUTES=["braden.html","fugulin.html","dimensionamento.html"];
const ROOT=process.cwd(), APPLY=process.argv.includes("--apply");
const URL=process.env.SUPABASE_URL, KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!URL||!KEY) throw Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (nunca commitar).");
const manifest=JSON.parse(await fs.readFile("premium-content-manifest.json","utf8"));
for(const route of ROUTES){
  if(manifest.exact.includes(route)||manifest.patterns.some(p=>new RegExp(p,"i").test(route))) throw Error("Rota ainda Premium: "+route);
  const endpoint=URL.replace(/\/$/,"")+"/rest/v1/premium_content_pages?path=eq."+encodeURIComponent(route)+"&select=content,source_sha";
  const res=await fetch(endpoint,{headers:{apikey:KEY,Authorization:"Bearer "+KEY}});
  if(!res.ok) throw Error("Falha Supabase "+route+": "+res.status);
  const data=await res.json();
  if(data.length!==1||typeof data[0].content!=="string") throw Error("Original não encontrado: "+route);
  const html=data[0].content;
  if(!/<html\b/i.test(html)||!/<body\b/i.test(html)||html.length<10000) throw Error("Original incompleto: "+route);
  if(/premium-content-loader\.js|premium-content-placeholder|__IS_PREMIUM_ROUTE/.test(html)) throw Error("Original contém bloqueio: "+route);
  const hash=crypto.createHash("sha256").update(html).digest("hex");
  console.log(JSON.stringify({route,bytes:Buffer.byteLength(html),sha256:hash,mode:APPLY?"restore":"audit"}));
  if(APPLY){
    const dest=path.join(ROOT,route), temp=dest+".free-restore.tmp";
    await fs.writeFile(temp,html,"utf8");
    await fs.rename(temp,dest);
    const verify=await fs.readFile(dest,"utf8");
    if(verify!==html) throw Error("Falha de verificação: "+route);
  }
}
console.log(APPLY?"Três páginas restauradas; executar testes e revisar diff antes de merge.":"Auditoria concluída; nenhuma alteração realizada.");
