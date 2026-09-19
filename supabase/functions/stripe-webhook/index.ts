import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const URL=Deno.env.get("SUPABASE_URL")??"",KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",SECRET=Deno.env.get("STRIPE_WEBHOOK_SECRET")??"";
const H={"Content-Type":"application/json"},db=()=>createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
function hex(a:ArrayBuffer){return Array.from(new Uint8Array(a)).map(x=>x.toString(16).padStart(2,"0")).join("");}
async function verify(body:string,sig:string){const parts=sig.split(","),t=parts.find(x=>x.startsWith("t="))?.slice(2)||"",v=parts.filter(x=>x.startsWith("v1=")).map(x=>x.slice(3));if(!t||!v.length||Math.abs(Date.now()/1000-Number(t))>300)return false;const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const mac=hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(\`\${t}.\${body}\`)));return v.includes(mac);}
const iso=(sec:any)=>sec?new Date(Number(sec)*1000).toISOString():null;
serve(async req=>{if(req.method!=="POST")return new Response("method_not_allowed",{status:405,headers:H});if(!SECRET)return new Response("not_configured",{status:500,headers:H});const raw=await req.text();if(!(await verify(raw,req.headers.get("stripe-signature")||"")))return new Response("invalid_signature",{status:400,headers:H});
 try{
  const e=JSON.parse(raw),id=String(e?.id||""),type=String(e?.type||""),o=e?.data?.object||{};if(!id||!type)return new Response("invalid_event",{status:400,headers:H});
  const claim=await db().rpc("claim_billing_webhook",{p_provider:"stripe",p_event_id:id,p_lease_seconds:300});if(claim.error)throw claim.error;if(claim.data!==true)return new Response(JSON.stringify({ok:true,duplicate:true}),{status:200,headers:H});
  let uid=String(o?.metadata?.user_id||o?.subscription_details?.metadata?.user_id||o?.client_reference_id||"");let subId=String(o?.subscription||o?.id||"");let end=iso(o?.current_period_end)||iso(o?.lines?.data?.[0]?.period?.end);
  if(!uid){await db().rpc("complete_billing_webhook",{p_provider:"stripe",p_event_id:id});return new Response(JSON.stringify({ok:true,ignored:true}),{status:200,headers:H});}
  if(["checkout.session.completed","invoice.paid","customer.subscription.updated"].includes(type)){
    const status=type==="invoice.paid"?"active":String(o?.status||"active"),currency=String(o?.currency||"").toUpperCase()||null;
    const up=await db().from("billing_subscriptions").upsert({user_id:uid,provider:"stripe",external_id:subId||id,status,plan:"premium",currency,current_period_end:end,metadata:{event_id:id,lang:o?.metadata?.lang||null},updated_at:new Date().toISOString()},{onConflict:"provider,external_id"});if(up.error)throw up.error;
    if(status==="active"||type==="invoice.paid"){const ent=await db().from("user_entitlements").upsert({user_id:uid,plan:"premium",premium_expires_at:end,provider:"stripe",provider_subscription_id:subId,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(ent.error)throw ent.error;}
  } else if(type==="invoice.payment_failed"){
    const up=await db().from("billing_subscriptions").update({status:"past_due",updated_at:new Date().toISOString(),metadata:{event_id:id}}).eq("provider","stripe").eq("external_id",subId);if(up.error)throw up.error;
  } else if(type==="customer.subscription.deleted"){
    const up=await db().from("billing_subscriptions").update({status:"cancelled",updated_at:new Date().toISOString(),metadata:{event_id:id}}).eq("provider","stripe").eq("external_id",subId);if(up.error)throw up.error;
    const ent=await db().from("user_entitlements").update({plan:"free",premium_expires_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("user_id",uid);if(ent.error)throw ent.error;
  }
  await db().rpc("complete_billing_webhook",{p_provider:"stripe",p_event_id:id});return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
 }catch(e){console.error(e);return new Response(JSON.stringify({error:"webhook_processing_failed"}),{status:500,headers:H});}});