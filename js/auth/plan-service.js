/** Canonical commercial plan catalog: FREE and PREMIUM only. */
(function(window){"use strict";
  window.AuthorizationModules=window.AuthorizationModules||{};
  var LEVELS={free:0,premium:10};
  var PLANS={
    free:{id:"free",label:"Gratuito",level:0,available:true,permissions:[]},
    premium:{id:"premium",label:"Premium",level:10,available:true,permissions:["viewPremium","downloadPremium"]}
  };
  function normalize(plan){return plan==="premium"?"premium":"free";}
  function levelOf(plan){return PLANS[normalize(plan)].level;}
  function hasPlan(userPlan,required){if(!required||required==="free")return true;return levelOf(userPlan)>=levelOf(required);}
  function permissionsFor(plan){return PLANS[normalize(plan)].permissions.slice();}
  function isPremium(plan){return normalize(plan)==="premium";}
  function isAvailable(plan){var p=PLANS[plan];return !!(p&&p.available);}
  function list(){return Object.keys(PLANS);}
  function label(plan){return PLANS[normalize(plan)].label;}
  window.AuthorizationModules.planService={
    LEVELS:LEVELS,PLANS:PLANS,PREMIUM_PLANS:["premium"],PREMIUM_ENABLED:true,
    normalize:normalize,levelOf:levelOf,hasPlan:hasPlan,permissionsFor:permissionsFor,
    isPremium:isPremium,isAvailable:isAvailable,list:list,label:label
  };
  window.PREMIUM_AD_FREE_PLANS=[];
})(window);