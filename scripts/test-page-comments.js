const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const client = read("js/page-comments.js");
const endpoint = read("supabase/functions/page-comments/index.ts");
const migration = read("supabase/migrations/20261012062437_page_comments_v2_rating_privacy.sql");
const globalScripts = read("global-scripts.js");
const config = read("supabase/config.toml");
const developer = read("conta/desenvolvedor.html");
const premiumLoader = read("js/access/premium-content-loader.js");

assert.match(client, /TARGET_COUNT = 204/);
assert.match(client, /maxlength/i);
assert.match(client, /comment\.length > 200/);
assert.match(client, /Péssimo/);
assert.match(client, /Ruim/);
assert.match(client, /Bom/);
assert.match(client, /Ótimo/);
assert.match(client, /Comentar anônimo/);
assert.match(client, /insertBeforeAds/);
assert.match(client, /placeAfterResult/);
assert.match(client, /requestIdleCallback|DOMContentLoaded/);
assert.match(client, /__INIT_PAGE_COMMENTS_V2/);
assert.match(client, /pageCommentsBoundV2/);

assert.match(endpoint, /ALLOWED_PAGES/);
assert.match(endpoint, /page_comment_contacts/);
assert.match(endpoint, /is_anonymous/);
assert.match(endpoint, /rating/);
assert.doesNotMatch(endpoint, /email:\s*row\.email/);
assert.match(endpoint, /comment\.length > 200/);

assert.match(migration, /page_comments_comment_length_chk/);
assert.match(migration, /rating between 1 and 4/);
assert.match(migration, /create table if not exists public\.page_comment_contacts/);
assert.match(migration, /revoke all on table public\.page_comment_contacts from anon, authenticated/);

assert.match(globalScripts, /loadPageCommentsV2/);
assert.match(globalScripts, /\/js\/page-comments\.js/);
assert.match(config, /\[functions\.page-comments\]\s+verify_jwt = false/);
assert.match(developer, /Lista de comentários/);
assert.match(developer, /page_comment_count/);
assert.match(premiumLoader, /__INIT_PAGE_COMMENTS_V2/);

console.log("Page comments static audit passed.");
