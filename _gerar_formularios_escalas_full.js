/*
 * Gerador de formulários de escalas — CONTEÚDO COMPLETO (não shell).
 *
 * Template: backups-temporarios/formulario_escala_de_downton.html.20260919-094500.bak
 * (conteúdo completo pré-shell: card "Sobre este formulário", iframe do PDF 100%,
 *  botão Downloads, referências, nota de governança, footer e anúncio multiplex).
 *
 * O conteúdo completo é o modelo canônico. A shellificação + migração para o
 * catálogo privado (premium_content_pages) é feita pelo CI de deploy
 * (migrate-premium-content.mjs --apply + shellify-premium-public-pages.mjs).
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const TEMPLATE = path.join(ROOT, "formulario_escala_de_downton.html");

function loadCanonicalTemplate() {
    const source = fs.readFileSync(TEMPLATE, "utf8");
    if (/premium-content-loader\.js/i.test(source) || /premium-content-placeholder/i.test(source)) {
        throw new Error(
            "formulario_escala_de_downton.html está shellificado. " +
            "Este gerador deve receber o conteúdo completo antes da shellificação."
        );
    }
    return source;
}

// DNS prefetch/preconnect (Core Web Vitals) — inserido após o viewport.
const DNS_BLOCK = '<link href="//googleads.g.doubleclick.net" rel="dns-prefetch"/>
<link href="//pagead2.googlesyndication.com" rel="dns-prefetch"/>
<link href="//pagead2.googlesyndication.com" rel="preconnect" crossorigin/>
';

const escalas = [
    { slug: "glasgow", pdf: "Ficha_Impressao_Escala_Glasgow.pdf", fullName: "Escala de Coma de Glasgow", topic: "avaliação do nível de consciência", chip: "Escala de nível de consciência", menu: "Formulário da Escala de Glasgow" },
    { slug: "gosnell", pdf: "Ficha_Impressao_Escala_Gosnell.pdf", fullName: "Escala de Gosnell", topic: "avaliação do risco de queda", chip: "Escala de risco de queda", menu: "Formulário da Escala de Gosnell" },
    { slug: "hamilton", pdf: "Ficha_Impressao_Escala_Hamilton.pdf", fullName: "Escala de Hamilton", topic: "avaliação da intensidade de ansiedade", chip: "Escala de ansiedade", menu: "Formulário da Escala de Hamilton" },
    { slug: "hendrich", pdf: "Ficha_Impressao_Escala_Hendrich.pdf", fullName: "Escala de Hendrich II", topic: "avaliação do risco de queda em pacientes hospitalizados", chip: "Escala de risco de queda", menu: "Formulário da Escala de Hendrich" },
    { slug: "humpty", pdf: "Ficha_Impressao_Escala_Humpty_Dumpty.pdf", fullName: "Escala de Humpty Dumpty", topic: "avaliação do risco de queda em pacientes pediátricos", chip: "Escala de risco de queda", menu: "Formulário da Escala de Humpty Dumpty" },
    { slug: "johns", pdf: "Ficha_Impressao_Escala_Johns_Hopkins.pdf", fullName: "Escala de Johns Hopkins", topic: "avaliação do risco de queda em pacientes adultos", chip: "Escala de risco de queda", menu: "Formulário da Escala de Johns Hopkins" },
    { slug: "jouvet", pdf: "Ficha_Impressao_Escala_Jouvet.pdf", fullName: "Escala de Jouvet", topic: "avaliação do nível de consciência", chip: "Escala de nível de consciência", menu: "Formulário da Escala de Jouvet" },
    { slug: "lachs", pdf: "Ficha_Impressao_Escala_Lachs.pdf", fullName: "Escala de Lachs", topic: "avaliação da vulnerabilidade do idoso", chip: "Escala de vulnerabilidade do idoso", menu: "Formulário da Escala de Lachs" },
    { slug: "lanss", pdf: "Ficha_Impressao_Escala_LANSS.pdf", fullName: "Escala de LANSS", topic: "avaliação de dor neuropática", chip: "Escala de dor neuropática", menu: "Formulário da Escala de LANSS" },
    { slug: "lawton", pdf: "Ficha_Impressao_Escala_Lawton.pdf", fullName: "Escala de Lawton", topic: "avaliação das atividades instrumentais de vida diária", chip: "Escala de atividades de vida diária", menu: "Formulário da Escala de Lawton" },
    { slug: "meows", pdf: "Ficha_Impressao_Escala_MEOWS.pdf", fullName: "Escala de MEOWS", topic: "avaliação de deterioração clínica materna", chip: "Escala de alerta obstétrico", menu: "Formulário da Escala de MEOWS" },
    { slug: "news", pdf: "Ficha_Impressao_Escala_NEWS.pdf", fullName: "Escala de NEWS", topic: "avaliação de deterioração clínica do paciente", chip: "Escala de alerta precoce", menu: "Formulário da Escala de NEWS" },
    { slug: "nips", pdf: "Ficha_Impressao_Escala_NIPS.pdf", fullName: "Escala de NIPS", topic: "avaliação de dor em recém-nascidos", chip: "Escala de dor neonatal", menu: "Formulário da Escala de NIPS" }
];

const base0 = loadCanonicalTemplate();

// 1) Insere DNS prefetch/preconnect após o viewport.
const viewport = '<meta content="width=device-width, initial-scale=1.0" name="viewport"/>';
if (!base0.includes(viewport)) {
    throw new Error("viewport meta não encontrado no template");
}
const base = base0.replace(viewport, viewport + "
" + DNS_BLOCK);

function count(s, sub) {
    return s.split(sub).length - 1;
}

function bilíngue(pt, en) {
    return `<span class="block">${pt}</span><span class="block text-[0.68em] font-normal opacity-80" lang="en">${en}</span>`;
}

function substituirVisiveisComuns(html) {
    const replacements = [
        ["Pular para o conteúdo principal", bilíngue("Pular para o conteúdo principal", "Skip to main content")],
        ["Formulários", bilíngue("Formulários", "Forms")],
        ["Formulário para impressão", bilíngue("Formulário para impressão", "Printable form")],
        ["★ Favoritar", bilíngue("★ Favoritar", "★ Favorite")],
        ["↗ Compartilhar", bilíngue("↗ Compartilhar", "↗ Share")],
        ["▣ Imprimir", bilíngue("▣ Imprimir", "▣ Print")],
        ["⚑ Reportar correção", bilíngue("⚑ Reportar correção", "⚑ Report a correction")],
        ["▤ Ver resultado", bilíngue("▤ Ver resultado", "▤ View result")],
        ["▤ Ir para o formulário", bilíngue("▤ Ir para o formulário", "▤ Go to form")],
        ["▤ Diagnósticos NANDA", bilíngue("▤ Diagnósticos NANDA", "▤ NANDA diagnoses")],
        ["ⓘ Recursos sobre a escala", bilíngue("ⓘ Recursos sobre a escala", "ⓘ Scale resources")],
        ["⌕ Evidências", bilíngue("⌕ Evidências", "⌕ Evidence")],
        ["⇩ Downloads", bilíngue("⇩ Downloads", "⇩ Download")],
        ["Sobre este formulário", bilíngue("Sobre este formulário", "About this form")],
        ["Referências e evidências", bilíngue("Referências e evidências", "References and evidence")],
        ["Referências", bilíngue("Referências", "References")],
        ["Nota de governança", bilíngue("Nota de governança", "Governance note")],
        ["Recursos sobre a escala", bilíngue("Recursos sobre a escala", "Scale resources")],
        ["Informações", bilíngue("Informações", "Information")],
        ["Acesso rápido", bilíngue("Acesso rápido", "Quick access")]
    ];
    let out = html;
    for (const [src, dst] of replacements) out = out.split(src).join(dst);
    return out;
}

for (const e of escalas) {
    const metaDesc = `Ficha da ${e.fullName} para ${e.topic}, visualização, preenchimento e impressão em PDF.`;
    const ogDesc = `Ficha da ${e.fullName} para ${e.topic}, visualização e impressão em PDF.`;
    const twDesc = `Ficha da ${e.fullName} em PDF para visualização e impressão.`;
    const keywords = `${e.fullName}, ${e.topic}, formulário de enfermagem, PDF para imprimir`;
    const heroH2 = `Ficha de ${e.topic} para preenchimento e impressão.`;
    const intro = `A <strong>${e.fullName}</strong> é um instrumento de apoio à ${e.topic}. Esta página disponibiliza a ficha original em PDF para visualização, preenchimento e impressão.`;

    let out = base;

    // Strings exatas do template (Downton).
    const reps = [
        ["Ficha da Escala de Downton para avaliação do risco de queda, visualização, preenchimento e impressão em PDF.", metaDesc],
        ["Ficha da Escala de Downton para avaliação do risco de queda, visualização e impressão em PDF.", ogDesc],
        ["Ficha da Escala de Downton em PDF para visualização e impressão.", twDesc],
        ["Escala de Downton, risco de queda, formulário de enfermagem, PDF para imprimir", keywords],
        ["Ficha de avaliação do risco de queda para preenchimento e impressão.", heroH2],
        ["Escala de risco de queda", e.chip],
        ["A <strong>Escala de Downton</strong> é um instrumento de apoio à avaliação do risco de quedas. Esta página disponibiliza a ficha original em PDF para visualização, preenchimento e impressão.", intro]
    ];
    for (const [src, dst] of reps) {
        out = out.split(src).join(dst);
    }

    // PDF filename (global).
    out = out.split("Ficha_Impressao_Escala_Downton-v2.pdf").join(e.pdf);

    // Slug da URL (global): og:url, canonical, hreflang e Schema url.
    out = out.split("formulario_escala_de_downton").join(`formulario_escala_de_${e.slug}`);

    // Nome da escala (restante).
    out = out.split("Escala de Downton").join(e.fullName);

    const inglesHero = {
        glasgow: "Consciousness level assessment sheet for filling and printing.",
        gosnell: "Fall risk assessment sheet for filling and printing.",
        hamilton: "Anxiety intensity assessment sheet for filling and printing.",
        hendrich: "Fall risk assessment sheet for hospitalized patients.",
        humpty: "Pediatric fall risk assessment sheet.",
        johns: "Adult fall risk assessment sheet.",
        jouvet: "Consciousness level assessment sheet for filling and printing.",
        lachs: "Older adult vulnerability assessment sheet.",
        lanss: "Neuropathic pain assessment sheet.",
        lawton: "Instrumental activities of daily living assessment sheet.",
        meows: "Maternal clinical deterioration assessment sheet.",
        news: "Patient clinical deterioration assessment sheet.",
        nips: "Neonatal pain assessment sheet."
    }[e.slug] || "Nursing assessment sheet for filling and printing.";

    // Interface visível: português primeiro e inglês menor imediatamente abaixo.
    out = substituirVisiveisComuns(out);
    out = out.replace(heroH2, bilíngue(heroH2, inglesHero));

    const file = path.join(ROOT, `formulario_escala_de_${e.slug}.html`);
    fs.writeFileSync(file, out, "utf8");

    const leftover = /downton/i.test(out);
    console.log(`${leftover ? "WARN" : "OK  "} -> formulario_escala_de_${e.slug}.html (downton restante: ${leftover})`);
}

console.log("Concluído: " + escalas.length + " arquivos de conteúdo completo gerados.");
