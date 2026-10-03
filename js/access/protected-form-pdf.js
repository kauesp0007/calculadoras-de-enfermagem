(function(window,document){
  'use strict';
  var viewers=Array.from(document.querySelectorAll('.protected-pdf-viewer'));
  if(!viewers.length&&!document.querySelector('[data-protected-pdf-action]')) return;
  // Restrição da interface da prévia; os bytes exibidos não são DRM.
  viewers.forEach(function(viewer){viewer.querySelectorAll('img').forEach(function(image){image.draggable=false;image.style.webkitTouchCallout='none';});});
  function blockPreviewImage(event){if(event.target&&typeof event.target.closest==='function'&&event.target.closest('.protected-pdf-viewer img'))event.preventDefault();}
  document.addEventListener('contextmenu',blockPreviewImage,true);
  document.addEventListener('dragstart',blockPreviewImage,true);
  var lang=document.documentElement.lang||'pt',en=/^en/i.test(lang),es=/^es/i.test(lang);
  var messages={premium:en?'PDF download and printing require Premium.':es?'La descarga e impresión del PDF requieren Premium.':'Download e impressão do PDF disponíveis no Premium.',error:en?'Unable to open the PDF. Please try again.':es?'No se pudo abrir el PDF. Inténtalo de nuevo.':'Não foi possível abrir o PDF. Tente novamente.'};
  var urls=new Set(),generation=0;
  function status(text){viewers.forEach(function(v){var p=v.querySelector('.protected-pdf-status');if(p)p.textContent=text;});}
  function invalidate(){generation++;urls.forEach(function(url){URL.revokeObjectURL(url);});urls.clear();viewers.forEach(function(v){v.querySelectorAll('iframe').forEach(function(f){f.remove();});var image=v.querySelector('img');if(image)image.hidden=false;});}
  async function authReady(){if(typeof window.__ENSURE_AUTH==='function')await window.__ENSURE_AUTH();var auth=window.Auth;if(auth&&auth.whenReady)await auth.whenReady();return auth;}
  async function authorizedPdf(control){
    var auth=await authReady(),user=auth&&auth.currentUser?auth.currentUser():null;
    if(!user)throw new Error('premium_required');
    var current=generation;
    var url='https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/premium-content?path='+encodeURIComponent(control.dataset.protectedPdfCatalog)+'&download='+encodeURIComponent(control.dataset.protectedPdfId);
    async function request(refresh){return fetch(url,{headers:{Authorization:'Bearer '+await user.getIdToken(refresh)},cache:'no-store',signal:AbortSignal.timeout(25000)});}
    var response=await request(false);if(response.status===401)response=await request(true);
    if(response.status===401||response.status===403)throw new Error('premium_required');
    if(!response.ok||!/^application\/pdf\b/i.test(response.headers.get('Content-Type')||''))throw new Error('pdf_unavailable');
    var blob=await response.blob();if(await blob.slice(0,5).text()!=='%PDF-')throw new Error('invalid_pdf');
    if(current!==generation||!auth.currentUser()||auth.currentUser().uid!==user.uid)throw new Error('session_changed');
    var objectUrl=URL.createObjectURL(blob);urls.add(objectUrl);
    var match=(response.headers.get('Content-Disposition')||'').match(/filename\*=UTF-8''([^;]+)/i);
    return {url:objectUrl,name:match?decodeURIComponent(match[1]):'formulario.pdf'};
  }
  function offer(){status(messages.premium);var returnUrl=encodeURIComponent(location.pathname+location.search);var target=window.__ACCOUNT_PAGE_URL?window.__ACCOUNT_PAGE_URL('/conta/assinatura.html'):'/conta/assinatura.html';location.assign(target+(target.includes('?')?'&':'?')+'returnUrl='+returnUrl);}
  async function activate(control,mode){
    try{var pdf=await authorizedPdf(control);if(mode==='download'){var a=document.createElement('a');a.href=pdf.url;a.download=pdf.name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(pdf.url);urls.delete(pdf.url);},60000);}else if(mode==='print'){window.open(pdf.url,'_blank','noopener');}else{var v=control,frame=document.createElement('iframe');v.querySelectorAll('iframe').forEach(function(f){var old=f.src;f.remove();URL.revokeObjectURL(old);urls.delete(old);});frame.src=pdf.url;frame.title=en?'Premium form PDF':es?'PDF del formulario Premium':'PDF do formulário Premium';frame.className='pdf-frame';v.querySelector('img').hidden=true;v.appendChild(frame);}}catch(error){if(error.message==='premium_required'&&mode!=='preview')offer();else if(mode!=='preview'&&error.message!=='session_changed')status(messages.error);}
  }
  document.addEventListener('click',function(event){var control=event.target.closest('[data-protected-pdf-action]');if(!control)return;event.preventDefault();event.stopImmediatePropagation();activate(control,control.dataset.protectedPdfAction);},true);
  document.addEventListener('auth:logout',invalidate);
  document.addEventListener('auth:changed',invalidate);
  window.addEventListener('pagehide',invalidate);
  (async function(){try{var auth=await authReady();function refresh(){invalidate();if(auth&&auth.hasPlan&&auth.hasPlan('premium'))viewers.forEach(function(v){activate(v,'preview');});}if(auth&&auth.onAuthChange)auth.onAuthChange(refresh);if(auth&&auth.onProfileChange)auth.onProfileChange(refresh);refresh();}catch(_){}})();
})(window,document);
