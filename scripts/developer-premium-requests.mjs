#!/usr/bin/env node
import fs from "node:fs/promises";

const base = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const file = process.env.PREMIUM_REQUESTS_FILE;
const site = process.env.PREMIUM_PUBLIC_SITE || "https://www.calculadorasdeenfermagem.com.br";
const verifyAttempts = process.env.PREMIUM_VERIFY_ATTEMPTS === "1" ? 1 : 24;
const mode = process.argv[2];
if (!base || !key || !["--check", "--fetch", "--finalize"].includes(mode)) {
  throw new Error("Missing Premium queue credentials or invalid operation");
}
if (mode !== "--check" && !file) throw new Error("PREMIUM_REQUESTS_FILE is required");

async function api(path, options = {}) {
  const res = await fetch(base + "/rest/v1/" + path, {
    ...options,
    headers: { apikey: key, Authorization: "Bearer " + key, Accept: "application/json", ...options.headers }
  });
  if (!res.ok) throw new Error("Premium queue API " + res.status + ": " + await res.text());
  return res.json();
}

async function pending() {
  return api("developer_premium_activation_requests?select=path,request_id&status=eq.pending&order=requested_at.asc&limit=200");
}

if (mode === "--check") {
  const rows = await pending();
  if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, "should_deploy=" + (rows.length ? "true" : "false") + "\n");
  console.log(JSON.stringify({ pending: rows.length }));
}

if (mode === "--fetch") {
  const rows = await pending();
  await fs.writeFile(file, JSON.stringify(rows) + "\n", { mode: 0o600 });
  console.log(JSON.stringify({ queued: rows.length }));
}

if (mode === "--finalize") {
  const rows = JSON.parse(await fs.readFile(file, "utf8"));
  let activated = 0;
  const unpublished = [];
  for (const row of rows) {
    const current = await api("developer_premium_activation_requests?select=path,request_id&path=eq." + encodeURIComponent(row.path) + "&status=eq.pending&limit=1");
    if (current[0]?.request_id !== row.request_id) continue;
    const privatePages = await api("premium_content_pages?select=content&path=eq." + encodeURIComponent(row.path) + "&limit=1");
    const content = String(privatePages[0]?.content || "");
    if (!/<html\b/i.test(content) || /id=["']premium-content-placeholder["']/i.test(content)) {
      throw new Error("Private Premium page missing or incomplete: " + row.path);
    }
    let published = false;
    for (let attempt = 0; attempt < verifyAttempts; attempt++) {
      let observed = "network_error";
      try {
        const res = await fetch(site + "/" + row.path + "?developer_check=" + crypto.randomUUID(), { cache: "no-store" });
        observed = "HTTP " + res.status;
        if (res.ok) {
          const html = await res.text();
          published = /id=["']premium-content-placeholder["']/i.test(html) && /premium-content-loader\.js/i.test(html);
          if (!published) observed += " sem shell";
        }
      } catch (error) {
        observed += ": " + String(error);
      }
      if (published) break;
      if (attempt === 0 || (attempt + 1) % 6 === 0) console.warn("Aguardando publicação de " + row.path + ": " + observed + " (" + (attempt + 1) + "/" + verifyAttempts + ")");
      if (attempt + 1 < verifyAttempts) await new Promise(resolve => setTimeout(resolve, 8000));
    }
    if (!published) {
      unpublished.push(row.path);
      continue;
    }
    const result = await api("rpc/activate_developer_premium_route", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ p_path: row.path, p_request_id: row.request_id })
    });
    if (result) activated++;
  }
  console.log(JSON.stringify({ requested: rows.length, activated, unpublished }));
  if (unpublished.length) throw new Error("Shell ainda não confirmado no domínio: " + unpublished.join(", "));
}
