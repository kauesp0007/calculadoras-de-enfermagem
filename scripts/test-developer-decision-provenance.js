"use strict";

// Execute the actual Edge Function with an in-memory Supabase query mock.
// No credentials, network, migrations or production mutations are involved.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");
const { randomUUID } = require("node:crypto");

const admin = "ciadeenfermagem@gmail.com";
const tables = {
  developer_settings: [{ key: "free_global_lockdown", value: { enabled: false } }],
  developer_premium_route_rules: [{ path: "fugulin.html", premium_required: true, enforcement: "protected_content", source: "premium_content_pages" }],
  developer_premium_activation_requests: [], developer_premium_email_grants: [],
  premium_content_pages: [], billing_identities: [], user_entitlements: [], billing_subscriptions: [],
  developer_admin_audit_log: [
    { id: "legacy", actor_email: admin, action: "set_route", target_type: "route", target_key: "fugulin.html", created_at: "2026-09-30T12:00:00Z", before_state: { premium_required: false }, after_state: { premium_required: true, notes: "secret notes", updated_by: admin } },
    { id: "deploy", actor_email: admin, action: "activate_route_after_deploy", target_type: "route", target_key: "fugulin.html", created_at: "2026-10-01T12:00:00Z", after_state: { premium_required: true } },
    { id: "outsider", actor_email: "outsider@example.com", action: "set_route", target_type: "route", target_key: "fugulin.html", created_at: "2026-10-02T12:00:00Z", after_state: { premium_required: false } },
    { id: "legacy-setting", actor_email: admin, action: "set_setting", target_type: "setting", target_key: "stripe_portal_enabled", created_at: "2026-09-30T12:00:00Z", after_state: { value: { enabled: true }, updated_by: admin } }
  ]
};
let auditError = false;
let shellPublished = false;
let handler;

function client() {
  return { from(table) {
    const filters = [], orders = [];
    let max = Infinity, operation = "select", payload, one = false;
    const q = {
      select() { return q; },
      eq(key, value) { filters.push(row => row[key] === value); return q; },
      in(key, values) { filters.push(row => values.includes(row[key])); return q; },
      order(key, options) { orders.push([key, options.ascending]); return q; },
      limit(n) { max = n; return q; },
      maybeSingle() { one = true; return q; }, single() { one = true; return q; },
      insert(value) { operation = "insert"; payload = value; return q; },
      upsert(value) { operation = "upsert"; payload = value; return q; },
      update(value) { operation = "update"; payload = value; return q; },
      then(resolve, reject) {
        try {
          if (auditError && table === "developer_admin_audit_log") return Promise.resolve({ error: new Error("audit unavailable") }).then(resolve, reject);
          let rows = tables[table].filter(row => filters.every(filter => filter(row)));
          if (operation === "insert") {
            const row = { ...payload, id: randomUUID(), created_at: new Date().toISOString() };
            tables[table].push(row); rows = [row];
          } else if (operation === "upsert") {
            const key = "path" in payload ? "path" : "key" in payload ? "key" : "email";
            let row = tables[table].find(row => row[key] === payload[key]);
            if (row) Object.assign(row, payload);
            else { row = { ...payload }; tables[table].push(row); }
            rows = [row];
          } else if (operation === "update") rows.forEach(row => Object.assign(row, payload));
          rows = [...rows].sort((a, b) => {
            for (const [key, ascending] of orders) {
              const result = String(a[key] || "").localeCompare(String(b[key] || ""));
              if (result) return ascending ? result : -result;
            }
            return 0;
          }).slice(0, max);
          return Promise.resolve({ data: JSON.parse(JSON.stringify(one ? rows[0] || null : rows)), error: null }).then(resolve, reject);
        } catch (error) { return Promise.reject(error).then(resolve, reject); }
      }
    };
    return q;
  } };
}

const source = fs.readFileSync(path.join(__dirname, "../supabase/functions/developer-admin/index.ts"), "utf8")
  .replace(/^import .*;\r?\n/gm, "");
