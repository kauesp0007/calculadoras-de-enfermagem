import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const URL=Deno.env.get("SUPABASE_URL")??"",KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",TOKEN=Deno.env.get("ASAAS_WEBHOOK_TOKEN")??"";
const H={"Content-Type":"application/json"};
const db=()=>createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const addDays=(n:number)=>new Date(Date.now()+n*86400000).toISOString();
serve(async req=>{if(req.method!=="POST")return new Response("method_not_allowed",{status:405,headers:H});if(!TOKEN||req.headers.get("asaas-access-token")!==TOKEN)return new Response("unauthorized",{status:401,headers:H});
 try{
  const e=await req.json(),event=String(e?.event||""),eventId=String(e?.id||"");if(!event||!eventId)return new Response("ignored",{status:200,headers:H});
  const claim=await db().rpc("claim_billing_webhook",{p_provider:"asaas",p_event_id:eventId,p_lease_seconds:300});if(claim.error)throw claim.error;if(claim.data!==true)return new Response(JSON.stringify({ok:true,duplicate:true}),{status:200,headers:H});
  const checkout=e?.checkout||{},payment=e?.payment||{},ref=String(checkout?.externalReference||payment?.externalReference||"");
  if(!ref){await db().rpc("complete_billing_webhook",{p_provider:"asaas",p_event_id:eventId});return new Response(JSON.stringify({ok:true,ignored:true}),{status:200,headers:H});}
  const {data:sub,error:subErr}=await db().from("billing_subscriptions").select("*").eq("provider","asaas").eq("external_id",ref).maybeSingle();if(subErr)throw subErr;if(!sub)throw new Error("billing_intent_not_found");
  const paid=["CHECKOUT_PAID","PAYMENT_CONFIRMED","PAYMENT_RECEIVED"].includes(event);
  const failed=["CHECKOUT_CANCELED","CHECKOUT_EXPIRED","PAYMENT_OVERDUE","PAYMENT_DELETED","PAYMENT_REFUNDED"].includes(event);
  if(paid){
    const expiry=addDays(30);
    const upd=await db().from("billing_subscriptions").update({status:"active",provider_subscription_id:String(payment?.subscription||sub.provider_subscription_id||""),current_period_end:expiry,updated_at:new Date().toISOString(),metadata:{...(sub.metadata||{}),last_event:event,last_event_id:eventId}}).eq("id",sub.id);if(upd.error)throw upd.error;
    const ent=await db().from("user_entitlements").upsert({user_id:sub.user_id,plan:"premium",premium_expires_at:expiry,provider:"asaas",provider_subscription_id:String(payment?.subscription||sub.provider_subscription_id||""),updated_at:new Date().toISOString()},{onConflict:"user_id"});if(ent.error)throw ent.error;
  } else if(failed){
    const upd=await db().from("billing_subscriptions").update({status:"inactive",updated_at:new Date().toISOString(),metadata:{...(sub.metadata||{}),last_event:event,last_event_id:eventId}}).eq("id",sub.id);if(upd.error)throw upd.error;
    if(event==="PAYMENT_REFUNDED"||event==="PAYMENT_DELETED"){const other=await db().from("billing_subscriptions").select("id").eq("user_id",sub.user_id).eq("status","active").limit(1);if(other.error)throw other.error;if(!other.data?.length)await db().from("user_entitlements").update({plan:"free",premium_expires_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("user_id",sub.user_id);}
  }
  await db().rpc("complete_billing_webhook",{p_provider:"asaas",p_event_id:eventId});return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
 }catch(e){console.error(e);return new Response(JSON.stringify({error:"webhook_processing_failed"}),{status:500,headers:H});}});