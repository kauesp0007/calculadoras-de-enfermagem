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
// This is the project's public anon key, never a service credential.
const publicKey=process.env.SUPABASE_ANON_KEY||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzamtmdGpmYmt1dWhpbG5xb254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODMxNjQsImV4cCI6MjA4MjY1OTE2NH0.mly76L5r2zoasonwta8aNND2mWWrkAoXirAAs99mDYo';
const sample=[...expected][0].split('/').map(encodeURIComponent).join('/');
for(const route of ['authenticated','public']){
  const denied=await fetch(base+'/storage/v1/object/'+route+'/'+bucket+'/'+sample,{headers:{apikey:publicKey,Authorization:'Bearer '+publicKey},signal:AbortSignal.timeout(30000)});
  if(denied.ok)throw new Error('Original PDF unexpectedly readable without Premium backend');
  if(![400,401,403,404].includes(denied.status))throw new Error('Anonymous storage isolation could not be verified');
}
// Keep sources intact outside the Pages artifact after verified private upload.
await fs.rename(root,path.join(process.env.RUNNER_TEMP,'assistential-pdf-sources-'+process.env.GITHUB_RUN_ID));
// Exact duplicate of Perroca also exists in docs; exclude that copy from Pages.
const duplicate='docs/XXXX_COFEN_Ficha_Clinica_Escala_de_Perroca.pdf';
try{await fs.rename(duplicate,path.join(process.env.RUNNER_TEMP,'assistential-perroca-doc-copy-'+process.env.GITHUB_RUN_ID+'.pdf'));}catch(error){if(error.code!=='ENOENT')throw error;}
console.log('PASS: '+count+' PDFs verified in private storage; originals excluded from public Pages artifact.');
