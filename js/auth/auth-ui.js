/**
 * js/auth/auth-ui.js
 * 
 * RESPONSABILIDADE: Bindings entre a interface do usuário e os módulos de auth.
 * 
 * Este módulo é carregado APENAS na página de login.
 * Ele conecta os botões e formulários do HTML aos módulos de autenticação.
 * 
 * Não contém lógica de negócio — apenas orquestração de UI.
 * 
 * FUNCIONALIDADES:
 *   - Inicialização da página de login
 *   - Binding de cliques nos botões de provedores
 *   - Formulário de e-mail/senha com validação
 *   - Alternância entre modos: login, registro, recuperação
 *   - Exibição de erros e loading states
 *   - Redirecionamento pós-login
 */

(function (window) {
  "use strict";

  // ─── Garante que o namespace existe ───────────────────────────
  window.AuthModules = window.AuthModules || {};

  // ─── Constantes ────────────────────────────────────────────────
  var REDIRECT_AFTER_LOGIN = "/"; // Para onde redirecionar após login

  // ─── Elementos do DOM (preenchidos no init) ─────────────────────
  var _elements = {};

  // ─── Inicialização ─────────────────────────────────────────────

  /**
   * Inicializa a UI de autenticação.
   * Deve ser chamado no DOMContentLoaded da página de login.
   */
  function init() {
    console.log("[AuthUI] Inicializando interface de login...");

    // 1. Cache de elementos do DOM
    _cacheElements();

    // 2. Configura listeners de eventos
    _setupEventListeners();

    // 3. Verifica se já está logado
    _checkExistingSession();
  }

  /**
   * Cache de referências aos elementos do DOM.
   */
  function _cacheElements() {
    _elements = {
      // Botões de provedores sociais
      btnGoogle: document.getElementById("btn-google-login"),
      btnMicrosoft: document.getElementById("btn-microsoft-login"),
      btnApple: document.getElementById("btn-apple-login"),

      // Formulário de e-mail
      formEmail: document.getElementById("form-email-login"),
      inputEmail: document.getElementById("input-email"),
      inputPassword: document.getElementById("input-password"),
      inputDisplayName: document.getElementById("input-displayname"),
      inputDisplayNameGroup: document.getElementById("group-displayname"),
      btnEmailSubmit: document.getElementById("btn-email-submit"),

      // Links de modo
      linkToggleMode: document.getElementById("link-toggle-mode"),
      linkResetPassword: document.getElementById("link-reset-password"),
      linkBackToLogin: document.getElementById("link-back-to-login"),

      // Containers
      emailLoginSection: document.getElementById("email-login-section"),
      registerSection: document.getElementById("register-section"),
      resetSection: document.getElementById("reset-section"),
      errorContainer: document.getElementById("auth-error"),
      successContainer: document.getElementById("auth-success"),
      loadingOverlay: document.getElementById("auth-loading"),

      // Textos dinâmicos
      formTitle: document.getElementById("form-title"),
      submitButtonText: document.getElementById("submit-button-text"),
      toggleModeText: document.getElementById("toggle-mode-text")
    };

    // Estado atual
    _elements._currentMode = "login"; // "login" | "register" | "reset"
  }

  /**
   * Configura todos os event listeners.
   */
  function _setupEventListeners() {
    // Botões de provedores sociais
    if (_elements.btnGoogle) {
      _elements.btnGoogle.addEventListener("click", function (e) {
        e.preventDefault();
        _handleSocialLogin("google");
      });
    }

    if (_elements.btnMicrosoft) {
      _elements.btnMicrosoft.addEventListener("click", function (e) {
        e.preventDefault();
        _handleSocialLogin("microsoft");
      });
    }

    if (_elements.btnApple) {
      _elements.btnApple.addEventListener("click", function (e) {
        e.preventDefault();
        _handleSocialLogin("apple");
      });
    }

    // Formulário de e-mail
    if (_elements.formEmail) {
      _elements.formEmail.addEventListener("submit", function (e) {
        e.preventDefault();
        _handleEmailSubmit();
      });
    }

    // Toggle entre login e registro
    if (_elements.linkToggleMode) {
      _elements.linkToggleMode.addEventListener("click", function (e) {
        e.preventDefault();
        _toggleMode();
      });
    }

    // Link de recuperação de senha
    if (_elements.linkResetPassword) {
      _elements.linkResetPassword.addEventListener("click", function (e) {
        e.preventDefault();
        _showResetMode();
      });
    }

    // Link de voltar ao login
    if (_elements.linkBackToLogin) {
      _elements.linkBackToLogin.addEventListener("click", function (e) {
        e.preventDefault();
        _showLoginMode();
      });
    }
  }

  /**
   * Verifica se já existe uma sessão ativa.
   * Se sim, redireciona para a home.
   */
  async function _checkExistingSession() {
    try {
      // Aguarda a inicialização do Firebase
      await window.Auth.init();

      if (window.Auth.isLoggedIn()) {
        console.log("[AuthUI] Sessão existente detectada. Redirecionando...");
        _redirectAfterLogin();
      }
    } catch (error) {
      // Se falhar a inicialização, permite continuar na página
      console.warn("[AuthUI] Não foi possível verificar sessão:", error);
    }
  }

  // ─── Handlers de Login Social ────────────────────────────────────

  /**
   * Gerencia o fluxo de login com provedor social.
   * @param {string} providerName - "google" | "microsoft" | "apple"
   */
  async function _handleSocialLogin(providerName) {
    _showLoading(true);
    _clearMessages();

    try {
      // Verifica se o Auth está inicializado
      if (!window.Auth.isInitialized()) {
        await window.Auth.init();
      }

      // Executa o login
      await window.Auth.signIn(providerName);

      // Sucesso: redireciona
      _redirectAfterLogin();
    } catch (error) {
      // Tratamento de erro
      _showError(error.message || "Erro ao realizar login. Tente novamente.");
    } finally {
      _showLoading(false);
    }
  }

  // ─── Handlers de E-mail/Senha ────────────────────────────────────

  /**
   * Gerencia o submit do formulário de e-mail.
   * Decide entre login, registro ou recuperação baseado no modo atual.
   */
  async function _handleEmailSubmit() {
    var mode = _elements._currentMode;
    var email = _elements.inputEmail ? _elements.inputEmail.value.trim() : "";
    var password = _elements.inputPassword ? _elements.inputPassword.value : "";
    var displayName = _elements.inputDisplayName
      ? _elements.inputDisplayName.value.trim()
      : "";

    _clearMessages();

    try {
      // Inicializa se necessário
      if (!window.Auth.isInitialized()) {
        await window.Auth.init();
      }

      _showLoading(true);

      switch (mode) {
        case "login":
          await window.Auth.signIn("email", {
            mode: "login",
            email: email,
            password: password
          });
          _redirectAfterLogin();
          break;

        case "register":
          await window.Auth.signIn("email", {
            mode: "register",
            displayName: displayName,
            email: email,
            password: password
          });
          _showSuccess("Conta criada com sucesso! Redirecionando...");
          setTimeout(function () {
            _redirectAfterLogin();
          }, 1500);
          break;

        case "reset":
          await window.Auth.signIn("email", {
            mode: "reset",
            email: email
          });
          _showSuccess(
            "E-mail de recuperação enviado! Verifique sua caixa de entrada " +
            "e siga as instruções para redefinir sua senha."
          );
          _showLoginMode();
          break;

        default:
          _showError("Modo de operação desconhecido.");
      }
    } catch (error) {
      _showError(error.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      _showLoading(false);
    }
  }

  // ─── Controle de Modos (Login / Registro / Reset) ────────────────

  /**
   * Alterna entre modo login e registro.
   */
  function _toggleMode() {
    if (_elements._currentMode === "login") {
      _showRegisterMode();
    } else {
      _showLoginMode();
    }
  }

  /**
   * Exibe o modo de login (padrão).
   */
  function _showLoginMode() {
    _elements._currentMode = "login";
    _clearMessages();

    // Atualiza textos
    if (_elements.formTitle) {
      _elements.formTitle.textContent = "Entrar com E-mail";
    }
    if (_elements.submitButtonText) {
      _elements.submitButtonText.textContent = "Entrar";
    }
    if (_elements.toggleModeText) {
      _elements.toggleModeText.textContent = "Criar conta";
    }

    // Exibe/esconde campos
    if (_elements.inputDisplayNameGroup) {
      _elements.inputDisplayNameGroup.style.display = "none";
    }
    if (_elements.inputPassword) {
      _elements.inputPassword.style.display = "block";
    }

    // Exibe link de recuperação
    if (_elements.linkResetPassword) {
      _elements.linkResetPassword.style.display = "inline";
    }

    // Exibe seção correta
    if (_elements.emailLoginSection) {
      _elements.emailLoginSection.style.display = "block";
    }
    if (_elements.registerSection) {
      _elements.registerSection.style.display = "none";
    }
    if (_elements.resetSection) {
      _elements.resetSection.style.display = "none";
    }

    // Limpa campos
    _clearFields();
  }

  /**
   * Exibe o modo de registro (criar conta).
   */
  function _showRegisterMode() {
    _elements._currentMode = "register";
    _clearMessages();

    if (_elements.formTitle) {
      _elements.formTitle.textContent = "Criar Conta";
    }
    if (_elements.submitButtonText) {
      _elements.submitButtonText.textContent = "Criar Conta";
    }
    if (_elements.toggleModeText) {
      _elements.toggleModeText.textContent = "Já tenho conta";
    }

    // Exibe campo de nome
    if (_elements.inputDisplayNameGroup) {
      _elements.inputDisplayNameGroup.style.display = "block";
    }
    if (_elements.inputPassword) {
      _elements.inputPassword.style.display = "block";
    }
    if (_elements.linkResetPassword) {
      _elements.linkResetPassword.style.display = "none";
    }

    _clearFields();
  }

  /**
   * Exibe o modo de recuperação de senha.
   */
  function _showResetMode() {
    _elements._currentMode = "reset";
    _clearMessages();

    if (_elements.formTitle) {
      _elements.formTitle.textContent = "Recuperar Senha";
    }
    if (_elements.submitButtonText) {
      _elements.submitButtonText.textContent = "Enviar E-mail";
    }

    // Esconde campos não necessários
    if (_elements.inputDisplayNameGroup) {
      _elements.inputDisplayNameGroup.style.display = "none";
    }
    if (_elements.inputPassword) {
      _elements.inputPassword.style.display = "none";
    }
    if (_elements.linkResetPassword) {
      _elements.linkResetPassword.style.display = "none";
    }
    if (_elements.linkToggleMode) {
      _elements.linkToggleMode.style.display = "none";
    }

    // Mostra link de voltar
    if (_elements.linkBackToLogin) {
      _elements.linkBackToLogin.style.display = "inline";
    }

    _clearFields();

    // Foca no campo de e-mail
    if (_elements.inputEmail) {
      _elements.inputEmail.focus();
    }
  }

  // ─── UI Helpers ──────────────────────────────────────────────────

  /**
   * Exibe/esconde o overlay de carregamento.
   * @param {boolean} show
   */
  function _showLoading(show) {
    // Desabilita botões durante o carregamento
    var buttons = document.querySelectorAll(".auth-btn");
    buttons.forEach(function (btn) {
      btn.disabled = show;
      if (show) {
        btn.style.opacity = "0.6";
        btn.style.cursor = "wait";
      } else {
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
      }
    });

    // Altera o texto do botão de submit
    if (_elements.btnEmailSubmit) {
      _elements.btnEmailSubmit.disabled = show;
      if (show) {
        _elements.btnEmailSubmit.dataset.originalText =
          _elements.submitButtonText
            ? _elements.submitButtonText.textContent
            : "Entrar";
        if (_elements.submitButtonText) {
          _elements.submitButtonText.textContent = "Aguarde...";
        }
      } else {
        if (
          _elements.submitButtonText &&
          _elements.btnEmailSubmit.dataset.originalText
        ) {
          _elements.submitButtonText.textContent =
            _elements.btnEmailSubmit.dataset.originalText;
        }
      }
    }
  }

  /**
   * Exibe uma mensagem de erro.
   * @param {string} message
   */
  function _showError(message) {
    if (!_elements.errorContainer) {
      return;
    }

    _elements.errorContainer.textContent = message;
    _elements.errorContainer.style.display = "block";

    // Oculta mensagem de sucesso
    if (_elements.successContainer) {
      _elements.successContainer.style.display = "none";
    }

    // Auto-esconde após 8 segundos
    setTimeout(function () {
      if (_elements.errorContainer) {
        _elements.errorContainer.style.display = "none";
      }
    }, 8000);
  }

  /**
   * Exibe uma mensagem de sucesso.
   * @param {string} message
   */
  function _showSuccess(message) {
    if (!_elements.successContainer) {
      return;
    }

    _elements.successContainer.textContent = message;
    _elements.successContainer.style.display = "block";

    // Oculta mensagem de erro
    if (_elements.errorContainer) {
      _elements.errorContainer.style.display = "none";
    }
  }

  /**
   * Limpa todas as mensagens.
   */
  function _clearMessages() {
    if (_elements.errorContainer) {
      _elements.errorContainer.style.display = "none";
    }
    if (_elements.successContainer) {
      _elements.successContainer.style.display = "none";
    }
  }

  /**
   * Limpa os campos do formulário.
   */
  function _clearFields() {
    if (_elements.inputEmail) {
      _elements.inputEmail.value = "";
    }
    if (_elements.inputPassword) {
      _elements.inputPassword.value = "";
    }
    if (_elements.inputDisplayName) {
      _elements.inputDisplayName.value = "";
    }
  }

  /**
   * Redireciona o usuário após login bem-sucedido.
   */
  function _redirectAfterLogin() {
    // Verifica se há uma URL de retorno nos parâmetros
    var params = new URLSearchParams(window.location.search);
    var returnUrl = params.get("returnUrl");

    // Valida que a URL de retorno é do mesmo domínio (segurança)
    var targetUrl = "/";
    if (returnUrl && returnUrl.indexOf("/") === 0 && returnUrl.indexOf("//") !== 0) {
      targetUrl = returnUrl;
    }

    window.location.href = targetUrl;
  }

  // ─── Exportação ─────────────────────────────────────────────────
  window.AuthUI = {
    init: init,
    showLoginMode: _showLoginMode,
    showRegisterMode: _showRegisterMode,
    showResetMode: _showResetMode
  };

  // Inicializa automaticamente quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM já carregado
    init();
  }

  console.log("[Auth] Módulo auth-ui.js carregado.");

})(window);
