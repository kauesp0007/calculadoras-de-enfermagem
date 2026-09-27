#!/usr/bin/env node
"use strict";

/**
 * Validador canônico dos 30 formulários de escalas para impressão.
 * O catálogo privado do Supabase é a fonte canônica do conteúdo Premium.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE = "https://www.calculadorasdeenfermagem.com.br/";
const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const FORM_PATHS = [
  "formulario_escala_de_perroca.html",
  "formulario_de_fugulin.html",
  "formulario_meem.html",
  "formulario_impresso_sbar.html",
  "formulario_impresso_saep.html",
  "formulario_bishop.html",
  "formulario_bps.html",
  "formulario_cam.html",
  "formulario_capurro.html",
  "formulario_escala_cincinnati.html",
  "formulario_escala_curb65.html",
  "formulario_morse.html",
  "formulario_escala_de_four.html",
  "formulario_escala_de_flacc.html",
  "formulario_escala_de_fast.html",
  "formulario_escala_de_elpo.html",
  "formulario_escala_de_downton.html",
  "formulario_escala_de_glasgow.html",
  "formulario_escala_de_gosnell.html",
  "formulario_escala_de_hamilton.html",
  "formulario_escala_de_hendrich.html",
  "formulario_escala_de_humpty.html",
  "formulario_escala_de_johns.html",
  "formulario_escala_de_jouvet.html",
  "formulario_escala_de_lachs.html",
  "formulario_escala_de_lanss.html",
  "formulario_escala_de_lawton.html",
  "formulario_escala_de_meows.html",
  "formulario_escala_de_news.html",
  "formulario_escala_de_nips.html"
];

function fail(message) {
  throw new Error(message);
}

function count(re, html) {
  return (html.match(re) || []).length;
}

function linkHas(html, rel, href) {
  const wantedRel = String(rel).toLowerCase();
  const wantedHref = String(href).toLowerCase();
  return (html.match(/<link\b[^>]*>/gi) || []).some(raw => {
    const tag = raw.toLowerCase();
    return (tag.includes('rel="' + wantedRel + '"') || tag.includes("rel='" + wantedRel + "'")) &&
           (tag.includes('href="' + wantedHref + '"') || tag.includes("href='" + wantedHref + "'"));
  });
}

function validateFull(rel, html, source) {
  const expected = BASE + rel;

  if (!/<title>[^<]+<\/title>/i.test(html)) fail(source + ": sem <title>: " + rel);
  if (!/<meta\b[^>]*name=["']description["'][^>]*>/i.test(html)) fail(source + ": sem meta description: " + rel);
  if (!linkHas(html, "canonical", expected)) fail(source + ": canonical incorreto/ausente: " + rel);

  if (!/hreflang=["']pt-br["']/i.test(html) || !/hreflang=["']x-default["']/i.test(html)) {
    fail(source + ": hreflang pt-br/x-default ausente: " + rel);
  }

  if (!/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html)) fail(source + ": JSON-LD ausente: " + rel);
  if (!linkHas(html, "icon", "/favicon.ico")) fail(source + ": favicon ausente: " + rel);
  if (!/<script\b[^>]*src=["']\/global-scripts\.js["'][^>]*>/i.test(html)) fail(source + ": global-scripts.js ausente: " + rel);
  if (!/<script\b[^>]*src=["']\/lang-selector\.js["'][^>]*>/i.test(html)) fail(source + ": lang-selector.js ausente: " + rel);

  const markerCount = count(/MULTIPLEX_AD_RESERVED_START/gi, html);
  const slotCount = count(/data-ad-slot=["']3341197364["']/gi, html);
  const insCount = count(/<ins\b[^>]*class=["'][^"']*adsbygoogle[^"']*["'][^>]*>/gi, html);
  const formatCount = count(/data-ad-format=["']autorelaxed["']/gi, html);

  if (markerCount !== 1 || slotCount !== 1 || insCount < 1 || formatCount !== 1) {
    fail(source + ": bloco Multiplex canônico ausente/incompleto/duplicado: " + rel +
      " (marker=" + markerCount + ", slot=" + slotCount + ", ins=" + insCount + ", format=" + formatCount + ")");
  }

  if (!/id=["']footer-placeholder["']/i.test(html)) fail(source + ": footer-placeholder ausente: " + rel);
}

function validatePublicShell(rel, html) {
  if (!/<html\b[^>]*lang=["']pt-BR["']/i.test(html)) fail("Shell público sem lang pt-BR: " + rel);
  if (!/<title>[^<]+<\/title>/i.test(html)) fail("Shell público sem title: " + rel);
  if (!/<meta\b[^>]*name=["']description["']/i.test(html)) fail("Shell público sem meta description: " + rel);

  const expected = BASE + rel;
  if (!linkHas(html, "canonical", expected)) fail("Shell público sem canonical autorreferente: " + rel);

  if (!/hreflang=["']pt-br["']/i.test(html) || !/hreflang=["']x-default["']/i.test(html)) {
    fail("Shell público sem hreflang pt-br/x-default: " + rel);
  }
  if (!/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html)) fail("Shell público sem JSON-LD: " + rel);
  if (!linkHas(html, "icon", "/favicon.ico")) fail("Shell público sem favicon: " + rel);
  if (!/<script\b[^>]*src=["']\/global-scripts\.js["'][^>]*>/i.test(html)) fail("Shell público sem global-scripts.js: " + rel);
  if (!/<script\b[^>]*src=["']\/lang-selector\.js["'][^>]*>/i.test(html)) fail("Shell público sem lang-selector.js: " + rel);
  if (!/<script\b[^>]*src=["']\/js\/access\/premium-content-loader\.js["'][^>]*>/i.test(html)) fail("Shell público sem premium-content-loader.js: " + rel);
  if (!/id=["']premium-content-placeholder["']/i.test(html)) fail("Shell público sem placeholder Premium: " + rel);
}

async function catalogRows() {
  if (!SUPABASE_URL || !SERVICE_KEY) fail("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes para validar o catálogo Premium.");

  const url = SUPABASE_URL + "/rest/v1/premium_content_pages?select=path,content&path=in.(" +
    FORM_PATHS.map(encodeURIComponent).join(",") + ")";

  const response = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: "Bearer " + SERVICE_KEY,
      Accept: "application/json"
    }
  });

  if (!response.ok) fail("Supabase HTTP " + response.status + " ao consultar o catálogo Premium.");
  return await response.json();
}

async function main() {
  const publicMode = process.argv.includes("--public");
  const rows = await catalogRows();
  const byPath = new Map((Array.isArray(rows) ? rows : []).map(row => [row.path, row.content]));

  if (byPath.size !== FORM_PATHS.length) {
    const missing = FORM_PATHS.filter(rel => !byPath.has(rel));
    fail("Catálogo Premium incompleto: " + missing.join(", "));
  }

  for (const rel of FORM_PATHS) {
    validateFull(rel, byPath.get(rel), "Catálogo Premium");
  }

  if (publicMode) {
    for (const rel of FORM_PATHS) {
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs)) fail("Formulário público ausente: " + rel);
      validatePublicShell(rel, fs.readFileSync(abs, "utf8"));
    }
  }

  console.log(JSON.stringify({
    ok: true,
    forms: FORM_PATHS.length,
    catalog: "canonical",
    multiplex: "1/1 em cada formulário",
    publicShellsValidated: publicMode
  }, null, 2));
}

main().catch(error => {
  console.error("ERRO: " + error.message);
  process.exit(1);
});
