/**
 * js/auth/permission-service.js
 *
 * RESPONSABILIDADE: Catálogo de permissões individuais e resolução.
 *
 * A permissão efetiva de um usuário é a união de:
 *   - permissões do papel (role-service)
 *   - permissões do plano (plan-service)
 *   - permissões explícitas no perfil (campo "permissions" no Firestore)
 */

(function (window) {
    "use strict";

    window.AuthorizationModules = window.AuthorizationModules || {};

    var ALL = [
        "viewPremium",
        "downloadPremium",
        "accessCourses",
        "accessCertificates",
        "downloadProtocols",
        "viewBiblioteca",
        "createForumTopic",
        "replyForum",
        "moderateForum",
        "manageUsers",
        "managePremium",
        "managePayments",
        "manageCourses",
        "manageDownloads",
        "manageCertificates",
        "manageBlog",
        "manageAds",
        "manageSystem"
    ];

    function all() {
        return ALL.slice();
    }

    /**
     * Resolve o conjunto final de permissões de um perfil.
     * @param {object|null} profile
     * @returns {string[]}
     */
    function resolve(profile) {
        if (!profile) {
            return [];
        }

        var set = {};

        function add(p) {
            if (p === "ALL") {
                ALL.forEach(function (x) {
                    set[x] = true;
                });
                return;
            }
            if (p) {
                set[p] = true;
            }
        }

        if (window.AuthorizationModules.roleService) {
            window.AuthorizationModules.roleService.permissionsFor(profile.role).forEach(add);
        }
        if (window.AuthorizationModules.planService) {
            window.AuthorizationModules.planService.permissionsFor(profile.plan).forEach(add);
        }
        if (profile.permissions && typeof profile.permissions === "object") {
            Object.keys(profile.permissions).forEach(function (key) {
                if (profile.permissions[key] === true) {
                    add(key);
                }
            });
        }

        return Object.keys(set);
    }

    /**
     * Verifica se um perfil possui uma permissão.
     * @param {object|null} profile
     * @param {string} name
     * @returns {boolean}
     */
    function has(profile, name) {
        return resolve(profile).indexOf(name) !== -1;
    }

    window.AuthorizationModules.permissionService = {
        ALL: ALL,
        all: all,
        resolve: resolve,
        has: has
    };

    console.log("[Auth] Módulo permission-service.js carregado.");

})(window);
