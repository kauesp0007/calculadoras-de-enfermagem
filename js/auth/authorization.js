/**
 * js/auth/authorization.js
 *
 * RESPONSABILIDADE: Camada central de autorização (RBAC).
 *
 * Exclusiva API de decisão de acesso do projeto. Nenhuma página deve
 * verificar permissões diretamente — toda decisão passa por window.Authorization.
 *
 * A fonte dos dados é o perfil já carregado no Firestore (via Auth.profile()),
 * sem consultas adicionais. O resultado é cacheado e invalidado quando o
 * perfil muda.
 */

(function (window) {
    "use strict";

    window.Authorization = window.Authorization || {};

    function _profile() {
        return window.Auth && window.Auth.profile ? window.Auth.profile() : null;
    }

    function _user() {
        return window.Auth && window.Auth.currentUser ? window.Auth.currentUser() : null;
    }

    function _uid() {
        var u = _user();
        return u ? u.uid : null;
    }

    /**
     * Retorna o papel atual do usuário.
     * @returns {string}
     */
    function getRole() {
        var p = _profile();
        if (p && p.role) {
            return p.role;
        }
        return _user() ? "user" : "guest";
    }

    /**
     * Retorna o plano atual do usuário.
     * @returns {string}
     */
    function getPlan() {
        var p = _profile();
        return p && p.plan ? p.plan : "free";
    }

    /**
     * Retorna a lista de permissões efetivas (cacheada).
     * @returns {string[]}
     */
    function getPermissions() {
        var uid = _uid();
        var cache = window.AuthorizationModules.permissionCache;
        var cached = cache ? cache.get(uid) : null;
        if (cached) {
            return cached;
        }

        var resolved = window.AuthorizationModules.permissionService.resolve(_profile());
        if (cache && uid) {
            cache.set(uid, resolved);
        }
        return resolved;
    }

    /**
     * Verifica se o usuário possui um papel (hierárquico).
     * @param {string} name
     * @returns {boolean}
     */
    function hasRole(name) {
        return window.AuthorizationModules.roleService.has(getRole(), name);
    }

    /**
     * Verifica se o usuário possui um plano.
     * "premium" é um alias para qualquer plano premium.
     * @param {string} name
     * @returns {boolean}
     */
    function hasPlan(name) {
        if (name === "premium") {
            return window.AuthorizationModules.planService.isPremium(getPlan());
        }
        return getPlan() === name;
    }

    /**
     * Verifica se o usuário possui uma permissão específica.
     * @param {string} name
     * @returns {boolean}
     */
    function hasPermission(name) {
        return getPermissions().indexOf(name) !== -1;
    }

    /**
     * Verifica uma permissão (admin sempre passa).
     * @param {string} permission
     * @returns {boolean}
     */
    function can(permission) {
        return hasPermission(permission) || hasRole("administrator");
    }

    /**
     * Verifica acesso com base em um objeto de requisitos.
     * @param {object} [req] - { requiredRole, requiredPlan, requiredPermission, requiredFeature }
     * @returns {boolean}
     */
    function canAccess(req) {
        if (!req) {
            return true;
        }
        if (req.requiredRole && !hasRole(req.requiredRole)) {
            return false;
        }
        if (req.requiredPlan && !hasPlan(req.requiredPlan)) {
            return false;
        }
        if (req.requiredPermission && !hasPermission(req.requiredPermission)) {
            return false;
        }
        if (
            req.requiredFeature &&
            !window.AuthorizationModules.featureService.isEnabled(req.requiredFeature)
        ) {
            return false;
        }
        return true;
    }

    function canDownload() {
        return hasPermission("downloadPremium");
    }

    function canEdit() {
        return hasRole("editor") || hasRole("administrator");
    }

    function canManage() {
        return hasRole("moderator") || hasRole("administrator");
    }

    /**
     * Invalida o cache e reemite eventos com o estado atual.
     * @returns {object}
     */
    function _refresh() {
        if (window.AuthorizationModules.permissionCache) {
            window.AuthorizationModules.permissionCache.invalidate();
        }
        var snapshot = {
            role: getRole(),
            plan: getPlan(),
            permissions: getPermissions()
        };
        if (window.AuthorizationEvents) {
            window.AuthorizationEvents.emit(window.AuthorizationEvents.EVENTS.PERMISSIONS_CHANGED, snapshot);
            window.AuthorizationEvents.emit(window.AuthorizationEvents.EVENTS.READY, snapshot);
        }
        return snapshot;
    }

    /**
     * Registra um callback para mudanças de permissões/plano/papel.
     * @param {Function} cb
     */
    function onChange(cb) {
        if (window.AuthorizationEvents && typeof cb === "function") {
            window.AuthorizationEvents.on(window.AuthorizationEvents.EVENTS.PERMISSIONS_CHANGED, cb);
        }
    }

    // Invalida o cache e reemite eventos quando o perfil muda (login/logout)
    if (window.Auth && window.Auth.onProfileChange) {
        window.Auth.onProfileChange(function () {
            _refresh();
        });
    }

    window.Authorization = {
        can: can,
        hasRole: hasRole,
        hasPermission: hasPermission,
        hasPlan: hasPlan,
        canAccess: canAccess,
        canDownload: canDownload,
        canEdit: canEdit,
        canManage: canManage,
        getPermissions: getPermissions,
        getPlan: getPlan,
        getRole: getRole,
        onChange: onChange,
        ready: _refresh
    };

    console.log("[Auth] Módulo authorization.js carregado.");

})(window);
