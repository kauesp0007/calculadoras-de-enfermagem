#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT=process.cwd();
const SUPABASE_URL=String(process.env.SUPABASE_URL||"").replace(/\/$/,"");
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
const CATALOG=JSON.parse(await fs.readFile(path.join(ROOT,"premium-content-manifest.json"),"utf8"));
const LANGS=new Set(CATALOG.scope.languages);
const EXACT=new Set(CATALOG.exact.map(x=>x.toLowerCase()));
const RE=CATALOG?.patterns ? new RegExp("(?:"+CATALOG.patterns.join("|")+")","i") : /^$/;
const LOADER='<script src="/js/access/premium-content-loader.js" defer></script>';
const PLACEHOLDER='<div id="premium-content-placeholder" aria-live="polite" style="min-height:60vh;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif">Carregando conteúdo protegido…</div>';

// Esses 30 formulários têm conteúdo completo no catálogo privado e devem
// reconstruir o shell público a partir dessa fonte canônica em todo deploy.
const PRINTABLE_FORM_SHELL_REFRESH = new Set([
  "formulario_escala_de_perroca.html",
  "formulario_de_fugulin.html",
  "formulario_meem.html",
  "formulario_impresso_sbar.html",
  "formulario_impresso_saep.html",
  "formulario_bishop.html",
  "formulario_bps.html",
  "formulario_cam.html",
  "formulario_capurro.html",
  "formulario_escala_cincinnati.html",
  "formulario_escala_curb65.html",
  "formulario_morse.html",
  "formulario_escala_de_four.html",
  "formulario_escala_de_flacc.html",
  "formulario_escala_de_fast.html",
  "formulario_escala_de_elpo.html",
  "formulario_escala_de_downton.html",
  "formulario_escala_de_glasgow.html",
  "formulario_escala_de_gosnell.html",
  "formulario_escala_de_hamilton.html",
  "formulario_escala_de_hendrich.html",
  "formulario_escala_de_humpty.html",
  "formulario_escala_de_johns.html",
  "formulario_escala_de_jouvet.html",
  "formulario_escala_de_lachs.html",
  "formulario_escala_de_lanss.html",
  "formulario_escala_de_lawton.html",
  "formulario_escala_de_meows.html",
  "formulario_escala_de_news.html",
  "formulario_escala_de_nips.html"
]);

async function walk(dir,out=[]){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    if([".git","node_modules","downloads","biblioteca","blog","blog-templates","locales","fonts","public","img","automacoes","assets","css","font","js","admin","src","dist",".vscode","institucionais"].includes(e.name)) continue;
    const abs=path.join(dir,e.name);
    if(e.isDirectory()) await walk(abs,out);
    else if(e.isFile()&&e.name.toLowerCase().endsWith(".html")) out.push(path.relative(ROOT,abs));
  }
  return out;
}

function eligible(rel){
  const p=rel.split(path.sep).join("/").split("/");
  const file=p.at(-1).toLowerCase();
  return (p.length===1||(p.length===2&&LANGS.has(p[0])))&&(EXACT.has(file)||RE.test(file));
}

