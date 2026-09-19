import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const STRIPE_SECRET=Deno.env.get("STRIPE_SECRET_KEY")??"";const STRIPE_API="https://api.stripe.com/v1";const SITE="https://www.calculadorasdeenfermagem.com.br";
const INTERNATIONAL=["en","es","fr","de","it","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"];
const EUR=["tr","nl","pl","ru","fr","es","de","it","uk","sv"];
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Authorization,apikey,Content-Type","Content-Type":"application/json; charset=utf-8"};
const admin=()=>createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function stripe(path:string,init:RequestInit={}){const r=await fetch(STRIPE_API+path,{...init,headers:{Authorization:`Bearer ${STRIPE_SECRET}`,"Content-Type":"application/x-www-form-urlencoded",...(init.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error?.message||`stripe_${r.status}`);return d;}
serve(async req=>{if(req.method==="OPTIONS")return new Response("",{status:204,headers});if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});try{
 const h=req.headers.get("Authorization")||"";if(!h.startsWith("Bearer "))throw new Error("unauthorized");const {data,error}=await admin().auth.getUser(h.slice(7));if(error||!data.user)throw new Error("unauthorized");const u=data.user;
 const body=await req.json().catch(()=>({}));const lang=String(body?.lang||"").toLowerCase();if(!INTERNATIONAL.includes(lang))throw new Error("unsupported_international_language");
 const {data:ent}=await admin().from("user_entitlements").select("plan,premium_expires_at").eq("user_id",u.id).maybeSingle();if(ent?.plan==="premium"&&(!ent.premium_expires_at||new Date(ent.premium_expires_at)>new Date()))throw new Error("already_premium");
 const price=EUR.includes(lang)?Deno.env.get("STRIPE_PRICE_EUR"):Deno.env.get("STRIPE_PRICE_USD");if(!price)throw new Error("stripe_price_not_configured");
 const form=new URLSearchParams({mode:"subscription","line_items[0][price]":price,"line_items[0][quantity]":"1",client_reference_id:u.id,"metadata[user_id]":u.id,"metadata[lang]":lang,"metadata[plan]":"premium","subscription_data[metadata][user_id]":u.id,"subscription_data[metadata][lang]":lang,"subscription_data[metadata][plan]":"premium",customer_email:String(u.email||""),locale:"auto",success_url:`${SITE}/conta/assinatura.html?lang=${encodeURIComponent(lang)}&stripe=success`,cancel_url:`${SITE}/conta/assinatura.html?lang=${encodeURIComponent(lang)}&stripe=cancel`});
 const session=await stripe("/checkout/sessions",{method:"POST",body:form});return new Response(JSON.stringify({url:session.url,id:session.id}),{status:200,headers});
}catch(e){return new Response(JSON.stringify({error:String((e as Error)?.message||e)}),{status:400,headers});}});
