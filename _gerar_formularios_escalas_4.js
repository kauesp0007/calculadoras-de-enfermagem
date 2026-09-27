/*
 * Gerador de formulários de escalas (NIHSS, Norton, OFRAS, PAINAD) — CONTEÚDO COMPLETO.
 * Template: backups-temporarios/formulario_escala_de_downton.html.20260919-094500.bak
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const TEMPLATE = path.join(ROOT, "backups-temporarios", "formulario_escala_de_downton.html.20260919-094500.bak");

const DNS_BLOCK = '<link href="//googleads.g.doubleclick.net" rel="dns-prefetch"/>\n<link href="//pagead2.googlesyndication.com" rel="dns-prefetch"/>\n<link href="//pagead2.googlesyndication.com" rel="preconnect" crossorigin/>\n';

const escalas = [
    { slug: "nihss", pdf: "Ficha_Impressao_Escala_NIHSS.pdf", fullName: "Escala de NIHSS", topic: "avaliação da gravidade do acidente vascular cerebral", chip: "Escala de AVC", menu: "Formulário da Escala de NIHSS" },
    { slug: "norton", pdf: "Ficha_Impressao_Escala_Norton.pdf", fullName: "Escala de Norton", topic: "avaliação do risco de úlcera por pressão", chip: "Escala de risco de úlcera por pressão", menu: "Formulário da Escala de Norton" },
    { slug: "ofras", pdf: "Ficha_Impressao_Escala_OFRAS.pdf", fullName: "Escala de OFRAS", topic: "avaliação do risco de queda em pacientes obstétricas", chip: "Escala de risco de queda obstétrica", menu: "Formulário da Escala de OFRAS" },
    { slug: "painad", pdf: "Ficha_Impressao_Escala_PAINAD.pdf", fullName: "Escala de PAINAD", topic: "avaliação de dor em pacientes com demência avançada", chip: "Escala de dor em demência", menu: "Formulário da Escala de PAINAD" }
];

const base0 = fs.readFileSync(TEMPLATE, "utf8");
const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1">';
if (!base0.includes(viewport)) throw new Error("viewport meta não encontrado no template");
const base = base0.replace(viewport, viewport + "\n" + DNS_BLOCK);

for (const e of escalas) {
    const metaDesc = `Ficha da ${e.fullName} para ${e.topic}, visualização, preenchimento e impressão em PDF.`;
    const ogDesc = `Ficha da ${e.fullName} para ${e.topic}, visualização e impressão em PDF.`;
    const twDesc = `Ficha da ${e.fullName} em PDF para visualização e impressão.`;
    const keywords = `${e.fullName}, ${e.topic}, formulário de enfermagem, PDF para imprimir`;
    const heroH2 = `Ficha de ${e.topic} para preenchimento e impressão.`;
    const intro = `A <strong>${e.fullName}</strong> é um instrumento de apoio à ${e.topic}. Esta página disponibiliza a ficha original em PDF para visualização, preenchimento e impressão.`;

    let out = base;
    const reps = [
        ["Ficha da Escala de Downton para avaliação do risco de queda, visualização, preenchimento e impressão em PDF.", metaDesc],
        ["Ficha da Escala de Downton para avaliação do risco de queda, visualização e impressão em PDF.", ogDesc],
        ["Ficha da Escala de Downton em PDF para visualização e impressão.", twDesc],
        ["Escala de Downton, risco de queda, formulário de enfermagem, PDF para imprimir", keywords],
        ["Ficha de avaliação do risco de queda para preenchimento e impressão.", heroH2],
        ["Escala de risco de queda", e.chip],
        ["A <strong>Escala de Downton</strong> é um instrumento de apoio à avaliação do risco de quedas. Esta página disponibiliza a ficha original em PDF para visualização, preenchimento e impressão.", intro]
    ];
    for (const [src, dst] of reps) out = out.split(src).join(dst);
    out = out.split("Ficha_Impressao_Escala_Downton-v2.pdf").join(e.pdf);
    out = out.split("formulario_escala_de_downton").join(`formulario_escala_de_${e.slug}`);
    out = out.split("Escala de Downton").join(e.fullName);

    const file = path.join(ROOT, `formulario_escala_de_${e.slug}.html`);
    fs.writeFileSync(file, out, "utf8");
    const leftover = /downton/i.test(out);
    console.log(`${leftover ? "WARN" : "OK  "} -> formulario_escala_de_${e.slug}.html`);
}

console.log("Concluído: " + escalas.length + " arquivos gerados.");
