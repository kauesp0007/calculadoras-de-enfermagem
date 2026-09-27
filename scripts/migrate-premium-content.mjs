#!/usr/bin/env node
/**
 * Sincroniza o conteúdo Premium público -> catálogo privado.
 *
 * Ordem obrigatória no deploy:
 *   1) este script, com --apply, enquanto as páginas ainda possuem conteúdo completo;
 *   2) scripts/shellify-premium-public-pages.mjs;
 *   3) testes de entrega Premium.
 *
 * Um shell Premium sem registro privado é erro de deploy, nunca um estado aceitável.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT=process.cwd();
const SUPABASE_URL=String(process.env.SUPABASE_URL||"").replace(/\/$/,"");
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
const DRY=process.argv.includes("--dry-run");
const APPLY=process.argv.includes("--apply");
const MANIFEST=process.argv.find(a=>a.startsWith("--manifest="))?.slice("--manifest=".length)||"premium-content-inventory.json";

const CATALOG=JSON.parse(await fs.readFile(path.join(ROOT,"premium-content-manifest.json"),"utf8"));
const LANGS=new Set(CATALOG.scope.languages);
const EXACT=new Set(CATALOG.exact.map(x=>x.toLowerCase()));
const PATTERNS=CATALOG.patterns.map(x=>new RegExp(x,"i"));

const IGNORED=new Set([
  ".git","node_modules","downloads","biblioteca","blog","blog-templates",
  "locales","fonts","public","img","automacoes","assets","css","font",
  "js","admin","src","dist",".vscode","institucionais"
]);

async function walk(dir,out=[]){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    if(IGNORED.has(e.name)) continue;
    const abs=path.join(dir,e.name);
    if(e.isDirectory()) await walk(abs,out);
    else if(e.isFile()&&e.name.toLowerCase().endsWith(".html")){
      out.push(path.relative(ROOT,abs));
    }
  }
  return out;
}

function isEligible(rel){
  const parts=rel.split(path.sep).join("/").split("/");
  const file=parts.at(-1).toLowerCase();
  if(!(parts.length===1||(parts.length===2&&LANGS.has(parts[0])))) return false;
  return EXACT.has(file)||PATTERNS.some(re=>re.test(file));
}

function isShell(html){
  return /id=["']premium-content-placeholder["']/i.test(html) &&
         /premium-content-loader\.js/i.test(html);
}

async function privateCatalogHas(rel){
  const url=SUPABASE_URL+"/rest/v1/premium_content_pages?select=path&path=eq."+encodeURIComponent(rel)+"&limit=1";
  const res=await fetch(url,{
    headers:{
      apikey:SERVICE_KEY,
      Authorization:"Bearer "+SERVICE_KEY,
      Accept:"application/json"
    }
  });
  if(!res.ok) throw new Error("Supabase "+res.status+" ao consultar "+rel+": "+await res.text());
  const rows=await res.json();
  return Array.isArray(rows)&&rows.length>0;
}

async function upsert(rel,content){
  const res=await fetch(SUPABASE_URL+"/rest/v1/premium_content_pages?on_conflict=path",{
    method:"POST",
    headers:{
      apikey:SERVICE_KEY,
      Authorization:"Bearer "+SERVICE_KEY,
      "Content-Type":"application/json",
      Prefer:"resolution=merge-duplicates,return=minimal"
    },
    body:JSON.stringify({
      path:rel,
      content,
      source_sha:"local-migration"
    })
  });
  if(!res.ok) throw new Error("Supabase "+res.status+" ao gravar "+rel+": "+await res.text());
}

if(!SUPABASE_URL||!SERVICE_KEY){
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}
if(!DRY&&!APPLY){
  console.error("Refusing Premium migration without --apply. Use --dry-run for audit only.");
  process.exit(3);
}

const files=(await walk(ROOT)).filter(isEligible).sort();
await fs.writeFile(
  path.join(ROOT,MANIFEST),
  JSON.stringify({generatedAt:new Date().toISOString(),count:files.length,paths:files},null,2)+"\n",
  "utf8"
);

const missingShellCatalog=[];
let migrated=0;
let alreadyCataloged=0;

for(const rel of files){
  const abs=path.join(ROOT,rel);
  const original=await fs.readFile(abs,"utf8");

  if(isShell(original)){
    if(await privateCatalogHas(rel)){
      alreadyCataloged++;
      continue;
    }
    missingShellCatalog.push(rel);
    continue;
  }

  if(DRY) continue;
  await upsert(rel,original);
  migrated++;
}

if(missingShellCatalog.length){
  console.error("\nPremium shell sem conteúdo privado correspondente:");
  for(const rel of missingShellCatalog) console.error("  ✗ "+rel);
  console.error("\nO deploy foi interrompido para impedir que um assinante receba 404.");
  process.exit(4);
}

console.log(JSON.stringify({
  ok:true,
  eligible:files.length,
  migrated,
  alreadyCataloged,
  dryRun:DRY
},null,2));
