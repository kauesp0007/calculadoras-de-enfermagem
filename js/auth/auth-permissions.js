/** Compatibility adapter exposing the canonical FREE/PREMIUM access model. */
(function(window){"use strict";
  window.AuthModules=window.AuthModules||{};
  var MAP={"premium-content":"canAccessPremium",downloads:"canDownload",certificates:"canViewCertificates",favorites:"canSaveFavorites",history:"canViewHistory"};
  var PLAN_PERMISSIONS={
    free:{canAccessPremium:false,canDownload:false,canViewCertificates:false,canSaveFavorites:true,canViewHistory:true},
    premium:{canAccessPremium:true,canDownload:true,canViewCertificates:true,canSaveFavorites:true,canViewHistory:true}
  };
  function effective(){return window.Authorization&&window.Authorization.getPlan?window.Authorization.getPlan():"free";}
  function canAccess(resource){var user=window.Auth&&window.Auth.currentUser?window.Auth.currentUser():null;if(!user)return false;if(window.Authorization&&window.Authorization.hasRole&&window.Authorization.hasRole("administrator"))return true;var key=MAP[resource];return !!(key&&PLAN_PERMISSIONS[effective()]&&PLAN_PERMISSIONS[effective()][key]);}
  function isAdmin(){return !!(window.Authorization&&window.Authorization.hasRole&&window.Authorization.hasRole("administrator"));}
  function getCurrentPlan(){return effective();}
  function isPlanExpired(){return false;}
  window.AuthModules.permissions={canAccess:canAccess,isAdmin:isAdmin,getCurrentPlan:getCurrentPlan,isPlanExpired:isPlanExpired,PLAN_PERMISSIONS:PLAN_PERMISSIONS};
})(window);