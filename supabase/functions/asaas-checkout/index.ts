import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const ASAAS=Deno.env.get("ASAAS_API_TOKEN")??"";
const FIREBASE_PROJECT_ID=Deno.env.get("FIREBASE_PROJECT_ID")??"calculadoras-enfermagem";
const SITE="https://www.calculadorasdeenfermagem.com.br";
const PRICE_BRL=Number(Deno.env.get("ASAAS_PRICE_BRL")||"0");
const JWKS=createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const H={"Access-Control-Allow-Origin":"https://www.calculadorasdeenfermagem.com.br","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Authorization,apikey,Content-Type","Content-Type":"application/json; charset=utf-8"};
const db=()=>createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

async function firebaseUser(req:Request){
  const h=req.headers.get("Authorization")||"";
  if(!h.startsWith("Bearer "))throw new Error("unauthorized");
  const {payload}=await jwtVerify(h.slice(7).trim(),JWKS,{algorithms:["RS256"],issuer:`https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,audience:FIREBASE_PROJECT_ID});
  const uid=String(payload.sub||"").trim(); if(!uid)throw new Error("unauthorized");
  return {uid,email:payload.email?String(payload.email).trim().toLowerCase():null,name:payload.name?String(payload.name).trim():null};
}
async function identity(u:{uid:string,email:string|null}){
  const {data,error}=await db().from("billing_identities").upsert(
    {provider:"firebase",external_subject:u.uid,email:u.email,updated_at:new Date().toISOString()},
    {onConflict:"provider,external_subject"}
  ).select("id").single();
  if(error||!data)throw new Error("identity_unavailable");
  return String(data.id);
}
async function asaas(path:string,init:RequestInit={}){
  if(!ASAAS)throw new Error("asaas_not_configured");
  const r=await fetch("https://api.asaas.com/v3"+path,{...init,headers:{access_token:ASAAS,"Content-Type":"application/json",...(init.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error("asaas_"+r.status);
  return d;
}
serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:H});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:H});
  try{
    const u=await firebaseUser(req);
    const id=await identity(u);
    const body=await req.json().catch(()=>({}));
    const kind=String(body?.kind||"");
    const lang=String(body?.lang||"").toLowerCase();
    if(lang!=="pt")throw new Error("asaas_somente_pt_br");
    if(kind!=="monthly_card"&&kind!=="pix_30d")throw new Error("tipo_checkout_invalido");
    if(!Number.isFinite(PRICE_BRL)||PRICE_BRL<=0)throw new Error("asaas_price_not_configured");

    const {data:active}=await db().from("user_entitlements").select("plan,premium_expires_at").eq("user_id",id).maybeSingle();
    if(active?.plan==="premium"&&(!active.premium_expires_at||new Date(active.premium_expires_at)>new Date()))throw new Error("already_premium");
    const {data:existing}=await db().from("billing_subscriptions").select("id,status").eq("user_id",id).eq("provider","asaas").in("status",["checkout_pending","active","past_due"]).limit(1);
    if(existing?.length)throw new Error("active_billing_flow");

    const ref="premium_"+crypto.randomUUID();
    const isRecurring=kind==="monthly_card";
    const now=new Date();
    const firstDue=new Date(now.getTime()+24*60*60*1000);
    const pad=(n:number)=>String(n).padStart(2,"0");
    const nextDueDate=`${firstDue.getFullYear()}-${pad(firstDue.getMonth()+1)}-${pad(firstDue.getDate())} ${pad(firstDue.getHours())}:${pad(firstDue.getMinutes())}:${pad(firstDue.getSeconds())}`;
    const ins=await db().from("billing_subscriptions").insert({
      user_id:id,provider:"asaas",external_id:ref,status:"checkout_pending",plan:"premium",currency:"BRL",
      metadata:{kind,lang,external_reference:ref}
    });
    if(ins.error)throw ins.error;

    const payload:any={
      billingTypes:isRecurring?["CREDIT_CARD"]:["PIX"],
      chargeTypes:isRecurring?["RECURRENT"]:["DETACHED"],
      minutesToExpire:60,
      externalReference:ref,
      callback:{
        cancelUrl:`${SITE}/conta/assinatura.html?lang=pt&asaas=cancel`,
        expiredUrl:`${SITE}/conta/assinatura.html?lang=pt&asaas=expired`,
        successUrl:`${SITE}/conta/assinatura.html?lang=pt&asaas=success`
      },
      items:[{name:"Premium",description:isRecurring?"Assinatura Premium mensal":"Acesso Premium por 30 dias",quantity:1,value:PRICE_BRL}],
      customerData:{name:u.name||u.email||"Cliente",email:u.email||""}
    };
    if(isRecurring)payload.subscription={cycle:"MONTHLY",nextDueDate};

    const checkout=await asaas("/checkouts",{method:"POST",body:JSON.stringify(payload)});
    const checkoutId=String(checkout?.id||"");
    if(!checkoutId)throw new Error("checkout_id_missing");
    const checkoutUrl=String(checkout?.link||`https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`);
    const upd=await db().from("billing_subscriptions").update({
      metadata:{kind,lang,external_reference:ref,checkout_id:checkoutId},
      updated_at:new Date().toISOString()
    }).eq("provider","asaas").eq("external_id",ref);
    if(upd.error)throw upd.error;
    return new Response(JSON.stringify({url:checkoutUrl,checkoutId,externalReference:ref}),{status:200,headers:H});
  }catch(e){
    const msg=String((e as Error)?.message||e);
    return new Response(JSON.stringify({error:msg}),{status:400,headers:H});
  }
});