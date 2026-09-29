import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const FIREBASE_PROJECT_ID=Deno.env.get("FIREBASE_PROJECT_ID")??"calculadoras-enfermagem";
const JWKS=createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const db=()=>createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const H={"Access-Control-Allow-Origin":"https://www.calculadorasdeenfermagem.com.br","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Authorization,apikey,Content-Type","Cache-Control":"private, no-store","Content-Type":"text/html; charset=utf-8"};

function normalizePath(path:string){
  let p=String(path||"").trim().replace(/\\/g,"/");
  p=p.replace(/\/+/g,"/");
  if(!p.startsWith("/")) p="/"+p;
  if(p.length>1&&p.endsWith("/")) p=p.slice(0,-1);
  return p;
}
function publicPathToKey(path:string){
  const p=normalizePath(path);
  return p.slice(1);
}
function keyCandidates(key:string){
  const parts=key.split("/").filter(Boolean);
  const langs=new Set(["en","es","fr","it","de","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"]);
  const candidates=[key];
  if(parts.length>1&&langs.has(parts[0])) candidates.push(parts.slice(1).join("/"));
  return [...new Set(candidates)];
}
async function firebaseUser(req:Request){
  const h=req.headers.get("Authorization")||"";
  if(!h.startsWith("Bearer ")) throw new Error("unauthorized");
  const token=h.slice(7).trim();
  const {payload}=await jwtVerify(token,JWKS,{algorithms:["RS256"],issuer:`https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,audience:FIREBASE_PROJECT_ID});
  const uid=String(payload.sub||"").trim();
  if(!uid) throw new Error("unauthorized");
  return {uid,email:payload.email?String(payload.email).trim().toLowerCase():null};
}
async function manualPremiumGrant(email:string|null){
  if(!email) return false;
  const {data,error}=await db().from("developer_premium_email_grants").select("email").eq("email",email).eq("active",true).maybeSingle();
  if(error) throw error;
  return !!data;
}
async function premiumForUser(user:{uid:string,email:string|null}){
  if(await manualPremiumGrant(user.email)) return true;
  const sb=db();
  const {data:identity,error:ierr}=await sb.from("billing_identities").select("id").eq("provider","firebase").eq("external_subject",user.uid).maybeSingle();
  if(ierr) throw ierr;
  if(!identity) return false;
  const {data:ent,error:eerr}=await sb.from("user_entitlements").select("plan,premium_expires_at").eq("user_id",identity.id).maybeSingle();
  if(eerr) throw eerr;
  return !!ent && ent.plan==="premium" && (!ent.premium_expires_at || new Date(ent.premium_expires_at)>new Date());
}
async function premiumRequiredForKey(key:string){
  const candidates=keyCandidates(key);
  const {data,error}=await db().from("developer_premium_route_rules").select("path,premium_required").in("path",candidates);
  if(error) throw error;
  const byPath=new Map((data||[]).map((row:any)=>[String(row.path),row]));
  const selected=candidates.map(candidate=>byPath.get(candidate)).find(Boolean);
  if(selected) return !!selected.premium_required;
  return true;
}
async function privateContentForKey(key:string){
  const sb=db();
  for(const candidate of keyCandidates(key)){
    const result=await sb.from("premium_content_pages").select("content,source_sha").eq("path",candidate).maybeSingle();
    if(result.error) throw result.error;
    if(result.data) return result.data;
  }
  return null;
}
serve(async req=>{
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:H});
  if(req.method!=="GET") return new Response("Method Not Allowed",{status:405,headers:H});
  try{
    const url=new URL(req.url);
    const key=publicPathToKey(url.searchParams.get("path")||"");
    if(!key || key.includes("..") || key.startsWith("conta/") || !key.endsWith(".html"))
      return new Response("Not Found",{status:404,headers:H});
    const data=await privateContentForKey(key);
    if(!data) return new Response("Premium content unavailable",{status:404,headers:H});
    if(await premiumRequiredForKey(key)){
      const user=await firebaseUser(req);
      if(!(await premiumForUser(user))) return new Response("Premium required",{status:403,headers:H});
    }

    return new Response(data.content,{status:200,headers:{
      ...H,
      "Cache-Control":"private, no-store, max-age=0",
      "ETag":`"${data.source_sha||key}"`,
      "Vary":"Authorization"
    }});
  }catch(e){
    const msg=String((e as Error)?.message||e);
    const status=msg==="unauthorized"?401:500;
    return new Response(status===401?"Unauthorized":"Premium content unavailable",{status,headers:H});
  }
});
