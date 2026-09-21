import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const STRIPE = Deno.env.get("STRIPE_SECRET_KEY_TEST") ?? "";
const FB = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const SITE = "https://www.calculadorasdeenfermagem.com.br";
const INTERNATIONAL = ["en","es","fr","de","it","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"];
const EUR = ["tr","nl","pl","ru","fr","es","de","it","uk","sv"];
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const H = {
  "Access-Control-Allow-Origin": SITE,
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,apikey,Content-Type",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function fail(message:string,status=400){
  return new Response(JSON.stringify({error:message}),{status,headers:H});
}
async function firebaseUser(req:Request){
  const h=req.headers.get("Authorization")||"";
  if(!h.startsWith("Bearer ")) throw new Error("unauthorized");
  const {payload}=await jwtVerify(h.slice(7).trim(),JWKS,{
    algorithms:["RS256"],
    issuer:`https://securetoken.google.com/${FB}`,
    audience:FB
  });
  const uid=String(payload.sub||"").trim();
  if(!uid) throw new Error("unauthorized");
  return {uid,email:payload.email?String(payload.email).trim().toLowerCase():null};
}
async function stripe(path:string,init:RequestInit={}){
  if(!STRIPE.startsWith("sk_test_")) throw new Error("stripe_test_key_required");
  const r=await fetch("https://api.stripe.com/v1"+path,{
    ...init,
    headers:{
      Authorization:`Bearer ${STRIPE}`,
      "Content-Type":"application/x-www-form-urlencoded",
      ...(init.headers||{})
    }
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d?.error?.message||`stripe_${r.status}`);
  return d;
}

function currencyFor(lang:string){
  return EUR.includes(lang) ? "eur" : "usd";
}

function testPrice(){
  // The Premium sandbox price is a single Stripe multi-currency Price.
  // It supports EUR and USD; Stripe Checkout can select the requested
  // currency explicitly through the Checkout Session currency parameter.
  const id=Deno.env.get("STRIPE_PRICE_TEST_MULTI") ?? "";
  if(!id.startsWith("price_")) throw new Error("stripe_test_multi_price_not_configured");
  return id;
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:H});
  if(req.method!=="POST") return fail("method_not_allowed",405);
  try{
    const u=await firebaseUser(req);
    const body=await req.json().catch(()=>({}));
    const lang=String(body?.lang||"").toLowerCase();
    if(!INTERNATIONAL.includes(lang)) throw new Error("unsupported_international_language");

    const priceId=testPrice();
    const currency=currencyFor(lang);

    const form=new URLSearchParams({
      mode:"subscription",
      currency,
      "line_items[0][price]":priceId,
      "line_items[0][quantity]":"1",
      client_reference_id:"stripe_test_"+u.uid,
      "metadata[test_mode]":"true",
      "metadata[firebase_uid]":u.uid,
      "metadata[lang]":lang,
      "metadata[plan]":"premium",
      "subscription_data[metadata][test_mode]":"true",
      "subscription_data[metadata][firebase_uid]":u.uid,
      "subscription_data[metadata][lang]":lang,
      "subscription_data[metadata][plan]":"premium",
      ...(u.email?{customer_email:u.email}:{}),
      success_url:`${SITE}/conta/assinatura.html?lang=${encodeURIComponent(lang)}&stripe_test=success`,
      cancel_url:`${SITE}/conta/assinatura.html?lang=${encodeURIComponent(lang)}&stripe_test=cancel`
    });

    const session=await stripe("/checkout/sessions",{method:"POST",body:form});
    if(!session?.id||!session?.url) throw new Error("checkout_creation_failed");

    return new Response(JSON.stringify({
      ok:true,
      mode:"test",
      session_id:String(session.id),
      url:String(session.url),
      currency
    }),{status:200,headers:H});
  }catch(e){
    const m=String((e as Error)?.message||e);
    return fail(m,m==="unauthorized"?401:400);
  }
});