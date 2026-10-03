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
  [!loader.includes("showLoadingState();"),"loader não deve exibir a antiga tela de preparação Premium."],
  [loader.includes('accessCheck?"&access=check":""'),"loader deve separar entrega pública da verificação de entitlement."],
  [loader.includes("function installPremiumActionGate()"),"loader deve instalar o bloqueio de ações Premium."],
  [loader.includes('document.addEventListener("click"') && loader.includes('document.addEventListener("submit"'),"loader deve bloquear clique e envio de formulário."],
  [loader.includes("localizedSubscriptionFallback"),"loader deve preservar assinatura localizada por idioma."],
  [loader.includes('document.open();') && loader.includes('document.write(html);') && loader.includes('document.close();'),"loader deve entregar o HTML protegido."],
  [loader.includes("function ensurePremiumLocalizedFormLayoutAfterWrite()"),"loader deve aplicar o reparo responsivo aos formulários localizados."],
  [loader.includes("main.main-content>header.hero h1{white-space:normal!important"),"loader deve permitir quebra segura do H1 dos formulários em inglês."],
  [loader.includes("top:auto!important;left:auto!important;height:auto!important;min-height:0!important"),"loader deve neutralizar a altura fixa do header global no hero."],
  [loader.includes("ensurePremiumLocalizedFormLayoutAfterWrite();"),"loader deve ativar o reparo após escrever o documento premium."],
  [loader.includes("ACTION_PATTERN"),"loader deve reconhecer calcular, interpretar, download, impressão e início de simulado."],
  [loader.includes('await ensurePremiumFooterAfterWrite();'),"loader deve reidratar o rodapé após a entrega protegida."],
];

const failed=checks.filter(x=>!x[0]);
if(failed.length){
  console.error("Premium auth/delivery regression FAILED");
  failed.forEach(x=>console.error("- "+x[1]));
  process.exit(1);
}
console.log("Premium auth/delivery regression OK");

// Contra regressão de chrome após document.write, nos 18 idiomas e raiz.
require("./test-premium-chrome-rehydration.js");
