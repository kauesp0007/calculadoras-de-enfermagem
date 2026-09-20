#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT=process.cwd();
const LANGS=new Set(["en","es","fr","it","de","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"]);
const RE=/^(simulado(?:[-_].*)?|flashcards_quiz|biblioteca-provas|formularios-em-branco-de-escalas|formularios_de_escalas_assistenciais|formulario(?:[-_].*)?|fotmulario_.*|braden|fugulin|dimensionamento|medicacao|meem|moca|zarit|morse|elpo|glasgow)\.html$/i;
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
  const headEnd=html.toLowerCase().lastIndexOf("</head>");
  if(headEnd<0) throw new Error("missing </head>");
  const body=html.match(/<body\b[^>]*>/i)?.[0]||"<body>";
  let head=html.slice(0,headEnd);
  // Remove qualquer loader anterior antes de reconstruir o shell.
  head=head.replace(/<script[^>]+src=["'][^"']*premium-content-loader\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,"");
  // O arquivo público deve conter somente o shell. Todo o conteúdo premium
  // permanece em premium_content_pages e é entregue pela Edge Function.
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
