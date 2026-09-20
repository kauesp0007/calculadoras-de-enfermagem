import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const FIREBASE_PROJECT_ID=Deno.env.get("FIREBASE_PROJECT_ID")??"calculadoras-enfermagem";
const JWKS=createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const db=()=>createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const H={"Access-Control-Allow-Origin":"https://www.calculadorasdeenfermagem.com.br","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Authorization,apikey,Content-Type","Content-Type":"application/json; charset=utf-8"};

async function firebaseUser(req:Request){
 const h=req.headers.get("Authorization")||"";
 if(!h.startsWith("Bearer ")) throw new Error("unauthorized");
 const token=h.slice(7).trim();
 const {payload}=await jwtVerify(token,JWKS,{algorithms:["RS256"],issuer:`https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,audience:FIREBASE_PROJECT_ID});
 const uid=String(payload.sub||"").trim(); if(!uid) throw new Error("unauthorized");
 return {uid,email:payload.email?String(payload.email):null};
}
async function identity(uid:string){
 const sb=db();
 const {data,error}=await sb.from("billing_identities").select("id").eq("provider","firebase").eq("external_subject",uid).maybeSingle();
 if(error) throw new Error("identity_unavailable");
 return data?.id ? String(data.id) : null;
}
serve(async req=>{
 if(req.method==="OPTIONS") return new Response(null,{status:204,headers:H});
 if(req.method!=="GET") return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:H});
 try{
  const u=await firebaseUser(req); const identityId=await identity(u.uid); const sb=db();
  // A consulta de acesso é estritamente somente-leitura. Identidade/entitlement
  // só podem ser criados ou alterados por checkout/webhooks administrativos.
  if(!identityId) return new Response(JSON.stringify({plan:"free",premium_expires_at:null}),{status:200,headers:H});
  const {data:ent,error}=await sb.from("user_entitlements").select("plan,premium_expires_at,provider,provider_customer_id,provider_subscription_id").eq("user_id",identityId).maybeSingle();
  if(error) throw error;
  const active=ent.plan==="premium" && (!ent.premium_expires_at || new Date(ent.premium_expires_at)>new Date());
  return new Response(JSON.stringify({plan:active?"premium":"free",premium_expires_at:ent.premium_expires_at||null,provider:active?ent.provider:null,provider_customer_id:active?ent.provider_customer_id:null,provider_subscription_id:active?ent.provider_subscription_id:null}),{status:200,headers:H});
 }catch(e){const msg=String((e as Error)?.message||e);return new Response(JSON.stringify({error:msg==="unauthorized"?"unauthorized":"billing_access_unavailable"}),{status:msg==="unauthorized"?401:500,headers:H});}
});