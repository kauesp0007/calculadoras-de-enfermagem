/**
 * js/auth/permission-cache.js
 *
 * RESPONSABILIDADE: Cache em memória das permissões resolvidas.
 *
 * Evita recalcular as permissões a cada chamada. É invalidado quando o
 * perfil muda (login/logout) ou quando as permissões são alteradas.
 */

(function (window) {
    "use strict";

    window.AuthorizationModules = window.AuthorizationModules || {};

    var _uid = null;
    var _resolved = null;

    function get(uid) {
        return _uid === uid && _resolved ? _resolved : null;
    }

    function set(uid, resolved) {
        _uid = uid;
        _resolved = resolved;
    }

    function invalidate() {
        _uid = null;
        _resolved = null;
    }

    window.AuthorizationModules.permissionCache = {
        get: get,
        set: set,
        invalidate: invalidate
    };

    console.log("[Auth] Módulo permission-cache.js carregado.");

})(window);
