// Stripe Checkout do Premium Júnior (internacional).
// O usuário é autenticado pelo Firebase; o UID é carregado na sessão e nos metadados.
// Regra canônica: pt-BR usa Asaas; todos os 18 idiomas internacionais usam Stripe.
// Proteções: lock transacional por usuário/provedor + bloqueio de assinaturas existentes.
// IMPORTANTE: esta função é PRODUÇÃO. Nunca deve usar Price de Sandbox como fallback.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_API = "https://api.stripe.com/v1";
const SITE_URL = "https://www.calculadorasdeenfermagem.com.br";
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// Firebase publica certificados x509, mas a Web Crypto API importa diretamente JWK.
// Usamos o endpoint JWK oficial para evitar tentar importar um certificado como SPKI.
const FIREBASE_JWK_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const INTERNATIONAL_LANGS = ["en", "es", "fr", "de", "it", "hi", "zh", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk", "ar"];
const EUR_LANGS = ["tr", "nl", "pl", "ru", "fr", "es", "de", "it", "uk", "sv"];
const PRICE_ID = Deno.env.get("STRIPE_PRICE_ID") ?? "";
const USD_PRICE_ID = Deno.env.get("STRIPE_PRICE_USD") ?? "";
const EUR_PRICE_ID = Deno.env.get("STRIPE_PRICE_EUR") ?? "";

let firebaseJwkCache: Record<string, JsonWebKey> | null = null;
let firebaseJwkCacheAt = 0;
const FIREBASE_JWK_CACHE_MS = 5 * 60 * 1000;

function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type", "Content-Type": "application/json; charset=utf-8" }; }
function b64urlDecode(input:string):Uint8Array{const b64=input.replace(/-/g,"+").replace(/_/g,"/");const padded=b64+"=".repeat((4-(b64.length%4))%4);const bin=atob(padded);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes;}
async function loadFirebaseJwks(forceRefresh=false):Promise<Record<string, JsonWebKey>>{
  const now=Date.now();
  if(!forceRefresh&&firebaseJwkCache&&now-firebaseJwkCacheAt<FIREBASE_JWK_CACHE_MS)return firebaseJwkCache;
  const response=await fetch(FIREBASE_JWK_URL,{headers:{"Accept":"application/json"}});
  if(!response.ok)throw new Error("google_keys_unavailable");
  const payload=await response.json();
  const keys=Array.isArray(payload?.keys)?payload.keys:[];
  const map:Record<string,JsonWebKey>={};
  for(const key of keys){if(key?.kid)map[String(key.kid)]=key as JsonWebKey;}
  if(Object.keys(map).length===0)throw new Error("google_keys_empty");
  firebaseJwkCache=map;
  firebaseJwkCacheAt=now;
  return map;
}
async function getFirebaseCryptoKey(kid:string):Promise<CryptoKey>{
  let keys=await loadFirebaseJwks(false);
  let jwk=keys[kid];
  if(!jwk){keys=await loadFirebaseJwks(true);jwk=keys[kid];}
  if(!jwk)throw new Error("unknown_key_id");
  return crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
}
async function verifyFirebaseToken(idToken:string):Promise<{uid:string;email:string;name:string}>{const parts=idToken.split(".");if(parts.length!==3)throw new Error("invalid_token");const[h,p,s]=parts;let header:any,payload:any;try{header=JSON.parse(new TextDecoder().decode(b64urlDecode(h)));payload=JSON.parse(new TextDecoder().decode(b64urlDecode(p)));}catch{throw new Error("invalid_token");}if(header.alg!=="RS256"||!header.kid)throw new Error("invalid_token");const now=Math.floor(Date.now()/1000);if(Number(payload.exp||0)<=now)throw new Error("token_expired");if(Number(payload.iat||0)>now+60)throw new Error("token_not_yet_valid");if(Number(payload.auth_time||0)>now+60)throw new Error("auth_time_invalid");if(payload.aud!==FIREBASE_PROJECT_ID)throw new Error("invalid_audience");if(payload.iss!==`https://securetoken.google.com/${FIREBASE_PROJECT_ID}`)throw new Error("invalid_issuer");const key=await getFirebaseCryptoKey(String(header.kid));const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,b64urlDecode(s),new TextEncoder().encode(`${h}.${p}`));if(!valid)throw new Error("invalid_signature");const uid=String(payload.sub||"");const email=String(payload.email||"").trim().toLowerCase();const name=String(payload.name||"").trim();if(!uid||!email)throw new Error("user_email_missing");return{uid,email,name};}
function normalizeLanguage(value:unknown):string{return String(value||"").trim().toLowerCase();}
function isSupportedInternational(lang:string):boolean{return INTERNATIONAL_LANGS.indexOf(lang)!==-1;}
function selectedPriceId(lang:string):string{if(USD_PRICE_ID&&EUR_PRICE_ID)return EUR_LANGS.indexOf(lang)!==-1?EUR_PRICE_ID:USD_PRICE_ID;return PRICE_ID;}
async function claimCheckout(uid:string):Promise<boolean>{if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)throw new Error("checkout_lock_not_configured");const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_billing_checkout`,{method:"POST",headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({p_provider:"stripe",p_user_id:uid,p_lease_seconds:1800})});const d=await r.json().catch(()=>null);if(!r.ok)throw new Error(`checkout_lock_failed:${r.status}`);return d===true||d==="true"||(Array.isArray(d)&&d[0]===true);}
async function completeCheckout(uid:string):Promise<void>{const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/complete_billing_checkout`,{method:"POST",headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({p_provider:"stripe",p_user_id:uid})});if(!r.ok)throw new Error(`checkout_complete_failed:${r.status}`);}
async function releaseCheckout(uid:string,message:string):Promise<void>{try{await fetch(`${SUPABASE_URL}/rest/v1/rpc/release_billing_checkout`,{method:"POST",headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({p_provider:"stripe",p_user_id:uid,p_error:message.slice(0,2000)})});}catch(_){} }
async function stripeGet(path:string):Promise<any>{const r=await fetch(`${STRIPE_API}${path}`,{headers:{Authorization:`Bearer ${STRIPE_SECRET_KEY}`}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`stripe_api_${r.status}`);return d;}
async function hasExistingSubscription(email:string):Promise<boolean>{const customers=await stripeGet(`/customers?email=${encodeURIComponent(email)}&limit=20`);for(const customer of (customers?.data||[])){const subs=await stripeGet(`/subscriptions?customer=${encodeURIComponent(String(customer.id))}&status=all&limit=100`);for(const sub of (subs?.data||[])){const status=String(sub?.status||"");if(["active","trialing","past_due","unpaid","incomplete"].indexOf(status)!==-1)return true;}}return false;}

serve(async(req)=>{if(req.method==="OPTIONS")return new Response("",{status:204,headers:corsHeaders()});if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:corsHeaders()});if(!STRIPE_SECRET_KEY)return new Response(JSON.stringify({error:"not_configured"}),{status:500,headers:corsHeaders()});let uidForLock="";let claimHeld=false;try{const body=await req.json();const uid=String(body?.uid||"");const lang=normalizeLanguage(body?.lang);if(!uid)return new Response(JSON.stringify({error:"missing_uid"}),{status:400,headers:corsHeaders()});if(!isSupportedInternational(lang))return new Response(JSON.stringify({error:"unsupported_international_language"}),{status:400,headers:corsHeaders()});const authHeader=req.headers.get("Authorization")||"";const idToken=authHeader.startsWith("Bearer ")?authHeader.slice(7):"";const user=idToken?await verifyFirebaseToken(idToken):null;if(!user||user.uid!==uid)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:corsHeaders()});uidForLock=uid;claimHeld=await claimCheckout(uid);if(!claimHeld)return new Response(JSON.stringify({error:"checkout_already_in_progress"}),{status:409,headers:corsHeaders()});if(await hasExistingSubscription(user.email)){await releaseCheckout(uid,"existing_subscription");claimHeld=false;return new Response(JSON.stringify({error:"already_subscribed"}),{status:409,headers:corsHeaders()});}const priceId=selectedPriceId(lang);if(!priceId)throw new Error("stripe_price_not_configured");const successUrl=`${SITE_URL}/conta/assinatura.html?lang=${encodeURIComponent(lang)}&stripe=success`;const cancelUrl=`${SITE_URL}/conta/assinatura.html?lang=${encodeURIComponent(lang)}&stripe=cancel`;const form=new URLSearchParams({mode:"subscription","line_items[0][price]":priceId,"line_items[0][quantity]":"1",client_reference_id:uid,"metadata[uid]":uid,"metadata[lang]":lang,"metadata[payment_provider]":"stripe","subscription_data[metadata][uid]":uid,"subscription_data[metadata][lang]":lang,"subscription_data[metadata][payment_provider]":"stripe",customer_email:user.email,locale:"auto",success_url:successUrl,cancel_url:cancelUrl});const res=await fetch(`${STRIPE_API}/checkout/sessions`,{method:"POST",headers:{Authorization:`Bearer ${STRIPE_SECRET_KEY}`,"Content-Type":"application/x-www-form-urlencoded"},body:form});const session=await res.json();if(!res.ok||!session.url)throw new Error(session?.error?.message||"checkout_creation_failed");await completeCheckout(uid);claimHeld=false;return new Response(JSON.stringify({url:session.url}),{status:200,headers:corsHeaders()});}catch(err){const message=String((err as Error)?.message||err);if(claimHeld&&uidForLock)await releaseCheckout(uidForLock,message);console.error("[stripe-checkout]",err);return new Response(JSON.stringify({error:message}),{status:500,headers:corsHeaders()});}});