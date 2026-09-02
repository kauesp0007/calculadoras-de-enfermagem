/**
 * js/auth/auth-email.js
 * 
 * RESPONSABILIDADE: Autenticação por e-mail e senha via Firebase.
 * 
 * Suporta três modos de operação:
 *   - "login"    → Entrar com e-mail e senha
 *   - "register" → Criar nova conta com e-mail e senha
 *   - "reset"    → Enviar e-mail de recuperação de senha
 * 
 * FLUXO DE LOGIN:
 *   1. Usuário preenche e-mail e senha
 *   2. Firebase valida credenciais
 *   3. Se corretas: UserCredential retornado, sessão persistida
 *   4. Se incorretas: erro descritivo retornado
 * 
 * FLUXO DE REGISTRO:
 *   1. Usuário preenche nome, e-mail e senha
 *   2. Firebase cria conta (verifica unicidade do e-mail)
 *   3. E-mail de verificação enviado (opcional)
 *   4. Usuário já fica logado automaticamente
 * 
 * FLUXO DE RECUPERAÇÃO:
 *   1. Usuário informa o e-mail cadastrado
 *   2. Firebase envia e-mail com link de redefinição
 *   3. Usuário clica no link e define nova senha
 * 
 * REQUISITOS:
 *   - Provedor "E-mail/senha" habilitado no console Firebase
 * 
 * CONFIGURAÇÃO NO FIREBASE CONSOLE:
 *   Authentication → Sign-in method → E-mail/senha → Habilitar
 *   (Opcional) Habilitar "Verificação de e-mail"
 */

