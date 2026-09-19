/**
 * js/auth/authorization.js
 * API centralizada de autorização. O plano efetivo considera expiração.
 */
(function (window) {
  "use strict";
  window.Authorization = window.Authorization || {};
  window.AuthorizationModules = window.AuthorizationModules || {};
  function _profile() { return window.Auth && window.Auth.profile ? window.Auth.profile() : null; }
  function _user() { return window.Auth && window.Auth.currentUser ? window.Auth.currentUser() : null; }
  function _uid() { var u = _user(); return u ? u.uid : null; }
  function _premiumStillValid(p) {
    if (!p) return false;
    if (p.lifetime === true) return true;
    if (p.plan !== "junior") return false;
    if (!p.planExpiresAt) return true;
    var expires = p.planExpiresAt instanceof Date ? p.planExpiresAt : (p.planExpiresAt.toDate ? p.planExpiresAt.toDate() : new Date(p.planExpiresAt));
    return !Number.isNaN(expires.getTime()) && expires.getTime() > Date.now();
  }
  function getRole() { var p = _profile(); return p && p.role ? p.role : (_user() ? "user" : "guest"); }
  function getPlan() {
    if (window.AuthorizationModules.planService && window.AuthorizationModules.planService.PREMIUM_ENABLED === false) return "free";
    var p = _profile(); if (!p || !_premiumStillValid(p)) return "free"; return p.plan || "free";
  }
  function getPermissions() {
    var uid = _uid(), cache = window.AuthorizationModules.permissionCache, cached = cache ? cache.get(uid) : null;
    if (cached) return cached;
    var resolved = window.AuthorizationModules.permissionService.resolve(_profile());
    if (cache && uid) cache.set(uid, resolved);
    return resolved;
  }
  function hasRole(name) { return window.AuthorizationModules.roleService.has(getRole(), name); }
  function hasPlan(name) {
    if (window.AuthorizationModules.planService && window.AuthorizationModules.planService.PREMIUM_ENABLED === false) return true;
    if (name === "premium") return getPlan() === "junior";
    return window.AuthorizationModules.planService.hasPlan(getPlan(), name);
  }
  function hasPermission(name) { return getPermissions().indexOf(name) !== -1; }
  function can(permission) { return hasPermission(permission) || hasRole("administrator"); }
  function canAccess(req) {
    if (!req) return true;
    if (req.requiredRole && !hasRole(req.requiredRole)) return false;
    if (req.requiredPlan && !hasPlan(req.requiredPlan)) return false;
    if (req.requiredPermission && !hasPermission(req.requiredPermission)) return false;
    if (req.requiredFeature && !window.AuthorizationModules.featureService.isEnabled(req.requiredFeature)) return false;
    return true;
  }
  function canDownload() { return hasPermission("downloadPremium"); }
  function canEdit() { return hasRole("editor") || hasRole("administrator"); }
  function canManage() { return hasRole("moderator") || hasRole("administrator"); }
  function _refresh() {
    if (window.AuthorizationModules.permissionCache) window.AuthorizationModules.permissionCache.invalidate();
    var snapshot = { role: getRole(), plan: getPlan(), permissions: getPermissions() };
    if (window.AuthorizationEvents) {
      window.AuthorizationEvents.emit(window.AuthorizationEvents.EVENTS.PERMISSIONS_CHANGED, snapshot);
      window.AuthorizationEvents.emit(window.AuthorizationEvents.EVENTS.READY, snapshot);
    }
    return snapshot;
  }
  function onChange(cb) { if (window.AuthorizationEvents && typeof cb === "function") window.AuthorizationEvents.on(window.AuthorizationEvents.EVENTS.PERMISSIONS_CHANGED, cb); }
  if (window.Auth && window.Auth.onProfileChange) window.Auth.onProfileChange(function () { _refresh(); });
  window.Authorization = { can: can, hasRole: hasRole, hasPermission: hasPermission, hasPlan: hasPlan, canAccess: canAccess, canDownload: canDownload, canEdit: canEdit, canManage: canManage, getPermissions: getPermissions, getPlan: getPlan, getRole: getRole, onChange: onChange, ready: _refresh };
})(window);
