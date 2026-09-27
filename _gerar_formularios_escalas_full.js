/*
 * Gerador de formulários de escalas — CONTEÚDO COMPLETO.
 * Recupera o último conteúdo completo da Escala de Downton no catálogo privado
 * quando a rota canônica do repositório já foi shellificada.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const TEMPLATE = path.join(ROOT, "formulario_escala_de_downton.html");

async function loadCanonicalTemplate() {
    const local = fs.readFileSync(TEMPLATE, "utf8");
    if (!/premium-content-loader\.js/i.test(local) && !/premium-content-placeholder/i.test(local)) return local;

    const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!SUPABASE_URL || !SERVICE_KEY) {
        throw new Error("Template Premium de Downton está shellificado e o catálogo privado não foi configurado.");
    }

    const url = SUPABASE_URL +
        "/rest/v1/premium_content_pages?select=content&path=eq.formulario_escala_de_downton.html&limit=1";
    const response = await fetch(url, {
        headers: {
            apikey: SERVICE_KEY,
            Authorization: "Bearer " + SERVICE_KEY,
            Accept: "application/json"
        }
    });
    if (!response.ok) throw new Error("Falha ao recuperar template Premium: HTTP " + response.status);
    const rows = await response.json();
    const privateContent = Array.isArray(rows) ? rows[0]?.content : null;
    if (!privateContent || /premium-content-placeholder/i.test(privateContent)) {
        throw new Error("Conteúdo completo de Downton não encontrado no catálogo privado.");
    }
    return privateContent;
}


