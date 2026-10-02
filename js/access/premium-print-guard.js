/**
 * Premium Print Guard
 *
 * Bloqueia ações de impressão para visitantes e usuários Free nas páginas
 * públicas da raiz e dos idiomas. Assinantes Premium continuam imprimindo.
 * Páginas Premium protegidas mantêm o gate próprio do premium-content-loader.
 */
(function (window, document) {
  "use strict";

  if (window.__PREMIUM_PRINT_GUARD_INSTALLED) return;
  window.__PREMIUM_PRINT_GUARD_INSTALLED = true;

  var pathname = window.location.pathname || "/";
  if (/\/conta\//i.test(pathname)) return;
  if (window.__IS_PREMIUM_ROUTE === true ||
      document.querySelector('script[src*="premium-content-loader.js"]')) return;

  var originalPrint = typeof window.print === "function" ? window.print.bind(window) : null;
  if (!originalPrint) return;

  var accessState = "unknown";
  var accessPromise = null;
  var replayingControl = null;
  var authListenersBound = false;

  var PRINT_PATTERN = /(?:\bprint\b|\bimprimir\b|\bimprime\b|\bimprima\b|\bimpression\b|\bimprimer\b|\bstampa\b|\bstampare\b|\bdrucken\b|\bdruck\b|\bafdrukken\b|\bafdruk\b|\bdrukuj\b|\bwydrukuj\b|\byazd[ıi]r\b|\bcetak\b|\bin\s+(?:trang|tài\s*liệu|nội\s*dung)\b|печать|распечат|друк|надрук|印刷|打印|인쇄|प्रिंट|طباعة|اطبع)/i;

  function descriptor(control) {
    if (!control) return "";
    return [
      control.id || "",
      typeof control.className === "string" ? control.className : "",
      control.getAttribute("name") || "",
      control.getAttribute("aria-label") || "",
      control.getAttribute("title") || "",
      control.getAttribute("value") || "",
      control.getAttribute("href") || "",
      control.getAttribute("onclick") || "",
      control.getAttribute("data-action") || "",
      control.getAttribute("data-form-action") || "",
      control.getAttribute("data-premium-print") || "",
      control.textContent || ""
    ].join(" ").replace(/\s+/g, " ").trim();
  }

  function printControl(target) {
    var control = target && target.closest
      ? target.closest('button,a,input[type="button"],input[type="submit"],[role="button"]')
      : null;
    if (!control) return null;

    if (control.closest("#global-header-container,#language-selector-placeholder,#footer-placeholder,#barraAcessibilidade,.off-canvas-menu,.menu-overlay,#cookieConsentBanner,.modal-overlay")) {
      return null;
    }

    if (control.closest('[data-premium-print="allow"],[data-premium-action="allow"]')) return null;
    if (control.closest('[data-premium-print="block"]')) return control;

    var action = [
      control.getAttribute("data-action") || "",
      control.getAttribute("data-form-action") || "",
      control.getAttribute("onclick") || ""
    ].join(" ");

    if (/(?:print|imprim|impression|stampa|druck|afdruk|drukuj|wydruk|yazd[ıi]r|cetak|печ|друк|印刷|打印|인쇄|प्रिंट|طباعة)/i.test(action)) {
      return control;
    }

    return PRINT_PATTERN.test(descriptor(control)) ? control : null;
  }

  function currentReturnUrl() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function subscriptionUrl() {
    var base = typeof window.__ACCOUNT_PAGE_URL === "function"
      ? window.__ACCOUNT_PAGE_URL("/conta/assinatura.html")
      : "/conta/assinatura.html?lang=" + encodeURIComponent(window.__LANG || "pt");
    var sep = base.indexOf("?") === -1 ? "?" : "&";
    return base + sep + "returnUrl=" + encodeURIComponent(currentReturnUrl());
  }

  function redirectToSubscriberArea(auth) {
    var target = subscriptionUrl();
    var user = auth && auth.currentUser ? auth.currentUser() : null;

    if (!user && typeof window.__ACCOUNT_LOGIN_URL === "function") {
      window.location.assign(window.__ACCOUNT_LOGIN_URL(target));
      return;
    }
    window.location.assign(target);
  }

  function bindAuthInvalidation(auth) {
    if (!auth || authListenersBound) return;
    authListenersBound = true;

    function reset() {
      accessState = "unknown";
      accessPromise = null;
    }

    if (typeof auth.onAuthChange === "function") auth.onAuthChange(reset);
    if (typeof auth.onProfileChange === "function") auth.onProfileChange(reset);
  }

  async function resolvePrintAccess(force) {
    if (accessState === "premium" && !force) return true;
    if (accessState === "free" && !force) return false;
    if (accessPromise && !force) return accessPromise;

    accessPromise = (async function () {
      try {
        if (typeof window.__ENSURE_AUTH !== "function") {
          accessState = "free";
          return false;
        }

        var auth = await window.__ENSURE_AUTH();
        bindAuthInvalidation(auth);

        var user = auth && auth.currentUser ? auth.currentUser() : null;
        if (!user) {
          accessState = "free";
          return false;
        }

        if (auth && auth.hasPlan && auth.hasPlan("premium")) {
          accessState = "premium";
          return true;
        }

        var status = auth && auth.billingStatus ? auth.billingStatus() : null;
        if (auth && typeof auth.refreshProfile === "function" &&
            (!status || !status.resolved || status.unavailable || force)) {
          try {
            await auth.refreshProfile();
          } catch (error) {
            console.warn("[PremiumPrintGuard] não foi possível atualizar o plano:", error);
          }
        }

        if (auth && auth.hasPlan && auth.hasPlan("premium")) {
          accessState = "premium";
          return true;
        }

        accessState = "free";
        return false;
      } catch (error) {
        console.warn("[PremiumPrintGuard] não foi possível confirmar o plano:", error);
        accessState = "free";
        return false;
      } finally {
        accessPromise = null;
      }
    })();

    return accessPromise;
  }

  function runGuardedPrint() {
    resolvePrintAccess(false).then(function (allowed) {
      if (allowed) originalPrint();
      else redirectToSubscriberArea(window.Auth || null);
    });
  }

  function replayControl(control) {
    replayingControl = control;
    try {
      if (typeof control.click === "function") control.click();
    } finally {
      setTimeout(function () { replayingControl = null; }, 0);
    }
  }

  window.print = function () {
    runGuardedPrint();
  };

  document.addEventListener("click", function (event) {
    var control = printControl(event.target);
    if (!control || control === replayingControl) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    resolvePrintAccess(false).then(function (allowed) {
      if (allowed) replayControl(control);
      else redirectToSubscriberArea(window.Auth || null);
    });
  }, true);

  document.addEventListener("keydown", function (event) {
    var key = String(event.key || "").toLowerCase();
    if (key !== "p" || (!event.ctrlKey && !event.metaKey) || event.altKey) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    runGuardedPrint();
  }, true);

  window.__PREMIUM_PRINT_GUARD = {
    resolve: resolvePrintAccess,
    isPrintControl: printControl
  };
})(window, document);
