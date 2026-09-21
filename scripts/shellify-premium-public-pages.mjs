#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT=process.cwd();
const CATALOG=JSON.parse(await fs.readFile(path.join(ROOT,"premium-content-manifest.json"),"utf8"));
const LANGS=new Set(CATALOG.scope.languages);
const EXACT=new Set(CATALOG.exact.map(x=>x.toLowerCase()));
const RE=CATALOG?.patterns ? new RegExp("(?:"+CATALOG.patterns.join("|")+")","i") : /^$/;
const LOADER='<script src="/js/access/premium-content-loader.js" defer></script>';
const PLACEHOLDER='<div id="premium-content-placeholder" aria-live="polite" style="min-height:60vh;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif">Carregando conteúdo protegido…</div>';

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
  const original=await fs.readFile(abs,"utf8");
  const next=shellify(original);
  if(next!==original){await fs.writeFile(abs,next,"utf8");changed++;}
}
console.log(JSON.stringify({eligible:files.length,changed}));
