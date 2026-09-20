/** Canonical permission resolver for FREE/PREMIUM plus RBAC roles. */
(function(window){"use strict";
  window.AuthorizationModules=window.AuthorizationModules||{};
  var ALL=["viewPremium","downloadPremium","accessCourses","accessCertificates","downloadProtocols","viewBiblioteca","createForumTopic","replyForum","moderateForum","manageUsers","managePremium","managePayments","manageCourses","manageDownloads","manageCertificates","manageBlog","manageAds","manageSystem"];
  function resolve(profile){var set={};function add(x){if(x==="ALL"){ALL.forEach(function(p){set[p]=true;});}else if(x)set[x]=true;}
    if(profile&&window.AuthorizationModules.roleService)window.AuthorizationModules.roleService.permissionsFor(profile.role).forEach(add);
    var premium=!!(window.Auth&&window.Auth.hasPlan&&window.Auth.hasPlan("premium"));
    if(!premium&&profile&&profile.plan==="premium") premium=false;
    if(premium&&window.AuthorizationModules.planService)window.AuthorizationModules.planService.permissionsFor("premium").forEach(add);
    return Object.keys(set);
  }
  function all(){return ALL.slice();}
  function has(profile,name){return resolve(profile).indexOf(name)!==-1;}
  window.AuthorizationModules.permissionService={ALL:ALL,all:all,resolve:resolve,has:has};
})(window);