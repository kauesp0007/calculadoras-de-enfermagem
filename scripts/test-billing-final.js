#!/usr/bin/env node
"use strict";

const fs=require("node:fs");

function read(path){return fs.readFileSync(path,"utf8");}
function assert(condition,message){if(!condition){console.error("[BillingFinal] FAIL:",message);process.exitCode=1;}}
function inlineScript(html,needle){
  const idx=html.indexOf(needle);
  if(idx<0)return "";
  const startTag=html.lastIndexOf("<script",idx);
  const start=html.indexOf(">",startTag)+1;
  const end=html.indexOf("</script>",idx);
  return startTag>=0&&start>0&&end>start?html.slice(start,end):"";
}

const page=read("conta/assinatura.html");
const asaas=read("supabase/functions/asaas-checkout/index.ts");
const stripe=read("supabase/functions/stripe-checkout/index.ts");
const asaasWebhook=read("supabase/functions/asaas-webhook/index.ts");
const stripeWebhook=read("supabase/functions/stripe-webhook/index.ts");
const billingAccess=read("supabase/functions/billing-access/index.ts");
const premium=read("supabase/functions/premium-content/index.ts");
const plans=read("js/auth/plan-service.js");

assert(page.includes("var DEV_CHECKOUT_BLOCKED=false"),"checkout final deve estar ativado.");
assert(page.includes('data-kind="monthly_card" class="billing-button billing-button-primary">Assinar com cartão'),"cartão brasileiro deve chamar monthly_card.");
assert(page.includes('data-kind="pix" class="billing-button billing-button-pix">Pagar com Pix'),"Pix brasileiro deve chamar pix.");
assert(page.includes('data-kind="stripe" class="billing-button billing-button-primary">Assinar com cartão'),"cartão internacional deve chamar stripe.");
assert(!page.includes('class="billing-button billing-button-primary" disabled'),"botão azul não deve ficar visualmente desativado.");
assert(!page.includes('class="billing-button billing-button-pix" disabled'),"botão Pix não deve ficar visualmente desativado.");
assert(page.includes('btn.addEventListener("click",function(){start(btn.getAttribute("data-kind"),langCode);});'),"botões devem estar ligados ao comando de checkout.");

assert(asaas.includes('if(kind!=="monthly_card"&&kind!=="pix_30d")'),"Asaas deve aceitar somente os dois tipos canônicos.");
assert(asaas.includes('chargeTypes:isRecurring?["RECURRENT"]:["DETACHED"]'),"Asaas deve separar recorrência de Pix avulso.");
assert(asaas.includes('if(isRecurring)payload.subscription={cycle:"MONTHLY",nextDueDate};'),"cartão Asaas deve criar Checkout recorrente.");
assert(stripe.includes('mode:"subscription"'),"Stripe deve usar Checkout em modo subscription.");
assert(stripe.includes('"metadata[plan]":"premium"'),"Stripe deve gravar o plano no metadata do checkout.");
assert(stripe.includes('"subscription_data[metadata][plan]":"premium"'),"Stripe deve gravar o plano no metadata da assinatura.");

assert(asaasWebhook.includes('CHECKOUT_PAID'),"Webhook Asaas deve processar CHECKOUT_PAID.");
assert(asaasWebhook.includes('PAYMENT_RECEIVED'),"Webhook Asaas deve processar confirmação de recebimento.");
assert(asaasWebhook.includes('PAYMENT_REFUNDED'),"Webhook Asaas deve revogar acesso após estorno.");
assert(asaasWebhook.includes('SUBSCRIPTION_DELETED'),"Webhook Asaas deve revogar acesso após exclusão da assinatura.");
assert(asaasWebhook.includes('claim_billing_webhook'),"Webhook Asaas deve usar idempotência.");
assert(asaasWebhook.includes('asaas-access-token'),"Webhook Asaas deve validar seu token de autenticação.");

assert(stripeWebhook.includes('checkout.session.completed'),"Webhook Stripe deve processar checkout concluído.");
assert(stripeWebhook.includes('invoice.paid'),"Webhook Stripe deve processar renovação paga.");
assert(stripeWebhook.includes('invoice.payment_failed'),"Webhook Stripe deve processar falha de pagamento.");
assert(stripeWebhook.includes('customer.subscription.deleted'),"Webhook Stripe deve processar cancelamento.");
assert(stripeWebhook.includes('stripe-signature'),"Webhook Stripe deve validar assinatura.");
assert(stripeWebhook.includes('claim_billing_webhook'),"Webhook Stripe deve usar idempotência.");

assert(billingAccess.includes('ent.plan==="premium"'),"billing-access deve usar entitlement como autoridade.");
assert(premium.includes('ent.plan==="premium"'),"premium-content deve validar entitlement antes de entregar conteúdo.");
assert(plans.includes('PREMIUM_PLANS:["premium"]'),"catálogo comercial deve conter somente Premium como plano pago.");

const js=inlineScript(page,"var checkoutInFlight");
try{new Function(js);console.log("[BillingFinal] assinatura.html JavaScript: OK");}
catch(error){assert(false,"JavaScript inline da assinatura contém erro: "+error.message);}

if(process.exitCode){process.exit(1);}
console.log("[BillingFinal] invariantes de checkout, webhook e autorização: OK");
