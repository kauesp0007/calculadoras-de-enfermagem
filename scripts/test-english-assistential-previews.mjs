import assert from "node:assert/strict";
import fs from "node:fs";

const mapPath="scripts/english-assistential-preview-map.json";
const catalogPath="en/formularios_de_escalas_assistenciais.html";
const entries=JSON.parse(fs.readFileSync(mapPath,"utf8"));

assert.equal(entries.length,63,"English catalog must map exactly 63 translated PDFs");
assert.equal(new Set(entries.map(entry=>entry.id)).size,63,"English preview IDs must be unique");

for(const entry of entries){
  assert.match(entry.id,/^form-\d{3}$/);
  assert(entry.pdf.startsWith("FORMULARIOS_DE_ESCALAS/EN/"),entry.pdf);
  assert(fs.existsSync(entry.pdf),"Missing English PDF: "+entry.pdf);
  const preview="img/formularios-previas/en/"+entry.id+".webp";
  assert(fs.existsSync(preview),"Missing English preview: "+preview);
  const data=fs.readFileSync(preview);
  assert(data.length>2048,"English preview is unexpectedly small: "+preview);
  assert.equal(data.subarray(0,4).toString("ascii"),"RIFF",preview);
  assert.equal(data.subarray(8,12).toString("ascii"),"WEBP",preview);
}

const base=String(process.env.SUPABASE_URL||"").replace(/\/$/,"");
const key=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
if(base&&key){
  const url=base+"/rest/v1/premium_content_pages?select=content&path=eq."+encodeURIComponent(catalogPath)+"&limit=1";
  const response=await fetch(url,{headers:{apikey:key,Authorization:"Bearer "+key,Accept:"application/json"}});
  assert(response.ok,"Supabase English catalog query failed: "+response.status);
  const rows=await response.json();
  const html=rows[0]?.content||"";
  assert(html,"English private catalog is missing");

  const registryMatch=html.match(/id="assistential-form-downloads"[^>]*>([\s\S]*?)<\/script>/);
  assert(registryMatch,"English download registry is missing");
  const registry=JSON.parse(registryMatch[1]);
  assert.equal(registry.length,63,"English private catalog must expose 63 translated forms");

  const expected=new Map(entries.map(entry=>[entry.id,"/"+entry.pdf]));
  for(const form of registry){
    assert.equal(form.pdf,expected.get(form.id),"English PDF mapping mismatch: "+form.id);
    assert(html.includes('/img/formularios-previas/en/'+form.id+'.webp'),"English preview path missing: "+form.id);
  }

  assert.equal((html.match(/\/img\/formularios-previas\/en\/form-\d{3}\.webp/g)||[]).length,63);
  assert.equal((html.match(/\/img\/formularios-previas\/form-\d{3}\.webp/g)||[]).length,0);
}else{
  console.warn("Supabase credentials unavailable; live English catalog assertions skipped.");
}

console.log("PASS: 63 English PDFs, WebP previews and private catalog mappings validated.");