const context = vm.createContext({
  URL, Request, Response, console, crypto: { randomUUID },
  Deno: { env: { get: () => undefined } },
  createClient: client, createRemoteJWKSet: () => ({}),
  jwtVerify: async token => ({ payload: { sub: "test-user", email: token === "admin" ? admin : "outsider@example.com" } }),
  serve: fn => { handler = fn; },
  fetch: async url => String(url).includes("developer-route-catalog.json")
    ? new Response(JSON.stringify({ paths: ["fugulin.html", "dimensionamento.html"] }))
    : new Response(shellPublished ? '<html><div id="premium-content-placeholder"></div><script src="premium-content-loader.js"></script></html>' : "<html>public</html>")
});
vm.runInContext(stripTypeScriptTypes(source, { mode: "strip" }), context);
const plain = value => JSON.parse(JSON.stringify(value));
async function request(method, query = "", body, token) {
  const res = await handler(new Request("https://edge.example/developer-admin" + query, {
    method, headers: token ? { Authorization: "Bearer " + token } : {},
    ...(body ? { body: JSON.stringify(body) } : {})
  }));
  return { status: res.status, body: await res.json() };
}

(async () => {
  let policy = (await request("GET", "?public=policy&path=en/fugulin.html")).body;
  assert.equal(policy.route.premium_required, true);
  assert.equal(policy.route.decision.id, "legacy", "Use the last admin panel intent, ignoring deploy and outsiders");
  assert.equal(policy.route.decision.decided_at, "2026-09-30T12:00:00Z");
  assert.equal(policy.route.decision.requested_premium, true);
  assert.equal(policy.route.canonical_path, "fugulin.html");
  assert.equal(policy.settings_decisions.stripe_portal_enabled.id, "legacy-setting");
  assert.equal(policy.settings_decisions.asaas_portal_enabled, null, "Do not invent provenance for defaults");
  assert.doesNotMatch(JSON.stringify(policy), /@|secret notes|before_state|after_state|grants|requested_by/);
  assert.equal((await request("GET")).status, 401);
  assert.equal((await request("GET", "", undefined, "outsider")).status, 403);
  assert.equal((await request("POST", "", { action: "set_setting", key: "stripe_portal_enabled", enabled: false }, "outsider")).status, 403);

  let res = await request("POST", "", { action: "set_setting", key: "stripe_portal_enabled", enabled: false, _decision: { origin: "injected" } }, "admin");
  assert.equal(res.status, 200);
  let log = tables.developer_admin_audit_log.at(-1);
  assert.equal(log.after_state.value.enabled, false);
  assert.equal(log.after_state._decision.origin, "developer_panel");
  assert.match(log.after_state._decision.reason, /desativada/);
  assert.ok(Number.isFinite(Date.parse(log.after_state._decision.decided_at)));
  policy = (await request("GET", "?public=policy")).body;
  assert.equal(policy.stripe_portal_enabled, false);
  assert.equal(policy.settings_decisions.stripe_portal_enabled.requested_enabled, false);
  assert.equal(policy.settings_decisions.stripe_portal_enabled.applied.enabled, false);

  const before = plain(tables.developer_premium_route_rules[0]);
  res = await request("POST", "", { action: "set_route", path: "fugulin.html", premium_required: false }, "admin");
  assert.equal(res.status, 200);
  log = tables.developer_admin_audit_log.at(-1);
  assert.deepEqual(plain(log.before_state), before);
  assert.equal(log.after_state.premium_required, false);
  assert.match(log.after_state._decision.reason, /Free/);
  policy = (await request("GET", "?public=policy&path=fugulin.html")).body;
  assert.equal(policy.route.decision.requested_premium, false);
  assert.equal(policy.route.decision.applied.premium_required, false);

  res = await request("POST", "", { action: "set_route", path: "dimensionamento.html", premium_required: true }, "admin");
  assert.equal(res.status, 200);
  assert.equal(res.body.route.premium_required, false, "A queued request must not become Premium early");
  log = tables.developer_admin_audit_log.at(-1);
  assert.equal(log.action, "queue_route_activation");
  assert.equal(log.after_state._decision.request_id, res.body.activation_request.request_id);
  assert.equal(log.after_state.request.requested_by, admin, "Private audit keeps full original state");
  const pendingId = res.body.activation_request.request_id;
  policy = (await request("GET", "?public=policy&path=dimensionamento.html")).body;
  assert.equal(policy.route.decision.requested_premium, true);
  assert.equal(policy.route.decision.applied.premium_required, false);
  assert.doesNotMatch(JSON.stringify(policy), /@|request_id|requested_by/);
  tables.developer_premium_route_rules.find(row => row.path === "dimensionamento.html").premium_required = true;
  policy = (await request("GET", "?public=policy&path=dimensionamento.html")).body;
  assert.equal(policy.route.decision.requested_premium, true);
  assert.equal(policy.route.decision.applied.premium_required, true, "Report current deployment state alongside original request");
  res = await request("POST", "", { action: "set_route", path: "dimensionamento.html", premium_required: false }, "admin");
  assert.equal(res.status, 200);
  assert.equal(tables.developer_premium_activation_requests[0].status, "cancelled");
  assert.equal(tables.developer_premium_activation_requests[0].request_id, pendingId);

  shellPublished = true;
  tables.premium_content_pages.push({ path: "fugulin.html", content: "<html>private clinical content</html>" });
  res = await request("POST", "", { action: "set_route", path: "fugulin.html", premium_required: true }, "admin");
  assert.equal(res.status, 200);
  assert.equal(res.body.route.premium_required, true);
  assert.equal(res.body.route.enforcement, "client_guard");

  const entitlementsBeforeGrant = plain(tables.user_entitlements);
  res = await request("POST", "", { action: "grant_email", email: "granted@example.com", reason: "private grant reason" }, "admin");
  assert.equal(res.status, 200);
  assert.equal(res.body.grant.active, true);
  log = tables.developer_admin_audit_log.at(-1);
  assert.equal(log.after_state.reason, "private grant reason");
  assert.equal(log.after_state._decision.action, "grant_email");
  assert.equal(log.after_state._decision.actor_kind, "developer");
  assert.equal(log.after_state._decision.request_id, undefined);
  res = await request("POST", "", { action: "revoke_email", email: "granted@example.com" }, "admin");
  assert.equal(res.status, 200);
  assert.equal(res.body.grant.active, false);
  log = tables.developer_admin_audit_log.at(-1);
  assert.equal(log.before_state.active, true);
  assert.equal(log.after_state.active, false);
  assert.equal(log.after_state._decision.action, "revoke_email");
  assert.deepEqual(plain(tables.user_entitlements), entitlementsBeforeGrant, "Grant auditing does not rewrite billing entitlements");

  tables.billing_identities.push({ id: "identity", email: "patient@example.com" });
  tables.user_entitlements.push(
    { user_id: "identity", plan: "premium", premium_expires_at: "2999-01-01T00:00:00Z" },
    { user_id: "expired", plan: "premium", premium_expires_at: "2000-01-01T00:00:00Z" },
    { user_id: "invalid", plan: "premium", premium_expires_at: "invalid" },
    { user_id: "free", plan: "free", premium_expires_at: null }
  );
  for (let i = 0; i < 55; i++) tables.developer_admin_audit_log.push({ id: "bulk" + i, actor_email: admin, action: "grant_email", target_type: "email_grant", target_key: "private@example.com", created_at: `2999-01-01T00:00:${String(i).padStart(2, "0")}Z`, before_state: null, after_state: { active: true } });
  res = await request("GET", "", undefined, "admin");
  assert.equal(res.status, 200);
  assert.equal(res.body.audit_log.length, 50);
  assert.equal(res.body.audit_log[0].id, "bulk54");
  assert.equal(res.body.audit_log[0].actor_email, admin);
  assert.equal(res.body.billing.active.length, 1);
  assert.equal(res.body.billing.expired.length, 1);
  assert.equal(res.body.billing.active[0].email, "patient@example.com");
  policy = (await request("GET", "?public=policy&path=fugulin.html")).body;
  assert.doesNotMatch(JSON.stringify(policy), /@|email_grant|private clinical content|premium_expires_at|private grant reason/);
  assert.equal(policy.route.decision.action, "set_route");

  auditError = true;
  assert.equal((await request("GET", "?public=policy&path=fugulin.html")).status, 500, "Do not fabricate provenance if audit storage is unavailable");
  console.log("Developer decision provenance: legacy intent, inheritance, sanitization, settings, mutations, pending/cancellation, current state, auth, last 50 audit entries and billing expiration passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
