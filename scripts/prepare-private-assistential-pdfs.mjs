import fs from 'node:fs/promises';
import path from 'node:path';
const base=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const bucket='assistential-pdfs-private';
if(!base||!key||!process.env.RUNNER_TEMP)throw new Error('Private PDF deployment credentials/runtime missing');
const headers={apikey:key,Authorization:'Bearer '+key};
async function api(url,options={}){const r=await fetch(base+url,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error('Private PDF storage HTTP '+r.status);return r;}
const bucketResponse=await fetch(base+'/storage/v1/bucket/'+bucket,{headers});
if(bucketResponse.status===404||bucketResponse.status===400){await api('/storage/v1/bucket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:bucket,name:bucket,public:false,allowed_mime_types:['application/pdf'],file_size_limit:31457280})});}
else{if(!bucketResponse.ok)throw new Error('Storage bucket unavailable');const info=await bucketResponse.json();if(info.public)throw new Error('PDF bucket must be private');}
const catalogs=await (await api('/rest/v1/premium_content_pages?select=path,content&path=in.(formularios_de_escalas_assistenciais.html,en%2Fformularios_de_escalas_assistenciais.html,es%2Fformularios_de_escalas_assistenciais.html)')).json();
if(catalogs.length!==3)throw new Error('Missing catalog sources');
const expected=new Set(catalogs.flatMap(row=>{const m=row.content.match(/id=["']assistential-form-downloads["'][^>]*>([\s\S]*?)<\/script>/);if(!m)throw new Error('Missing private PDF registry');return JSON.parse(m[1]).map(e=>decodeURIComponent(e.pdf.replace(/^\/FORMULARIOS_DE_ESCALAS\//,'')));}));
if(expected.size!==192)throw new Error('Unexpected original PDF registry size');
const root='FORMULARIOS_DE_ESCALAS';let count=0;
async function upload(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())await upload(file);else if(/\.pdf$/i.test(e.name)){const bytes=await fs.readFile(file);if(bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('Invalid source PDF');const object=file.replaceAll(path.sep,'/').slice(root.length+1).split('/').map(encodeURIComponent).join('/');await api('/storage/v1/object/'+bucket+'/'+object,{method:'POST',headers:{'Content-Type':'application/pdf','x-upsert':'true'},body:bytes});const check=await api('/storage/v1/object/authenticated/'+bucket+'/'+object);const restored=Buffer.from(await check.arrayBuffer());if(!restored.equals(bytes))throw new Error('Private PDF upload verification failed');count++;}}}
await upload(root);
for(const object of expected){const file=path.join(root,object);if(!file.startsWith(root+path.sep)||object.includes('..'))throw new Error('Invalid registry path');await fs.access(file);}
if(count<expected.size)throw new Error('Incomplete private PDF collection');
// Keep sources intact outside the Pages artifact after verified private upload.
await fs.rename(root,path.join(process.env.RUNNER_TEMP,'assistential-pdf-sources-'+process.env.GITHUB_RUN_ID));
console.log('PASS: '+count+' PDFs verified in private storage; originals excluded from public Pages artifact.');
