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

    // O build deve usar a versão completa do template. A shellificação ocorre
    // somente depois da sincronização privada durante o deploy.
    if (/premium-content-loader\.js/i.test(local) || /premium-content-placeholder/i.test(local)) {
        throw new Error("Template canônico de Downton está shellificado antes da regeneração.");
    }

    return local;
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
    },
    {
        slug: "lachs",
        fullName: "Escala de Lachs",
        description: "Ficha da Escala de Lachs para avaliação da vulnerabilidade do idoso, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de Lachs, vulnerabilidade do idoso, avaliação geriátrica, idosos, gerontologia, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de Lachs para avaliação da vulnerabilidade do idoso em uma página.",
        aspect: ["Vulnerabilidade do Idoso", "Gerontologia", "Avaliação Geriátrica"],
        menu: "Formulário da Escala de Lachs"
    },
    {
        slug: "lanss",
        fullName: "Escala de LANSS",
        description: "Ficha da Escala de LANSS para avaliação de dor neuropática, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de LANSS, dor neuropática, avaliação da dor, neurologia, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de LANSS para avaliação de dor neuropática em uma página.",
        aspect: ["Dor Neuropática", "Avaliação da Dor", "Neurologia"],
        menu: "Formulário da Escala de LANSS"
    },
    {
        slug: "lawton",
        fullName: "Escala de Lawton",
        description: "Ficha da Escala de Lawton para avaliação das atividades instrumentais de vida diária, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de Lawton, atividades instrumentais de vida diária, AIVD, idosos, gerontologia, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de Lawton para avaliação das atividades instrumentais de vida diária em uma página.",
        aspect: ["Atividades Instrumentais de Vida Diária", "Gerontologia", "Avaliação Funcional"],
        menu: "Formulário da Escala de Lawton"
    },
    {
        slug: "meows",
        fullName: "Escala de MEOWS",
        description: "Ficha da Escala de MEOWS para avaliação de deterioração clínica materna, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de MEOWS, deterioração clínica materna, obstetrícia, alerta obstétrico, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de MEOWS para avaliação de deterioração clínica materna em uma página.",
        aspect: ["Deterioração Clínica Materna", "Obstetrícia", "Alerta Obstétrico"],
        menu: "Formulário da Escala de MEOWS"
    },
    {
        slug: "news",
        fullName: "Escala de NEWS",
        description: "Ficha da Escala de NEWS para avaliação de deterioração clínica do paciente, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de NEWS, NEWS2, deterioração clínica, alerta precoce, sinais vitais, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de NEWS para avaliação de deterioração clínica do paciente em uma página.",
        aspect: ["Deterioração Clínica", "Alerta Precoce", "Sinais Vitais"],
        menu: "Formulário da Escala de NEWS"
    },
    {
        slug: "nips",
        fullName: "Escala de NIPS",
        description: "Ficha da Escala de NIPS para avaliação de dor em recém-nascidos, preenchimento e impressão em formulário de uma página.",
        keywords: "Escala de NIPS, dor neonatal, recém-nascido, neonatologia, avaliação da dor, formulário para imprimir, enfermagem",
        twitter: "Baixe ou imprima a ficha da Escala de NIPS para avaliação da dor em recém-nascidos em uma página.",
        aspect: ["Dor Neonatal", "Neonatologia", "Avaliação da Dor"],
        menu: "Formulário da Escala de NIPS"
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
    const base = loadFullTemplate();

    for (const e of escalas) {
        const aspect = JSON.stringify(e.aspect);
        let out = base;

        out = out.split("Formulário da Escala de Downton para Imprimir - Calculadoras de Enfermagem")
            .join(`Formulário da ${e.fullName} para Imprimir - Calculadoras de Enfermagem`);
        out = out.split("Formulário da Escala de Downton para Imprimir")
            .join(`Formulário da ${e.fullName} para Imprimir`);
        out = out.split("Formulário da Escala de Downton")
            .join(`Formulário da ${e.fullName}`);
        out = out.split(ORIG_DESC).join(e.description);
        out = out.split(ORIG_KEYWORDS).join(e.keywords);
        out = out.split(ORIG_TWITTER).join(e.twitter);
        out = out.split(ORIG_ABOUT).join(`"name":"${e.fullName}","aspect":${aspect}`);
        out = out.split("formulario_escala_de_downton").join(`formulario_escala_de_${e.slug}`);

        out = tornarInterfaceBilingue(out, e);

        const file = path.join(ROOT, `formulario_escala_de_${e.slug}.html`);
        fs.writeFileSync(file, out, "utf8");
        console.log("OK -> " + path.basename(file));
    }

    console.log("Concluído: " + escalas.length + " arquivos gerados.");
})();
