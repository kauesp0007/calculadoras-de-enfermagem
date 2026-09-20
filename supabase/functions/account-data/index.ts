import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SECRET_KEYS=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
const SERVICE_KEY=SECRET_KEYS.default||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const FIREBASE_PROJECT_ID=Deno.env.get("FIREBASE_PROJECT_ID")??"calculadoras-enfermagem";
const JWKS=createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const ORIGIN="https://www.calculadorasdeenfermagem.com.br";
const H={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Methods":"GET,POST,PATCH,PUT,DELETE,OPTIONS","Access-Control-Allow-Headers":"Authorization,apikey,Content-Type","Cache-Control":"private, no-store","Content-Type":"application/json; charset=utf-8"};
const db=()=>createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

async function firebaseUser(req:Request){
  const h=req.headers.get("Authorization")||"";
  if(!h.startsWith("Bearer "))throw new Error("unauthorized");
  const token=h.slice(7).trim();
  const {payload}=await jwtVerify(token,JWKS,{algorithms:["RS256"],issuer:`https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,audience:FIREBASE_PROJECT_ID});
  const uid=String(payload.sub||"").trim();
  if(!uid)throw new Error("unauthorized");
  const fb=payload.firebase;
  return {uid,email:payload.email?String(payload.email):"",displayName:payload.name?String(payload.name):"",photoURL:payload.picture?String(payload.picture):"",provider:fb&&typeof fb==="object"&&"sign_in_provider" in fb?String((fb as Record<string,unknown>).sign_in_provider||"email"):"email"};
}
function profileOut(p:any){return p?{firebase_uid:p.firebase_uid,email:p.email,displayName:p.display_name,photoURL:p.photo_url,provider:p.provider,language:p.language,country:p.country,preferences:p.preferences||{},metadata:p.metadata||{},createdAt:p.created_at,lastLoginAt:p.last_login_at,updatedAt:p.updated_at}:null;}
function cleanProfile(body:any,u:any){
  const p:any={email:u.email};
  if(typeof body?.displayName==="string")p.display_name=body.displayName.trim().slice(0,100);
  if(typeof body?.photoURL==="string")p.photo_url=body.photoURL.trim().slice(0,2000);
  if(typeof body?.language==="string")p.language=body.language.slice(0,10);
  if(typeof body?.country==="string")p.country=body.country.slice(0,10).toUpperCase();
  if(body?.preferences&&typeof body.preferences==="object"&&!Array.isArray(body.preferences))p.preferences=body.preferences;
  if(body?.metadata&&typeof body.metadata==="object"&&!Array.isArray(body.metadata))p.metadata=body.metadata;
  return p;
}
async function ensureProfile(u:any){
  const sb=db();
  const {data,error}=await sb.from("account_profiles").select("*").eq("firebase_uid",u.uid).maybeSingle();
  if(error)throw error;
  if(data){
    const {data:updated,error:ue}=await sb.from("account_profiles").update({email:u.email||data.email||"",last_login_at:new Date().toISOString()}).eq("firebase_uid",u.uid).select("*").single();
    if(ue)throw ue; return updated;
  }
  const {data:created,error:ce}=await sb.from("account_profiles").insert({
    firebase_uid:u.uid,email:u.email||"",display_name:u.displayName||"",photo_url:u.photoURL||"",provider:u.provider||"email",
    language:"pt",country:"BR",preferences:{theme:"light",language:"pt",newsletter:false,cookies:true,fontSize:1,accessibility:false},metadata:{},
    last_login_at:new Date().toISOString()
  }).select("*").single();
  if(ce)throw ce; return created;
}
async function json(req:Request){try{return await req.json();}catch{return{};}}

serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:H});
  try{
    const u=await firebaseUser(req);
    const requestUrl=new URL(req.url);
    const resource=requestUrl.searchParams.get("resource")||"profile";
    const sb=db();

    if(resource==="profile"){
      if(req.method==="GET")return new Response(JSON.stringify({profile:profileOut(await ensureProfile(u))}),{status:200,headers:H});
      if(["POST","PUT","PATCH"].includes(req.method)){
        const body=await json(req),current=await ensureProfile(u),patch=cleanProfile(body,u);
        if(body?.preferences&&typeof body.preferences==="object"&&!Array.isArray(body.preferences))patch.preferences={...(current.preferences||{}),...body.preferences};
        const {data,error}=await sb.from("account_profiles").update(patch).eq("firebase_uid",u.uid).select("*").single();
        if(error)throw error;
        return new Response(JSON.stringify({profile:profileOut(data)}),{status:200,headers:H});
      }
    }

    if(resource==="favorites"){
      if(req.method==="GET"){
        const {data,error}=await sb.from("account_favorites").select("*").eq("firebase_uid",u.uid).order("updated_at",{ascending:false});
        if(error)throw error;
        return new Response(JSON.stringify({items:(data||[]).map((x:any)=>({...x.data,id:x.page_id,pageId:x.page_id,createdAt:x.created_at,updatedAt:x.updated_at}))}),{status:200,headers:H});
      }
      const body=await json(req),pageId=String(body?.pageId||body?.page_id||"").trim().slice(0,300);
      if(!pageId)throw new Error("page_id_required");
      if(["POST","PUT","PATCH"].includes(req.method)){
        const {data,error}=await sb.from("account_favorites").upsert({firebase_uid:u.uid,page_id:pageId,data:{...body,pageId}},{onConflict:"firebase_uid,page_id"}).select("*").single();
        if(error)throw error;
        return new Response(JSON.stringify({item:{...data.data,id:pageId,pageId,createdAt:data.created_at,updatedAt:data.updated_at}}),{status:200,headers:H});
      }
      if(req.method==="DELETE"){
        const {error}=await sb.from("account_favorites").delete().eq("firebase_uid",u.uid).eq("page_id",pageId);
        if(error)throw error;
        return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
      }
    }

    if(resource==="history"){
      if(req.method==="GET"){
        const limit=Math.min(Math.max(Number(requestUrl.searchParams.get("limit")||1000),1),1000);
        const {data,error}=await sb.from("account_history").select("*").eq("firebase_uid",u.uid).order("visited_at",{ascending:false,nullsFirst:false}).limit(limit);
        if(error)throw error;
        return new Response(JSON.stringify({items:(data||[]).map((x:any)=>({...x.data,id:x.id,createdAt:x.created_at}))}),{status:200,headers:H});
      }
      if(req.method==="POST"){
        const body=await json(req),d=body?.visitedAt?new Date(body.visitedAt):null;
        const {data,error}=await sb.from("account_history").insert({firebase_uid:u.uid,data:body,visited_at:d&&!isNaN(d.getTime())?d.toISOString():null}).select("id").single();
        if(error)throw error;
        return new Response(JSON.stringify({id:data.id}),{status:200,headers:H});
      }
      const id=String(requestUrl.searchParams.get("id")||"").trim();
      if(req.method==="PATCH"){
        if(!id)throw new Error("history_id_required");
        const body=await json(req);
        const {data:old,error:oe}=await sb.from("account_history").select("data").eq("firebase_uid",u.uid).eq("id",id).maybeSingle();
        if(oe)throw oe;if(!old)throw new Error("history_not_found");
        const merged={...(old.data||{}),...body};
        const patch:any={data:merged};
        if(merged.visitedAt){const d=new Date(merged.visitedAt);if(!isNaN(d.getTime()))patch.visited_at=d.toISOString();}
        const {error}=await sb.from("account_history").update(patch).eq("firebase_uid",u.uid).eq("id",id);
        if(error)throw error;
        return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
      }
      if(req.method==="DELETE"){
        if(id){const {error}=await sb.from("account_history").delete().eq("firebase_uid",u.uid).eq("id",id);if(error)throw error;}
        else{const {error}=await sb.from("account_history").delete().eq("firebase_uid",u.uid);if(error)throw error;}
        return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
      }
    }
    return new Response(JSON.stringify({error:"not_found"}),{status:404,headers:H});
  }catch(e){
    const msg=String((e as Error)?.message||e),unauthorized=msg==="unauthorized"||msg.includes("JWT");
    return new Response(JSON.stringify({error:unauthorized?"unauthorized":"account_data_unavailable"}),{status:unauthorized?401:500,headers:H});
  }
});