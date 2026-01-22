/* =========================================================
   HilltopAds – DirectLink / Popunder
   - Respeita admin_mode
   - Respeita consentimento (ad_storage)
   - 1x por sessão
   - CLS = 0
   ========================================================= */
(function () {
  // Admin block (igual ao seu padrão)
  if (
    localStorage.getItem("admin_mode") === "true" ||
    new URLSearchParams(location.search).get("admin") === "1"
  ) return;

  // 1x por sessão
  if (sessionStorage.getItem("hilltop_opened") === "1") return;

  // Respeita consentimento: se usuário recusou ou ad_storage denied → não abre
  var savedConsent = localStorage.getItem("cookieConsent");
  var isRefused = (savedConsent === "refused");
  var isManaged = (savedConsent === "managed");
  var adStorage = localStorage.getItem("ad_storage"); // "granted" | "denied" | null

  var adsBlocked = isRefused || (isManaged && adStorage === "denied");
  if (adsBlocked) return;

  function openHilltop() {
    sessionStorage.setItem("hilltop_opened", "1");
    window.open(
      "https://happygoluckyaccount.com/bd3.Vj0sPX3fp/vVb-mFV/J/ZWDi0q2KNhzJUO1gM/DCAu5jLZTKY-3ENLTmUxwGMcTrAH",
      "_blank",
      "noopener,noreferrer"
    );
  }

  // abre no 1º clique/toque
  document.addEventListener("click", openHilltop, { once: true, passive: true });
  document.addEventListener("touchstart", openHilltop, { once: true, passive: true });
})();