(function (window) {
  "use strict";

  // ─── Garante que o namespace existe ───────────────────────────
  window.AuthModules = window.AuthModules || {};

  // ─── Constantes ────────────────────────────────────────────────
  var MODES = {
    LOGIN: "login",
    REGISTER: "register",
    RESET: "reset"
  };

  // ─── Validação ─────────────────────────────────────────────────

  /**
   * Valida um endereço de e-mail.
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    if (!email || typeof email !== "string") {
      return false;
    }
    // Regex simples de validação de e-mail
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /**
   * Valida a força da senha.
   * @param {string} password
   * @returns {{valid: boolean, message: string}}
   */
  function validatePassword(password) {
    if (!password || typeof password !== "string") {
      return { valid: false, message: "A senha é obrigatória." };
    }

    if (password.length < 6) {
      return {
        valid: false,
        message: "A senha deve ter pelo menos 6 caracteres."
      };
    }

    if (password.length > 128) {
      return {
        valid: false,
        message: "A senha deve ter no máximo 128 caracteres."
      };
    }

    return { valid: true, message: "" };
  }

  // ─── Operações ──────────────────────────────────────────────────

  /**
   * Login com e-mail e senha.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} UserCredential
   */
  async function loginWithEmail(email, password) {
    var auth = window.FirebaseInit.getAuthSync();
    if (!auth) {
      throw new Error("Firebase Auth não inicializado.");
    }

    if (!isValidEmail(email)) {
      throw new Error("Por favor, insira um e-mail válido.");
    }

    var passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message);
    }

    try {
      var result = await auth.signInWithEmailAndPassword(email.trim(), password);
      console.log("[Email] Login realizado:", result.user.email);
      return result;
    } catch (error) {
      throw _translateFirebaseError(error);
    }
  }

  /**
   * Cria uma nova conta com e-mail e senha.
   * 
   * @param {string} displayName - Nome de exibição do usuário.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} UserCredential
   */
  async function registerWithEmail(displayName, email, password) {
    var auth = window.FirebaseInit.getAuthSync();
    if (!auth) {
      throw new Error("Firebase Auth não inicializado.");
    }

    if (!displayName || displayName.trim().length < 2) {
      throw new Error("Por favor, insira seu nome completo.");
    }

    if (!isValidEmail(email)) {
      throw new Error("Por favor, insira um e-mail válido.");
    }

    var passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message);
    }

    try {
      // 1. Cria a conta
      var result = await auth.createUserWithEmailAndPassword(email.trim(), password);

      // 2. Atualiza o perfil com o nome
      if (result.user) {
        await result.user.updateProfile({
          displayName: displayName.trim()
        });
      }

      // 3. Envia e-mail de verificação (opcional mas recomendado)
      // Descomente a linha abaixo se quiser verificação de e-mail:
      // await result.user.sendEmailVerification();

      console.log("[Email] Conta criada:", result.user.email);
      return result;
    } catch (error) {
      throw _translateFirebaseError(error);
    }
  }

  /**
   * Envia e-mail de recuperação de senha.
   * 
   * @param {string} email - E-mail da conta a recuperar.
   * @returns {Promise<void>}
   */
  async function resetPassword(email) {
    var auth = window.FirebaseInit.getAuthSync();
    if (!auth) {
      throw new Error("Firebase Auth não inicializado.");
    }

    if (!isValidEmail(email)) {
      throw new Error("Por favor, insira um e-mail válido.");
    }

    try {
      await auth.sendPasswordResetEmail(email.trim(), {
        url: window.location.origin + (window.AccountI18n ? window.AccountI18n.buildLoginUrl() : "/conta/login.html"),
        handleCodeInApp: false
      });
      console.log("[Email] E-mail de recuperação enviado para:", email);
    } catch (error) {
      throw _translateFirebaseError(error);
    }
  }

  // ─── Tradução de erros Firebase ─────────────────────────────────

  /**
   * Traduz códigos de erro do Firebase para mensagens em português.
   * 
   * @param {object} error - Erro do Firebase.
   * @returns {Error} Erro com mensagem traduzida.
   */
  function _translateFirebaseError(error) {
    if (!error || !error.code) {
      return new Error("Ocorreu um erro inesperado. Tente novamente.");
    }

    var message;

    switch (error.code) {
      // Erros de login
      case "auth/invalid-credential":
      case "auth/wrong-password":
        message = "E-mail ou senha incorretos. Verifique e tente novamente.";
        break;
      case "auth/user-not-found":
        message = "Não existe conta com este e-mail. Crie uma conta primeiro.";
        break;
      case "auth/user-disabled":
        message = "Esta conta foi desativada. Entre em contato com o suporte.";
        break;
      case "auth/invalid-email":
        message = "O formato do e-mail é inválido.";
        break;
      case "auth/too-many-requests":
        message = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
        break;

      // Erros de registro
      case "auth/email-already-in-use":
        message = "Este e-mail já está cadastrado. Faça login ou recupere a senha.";
        break;
      case "auth/weak-password":
        message = "A senha é muito fraca. Use pelo menos 6 caracteres.";
        break;
      case "auth/operation-not-allowed":
        message = "O login por e-mail/senha não está habilitado. Contate o suporte.";
        break;

      // Erros de rede
      case "auth/network-request-failed":
        message = "Erro de conexão. Verifique sua internet e tente novamente.";
        break;

      // Erro padrão
      default:
        message = "Ocorreu um erro inesperado. Tente novamente. (" + error.code + ")";
        break;
    }

    var translatedError = new Error(message);
    translatedError.code = error.code;
    return translatedError;
  }

  // ─── Interface do Provedor ──────────────────────────────────────

  /**
   * Método principal. Despacha para o modo correto baseado nas opções.
   * 
   * @param {object} options
   * @param {string} options.mode - "login" | "register" | "reset"
   * @param {string} [options.email]
   * @param {string} [options.password]
   * @param {string} [options.displayName] - Necessário para "register"
   * @returns {Promise<object|void>}
   */
  async function signIn(options) {
    if (!options || !options.mode) {
      throw new Error("Modo de operação não especificado.");
    }

    switch (options.mode) {
      case MODES.LOGIN:
        return loginWithEmail(options.email, options.password);

      case MODES.REGISTER:
        return registerWithEmail(options.displayName, options.email, options.password);

      case MODES.RESET:
        await resetPassword(options.email);
        return { success: true, mode: "reset" };

      default:
        throw new Error("Modo desconhecido: " + options.mode);
    }
  }

  /**
   * Verifica disponibilidade.
   * @returns {boolean}
   */
  function isAvailable() {
    return true;
  }

  // ─── Registro automático ────────────────────────────────────────
  if (window.AuthModules && window.AuthModules.providers) {
    window.AuthModules.providers.register("email", {
      signIn: signIn,
      isAvailable: isAvailable
    });
  }

  // ─── Exportação ─────────────────────────────────────────────────
  window.AuthModules.email = {
    signIn: signIn,
    isAvailable: isAvailable,
    loginWithEmail: loginWithEmail,
    registerWithEmail: registerWithEmail,
    resetPassword: resetPassword,
    MODES: MODES
  };

  console.log("[Auth] Módulo auth-email.js carregado.");

})(window);
