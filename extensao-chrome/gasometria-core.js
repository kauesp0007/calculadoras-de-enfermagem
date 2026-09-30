/* Modelo visual: gasometria.html. Equações: UCSF Hospital Handbook e ATS.
 * Módulo puro: não acessa DOM, rede, armazenamento ou APIs do navegador.
 */
(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    else root.Gasometria = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const FIELDS = Object.freeze([
        { id: "ph", label: "pH", required: true },
        { id: "paco2", label: "PaCO₂", required: true },
        { id: "hco3", label: "HCO₃⁻", required: true },
        { id: "pao2", label: "PaO₂", required: false },
        { id: "be", label: "Excesso de base", required: false },
        { id: "sato2", label: "SatO₂", required: false }
    ]);
    // Corte de triagem da interface, não um limite clínico universal da ATS.
    const CONSISTENCY_TOLERANCE = 0.08;
    const format = (value, digits = 1) => Number(value).toFixed(digits).replace(".", ",");

    function readNumber(raw) {
        if (raw === null || raw === undefined || String(raw).trim() === "") return null;
        if (typeof raw === "number") return Number.isFinite(raw) ? raw : NaN;
        if (typeof raw !== "string") return NaN;
        const normalized = raw.trim().replace(",", ".");
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return NaN;
        const value = Number(normalized);
        return Number.isFinite(value) ? value : NaN;
    }

    function validate(raw) {
        const values = {};
        const errors = [];
        for (const field of FIELDS) {
            const value = readNumber(raw && raw[field.id]);
            values[field.id] = value;
            if (value === null) {
                if (field.required) errors.push({ field: field.id, message: "Informe " + field.label + "." });
                continue;
            }
            if (!Number.isFinite(value)) {
                errors.push({ field: field.id, message: "Informe um número válido para " + field.label + "." });
                continue;
            }
            if (field.id === "ph" && (value <= 0 || value >= 14)) {
                errors.push({ field: field.id, message: "O pH deve ser maior que 0 e menor que 14." });
            } else if ((field.id === "paco2" || field.id === "hco3") && value <= 0) {
                errors.push({ field: field.id, message: field.label + " deve ser maior que zero." });
            } else if (field.id === "pao2" && value < 0) {
                errors.push({ field: field.id, message: "PaO₂ não pode ser negativa." });
            } else if (field.id === "sato2" && (value < 0 || value > 100)) {
                errors.push({ field: field.id, message: "SatO₂ deve estar entre 0 e 100%." });
            }
        }
        return { ok: errors.length === 0, values, errors };
    }

    function phState(ph) {
        if (ph < 7.35) return "Acidemia";
        if (ph > 7.45) return "Alcalemia";
        return "Na faixa de referência";
    }

    // Rótulo solicitado para o pH; o resumo mantém o tipo de distúrbio indefinido.
    function phFinding(ph) {
        if (ph < 7.35) return {
            title: "Acidose (acidemia)",
            summary: "O pH informado está reduzido (acidemia). Esse achado isolado não define o tipo de distúrbio."
        };
        if (ph > 7.45) return {
            title: "Alcalose (alcalemia)",
            summary: "O pH informado está elevado (alcalemia). Esse achado isolado não define o tipo de distúrbio."
        };
        return {
            title: "pH na faixa de referência — conferir valores",
            summary: "O pH informado está na faixa de referência; isso não confirma a normalidade dos demais parâmetros."
        };
    }

    function metabolicCompensation(values, acid) {
        const expected = acid ? 1.5 * values.hco3 + 8 : 40 + 0.7 * (values.hco3 - 24);
        const low = expected - 2;
        const high = expected + 2;
        let relation = "within";
        let message = "PaCO₂ dentro da faixa de compensação estimada.";
        if (values.paco2 < low) {
            relation = "below";
            message = "PaCO₂ abaixo do esperado: possível componente de alcalose respiratória adicional.";
        } else if (values.paco2 > high) {
            relation = "above";
            message = "PaCO₂ acima do esperado: possível componente de acidose respiratória adicional.";
        }
        return {
            kind: "metabolic", relation, expected, low, high, message,
            expectedText: "PaCO₂ esperada: " + format(low) + "–" + format(high) + " mmHg" +
                (acid ? " (fórmula de Winter)." : " (estimativa de compensação).")
        };
    }

    function respiratoryCompensation(values, acid) {
        const delta = acid ? values.paco2 - 40 : 40 - values.paco2;
        const acute = acid ? 24 + 0.1 * delta : 24 - 0.22 * delta;
        const chronic = acid ? 24 + 0.35 * delta : 24 - 0.4 * delta;
        return {
            kind: "respiratory", relation: "undetermined", acute, chronic,
            message: "Compare o HCO₃⁻ observado com as estimativas. A duração não é determinada por estes campos.",
            expectedText: "HCO₃⁻ estimado: agudo " + format(acute) + "; crônico " + format(chronic) + " mEq/L."
        };
    }

    function primaryPattern(values) {
        const { ph, paco2, hco3 } = values;
        const acid = ph < 7.35;
        const alk = ph > 7.45;
        const respAcid = paco2 > 45;
        const respAlk = paco2 < 35;
        const metabAcid = hco3 < 22;
        const metabAlk = hco3 > 26;
        const none = {
            kind: "none", relation: "undetermined", expectedText: "",
            message: "Os valores isolados não definem a duração nem todos os possíveis distúrbios."
        };

        if (!acid && !alk) {
            if (!respAcid && !respAlk && !metabAcid && !metabAlk) {
                return {
                    code: "reference", tone: "reference",
                    title: "Parâmetros ácido-base na faixa de referência",
                    summary: "pH, PaCO₂ e HCO₃⁻ estão nas faixas exibidas no formulário.",
                    compensation: { ...none, message: "Sem alteração ácido-base aparente nestes três parâmetros." }
                };
            }
            return {
                code: "normal-ph-altered", tone: "attention",
                title: "pH normal com alterações ácido-base",
                summary: "PaCO₂ e/ou HCO₃⁻ estão fora da referência. O pH normal não exclui distúrbio combinado.",
                compensation: { ...none, message: "Compensação e distúrbios combinados exigem avaliação do contexto e da evolução." }
            };
        }
        if ((acid && respAcid && metabAcid) || (alk && respAlk && metabAlk)) {
            return {
                code: acid ? "mixed-acidosis" : "mixed-alkalosis", tone: "attention",
                title: acid ? "Acidose mista (acidemia)" : "Alcalose mista (alcalemia)",
                summary: "Padrão compatível com componentes respiratório e metabólico no mesmo sentido.",
                compensation: { ...none, message: "Alterações no mesmo sentido sugerem um padrão misto." }
            };
        }
        if ((acid && metabAcid) || (alk && metabAlk)) {
            return {
                code: acid ? "metabolic-acidosis" : "metabolic-alkalosis", tone: "attention",
                title: acid ? "Acidose metabólica (acidemia)" : "Alcalose metabólica (alcalemia)",
                summary: "Padrão compatível com componente metabólico predominante nos valores informados.",
                compensation: metabolicCompensation(values, acid)
            };
        }
        if ((acid && respAcid) || (alk && respAlk)) {
            return {
                code: acid ? "respiratory-acidosis" : "respiratory-alkalosis", tone: "attention",
                title: acid ? "Acidose respiratória (acidemia)" : "Alcalose respiratória (alcalemia)",
                summary: "Padrão compatível com componente respiratório predominante nos valores informados.",
                compensation: respiratoryCompensation(values, acid)
            };
        }
        const finding = phFinding(ph);
        return {
            code: "indeterminate", tone: "attention", title: finding.title,
            summary: finding.summary + " PaCO₂ e HCO₃⁻ não sustentam um padrão metabólico ou respiratório simples pelas faixas adotadas.",
            compensation: none
        };
    }

    function supplemental(values) {
        return [
            {
                label: "PaO₂", value: values.pao2 === null ? "Não informado" : format(values.pao2) + " mmHg",
                status: values.pao2 === null ? "Opcional" : values.pao2 < 80 ? "Abaixo da referência" :
                    values.pao2 > 100 ? "Acima da referência" : "Na faixa de referência"
            },
            {
                label: "Excesso de base", value: values.be === null ? "Não informado" : format(values.be) + " mEq/L",
                status: values.be === null ? "Opcional" : values.be < -2 ? "Abaixo da referência" :
                    values.be > 2 ? "Acima da referência" : "Na faixa de referência"
            },
            {
                label: "SatO₂", value: values.sato2 === null ? "Não informado" : format(values.sato2) + "%",
                status: values.sato2 === null ? "Opcional" : values.sato2 > 95 ? "Acima de 95%" : "95% ou menos"
            }
        ];
    }

    function calculate(raw) {
        const validation = validate(raw);
        if (!validation.ok) return validation;
        const values = validation.values;
        const consistencyPh = 6.1 + Math.log10(values.hco3 / (0.03 * values.paco2));
        const discrepancy = Math.abs(values.ph - consistencyPh);
        let result = primaryPattern(values);
        const notes = [
            "Apoio educacional: confira com avaliação profissional e protocolo institucional.",
            "PaO₂ e SatO₂ devem ser avaliadas com o oxigênio inspirado e o contexto clínico."
        ];
        if (discrepancy > CONSISTENCY_TOLERANCE) {
            const finding = phFinding(values.ph);
            result = {
                code: "inconsistent", tone: "attention",
                title: finding.title,
                summary: finding.summary + " PaCO₂ e HCO₃⁻ informados correspondem a um pH calculado de aproximadamente " +
                    format(consistencyPh, 2) + ", diferente do pH digitado (" + format(values.ph, 2) + "). Confira os três valores no laudo.",
                compensation: {
                    kind: "none", relation: "undetermined", expectedText: "",
                    message: "É preciso conferir os valores para definir o tipo de distúrbio (metabólico ou respiratório) e sua compensação."
                }
            };
        }
        return {
            ...validation, ...result, phState: phState(values.ph),
            consistency: { estimatedPh: consistencyPh, discrepancy, tolerance: CONSISTENCY_TOLERANCE },
            supplemental: supplemental(values), notes
        };
    }

    return Object.freeze({ FIELDS, readNumber, validate, calculate, format, CONSISTENCY_TOLERANCE });
});
