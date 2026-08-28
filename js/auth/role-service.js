/**
 * js/auth/role-service.js
 *
 * RESPONSABILIDADE: Definição dos papéis (roles) e suas permissões implícitas.
 *
 * A hierarquia é baseada em nível: um papel de nível maior atende a qualquer
 * requisito de papel de nível menor (ex.: administrator também é moderator).
 * Nenhum papel é fixo — basta adicionar/remover no mapa.
 */

(function (window) {
    "use strict";

    window.AuthorizationModules = window.AuthorizationModules || {};

    // Nível de cada papel (maior = mais privilégios)
    var LEVELS = {
        guest: 0,
        user: 10,
        premium: 20,
        institution: 25,
        moderator: 30,
        editor: 40,
        administrator: 80,
        superAdministrator: 90
    };

    // Permissões implícitas de cada papel
    var ROLE_PERMISSIONS = {
        guest: [],
        user: ["viewBiblioteca", "createForumTopic", "replyForum"],
        premium: [
            "viewPremium", "downloadPremium", "accessCourses", "accessCertificates",
            "downloadProtocols", "viewBiblioteca", "createForumTopic", "replyForum"
        ],
        institution: [
            "viewPremium", "downloadPremium", "accessCourses", "accessCertificates",
            "downloadProtocols", "viewBiblioteca", "createForumTopic", "replyForum"
        ],
        moderator: [
            "viewPremium", "downloadPremium", "accessCourses", "accessCertificates",
            "downloadProtocols", "viewBiblioteca", "createForumTopic", "replyForum",
            "moderateForum"
        ],
        editor: [
            "viewPremium", "downloadPremium", "accessCourses", "accessCertificates",
            "downloadProtocols", "viewBiblioteca", "createForumTopic", "replyForum",
            "moderateForum", "manageBlog", "manageDownloads", "manageCourses",
            "manageCertificates", "manageAds"
        ],
        administrator: [
            "viewPremium", "downloadPremium", "accessCourses", "accessCertificates",
            "downloadProtocols", "viewBiblioteca", "createForumTopic", "replyForum",
            "moderateForum", "manageBlog", "manageDownloads", "manageCourses",
            "manageCertificates", "manageAds", "manageUsers", "managePremium",
            "managePayments", "manageSystem"
        ],
        superAdministrator: ["ALL"]
    };

    /**
     * Retorna o nível de um papel.
     * @param {string} role
     * @returns {number}
     */
    function levelOf(role) {
        return LEVELS[role] !== undefined ? LEVELS[role] : -1;
    }

    /**
     * Verifica se um papel atende a um papel requerido (hierárquico).
     * @param {string} userRole
     * @param {string} required
     * @returns {boolean}
     */
    function has(userRole, required) {
        if (!required) {
            return true;
        }
        if (userRole === "superAdministrator") {
            return true;
        }
        return levelOf(userRole) >= levelOf(required);
    }

    /**
     * Retorna as permissões implícitas de um papel.
     * @param {string} role
     * @returns {string[]}
     */
    function permissionsFor(role) {
        if (role === "superAdministrator") {
            return window.AuthorizationModules.permissionService
                ? window.AuthorizationModules.permissionService.all()
                : [];
        }
        return ROLE_PERMISSIONS[role] || [];
    }

    /**
     * Lista todos os papéis cadastrados.
     * @returns {string[]}
     */
    function list() {
        return Object.keys(LEVELS);
    }

    window.AuthorizationModules.roleService = {
        LEVELS: LEVELS,
        ROLE_PERMISSIONS: ROLE_PERMISSIONS,
        levelOf: levelOf,
        has: has,
        permissionsFor: permissionsFor,
        list: list
    };

    console.log("[Auth] Módulo role-service.js carregado.");

})(window);
