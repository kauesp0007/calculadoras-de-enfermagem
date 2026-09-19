import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL=Deno.env.get("SUPABASE_URL")??"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const TOKEN=Deno.env.get("ASAAS_WEBHOOK_TOKEN")??"";
const ASAAS=Deno.env.get("ASAAS_API_TOKEN")??"";
const H={"Content-Type":"application/json; charset=utf-8"};
const db=()=>createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const iso=(d:any)=>d?new Date(d).toISOString():null;
const addDays=(n:number)=>new Date(Date.now()+n*86400000).toISOString();

async function asaasGet(path:string){
  if(!ASAAS)throw new Error("asaas_not_configured");
  const r=await fetch("https://api.asaas.com/v3"+path,{headers:{access_token:ASAAS}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error("asaas_"+r.status);
  return d;
}
async function findSub(ref:string,providerSubId:string,customerId:string){
  if(ref){
    const a=await db().from("billing_subscriptions").select("*").eq("provider","asaas").eq("external_id",ref).maybeSingle();
    if(a.error)throw a.error;if(a.data)return a.data;
  }
  if(providerSubId){
    const a=await db().from("billing_subscriptions").select("*").eq("provider","asaas").eq("metadata->>provider_subscription_id",providerSubId).maybeSingle();
    if(a.error)throw a.error;if(a.data)return a.data;
  }
  if(customerId){
    const a=await db().from("billing_subscriptions").select("*").eq("provider","asaas").in("status",["checkout_pending","active","past_due"]).eq("metadata->>asaas_customer_id",customerId).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(a.error)throw a.error;if(a.data)return a.data;
  }
  return null;
}
async function setPremium(sub:any,expires:string,extra:any={}){
  const now=new Date().toISOString();
  const metadata={...(sub.metadata||{}),...extra};
  const u=await db().from("billing_subscriptions").update({
    status:"active",current_period_end:expires,metadata,updated_at:now
  }).eq("id",sub.id);
  if(u.error)throw u.error;
  const e=await db().from("user_entitlements").upsert({
    user_id:sub.user_id,plan:"premium",premium_expires_at:expires,provider:"asaas",
    provider_customer_id:metadata.asaas_customer_id||null,
    provider_subscription_id:metadata.provider_subscription_id||null,updated_at:now
  },{onConflict:"user_id"});
  if(e.error)throw e.error;
}
async function setFree(sub:any,reason:string){
  const now=new Date().toISOString();
  const u=await db().from("billing_subscriptions").update({status:"inactive",metadata:{...(sub.metadata||{}),last_reason:reason},updated_at:now}).eq("id",sub.id);
  if(u.error)throw u.error;
  const {data:other,error}=await db().from("billing_subscriptions").select("id").eq("user_id",sub.user_id).eq("status","active").gt("current_period_end",now).limit(1);
  if(error)throw error;
  if(!other?.length){
    const e=await db().from("user_entitlements").update({plan:"free",premium_expires_at:now,updated_at:now}).eq("user_id",sub.user_id);
    if(e.error)throw e.error;
  }
}
serve(async req=>{
  if(req.method!=="POST")return new Response("method_not_allowed",{status:405,headers:H});
  if(!TOKEN||req.headers.get("asaas-access-token")!==TOKEN)return new Response("unauthorized",{status:401,headers:H});
  try{
    const e=await req.json();
    const event=String(e?.event||"");
    const eventId=String(e?.id||"");
    if(!event||!eventId)return new Response(JSON.stringify({ok:true,ignored:true}),{status:200,headers:H});
    const claim=await db().rpc("claim_billing_webhook",{p_provider:"asaas",p_event_id:eventId,p_lease_seconds:300});
    if(claim.error)throw claim.error;
    if(claim.data!==true)return new Response(JSON.stringify({ok:true,duplicate:true}),{status:200,headers:H});

    const checkout=e?.checkout||{};
    const payment=e?.payment||{};
    const subscription=e?.subscription||{};
    const ref=String(checkout?.externalReference||payment?.externalReference||subscription?.externalReference||"");
    const providerSubId=String(payment?.subscription||subscription?.id||"");
    const customerId=String(checkout?.customer||payment?.customer||subscription?.customer||"");
    const sub=await findSub(ref,providerSubId,customerId);
    if(!sub){
      await db().rpc("fail_billing_webhook",{p_provider:"asaas",p_event_id:eventId,p_error:"billing_subscription_not_found"});
      return new Response(JSON.stringify({ok:true,ignored:true}),{status:200,headers:H});
    }

    const metadata={...(sub.metadata||{}),last_event:event,last_event_id:eventId};
    if(customerId)metadata.asaas_customer_id=customerId;

    if(event==="CHECKOUT_CREATED"){
      const u=await db().from("billing_subscriptions").update({status:"checkout_pending",metadata,updated_at:new Date().toISOString()}).eq("id",sub.id);
      if(u.error)throw u.error;
    }else if(event==="CHECKOUT_PAID"){
      const kind=String(metadata.kind||"pix_30d");
      let expiry=addDays(30);
      if(kind==="monthly_card"){
        const subId=String(subscription?.id||metadata.provider_subscription_id||"");
        if(subId){
          const remote=await asaasGet(`/subscriptions/${encodeURIComponent(subId)}`);
          if(remote?.nextDueDate)expiry=iso(remote.nextDueDate+"T23:59:59-03:00")||expiry;
          metadata.provider_subscription_id=subId;
        }
      }
      metadata.checkout_paid=true;
      await setPremium({...sub,metadata},expiry,{...metadata});
    }else if(event==="SUBSCRIPTION_CREATED"||event==="SUBSCRIPTION_UPDATED"){
      const sid=String(subscription?.id||"");
      metadata.provider_subscription_id=sid;
      metadata.asaas_customer_id=String(subscription?.customer||customerId||"");
      const expiry=subscription?.nextDueDate?iso(String(subscription.nextDueDate)+"T23:59:59-03:00"):addDays(30);
      const u=await db().from("billing_subscriptions").update({status:subscription?.status==="ACTIVE"?"active":String(subscription?.status||"active").toLowerCase(),metadata,provider_subscription_id:sid,current_period_end:expiry,updated_at:new Date().toISOString()}).eq("id",sub.id);
      if(u.error)throw u.error;
      if(metadata.checkout_paid===true&&String(subscription?.status||"").toUpperCase()==="ACTIVE")await setPremium({...sub,metadata},expiry,metadata);
    }else if(event==="PAYMENT_CONFIRMED"||event==="PAYMENT_RECEIVED"){
      let expiry=addDays(30);
      const paymentSubId=String(payment?.subscription||metadata.provider_subscription_id||"");
      if(paymentSubId){
        const remote=await asaasGet(`/subscriptions/${encodeURIComponent(paymentSubId)}`);
        if(remote?.nextDueDate)expiry=iso(String(remote.nextDueDate)+"T23:59:59-03:00")||expiry;
        metadata.provider_subscription_id=paymentSubId;
        metadata.asaas_customer_id=String(remote?.customer||customerId||metadata.asaas_customer_id||"");
      }
      await setPremium({...sub,metadata},expiry,metadata);
    }else if(["CHECKOUT_CANCELED","CHECKOUT_EXPIRED"].includes(event)){
      await setFree({...sub,metadata},event);
    }else if(["SUBSCRIPTION_INACTIVATED","SUBSCRIPTION_DELETED"].includes(event)){
      await setFree({...sub,metadata},event);
    }else if(["PAYMENT_REFUNDED","PAYMENT_PARTIALLY_REFUNDED","PAYMENT_CHARGEBACK_REQUESTED","PAYMENT_CHARGEBACK_DISPUTE"].includes(event)){
      await setFree({...sub,metadata},event);
    }

    const done=await db().rpc("complete_billing_webhook",{p_provider:"asaas",p_event_id:eventId});
    if(done.error)throw done.error;
    return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
  }catch(e){
    console.error("[asaas-webhook]",e);
    return new Response(JSON.stringify({error:"webhook_processing_failed"}),{status:500,headers:H});
  }
});