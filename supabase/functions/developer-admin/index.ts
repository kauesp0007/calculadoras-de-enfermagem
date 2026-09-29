import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "calculadoras-enfermagem";
const SITE = "https://www.calculadorasdeenfermagem.com.br";
const ADMIN_EMAILS = [
  "ciadeenfermagem@gmail.com",
  Deno.env.get("ADMIN_EMAIL"),
  Deno.env.get("ADMIN_EMAIL_2")
].filter(Boolean).map((email) => String(email).trim().toLowerCase());
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const db = () => createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const H = {
  "Access-Control-Allow-Origin": SITE,
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,apikey,Content-Type",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8"
};

const LANGS = new Set(["en", "es", "fr", "it", "de", "hi", "zh", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk", "ar"]);
const SETTINGS = new Set(["free_global_lockdown", "asaas_portal_enabled", "stripe_portal_enabled"]);

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: H });
}

function normalizeEmail(value: unknown) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(email)) throw new Error("invalid_email");
  return email;
}

function normalizePath(value: unknown) {
  let path = String(value || "").trim().toLowerCase();
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch (_) {}
  path = path.split(/[?#]/)[0].replace(/\\/g, "/").replace(/\/+/g, "/");
  path = path.replace(/^\/+/, "");
  if (!path || path.includes("..") || !path.endsWith(".html")) throw new Error("invalid_path");
  return path;
}

function pathCandidates(path: string) {
  const normalized = normalizePath(path);
  const parts = normalized.split("/").filter(Boolean);
  const candidates = [normalized];
  if (parts.length > 1 && LANGS.has(parts[0])) candidates.push(parts.slice(1).join("/"));
  return [...new Set(candidates)];
}

async function firebaseUser(req: Request) {
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith("Bearer ")) throw new Error("unauthorized");
  const { payload } = await jwtVerify(h.slice(7).trim(), JWKS, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID
  });
  const uid = String(payload.sub || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  if (!uid || !email) throw new Error("unauthorized");
  return { uid, email };
}

async function requireAdmin(req: Request) {
  const user = await firebaseUser(req);
  if (!ADMIN_EMAILS.includes(user.email)) throw new Error("forbidden");
  return user;
}

async function readSettings(sb: ReturnType<typeof db>) {
  const { data, error } = await sb.from("developer_settings").select("key,value,updated_by,updated_at");
  if (error) throw error;
  const settings: Record<string, unknown> = {
    free_global_lockdown: { enabled: false },
    asaas_portal_enabled: { enabled: true },
    stripe_portal_enabled: { enabled: true }
  };
  for (const row of data || []) settings[String(row.key)] = row.value || {};
  return settings;
}

function enabled(settings: Record<string, unknown>, key: string, fallback: boolean) {
  const item = settings[key] as { enabled?: unknown } | undefined;
  return typeof item?.enabled === "boolean" ? item.enabled : fallback;
}

async function routePolicy(sb: ReturnType<typeof db>, path: string) {
  const candidates = pathCandidates(path);
  const { data, error } = await sb
    .from("developer_premium_route_rules")
    .select("path,title,category,premium_required,enforcement,source,updated_at")
    .in("path", candidates);
  if (error) throw error;
  const rows = data || [];
  const byPath = new Map(rows.map((row) => [String(row.path), row]));
  const selected = candidates.map((candidate) => byPath.get(candidate)).find(Boolean);
  return {
    path: candidates[0],
    canonical_path: candidates[candidates.length - 1],
    premium_required: Boolean(selected?.premium_required),
    enforcement: selected?.enforcement || "none",
    source: selected?.source || "none"
  };
}

async function audit(sb: ReturnType<typeof db>, actor: string, action: string, targetType: string, targetKey: string, beforeState: unknown, afterState: unknown) {
  const { error } = await sb.from("developer_admin_audit_log").insert({
    actor_email: actor,
    action,
    target_type: targetType,
    target_key: targetKey,
    before_state: beforeState ?? null,
    after_state: afterState ?? null
  });
  if (error) throw error;
}

async function publicPolicy(url: URL) {
  const sb = db();
  const settings = await readSettings(sb);
  let route = { path: "", canonical_path: "", premium_required: false, enforcement: "none", source: "none" };
  const rawPath = url.searchParams.get("path") || "";
  if (rawPath) route = await routePolicy(sb, rawPath);
  return response({
    free_global_lockdown: enabled(settings, "free_global_lockdown", false),
    asaas_portal_enabled: enabled(settings, "asaas_portal_enabled", true),
    stripe_portal_enabled: enabled(settings, "stripe_portal_enabled", true),
    route
  });
}

async function billingSummary(sb: ReturnType<typeof db>) {
  const [{ data: identities, error: iError }, { data: entitlements, error: eError }, { data: subscriptions, error: sError }] = await Promise.all([
    sb.from("billing_identities").select("id,email,provider,external_subject,created_at,updated_at").limit(2000),
    sb.from("user_entitlements").select("user_id,plan,premium_expires_at,provider,provider_customer_id,provider_subscription_id,updated_at,created_at").limit(2000),
    sb.from("billing_subscriptions").select("id,user_id,provider,status,plan,currency,current_period_start,current_period_end,created_at,updated_at,metadata").order("created_at", { ascending: false }).limit(2000)
  ]);
  if (iError) throw iError;
  if (eError) throw eError;
  if (sError) throw sError;

  const identityMap = new Map((identities || []).map((identity) => [String(identity.id), identity]));
  const now = Date.now();
  const active = (entitlements || []).filter((row) => {
    if (row.plan !== "premium") return false;
    if (!row.premium_expires_at) return true;
    const time = Date.parse(String(row.premium_expires_at));
    return Number.isFinite(time) && time > now;
  }).map((row) => ({ ...row, email: identityMap.get(String(row.user_id))?.email || null }));
  const expired = (entitlements || []).filter((row) => {
    if (row.plan !== "premium" || !row.premium_expires_at) return false;
    const time = Date.parse(String(row.premium_expires_at));
    return Number.isFinite(time) && time <= now;
  }).map((row) => ({ ...row, email: identityMap.get(String(row.user_id))?.email || null }));
  const pending = (subscriptions || []).filter((row) => row.status === "checkout_pending")
    .map((row) => ({ ...row, email: identityMap.get(String(row.user_id))?.email || null }));
  const failed = (subscriptions || []).filter((row) => ["checkout_failed", "failed"].includes(String(row.status || "")))
    .map((row) => ({ ...row, email: identityMap.get(String(row.user_id))?.email || null }));

  return { active, pending, failed, expired };
}

async function adminSnapshot(req: Request) {
  await requireAdmin(req);
  const sb = db();
  const [settings, routes, grants, billing] = await Promise.all([
    readSettings(sb),
    sb.from("developer_premium_route_rules").select("path,title,category,premium_required,enforcement,source,updated_at").order("category", { ascending: true }).order("path", { ascending: true }).limit(3000),
    sb.from("developer_premium_email_grants").select("email,active,reason,created_by,revoked_by,created_at,updated_at,revoked_at").order("created_at", { ascending: false }).limit(1000),
    billingSummary(sb)
  ]);
  if (routes.error) throw routes.error;
  if (grants.error) throw grants.error;
  return response({ settings, routes: routes.data || [], grants: grants.data || [], billing });
}

async function routeHasPrivateContent(sb: ReturnType<typeof db>, path: string) {
  const candidates = pathCandidates(path);
  const { data, error } = await sb.from("premium_content_pages").select("path").in("path", candidates).limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

async function mutate(req: Request) {
  const actor = await requireAdmin(req);
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const sb = db();

  if (action === "set_setting") {
    const key = String(body.key || "");
    if (!SETTINGS.has(key)) throw new Error("invalid_setting");
    const next = { enabled: Boolean(body.enabled) };
    const { data: before } = await sb.from("developer_settings").select("key,value").eq("key", key).maybeSingle();
    const { data, error } = await sb.from("developer_settings").upsert({
      key,
      value: next,
      updated_by: actor.email,
      updated_at: new Date().toISOString()
    }, { onConflict: "key" }).select("key,value,updated_by,updated_at").single();
    if (error) throw error;
    await audit(sb, actor.email, action, "setting", key, before, data);
    return response({ setting: data });
  }

  if (action === "set_route") {
    const path = normalizePath(body.path);
    const hasPrivateContent = await routeHasPrivateContent(sb, path);
    const enforcement = hasPrivateContent ? "protected_content" : "client_guard";
    const next = {
      path,
      title: String(body.title || path).slice(0, 180),
      category: String(body.category || "Catálogo administrativo").slice(0, 120),
      premium_required: Boolean(body.premium_required),
      enforcement,
      source: hasPrivateContent ? "premium_content_pages" : "developer_panel",
      notes: hasPrivateContent ? "Rota controlada pelo catálogo privado." : "Rota pública: bloqueio aplicado pelo guard global do navegador.",
      updated_by: actor.email,
      updated_at: new Date().toISOString()
    };
    const { data: before } = await sb.from("developer_premium_route_rules").select("*").eq("path", path).maybeSingle();
    const { data, error } = await sb.from("developer_premium_route_rules").upsert(next, { onConflict: "path" }).select("*").single();
    if (error) throw error;
    await audit(sb, actor.email, action, "route", path, before, data);
    return response({ route: data });
  }

  if (action === "grant_email") {
    const email = normalizeEmail(body.email);
    const { data: before } = await sb.from("developer_premium_email_grants").select("*").eq("email", email).maybeSingle();
    const { data, error } = await sb.from("developer_premium_email_grants").upsert({
      email,
      active: true,
      reason: String(body.reason || "Liberação manual pelo painel Desenvolvedor").slice(0, 300),
      created_by: actor.email,
      revoked_by: null,
      revoked_at: null,
      updated_at: new Date().toISOString()
    }, { onConflict: "email" }).select("*").single();
    if (error) throw error;
    await audit(sb, actor.email, action, "email_grant", email, before, data);
    return response({ grant: data });
  }

  if (action === "revoke_email") {
    const email = normalizeEmail(body.email);
    const { data: before } = await sb.from("developer_premium_email_grants").select("*").eq("email", email).maybeSingle();
    const { data, error } = await sb.from("developer_premium_email_grants").update({
      active: false,
      revoked_by: actor.email,
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq("email", email).select("*").single();
    if (error) throw error;
    await audit(sb, actor.email, action, "email_grant", email, before, data);
    return response({ grant: data });
  }

  throw new Error("invalid_action");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: H });
  try {
    const url = new URL(req.url);
    if (req.method === "GET" && url.searchParams.get("public") === "policy") return await publicPolicy(url);
    if (req.method === "GET") return await adminSnapshot(req);
    if (req.method === "POST") return await mutate(req);
    return response({ error: "method_not_allowed" }, 405);
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    const status = msg === "unauthorized" ? 401 : msg === "forbidden" ? 403 : msg.startsWith("invalid_") ? 400 : 500;
    return response({ error: status === 500 ? "developer_admin_unavailable" : msg }, status);
  }
});
