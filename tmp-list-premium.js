// Lista premium users (junior + senior) com detalhes — leitura apenas.
const fs = require("fs");
const crypto = require("crypto");

const SA_PATH = "C:/Users/kaues/Downloads/calculadoras-enfermagem-firebase-adminsdk-fbsvc-ef98cadc5b.json";
const sa = JSON.parse(fs.readFileSync(SA_PATH, "utf8"));
const PROJ = sa.project_id;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJ}/databases/(default)/documents`;

function b64url(s) { return Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }

async function getToken() {
    const now = Math.floor(Date.now() / 1000);
    const h = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const c = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: sa.token_uri, iat: now, exp: now + 3600 }));
    const si = h + "." + c;
    const sig = crypto.sign("sha256", Buffer.from(si), crypto.createPrivateKey(sa.private_key)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const res = await fetch(sa.token_uri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: si + "." + sig }) });
    const d = await res.json();
    return d.access_token;
}

(async () => {
    const token = await getToken();
    const res = await fetch(`${BASE}/users?pageSize=200`, { headers: { Authorization: `Bearer ${token}` } });
    const txt = await res.text();
    console.log("status:", res.status);
    const json = JSON.parse(txt);
    const docs = json.documents || [];
    const premium = [];
    for (const d of docs) {
        const f = d.fields || {};
        const plan = f.plan && f.plan.stringValue ? f.plan.stringValue : "(none)";
        if (plan === "junior" || plan === "senior") {
            const uid = d.name.split("/").pop();
            const email = f.email && f.email.stringValue ? f.email.stringValue : "(?)";
            const name = f.displayName && f.displayName.stringValue ? f.displayName.stringValue : "";
            const expires = f.planExpiresAt && f.planExpiresAt.timestampValue ? f.planExpiresAt.timestampValue : "";
            const lifetime = f.lifetime && f.lifetime.booleanValue === true ? "LIFETIME" : "";
            premium.push({ uid, email, name, plan, expires, lifetime });
        }
    }
    console.log("total users:", docs.length);
    console.log("premium (junior+senior):", premium.length);
    console.log(JSON.stringify(premium, null, 2));
})();
