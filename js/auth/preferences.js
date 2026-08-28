/**
 * js/auth/preferences.js
 *
 * RESPONSABILIDADE: Preferências do usuário (idioma, tema, newsletter, etc.).
 *
 * As preferências ficam armazenadas no campo "preferences" do documento
 * do usuário no Firestore (users/{uid}). Este módulo centraliza os defaults,
 * a validação/normalização e a gravação, evitando que a interface manipule
 * os dados diretamente.
 *
 * USO:
 *   var lang = AuthModules.preferences.get(profile, "language");
 *   await AuthModules.preferences.setPreference(uid, "theme", "dark");
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.AuthModules = window.AuthModules || {};

    // ─── Valores padrão ────────────────────────────────────────────
    var DEFAULTS = {
        theme: "light",        // "light" | "dark"
        language: "pt",        // idioma do site (19 idiomas suportados)
        newsletter: false,     // aceita receber novidades por e-mail
        cookies: true,         // consentimento de cookies
        fontSize: 1,           // 1 (padrão) | 2 | 3 | 4 | 5
        accessibility: false   // modo de alto contraste / leitura facilitada
    };

    // Idiomas suportados pelo site (pt-BR + 18 traduções)
    var SUPPORTED_LANGUAGES = [
        "pt", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja",
        "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
    ];

    /**
     * Retorna uma cópia dos valores padrão.
     * @returns {object}
     */
    function getDefaults() {
        return Object.assign({}, DEFAULTS);
    }

    /**
     * Normaliza um objeto de preferências, preenchendo os campos ausentes
     * com defaults e descartando valores inválidos.
     * @param {object} [prefs]
     * @returns {object}
     */
    function normalize(prefs) {
        var out = getDefaults();

        if (!prefs || typeof prefs !== "object") {
            return out;
        }

        Object.keys(DEFAULTS).forEach(function (key) {
            if (prefs.hasOwnProperty(key) && typeof prefs[key] === typeof DEFAULTS[key]) {
                out[key] = prefs[key];
            }
        });

        // Valida idioma suportado
        if (SUPPORTED_LANGUAGES.indexOf(out.language) === -1) {
            out.language = "pt";
        }

        // Valida tema
        if (out.theme !== "light" && out.theme !== "dark") {
            out.theme = "light";
        }

        // Valida fontSize (1 a 5)
        var fs = parseInt(out.fontSize, 10);
        out.fontSize = isNaN(fs) ? 1 : Math.min(Math.max(fs, 1), 5);

        return out;
    }

    /**
     * Lê uma preferência do perfil.
     * @param {object} profile - Perfil completo do usuário.
     * @param {string} key - Chave da preferência.
     * @returns {*} Valor da preferência.
     */
    function get(profile, key) {
        var prefs = normalize(profile ? profile.preferences : null);
        return prefs[key];
    }

    /**
     * Atualiza uma única preferência no Firestore.
     * @param {string} uid
     * @param {string} key
     * @param {*} value
     * @returns {Promise<object|null>}
     */
    async function setPreference(uid, key, value) {
        if (!uid || !DEFAULTS.hasOwnProperty(key)) {
            return null;
        }

        // Grava no Firestore usando caminho com ponto (não sobrescreve as demais)
        var patch = {};
        patch["preferences." + key] = value;

        if (window.AuthModules.firestoreUser) {
            await window.AuthModules.firestoreUser.updateUserDoc(uid, patch);
        }

        if (window.AuthModules.userEvents) {
            window.AuthModules.userEvents.emit(
                window.AuthModules.userEvents.EVENTS.PREFERENCES_CHANGED,
                { key: key, value: value }
            );
        }

        return { key: key, value: value };
    }

    /**
     * Atualiza o objeto completo de preferências no Firestore.
     * @param {string} uid
     * @param {object} prefs
     * @returns {Promise<object>}
     */
    async function setPreferences(uid, prefs) {
        if (!uid) {
            return null;
        }

        var normalized = normalize(prefs);

        if (window.AuthModules.firestoreUser) {
            await window.AuthModules.firestoreUser.updateUserDoc(uid, {
                preferences: normalized
            });
        }

        if (window.AuthModules.userEvents) {
            window.AuthModules.userEvents.emit(
                window.AuthModules.userEvents.EVENTS.PREFERENCES_CHANGED,
                { preferences: normalized }
            );
        }

        return normalized;
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.AuthModules.preferences = {
        DEFAULTS: DEFAULTS,
        SUPPORTED_LANGUAGES: SUPPORTED_LANGUAGES,
        getDefaults: getDefaults,
        normalize: normalize,
        get: get,
        setPreference: setPreference,
        setPreferences: setPreferences
    };

    console.log("[Auth] Módulo preferences.js carregado.");

})(window);
