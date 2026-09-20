import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL=Deno.env.get("SUPABASE_URL")??"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const SECRET=Deno.env.get("STRIPE_WEBHOOK_SECRET")??"";
const STRIPE=Deno.env.get("STRIPE_SECRET_KEY")??"";
const H={"Content-Type":"application/json; charset=utf-8"};
const db=()=>createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});

function hex(a:ArrayBuffer){return Array.from(new Uint8Array(a)).map(x=>x.toString(16).padStart(2,"0")).join("");}
async function verify(body:string,sig:string){
  const parts=sig.split(",");const t=parts.find(x=>x.startsWith("t="))?.slice(2)||"";const v=parts.filter(x=>x.startsWith("v1=")).map(x=>x.slice(3));
  if(!SECRET||!t||!v.length||Math.abs(Date.now()/1000-Number(t))>300)return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const mac=hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(`${t}.${body}`)));
  return v.includes(mac);
}
async function stripeGet(path:string){
  if(!STRIPE)throw new Error("stripe_not_configured");
  const r=await fetch("https://api.stripe.com/v1"+path,{headers:{Authorization:`Bearer ${STRIPE}`}});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error("stripe_"+r.status);return d;
}
async function findSub(uid:string,subId:string,sessionId:string){
  if(subId){
    const a=await db().from("billing_subscriptions").select("*").eq("provider","stripe").eq("external_id",subId).maybeSingle();
    if(a.error)throw a.error;if(a.data)return a.data;
  }
  if(sessionId){
    const a=await db().from("billing_subscriptions").select("*").eq("provider","stripe").eq("metadata->>checkout_session_id",sessionId).maybeSingle();
    if(a.error)throw a.error;if(a.data)return a.data;
  }
  if(uid){
    const a=await db().from("billing_subscriptions").select("*").eq("provider","stripe").eq("user_id",uid).in("status",["checkout_pending","active","past_due"]).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(a.error)throw a.error;if(a.data)return a.data;
  }
  return null;
}
async function setPremium(sub:any,expires:string,meta:any,status="active"){
  const now=new Date().toISOString();
  const metadata={...(sub.metadata||{}),...(meta||{})};
  const u=await db().from("billing_subscriptions").update({status,current_period_end:expires,metadata,updated_at:now}).eq("id",sub.id);
  if(u.error)throw u.error;
  const e=await db().from("user_entitlements").upsert({
    user_id:sub.user_id,plan:"premium",premium_expires_at:expires,provider:"stripe",
    provider_customer_id:metadata.customer_id||null,provider_subscription_id:metadata.provider_subscription_id||null,updated_at:now
  },{onConflict:"user_id"});
  if(e.error)throw e.error;
}
async function setFree(sub:any,reason:string){
  const now=new Date().toISOString();
  const u=await db().from("billing_subscriptions").update({status:"cancelled",metadata:{...(sub.metadata||{}),last_reason:reason},updated_at:now}).eq("id",sub.id);
  if(u.error)throw u.error;
  const {data:other,error}=await db().from("billing_subscriptions").select("id").eq("user_id",sub.user_id).neq("id",sub.id).in("status",["active","past_due"]).gt("current_period_end",now).limit(1);
  if(error)throw error;
  if(!other?.length){
    const e=await db().from("user_entitlements").update({plan:"free",premium_expires_at:now,updated_at:now}).eq("user_id",sub.user_id);
    if(e.error)throw e.error;
  }
}
serve(async req=>{
  if(req.method!=="POST")return new Response("method_not_allowed",{status:405,headers:H});
  const raw=await req.text();if(!(await verify(raw,req.headers.get("stripe-signature")||"")))return new Response("invalid_signature",{status:400,headers:H});
  try{
    const e=JSON.parse(raw),eventId=String(e?.id||""),type=String(e?.type||""),o=e?.data?.object||{};
    if(!eventId||!type)return new Response("invalid_event",{status:400,headers:H});
    const claim=await db().rpc("claim_billing_webhook",{p_provider:"stripe",p_event_id:eventId,p_lease_seconds:300});
    if(claim.error)throw claim.error;if(claim.data!==true)return new Response(JSON.stringify({ok:true,duplicate:true}),{status:200,headers:H});

    let subId=String(o?.subscription||o?.id||"");
    let uid=String(o?.metadata?.user_id||o?.client_reference_id||"");
    let subRemote:any=null;
    if(type==="checkout.session.completed"&&subId)subRemote=await stripeGet(`/subscriptions/${encodeURIComponent(subId)}`);
    if((type==="invoice.paid"||type==="invoice.payment_failed")&&o?.subscription)subRemote=await stripeGet(`/subscriptions/${encodeURIComponent(String(o.subscription))}`);
    if(type.startsWith("customer.subscription.") )subRemote=o;
    if(subRemote){
      subId=String(subRemote.id||subId);
      uid=String(subRemote?.metadata?.user_id||uid);
    }
    const sessionId=type.startsWith("checkout.session.")?String(o?.id||""):"";
    if(!uid&&subRemote?.metadata?.firebase_uid){
      const bi=await db().from("billing_identities").select("id").eq("provider","firebase").eq("external_subject",String(subRemote.metadata.firebase_uid)).maybeSingle();
      if(bi.error)throw bi.error;uid=bi.data?.id?String(bi.data.id):"";
    }
    const sub=await findSub(uid,subId,sessionId);
    if(!sub){
      await db().rpc("fail_billing_webhook",{p_provider:"stripe",p_event_id:eventId,p_error:"billing_subscription_not_found"});
      return new Response(JSON.stringify({ok:true,ignored:true}),{status:200,headers:H});
    }

    const meta={...(sub.metadata||{}),event_id:eventId};
    const customerId=String(o?.customer||subRemote?.customer||"");if(customerId)meta.customer_id=customerId;
    if(subId)meta.provider_subscription_id=subId;

    if(type==="checkout.session.completed"){
      const end= subRemote?.current_period_end ? new Date(Number(subRemote.current_period_end)*1000).toISOString() : new Date(Date.now()+30*86400000).toISOString();
      meta.checkout_completed=true;
      await setPremium({...sub,metadata:meta},end,meta,"active");
    }else if(type==="invoice.paid"){
      const end=subRemote?.current_period_end?new Date(Number(subRemote.current_period_end)*1000).toISOString():new Date(Date.now()+30*86400000).toISOString();
      await setPremium({...sub,metadata:meta},end,meta,"active");
    }else if(type==="customer.subscription.updated"){
      const status=String(o?.status||"");
      const end=o?.current_period_end?new Date(Number(o.current_period_end)*1000).toISOString():null;
      if(["active","trialing"].includes(status)&&end)await setPremium({...sub,metadata:meta},end,meta,status);
      else if(["canceled","unpaid"].includes(status)){
        const u=await db().from("billing_subscriptions").update({status,metadata:meta,updated_at:new Date().toISOString()}).eq("id",sub.id);if(u.error)throw u.error;
      }
      else{
        const u=await db().from("billing_subscriptions").update({status,metadata:meta,updated_at:new Date().toISOString()}).eq("id",sub.id);if(u.error)throw u.error;
      }
    }else if(type==="invoice.payment_failed"){
      const u=await db().from("billing_subscriptions").update({status:"past_due",metadata:meta,updated_at:new Date().toISOString()}).eq("id",sub.id);if(u.error)throw u.error;
      // Preserve already-paid access until its recorded period end; do not grant or extend.
    }else if(type==="customer.subscription.deleted"){
      await setFree({...sub,metadata:meta},"subscription_deleted");
    }else if(type==="checkout.session.expired"){
      if(String(sub.status)==="checkout_pending")await setFree({...sub,metadata:meta},"checkout_expired");
    }
    const done=await db().rpc("complete_billing_webhook",{p_provider:"stripe",p_event_id:eventId});if(done.error)throw done.error;
    return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
  }catch(e){
    console.error("[stripe-webhook]",e);
    return new Response(JSON.stringify({error:"webhook_processing_failed"}),{status:500,headers:H});
  }
});