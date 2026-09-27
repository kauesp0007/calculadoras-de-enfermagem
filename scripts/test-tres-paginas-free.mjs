#!/usr/bin/env node
// Regressão: somente as três rotas da raiz são FREE; demais Premium continuam protegidas.
import fs from "node:fs";
import assert from "node:assert/strict";
const manifest=JSON.parse(fs.readFileSync("premium-content-manifest.json","utf8"));
const free=["braden.html","fugulin.html","dimensionamento.html"];
const restricted=["perroca.html","medicacao.html","meem.html","morse.html","glasgow.html","simulado-de-enfermagem.html"];
const isPremium=name=>manifest.exact.includes(name)||manifest.patterns.some(p=>new RegExp(p,"i").test(name));
for(const name of free){
 assert.equal(isPremium(name),false,name+" ainda marcado Premium");
 const html=fs.readFileSync(name,"utf8");
 assert.match(html,/<html\b/i);assert.match(html,/<body\b/i);
 assert.doesNotMatch(html,/premium-content-loader\.js|premium-content-placeholder|__IS_PREMIUM_ROUTE/);
 assert.doesNotMatch(html,/<meta[^>]+(?:content-access|required-plan)[^>]+premium/i);
 assert.ok(html.length>10000,name+" parece shell incompleto");
 console.log("PASS FREE root "+name);
}
for(const name of restricted){assert.equal(isPremium(name),true,name+" perdeu bloqueio");console.log("PASS Premium "+name);}
console.log("PASS: política e HTML das três páginas na raiz");
