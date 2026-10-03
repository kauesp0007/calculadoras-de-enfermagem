(function(){
  "use strict";
  window.__IS_PREMIUM_ROUTE = true;
  var ENDPOINT="https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/premium-content";
  var MAX_ATTEMPTS=3;
  var AUTH_TIMEOUT_MS=15000;
  var TOKEN_TIMEOUT_MS=10000;
  var REQUEST_TIMEOUT_MS=12000;
  var AUTH_SCRIPTS=[
    "/js/firebase/firebase-init.js",
    "/js/auth/auth-session.js",
    "/js/auth/auth-providers.js",
    "/js/auth/auth-permissions.js",
    "/js/auth/firestore-user.js",
    "/js/auth/user-cache.js",
    "/js/auth/user-events.js",
    "/js/auth/preferences.js",
    "/js/auth/auth-user-profile.js",
    "/js/auth/auth-core.js"
  ];
  function pathKey(){
    return window.location.pathname.replace(/^\/+/, "");
  }
  function canonicalPathKey(){
    var parts=pathKey().split("/").filter(Boolean);
    var langs={en:1,es:1,fr:1,it:1,de:1,hi:1,zh:1,ja:1,ru:1,ko:1,tr:1,nl:1,pl:1,sv:1,id:1,vi:1,uk:1,ar:1};
    if(parts.length>1&&langs[parts[0]]) parts.shift();
    return parts.join("/");
  }
  function returnUrl(){return window.location.pathname+window.location.search+window.location.hash;}
  function login(){
    var u=returnUrl();
    if(typeof window.__ACCOUNT_LOGIN_URL==="function") window.location.replace(window.__ACCOUNT_LOGIN_URL(u));
    else window.location.replace("/conta/login.html?returnUrl="+encodeURIComponent(u));
  }
  function subscription(){
    var u=encodeURIComponent(returnUrl());
    if(typeof window.__ACCOUNT_PAGE_URL==="function") window.location.replace(window.__ACCOUNT_PAGE_URL("/conta/assinatura.html")+"&returnUrl="+u);
    else window.location.replace("/conta/assinatura.html?returnUrl="+u);
  }
  var LOADING_TEXTS={"pt":{"title":"Preparando seu conteúdo Premium","msg":"Aguarde um instante enquanto liberamos este conteúdo para você.","alt":"Calculadoras de Enfermagem"},"en":{"title":"Preparing your Premium content","msg":"Please wait a moment while we make this content available to you.","alt":"Nursing Calculators"},"es":{"title":"Preparando tu contenido Premium","msg":"Espera un momento mientras ponemos este contenido a tu disposición.","alt":"Calculadoras de Enfermería"},"fr":{"title":"Préparation de votre contenu Premium","msg":"Veuillez patienter un instant pendant que nous mettons ce contenu à votre disposition.","alt":"Calculatrices de Soins Infirmiers"},"it":{"title":"Preparazione dei contenuti Premium","msg":"Attendi un momento mentre rendiamo disponibili questi contenuti.","alt":"Calcolatori Infermieristici"},"de":{"title":"Ihre Premium-Inhalte werden vorbereitet","msg":"Bitte warten Sie einen Moment, während wir diesen Inhalt für Sie freischalten.","alt":"Pflege-Rechner"},"hi":{"title":"आपकी प्रीमियम सामग्री तैयार की जा रही है","msg":"कृपया एक क्षण प्रतीक्षा करें, जब तक हम यह सामग्री आपके लिए उपलब्ध कराते हैं।","alt":"नर्सिंग कैलकुलेटर"},"zh":{"title":"正在准备您的高级内容","msg":"请稍候，我们正在为您加载此内容。","alt":"护理计算器"},"ja":{"title":"プレミアムコンテンツを準備しています","msg":"このコンテンツを表示する準備をしています。しばらくお待ちください。","alt":"看護計算機"},"ru":{"title":"Подготовка вашего Premium-контента","msg":"Пожалуйста, подождите, пока мы предоставим вам этот материал.","alt":"Калькуляторы для медсестёр"},"ko":{"title":"프리미엄 콘텐츠를 준비하는 중입니다","msg":"잠시만 기다려 주세요. 이 콘텐츠를 준비하고 있습니다.","alt":"간호 계산기"},"tr":{"title":"Premium içeriğiniz hazırlanıyor","msg":"Bu içeriği sizin için hazırlarken lütfen kısa bir süre bekleyin.","alt":"Hemşirelik Hesaplayıcıları"},"nl":{"title":"Uw Premium-inhoud wordt voorbereid","msg":"Even geduld terwijl we deze inhoud voor u beschikbaar maken.","alt":"Verpleegkundige Rekenmachines"},"pl":{"title":"Przygotowywanie treści Premium","msg":"Poczekaj chwilę, przygotowujemy tę treść dla Ciebie.","alt":"Kalkulatory Pielęgniarskie"},"sv":{"title":"Förbereder ditt Premium-innehåll","msg":"Vänta ett ögonblick medan vi gör detta innehåll tillgängligt för dig.","alt":"Sjuksköterskekalkylatorer"},"id":{"title":"Menyiapkan konten Premium Anda","msg":"Tunggu sebentar sementara kami menyiapkan konten ini untuk Anda.","alt":"Kalkulator Keperawatan"},"vi":{"title":"Đang chuẩn bị nội dung Premium của bạn","msg":"Vui lòng chờ một chút trong khi chúng tôi cung cấp nội dung này cho bạn.","alt":"Máy tính Điều dưỡng"},"uk":{"title":"Готуємо ваш Premium-контент","msg":"Зачекайте, будь ласка, поки ми відкриємо цей матеріал для вас.","alt":"Калькулятори для медсестер"},"ar":{"title":"جارٍ تجهيز محتوى Premium الخاص بك","msg":"يرجى الانتظار لحظات بينما نُتيح هذا المحتوى لك.","alt":"حاسبات التمريض"}};
  function currentLoadingLanguage(){
    var p=window.location.pathname.split("/").filter(Boolean);
    var langs=LOADING_TEXTS;
    return (p.length&&langs[p[0]])?p[0]:"pt";
  }
  function showLoadingState(){
    var placeholder=document.getElementById("premium-content-placeholder");
    if(!placeholder) return;
    placeholder.setAttribute("role","status");
    placeholder.setAttribute("aria-live","polite");
    placeholder.style.minHeight="60vh";
    placeholder.style.display="flex";
    placeholder.style.alignItems="center";
    placeholder.style.justifyContent="center";
    placeholder.style.padding="40px 20px";
    placeholder.style.backgroundColor="#f9fafb";
    placeholder.style.boxSizing="border-box";
    var t=LOADING_TEXTS[currentLoadingLanguage()]||LOADING_TEXTS.pt;
    var safeTitle=String(t.title).replace(/[&<>"']/g,function(ch){return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]);});
    var safeMsg=String(t.msg).replace(/[&<>"']/g,function(ch){return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]);});
    var safeAlt=String(t.alt).replace(/[&<>"']/g,function(ch){return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]);});
    placeholder.innerHTML='<section style="width:min(92%,520px);box-sizing:border-box;text-align:center;background:#fff;border:1px solid #dbe3ee;border-top:4px solid #1a3e74;padding:32px 28px;color:#1f2937;font-family:Inter,Arial,sans-serif;box-shadow:0 4px 14px rgba(26,62,116,.08)"><img src="/img/logotipo_website.webp" alt="'+safeAlt+'" width="180" height="auto" style="display:block;width:180px;max-width:80%;height:auto;margin:0 auto 22px"><div style="width:46px;height:3px;background:#f97316;margin:0 auto 20px"></div><h2 style="margin:0 0 8px;color:#1a3e74;font-size:24px;line-height:1.25;font-weight:700">'+safeTitle+'</h2><p style="margin:0 0 22px;color:#4b5563;font-size:15px;line-height:1.6">'+safeMsg+'</p><div aria-hidden="true" style="width:34px;height:34px;margin:0 auto;border:3px solid #dbe3ee;border-top-color:#1a3e74;border-right-color:#f97316;border-radius:50%;animation:premiumContentSpin .9s linear infinite"></div></section>';
    if(!document.getElementById("premium-content-loading-style")){
      var style=document.createElement("style");
      style.id="premium-content-loading-style";
      style.textContent="@keyframes premiumContentSpin{to{transform:rotate(360deg)}}";
      document.head.appendChild(style);
    }
  }
  function showError(message){
    document.body.innerHTML='<main style="min-height:70vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif"><section style="max-width:620px;text-align:center"><h1>Conteúdo temporariamente indisponível</h1><p>'+message+'</p><button id="premium-retry" type="button">Tentar novamente</button></section></main>';
    var b=document.getElementById("premium-retry");if(b)b.addEventListener("click",load,{once:true});
  }
  function stripPremiumAds(html){
    return String(html||"")
      .replace(/<script[^>]+src=["'][^"']*pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^"']*["'][^>]*><\/script>/gi,"")
      .replace(/<ins\b[^>]*class=["'][^"']*\badsbygoogle\b[^"']*["'][^>]*>[\s\S]*?<\/ins>/gi,"")
      .replace(/<aside\b[^>]*class=["'][^"']*\bcontrolled-(?:display|multiplex)-ad\b[^"']*["'][^>]*>[\s\S]*?<\/aside>/gi,"")
      .replace(/<div\b[^>]*id=["']multiplex-ad-reserved["'][^>]*>[\s\S]*?<\/div>/gi,"")
      .replace(/\(?\s*window\.adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\s*\)?\.push\(\{\}\);?/gi,"")
      .replace(/\(?\s*adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\s*\)?\.push\(\{\}\);?/gi,"");
  }
  function medicamentosGovernanceSeal(){
    return '<section id="medicamentos-version-log" data-clinical-governance="medicamentos-revision-log" class="no-print" style="width:min(1120px,calc(100% - 32px));margin:24px auto 18px;padding:14px 16px;border:1px solid #dbe3ee;border-left:4px solid #1a3e74;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(15,23,42,.06);font-family:Inter,Arial,sans-serif;color:#475569">'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px">'
      +'<span style="display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase">COSO</span>'
      +'<span style="display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase">COBIT 2019</span>'
      +'<strong style="color:#1a3e74;font-size:13px">Governança clínica e controles internos</strong>'
      +'</div>'
      +'<p style="margin:0;font-size:12px;line-height:1.5">versão revisada em: 29 de setembro de 2026 · versão 2.0 · governança clínica, segurança medicamentosa, COSO e COBIT 2019.</p>'
      +'</section>';
  }
  function injectMedicamentosGovernanceSeal(html,key){
    var documentHtml=String(html||"");
    if(!/(^|\/)medicamentos\.html$/i.test(String(key||""))) return documentHtml;
    if(/id=["']medicamentos-version-log["']/i.test(documentHtml)) return documentHtml;
    var seal=medicamentosGovernanceSeal();
    if(/<div\b[^>]*id=["']footer-placeholder["'][^>]*>/i.test(documentHtml)){
      return documentHtml.replace(/<div\b[^>]*id=["']footer-placeholder["'][^>]*>/i,seal+"$&");
    }
    if(/<footer\b/i.test(documentHtml)){
      return documentHtml.replace(/<footer\b/i,seal+"<footer");
    }
    if(/<\/main>/i.test(documentHtml)){
      return documentHtml.replace(/<\/main>/i,seal+"</main>");
    }
    return documentHtml.replace(/<\/body>/i,seal+"</body>");
  }
  function premiumComponentPrefix(){
    var match=window.location.pathname.match(/^\/(en|es|de|it|fr|hi|zh|ar|ja|ru|ko|tr|nl|pl|sv|id|vi|uk)\//);
    return match?"/"+match[1]+"/":"/";
  }
  // O CSS global estiliza <header>; o hero dos formulários precisa neutralizar altura e deslocamento.
  function ensurePremiumLocalizedFormLayoutAfterWrite(){
    if(!/^\/(?:(?:en|es|fr|it|de|hi|zh|ja|ru|ko|tr|nl|pl|sv|id|vi|uk|ar)\/)?formulario_[^/]+\.html$/i.test(window.location.pathname)) return false;
    if(!document.querySelector("main.main-content > header.hero")) return false;
    var style=document.getElementById("premium-localized-form-layout-fix");
    if(!style){
      style=document.createElement("style");
      style.id="premium-localized-form-layout-fix";
      style.textContent=
        "#global-header-container{position:relative!important;z-index:2000!important;isolation:isolate;overflow:visible!important}"+
        "main.main-content>header.hero{position:relative!important;top:auto!important;left:auto!important;height:auto!important;min-height:0!important;z-index:0!important}"+
        "main.main-content>header.hero h1{white-space:normal!important;overflow-wrap:anywhere;word-break:normal;max-width:100%}"+
        "@media(max-width:640px){main.main-content>header.hero{padding:24px 18px!important}}";
      document.head.appendChild(style);
    }
    return true;
  }
  async function ensurePremiumFooterAfterWrite(){
    var container=document.getElementById("footer-placeholder");
    if(!container) return false;
    if(container.dataset.globalFooterReady==="1"||container.querySelector("footer")){
      container.dataset.globalFooterReady="1";
      return true;
    }
    try{
      var prefix=window.__FETCH_PREFIX||premiumComponentPrefix();
      var response=await fetch(prefix+"footer.html",{cache:"no-store"});
      if(!response.ok) throw new Error("footer_"+response.status);
      container.innerHTML=await response.text();
      if(typeof window.__FIX_RELATIVE_LINKS==="function") window.__FIX_RELATIVE_LINKS(container);
      container.dataset.globalFooterReady="1";
      return true;
    }catch(error){
      console.warn("[PremiumContent] falha ao carregar o rodapé global",error);
      return false;
    }
  }
  function ensurePremiumPromoAfterWrite(){
    window.__IS_PREMIUM_ROUTE=true;
    if(document.documentElement) document.documentElement.setAttribute("data-premium-route","true");

    var controller=window.__premiumPromoController;
    if(controller&&(!controller.root||!document.documentElement.contains(controller.root))){
      if(typeof controller.dispose==="function") controller.dispose();
      else window.__premiumPromoController=null;
    }

    function mountPromo(){
      var manager=window.AccessModules&&window.AccessModules.bannerManager;
      if(!manager||typeof manager.mount!=="function") return false;
      manager.mount({
        plan:window.Auth&&window.Auth.hasPlan&&window.Auth.hasPlan("premium")?"premium":"free"
      });
      return true;
    }

    if(mountPromo()) return;
    var existing=document.querySelector('script[src="/js/access/premium-banner-manager.js"]');
    if(existing){
      existing.addEventListener("load",mountPromo,{once:true});
      return;
    }
    var script=document.createElement("script");
    script.src="/js/access/premium-banner-manager.js";
    script.async=false;
    script.addEventListener("load",mountPromo,{once:true});
    document.head.appendChild(script);
  }
  async function ensureGlobalChromeAfterWrite(){
    ensurePremiumLocalizedFormLayoutAfterWrite();
    await ensurePremiumFooterAfterWrite();
    // O shell público já carregou os scripts globais. Após document.write(), o
    // novo DOM é reidratado pela instância existente, sem executar tudo duas vezes.
    for(var attempt=0;attempt<20;attempt++){
      if(document.body&&typeof window.__ENSURE_GLOBAL_CHROME==="function"){
        try{
          await window.__ENSURE_GLOBAL_CHROME();
          if(typeof window.__INIT_LANGUAGE_SELECTOR==="function") await window.__INIT_LANGUAGE_SELECTOR();
          ensurePremiumPromoAfterWrite();
          if(typeof window.__INIT_FORM_PDF_SIDE_ADS==="function") {
            Promise.resolve(window.__INIT_FORM_PDF_SIDE_ADS()).catch(function(error){console.warn("[PremiumContent] anúncios do formulário indisponíveis",error);});
          }
          return;
        }catch(error){
          console.warn("[PremiumContent] falha ao reidratar componentes globais",error);
        }
      }
      await new Promise(function(resolve){setTimeout(resolve,25);});
    }
    ensurePremiumPromoAfterWrite();
    if(typeof window.__INIT_FORM_PDF_SIDE_ADS==="function") {
      Promise.resolve(window.__INIT_FORM_PDF_SIDE_ADS()).catch(function(error){console.warn("[PremiumContent] anúncios do formulário indisponíveis",error);});
    }
    console.warn("[PremiumContent] componentes globais não ficaram disponíveis após a entrega protegida");
  }

  async function writePremiumDocument(res,key){
    var html=await res.text();
    if(!/^\s*<!doctype html/i.test(html)&&!/^\s*<html[\s>]/i.test(html)) throw new Error("invalid_premium_document");
    // O catálogo protegido pode conter resíduos do shell público de versões
    // anteriores. Removê-los aqui evita recursão do próprio loader após o
    // document.write e garante que o documento final seja o conteúdo real.
    html=html
      .replace(/<script[^>]+src=["'][^"']*premium-content-loader\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,"")
      .replace(/<script[^>]+src=["'][^"']*(?:global-scripts|lang-selector)\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,"")
      .replace(/<div[^>]+id=["']premium-content-placeholder["'][^>]*>[\s\S]*?<\/div>/gi,"");
    html=html.replace(/<html(\s[^>]*)?>/i,function(tag){
      if(/\bdata-premium-route\s*=/.test(tag)) return tag;
      return tag.replace(/>$/,' data-premium-route="true">');
    });
    html=stripPremiumAds(html);
    html=injectMedicamentosGovernanceSeal(html,key);
    document.open();
    document.write(html);
    try{
      document.close();
    }catch(error){
      // Alguns scripts legados do documento privado podem já existir no shell.
      // A entrega do conteúdo deve continuar e os componentes globais precisam
      // ser reidratados mesmo quando o navegador rejeita uma redeclaração.
      console.warn("[PremiumContent] document.close concluiu com aviso",error);
    }
    await ensureGlobalChromeAfterWrite();
  }
  function loadScript(src){
    return new Promise(function(resolve,reject){
      var existing=document.querySelector('script[src="'+src+'"]');
      if(existing){
        if(existing.dataset&&existing.dataset.premiumAuthLoaded==="true"){resolve();return;}
        existing.addEventListener("load",function(){resolve();},{once:true});
        existing.addEventListener("error",function(){reject(new Error("auth_script_load_failed:"+src));},{once:true});
        return;
      }
      var script=document.createElement("script");
      script.src=src;
      script.async=false;
      script.dataset.premiumAuthLoader="true";
      script.addEventListener("load",function(){
        if(script.dataset)script.dataset.premiumAuthLoaded="true";
        resolve();
      },{once:true});
      script.addEventListener("error",function(){reject(new Error("auth_script_load_failed:"+src));},{once:true});
      document.head.appendChild(script);
    });
  }
  async function ensureAuth(){
    // O global-scripts.js expõe um bootstrap único para toda a aplicação.
    // Premium deve reutilizar essa promessa em vez de iniciar uma segunda cadeia
    // concorrente de Firebase/Auth.
    if(typeof window.__ENSURE_AUTH==="function"){
      await window.__ENSURE_AUTH();
      return;
    }
    if(window.Auth&&typeof window.Auth.init==="function"){
      await window.Auth.init();
      return;
    }
    for(var i=0;i<AUTH_SCRIPTS.length;i++){
      if(window.Auth&&typeof window.Auth.init==="function")break;
      await loadScript(AUTH_SCRIPTS[i]);
    }
    if(!window.Auth||typeof window.Auth.init!=="function") throw new Error("auth_bootstrap_failed");
    await window.Auth.init();
  }
  function withTimeout(promise,ms,label){
    return new Promise(function(resolve,reject){
      var timer=setTimeout(function(){reject(new Error(label+"_timeout"));},ms);
      Promise.resolve(promise).then(function(value){clearTimeout(timer);resolve(value);},function(error){clearTimeout(timer);reject(error);});
    });
  }
  async function request(token,key,accessCheck){
    var controller=typeof AbortController==="function"?new AbortController():null;
    var timer=setTimeout(function(){if(controller)controller.abort();},REQUEST_TIMEOUT_MS);
    var headers={Accept:"text/html"};
    if(token) headers.Authorization="Bearer "+token;
    try{
      return await fetch(ENDPOINT+"?path="+encodeURIComponent(key||pathKey())+(accessCheck?"&access=check":""),{
        headers:headers,
        cache:"no-store",
        signal:controller?controller.signal:undefined
      });
    }finally{clearTimeout(timer);}
  }
  var actionAccess="unknown";
  var actionAccessPromise=null;
  var replayingControl=null;
  var replayingForm=null;
  var browserPrintAttempt=false;
  function setPrintAccess(allowed){
    if(document.documentElement) document.documentElement.setAttribute("data-premium-print-access",allowed?"premium":"free");
  }
  var ACTION_PATTERN=/(?:calcul|compute|calcola|berechn|bereken|oblicz|hesapla|tính|hitung|рассчит|розрах|計算|计算|계산|गणना|احسب|result|resultado|resultado|résultat|ergebnis|risultat|wynik|sonuç|kết quả|hasil|результ|結果|结果|결과|परिणाम|نتيجة|interpret|auswert|download|baixar|descarg|télécharg|scaric|herunterlad|pobierz|indir|tải|unduh|скач|завантаж|ダウンロード|下载|다운로드|डाउनलोड|تحميل|print|imprimir|imprime|stampa|drucken|afdruk|drukuj|yazdır|cetak|печ|друк|印刷|打印|인쇄|प्रिंट|طباعة|simulad|quiz|start|iniciar|começar|comenzar|commencer|inizia|starten|begin|rozpoczn|başla|bắt đầu|mulai|нача|поча|開始|开始|시작|शुरू|ابدأ|gerar[^a-z]{0,8}pdf|generate[^a-z]{0,8}pdf)/i;
  function localizedSubscriptionFallback(){
    var first=(window.location.pathname.split("/").filter(Boolean)[0]||"").toLowerCase();
    var langs={en:1,es:1,fr:1,it:1,de:1,hi:1,zh:1,ja:1,ru:1,ko:1,tr:1,nl:1,pl:1,sv:1,id:1,vi:1,uk:1,ar:1};
    return langs[first]?"/"+first+"/conta/assinatura.html":"/conta/assinatura.html";
  }
  function actionSubscription(){
    var u=encodeURIComponent(returnUrl());
    if(typeof window.__ACCOUNT_PAGE_URL==="function"){
      window.location.assign(window.__ACCOUNT_PAGE_URL("/conta/assinatura.html")+"&returnUrl="+u);
    }else{
      window.location.assign(localizedSubscriptionFallback()+"?returnUrl="+u);
    }
  }
  function actionDescriptor(control){
    return [
      control.id||"",control.className||"",control.getAttribute("name")||"",
      control.getAttribute("aria-label")||"",control.getAttribute("title")||"",
      control.getAttribute("value")||"",control.getAttribute("href")||"",
      control.getAttribute("onclick")||"",control.textContent||""
    ].join(" ").replace(/\s+/g," ").trim();
  }
  function premiumActionControl(target){
    var control=target&&target.closest?target.closest("button,input[type=button],input[type=submit],a"):null;
    if(!control) return null;
    if(control.closest("#global-header-container,#language-selector-placeholder,#footer-placeholder,#barraAcessibilidade,.off-canvas-menu,.menu-overlay,#cookieConsentBanner,.modal-overlay")) return null;
    if(control.closest('[data-premium-action="allow"]')) return null;
    if(control.closest('[data-premium-action="block"]')) return control;
    if(control.matches("a[download]")) return control;
    var href=control.getAttribute("href")||"";
    if(/\.pdf(?:$|[?#])/i.test(href)) return control;
    return ACTION_PATTERN.test(actionDescriptor(control))?control:null;
  }
  async function resolveActionAccess(force){
    if(actionAccess==="premium"&&!force){setPrintAccess(true);return true;}
    // Não reutilizar indefinidamente uma decisão Free: pagamento, concessão
    // administrativa ou reconciliação podem mudar durante a sessão.
    if(actionAccessPromise&&!force) return actionAccessPromise;
    actionAccessPromise=(async function(){
      try{
        await withTimeout(ensureAuth(),AUTH_TIMEOUT_MS,"action_auth");
        var auth=window.Auth;
        var user=auth&&auth.currentUser?auth.currentUser():null;
        if(!user){actionAccess="free";setPrintAccess(false);return false;}
        if(auth&&auth.hasPlan&&auth.hasPlan("premium")){actionAccess="premium";setPrintAccess(true);return true;}
        var token=await withTimeout(user.getIdToken(!!force),TOKEN_TIMEOUT_MS,"action_token");
        var currentKey=pathKey();
        var canonicalKey=canonicalPathKey();
        var res=await request(token,currentKey,true);
        if(res.status===404&&canonicalKey&&canonicalKey!==currentKey) res=await request(token,canonicalKey,true);
        if(res.status===401&&!force) return resolveActionAccess(true);
        actionAccess=res.ok?"premium":"free";
        setPrintAccess(actionAccess==="premium");
        return actionAccess==="premium";
      }catch(error){
        console.warn("[PremiumActionGate] não foi possível confirmar o plano",error);
        var auth=window.Auth;
        actionAccess=auth&&auth.hasPlan&&auth.hasPlan("premium")?"premium":"free";
        setPrintAccess(actionAccess==="premium");
        return actionAccess==="premium";
      }finally{
        actionAccessPromise=null;
      }
    })();
    return actionAccessPromise;
  }
  function replayControl(control){
    replayingControl=control;
    try{control.click();}finally{setTimeout(function(){replayingControl=null;},0);}
  }
  function replayForm(form,submitter){
    replayingForm=form;
    try{
      if(typeof form.requestSubmit==="function") form.requestSubmit(submitter||undefined);
      else form.submit();
    }finally{setTimeout(function(){replayingForm=null;},0);}
  }
  function installPremiumActionGate(){
    window.__PREMIUM_ACTION_GATE=true;
    document.addEventListener("click",function(event){
      var control=premiumActionControl(event.target);
      if(!control||control===replayingControl) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      resolveActionAccess(false).then(function(allowed){
        if(allowed) replayControl(control); else actionSubscription();
      });
    },true);
    document.addEventListener("submit",function(event){
      var form=event.target;
      if(!form||form===replayingForm||form.closest('[data-premium-action="allow"]')) return;
      if(!form.closest("main,.main-content,#main-content")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      resolveActionAccess(false).then(function(allowed){
        if(allowed) replayForm(form,event.submitter); else actionSubscription();
      });
    },true);
    document.addEventListener("keydown",function(event){
      var key=String(event.key||"").toLowerCase();
      if(key!=="p"||(!event.ctrlKey&&!event.metaKey)||event.altKey) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      resolveActionAccess(false).then(function(allowed){
        if(allowed) window.print(); else actionSubscription();
      });
    },true);
    window.addEventListener("beforeprint",function(){
      if(document.documentElement.getAttribute("data-premium-print-access")==="premium") return;
      browserPrintAttempt=true;
      setPrintAccess(false);
      resolveActionAccess(true);
    });
    window.addEventListener("afterprint",function(){
      if(!browserPrintAttempt) return;
      browserPrintAttempt=false;
      if(document.documentElement.getAttribute("data-premium-print-access")!=="premium") actionSubscription();
    });
  }
  async function load(){
    setPrintAccess(false);
    try{
      var placeholder=document.getElementById("premium-content-placeholder");
      if(placeholder){placeholder.hidden=true;placeholder.textContent="";}
      var currentKey=pathKey();
      var canonicalKey=canonicalPathKey();
      var publicRes=await request(null,currentKey);
      if(publicRes.status===404&&canonicalKey&&canonicalKey!==currentKey){
        publicRes=await request(null,canonicalKey);
      }
      if(publicRes.ok){
        await writePremiumDocument(publicRes,canonicalKey||currentKey);
        installPremiumActionGate();
        resolveActionAccess(false);
        return;
      }

      // Compatibilidade segura durante a publicação da nova Edge Function:
      // enquanto a entrega pública ainda não estiver ativa, o fluxo anterior
      // continua liberando somente assinantes reconhecidos.
      await withTimeout(ensureAuth(),AUTH_TIMEOUT_MS,"auth_bootstrap");
      var auth=window.Auth,user=auth&&auth.currentUser?auth.currentUser():null;
      if(!user){subscription();return;}
      var token=await withTimeout(user.getIdToken(false),TOKEN_TIMEOUT_MS,"token");
      var res=await request(token,currentKey);
      if(res.status===404&&canonicalKey&&canonicalKey!==currentKey) res=await request(token,canonicalKey);
      if(res.status===401){
        token=await withTimeout(user.getIdToken(true),TOKEN_TIMEOUT_MS,"token_refresh");
        res=await request(token,currentKey);
        if(res.status===404&&canonicalKey&&canonicalKey!==currentKey) res=await request(token,canonicalKey);
      }
      if(res.status===403){subscription();return;}
      if(res.status===404) throw new Error("premium_content_404");
      if(!res.ok) throw new Error("premium_content_"+res.status);
      await writePremiumDocument(res,canonicalKey||currentKey);
      actionAccess="premium";
      setPrintAccess(true);
      installPremiumActionGate();
    }catch(e){
      console.error("[PremiumContent] content unavailable",e);
      var msg=e&&e.message==="premium_content_404"
        ?"O conteúdo desta página não foi encontrado."
        :"Não foi possível carregar esta página neste momento. Tente novamente.";
      showError(msg);
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",load,{once:true}); else load();
})();
