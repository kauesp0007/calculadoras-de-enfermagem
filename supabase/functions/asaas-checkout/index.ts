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
function trace(event:string,data:Record<string,unknown>={}){
  console.info("[billing-event]",JSON.stringify({
    flow:"subscription",
    provider:"asaas",
    event,
    at:new Date().toISOString(),
    ...data
  }));
}

/* ASAAS_CHECKOUT_STATE_START */
const CHECKOUT_TTL_MINUTES=60;
const CHECKOUT_TTL_MS=CHECKOUT_TTL_MINUTES*60*1000;
const PENDING_WITHOUT_ID_GRACE_MS=5*60*1000;
function checkoutExpiresAtMs(createdAt,metadata={}){
  const explicit=Date.parse(String(metadata?.checkout_expires_at||""));
  if(Number.isFinite(explicit))return explicit;
  const created=Date.parse(String(createdAt||metadata?.checkout_created_at||""));
  return Number.isFinite(created)?created+CHECKOUT_TTL_MS:NaN;
}
function isCheckoutExpired(createdAt,metadata={},nowMs=Date.now()){
  const expiresAt=checkoutExpiresAtMs(createdAt,metadata);
  return !Number.isFinite(expiresAt)||nowMs>=expiresAt;
}
function checkoutUrlFor(metadata={},checkoutId=""){
  const stored=String(metadata?.checkout_url||"").trim();
  const fallback=checkoutId
    ? `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`
    : "";
  const value=stored||fallback;
  return /^https:\/\/(?:www\.)?asaas\.com\//i.test(value)?value:"";
}
/* ASAAS_CHECKOUT_STATE_END */

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
async function portalEnabled(){
  const {data,error}=await db().from("developer_settings").select("value").eq("key","asaas_portal_enabled").maybeSingle();
  if(error)throw error;
  const value=data?.value as {enabled?: boolean}|undefined;
  return value?.enabled!==false;
}
async function asaas(path:string,init:RequestInit={}){
  if(!ASAAS)throw new Error("asaas_not_configured");
  const r=await fetch("https://api.asaas.com/v3"+path,{...init,headers:{access_token:ASAAS,"Content-Type":"application/json",...(init.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){
    const details=Array.isArray(d?.errors)
      ? d.errors.map((x:any)=>String(x?.code||"error")+":"+String(x?.description||"")).join(" | ")
      : "";
    throw new Error("asaas_"+r.status+(details?"_"+details:""));
  }
  return d;
}
serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:H});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:H});
  let ref="";
  let checkoutId="";
  let attemptKind="";
  let attemptLang="";
  try{
    const u=await firebaseUser(req);
    if(!await portalEnabled())throw new Error("asaas_portal_disabled");
    const id=await identity(u);
    const body=await req.json().catch(()=>({}));
    const kind=String(body?.kind||"");
    const lang=String(body?.lang||"").toLowerCase();
    attemptKind=kind;
    attemptLang=lang;
    if(lang!=="pt")throw new Error("asaas_somente_pt_br");
    if(kind!=="monthly_card"&&kind!=="pix_30d")throw new Error("tipo_checkout_invalido");
    if(!Number.isFinite(PRICE_BRL)||PRICE_BRL<=0)throw new Error("asaas_price_not_configured");

    const {data:active}=await db().from("user_entitlements").select("plan,premium_expires_at").eq("user_id",id).maybeSingle();
    if(active?.plan==="premium"&&(!active.premium_expires_at||new Date(active.premium_expires_at)>new Date()))throw new Error("already_premium");

    const {data:existing,error:existingError}=await db().from("billing_subscriptions")
      .select("id,status,provider,external_id,metadata,created_at")
      .eq("user_id",id)
      .in("status",["checkout_pending","active","past_due"])
      .order("created_at",{ascending:false})
      .limit(1);
    if(existingError)throw existingError;

    if(existing?.length){
      const current=existing[0];
      const status=String(current.status||"");
      if(status==="checkout_pending"){
        const currentMetadata:any=current.metadata||{};
        const existingCheckoutId=String(currentMetadata.checkout_id||"");
        if(existingCheckoutId){
          const expired=isCheckoutExpired(current.created_at,currentMetadata);
          const existingKind=String(currentMetadata.kind||"");
          if(!expired&&existingKind===kind){
            const existingUrl=checkoutUrlFor(currentMetadata,existingCheckoutId);
            if(!existingUrl)throw new Error("active_billing_flow");
            trace("checkout_reused",{
              checkout_id:existingCheckoutId,
              subscription_row_id:String(current.id||""),
              expires_at:new Date(checkoutExpiresAtMs(current.created_at,currentMetadata)).toISOString()
            });
            return new Response(JSON.stringify({
              url:existingUrl,
              checkoutId:existingCheckoutId,
              externalReference:String(current.external_id||""),
              reused:true
            }),{status:200,headers:H});
          }

          const closedAt=new Date().toISOString();
          let lastEvent=expired
            ?"CHECKOUT_EXPIRED_LOCAL"
            :"CHECKOUT_CANCELED_FOR_METHOD_CHANGE";

          if(!expired){
            try{
              // O Asaas documenta o cancelamento por ID, mas não uma leitura
              // GET /checkouts/{id}. Trocar a forma de pagamento exige cancelar
              // explicitamente o checkout anterior antes de criar outro.
              await asaas("/checkouts/"+encodeURIComponent(existingCheckoutId)+"/cancel",{method:"POST"});
            }catch(cancelError){
              const cancelMessage=String((cancelError as Error)?.message||cancelError);
              if(/^asaas_404(?:_|$)/.test(cancelMessage)){
                lastEvent="CHECKOUT_NOT_FOUND_DURING_CANCEL";
              }else{
                throw new Error("active_billing_flow");
              }
            }
          }

          const closed=await db().from("billing_subscriptions").update({
            status:"inactive",
            metadata:{
              ...currentMetadata,
              last_event:lastEvent,
              checkout_closed_at:closedAt
            },
            updated_at:closedAt
          }).eq("id",current.id).eq("status","checkout_pending");
          if(closed.error)throw closed.error;
          trace("checkout_closed_before_replacement",{
            checkout_id:existingCheckoutId,
            subscription_row_id:String(current.id||""),
            reason:lastEvent
          });
        }else{
          const createdAt=Date.parse(String(current.created_at||""));
          if(Number.isFinite(createdAt)&&Date.now()-createdAt>PENDING_WITHOUT_ID_GRACE_MS){
            const failedAt=new Date().toISOString();
            const failed=await db().from("billing_subscriptions").update({
              status:"checkout_failed",
              metadata:{...(current.metadata||{}),last_event:"STALE_CHECKOUT_PENDING_WITHOUT_ID"},
              updated_at:failedAt
            }).eq("id",current.id).eq("status","checkout_pending");
            if(failed.error)throw failed.error;
          }else{
            throw new Error("active_billing_flow");
          }
        }
      }else{
        throw new Error("active_billing_flow");
      }
    }

    ref="premium_"+crypto.randomUUID();
    const isRecurring=kind==="monthly_card";
    const now=new Date();
    const brazilDateParts=new Intl.DateTimeFormat("en-US",{
      timeZone:"America/Sao_Paulo",
      year:"numeric",
      month:"2-digit",
      day:"2-digit"
    }).formatToParts(now);
    const datePart=(type:string)=>brazilDateParts.find(part=>part.type===type)?.value||"";
    const firstChargeDate=`${datePart("year")}-${datePart("month")}-${datePart("day")}`;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(firstChargeDate))throw new Error("first_charge_date_invalid");

    const initialMetadata:any={kind,lang,external_reference:ref};
    if(isRecurring){
      initialMetadata.first_charge_policy="immediate";
      initialMetadata.first_charge_due_date=firstChargeDate;
      initialMetadata.recurrence_cycle="MONTHLY";
    }

    const ins=await db().from("billing_subscriptions").insert({
      user_id:id,provider:"asaas",external_id:ref,status:"checkout_pending",plan:"premium",currency:"BRL",
      metadata:initialMetadata
    });
    if(ins.error)throw ins.error;

    const payload:any={
      billingTypes:isRecurring?["CREDIT_CARD"]:["PIX"],
      chargeTypes:isRecurring?["RECURRENT"]:["DETACHED"],
      minutesToExpire:CHECKOUT_TTL_MINUTES,
      externalReference:ref,
      callback:{
        cancelUrl:`${SITE}/conta/assinatura.html?lang=pt&asaas=cancel`,
        expiredUrl:`${SITE}/conta/assinatura.html?lang=pt&asaas=expired`,
        successUrl:`${SITE}/boas_vindas_assinante.html?lang=pt&provider=asaas&payment=success`
      },
      items:[{name:"Premium",description:isRecurring?"Assinatura Premium mensal":"Acesso Premium por 30 dias",quantity:1,value:PRICE_BRL}]
    };
    // Não enviar customerData parcial: em Produção o Asaas valida campos
    // cadastrais obrigatórios quando esse objeto é informado. O Checkout
    // coleta os dados do pagador diretamente, evitando rejeição por CPF/endereço
    // ausentes no perfil Firebase.
    // The first card charge is due on the checkout date. The MONTHLY cycle
    // controls only subsequent renewals; a future renewal date never proves
    // that the initial payment was made.
    if(isRecurring)payload.subscription={
      cycle:"MONTHLY",
      nextDueDate:firstChargeDate,
      externalReference:ref
    };

    const checkout=await asaas("/checkouts",{method:"POST",body:JSON.stringify(payload)});
    checkoutId=String(checkout?.id||"");
    if(!checkoutId)throw new Error("checkout_id_missing");
    const checkoutUrl=String(checkout?.link||`https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`);
    if(!/^https:\/\/(?:www\.)?asaas\.com\//i.test(checkoutUrl))throw new Error("checkout_url_invalid");
    const checkoutCreatedAt=new Date().toISOString();
    const checkoutExpiresAt=new Date(Date.parse(checkoutCreatedAt)+CHECKOUT_TTL_MS).toISOString();
    const checkoutSubscription=checkout?.subscription;
    const providerSubscriptionId=String(
      typeof checkoutSubscription==="object"
        ? checkoutSubscription?.id||""
        : checkoutSubscription||""
    ).trim();
    const checkoutCustomerId=String(
      checkout?.customer||
      (typeof checkoutSubscription==="object"?checkoutSubscription?.customer||"":"")||
      ""
    ).trim();
    const persistedMetadata:any={
      ...initialMetadata,
      checkout_id:checkoutId,
      checkout_url:checkoutUrl,
      checkout_created_at:checkoutCreatedAt,
      checkout_expires_at:checkoutExpiresAt
    };
    if(providerSubscriptionId)persistedMetadata.provider_subscription_id=providerSubscriptionId;
    if(checkoutCustomerId)persistedMetadata.asaas_customer_id=checkoutCustomerId;
    const upd=await db().from("billing_subscriptions").update({
      metadata:persistedMetadata,
      updated_at:new Date().toISOString()
    }).eq("provider","asaas").eq("external_id",ref);
    if(upd.error)throw upd.error;
    trace("checkout_created",{
      checkout_id:checkoutId,
      kind,
      lang,
      provider_subscription_linked:Boolean(providerSubscriptionId),
      customer_linked:Boolean(checkoutCustomerId),
      checkout_expires_at:checkoutExpiresAt
    });
    return new Response(JSON.stringify({url:checkoutUrl,checkoutId,externalReference:ref}),{status:200,headers:H});
  }catch(e){
    const msg=String((e as Error)?.message||e);
    if(ref && !checkoutId){
      try{
        await db().from("billing_subscriptions")
          .update({
            status:"checkout_failed",
            metadata:{kind:attemptKind,lang:attemptLang,external_reference:ref,error:msg.slice(0,1000)},
            updated_at:new Date().toISOString()
          })
          .eq("provider","asaas")
          .eq("external_id",ref)
          .eq("status","checkout_pending");
      }catch(_cleanup){}
    }
    console.error("[asaas-checkout]",msg);
    const safeCode=msg.startsWith("asaas_")?msg:"checkout_failed";
    trace("checkout_error",{
      kind:attemptKind,
      lang:attemptLang,
      error_code:safeCode.slice(0,160)
    });
    return new Response(JSON.stringify({error:safeCode}),{status:400,headers:H});
  }
});
