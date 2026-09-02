/**
 * js/access/benefit-engine.js
 *
 * RESPONSABILIDADE: Motor de benefícios por plano (Fase 6).
 *
 * Cada plano possui uma lista de benefícios (título/descrição/ícone),
 * usados pelas telas de upgrade e pelo Premium Banner. Nenhum benefício
 * fica fixo no HTML — tudo é configurável aqui (e, futuramente, no Firestore).
 *
 * Obs.: este módulo é COMPLEMENTAR ao plan-service.js (Fase 5), que mapeia
 * planos → permissões. Aqui ficam os benefícios legíveis ao usuário.
 */

(function (window) {
    "use strict";

    window.AccessModules = window.AccessModules || {};

    var BENEFITS = {
        free: [
            { id: "calculators", icon: "🧮", label: "Calculadoras e escalas gratuitas" },
            { id: "favorites", icon: "⭐", label: "Favoritos ilimitados" },
            { id: "history", icon: "🕘", label: "Histórico de navegação" }
        ],
        premium_monthly: [
            { id: "all-calculators", icon: "🧮", label: "Todas as calculadoras e escalas" },
            { id: "downloads", icon: "⬇️", label: "Downloads premium" },
            { id: "courses", icon: "🎓", label: "Acesso a cursos" },
            { id: "certificates", icon: "📜", label: "Certificados" },
            { id: "protocols", icon: "📋", label: "Protocolos completos" }
        ],
        premium_yearly: [
            { id: "all-calculators", icon: "🧮", label: "Todas as calculadoras e escalas" },
            { id: "downloads", icon: "⬇️", label: "Downloads premium" },
            { id: "courses", icon: "🎓", label: "Acesso a cursos" },
            { id: "certificates", icon: "📜", label: "Certificados" },
            { id: "protocols", icon: "📋", label: "Protocolos completos" },
            { id: "discount", icon: "💎", label: "Economia no plano anual" }
        ],
        lifetime: [
            { id: "all-calculators", icon: "🧮", label: "Todas as calculadoras e escalas" },
            { id: "downloads", icon: "⬇️", label: "Downloads premium" },
            { id: "courses", icon: "🎓", label: "Acesso a cursos" },
            { id: "certificates", icon: "📜", label: "Certificados" },
            { id: "protocols", icon: "📋", label: "Protocolos completos" },
            { id: "lifetime", icon: "♾️", label: "Acesso vitalício" }
        ],
        student: [
            { id: "all-calculators", icon: "🧮", label: "Todas as calculadoras e escalas" },
            { id: "courses", icon: "🎓", label: "Acesso a cursos" }
        ],
        professional: [
            { id: "all-calculators", icon: "🧮", label: "Todas as calculadoras e escalas" },
            { id: "downloads", icon: "⬇️", label: "Downloads premium" },
            { id: "courses", icon: "🎓", label: "Acesso a cursos" },
            { id: "certificates", icon: "📜", label: "Certificados" }
        ],
        institution: [
            { id: "all-calculators", icon: "🧮", label: "Todas as calculadoras e escalas" },
            { id: "downloads", icon: "⬇️", label: "Downloads premium" },
            { id: "courses", icon: "🎓", label: "Acesso a cursos" },
            { id: "certificates", icon: "📜", label: "Certificados" },
            { id: "protocols", icon: "📋", label: "Protocolos completos" },
            { id: "seats", icon: "🏥", label: "Múltiplos acessos institucionais" }
        ]
    };

    /**
     * Retorna os benefícios de um plano.
     * @param {string} plan
     * @returns {Array<{id,icon,label}>}
     */
    function forPlan(plan) {
        return (BENEFITS[plan] || BENEFITS.free).slice();
    }

    /**
     * Lista todos os planos com benefícios cadastrados.
     * @returns {string[]}
     */
    function list() {
        return Object.keys(BENEFITS);
    }

    window.AccessModules.benefits = {
        BENEFITS: BENEFITS,
        forPlan: forPlan,
        list: list
    };

    console.log("[Access] Módulo benefit-engine.js carregado.");

})(window);
