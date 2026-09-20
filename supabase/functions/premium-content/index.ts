import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const URL=Deno.env.get("SUPABASE_URL")??"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const PROJECT=Deno.env.get("FIREBASE_PROJECT_ID")??"calculadoras-enfermagem";
const JWKS=createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const ORIGIN="https://www.calculadorasdeenfermagem.com.br";
const db=()=>createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const H={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Authorization,apikey,Content-Type","Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store"};

async function firebaseUid(req:Request){
  const h=req.headers.get("Authorization")||"";
  if(!h.startsWith("Bearer ")) throw new Error("unauthorized");
  const token=h.slice(7).trim();
  const {payload}=await jwtVerify(token,JWKS,{algorithms:["RS256"],issuer:`https://securetoken.google.com/${PROJECT}`,audience:PROJECT});
  const uid=String(payload.sub||"").trim();
  if(!uid) throw new Error("unauthorized");
  return uid;
}

function normalizedPath(value:string){
  const p=decodeURIComponent(value||"").replace(/^\/+/, "").replace(/\\/g,"/");
  if(!p.endsWith(".html")) return "";
  if(p.includes("..")||p.includes("//")||/[\u0000-\u001f]/.test(p)) return "";
  return p;
}

serve(async req=>{
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:H});
  if(req.method!=="GET") return new Response("method_not_allowed",{status:405,headers:H});
  try{
    const path=normalizedPath(new URL(req.url).searchParams.get("path")||"");
    if(!path) return new Response("invalid_path",{status:400,headers:H});
    const uid=await firebaseUid(req);
    const sb=db();
    const bi=await sb.from("billing_identities").select("id").eq("provider","firebase").eq("external_subject",uid).maybeSingle();
    if(bi.error) throw bi.error;
    if(!bi.data?.id) return new Response("forbidden",{status:403,headers:H});
    const ent=await sb.from("user_entitlements").select("plan,premium_expires_at").eq("user_id",bi.data.id).maybeSingle();
    if(ent.error) throw ent.error;
    const premium=ent.data?.plan==="premium" && (!ent.data?.premium_expires_at || new Date(ent.data.premium_expires_at)>new Date());
    if(!premium) return new Response("forbidden",{status:403,headers:H});
    const page=await sb.from("premium_content_pages").select("content").eq("path",path).maybeSingle();
    if(page.error) throw page.error;
    if(!page.data?.content) return new Response("not_found",{status:404,headers:H});
    return new Response(String(page.data.content),{status:200,headers:H});
  }catch(e){
    const msg=String((e as Error)?.message||e);
    const status=msg==="unauthorized"?401:500;
    return new Response(status===401?"unauthorized":"premium_content_unavailable",{status,headers:H});
  }
});