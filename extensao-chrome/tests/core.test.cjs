"use strict";
const assert = require("node:assert/strict");
const api = require("../gasometria-core.js");

module.exports = function testCore() {
    let checks = 0;
    function check(name, fn) { fn(); checks += 1; }
    function calc(ph, paco2, hco3, extra = {}) { return api.calculate({ ph, paco2, hco3, ...extra }); }

    const patterns = [
        ["normal central", 7.40, 40, 24, "reference"],
        ["normal sem exigir 40/24 exatos", 7.40, 42, 25.2, "reference"],
        ["limite inferior inclusivo", 7.35, 45, 24, "reference"],
        ["limite superior inclusivo", 7.45, 35, 23.51, "reference"],
        ["pH normal com alterações", 7.40, 20, 12, "normal-ph-altered"],
        ["acidose metabólica", 7.30, 25, 12, "metabolic-acidosis"],
        ["alcalose metabólica", 7.51, 47, 36, "metabolic-alkalosis"],
        ["acidose respiratória", 7.26, 60, 26, "respiratory-acidosis"],
        ["alcalose respiratória", 7.62, 20, 20, "respiratory-alkalosis"],
        ["acidose mista", 7.05, 60, 16, "mixed-acidosis"],
        ["alcalose mista", 7.70, 30, 36, "mixed-alkalosis"],
        ["conferir coerência interna", 7.40, 80, 12, "inconsistent"],
        ["foto: pH elevado com parâmetros discrepantes", 7.47, 40, 22, "inconsistent"],
        ["foto: alcalose respiratória coerente", 7.47, 32, 22, "respiratory-alkalosis"]
    ];
    for (const [name, ph, paco2, hco3, code] of patterns) {
        check(name, () => assert.equal(calc(ph, paco2, hco3).code, code));
    }
    check("Winter adequado", () => assert.equal(calc(7.30, 25, 12).compensation.relation, "within"));
    check("Winter no limite inferior", () => assert.equal(calc(7.32, 24, 12).compensation.relation, "within"));
    check("Winter no limite superior", () => assert.equal(calc(7.25, 28, 12).compensation.relation, "within"));
    check("Winter acima", () => assert.equal(calc(7.23, 30, 12).compensation.relation, "above"));
    check("Winter abaixo", () => assert.equal(calc(7.36 - 0.03, 22, 11).compensation.relation, "below"));
    check("alcalose metabólica: equação", () => assert.equal(calc(7.51, 47, 36).compensation.expected, 48.4));
    check("resposta respiratória aguda e crônica", () => {
        const result = calc(7.26, 60, 26);
        assert.equal(result.compensation.acute, 26);
        assert.equal(result.compensation.chronic, 31);
        assert.equal(result.compensation.relation, "undetermined");
    });
    check("alcalose respiratória: equações", () => {
        const comp = calc(7.62, 20, 20).compensation;
        assert.equal(comp.acute, 19.6);
        assert.equal(comp.chronic, 16);
    });
    check("foto: pH elevado permanece no título mesmo com discrepância", () => {
        const result = calc(7.47, 40, 22);
        assert.equal(result.title, "Alcalose (alcalemia)");
        assert.equal(result.phState, "Alcalemia");
        assert.ok(result.summary.includes("7,36"));
        assert.ok(result.summary.includes("7,47"));
        assert.equal(result.compensation.kind, "none");
        assert.equal(result.compensation.relation, "undetermined");
        assert.equal(result.compensation.expectedText, "");
        assert.ok(!result.compensation.message.includes("interpretação ácido-base fica suspensa"));
    });
    check("foto 7,49/48/22: rótulo solicitado preserva a discrepância e não define tipo", () => {
        const result = calc(7.49, 48, 22);
        assert.equal(result.title, "Alcalose (alcalemia)");
        assert.equal(result.phState, "Alcalemia");
        assert.equal(result.code, "inconsistent");
        assert.ok(Math.abs(result.consistency.estimatedPh - 7.2840601887) < 1e-8);
        assert.ok(result.summary.includes("7,28"));
        assert.ok(result.summary.includes("7,49"));
        assert.ok(result.summary.includes("não define o tipo"));
        assert.equal(result.compensation.kind, "none");
        assert.equal(result.compensation.relation, "undetermined");
    });
    check("pH reduzido permanece no título mesmo com discrepância", () => {
        const result = calc(7.28, 40, 24);
        assert.equal(result.code, "inconsistent");
        assert.equal(result.title, "Acidose (acidemia)");
        assert.equal(result.phState, "Acidemia");
        assert.equal(result.compensation.kind, "none");
    });
    check("pH na referência não oculta discrepância dos demais parâmetros", () => {
        const result = calc(7.40, 80, 12);
        assert.equal(result.title, "pH na faixa de referência — conferir valores");
        assert.equal(result.phState, "Na faixa de referência");
        assert.equal(result.code, "inconsistent");
        assert.ok(!result.title.includes("acidose"));
        assert.ok(!result.title.includes("alcalose"));
    });
    check("foto: alcalose respiratória com termos comum e técnico", () => {
        const result = calc(7.47, 32, 22);
        assert.equal(result.title, "Alcalose respiratória (alcalemia)");
        assert.equal(result.compensation.kind, "respiratory");
        assert.equal(result.compensation.acute, 22.24);
        assert.equal(result.compensation.chronic, 20.8);
    });
    check("foto: alcalose mista significa componente metabólico e respiratório", () => {
        const result = calc(7.47, 32, 27);
        assert.equal(result.code, "mixed-alkalosis");
        assert.equal(result.title, "Alcalose mista (alcalemia)");
        assert.equal(result.phState, "Alcalemia");
        assert.ok(result.summary.includes("respiratório e metabólico"));
        assert.ok(!result.title.includes("Grave"));
    });
    check("foto: acidemia com CO2/HCO3 incompatíveis não recebe compensação", () => {
        const result = calc(7.29, 32, 21);
        assert.equal(result.code, "inconsistent");
        assert.equal(result.title, "Acidose (acidemia)");
        assert.ok(result.summary.includes("7,44"));
        assert.ok(result.summary.includes("7,29"));
        assert.equal(result.compensation.kind, "none");
        assert.equal(result.compensation.relation, "undetermined");
    });
    check("pH ácido coerente sem padrão simples continua visível", () => {
        const result = calc(7.34, 45, 23);
        assert.equal(result.code, "indeterminate");
        assert.equal(result.title, "Acidose (acidemia)");
    });
    check("pH alcalino coerente sem padrão simples continua visível", () => {
        const result = calc(7.46, 35, 24);
        assert.equal(result.code, "indeterminate");
        assert.equal(result.title, "Alcalose (alcalemia)");
    });
    for (const [ph, co2, hco3, title] of [
        [7.30, 25, 12, "Acidose metabólica (acidemia)"],
        [7.51, 47, 36, "Alcalose metabólica (alcalemia)"],
        [7.26, 60, 26, "Acidose respiratória (acidemia)"],
        [7.05, 60, 16, "Acidose mista (acidemia)"],
        [7.70, 30, 36, "Alcalose mista (alcalemia)"]
    ]) {
        check("terminologia: " + title, () => assert.equal(calc(ph, co2, hco3).title, title));
    }
    check("virgula decimal e BE negativo", () => {
        const result = calc("7,40", "40", "24", { be: "-2,0" });
        assert.equal(result.code, "reference");
        assert.equal(result.values.be, -2);
    });
    check("BE zero preservado", () => assert.equal(calc(7.4, 40, 24, { be: "0" }).values.be, 0));
    check("opcionais ausentes", () => {
        const result = calc(7.4, 40, 24);
        assert.equal(result.values.pao2, null);
        assert.equal(result.values.be, null);
        assert.equal(result.values.sato2, null);
        assert.equal(result.supplemental[0].value, "Não informado");
    });
    for (const be of [-2, 0, 2]) {
        check("limite BE " + be, () => assert.equal(calc(7.4, 40, 24, { be }).supplemental[1].status, "Na faixa de referência"));
    }
    for (const pao2 of [80, 100]) {
        check("limite PaO2 " + pao2, () => assert.equal(calc(7.4, 40, 24, { pao2 }).supplemental[0].status, "Na faixa de referência"));
    }
    check("SatO2 95 corresponde a <=95", () => assert.equal(calc(7.4, 40, 24, { sato2: 95 }).supplemental[2].status, "95% ou menos"));
    check("SatO2 98", () => assert.equal(calc(7.4, 40, 24, { sato2: 98 }).supplemental[2].status, "Acima de 95%"));
    const invalid = [
        {}, { ph: "7,4abc" }, { ph: Infinity }, { ph: NaN }, { ph: "" }, { ph: 0 }, { ph: 14 },
        { paco2: -2 }, { paco2: 0 }, { hco3: 0 }, { hco3: -12 }, { pao2: -1 },
        { sato2: -1 }, { sato2: 101 }, { be: "1e3" }, { be: "1,2,3" }, { be: true }
    ];
    for (const [index, input] of invalid.entries()) {
        check("entrada inválida " + index, () => {
            const raw = index === 0 ? {} : { ph: 7.4, paco2: 40, hco3: 24, ...input };
            const result = api.calculate(raw);
            assert.equal(result.ok, false);
            assert.ok(result.errors.length);
            assert.equal(result.title, undefined);
        });
    }
    check("somente seis parâmetros", () => assert.deepEqual(api.FIELDS.map(x => x.id), ["ph", "paco2", "hco3", "pao2", "be", "sato2"]));
    return checks;
};
