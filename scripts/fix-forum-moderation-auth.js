// Run locally from the repository root with: node scripts/fix-forum-moderation-auth.js
// Rewrites all 18 international forum pages from the legacy adminEmail body auth
// to Firebase ID-token Authorization. Fails closed when a page does not match.
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const LANGS = ["en","es","de","it","fr","hi","zh","ar","ja","ru","ko","tr","nl","pl","sv","id","vi","uk"];
const PATTERNS = [
  [
    "function getAdminEmail(){\ntry{ var u=(window.Auth&&window.Auth.currentUser)?window.Auth.currentUser():null; return u?String(u.email||'').toLowerCase():''; }catch(e){ return ''; }\n}",
    "function getAdminIdToken(){\nvar u=(window.Auth&&window.Auth.currentUser)?window.Auth.currentUser():null;\nif(!u||typeof u.getIdToken!==\"function\") throw new Error(\"Não autenticado\");\nreturn u.getIdToken();\n}"
  ],
  [
    "var res = await sb.functions.invoke('forum-moderation', { body: { action:'update', post_id: Number(id), content: txt, adminEmail: getAdminEmail() } });",
    "var token = await getAdminIdToken();\nvar res = await sb.functions.invoke('forum-moderation', { body: { action:'update', post_id: Number(id), content: txt }, headers: { Authorization: 'Bearer ' + token } });"
  ],
  [
    "var res = await sb.functions.invoke('forum-moderation', { body: { action:'delete', post_id: Number(id), adminEmail: getAdminEmail() } });",
    "var token = await getAdminIdToken();\nvar res = await sb.functions.invoke('forum-moderation', { body: { action:'delete', post_id: Number(id) }, headers: { Authorization: 'Bearer ' + token } });"
  ]
];
let ok=0;
for (const lang of LANGS) {
  const file=path.join(ROOT,lang,"forum-enfermagem.html");
  if(!fs.existsSync(file)) throw new Error(`${lang}: arquivo inexistente`);
  let s=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
  for(const [oldText,newText] of PATTERNS){
    if(!s.includes(oldText)) throw new Error(`${lang}: padrão não encontrado`);
    s=s.split(oldText).join(newText);
  }
  fs.writeFileSync(file,s.replace(/\n/g,"\r\n"),"utf8");
  ok++;
}
console.log(`Forum auth migration: ${ok}/${LANGS.length} arquivos corrigidos.`);
