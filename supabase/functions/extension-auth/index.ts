import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const FIREBASE_PROJECT_ID=Deno.env.get("FIREBASE_PROJECT_ID")??"calculadoras-enfermagem";
const JWKS=createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const SITE_ORIGINS=new Set([
  "https://www.calculadorasdeenfermagem.com.br",
  "https://calculadorasdeenfermagem.com.br"
]);
const db=()=>createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

function headers(origin:string){
  return {
    "Access-Control-Allow-Origin":SITE_ORIGINS.has(origin)?origin:"https://www.calculadorasdeenfermagem.com.br",
    "Access-Control-Allow-Methods":"POST,OPTIONS",
    "Access-Control-Allow-Headers":"Authorization,Content-Type",
    "Vary":"Origin",
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store"
  };
}

async function firebaseUser(req:Request){
  const h=req.headers.get("Authorization")||"";
  if(!h.startsWith("Bearer "))throw new Error("unauthorized");
  const {payload}=await jwtVerify(h.slice(7).trim(),JWKS,{
    algorithms:["RS256"],
    issuer:`https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience:FIREBASE_PROJECT_ID
  });
  const uid=String(payload.sub||"").trim();
  if(!uid)throw new Error("unauthorized");
  return {uid,email:payload.email?String(payload.email).trim().toLowerCase():null};
}

function extensionIdFromRedirect(value:string){
  const u=new URL(value);
  const m=u.hostname.match(/^([a-p]{32})\.chromiumapp\.org$/);
  if(u.protocol!=="https:"||!m||u.pathname!=="/gasometria-auth"||u.search||u.hash)throw new Error("invalid_redirect_uri");
  return m[1];
}

function randomCode(){
  const bytes=new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary="";
  for(const b of bytes)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}

serve(async req=>{
  const origin=req.headers.get("Origin")||"";
  const H=headers(origin);
  if(req.method==="OPTIONS"){
    if(!SITE_ORIGINS.has(origin))return new Response(null,{status:403,headers:H});
    return new Response(null,{status:204,headers:H});
  }
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:H});
  try{
    if(!SITE_ORIGINS.has(origin))throw new Error("invalid_origin");
    const user=await firebaseUser(req);
    const body=await req.json().catch(()=>({}));
    const redirectUri=String(body?.redirect_uri||"");
    const codeChallenge=String(body?.code_challenge||"");
    const codeChallengeMethod=String(body?.code_challenge_method||"");
    if(!/^[A-Za-z0-9_-]{43}$/.test(codeChallenge)||codeChallengeMethod!=="S256")throw new Error("invalid_code_challenge");
    const extensionId=extensionIdFromRedirect(redirectUri);
    const code=randomCode();
    const codeHash=await sha256Hex(code);
    const expiresAt=new Date(Date.now()+2*60*1000).toISOString();
    const sb=db();
    await sb.from("extension_auth_codes").delete().lt("expires_at",new Date().toISOString());
    const {error}=await sb.from("extension_auth_codes").insert({
      code_hash:codeHash,
      code_challenge:codeChallenge,
      firebase_uid:user.uid,
      email:user.email,
      extension_id:extensionId,
      expires_at:expiresAt
    });
    if(error)throw error;
    return new Response(JSON.stringify({code,expires_in:120}),{status:200,headers:H});
  }catch(e){
    const msg=String((e as Error)?.message||e);
    const status=msg==="unauthorized"?401:
      ["invalid_origin","invalid_redirect_uri","invalid_code_challenge"].includes(msg)?400:500;
    return new Response(JSON.stringify({error:status===500?"extension_auth_unavailable":msg}),{status,headers:H});
  }
});
