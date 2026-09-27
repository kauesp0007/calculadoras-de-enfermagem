/*
 * Gerador temporário: cria os formulários de escalas (Glasgow, Gosnell, Hamilton,
 * Hendrich, Humpty Dumpty, Johns Hopkins, Jouvet) replicando o padrão canônico de
 * formulario_escala_de_downton.html (mesmo padrão de formulario_escala_curb65.html).
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const BASE = path.join(ROOT, "formulario_escala_de_downton.html");

function loadFullTemplate() {
    const local = fs.readFileSync(BASE, "utf8");

    // A rota canônica fica shellificada após o deploy. Para o próximo build,
    // o conteúdo completo é recuperado do catálogo privado com a service key.
    if (!/premium-content-loader\.js/i.test(local) && !/premium-content-placeholder/i.test(local)) {
        return Promise.resolve(local);
    }

    const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!SUPABASE_URL || !SERVICE_KEY) {
        throw new Error("Template Premium de Downton está shellificado e o catálogo privado não foi configurado.");
    }

    const url = SUPABASE_URL +
        "/rest/v1/premium_content_pages?select=content&path=eq.formulario_escala_de_downton.html&limit=1";

    return fetch(url, {
        headers: {
            apikey: SERVICE_KEY,
            Authorization: "Bearer " + SERVICE_KEY,
            Accept: "application/json"
        }
    }).then(async (response) => {
        if (!response.ok) throw new Error("Falha ao recuperar template Premium: HTTP " + response.status);
        const rows = await response.json();
        const privateContent = Array.isArray(rows) ? rows[0]?.content : null;
        if (!privateContent) throw new Error("Template Premium de Downton não encontrado no catálogo privado.");
        return privateContent;
    });
}

const escalas = [
    {
        slug: "glasgow",
        fullName: "Escala de Coma de Glasgow",
        description: "Ficha da Escala de Coma de Glasgow para avaliação do nível de consciência por abertura ocular, resposta verbal e resposta motora, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de Coma de Glasgow, escala de glasgow, ECG, nível de consciência, neurologia, trauma, abertura ocular, resposta verbal, resposta motora, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de Coma de Glasgow para avaliação do nível de consciência em uma página.",
        aspect: ["Nível de Consciência", "Neurologia", "Trauma", "Escore Clínico"],
        menu: "Formulário da Escala de Glasgow"
    },
    {
        slug: "gosnell",
        fullName: "Escala de Gosnell",
        description: "Ficha da Escala de Gosnell para avaliação do risco de queda em pacientes e idosos, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de Gosnell, escala gosnell, risco de queda, prevenção de quedas, idosos, gerontologia, segurança do paciente, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de Gosnell para avaliação do risco de queda em uma página.",
        aspect: ["Risco de Queda", "Segurança do Paciente", "Gerontologia", "Escore Clínico"],
        menu: "Formulário da Escala de Gosnell"
    },
    {
        slug: "hamilton",
        fullName: "Escala de Hamilton",
        description: "Ficha da Escala de Hamilton para avaliação da intensidade de ansiedade, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de Hamilton, escala hamilton, HAM-A, ansiedade, avaliação de ansiedade, saúde mental, psiquiatria, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de Hamilton para avaliação da intensidade de ansiedade em uma página.",
        aspect: ["Ansiedade", "Saúde Mental", "Avaliação Psiquiátrica"],
        menu: "Formulário da Escala de Hamilton"
    },
    {
        slug: "hendrich",
        fullName: "Escala de Hendrich II",
        description: "Ficha da Escala de Hendrich II para avaliação do risco de queda em pacientes hospitalizados, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de Hendrich, escala hendrich II, risco de queda, prevenção de quedas, segurança do paciente, hospital, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de Hendrich II para avaliação do risco de queda em uma página.",
        aspect: ["Risco de Queda", "Segurança do Paciente", "Escore Clínico"],
        menu: "Formulário da Escala de Hendrich"
    },
    {
        slug: "humpty",
        fullName: "Escala de Humpty Dumpty",
        description: "Ficha da Escala de Humpty Dumpty para avaliação do risco de queda em pacientes pediátricos, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de Humpty Dumpty, escala humpty dumpty, risco de queda, pediatria, prevenção de quedas, segurança do paciente, criança, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de Humpty Dumpty para avaliação do risco de queda em pediatria em uma página.",
        aspect: ["Risco de Queda", "Pediatria", "Segurança do Paciente"],
        menu: "Formulário da Escala de Humpty Dumpty"
    },
    {
        slug: "johns",
        fullName: "Escala de Johns Hopkins",
        description: "Ficha da Escala de Johns Hopkins para avaliação do risco de queda em pacientes adultos, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de Johns Hopkins, escala johns hopkins, risco de queda, prevenção de quedas, segurança do paciente, hospital, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de Johns Hopkins para avaliação do risco de queda em uma página.",
        aspect: ["Risco de Queda", "Segurança do Paciente", "Escore Clínico"],
        menu: "Formulário da Escala de Johns Hopkins"
    },
    {
        slug: "jouvet",
        fullName: "Escala de Jouvet",
        description: "Ficha da Escala de Jouvet para avaliação do nível de consciência, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de Jouvet, escala jouvet, nível de consciência, avaliação neurológica, coma, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de Jouvet para avaliação do nível de consciência em uma página.",
        aspect: ["Nível de Consciência", "Neurologia", "Escore Clínico"],
        menu: "Formulário da Escala de Jouvet"
    }
];

const ORIG_DESC = "Ficha da Escala de Downton para avaliação de risco de queda em idosos, preenchimento e impressão em formulário de uma página.";
const ORIG_KEYWORDS = "Escala de Downton, escala downton, risco de queda, idosos, formulário para imprimir, gerontologia, enfermagem";
const ORIG_TWITTER = "Baixe ou imprima a ficha da Escala de Downton para avaliação de risco de queda em idosos em uma página.";
const ORIG_ABOUT = '"name":"Escala de Downton","aspect":["Risco de Queda","Gerontologia","Escore Clínico"]';

function bilíngue(pt, en) {
    return '<span class="block">' + pt + '</span><span class="block text-[0.68em] font-normal opacity-80" lang="en">' + en + '</span>';
}

function tornarInterfaceBilingue(html, e) {
    const english = {
        "Formulário para impressão": "Printable form",
        "Formulários": "Forms",
        "Sobre este formulário": "About this form",
        "Adicionar aos favoritos": "Add to favorites",
        "Favoritar": "Favorite",
        "Compartilhar": "Share",
        "Imprimir": "Print",
        "Reportar correção": "Report a correction",
        "Ver resultado": "View result",
        "Ir para o formulário": "Go to form",
        "Diagnósticos NANDA": "NANDA diagnoses",
        "Recursos sobre a escala": "Scale resources",
        "Evidências": "Evidence",
        "Downloads": "Download",
        "Referências e evidências": "References and evidence",
        "Referências": "References",
        "Nota de governança": "Governance note",
        "Início": "Home"
    };
    let out = html;
    for (const pt of Object.keys(english)) {
        const en = english[pt];
        const escaped = pt.split("").map(ch => "\\.^$*+?()[]{}|".includes(ch) ? "\\" + ch : ch).join("");
        const re = new RegExp(">(\\s*)" + escaped + "(\\s*)<", "g");
        out = out.replace(re, function(_match, before, after) {
            return ">" + before + bilíngue(pt, en) + after + "<";
        });
    }
    const heroPt = {
        glasgow: "Ficha de avaliação do nível de consciência para preenchimento e impressão.",
        gosnell: "Ficha de avaliação do risco de queda para preenchimento e impressão.",
        hamilton: "Ficha de avaliação da intensidade de ansiedade para preenchimento e impressão.",
        hendrich: "Ficha de avaliação do risco de queda em pacientes hospitalizados para preenchimento e impressão.",
        humpty: "Ficha de avaliação do risco de queda em pacientes pediátricos para preenchimento e impressão.",
        johns: "Ficha de avaliação do risco de queda em pacientes adultos para preenchimento e impressão.",
        jouvet: "Ficha de avaliação do nível de consciência para preenchimento e impressão."
    }[e.slug];
    const heroEn = {
        glasgow: "Consciousness level assessment sheet for filling and printing.",
        gosnell: "Fall risk assessment sheet for filling and printing.",
        hamilton: "Anxiety intensity assessment sheet for filling and printing.",
        hendrich: "Fall risk assessment sheet for hospitalized patients.",
        humpty: "Pediatric fall risk assessment sheet.",
        johns: "Adult fall risk assessment sheet.",
        jouvet: "Consciousness level assessment sheet for filling and printing."
    }[e.slug];
    if (heroPt && heroEn) out = out.split(heroPt).join(bilíngue(heroPt, heroEn));
    return out;
}


(async function(){
const base = await loadFullTemplate();
for (const e of escalas) {
    const aspect = JSON.stringify(e.aspect);
    let out = base;

    // Título completo (title tag + schema name)
    out = out.split("Formulário da Escala de Downton para Imprimir - Calculadoras de Enfermagem").join(`Formulário da ${e.fullName} para Imprimir - Calculadoras de Enfermagem`);
    // Título curto (og:title, twitter:title, caption)
    out = out.split("Formulário da Escala de Downton para Imprimir").join(`Formulário da ${e.fullName} para Imprimir`);
    // Breadcrumb
    out = out.split("Formulário da Escala de Downton").join(`Formulário da ${e.fullName}`);
    // Descrição
    out = out.split(ORIG_DESC).join(e.description);
    // Keywords
    out = out.split(ORIG_KEYWORDS).join(e.keywords);
    // Twitter description
    out = out.split(ORIG_TWITTER).join(e.twitter);
    // About (Schema.org)
    out = out.split(ORIG_ABOUT).join(`"name":"${e.fullName}","aspect":${aspect}`);
    // Slug nas URLs
    out = out.split("formulario_escala_de_downton").join(`formulario_escala_de_${e.slug}`);
    out = tornarInterfaceBilingue(out, e);

    const file = path.join(ROOT, `formulario_escala_de_${e.slug}.html`);
    fs.writeFileSync(file, out, "utf8");
    console.log("OK -> " + path.basename(file));
}

console.log("Concluído: " + escalas.length + " arquivos gerados.");
})();
