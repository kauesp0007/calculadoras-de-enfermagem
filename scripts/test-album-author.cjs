/* Contract tests for album-author. No requests or mutations in production. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {stripTypeScriptTypes} = require('node:module');
let handler, published, writes = 0, uploaded = 0, removed = 0;
let failingSave = false;
const ownerUID = 'verified-user';
function query(table) {
  let mode = 'read', filters = {}, values;
  const q = {
    select(){return q;},eq(k,v){filters[k]=v;return q;},
    update(v){mode='update';values=v;return q;},delete(){mode='delete';return q;},
    maybeSingle(){return run();},single(){return run();},then(resolve,reject){return run().then(resolve,reject);}
  };
  async function run() {
    if(table === 'album_photo_owners') return {data:filters.photo_id === 10 && filters.firebase_uid === ownerUID ? {photo_id:10} : null,error:null};
    if(table === 'account_profiles') return {data:{display_name:'Nome salvo',photo_url:'https://example.test/avatar.png'},error:null};
    if(table === 'album_fotos') {
      if(mode !== 'read') writes++;
      return {data:{id:10,titulo:'Legado',imagem_url:'https://example.test/legacy.png',...values},error:null};
    }
    throw new Error('unknown_table');
  }
  return q;
}
const sb = {
  from:query,
  rpc:async(name,params)=>{published=params;writes++;return failingSave?{error:new Error('save_failed')}:{data:{id:11,...params.p_photo},error:null};},
  storage:{from:()=>({upload:async()=>{uploaded++;return {error:null};},getPublicUrl:p=>({data:{publicUrl:'https://example.test/'+p}}),remove:async()=>{removed++;return {error:null};}})}
};
const context = {
  createClient:()=>sb,createRemoteJWKSet:()=>{},
  jwtVerify:async token=>{if(token!=='valid')throw new Error('bad_signature');return {payload:{sub:ownerUID,name:'Token name',picture:'https://example.test/token.png'}};},
  sanitizeHtml:(html,opts)=>opts.allowedTags?.length===0?html.replace(/<[^>]+>/g,''):html,
  Deno:{env:{get:k=>k==='FIREBASE_PROJECT_ID'?'calculadoras-enfermagem':k==='SUPABASE_URL'?'https://example.test':'server-secret'},serve:h=>handler=h},
  Request,Response,File,FormData,URL,crypto,console,Uint8Array
};
const source=fs.readFileSync('supabase/functions/album-author/index.ts','utf8').replace(/^import .*;$/gm,'');
vm.runInNewContext(stripTypeScriptTypes(source),context);
async function invoke(action,values={},file=null,token='valid') {
  let body,headers={Authorization:'Bearer '+token};
  if(file){body=new FormData();body.set('action',action);body.set('payload',JSON.stringify(values));body.set('file',file);}
  else{body=JSON.stringify({action,...values});headers['Content-Type']='application/json';}
  const response=await handler(new Request('https://example.test/album-author',{method:'POST',headers,body}));
  return {status:response.status,body:await response.json()};
}
(async()=>{
  assert.equal((await invoke('mine',{},null,'invalid')).status,401);
  assert.equal((await invoke('update',{photo_id:999,uid:ownerUID})).status,403);
  assert.equal(writes,0,'unowned photo must never reach mutation');
  const fields={titulo:'Novo retrato',descricao:'<b>História</b>',ano:2026,instituicao:'Escola',localizacao:'Cidade',anonymous:false,consent:true,uid:'forged',author_name:'Forged name'};
  assert.equal((await invoke('create',{...fields,consent:false})).body.error,'consent_required');
  const file=new File([new Uint8Array([137,80,78,71,13,10,26,10])],'photo.png',{type:'image/png'});
  let result=await invoke('create',fields,file);
  assert.equal(result.status,201);
  assert.equal(published.p_uid,ownerUID,'author must come from verified claims');
  assert.equal(result.body.photo.author_name,'Nome salvo','canonical saved account profile must win');
  result=await invoke('create',{...fields,anonymous:true},file);
  assert.equal(result.body.photo.author_name,null);
  assert.equal(result.body.photo.author_avatar,null);
  assert.equal(result.body.photo.firebase_uid,undefined,'public response must not leak identity');
  const beforeRemoved=removed;failingSave=true;
  assert.equal((await invoke('create',fields,file)).status,500);
  assert.equal(removed,beforeRemoved+1,'failed publish must clean newly uploaded file');
  failingSave=false;
  assert.equal((await invoke('update',{...fields,photo_id:10})).status,200);
  assert.equal((await invoke('delete',{photo_id:999})).status,403);
  assert.equal((await invoke('delete',{photo_id:10})).status,200);
  console.log('PASS: signature, ownership, consent, canonical identity, anonymity, upload cleanup, owner edit/delete.');
})().catch(error=>{console.error(error);process.exitCode=1;});
