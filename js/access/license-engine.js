/**
 * js/access/license-engine.js
 *
 * RESPONSABILIDADE: Motor de licenças independentes de plano (Fase 6).
 *
 * Uma licença permite que um usuário acesse um conteúdo específico mesmo
 * sem ter o plano correspondente. Ex.: usuário "free" que comprou apenas
 * o "curso-ecg" consegue abrir esse curso, sem ser premium.
 *
 * Fonte atual: campo "licenses" do perfil (objeto chave → status).
 * Ex.: { "curso-ecg": "active", "biblioteca-premium": "active" }.
 * Futuramente migra para a subcoleção users/{uid}/licenses no Firestore.
 */

(function (window) {
    "use strict";

    window.AccessModules = window.AccessModules || {};

    /**
     * Retorna as licenças do perfil.
     * @param {object|null} profile
     * @returns {object}
     */
    function getLicenses(profile) {
        if (profile && profile.licenses && typeof profile.licenses === "object") {
            return profile.licenses;
        }
        return {};
    }

    /**
     * Verifica se o perfil possui uma licença ativa.
     * @param {object|null} profile
     * @param {string} licenseId
     * @returns {boolean}
     */
    function hasLicense(profile, licenseId) {
        if (!licenseId) {
            return false;
        }
        var licenses = getLicenses(profile);
        var value = licenses[licenseId];
        return value === true || value === "active" || value === 1;
    }

    /**
     * Lista os IDs das licenças ativas do perfil.
     * @param {object|null} profile
     * @returns {string[]}
     */
    function listActive(profile) {
        var licenses = getLicenses(profile);
        return Object.keys(licenses).filter(function (id) {
            var v = licenses[id];
            return v === true || v === "active" || v === 1;
        });
    }

    window.AccessModules.licenses = {
        getLicenses: getLicenses,
        hasLicense: hasLicense,
        listActive: listActive
    };

    console.log("[Access] Módulo license-engine.js carregado.");

})(window);
