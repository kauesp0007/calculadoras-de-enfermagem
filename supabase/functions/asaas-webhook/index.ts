import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL=Deno.env.get("SUPABASE_URL")??"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const TOKEN=Deno.env.get("ASAAS_WEBHOOK_TOKEN")??"";
const ASAAS=Deno.env.get("ASAAS_API_TOKEN")??"";
const H={"Content-Type":"application/json; charset=utf-8"};
const db=()=>createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
function trace(event:string,data:Record<string,unknown>={}){
  console.info("[billing-event]",JSON.stringify({
    flow:"subscription",
    provider:"asaas",
    event,
    at:new Date().toISOString(),
    ...data
  }));
}
function iso(value:any,endOfDay=false){
  if(value===null||value===undefined)return null;
  const raw=String(value).trim();
  if(!raw)return null;
  const normalized=/^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? raw+(endOfDay?"T23:59:59-03:00":"T00:00:00-03:00")
    : raw;
  const parsed=new Date(normalized);
  return Number.isNaN(parsed.getTime())?null:parsed.toISOString();
}
const addDays=(n:number)=>new Date(Date.now()+n*86400000).toISOString();

/* ASAAS_WEBHOOK_STATE_START */
function checkoutCreatedPatch(currentStatus,currentMetadata,eventId,checkoutId,customerId,nowIso){
  const status=String(currentStatus||"checkout_pending");
  const metadata={
    ...(currentMetadata||{}),
    checkout_created_event_id:eventId,
    checkout_created_received_at:nowIso
  };
  if(!metadata.last_event){
    metadata.last_event="CHECKOUT_CREATED";
    metadata.last_event_id=eventId;
  }
  if(checkoutId)metadata.checkout_id=checkoutId;
  if(customerId)metadata.asaas_customer_id=customerId;
  return {status,metadata,updated_at:nowIso};
}
function prePaymentLifecycleStatus(currentStatus){
  return String(currentStatus||"checkout_pending");
}
function normalizePaidAccessExpiry(candidate,baseline,nowIso=new Date().toISOString()){
  const nowMs=Date.parse(String(nowIso||""));
  const safeNowMs=Number.isFinite(nowMs)?nowMs:Date.now();
  const candidateMs=Date.parse(String(candidate||""));
  if(Number.isFinite(candidateMs)&&candidateMs>safeNowMs){
    return {expiry:new Date(candidateMs).toISOString(),corrected:false};
  }

  const baselineMs=Date.parse(String(baseline||""));
  const baselineExpiryMs=Number.isFinite(baselineMs)
    ? baselineMs+30*86400000
    : NaN;
  const fallbackMs=Number.isFinite(baselineExpiryMs)&&baselineExpiryMs>safeNowMs
    ? baselineExpiryMs
    : safeNowMs+30*86400000;
  return {expiry:new Date(fallbackMs).toISOString(),corrected:true};
}
/* ASAAS_WEBHOOK_STATE_END */