function isShell(source){
  return /id=["']premium-content-placeholder["']/i.test(source) &&
         /premium-content-loader\.js/i.test(source);
}

function needsShellHeadRefresh(source){
  return !/<meta\b[^>]*name=["']description["']/i.test(source) ||
         !/<link\b[^>]*rel=["']canonical["']/i.test(source) ||
         !/hreflang=["']pt-br["']/i.test(source) ||
         !/hreflang=["']x-default["']/i.test(source) ||
         !/<script\b[^>]*type=["']application\/ld\+json["']/i.test(source) ||
         !/<link\b[^>]*rel=["']icon["']/i.test(source);
}

async function fetchPrivateContent(rel){
  if(!SUPABASE_URL||!SERVICE_KEY){
    throw new Error("Shell Premium legado sem SEO canônico e sem credenciais do catálogo: "+rel);
  }
  const url=SUPABASE_URL+"/rest/v1/premium_content_pages?select=content&path=eq."+encodeURIComponent(rel)+"&limit=1";
  const res=await fetch(url,{
    headers:{
      apikey:SERVICE_KEY,
      Authorization:"Bearer "+SERVICE_KEY,
      Accept:"application/json"
    }
  });
  if(!res.ok) throw new Error("Supabase "+res.status+" ao recuperar conteúdo canônico de "+rel+": "+await res.text());
  const rows=await res.json();
  const content=Array.isArray(rows)?rows[0]?.content:null;
  if(!content||isShell(content)) throw new Error("Conteúdo canônico completo não encontrado para "+rel);
  return content;
}

function isInsideOpenScript(source,index){
  const before=source.slice(0,index);
  const opens=(before.match(/<script\b/gi)||[]).length;
  const closes=(before.match(/<\/script>/gi)||[]).length;
  return opens>closes;
}

function shellify(html){
  const source=String(html||"");
  const lower=source.toLowerCase();
  const headOpen=source.match(/<head\b[^>]*>/i);
  if(!headOpen) throw new Error("missing <head>");
  const headStart=headOpen.index;

  const bodyOpen=source.match(/<body\b[^>]*>/i);
  const bodyStart=bodyOpen?.index ?? -1;
  const declaredHeadEnd=lower.indexOf("</head>",headStart);

  // Algumas páginas legadas têm <body> antes do primeiro </head> literal
  // porque o texto </head> aparece dentro de um template de impressão JavaScript.
  // Nesse caso, o <body> é a fronteira estrutural correta: nunca podemos
  // colocar o loader dentro de uma string/script do conteúdo.
  let headEnd=declaredHeadEnd;
  if(bodyStart>=0 && (declaredHeadEnd<0 || bodyStart<declaredHeadEnd)){
    headEnd=bodyStart;
  }
  if(headEnd<0) throw new Error("missing head boundary");

  // Já está shellificado corretamente: preserve bytes e evite churn no deploy.
  const existingLoader=source.match(/<script\b[^>]*src=["'][^"']*premium-content-loader\.js(?:\?[^"']*)?["'][^>]*><\/script>/i);
  const loaderIndex=existingLoader?.index ?? -1;
  const existingPlaceholder=/<div\b[^>]*id=["']premium-content-placeholder["'][^>]*>/i.test(source);
  const actualHeadEnd=lower.indexOf("</head>",headStart);
  if(
    loaderIndex>=0 &&
    existingPlaceholder &&
    bodyStart>=0 &&
    actualHeadEnd>=0 &&
    bodyStart>actualHeadEnd &&
    !isInsideOpenScript(source,loaderIndex)
  ){
    return source;
  }

  const headSource=source.slice(headStart,headEnd);
  const cleanedHeadSource=headSource
    .replace(/<script\b[^>]*src=["'][^"']*premium-content-loader\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,"")
    .replace(/<div\b[^>]*id=["']premium-content-placeholder["'][^>]*>[\s\S]*?<\/div>/gi,"")
    .replace(/<\/h(?=\s*(?:\r?\n|$))/gi,"");

  const head=source.slice(0,headStart)+cleanedHeadSource;
  const body=bodyOpen?.[0]||"<body>";
  return head+"\n"+LOADER+"\n</head>\n"+body+"\n"+PLACEHOLDER+"\n</body>\n</html>";
}

const files=(await walk(ROOT)).filter(eligible).sort();
let changed=0;
for(const rel of files){
  const abs=path.join(ROOT,rel);
  const current=await fs.readFile(abs,"utf8");
  let candidate=current;

  // Shells legados podem ter sido criados antes da padronização SEO.
  // Nesse caso, a fonte canônica é o conteúdo completo do catálogo privado.
  const printableName=path.basename(rel).toLowerCase();
  if(isShell(current) && (PRINTABLE_FORM_SHELL_REFRESH.has(printableName) || needsShellHeadRefresh(current))){
    const canonical=await fetchPrivateContent(rel);
    candidate=shellify(canonical);
  }

  const next=shellify(candidate);
  if(next!==current){
    await fs.writeFile(abs,next,"utf8");
    changed++;
  }
}
console.log(JSON.stringify({eligible:files.length,changed}));
