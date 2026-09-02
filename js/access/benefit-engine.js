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
            { id: "calculators", icon: "✓", label: "Calculadoras e escalas gratuitas" },
            { id: "favorites", icon: "✓", label: "Favoritos ilimitados" },
            { id: "history", icon: "✓", label: "Histórico de navegação" },
            { id: "ads", icon: "✓", label: "Exibição de anúncios" }
        ],
        junior: [
            { id: "no-ads", icon: "✓", label: "Navegação sem anúncios" },
            { id: "all-scales", icon: "✓", label: "Todas as escalas e calculadoras" }
        ],
        pleno: [
            { id: "no-ads", icon: "✓", label: "Navegação sem anúncios" },
            { id: "all-scales", icon: "✓", label: "Todas as escalas e calculadoras" },
            { id: "all-simulados", icon: "✓", label: "Todos os simulados" }
        ],
        senior: [
            { id: "no-ads", icon: "✓", label: "Navegação sem anúncios" },
            { id: "all-pleno", icon: "✓", label: "Tudo do plano Pleno" },
            { id: "blank-forms", icon: "✓", label: "Formulários de escalas em branco para imprimir e preencher" },
            { id: "excel-schedules", icon: "✓", label: "Escalas de folga e férias semiautomáticas em Excel" },
            { id: "excel-scales", icon: "✓", label: "Fugulin, Braden, Morse e Dimensionamento semiautomáticas em Excel" },
            { id: "handouts", icon: "✓", label: "Apostilas e mapa cirúrgico" },
            { id: "apk", icon: "✓", label: "Aplicativos APK para assistência" }
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
