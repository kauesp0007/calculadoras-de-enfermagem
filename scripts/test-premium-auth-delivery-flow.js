#!/usr/bin/env node
const fs = require("node:fs");

const auth=fs.readFileSync("js/auth/auth-core.js","utf8");
const loader=fs.readFileSync("js/access/premium-content-loader.js","utf8");

const checks=[
  [auth.includes("var _hydrationGeneration=0;"),"auth-core deve possuir geração de hidratação."],
  [!auth.includes("if(auth.currentUser) handle(auth.currentUser);"),"auth-core não pode hidratar duas vezes via currentUser + onAuthStateChanged."],
  [auth.includes("_hydrateUser(user,generation);"),"hidratação deve carregar a geração corrente."],
  [auth.includes("generation!==_hydrationGeneration"),"hidratação deve rejeitar resultados obsoletos."],
  [auth.includes("var user=_currentUser;\n   var generation=++_hydrationGeneration;"),"refreshProfile deve ser generation-safe."],
  [!loader.includes("waitForBillingResolution(auth)"),"loader não pode bloquear a entrega esperando billing-access separado."],
  [loader.includes('var token=await user.getIdToken(false);'),"loader deve obter token após autenticar o usuário."],
  [loader.includes('var res=await request(token,currentKey);'),"loader deve consultar premium-content diretamente."],
  [loader.includes('if(res.status===403){'),"loader deve tratar 403 do servidor."],
  [loader.includes('res=await request(token,canonicalKey);'),"loader deve preservar fallback localizado após refresh."],
  [loader.includes('document.open();document.write(html);document.close();'),"loader deve entregar o HTML protegido."],
];

const failed=checks.filter(x=>!x[0]);
if(failed.length){
  console.error("Premium auth/delivery regression FAILED");
  failed.forEach(x=>console.error("- "+x[1]));
  process.exit(1);
}
console.log("Premium auth/delivery regression OK");
