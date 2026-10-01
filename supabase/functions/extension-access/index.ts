import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const db=()=>createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

function extensionIdFromOrigin(origin:string){
  const m=origin.match(/^chrome-extension:\/\/([a-p]{32})$/);
  return m?m[1]:"";
}
function headers(origin:string){
  return {
    "Access-Control-Allow-Origin":origin,
    "Access-Control-Allow-Methods":"GET,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Vary":"Origin",
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store"
  };
}
async function sha256(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}
async function manualPremiumGrant(email:string|null){
  if(!email)return false;
  const {data,error}=await db().from("developer_premium_email_grants").select("email").eq("email",email).eq("active",true).maybeSingle();
  if(error)throw error;
  return !!data;
}

serve(async req=>{
  const origin=req.headers.get("Origin")||"";
  const extensionId=extensionIdFromOrigin(origin);
  const H=headers(extensionId?origin:"null");
  if(req.method==="OPTIONS"){
    if(!extensionId)return new Response(null,{status:403,headers:H});
    return new Response(null,{status:204,headers:H});
  }
  if(req.method!=="GET")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:H});
  if(!extensionId)return new Response(JSON.stringify({error:"invalid_extension_origin"}),{status:403,headers:H});
  try{
    const code=String(new URL(req.url).searchParams.get("code")||"");
    if(!/^[A-Za-z0-9_-]{40,60}$/.test(code))throw new Error("invalid_code");
    const codeHash=await sha256(code);
    const sb=db();
    const now=new Date().toISOString();
    const {data:grant,error:grantError}=await sb.from("extension_auth_codes")
      .delete()
      .eq("code_hash",codeHash)
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
    const status=msg==="invalid_code"||msg==="invalid_or_expired_code"?401:500;
    return new Response(JSON.stringify({error:status===500?"extension_access_unavailable":msg}),{status,headers:H});
  }
});
