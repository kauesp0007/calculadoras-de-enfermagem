import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const URL=Deno.env.get("SUPABASE_URL")??"";const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";const TOKEN=Deno.env.get("ASAAS_WEBHOOK_TOKEN")??"";const H={"Content-Type":"application/json"};
const db=()=>createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
function days(n:number){return new Date(Date.now()+n*86400000).toISOString();}
serve(async req=>{if(req.method!=="POST")return new Response("method_not_allowed",{status:405,headers:H});if(!TOKEN||req.headers.get("asaas-access-token")!==TOKEN)return new Response("unauthorized",{status:401,headers:H});
 try{const e=await req.json();const event=String(e?.event||"");const payment=e?.payment||{};const ref=String(payment?.externalReference||"");const paymentId=String(payment?.id||"");if(!event||!paymentId)return new Response("ignored",{status:200,headers:H});
 const claimed=await db().rpc("claim_billing_webhook",{p_provider:"asaas",p_event_id:paymentId,p_lease_seconds:300});if(claimed.error)throw claimed.error;if(claimed.data!==true)return new Response(JSON.stringify({ok:true,duplicate:true}),{status:200,headers:H});
 const {data:sub}=ref?await db().from("billing_subscriptions").select("*").eq("provider","asaas").eq("external_id",ref).maybeSingle():{data:null};
 if(!sub)throw new Error("billing_intent_not_found");
 const paid=["PAYMENT_CONFIRMED","PAYMENT_RECEIVED"].includes(event);
 const failed=["PAYMENT_OVERDUE","PAYMENT_DELETED","PAYMENT_REFUNDED"].includes(event);
 if(paid){const expiry=days(30);await db().from("billing_subscriptions").update({status:"active",provider_subscription_id:String(payment?.subscription||sub.provider_subscription_id||""),current_period_end:expiry,updated_at:new Date().toISOString(),metadata:{...(sub.metadata||{}),last_payment_id:paymentId,last_event:event}}).eq("id",sub.id);await db().from("user_entitlements").upsert({user_id:sub.user_id,plan:"premium",premium_expires_at:expiry,provider:"asaas",provider_subscription_id:String(payment?.subscription||sub.provider_subscription_id||""),updated_at:new Date().toISOString()},{onConflict:"user_id"});}
 if(failed){await db().from("billing_subscriptions").update({status:"inactive",updated_at:new Date().toISOString(),metadata:{...(sub.metadata||{}),last_payment_id:paymentId,last_event:event}}).eq("id",sub.id);const {data:other}=await db().from("billing_subscriptions").select("id").eq("user_id",sub.user_id).eq("status","active").limit(1);if(!other?.length)await db().from("user_entitlements").update({plan:"free",premium_expires_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("user_id",sub.user_id);}
 await db().rpc("complete_billing_webhook",{p_provider:"asaas",p_event_id:paymentId});return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
 }catch(e){console.error(e);return new Response(JSON.stringify({error:String((e as Error)?.message||e)}),{status:500,headers:H});}});
