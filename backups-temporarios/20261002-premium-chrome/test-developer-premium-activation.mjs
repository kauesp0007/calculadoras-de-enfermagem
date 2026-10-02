import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { requestedPremiumPaths } from "./developer-premium-eligible.mjs";

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "premium-activation-"));
const queue = path.join(tmp, "requests.json");
const root = path.join(tmp, "site");
await fs.mkdir(path.join(root, "conta"), { recursive: true });
await fs.mkdir(path.join(root, "en"));
await fs.writeFile(path.join(root, "conta/developer-route-catalog.json"), JSON.stringify({ paths: ["en/missao.html"] }));
await fs.writeFile(path.join(root, "en/missao.html"), "<html><head><title>Missão</title></head><body>Conteúdo público</body></html>");
await fs.writeFile(path.join(root, "premium-content-manifest.json"), JSON.stringify({ scope: { languages: ["en"] }, exact: [], patterns: [] }));
await fs.mkdir(path.join(root, "scripts"));
for (const name of ["developer-premium-eligible.mjs", "migrate-premium-content.mjs", "shellify-premium-public-pages.mjs"]) {
  await fs.copyFile(path.join(process.cwd(), "scripts", name), path.join(root, "scripts", name));
}
await fs.writeFile(queue, JSON.stringify([{ path: "en/missao.html", request_id: "request-1" }]));
process.env.PREMIUM_REQUESTS_FILE = queue;
assert.deepEqual(await requestedPremiumPaths(root), ["en/missao.html"]);
await fs.writeFile(queue, JSON.stringify([{ path: "en/../conta/login.html" }]));
await assert.rejects(requestedPremiumPaths(root), /Invalid Premium activation path/);
await fs.writeFile(queue, JSON.stringify([{ path: "en/missao.html", request_id: "request-1" }]));

let shellPublished = false;
let pending = true;
let activations = 0;
let privateContent = null;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  res.setHeader("Content-Type", "application/json");
  if (url.pathname === "/en/missao.html") {
    res.setHeader("Content-Type", "text/html");
    res.end(shellPublished ? '<html><div id="premium-content-placeholder"></div><script src="/js/access/premium-content-loader.js"></script></html>' : "<html>Conteúdo público</html>");
  } else if (url.pathname.endsWith("/developer_premium_activation_requests")) {
    res.end(JSON.stringify(pending ? [{ path: "en/missao.html", request_id: "request-1" }] : []));
  } else if (url.pathname.endsWith("/premium_content_pages")) {
    if (req.method === "POST") {
      privateContent = await new Promise(resolve => { let raw = ""; req.on("data", chunk => raw += chunk); req.on("end", () => resolve(JSON.parse(raw).content)); });
      res.end("{}");
    } else {
      res.end(JSON.stringify(privateContent ? [{ path: "en/missao.html", content: privateContent }] : []));
    }
  } else if (url.pathname.endsWith("/rpc/activate_developer_premium_route")) {
    assert.equal(req.method, "POST");
    const body = await new Promise(resolve => { let raw = ""; req.on("data", chunk => raw += chunk); req.on("end", () => resolve(JSON.parse(raw))); });
    assert.equal(body.p_path, "en/missao.html");
    assert.equal(body.p_request_id, "request-1");
    pending = false;
    activations++;
    res.end("true");
  } else {
    res.statusCode = 404;
    res.end("{}");
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const env = {
  ...process.env, SUPABASE_URL: `http://127.0.0.1:${port}`,
  SUPABASE_SERVICE_ROLE_KEY: "test-only", PREMIUM_PUBLIC_SITE: `http://127.0.0.1:${port}`,
  PREMIUM_REQUESTS_FILE: queue, PREMIUM_VERIFY_ATTEMPTS: "1"
};
async function run(mode, script = path.join(process.cwd(), "scripts/developer-premium-requests.mjs"), cwd = process.cwd(), expectedCode = 0) {
  const child = spawn(process.execPath, [script, mode], { env, cwd });
  let stdout = "", stderr = "";
  child.stdout.on("data", chunk => stdout += chunk);
  child.stderr.on("data", chunk => stderr += chunk);
  const code = await new Promise(resolve => child.on("close", resolve));
  assert.equal(code, expectedCode, stderr);
  return stdout + stderr;
}

try {
  assert.match(await run("--check"), /"pending":1/);
  assert.match(await run("--fetch"), /"queued":1/);
  const migration = path.join(root, "scripts/migrate-premium-content.mjs");
  const shellifier = path.join(root, "scripts/shellify-premium-public-pages.mjs");
  assert.match(await run("--apply", migration, root), /"migrated": 1/);
  assert.match(privateContent, /Conteúdo público/);
  assert.match(await run("--run", shellifier, root), /"changed":1/);
  const shell = await fs.readFile(path.join(root, "en/missao.html"), "utf8");
  assert.match(shell, /premium-content-placeholder/);
  assert.doesNotMatch(shell, /Conteúdo público/);
  // The worker must not enable Premium while the live page still exposes its full HTML.
  assert.match(await run("--finalize", undefined, undefined, 1), /Shell ainda não confirmado no domínio/);
  assert.equal(activations, 0);
  shellPublished = true;
  assert.match(await run("--finalize"), /"activated":1/);
  assert.equal(activations, 1);
  assert.match(await run("--check"), /"pending":0/);
  assert.match(await run("--finalize"), /"activated":0/);
  console.log("Developer Premium activation pipeline: PASS");
} finally {
  server.close();
  await fs.rm(tmp, { recursive: true, force: true });
}
