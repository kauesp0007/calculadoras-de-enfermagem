// scripts/replicar-forum-moderation.js
// Replica a moderação por admin nos 18 idiomas.
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const LANGS = ["en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];
const REPLACEMENTS = [
[
"function getAdminEmail(){\ntry{ var u=(window.Auth&&window.Auth.currentUser)?window.Auth.currentUser():null; return u?String(u.email||'').toLowerCase():''; }catch(e){ return ''; }\n}",
"function getAdminEmail(){\ntry{ var u=(window.Auth&&window.Auth.currentUser)?window.Auth.currentUser():null; return u?String(u.email||'').toLowerCase():''; }catch(e){ return ''; }\n}\nasync function getAdminIdToken(){\nvar u=(window.Auth&&window.Auth.currentUser)?window.Auth.currentUser():null;\nif(!u||typeof u.getIdToken!==\"function\") throw new Error(\"Não autenticado\");\nreturn u.getIdToken();\n}"
],
[
"var res = await sb.functions.invoke('forum-moderation', { body: { action:'update', post_id: Number(id), content: txt, adminEmail: getAdminEmail() } });\nif(res.error) throw new Error(res.error.message || res.error);",
"var token = await getAdminIdToken();\nvar res = await sb.functions.invoke('forum-moderation', { body: { action:'update', post_id: Number(id), content: txt }, headers: { Authorization: 'Bearer ' + token } });\nif(res.error) throw new Error(res.error.message || res.error);"
],
[
"var res = await sb.functions.invoke('forum-moderation', { body: { action:'delete', post_id: Number(id), adminEmail: getAdminEmail() } });\nif(res.error) throw new Error(res.error.message || res.error);",
"var token = await getAdminIdToken();\nvar res = await sb.functions.invoke('forum-moderation', { body: { action:'delete', post_id: Number(id) }, headers: { Authorization: 'Bearer ' + token } });\nif(res.error) throw new Error(res.error.message || res.error);"
]
];
let okCount=0,failCount=0;const failures=[];
for(const lang of LANGS){const file=path.join(ROOT,lang,"forum-enfermagem.html");if(!fs.existsSync(file)){failures.push(lang+" (não existe)");failCount++;continue;}let content=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");let applied=0;for(const [oldStr,newStr] of REPLACEMENTS){if(content.includes(oldStr)){content=content.split(oldStr).join(newStr);applied++;}else{failures.push(lang+": padrão não encontrado");}}if(applied===REPLACEMENTS.length){fs.writeFileSync(file,content.replace(/\n/g,"\r\n"),"utf8");okCount++;}else failCount++;}
console.log("RESULTADO: "+okCount+" OK, "+failCount+" falhas.");if(failures.length){console.log("DETALHES:");failures.forEach(f=>console.log(" - "+f));}process.exit(failCount>0?1:0);