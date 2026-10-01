import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const db=()=>createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const H={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Methods":"GET,OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type",
  "Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store"
};

function base64Url(bytes:Uint8Array){
  let binary="";
  for(const b of bytes)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}
async function sha256Base64Url(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}
async function manualPremiumGrant(email:string|null){
  if(!email)return false;
  const {data,error}=await db().from("developer_premium_email_grants").select("email").eq("email",email).eq("active",true).maybeSingle();
  if(error)throw error;
  return !!data;
}

serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:H});
  if(req.method!=="GET")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:H});
  try{
    const params=new URL(req.url).searchParams;
    const code=String(params.get("code")||"");
    const verifier=String(params.get("code_verifier")||"");
    const extensionId=String(params.get("extension_id")||"");
    if(!/^[A-Za-z0-9_-]{40,60}$/.test(code))throw new Error("invalid_code");
    if(!/^[A-Za-z0-9_-]{43}$/.test(verifier))throw new Error("invalid_verifier");
    if(!/^[a-p]{32}$/.test(extensionId))throw new Error("invalid_extension_id");

    const codeHash=await sha256Hex(code);
    const challenge=await sha256Base64Url(verifier);
    const sb=db();
    const now=new Date().toISOString();
    const {data:grant,error:grantError}=await sb.from("extension_auth_codes")
      .delete()
      .eq("code_hash",codeHash)
      .eq("code_challenge",challenge)
      .eq("extension_id",extensionId)
      .gt("expires_at",now)
      .select("firebase_uid,email")
      .maybeSingle();
    if(grantError)throw grantError;
    if(!grant)throw new Error("invalid_or_expired_code");

    const email=grant.email?String(grant.email).trim().toLowerCase():null;
    if(await manualPremiumGrant(email)){
      return new Response(JSON.stringify({plan:"premium",premium_expires_at:null}),{status:200,headers:H});
    }

    const {data:identity,error:identityError}=await sb.from("billing_identities")
      .select("id")
      .eq("provider","firebase")
      .eq("external_subject",String(grant.firebase_uid))
      .maybeSingle();
    if(identityError)throw identityError;
    if(!identity?.id)return new Response(JSON.stringify({plan:"free",premium_expires_at:null}),{status:200,headers:H});

    const {data:ent,error:entError}=await sb.from("user_entitlements")
      .select("plan,premium_expires_at")
      .eq("user_id",identity.id)
      .maybeSingle();
    if(entError)throw entError;
    const active=!!ent&&ent.plan==="premium"&&(!ent.premium_expires_at||new Date(ent.premium_expires_at)>new Date());
    return new Response(JSON.stringify({
      plan:active?"premium":"free",
      premium_expires_at:ent?.premium_expires_at||null
    }),{status:200,headers:H});
  }catch(e){
    const msg=String((e as Error)?.message||e);
    const status=["invalid_code","invalid_verifier","invalid_extension_id","invalid_or_expired_code"].includes(msg)?401:500;
    return new Response(JSON.stringify({error:status===500?"extension_access_unavailable":msg}),{status,headers:H});
  }
});
