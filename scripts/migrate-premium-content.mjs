#!/usr/bin/env node
/**
 * One-time migration of Premium HTML from public GitHub Pages files
 * into the private Supabase premium_content_pages table.
 *
 * Run from the repository root:
 *   SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/migrate-premium-content.mjs
 *
 * Safety:
 * - only root HTML and the 18 language folders are eligible;
 * - prohibited folders are never touched;
 * - only routes classified by the canonical Premium policy are migrated;
 * - database write happens before the public file is replaced;
 * - --dry-run performs no writes;
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT=process.cwd();
const SUPABASE_URL=process.env.SUPABASE_URL||"";
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
const DRY=process.argv.includes("--dry-run");
const MANIFEST=process.argv.find(a=>a.startsWith("--manifest="))?.slice("--manifest=".length)||"premium-content-inventory.json";
const ALLOW_SHELL_REWRITE=process.argv.includes("--apply");
const CATALOG=JSON.parse(await fs.readFile(path.join(ROOT,"premium-content-manifest.json"),"utf8"));
const LANGS=new Set(CATALOG.scope.languages);

function isEligible(rel){
  if(!rel.endsWith(".html")) return false;
  const parts=rel.split(path.sep).join("/").split("/");
  if(parts.length>1 && (parts.length!==2 || !LANGS.has(parts[0]))) return false;
  const f=parts.at(-1).toLowerCase();
  const exact=new Set(CATALOG.exact.map(x=>x.toLowerCase()));
  const patterns=CATALOG.patterns.map(x=>new RegExp(x,"i"));
  return exact.has(f)||patterns.some(re=>re.test(f));
}
async function upsert(rel,content){
  const res=await fetch(SUPABASE_URL+"/rest/v1/premium_content_pages?on_conflict=path",{
    method:"POST",
    headers:{"apikey":SERVICE_KEY,"Authorization":"Bearer "+SERVICE_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"},
    body:JSON.stringify({path:rel.replaceAll(path.sep,"/"),content,source_sha:"local-migration"})
  });
  if(!res.ok) throw new Error("Supabase "+res.status+" for "+rel+": "+await res.text());
}
if(!DRY && !ALLOW_SHELL_REWRITE){
  console.error("Refusing public shell rewrite without --apply. Use --dry-run for audit only.");
  process.exit(3);
}
if(!SUPABASE_URL||!SERVICE_KEY){
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}
const all=await walk(ROOT);
const files=all.filter(isEligible);
const manifest={generatedAt:new Date().toISOString(),count:files.length,paths:files.map(x=>x.replaceAll(path.sep,"/")).sort()};
await fs.writeFile(path.join(ROOT,MANIFEST),JSON.stringify(manifest,null,2)+"\n","utf8");
console.log(`Eligible Premium HTML: ${files.length}${DRY?" (dry-run)":""}`);
if(DRY) process.exit(0);
for(const rel of files){
  const abs=path.join(ROOT,rel);
  const original=await fs.readFile(abs,"utf8");
  if(original.includes('id="premium-content-placeholder"')) continue;
  await upsert(rel.replaceAll(path.sep,"/"),original);
  await fs.writeFile(abs,shellify(original),"utf8");
  console.log((DRY?"CHECK ":"MIGRATED ")+rel);
}
