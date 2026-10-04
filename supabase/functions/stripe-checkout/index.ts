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
const H={"Access-Control-Allow-Origin":SITE,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Authorization,apikey,Content-Type","Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const db=()=>createClient(SUPABASE_URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});

async function firebaseUser(req:Request){
  const h=req.headers.get("Authorization")||"";
  if(!h.startsWith("Bearer "))throw new Error("unauthorized");
  const {payload}=await jwtVerify(h.slice(7).trim(),JWKS,{algorithms:["RS256"],issuer:"https://securetoken.google.com/"+FB,audience:FB});
  const uid=String(payload.sub||"").trim();
  if(!uid)throw new Error("unauthorized");
  return {uid,email:payload.email?String(payload.email).trim().toLowerCase():null};
}
async function identity(u:{uid:string,email:string|null}){
  const {data,error}=await db().from("billing_identities").upsert({provider:"firebase",external_subject:u.uid,email:u.email,updated_at:new Date().toISOString()},{onConflict:"provider,external_subject"}).select("id").single();
  if(error||!data)throw new Error("identity_unavailable");
  return String(data.id);
}
async function portalEnabled(){
  const {data,error}=await db().from("developer_settings").select("value").eq("key","stripe_portal_enabled").maybeSingle();
  if(error)throw error;
  const value=data?.value as {enabled?: boolean}|undefined;
  return value?.enabled!==false;
}
async function stripe(path:string,init:RequestInit={}){
  if(!STRIPE)throw new Error("stripe_not_configured");
  const r=await fetch("https://api.stripe.com/v1"+path,{...init,headers:{Authorization:"Bearer "+STRIPE,"Content-Type":"application/x-www-form-urlencoded",...(init.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d?.error?.message||("stripe_"+r.status));
  return d;
}
const CANONICAL_PRICE_USD="price_1UMhcFAE0EBt2lxCXtRE82lF";
const CANONICAL_PRICE_EUR="price_1UMhcLAE0EBt2lxCJ0YPQw3S";
function priceFor(lang:string){
  const currency=EUR.includes(lang)?"EUR":"USD";
  const id=currency==="EUR"?CANONICAL_PRICE_EUR:CANONICAL_PRICE_USD;
  return {id,currency};
}
function stripeLocale(lang:string){return STRIPE_LOCALES[lang as keyof typeof STRIPE_LOCALES]||"auto";}
function isoFromUnix(value:any){
  const n=Number(value);
  return Number.isFinite(n)&&n>0?new Date(n*1000).toISOString():null;
}
function subCurrency(remote:any,local:any){
  return String(remote?.items?.data?.[0]?.price?.currency||local?.currency||"").toLowerCase()||null;
}
async function grantFromRemote(local:any,remote:any,lang:string,sessionId:string){
  const subId=String(remote?.id||local?.metadata?.provider_subscription_id||"").trim();
  if(!subId)throw new Error("stripe_subscription_missing");
  const now=new Date().toISOString();
  const metadata={...(local?.metadata||{})};
  metadata.lang=eventLang(lang,local);
  metadata.provider_subscription_id=subId;
  if(sessionId)metadata.checkout_session_id=sessionId;
  if(remote?.customer)metadata.customer_id=String(remote.customer);
  metadata.reconciled_by="stripe-checkout";
  const end=isoFromUnix(remote?.current_period_end)||new Date(Date.now()+30*86400000).toISOString();
  const start=isoFromUnix(remote?.current_period_start);
  const u=await db().from("billing_subscriptions").update({
    external_id:subId,
    status:["active","trialing"].includes(String(remote?.status||""))?String(remote.status):"active",
    plan:"premium",
    currency:subCurrency(remote,local),
    current_period_start:start||local?.current_period_start||null,
    current_period_end:end,
    cancel_at_period_end:Boolean(remote?.cancel_at_period_end??local?.cancel_at_period_end??false),
    metadata,
    updated_at:now
  }).eq("id",local.id);
  if(u.error)throw u.error;
  const e=await db().from("user_entitlements").upsert({
    user_id:local.user_id,
    plan:"premium",
    premium_expires_at:end,
    provider:"stripe",
    provider_customer_id:remote?.customer?String(remote.customer):(local?.metadata?.customer_id||null),
    provider_subscription_id:subId,
    updated_at:now
  },{onConflict:"user_id"});
  if(e.error)throw e.error;
}
function eventLang(lang:string,local:any){
  return lang||String(local?.metadata?.lang||"en");
}
async function markPendingInactive(id:string,reason:string){
  const r=await db().from("billing_subscriptions").update({status:"inactive",metadata:{last_event:reason},updated_at:new Date().toISOString()}).eq("id",id);
  if(r.error)throw r.error;
}
serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:H});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:H});
  let identityId="";
  let checkoutRef="";
  let lockClaimed=false;
  try{
    const u=await firebaseUser(req);
    if(!await portalEnabled())throw new Error("stripe_portal_disabled");
    const id=await identity(u);
    identityId=id;

    const body=await req.json().catch(()=>({}));
    const lang=String(body?.lang||"").toLowerCase();
    if(!INTERNATIONAL.includes(lang))throw new Error("unsupported_international_language");

    const {data:ent}=await db().from("user_entitlements").select("plan,premium_expires_at").eq("user_id",id).maybeSingle();
    if(ent?.plan==="premium"&&(!ent.premium_expires_at||new Date(ent.premium_expires_at)>new Date()))throw new Error("already_premium");

    const {data:existingAll}=await db().from("billing_subscriptions").select("id,status,provider,external_id,metadata,currency,current_period_start,current_period_end,cancel_at_period_end,created_at").eq("user_id",id).in("status",["checkout_pending","active","past_due"]).order("created_at",{ascending:false}).limit(2);
    const current=existingAll?.[0]||null;
    if(current){
      if(current.status==="active"||current.status==="past_due"){
        const subId=String(current.metadata?.provider_subscription_id||current.external_id||"");
        if(current.provider==="stripe"&&subId.startsWith("sub_")){
          try{
            const remote=await stripe("/subscriptions/"+encodeURIComponent(subId));
            if(["active","trialing"].includes(String(remote?.status||"")))await grantFromRemote(current,remote,lang,String(current.metadata?.checkout_session_id||""));
          }catch(_){}
        }
        throw new Error("already_premium");
      }

      if(current.provider!=="stripe")throw new Error("active_billing_flow");

      const checkoutSessionId=String(current.metadata?.checkout_session_id||"").trim();
      if(checkoutSessionId){
        try{
          const remoteSession=await stripe("/checkout/sessions/"+encodeURIComponent(checkoutSessionId));
          if(remoteSession?.status==="open"&&remoteSession?.url){
            return new Response(JSON.stringify({url:String(remoteSession.url),id:checkoutSessionId,reused:true}),{status:200,headers:H});
          }
          if(remoteSession?.status==="complete"){
            const subId=String(remoteSession?.subscription||current.metadata?.provider_subscription_id||"");
            if(!subId)throw new Error("stripe_subscription_missing");
            const remoteSub=await stripe("/subscriptions/"+encodeURIComponent(subId));
            await grantFromRemote(current,remoteSub,lang,checkoutSessionId);
            throw new Error("already_premium");
          }
          if(remoteSession?.status==="expired"){
            await markPendingInactive(current.id,"CHECKOUT_EXPIRED");
          }else{
            throw new Error("active_billing_flow");
          }
        }catch(e){
          const message=String((e as Error)?.message||e);
          if(message==="already_premium"||message==="active_billing_flow")throw e;
          if(/^stripe_404(?:$|_)/.test(message))await markPendingInactive(current.id,"CHECKOUT_NOT_FOUND");
          else throw new Error("active_billing_flow");
        }
      }else{
        const providerSub=String(current.metadata?.provider_subscription_id||current.external_id||"");
        if(providerSub.startsWith("sub_")){
          try{
            const remoteSub=await stripe("/subscriptions/"+encodeURIComponent(providerSub));
            if(["active","trialing"].includes(String(remoteSub?.status||""))){
              await grantFromRemote(current,remoteSub,lang,String(current.metadata?.checkout_session_id||""));
              throw new Error("already_premium");
            }
          }catch(e){
            if(String((e as Error)?.message||e)==="already_premium")throw e;
          }
        }
        const createdAt=current.created_at?new Date(current.created_at):null;
        if(createdAt&&Date.now()-createdAt.getTime()>2*60*60*1000)await markPendingInactive(current.id,"STALE_CHECKOUT_PENDING");
        else throw new Error("active_billing_flow");
      }
    }

    const price=priceFor(lang);
    if(!await claimCheckout("stripe",id,1800))throw new Error("active_billing_flow");
    lockClaimed=true;

    const ref="premium_"+crypto.randomUUID();
    checkoutRef=ref;
    const ins=await db().from("billing_subscriptions").insert({
      user_id:id,
      provider:"stripe",
      external_id:ref,
      status:"checkout_pending",
      plan:"premium",
      currency:price.currency,
      metadata:{lang,external_reference:ref,price_id:price.id,currency:price.currency,customer_email:u.email}
    });
    if(ins.error){
      if(String(ins.error.code||"")==="23505")throw new Error("active_billing_flow");
      throw ins.error;
    }

    const form=new URLSearchParams({
      mode:"subscription",
      integration_identifier:"site_premium_subscription_v1",
      "line_items[0][price]":price.id,
      "line_items[0][quantity]":"1",
      client_reference_id:id,
      "metadata[user_id]":id,
      "metadata[firebase_uid]":u.uid,
      "metadata[lang]":lang,
      "metadata[plan]":"premium",
      "subscription_data[metadata][user_id]":id,
      "subscription_data[metadata][firebase_uid]":u.uid,
      "subscription_data[metadata][lang]":lang,
      "subscription_data[metadata][plan]":"premium",
      customer_email:String(u.email||""),
      locale:stripeLocale(lang),
      success_url:SITE+"/"+encodeURIComponent(lang)+"/boas_vindas_assinante.html?lang="+encodeURIComponent(lang)+"&provider=stripe&payment=success",
      cancel_url:SITE+"/conta/assinatura.html?lang="+encodeURIComponent(lang)+"&stripe=cancel"
    });
    const session=await stripe("/checkout/sessions",{method:"POST",body:form});
    if(!session?.id||!session?.url)throw new Error("checkout_creation_failed");

    const sessionMeta={lang,external_reference:ref,price_id:price.id,currency:price.currency,checkout_session_id:String(session.id),customer_email:u.email};
    if(session?.customer)sessionMeta.customer_id=String(session.customer);
    if(session?.subscription)sessionMeta.provider_subscription_id=String(session.subscription);
    const upd=await db().from("billing_subscriptions").update({
      external_id:String(session.subscription||ref),
      metadata:sessionMeta,
      currency:price.currency,
      updated_at:new Date().toISOString()
    }).eq("provider","stripe").eq("external_id",ref);
    if(upd.error)throw upd.error;

    await completeCheckout("stripe",id);
    lockClaimed=false;
    return new Response(JSON.stringify({url:session.url,id:session.id}),{status:200,headers:H});
  }catch(e){
    const message=String((e as Error)?.message||e);
    if(checkoutRef)await db().from("billing_subscriptions").update({status:"checkout_failed",updated_at:new Date().toISOString()}).eq("provider","stripe").eq("external_id",checkoutRef);
    if(lockClaimed&&identityId)await releaseCheckout("stripe",identityId,message);
    return new Response(JSON.stringify({error:message}),{status:message==="unauthorized"?401:400,headers:H});
  }
});
