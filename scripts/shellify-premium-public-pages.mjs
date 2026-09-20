#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT=process.cwd();
const LANGS=new Set(["en","es","fr","it","de","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"]);
const RE=/^(simulado(?:[-_].*)?|flashcards_quiz|biblioteca-provas|formularios-em-branco-de-escalas|formularios_de_escalas_assistenciais|formulario(?:[-_].*)?|fotmulario_.*|braden|fugulin|dimensionamento|perroca|medicacao|medicamentos|meem|moca|zarit|morse|elpo|glasgow)\.html$/i;
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
  return (p.length===1||(p.length===2&&LANGS.has(p[0])))&&RE.test(p.at(-1));
}
function shellify(html){
  const source=String(html||"");
  const headOpen=source.match(/<head\b[^>]*>/i);
  if(!headOpen) throw new Error("missing <head>");
  const headStart=headOpen.index;
  const lower=source.toLowerCase();
  const headEnd=lower.indexOf("</head>",headStart);
  if(headEnd<0) throw new Error("missing </head>");
  const headSource=source.slice(headStart,headEnd);
  if(/<\/h(?:\s|\n|$)/i.test(headSource)){
    throw new Error("malformed standalone </h detected; refusing to rewrite");
  }
  const head=source.slice(0,headEnd)
    .replace(/<script\b[^>]*src=["'][^"']*premium-content-loader\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,"")
    .replace(/<div\b[^>]*id=["']premium-content-placeholder["'][^>]*>[\\s\\S]*?<\/div>/gi,"");
  const body=source.match(/<body\b[^>]*>/i)?.[0]||"<body>";
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
