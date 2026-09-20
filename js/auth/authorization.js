/** Canonical authorization API. Billing state is resolved by the profile supplied by the account layer. */
(function(window){"use strict";
  window.AuthorizationModules=window.AuthorizationModules||{};
  function profile(){return window.Auth&&window.Auth.profile?window.Auth.profile():null;}
  function user(){return window.Auth&&window.Auth.currentUser?window.Auth.currentUser():null;}
  function getRole(){var p=profile();return p&&p.role?p.role:(user()?"user":"guest");}
  function getPlan(){var p=profile();return window.AuthorizationModules.planService.normalize(p&&p.plan);}
  function getPermissions(){var ps=window.AuthorizationModules.permissionService;if(!ps)return[];return ps.resolve(profile());}
  function hasRole(name){return !!(window.AuthorizationModules.roleService&&window.AuthorizationModules.roleService.has(getRole(),name));}
  function hasPlan(name){return window.AuthorizationModules.planService.hasPlan(getPlan(),name);}
  function hasPermission(name){return getPermissions().indexOf(name)!==-1;}
  function can(permission){return hasPermission(permission)||hasRole("administrator");}
  function canAccess(req){if(!req)return true;if(req.requiredRole&&!hasRole(req.requiredRole))return false;if(req.requiredPlan&&!hasPlan(req.requiredPlan))return false;if(req.requiredPermission&&!hasPermission(req.requiredPermission))return false;if(req.requiredFeature&&window.AuthorizationModules.featureService&&!window.AuthorizationModules.featureService.isEnabled(req.requiredFeature))return false;return true;}
  function canDownload(){return hasPermission("downloadPremium");}
  function canEdit(){return hasRole("editor")||hasRole("administrator");}
  function canManage(){return hasRole("moderator")||hasRole("administrator");}
  function onChange(cb){if(window.AuthorizationEvents&&typeof cb==="function")window.AuthorizationEvents.on(window.AuthorizationEvents.EVENTS.PERMISSIONS_CHANGED,cb);}
  function ready(){var s={role:getRole(),plan:getPlan(),permissions:getPermissions()};if(window.AuthorizationEvents){window.AuthorizationEvents.emit(window.AuthorizationEvents.EVENTS.PERMISSIONS_CHANGED,s);window.AuthorizationEvents.emit(window.AuthorizationEvents.EVENTS.READY,s);}return s;}
  window.Authorization={can:can,hasRole:hasRole,hasPermission:hasPermission,hasPlan:hasPlan,canAccess:canAccess,canDownload:canDownload,canEdit:canEdit,canManage:canManage,getPermissions:getPermissions,getPlan:getPlan,getRole:getRole,onChange:onChange,ready:ready};
})(window);