const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const migration = read("supabase/migrations/20260929210000_developer_premium_admin_controls.sql");
assert.match(migration, /create table if not exists public\.developer_settings/i);
assert.match(migration, /create table if not exists public\.developer_premium_route_rules/i);
assert.match(migration, /create table if not exists public\.developer_premium_email_grants/i);
assert.match(migration, /create table if not exists public\.developer_admin_audit_log/i);
assert.match(migration, /alter table public\.developer_settings enable row level security/i);
assert.match(migration, /revoke all on public\.developer_settings from anon, authenticated/i);
assert.match(migration, /revoke all on public\.developer_premium_route_rules from anon, authenticated/i);
assert.match(migration, /revoke all on public\.developer_premium_email_grants from anon, authenticated/i);
assert.match(migration, /insert into public\.developer_premium_route_rules[\s\S]+from public\.premium_content_pages/i);

const developerAdmin = read("supabase/functions/developer-admin/index.ts");
assert.match(developerAdmin, /ciadeenfermagem@gmail\.com/);
assert.match(developerAdmin, /publicPolicy/);
assert.match(developerAdmin, /requireAdmin/);
assert.match(developerAdmin, /developer_admin_audit_log/);
assert.match(developerAdmin, /set_setting/);
assert.match(developerAdmin, /set_route/);
assert.match(developerAdmin, /grant_email/);
assert.match(developerAdmin, /revoke_email/);
assert.doesNotMatch(developerAdmin, /SUPABASE_ANON_KEY/);
assert.match(developerAdmin, /enforcement: requestedPremium \? "client_guard" : "catalog_only"/);
assert.match(developerAdmin, /Página Free com conteúdo e ações liberados/);
assert.match(developerAdmin, /publishedShell\(path\)/);
assert.match(developerAdmin, /developer_premium_activation_requests/);

const activation = read("supabase/migrations/20260929222447_secure_developer_premium_activation.sql");
assert.match(activation, /developer_premium_requires_private_enforcement/);
assert.match(activation, /status = 'pending' for update/);
assert.match(activation, /grant execute on function public\.activate_developer_premium_route\(text,uuid\) to service_role/);

const config = read("supabase/config.toml");
assert.match(config, /\[functions\.developer-admin\]\s+verify_jwt = false/);

const billingAccess = read("supabase/functions/billing-access/index.ts");
assert.match(billingAccess, /developer_premium_email_grants/);
assert.match(billingAccess, /provider:"admin_exception"/);

const premiumContent = read("supabase/functions/premium-content/index.ts");
assert.match(premiumContent, /developer_premium_route_rules/);
assert.match(premiumContent, /developer_premium_email_grants/);
assert.match(premiumContent, /premiumRequiredForKey/);
assert.match(premiumContent, /privateContentForKey/);

const loader = read("js/access/premium-content-loader.js");
assert.match(loader, /request\(null,currentKey\)/);
assert.match(loader, /writePremiumDocument/);

const globalScripts = read("global-scripts.js");
assert.match(globalScripts, /functions\/v1\/developer-admin/);
assert.match(globalScripts, /installDeveloperPremiumGuard/);
assert.match(globalScripts, /free_global_lockdown/);
assert.match(globalScripts, /route\.premium_required/);

const asaas = read("supabase/functions/asaas-checkout/index.ts");
const stripe = read("supabase/functions/stripe-checkout/index.ts");
assert.match(asaas, /asaas_portal_enabled/);
assert.match(asaas, /asaas_portal_disabled/);
assert.match(stripe, /stripe_portal_enabled/);
assert.match(stripe, /stripe_portal_disabled/);

const profile = read("conta/perfil.html");
assert.match(profile, /developer-panel-link/);
assert.match(profile, /ciadeenfermagem@gmail\.com/);
assert.match(profile, /hidden col-span-2/);

const page = read("conta/desenvolvedor.html");
assert.match(page, /Área do Desenvolvedor/);
assert.match(page, /data-setting="free_global_lockdown"/);
assert.match(page, /grant_email/);
assert.match(page, /set_route/);
assert.match(page, /Clientes Premium Ativos/);
assert.match(page, /billing-all/);
assert.match(page, /billing-events/);
assert.match(page, /sortBillingRecords/);
assert.match(page, /mode=subscription_24h/);
assert.match(page, /Funil de assinatura — últimas 24 horas/);
assert.match(page, /subscription_checkout_click/);
assert.match(page, /subscription_payment_cancelled/);
assert.match(page, /subscription_payment_success/);
assert.match(page, /simulado-de-enfermagem\.html/);
assert.match(page, /biblioteca-provas\.html/);

const analytics = read("supabase/functions/analytics-metrics/index.ts");
assert.match(analytics, /subscription_24h/);
assert.match(analytics, /dateHourMinute/);
assert.match(analytics, /windowHours:\s*24/);
assert.match(analytics, /click_menu_assine_ja/);
assert.match(analytics, /subscription_checkout_click/);
assert.match(analytics, /subscription_payment_cancelled/);
assert.match(analytics, /subscription_payment_success/);

console.log("Developer admin static audit passed.");
