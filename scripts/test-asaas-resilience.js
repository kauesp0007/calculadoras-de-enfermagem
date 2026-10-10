#!/usr/bin/env node
"use strict";

const fs=require("node:fs");
const vm=require("node:vm");

function read(path){return fs.readFileSync(path,"utf8");}
function assert(condition,message){
  if(!condition){
    console.error("[AsaasResilience] FAIL:",message);
    process.exit(1);
  }
}
function marked(source,start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a);
  assert(a>=0&&b>a,"marcadores de estado ausentes: "+start);
  return source.slice(a+start.length,b);
}
function evaluate(code,exportsExpression){
  const sandbox={Date,URLSearchParams,encodeURIComponent};
  vm.createContext(sandbox);
  vm.runInContext(code+"\n;globalThis.__exports="+exportsExpression+";",sandbox);
  return sandbox.__exports;
}

const checkout=read("supabase/functions/asaas-checkout/index.ts");
const webhook=read("supabase/functions/asaas-webhook/index.ts");

assert(
  !checkout.includes('const remote=await asaas("/checkouts/"+encodeURIComponent(existingCheckoutId))'),
  "GET /checkouts/{id} não pode voltar ao checkout"
);
assert(
  checkout.includes('await asaas("/checkouts/"+encodeURIComponent(existingCheckoutId)+"/cancel",{method:"POST"})'),
  "troca de modalidade precisa cancelar o checkout anterior"
);
assert(checkout.includes("checkout_url:checkoutUrl"),"URL do checkout deve ser persistida");
assert(checkout.includes("checkout_expires_at:checkoutExpiresAt"),"expiração do checkout deve ser persistida");
assert(
  !webhook.includes('asaasGet("/checkouts/"+encodeURIComponent(checkoutId))'),
  "webhook não pode consultar GET /checkouts/{id}"
);

const checkoutState=evaluate(
  marked(checkout,"/* ASAAS_CHECKOUT_STATE_START */","/* ASAAS_CHECKOUT_STATE_END */"),
  "{CHECKOUT_TTL_MINUTES,CHECKOUT_TTL_MS,checkoutExpiresAtMs,isCheckoutExpired,checkoutUrlFor}"
);
const base="2026-10-10T00:00:00.000Z";
const baseMs=Date.parse(base);
assert(checkoutState.CHECKOUT_TTL_MINUTES===60,"TTL deve continuar em 60 minutos");
assert(
  checkoutState.checkoutExpiresAtMs(base,{})===baseMs+60*60*1000,
  "expiração fallback deve usar created_at + 60 minutos"
);
assert(
  checkoutState.isCheckoutExpired(base,{},baseMs+59*60*1000)===false,
  "checkout não pode expirar antes de 60 minutos"
);
assert(
  checkoutState.isCheckoutExpired(base,{},baseMs+60*60*1000)===true,
  "checkout deve expirar no limite de 60 minutos"
);
assert(
  checkoutState.checkoutUrlFor({checkout_url:"https://asaas.com/checkoutSession/show?id=abc"},"abc")
    ==="https://asaas.com/checkoutSession/show?id=abc",
  "URL Asaas persistida deve ser reutilizada"
);
assert(
  checkoutState.checkoutUrlFor({},"abc")
    ==="https://asaas.com/checkoutSession/show?id=abc",
  "checkout legado deve receber URL canônica segura"
);

const webhookState=evaluate(
  marked(webhook,"/* ASAAS_WEBHOOK_STATE_START */","/* ASAAS_WEBHOOK_STATE_END */"),
  "{checkoutCreatedPatch,prePaymentLifecycleStatus,normalizePaidAccessExpiry}"
);
for(const status of ["inactive","active","past_due","checkout_failed","checkout_pending"]){
  const patch=webhookState.checkoutCreatedPatch(
    status,
    {last_event:status==="active"?"PAYMENT_CONFIRMED":undefined},
    "evt-test",
    "chk-test",
    "cus-test",
    "2026-10-10T01:00:00.000Z"
  );
  assert(patch.status===status,"CHECKOUT_CREATED atrasado alterou o estado "+status);
}
assert(
  webhookState.prePaymentLifecycleStatus("inactive")==="inactive",
  "SUBSCRIPTION_CREATED atrasado não pode ressuscitar assinatura inativa"
);
assert(
  webhookState.prePaymentLifecycleStatus("checkout_pending")==="checkout_pending",
  "assinatura ainda pendente deve continuar pendente"
);

const expiryNow="2026-10-10T04:00:00.000Z";
const historicalPaid=webhookState.normalizePaidAccessExpiry(
  "2026-10-06T03:00:00.000Z",
  "2026-10-07T01:28:38.000Z",
  expiryNow
);
assert(historicalPaid.corrected===true,"vencimento passado deve ser corrigido");
assert(
  historicalPaid.expiry==="2026-11-06T01:28:38.000Z",
  "pagamento confirmado deve receber vencimento futuro a partir do checkout"
);
const futurePaid=webhookState.normalizePaidAccessExpiry(
  "2026-11-06T03:00:00.000Z",
  "2026-10-07T01:28:38.000Z",
  expiryNow
);
assert(futurePaid.corrected===false,"vencimento futuro válido deve ser preservado");
assert(
  futurePaid.expiry==="2026-11-06T03:00:00.000Z",
  "normalização não pode mudar vencimento futuro válido"
);
assert(
  webhook.includes("nonfuture_access_expiry_ignored"),
  "correção de vencimento passado deve ficar rastreável"
);

const checkoutCreatedBlock=webhook.slice(
  webhook.indexOf('if(event==="CHECKOUT_CREATED"){'),
  webhook.indexOf('}else if(event==="CHECKOUT_PAID"){')
);
assert(
  !checkoutCreatedBlock.includes('status:"checkout_pending"'),
  "handler CHECKOUT_CREATED não pode forçar checkout_pending"
);

console.log("[AsaasResilience] PASS — TTL, reuso, troca de modalidade e eventos atrasados protegidos.");
