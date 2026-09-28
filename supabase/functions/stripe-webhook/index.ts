import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL=Deno.env.get("SUPABASE_URL")??"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const SECRET=Deno.env.get("STRIPE_WEBHOOK_SECRET")??"";
const STRIPE=Deno.env.get("STRIPE_SECRET_KEY")??"";
const H={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const db=()=>createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});

function hex(a:ArrayBuffer){return Array.from(new Uint8Array(a)).map(x=>x.toString(16).padStart(2,"0")).join("");}
async function verify(body:string,sig:string){
  const parts=sig.split(",");
  const t=parts.find(x=>x.startsWith("t="))?.slice(2)||"";
  const v=parts.filter(x=>x.startsWith("v1=")).map(x=>x.slice(3));
  if(!SECRET||!t||!v.length||Math.abs(Date.now()/1000-Number(t))>300)return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const mac=hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(t+"."+body)));
  return v.includes(mac);
}
async function stripeGet(path:string){
  if(!STRIPE)throw new Error("stripe_not_configured");
  const r=await fetch("https://api.stripe.com/v1"+path,{headers:{Authorization:"Bearer "+STRIPE}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error("stripe_"+r.status);
  return d;
}
function isoFromUnix(value:any){
  const n=Number(value);
  return Number.isFinite(n)&&n>0?new Date(n*1000).toISOString():null;
}
function currencyFromSub(remote:any,local:any){
  return String(remote?.items?.data?.[0]?.price?.currency||local?.currency||"").toLowerCase()||null;
}
async function findByUid(uid:string){
  if(!uid)return null;
  const a=await db().from("billing_subscriptions").select("*").eq("provider","stripe").eq("user_id",uid).in("status",["checkout_pending","active","past_due"]).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(a.error)throw a.error;
  return a.data||null;
}
async function findSub(uid:string,subId:string,sessionId:string){
  if(subId){
    const a=await db().from("billing_subscriptions").select("*").eq("provider","stripe").eq("external_id",subId).maybeSingle();
    if(a.error)throw a.error;
    if(a.data&&(!uid||String(a.data.user_id)===uid))return a.data;
  }
  if(subId){
    const a=await db().from("billing_subscriptions").select("*").eq("provider","stripe").eq("metadata->>provider_subscription_id",subId).maybeSingle();
    if(a.error)throw a.error;
    if(a.data&&(!uid||String(a.data.user_id)===uid))return a.data;
  }
  if(sessionId){
    const a=await db().from("billing_subscriptions").select("*").eq("provider","stripe").eq("metadata->>checkout_session_id",sessionId).maybeSingle();
    if(a.error)throw a.error;
    if(a.data&&(!uid||String(a.data.user_id)===uid))return a.data;
  }
  return await findByUid(uid);
}
async function createReconciledSub(uid:string,subId:string,sessionId:string,remote:any,meta:any,eventId:string,status:string){
  if(!uid||!subId)return null;
  const merged={...(remote?.metadata||{}),...(meta||{}),provider_subscription_id:subId,event_id:eventId};
  if(sessionId)merged.checkout_session_id=sessionId;
  const customerId=String(remote?.customer||meta?.customer_id||"");
  if(customerId)merged.customer_id=customerId;
  const row={
    user_id:uid,
    provider:"stripe",
    external_id:subId,
    status,
    plan:"premium",
    currency:currencyFromSub(remote,null),
    current_period_start:isoFromUnix(remote?.current_period_start),
    current_period_end:isoFromUnix(remote?.current_period_end),
    cancel_at_period_end:Boolean(remote?.cancel_at_period_end??false),
    metadata:merged
  };
  const ins=await db().from("billing_subscriptions").insert(row).select("*").single();
  if(!ins.error)return ins.data;
  if(String(ins.error.code||"")==="23505")return await findSub(uid,subId,sessionId);
  throw ins.error;
}
async function setPremium(sub:any,remote:any,meta:any,status="active"){
  const now=new Date().toISOString();
  const merged={...(sub.metadata||{}),...(meta||{})};
  const subId=String(remote?.id||merged.provider_subscription_id||"");
  const customerId=String(remote?.customer||merged.customer_id||"");
  const start=isoFromUnix(remote?.current_period_start);
  const end=isoFromUnix(remote?.current_period_end)||new Date(Date.now()+30*86400000).toISOString();
  if(subId)merged.provider_subscription_id=subId;
  if(customerId)merged.customer_id=customerId;
  const u=await db().from("billing_subscriptions").update({
    external_id:subId||sub.external_id,
    status,
    current_period_start:start||sub.current_period_start||null,
    current_period_end:end,
    cancel_at_period_end:Boolean(remote?.cancel_at_period_end??sub.cancel_at_period_end??false),
    currency:currencyFromSub(remote,sub),
    metadata:merged,
    updated_at:now
  }).eq("id",sub.id);
  if(u.error)throw u.error;
  const e=await db().from("user_entitlements").upsert({
    user_id:sub.user_id,
    plan:"premium",
    premium_expires_at:end,
    provider:"stripe",
    provider_customer_id:customerId||null,
    provider_subscription_id:subId||null,
    updated_at:now
  },{onConflict:"user_id"});
  if(e.error)throw e.error;
}
async function clearEntitlementIfNoActive(uid:string){
  if(!uid)return;
  const now=new Date().toISOString();
  const a=await db().from("billing_subscriptions").select("id").eq("user_id",uid).in("status",["active","past_due"]).gt("current_period_end",now).limit(1);
  if(a.error)throw a.error;
  if(!a.data?.length){
    const e=await db().from("user_entitlements").update({plan:"free",premium_expires_at:now,updated_at:now}).eq("user_id",uid);
    if(e.error)throw e.error;
  }
}
async function setFree(sub:any,reason:string){
  const now=new Date().toISOString();
  const u=await db().from("billing_subscriptions").update({status:"cancelled",metadata:{...(sub.metadata||{}),last_reason:reason},updated_at:now}).eq("id",sub.id);
  if(u.error)throw u.error;
  await clearEntitlementIfNoActive(sub.user_id);
}
async function failEvent(eventId:string,message:string){
  if(!eventId)return;
  try{await db().rpc("fail_billing_webhook",{p_provider:"stripe",p_event_id:eventId,p_error:message});}catch(_){}
}
serve(async req=>{
  if(req.method!=="POST")return new Response("method_not_allowed",{status:405,headers:H});
  const raw=await req.text();
  if(!(await verify(raw,req.headers.get("stripe-signature")||"")))return new Response("invalid_signature",{status:400,headers:H});

  let eventId="";
  try{
    const e=JSON.parse(raw);
    eventId=String(e?.id||"");
    const type=String(e?.type||"");
    const o=e?.data?.object||{};
    if(!eventId||!type)return new Response("invalid_event",{status:400,headers:H});

    const claim=await db().rpc("claim_billing_webhook",{p_provider:"stripe",p_event_id:eventId,p_lease_seconds:300});
    if(claim.error)throw claim.error;
    if(claim.data!==true)return new Response(JSON.stringify({ok:true,duplicate:true}),{status:200,headers:H});

    let subId=String(o?.subscription||o?.id||"");
    let uid=String(o?.metadata?.user_id||o?.client_reference_id||"");
    let subRemote:any=null;

    if(type==="checkout.session.completed"&&subId)subRemote=await stripeGet("/subscriptions/"+encodeURIComponent(subId));
    if((type==="invoice.paid"||type==="invoice.payment_failed")&&o?.subscription)subRemote=await stripeGet("/subscriptions/"+encodeURIComponent(String(o.subscription)));
    if(type.startsWith("customer.subscription."))subRemote=o;
    if(subRemote){
      subId=String(subRemote.id||subId);
      uid=String(subRemote?.metadata?.user_id||uid);
    }
    if(!uid&&subRemote?.metadata?.firebase_uid){
      const bi=await db().from("billing_identities").select("id").eq("provider","firebase").eq("external_subject",String(subRemote.metadata.firebase_uid)).maybeSingle();
      if(bi.error)throw bi.error;
      uid=bi.data?.id?String(bi.data.id):"";
    }

    const sessionId=type.startsWith("checkout.session.")?String(o?.id||""):"";
    let sub=await findSub(uid,subId,sessionId);

    const grantEvent=type==="checkout.session.completed"||type==="invoice.paid"||(type==="customer.subscription.updated"&&["active","trialing"].includes(String(o?.status||"")));
    if(!sub&&grantEvent){
      const remoteMeta={...(subRemote?.metadata||{}),...(o?.metadata||{})};
      if(String(remoteMeta.plan||"")==="premium"&&uid&&subId){
        const grantStatus=type==="customer.subscription.updated"?String(o.status||"active"):"active";
        sub=await createReconciledSub(uid,subId,sessionId,subRemote,remoteMeta,eventId,grantStatus);
      }
    }

    if(!sub){
      if(type==="customer.subscription.deleted"&&uid)await clearEntitlementIfNoActive(uid);
      if(type==="checkout.session.expired"||type==="invoice.payment_failed"||type==="customer.subscription.updated"||type==="customer.subscription.deleted"){
        const done=await db().rpc("complete_billing_webhook",{p_provider:"stripe",p_event_id:eventId});
        if(done.error)throw done.error;
        return new Response(JSON.stringify({ok:true,unlinked:true}),{status:200,headers:H});
      }
      await failEvent(eventId,"billing_subscription_not_found");
      return new Response(JSON.stringify({ok:false,error:"billing_subscription_not_found",retryable:true}),{status:500,headers:H});
    }

    const meta={...(sub.metadata||{}),event_id:eventId};
    const customerId=String(o?.customer||subRemote?.customer||"");
    if(customerId)meta.customer_id=customerId;
    if(subId)meta.provider_subscription_id=subId;
    if(sessionId)meta.checkout_session_id=sessionId;

    if(type==="checkout.session.completed"){
      meta.checkout_completed=true;
      await setPremium({...sub,metadata:meta},subRemote,meta,"active");
    }else if(type==="invoice.paid"){
      await setPremium({...sub,metadata:meta},subRemote,meta,"active");
    }else if(type==="customer.subscription.updated"){
      const status=String(o?.status||"");
      const end=isoFromUnix(o?.current_period_end);
      if(["active","trialing"].includes(status)&&end)await setPremium({...sub,metadata:meta},o,meta,status);
      else{
        const u=await db().from("billing_subscriptions").update({
          external_id:subId||sub.external_id,
          status,
          current_period_start:isoFromUnix(o?.current_period_start)||sub.current_period_start||null,
          current_period_end:end||sub.current_period_end||null,
          cancel_at_period_end:Boolean(o?.cancel_at_period_end??sub.cancel_at_period_end??false),
          metadata:meta,
          updated_at:new Date().toISOString()
        }).eq("id",sub.id);
        if(u.error)throw u.error;
        if(["canceled","unpaid"].includes(status))await clearEntitlementIfNoActive(sub.user_id);
      }
    }else if(type==="invoice.payment_failed"){
      const u=await db().from("billing_subscriptions").update({
        external_id:subId||sub.external_id,
        status:"past_due",
        current_period_end:isoFromUnix(subRemote?.current_period_end)||sub.current_period_end||null,
        metadata:meta,
        updated_at:new Date().toISOString()
      }).eq("id",sub.id);
      if(u.error)throw u.error;
    }else if(type==="customer.subscription.deleted"){
      await setFree({...sub,metadata:meta},"subscription_deleted");
    }else if(type==="checkout.session.expired"){
      if(String(sub.status)==="checkout_pending")await setFree({...sub,metadata:meta},"checkout_expired");
    }

    const done=await db().rpc("complete_billing_webhook",{p_provider:"stripe",p_event_id:eventId});
    if(done.error)throw done.error;
    return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
  }catch(e){
    const detail=String((e as Error)?.message||e);
    console.error("[stripe-webhook]",detail);
    await failEvent(eventId,detail);
    return new Response(JSON.stringify({error:"webhook_processing_failed",detail,retryable:true}),{status:500,headers:H});
  }
});