/** Canonical benefit catalog. Advertising is intentionally not a plan benefit. */
(function(window){"use strict";
  window.AccessModules=window.AccessModules||{};
  var BENEFITS={
    free:[
      {id:"calculators",label:"Calculadoras e escalas gratuitas"},
      {id:"favorites",label:"Favoritos ilimitados"},
      {id:"history",label:"Histórico de navegação"},
      {id:"ads",label:"Exibição de anúncios"}
    ],
    premium:[
      {id:"premium-content",label:"Acesso ao conteúdo premium"},
      {id:"all-simulados",label:"Acesso aos simulados premium"},
      {id:"premium-forms",label:"Acesso aos formulários premium"}
    ]
  };
  function forPlan(plan){return (BENEFITS[plan==="premium"?"premium":"free"]||BENEFITS.free).slice();}
  function list(){return Object.keys(BENEFITS);}
  window.AccessModules.benefits={BENEFITS:BENEFITS,forPlan:forPlan,list:list};
})(window);