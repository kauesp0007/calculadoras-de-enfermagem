/**
 * js/auth/permission-service.js
 *
 * RESPONSABILIDADE: Catálogo de permissões individuais e resolução.
 *
 * REGRA: permissões originadas do plano só existem quando o plano efetivo
 * ainda é válido. Assim, uma licença Júnior expirada não mantém permissões
 * premium no cache de autorização.
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

    function all() { return ALL.slice(); }

    function resolve(profile) {
        if (!profile) return [];
        var set = {};
        function add(permission) {
            if (permission === "ALL") {
                ALL.forEach(function (item) { set[item] = true; });
                return;
            }
            if (permission) set[permission] = true;
        }

        if (window.AuthorizationModules.roleService) {
            window.AuthorizationModules.roleService.permissionsFor(profile.role).forEach(add);
        }

        var effectivePlan = profile.plan || "free";
        if (window.Authorization && typeof window.Authorization.getPlan === "function") {
            effectivePlan = window.Authorization.getPlan();
        } else if (effectivePlan === "junior" && profile.lifetime !== true && profile.planExpiresAt) {
            try {
                var expiry = profile.planExpiresAt && typeof profile.planExpiresAt.toDate === "function"
                    ? profile.planExpiresAt.toDate()
                    : new Date(profile.planExpiresAt);
                if (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now()) effectivePlan = "free";
            } catch (_) {
                effectivePlan = "free";
            }
        }

        if (window.AuthorizationModules.planService) {
            window.AuthorizationModules.planService.permissionsFor(effectivePlan).forEach(add);
        }

        if (profile.permissions && typeof profile.permissions === "object") {
            Object.keys(profile.permissions).forEach(function (key) {
                var premiumFlags = { canAccessPremium: true, canDownload: true, canViewCertificates: true };
                if (effectivePlan !== "junior" && premiumFlags[key] === true) return;
                if (profile.permissions[key] === true) add(key);
            });
        }

        return Object.keys(set);
    }

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
