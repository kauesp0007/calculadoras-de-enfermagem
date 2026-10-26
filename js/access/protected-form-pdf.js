(function (window, document) {
  "use strict";

  var ENDPOINT = "https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/premium-content";
  var AUTH_TIMEOUT_MS = 15000;
  var REQUEST_TIMEOUT_MS = 25000;
  var viewers = Array.from(document.querySelectorAll(".protected-pdf-viewer"));
  if (!viewers.length && !document.querySelector("[data-protected-pdf-action]")) return;

  // A proteção da imagem é somente uma restrição de interface para a prévia Free.
  viewers.forEach(function (viewer) {
    viewer.querySelectorAll("img").forEach(function (image) {
      image.draggable = false;
      image.style.webkitTouchCallout = "none";
    });
  });

  function blockPreviewImage(event) {
    if (
      event.target &&
      typeof event.target.closest === "function" &&
      event.target.closest(".protected-pdf-viewer img")
    ) event.preventDefault();
  }

  document.addEventListener("contextmenu", blockPreviewImage, true);
  document.addEventListener("dragstart", blockPreviewImage, true);

  var lang = document.documentElement.lang || "pt";
  var en = /^en/i.test(lang);
  var es = /^es/i.test(lang);
  var messages = {
    premium: en ? "PDF download and printing require Premium." : es ? "La descarga e impresión del PDF requieren Premium." : "Download e impressão do PDF disponíveis no Premium.",
    loading: en ? "Checking Premium access…" : es ? "Verificando el acceso Premium…" : "Verificando acesso Premium…",
    ready: en ? "Premium PDF ready." : es ? "PDF Premium listo." : "PDF Premium disponível.",
    error: en ? "Unable to open the PDF. Please try again." : es ? "No se pudo abrir el PDF. Inténtalo de nuevo." : "Não foi possível abrir o PDF. Tente novamente."
  };
  var urls = new Set();
  var generation = 0;
  var renderPromise = null;

  function timed(promise, ms, code) {
    return Promise.race([
      Promise.resolve(promise),
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error(code || "timeout")); }, ms);
      })
    ]);
  }

  function status(text, target) {
    var targets = target ? [target] : viewers;
    targets.forEach(function (viewer) {
      var output = viewer.querySelector && viewer.querySelector(".protected-pdf-status");
      if (output) output.textContent = text;
    });
  }

  function invalidate() {
    generation++;
    urls.forEach(function (url) { URL.revokeObjectURL(url); });
    urls.clear();
    viewers.forEach(function (viewer) {
      viewer.removeAttribute("aria-busy");
      if (viewer.dataset) delete viewer.dataset.pdfLoading;
      viewer.setAttribute("data-protected-pdf-action", "preview");
      viewer.setAttribute("role", "button");
      viewer.setAttribute("tabindex", "0");
      viewer.querySelectorAll("iframe").forEach(function (frame) { frame.remove(); });
      var image = viewer.querySelector("img");
      if (image) image.hidden = false;
    });
  }

  function validPremiumBilling(billing) {
    if (!billing || !billing.resolved || billing.unavailable || billing.plan !== "premium") return false;
    if (billing.premium_expires_at === null || billing.premium_expires_at === undefined || String(billing.premium_expires_at).trim() === "") return true;
    var expiry = new Date(billing.premium_expires_at);
    return Number.isFinite(expiry.getTime()) && expiry.getTime() > Date.now();
  }

  async function authReady(forceRefresh) {
    if (typeof window.__ENSURE_AUTH === "function") {
      await timed(window.__ENSURE_AUTH(), AUTH_TIMEOUT_MS, "auth_timeout");
    }
    var auth = window.Auth;
    if (!auth) throw new Error("auth_unavailable");
    if (typeof auth.whenReady === "function") {
      await timed(auth.whenReady(), AUTH_TIMEOUT_MS, "auth_timeout");
    }
    var user = auth.currentUser ? auth.currentUser() : null;
    var billing = auth.billingStatus ? auth.billingStatus() : null;
    if (
      user &&
      typeof auth.refreshProfile === "function" &&
      (forceRefresh || !billing || !billing.resolved || billing.unavailable)
    ) {
      await timed(auth.refreshProfile(), AUTH_TIMEOUT_MS, "billing_timeout");
    }
    return auth;
  }

  async function authorizedPdf(control) {
    var auth = await authReady(false);
    var user = auth && auth.currentUser ? auth.currentUser() : null;
    if (!user) throw new Error("premium_required");
    var current = generation;
    var url = ENDPOINT + "?path=" + encodeURIComponent(control.dataset.protectedPdfCatalog) + "&download=" + encodeURIComponent(control.dataset.protectedPdfId);

    async function request(refreshToken) {
      var token = await timed(user.getIdToken(!!refreshToken), 10000, "token_timeout");
      return fetch(url, {
        headers: { Authorization: "Bearer " + token, Accept: "application/pdf" },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
    }

    var response = await request(false);
    if (response.status === 401 || response.status === 403) {
      // Uma única repetição com token Firebase renovado. A autorização continua
      // exclusivamente no premium-content/premiumForUser do servidor.
      response = await request(true);
    }
    if (response.status === 401 || response.status === 403) throw new Error("premium_required");
    if (!response.ok || !/^application\/pdf\b/i.test(response.headers.get("Content-Type") || "")) throw new Error("pdf_unavailable");

    var blob = await response.blob();
    if (await blob.slice(0, 5).text() !== "%PDF-") throw new Error("invalid_pdf");
    if (current !== generation || !auth.currentUser() || auth.currentUser().uid !== user.uid) throw new Error("session_changed");

    var objectUrl = URL.createObjectURL(blob);
    urls.add(objectUrl);
    var match = (response.headers.get("Content-Disposition") || "").match(/filename\*=UTF-8''([^;]+)/i);
    return { url: objectUrl, name: match ? decodeURIComponent(match[1]) : "formulario.pdf" };
  }

  function offer() {
    status(messages.premium);
    var returnUrl = encodeURIComponent(location.pathname + location.search);
    var target = window.__ACCOUNT_PAGE_URL ? window.__ACCOUNT_PAGE_URL("/conta/assinatura.html") : "/conta/assinatura.html";
    location.assign(target + (target.includes("?") ? "&" : "?") + "returnUrl=" + returnUrl);
  }

  async function activate(control, mode, popup) {
    var viewer = control.classList && control.classList.contains("protected-pdf-viewer") ? control : null;
    if (viewer && viewer.dataset && viewer.dataset.pdfLoading === "1") return;
    if (viewer && viewer.dataset) viewer.dataset.pdfLoading = "1";
    if (viewer) viewer.setAttribute("aria-busy", "true");
    status(messages.loading, viewer);

    try {
      var pdf = await authorizedPdf(control);
      if (mode === "download") {
        var link = document.createElement("a");
        link.href = pdf.url;
        link.download = pdf.name;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(pdf.url); urls.delete(pdf.url); }, 60000);
      } else if (mode === "print") {
        if (popup && !popup.closed) popup.location.replace(pdf.url + "#toolbar=1&navpanes=0&view=FitH");
        else window.open(pdf.url + "#toolbar=1&navpanes=0&view=FitH", "_blank", "noopener");
      } else {
        var frame = document.createElement("iframe");
        control.querySelectorAll("iframe").forEach(function (oldFrame) { oldFrame.remove(); });
        frame.src = pdf.url + "#toolbar=1&navpanes=0&scrollbar=1&view=FitH";
        frame.title = en ? "Premium form PDF" : es ? "PDF del formulario Premium" : "PDF do formulário Premium";
        frame.className = "pdf-frame";
        var image = control.querySelector("img");
        if (image) image.hidden = true;
        control.appendChild(frame);
        control.removeAttribute("data-protected-pdf-action");
        control.setAttribute("role", "region");
        control.removeAttribute("tabindex");
        status(messages.ready, control);
      }
    } catch (error) {
      if (popup && !popup.closed) popup.close();
      if (error.message === "premium_required" && mode !== "preview-auto") offer();
      else if (mode !== "preview-auto" && error.message !== "session_changed") status(messages.error, viewer);
    } finally {
      if (viewer && viewer.dataset) delete viewer.dataset.pdfLoading;
      if (viewer) viewer.removeAttribute("aria-busy");
    }
  }

  document.addEventListener("click", function (event) {
    var control = event.target.closest("[data-protected-pdf-action]");
    if (!control) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var mode = control.dataset.protectedPdfAction;
    var popup = mode === "print" ? window.open("", "_blank") : null;
    if (popup) popup.opener = null;
    activate(control, mode, popup);
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var control = event.target.closest("[data-protected-pdf-action]");
    if (!control) return;
    event.preventDefault();
    control.click();
  }, true);

  document.addEventListener("auth:logout", invalidate);
  document.addEventListener("auth:changed", invalidate);
  window.addEventListener("pagehide", invalidate);

  async function renderForCurrentAccount(auth) {
    if (renderPromise) return renderPromise;
    renderPromise = (async function () {
      invalidate();
      var currentAuth = auth || await authReady(false);
      var billing = currentAuth && currentAuth.billingStatus ? currentAuth.billingStatus() : null;
      if (currentAuth && currentAuth.currentUser && currentAuth.currentUser() && (!billing || !billing.resolved || billing.unavailable)) {
        currentAuth = await authReady(false);
        billing = currentAuth.billingStatus ? currentAuth.billingStatus() : null;
      }
      if (validPremiumBilling(billing)) {
        await Promise.all(viewers.map(function (viewer) { return activate(viewer, "preview-auto", null); }));
      }
    })().finally(function () { renderPromise = null; });
    return renderPromise;
  }

  (async function bootstrap() {
    try {
      // Uma única revalidação inicial elimina o estado transitório "verifying".
      var auth = await authReady(true);
      if (auth && auth.onAuthChange) auth.onAuthChange(function () { renderForCurrentAccount(auth); });
      if (auth && auth.onProfileChange) auth.onProfileChange(function () { renderForCurrentAccount(auth); });
      await renderForCurrentAccount(auth);
    } catch (_) { }
  })();
})(window, document);

