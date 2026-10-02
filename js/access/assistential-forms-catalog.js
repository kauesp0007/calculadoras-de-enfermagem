(function (window, document) {
  "use strict";
  var SUPABASE_HOST = "https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/premium-content";
  function catalogPathKey() {
    var p = String(window.location.pathname || "").replace(/^\/+/, "");
    var langs = "en|es|fr|it|de|hi|zh|ja|ru|ko|tr|nl|pl|sv|id|vi|uk|ar";
    var pattern = new RegExp("^(?:(" + langs + ")/)?formularios_de_escalas_assistenciais\\.html$", "i");
    return pattern.test(p) ? p : "formularios_de_escalas_assistenciais.html";
  }
  var ENDPOINT = SUPABASE_HOST + "?path=" + encodeURIComponent(catalogPathKey());
  var dialog = document.getElementById("forms-plan-dialog");
  var status = document.getElementById("download-status");
  var previousFocus = null;
  function message(text) { if (status) status.textContent = text; }
  function offer(trigger) {
    previousFocus = trigger || document.activeElement;
    if (dialog && !dialog.open) dialog.showModal();
  }
  function close() { if (dialog) dialog.close(); }
  function timed(promise, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error("access_timeout")); }, ms);
      Promise.resolve(promise).then(function (value) { clearTimeout(timer); resolve(value); }, function (error) { clearTimeout(timer); reject(error); });
    });
  }
  if (dialog) {
    dialog.querySelector("[data-forms-close]").addEventListener("click", close);
    dialog.addEventListener("close", function () { if (previousFocus) previousFocus.focus(); });
    dialog.addEventListener("click", function (event) { if (event.target === dialog) { var rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } });
  }
  async function authReady() {
    if (typeof window.__ENSURE_AUTH === "function") await timed(window.__ENSURE_AUTH(), 15000);
    var auth = window.Auth;
    if (!auth) throw new Error("auth_unavailable");
    if (typeof auth.whenReady === "function") await timed(auth.whenReady(), 15000);
    var user = auth.currentUser ? auth.currentUser() : null;
    var billing = auth.billingStatus ? auth.billingStatus() : null;
    if (user && auth.refreshProfile && (!billing || !billing.resolved || billing.unavailable)) {
      try { await timed(auth.refreshProfile(), 15000); } catch (_) { }
    }
    return auth;
  }
  function confirmedPremium() {
    var auth = window.Auth, billing = auth && auth.billingStatus ? auth.billingStatus() : null;
    return !!(billing && billing.resolved && billing.plan === "premium");
  }
  async function pdfRequest(user, id, refresh) {
    var token = await timed(user.getIdToken(!!refresh), 10000);
    return fetch(ENDPOINT + "&download=" + encodeURIComponent(id), {
      headers: { Authorization: "Bearer " + token, Accept: "application/pdf" },
      cache: "no-store", signal: AbortSignal.timeout(25000)
    });
  }
  function filename(response) {
    var match = (response.headers.get("Content-Disposition") || "").match(/filename\*=UTF-8''([^;]+)/i);
    try { return match ? decodeURIComponent(match[1]) : "formulario.pdf"; } catch (_) { return "formulario.pdf"; }
  }
  function download(blob, name) {
    var url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }
  function print(blob, popup) {
    var url = URL.createObjectURL(blob);
    if (popup && !popup.closed) { popup.location.replace(url); }
    else {
      // Segunda ação explícita mantém a impressão funcional quando o navegador
      // bloqueia popups após a validação assíncrona de uma sessão inicial.
      var link = document.createElement("a");
      link.href = url; link.target = "_blank"; link.rel = "noopener"; link.className = "act no-print";
      link.textContent = "Abrir PDF para imprimir";
      var existing = document.getElementById("forms-print-ready"); if (existing) existing.remove();
      link.id = "forms-print-ready"; document.getElementById("grade").prepend(link); link.focus();
    }
    // O visualizador nativo mantém os bytes originais e oferece a impressão.
    setTimeout(function () { URL.revokeObjectURL(url); }, 300000);
    message("PDF aberto para impressão. Use Imprimir no visualizador do PDF.");
  }
  async function activate(button) {
    if (button.disabled) return;
    var id = button.getAttribute("data-form-id"), mode = button.getAttribute("data-form-action");
    var popup = mode === "print" && confirmedPremium() ? window.open("", "_blank") : null;
    if (popup) popup.opener = null;
    button.disabled = true; button.setAttribute("aria-busy", "true"); message("Verificando acesso ao formulário…");
    try {
      var auth = await authReady(), user = auth.currentUser ? auth.currentUser() : null;
      if (!user) { if (popup) popup.close(); offer(button); message("Download e impressão disponíveis no Premium."); return; }
      var response = await pdfRequest(user, id, false);
      if (response.status === 401) response = await pdfRequest(user, id, true);
      if (response.status === 403 && confirmedPremium()) {
        response = await pdfRequest(user, id, true);
      }
      if (response.status === 401 || response.status === 403) { if (popup) popup.close(); offer(button); message("Download e impressão disponíveis no Premium."); return; }
      if (!response.ok || !/^application\/pdf\b/i.test(response.headers.get("Content-Type") || "")) throw new Error("pdf_unavailable");
      var blob = await response.blob();
      if (await blob.slice(0, 5).text() !== "%PDF-") throw new Error("invalid_pdf");
      if (mode === "print") print(blob, popup); else { download(blob, filename(response)); message("Download iniciado: " + filename(response)); }
    } catch (error) {
      if (popup) popup.close();
      message("Não foi possível validar ou abrir o formulário. Tente novamente.");
      console.warn("[Formulários] entrega indisponível", error);
    } finally { button.disabled = false; button.removeAttribute("aria-busy"); }
  }
  document.querySelectorAll("[data-form-id]").forEach(function (button) { button.addEventListener("click", function () { activate(button); }); });
  var printPage = document.querySelector('[data-action="print"]');
  if (printPage) printPage.addEventListener("click", async function (event) {
    event.preventDefault(); event.stopImmediatePropagation();
    try {
      var auth = await authReady();
      if (!confirmedPremium()) {
        var user = auth.currentUser ? auth.currentUser() : null;
        var billing = auth.billingStatus ? auth.billingStatus() : null;
        if (user && (!billing || !billing.resolved)) {
          if (typeof auth.refreshProfile === "function") await timed(auth.refreshProfile(), 15000);
          billing = auth.billingStatus ? auth.billingStatus() : null;
          if (!billing || !billing.resolved) { message("Não foi possível verificar o acesso. Tente novamente."); return; }
        }
        if (!confirmedPremium()) { offer(printPage); return; }
      }
      document.getElementById("grade").scrollIntoView({ behavior: "smooth" });
      var first = document.querySelector(".form-print"); if (first) first.focus();
      message("Escolha Imprimir no formulário desejado.");
    } catch (_) { message("Não foi possível verificar o acesso. Tente novamente."); }
  }, true);
})(window, document);
