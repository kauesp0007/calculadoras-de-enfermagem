import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL=Deno.env.get("SUPABASE_URL")??"";
const KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const TOKEN=Deno.env.get("ASAAS_WEBHOOK_TOKEN")??"";
const ASAAS=Deno.env.get("ASAAS_API_TOKEN")??"";
const H={"Content-Type":"application/json; charset=utf-8"};
const db=()=>createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
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
  const metadata={...(sub.metadata||{}),...extra};
  const u=await db().from("billing_subscriptions").update({
    status:"active",
    current_period_end:expires,
    metadata,
    updated_at:now
  }).eq("id",sub.id);
  if(u.error)throw u.error;

  const e=await db().from("user_entitlements").upsert({
    user_id:sub.user_id,
    plan:"premium",
    premium_expires_at:expires,
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

    // Eventos do Asaas podem chegar antes de o checkout local terminar de
    // persistir checkout_id/customer. Quando isso acontecer, resolva os
    // identificadores pela API do próprio Asaas e tente novamente. Isso evita
    // falsos billing_subscription_not_found sem criar registros paralelos.
    if(!sub&&checkoutId){
      try{
        const remote=await asaasGet("/checkouts/"+encodeURIComponent(checkoutId));
        sub=await findSub(
          String(remote?.externalReference||ref||""),
          providerSubId,
          String(remote?.customer||customerId||""),
          checkoutId
        );
      }catch(err){ console.warn("[asaas-webhook] checkout lookup fallback",String((err as Error)?.message||err)); }
    }
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

    if(!sub){
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

    const metadata={
      ...(sub.metadata||{}),
      last_event:event,
      last_event_id:eventId
    };

    if(checkoutId)metadata.checkout_id=checkoutId;
    if(customerId)metadata.asaas_customer_id=customerId;

    if(event==="CHECKOUT_CREATED"){
      const u=await db().from("billing_subscriptions").update({
        status:"checkout_pending",
        metadata,
        updated_at:new Date().toISOString()
      }).eq("id",sub.id);
      if(u.error)throw u.error;

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
        : "checkout_pending";

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

    return new Response(JSON.stringify({ok:true}),{status:200,headers:H});
  }catch(e){
    const detail=String((e as Error)?.message||e);
    console.error("[asaas-webhook]",detail);
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