async function asaasGet(path:string){
  if(!ASAAS)throw new Error("asaas_not_configured");
  const r=await fetch("https://api.asaas.com/v3"+path,{headers:{access_token:ASAAS}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error("asaas_"+r.status);
  return d;
}

async function findSub(ref:string,providerSubId:string,customerId:string,checkoutId:string){
  const queries=[
    ref?db().from("billing_subscriptions").select("*").eq("provider","asaas").eq("external_id",ref).maybeSingle():null,
    checkoutId?db().from("billing_subscriptions").select("*").eq("provider","asaas").eq("metadata->>checkout_id",checkoutId).maybeSingle():null,
    providerSubId?db().from("billing_subscriptions").select("*").eq("provider","asaas").eq("metadata->>provider_subscription_id",providerSubId).maybeSingle():null,
    customerId?db().from("billing_subscriptions").select("*").eq("provider","asaas").in("status",["checkout_pending","active","past_due"]).eq("metadata->>asaas_customer_id",customerId).order("created_at",{ascending:false}).limit(1).maybeSingle():null
  ].filter(Boolean) as any[];

  for(const q of queries){
    const a=await q;
    if(a.error)throw a.error;
    if(a.data)return a.data;
  }
  return null;
}

async function findSubByCustomerIdentity(customerId:string,providerSubId:string){
  if(!customerId)return null;
  const remoteCustomer=await asaasGet("/customers/"+encodeURIComponent(customerId));
  const email=String(remoteCustomer?.email||"").trim().toLowerCase();
  if(!email)return null;

  // O e-mail vem da identidade do cliente confirmada pelo próprio Asaas.
  // Só correlacionamos quando existe uma única identidade Firebase local,
  // evitando associação ambígua ou criação de assinatura paralela.
  const identities=await db().from("billing_identities")
    .select("id")
    .eq("provider","firebase")
    .eq("email",email)
    .limit(2);
  if(identities.error)throw identities.error;
  if(!identities.data||identities.data.length!==1)return null;

  const rows=await db().from("billing_subscriptions")
    .select("*")
    .eq("provider","asaas")
    .eq("user_id",String(identities.data[0].id))
    .in("status",["checkout_pending","active","past_due","inactive"])
    .order("created_at",{ascending:false})
    .limit(10);
  if(rows.error)throw rows.error;
  const candidates=rows.data||[];
  if(!candidates.length)return null;

  if(providerSubId){
    const exact=candidates.filter((row:any)=>
      String(row?.metadata?.provider_subscription_id||"")===providerSubId
    );
    if(exact.length===1)return exact[0];

    const recurring=candidates.filter((row:any)=>{
      const stored=String(row?.metadata?.provider_subscription_id||"");
      return String(row?.metadata?.kind||"")==="monthly_card"&&(!stored||stored===providerSubId);
    });
    if(recurring.length===1)return recurring[0];
    return null;
  }

  return candidates.length===1?candidates[0]:null;
}

async function isGuardBlocked(userId:string){
  const a=await db().from("billing_subscription_guards").select("status").eq("provider","asaas").eq("user_id",userId).maybeSingle();
  if(a.error)throw a.error;
  return String(a.data?.status||"").toLowerCase()==="blocked";
}

async function forceFree(sub:any,reason:string){
  const now=new Date().toISOString();
  const u=await db().from("billing_subscriptions").update({
    status:"inactive",
    metadata:{...(sub.metadata||{}),last_reason:reason,guarded_free:true},
    updated_at:now
  }).eq("id",sub.id);
  if(u.error)throw u.error;

  const e=await db().from("user_entitlements").update({
    plan:"free",
    premium_expires_at:now,
    provider:null,
    provider_customer_id:null,
    provider_subscription_id:null,
    updated_at:now
  }).eq("user_id",sub.user_id);
  if(e.error)throw e.error;
}

async function setPremium(sub:any,expires:string,extra:any={}){
  const now=new Date().toISOString();
  const normalized=normalizePaidAccessExpiry(expires,sub.created_at,now);
  const safeExpires=normalized.expiry;
  const metadata={
    ...(sub.metadata||{}),
    ...extra,
    access_expires_at:safeExpires
  };
  if(normalized.corrected){
    metadata.nonfuture_access_expiry_ignored=String(expires||"");
    metadata.access_expiry_correction="confirmed_payment_future_floor";
    trace("nonfuture_paid_expiry_corrected",{
      subscription_row_id:String(sub.id||""),
      corrected_expiry:safeExpires
    });
  }

  const u=await db().from("billing_subscriptions").update({
    status:"active",
    current_period_end:safeExpires,
    metadata,
    updated_at:now
  }).eq("id",sub.id);
  if(u.error)throw u.error;

  const e=await db().from("user_entitlements").upsert({
    user_id:sub.user_id,
    plan:"premium",
    premium_expires_at:safeExpires,
    provider:"asaas",
    provider_customer_id:metadata.asaas_customer_id||null,
    provider_subscription_id:metadata.provider_subscription_id||null,
    updated_at:now
  },{onConflict:"user_id"});
  if(e.error)throw e.error;
}

async function setFree(sub:any,reason:string){
  const now=new Date().toISOString();
  const u=await db().from("billing_subscriptions").update({
    status:"inactive",
    metadata:{...(sub.metadata||{}),last_reason:reason},
    updated_at:now
  }).eq("id",sub.id);
  if(u.error)throw u.error;

  const {data:other,error}=await db().from("billing_subscriptions")
    .select("id")
    .eq("user_id",sub.user_id)
    .neq("id",sub.id)
    .in("status",["active","past_due"])
    .gt("current_period_end",now)
    .limit(1);
  if(error)throw error;

  if(!other?.length){
    const e=await db().from("user_entitlements").update({
      plan:"free",
      premium_expires_at:now,
      updated_at:now
    }).eq("user_id",sub.user_id);
    if(e.error)throw e.error;
  }
}

serve(async req=>{
  if(req.method!=="POST")return new Response("method_not_allowed",{status:405,headers:H});
  if(!TOKEN||req.headers.get("asaas-access-token")!==TOKEN)return new Response("unauthorized",{status:401,headers:H});

  let claimedEventId="";
  try{
    const e=await req.json();
    const event=String(e?.event||"");
    const eventId=String(e?.id||"");
    claimedEventId=eventId;

    if(!event||!eventId){
      return new Response(JSON.stringify({ok:true,ignored:true}),{status:200,headers:H});
    }

    const claim=await db().rpc("claim_billing_webhook",{
      p_provider:"asaas",
      p_event_id:eventId,
      p_lease_seconds:300
    });
    if(claim.error)throw claim.error;
    if(claim.data!==true){
      return new Response(JSON.stringify({ok:true,duplicate:true}),{status:200,headers:H});
    }

    const checkout=e?.checkout||{};
    const payment=e?.payment||{};
    // Checkout events expose recurring details under checkout.subscription.
    // Subscription events expose the resource at the top-level subscription.
    const subscription=e?.subscription||checkout?.subscription||{};

    const ref=String(
      checkout?.externalReference||
      payment?.externalReference||
      subscription?.externalReference||
      ""
    );
    const checkoutId=String(checkout?.id||"");
    const providerSubId=String(payment?.subscription||e?.subscription?.id||"");
    const paymentId=String(payment?.id||"");
    const customerId=String(
      checkout?.customer||
      payment?.customer||
      subscription?.customer||
      ""
    );

    let sub=await findSub(ref,providerSubId,customerId,checkoutId);

    // CHECKOUT_CREATED e CHECKOUT_PAID já carregam externalReference e/ou
    // checkout.id. Não consultar GET /checkouts/{id}: essa leitura não existe
    // na referência atual do Asaas e gerava falsos 404/duplicação local.
    if(!sub&&paymentId){
      try{
        const remote=await asaasGet("/payments/"+encodeURIComponent(paymentId));
        sub=await findSub(
          String(remote?.externalReference||ref||""),
          String(remote?.subscription||providerSubId||""),
          String(remote?.customer||customerId||""),
          checkoutId
        );
      }catch(err){ console.warn("[asaas-webhook] payment lookup fallback",String((err as Error)?.message||err)); }
    }
    if(!sub&&providerSubId){
      try{
        const remote=await asaasGet("/subscriptions/"+encodeURIComponent(providerSubId));
        sub=await findSub(
          String(remote?.externalReference||ref||""),
          providerSubId,
          String(remote?.customer||customerId||""),
          checkoutId
        );
      }catch(err){ console.warn("[asaas-webhook] subscription lookup fallback",String((err as Error)?.message||err)); }
    }

    if(!sub&&customerId){
      try{
        sub=await findSubByCustomerIdentity(customerId,providerSubId);
        if(sub){
          const recoveredMetadata:any={...(sub.metadata||{})};
          if(providerSubId)recoveredMetadata.provider_subscription_id=providerSubId;
          recoveredMetadata.asaas_customer_id=customerId;
          if(paymentId)recoveredMetadata.last_payment_id=paymentId;
          const linked=await db().from("billing_subscriptions").update({
            metadata:recoveredMetadata,
            updated_at:new Date().toISOString()
          }).eq("id",sub.id);
          if(linked.error)throw linked.error;
          sub={...sub,metadata:recoveredMetadata};
          trace("webhook_correlation_recovered",{
            event_type:event,
            subscription_row_id:String(sub.id||""),
            provider_subscription_linked:Boolean(providerSubId),
            strategy:"asaas_customer_email"
          });
        }
      }catch(err){
        console.warn("[asaas-webhook] customer identity fallback",String((err as Error)?.message||err));
      }
    }

    if(!sub){
      trace("webhook_orphan",{
        event_type:event,
        event_id:eventId,
        has_checkout_id:Boolean(checkoutId),
        has_provider_subscription_id:Boolean(providerSubId),
        has_payment_id:Boolean(paymentId),
        has_customer_id:Boolean(customerId)
      });
      console.warn("[asaas-webhook] orphan_event",{
        event,
        eventId,
        ref,
        checkoutId,
        providerSubId,
        paymentId,
        customerId
      });
      const done=await db().rpc("complete_billing_webhook",{
        p_provider:"asaas",
        p_event_id:eventId
      });
      if(done.error)throw done.error;
      return new Response(JSON.stringify({ok:true,ignored:true,reason:"no_local_subscription"}),{status:200,headers:H});
    }

    if(await isGuardBlocked(sub.user_id)){
      await forceFree(sub,"GUARD_BLOCKED");
      const done=await db().rpc("complete_billing_webhook",{
        p_provider:"asaas",
        p_event_id:eventId
      });
      if(done.error)throw done.error;
      return new Response(JSON.stringify({ok:true,guarded:true}),{status:200,headers:H});
    }

    trace("webhook_correlated",{
      event_type:event,
      event_id:eventId,
      subscription_row_id:String(sub.id||"")
    });

    const metadata={
      ...(sub.metadata||{}),
      last_event:event,
      last_event_id:eventId
    };

    if(checkoutId)metadata.checkout_id=checkoutId;
    if(customerId)metadata.asaas_customer_id=customerId;

    if(event==="CHECKOUT_CREATED"){
      const patch=checkoutCreatedPatch(
        sub.status,
        sub.metadata,
        eventId,
        checkoutId,
        customerId,
        new Date().toISOString()
      );
      const u=await db().from("billing_subscriptions").update(patch).eq("id",sub.id);
      if(u.error)throw u.error;
      trace("webhook_checkout_created_recorded",{
        event_id:eventId,
        subscription_row_id:String(sub.id||""),
        preserved_status:patch.status
      });

    }else if(event==="CHECKOUT_PAID"){
      const kind=String(metadata.kind||"pix_30d");
      let expiry=addDays(30);

      // For recurring Checkout, Asaas exposes the next due date under
      // checkout.subscription. Prefer it over an arbitrary +30d fallback.
      if(kind==="monthly_card"){
        const checkoutNextDue=String(checkout?.subscription?.nextDueDate||"");
        if(checkoutNextDue){
          expiry=iso(checkoutNextDue,true)||expiry;
          metadata.checkout_subscription_next_due_date=checkoutNextDue;
        }

        const subId=String(
          e?.subscription?.id||
          metadata.provider_subscription_id||
          ""
        );

        if(subId){
          const remote=await asaasGet("/subscriptions/"+encodeURIComponent(subId));
          if(remote?.nextDueDate){
            expiry=iso(remote.nextDueDate,true)||expiry;
          }
          metadata.provider_subscription_id=subId;
          if(remote?.customer)metadata.asaas_customer_id=String(remote.customer);
        }
      }

      metadata.checkout_paid=true;
      metadata.first_payment_confirmed_at=new Date().toISOString();
      metadata.access_expires_at=expiry;
      await setPremium({...sub,metadata},expiry,metadata);

    }else if(event==="SUBSCRIPTION_CREATED"||event==="SUBSCRIPTION_UPDATED"){
      const sid=String(subscription?.id||"");
      if(sid)metadata.provider_subscription_id=sid;
      if(subscription?.customer)metadata.asaas_customer_id=String(subscription.customer);

      const nextDueDate=subscription?.nextDueDate
        ? iso(subscription.nextDueDate,true)
        : null;
      if(nextDueDate)metadata.subscription_next_due_date=nextDueDate;

      // Creating an Asaas subscription is not proof that its first charge was
      // paid. Keep the local record pending until a financial confirmation.
      const firstPaymentConfirmed=metadata.checkout_paid===true;
      const remoteStatus=String(subscription?.status||"").toUpperCase();
      const status=firstPaymentConfirmed
        ? (remoteStatus==="ACTIVE"?"active":remoteStatus.toLowerCase()||sub.status)
        : prePaymentLifecycleStatus(sub.status);

      const update:any={
        status,
        metadata,
        updated_at:new Date().toISOString()
      };
      if(firstPaymentConfirmed&&nextDueDate)update.current_period_end=nextDueDate;

      const u=await db().from("billing_subscriptions").update(update).eq("id",sub.id);
      if(u.error)throw u.error;

      if(firstPaymentConfirmed&&remoteStatus==="ACTIVE"){
        const expiry=nextDueDate||sub.current_period_end||addDays(30);
        metadata.access_expires_at=expiry;
        await setPremium({...sub,metadata},expiry,metadata);
      }

    }else if(event==="PAYMENT_OVERDUE"){
      const u=await db().from("billing_subscriptions").update({
        status:"past_due",
        metadata,
        updated_at:new Date().toISOString()
      }).eq("id",sub.id);
      if(u.error)throw u.error;

    }else if(event==="PAYMENT_CONFIRMED"||event==="PAYMENT_RECEIVED"){
      let expiry=addDays(30);
      const paymentSubId=String(
        payment?.subscription||
        metadata.provider_subscription_id||
        ""
      );

      if(paymentSubId){
        const remote=await asaasGet("/subscriptions/"+encodeURIComponent(paymentSubId));
        if(remote?.nextDueDate){
          expiry=iso(remote.nextDueDate,true)||expiry;
        }
        metadata.provider_subscription_id=paymentSubId;
        metadata.asaas_customer_id=String(
          remote?.customer||
          customerId||
          metadata.asaas_customer_id||
          ""
        );
      }

      metadata.checkout_paid=true;
      metadata.first_payment_confirmed_at=
        metadata.first_payment_confirmed_at||new Date().toISOString();
      metadata.access_expires_at=expiry;
      await setPremium({...sub,metadata},expiry,metadata);

    }else if(["CHECKOUT_CANCELED","CHECKOUT_EXPIRED"].includes(event)){
      await setFree({...sub,metadata},event);

    }else if(["SUBSCRIPTION_INACTIVATED","SUBSCRIPTION_DELETED"].includes(event)){
      await setFree({...sub,metadata},event);

    }else if([
      "PAYMENT_REFUNDED",
      "PAYMENT_PARTIALLY_REFUNDED",
      "PAYMENT_CHARGEBACK_REQUESTED",
      "PAYMENT_CHARGEBACK_DISPUTE"
    ].includes(event)){
      await setFree({...sub,metadata},event);
    }

    const done=await db().rpc("complete_billing_webhook",{
      p_provider:"asaas",
      p_event_id:eventId
    });
    if(done.error)throw done.error;

    trace("webhook_processed",{
      event_type:event,
      event_id:eventId,
      subscription_row_id:String(sub.id||""),
      resulting_status:[
        "CHECKOUT_PAID","PAYMENT_CONFIRMED","PAYMENT_RECEIVED"
      ].includes(event)?"premium_active":([
        "CHECKOUT_CANCELED","CHECKOUT_EXPIRED","SUBSCRIPTION_INACTIVATED",
        "SUBSCRIPTION_DELETED","PAYMENT_REFUNDED","PAYMENT_PARTIALLY_REFUNDED",
        "PAYMENT_CHARGEBACK_REQUESTED","PAYMENT_CHARGEBACK_DISPUTE"
      ].includes(event)?"inactive":event==="PAYMENT_OVERDUE"?"past_due":"recorded")
    });
    return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
  }catch(e){
    const detail=String((e as Error)?.message||e);
    console.error("[asaas-webhook]",detail);
    trace("webhook_error",{
      event_id:claimedEventId,
      error_code:detail.slice(0,200)
    });
    try{
      if(claimedEventId){
        await db().rpc("fail_billing_webhook",{
          p_provider:"asaas",
          p_event_id:claimedEventId,
          p_error:detail
        });
      }
    }catch(_){}
    return new Response(JSON.stringify({error:"webhook_processing_failed",detail,retryable:true}),{status:500,headers:H});
  }
});
