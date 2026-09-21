import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SECRET=Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST")??"";
const H={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};

function hex(a:ArrayBuffer){
  return Array.from(new Uint8Array(a)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function verify(body:string,sig:string){
  const parts=sig.split(",");
  const t=parts.find(x=>x.startsWith("t="))?.slice(2)||"";
  const v=parts.filter(x=>x.startsWith("v1=")).map(x=>x.slice(3));
  if(!SECRET.startsWith("whsec_")||!t||!v.length||Math.abs(Date.now()/1000-Number(t))>300) return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const mac=hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(`${t}.${body}`)));
  return v.includes(mac);
}

Deno.serve(async req=>{
  if(req.method!=="POST") return new Response("method_not_allowed",{status:405,headers:H});
  const raw=await req.text();
  if(!(await verify(raw,req.headers.get("stripe-signature")||"")))
    return new Response("invalid_signature",{status:400,headers:H});

  try{
    const event=JSON.parse(raw);
    const object=event?.data?.object||{};
    return new Response(JSON.stringify({
      ok:true,
      mode:"test",
      event_id:String(event?.id||""),
      event_type:String(event?.type||""),
      test_mode:object?.metadata?.test_mode==="true" || object?.subscription_data?.metadata?.test_mode==="true",
      note:"Sandbox webhook validated. No production billing tables or entitlements are modified."
    }),{status:200,headers:H});
  }catch{
    return new Response(JSON.stringify({error:"invalid_event"}),{status:400,headers:H});
  }
});