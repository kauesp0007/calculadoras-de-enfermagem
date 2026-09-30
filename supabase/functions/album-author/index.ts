// Autoria do álbum usa a mesma sessão Firebase do fórum e da conta.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";
import sanitizeHtml from "npm:sanitize-html@2.17.0";

const projectId = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const jwks = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const bucket = "forum-imagens-enfermagem";
const columns = "id,titulo,descricao,ano,instituicao,localizacao,imagem_url,data_upload,author_name,author_avatar,anonymous";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Authorization, apikey, Content-Type","Content-Type":"application/json; charset=utf-8"};
const reply = (data: unknown,status = 200) => new Response(JSON.stringify(data),{status,headers:cors});
const fail = (error: string,status = 400): never => { throw Object.assign(new Error(error),{status}); };
function text(value: unknown,max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) fail("invalid_fields");
  return value.trim();
}
function httpsURL(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : null; } catch { return null; }
}
async function identity(req: Request) {
  const header = req.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) fail("unauthorized",401);
  try {
    const {payload} = await jwtVerify(header.slice(7),jwks,{algorithms:["RS256"],issuer:"https://securetoken.google.com/" + projectId,audience:projectId});
    if (!payload.sub || payload.sub.length > 128) fail("unauthorized",401);
    return payload;
  } catch { fail("unauthorized",401); }
}
function photoInput(body: Record<string, unknown>,profile: Record<string, unknown>) {
  if (body.consent !== true) fail("consent_required");
  if (typeof body.anonymous !== "boolean") fail("invalid_fields");
  if (!Number.isInteger(body.ano) || Number(body.ano) < 1800 || Number(body.ano) > 2100) fail("invalid_year");
  const raw = text(body.descricao,30000);
  const descricao = sanitizeHtml(raw,{
    allowedTags:["p","div","br","b","strong","i","em","u","span","font","h3","ul","ol","li"],
    allowedAttributes:{"*":["style"],font:["color"]},
    allowedStyles:{"*":{color:[/^#[0-9a-f]{3,8}$/i,/^rgb[a]?\([\d.,%\s]+\)$/i,/^[a-z]{3,20}$/i]}}
  });
  if (!sanitizeHtml(descricao,{allowedTags:[],allowedAttributes:{}}).trim()) fail("invalid_description");
  return {
    titulo:text(body.titulo,180),descricao,ano:body.ano,instituicao:text(body.instituicao,200),localizacao:text(body.localizacao,200),
    anonymous:body.anonymous,
    author_name:body.anonymous ? null : String(profile.display_name || profile.name || "Usuário da comunidade").slice(0,180),
    author_avatar:body.anonymous ? null : httpsURL(profile.photo_url || profile.picture)
  };
}
async function upload(file: File,uid: string) {
  if (file.size < 1 || file.size > 5 * 1024 * 1024) fail("invalid_file");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? "image/jpeg" :
    bytes[0] === 0x89 && String.fromCharCode(...bytes.slice(1,4)) === "PNG" ? "image/png" :
    String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP" ? "image/webp" : "";
  if (!type || type !== file.type) fail("invalid_file");
  // Caminho aleatório evita expor o UID público no storage.
  const path = "album/" + crypto.randomUUID() + "." + ({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp" }[type]);
  const {error} = await sb.storage.from(bucket).upload(path,bytes,{contentType:type,upsert:false});
  if (error) fail("upload_failed",500);
  return {path,url:sb.storage.from(bucket).getPublicUrl(path).data.publicUrl};
}
async function cleanup(path: string | undefined) {
  if (path) { const {error} = await sb.storage.from(bucket).remove([path]); if (error) console.warn("album storage cleanup failed"); }
}
function imagePath(url: string) {
  const prefix = Deno.env.get("SUPABASE_URL") + "/storage/v1/object/public/" + bucket + "/album/";
  return url?.startsWith(prefix) ? "album/" + url.slice(prefix.length) : undefined;
}
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:cors});
  if (req.method !== "POST") return reply({error:"method_not_allowed"},405);
  let uploaded: {path:string;url:string} | undefined;
  try {
    const claims = await identity(req), uid = claims.sub!;
    if (Number(req.headers.get("content-length") || 0) > 6 * 1024 * 1024) fail("invalid_file",413);
    let body: Record<string, unknown>, file: File | null = null;
    if (req.headers.get("Content-Type")?.startsWith("multipart/form-data")) {
      const form = await req.formData(); body = JSON.parse(String(form.get("payload") || "{}")); body.action = form.get("action");
      const item = form.get("file"); if (item instanceof File) file = item;
    } else body = await req.json();
    const action = body.action;
    if (action === "mine") {
      const {data,error} = await sb.from("album_photo_owners").select("photo_id").eq("firebase_uid",uid);
      if (error) fail("read_failed",500);
      const {data:profile} = await sb.from("account_profiles").select("display_name,photo_url").eq("firebase_uid",uid).maybeSingle();
      return reply({ids:(data || []).map(p => p.photo_id),displayName:profile?.display_name || claims.name || "Usuário da comunidade"});
    }
    if (!["create","update","delete"].includes(String(action))) fail("invalid_action");
    const id = Number(body.photo_id);
    let existing: Record<string, unknown> | null = null;
    if (action !== "create") {
      if (!Number.isSafeInteger(id) || id <= 0) fail("invalid_photo_id");
      const {data:owner,error:ownerError} = await sb.from("album_photo_owners").select("photo_id").eq("photo_id",id).eq("firebase_uid",uid).maybeSingle();
      if (ownerError) fail("read_failed",500);
      if (!owner) fail("forbidden",403);
      const {data,error} = await sb.from("album_fotos").select(columns).eq("id",id).maybeSingle();
      if (error || !data) fail("photo_not_found",404);
      existing = data;
    }
    if (action === "delete") {
      const {data,error} = await sb.from("album_fotos").delete().eq("id",id).select("id").single();
      if (error || !data) fail("delete_failed",500);
      await cleanup(imagePath(String(existing!.imagem_url)));
      return reply({ok:true});
    }
    // Perfil canônico account-data: nome/avatar salvos prevalecem aos claims Firebase.
    const {data:profile} = await sb.from("account_profiles").select("display_name,photo_url").eq("firebase_uid",uid).maybeSingle();
    const fields = photoInput(body,{...claims,...profile});
    if (action === "create" && !file) fail("photo_required");
    if (file) uploaded = await upload(file,uid);
    if (action === "create") {
      const {data,error} = await sb.rpc("album_publish_photo",{p_uid:uid,p_photo:{...fields,imagem_url:uploaded!.url}});
      if (error) fail("save_failed",500);
      uploaded = undefined;
      return reply({photo:data},201);
    }
    const {data,error} = await sb.from("album_fotos").update({...fields,...(uploaded ? {imagem_url:uploaded.url} : {})}).eq("id",id).select(columns).single();
    if (error) fail("save_failed",500);
    const replaced = !!uploaded; uploaded = undefined;
    if (replaced) await cleanup(imagePath(String(existing!.imagem_url)));
    return reply({photo:data});
  } catch (error) {
    await cleanup(uploaded?.path);
    const status = Number(error.status) || 500;
    console.warn("album-author:",status);
    return reply({error:status === 500 ? "request_failed" : error.message},status);
  }
});
