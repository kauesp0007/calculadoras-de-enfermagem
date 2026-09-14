(function (window) {
  "use strict";

  var PROJECT_ID = "calculadoras-enfermagem";
  var JWKS = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
  var ADMINS = ["kauepg18@gmail.com", "kauesp07@hotmail.com"];

  function isAdminEmail(email) {
    return ADMINS.indexOf(String(email || "").trim().toLowerCase()) !== -1;
  }

  async function getIdToken(user) {
    if (!user || typeof user.getIdToken !== "function") throw new Error("unauthorized");
    return user.getIdToken();
  }

  window.AdminAuth = {
    isAdminEmail: isAdminEmail,
    getIdToken: getIdToken,
    projectId: PROJECT_ID,
    jwksUrl: JWKS
  };
})(window);
