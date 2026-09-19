import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const ASAAS_API_TOKEN=Deno.env.get("ASAAS_API_TOKEN")??"";
const ASAAS_WEBHOOK_TOKEN=Deno.env.get("ASAAS_WEBHOOK_TOKEN")??"";
const ASAAS_API="https://api.asaas.com/v3";
const SITE="https://www.calculadorasdeenfermagem.com.br";
const PRICE_BRL=10;
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Authorization,apikey,Content-Type","Content-Type":"application/json; charset=utf-8"};
const admin=()=>createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function user(req:Request){const h=req.headers.get("Authorization")||"";if(!h.startsWith("Bearer "))throw new Error("unauthorized");const {data,error}=await admin().auth.getUser(h.slice(7));if(error||!data.user)throw new Error("unauthorized");return data.user;}
async function asaas(path:string,init:RequestInit={}){if(!ASAAS_API_TOKEN)throw new Error("asaas_not_configured");const r=await fetch(ASAAS_API+path,{...init,headers:{access_token:ASAAS_API_TOKEN,"Content-Type":"application/json",...(init.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error("asaas_"+r.status);return d;}
serve(async req=>{if(req.method==="OPTIONS")return new Response("",{status:204,headers});if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});try{
 const u=await user(req);const body=await req.json().catch(()=>({}));const kind=String(body?.kind||"monthly_card");const lang=String(body?.lang||"pt").toLowerCase();if(lang!=="pt"&&lang!=="pt-br")throw new Error("asaas_somente_pt_br");if(!["monthly_card","pix_30d"].includes(kind))throw new Error("tipo_checkout_invalido");
 const {data:ent}=await admin().from("user_entitlements").select("plan,premium_expires_at").eq("user_id",u.id).maybeSingle();if(ent?.plan==="premium"&&(!ent.premium_expires_at||new Date(ent.premium_expires_at)>new Date()))throw new Error("already_premium");
 const ref="premium_"+crypto.randomUUID();const recurring=kind==="monthly_card";
 const payload:any={billingTypes:recurring?["CREDIT_CARD"]:["PIX"],chargeTypes:recurring?["RECURRENT"]:["DETACHED"],minutesToExpire:60,externalReference:ref,callback:{cancelUrl:`${SITE}/conta/assinatura.html?lang=pt&asaas=cancel`,expiredUrl:`${SITE}/conta/assinatura.html?lang=pt&asaas=expired`,successUrl:`${SITE}/conta/assinatura.html?lang=pt&asaas=success`},items:[{externalReference:ref,name:"Premium",description:recurring?"Assinatura Premium mensal":"Acesso Premium por 30 dias",quantity:1,value:PRICE_BRL}],customerData:{name:String(u.user_metadata?.full_name||u.email||"Cliente"),email:String(u.email||"")}};
 if(recurring)payload.subscription={cycle:"MONTHLY"};
 await admin().from("billing_subscriptions").insert({user_id:u.id,provider:"asaas",external_id:ref,status:"checkout_pending",plan:"premium",currency:"BRL",metadata:{kind,lang}});\n const checkout=await asaas("/checkouts",{method:"POST",body:JSON.stringify(payload)});
 return new Response(JSON.stringify({url:String(checkout?.link||`https://asaas.com/checkoutSession/show?id=${encodeURIComponent(String(checkout?.id||""))}`),checkoutId:checkout?.id||null,externalReference:ref}),{status:200,headers});
}catch(e){return new Response(JSON.stringify({error:String((e as Error)?.message||e)}),{status:400,headers});}});
