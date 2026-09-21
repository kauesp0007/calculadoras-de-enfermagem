(function(window){"use strict";window.AccessModules=window.AccessModules||{};function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}function url(){try{if(window.AccountRoutes&&window.AccountRoutes.accountUrl)return window.AccountRoutes.accountUrl("assinatura.html");}catch(_){}return"/conta/assinatura.html";}function premiumLock(o){o=o||{};return'<div class="premium-lock flex flex-col items-center text-center gap-3 py-10 px-6" role="status"><p class="text-lg font-bold text-[#1A3E74]">'+esc(o.title||"Conteúdo Premium")+'</p><p class="text-sm text-gray-600 max-w-sm">'+esc(o.message||"Este conteúdo está disponível para assinantes Premium.")+'</p></div>';}function premiumUpgrade(o){o=o||{};return'<a href="'+esc(o.href||url())+'" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A3E74] hover:bg-[#163269] text-white font-semibold text-sm">'+esc(o.label||"Assinar Premium")+'</a>';}function premiumBenefits(plan){var items=window.AccessModules.benefits?window.AccessModules.benefits.forPlan(plan):[];return items.length?'<ul class="flex flex-col gap-2 text-sm text-gray-700">'+items.map(function(b){return'<li>'+esc(b.label)+'</li>';}).join("")+"</ul>":"";}function premiumBenefitsCompact(plan){
 var items=window.AccessModules.benefits?window.AccessModules.benefits.forPlan(plan):[];
 if(!items.length)return"";
 return '<ul style="display:flex;flex-wrap:wrap;gap:6px 14px;margin:11px 0 0;padding:10px 0 0;list-style:none;border-top:1px solid #e7edf5;">'+items.map(function(b){return '<li style="font:700 11px/1.35 Inter,Arial,sans-serif;color:#475569;white-space:nowrap;">'+esc(b.label)+'</li>';}).join("")+"</ul>";
}
function premiumCard(o){
 o=o||{};
 return '<div class="premium-card" role="region" aria-label="Conteúdo Premium" style="width:min(920px,calc(100% - 24px));margin:12px auto 16px;background:#fff;border:1px solid #c7d4e2;border-radius:16px;box-shadow:0 8px 22px rgba(26,62,116,.13),0 2px 6px rgba(15,23,42,.06);box-sizing:border-box;padding:16px 18px;">'
 +'<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;">'
 +'<div style="min-width:0;">'
 +'<p style="margin:0 0 5px;font:900 10px/1.2 Inter,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">Acesso Premium</p>'
 +'<p style="margin:0;font:900 18px/1.2 Inter,Arial,sans-serif;color:#1A3E74;">'+esc(o.title||"Conteúdo Premium")+'</p>'
 +'<p style="margin:6px 0 0;font:600 12px/1.45 Inter,Arial,sans-serif;color:#64748b;">'+esc(o.message||"Este conteúdo está disponível para assinantes Premium.")+'</p></div>'
 +'<div style="min-width:138px;text-align:right;">'+premiumUpgrade({href:o.href,label:o.label||"Assinar Premium"})+'</div></div>'
 +premiumBenefitsCompact(o.plan||"premium")+'</div>';
}
window.AccessModules.widgets={premiumLock:premiumLock,premiumUpgrade:premiumUpgrade,premiumBenefits:premiumBenefits,premiumCard:premiumCard};})(window);