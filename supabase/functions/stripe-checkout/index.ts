import { claimCheckout, releaseCheckout, completeCheckout } from "../_shared/billing-checkout-lock.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const STRIPE=Deno.env.get("STRIPE_SECRET_KEY")??"";
const FB=Deno.env.get("FIREBASE_PROJECT_ID")??"calculadoras-enfermagem";
const SITE="https://www.calculadorasdeenfermagem.com.br";
const INTERNATIONAL=["en","es","fr","de","it","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"];
const EUR=["tr","nl","pl","ru","fr","es","de","it","uk","sv"];
const STRIPE_LOCALES={en:"en",es:"es",fr:"fr",de:"de",it:"it",ja:"ja",zh:"zh",hi:"auto",ar:"auto",ru:"ru",tr:"tr",ko:"ko",nl:"nl",pl:"pl",sv:"sv",id:"id",vi:"vi",uk:"auto"};
const JWKS=createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const H={"Access-Control-Allow-Origin":"https://www.calculadorasdeenfermagem.com.br","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Authorization,apikey,Content-Type","Content-Type":"application/json; charset=utf-8"};
const db=()=>createClient(SUPABASE_URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});

async function firebaseUser(req:Request){
  const h=req.headers.get("Authorization")||"";if(!h.startsWith("Bearer "))throw new Error("unauthorized");
  const {payload}=await jwtVerify(h.slice(7).trim(),JWKS,{algorithms:["RS256"],issuer:`https://securetoken.google.com/${FB}`,audience:FB});
  const uid=String(payload.sub||"").trim();if(!uid)throw new Error("unauthorized");
  return {uid,email:payload.email?String(payload.email).trim().toLowerCase():null};
}
async function identity(u:{uid:string,email:string|null}){
  const {data,error}=await db().from("billing_identities").upsert({provider:"firebase",external_subject:u.uid,email:u.email,updated_at:new Date().toISOString()},{onConflict:"provider,external_subject"}).select("id").single();
  if(error||!data)throw new Error("identity_unavailable");return String(data.id);
}
async function stripe(path:string,init:RequestInit={}){
  if(!STRIPE)throw new Error("stripe_not_configured");
  const r=await fetch("https://api.stripe.com/v1"+path,{...init,headers:{Authorization:`Bearer ${STRIPE}`,"Content-Type":"application/x-www-form-urlencoded",...(init.headers||{})}});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`stripe_${r.status}`);return d;
}
function priceFor(lang:string){const currency=EUR.includes(lang)?"EUR":"USD";const id=currency==="EUR"?Deno.env.get("STRIPE_PRICE_EUR"):Deno.env.get("STRIPE_PRICE_USD");if(!id)throw new Error("stripe_price_not_configured");return {id,currency};}
function stripeLocale(lang:string){return STRIPE_LOCALES[lang as keyof typeof STRIPE_LOCALES]||"auto";}
serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:H});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:H});
  let identityId="";
  let checkoutRef="";
  let lockClaimed=false;
  try{
    const u=await firebaseUser(req);const id=await identity(u);identityId=id;
    const body=await req.json().catch(()=>({}));const lang=String(body?.lang||"").toLowerCase();
    if(!INTERNATIONAL.includes(lang))throw new Error("unsupported_international_language");
    const {data:ent}=await db().from("user_entitlements").select("plan,premium_expires_at").eq("user_id",id).maybeSingle();
    if(ent?.plan==="premium"&&(!ent.premium_expires_at||new Date(ent.premium_expires_at)>new Date()))throw new Error("already_premium");
    const {data:existing}=await db().from("billing_subscriptions").select("id,status,provider").eq("user_id",id).in("status",["checkout_pending","active","past_due"]).limit(1);
    if(existing?.length)throw new Error("active_billing_flow");
    const price=priceFor(lang);
    if(!await claimCheckout("stripe",id,1800))throw new Error("active_billing_flow");
    lockClaimed=true;
    const ref="premium_"+crypto.randomUUID();checkoutRef=ref;
    const ins=await db().from("billing_subscriptions").insert({user_id:id,provider:"stripe",external_id:ref,status:"checkout_pending",plan:"premium",currency:price.currency,metadata:{lang,external_reference:ref,price_id:price.id,currency:price.currency}});
    if(ins.error)throw ins.error;
    const form=new URLSearchParams({
      mode:"subscription","line_items[0][price]":price.id,"line_items[0][quantity]":"1",
      client_reference_id:id,"metadata[user_id]":id,"metadata[firebase_uid]":u.uid,"metadata[lang]":lang,"metadata[plan]":"premium",
      "subscription_data[metadata][user_id]":id,"subscription_data[metadata][firebase_uid]":u.uid,"subscription_data[metadata][lang]":lang,"subscription_data[metadata][plan]":"premium",
      customer_email:String(u.email||""),locale:stripeLocale(lang),
      success_url:`${SITE}/boas_vindas_assinante.html?lang=${encodeURIComponent(lang)}&provider=stripe&payment=success`,
      cancel_url:`${SITE}/conta/assinatura.html?lang=${encodeURIComponent(lang)}&stripe=cancel`
    });
    const session=await stripe("/checkout/sessions",{method:"POST",body:form});
    if(!session?.id||!session?.url)throw new Error("checkout_creation_failed");
    const upd=await db().from("billing_subscriptions").update({external_id:String(session.subscription||ref),metadata:{lang,external_reference:ref,price_id:price.id,currency:price.currency,checkout_session_id:String(session.id)},currency:price.currency,updated_at:new Date().toISOString()}).eq("provider","stripe").eq("external_id",ref);
    if(upd.error)throw upd.error;
    await completeCheckout("stripe",id);
    lockClaimed=false;
    return new Response(JSON.stringify({url:session.url,id:session.id}),{status:200,headers:H});
  }catch(e){
    const message=String((e as Error)?.message||e);
    if(checkoutRef)await db().from("billing_subscriptions").update({status:"checkout_failed",updated_at:new Date().toISOString()}).eq("provider","stripe").eq("external_id",checkoutRef);
    if(lockClaimed&&identityId)await releaseCheckout("stripe",identityId,message);
    return new Response(JSON.stringify({error:message}),{status:400,headers:H});
  }
});