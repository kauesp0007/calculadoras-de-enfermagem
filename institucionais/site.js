/* ======================================================================
   site.js — Abas (tabs), barra de utilidades (A+/A-, leitura, compartilhar,
   salvar, imprimir, avaliação por estrelas)
   ====================================================================== */

function initTabs(){
  document.querySelectorAll('[data-tab-group]').forEach(group => {
    const tabs = group.querySelectorAll('.tab');
    const panelsWrap = document.querySelector(`[data-tab-panels="${group.getAttribute('data-tab-group')}"]`);
    if(!panelsWrap) return;
    const panels = panelsWrap.querySelectorAll('.tab-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-tab');
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        panels.forEach(p => p.classList.toggle('active', p.getAttribute('data-tab-panel') === key));
        panelsWrap.scrollIntoView({behavior:'smooth', block:'nearest'});
      });
    });
  });
}

function showToast(msg){
  let toast = document.getElementById('site-toast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#0b1f38;color:#fff;padding:12px 20px;border-radius:999px;font-size:13px;font-weight:600;z-index:999;opacity:0;transition:all .25s;box-shadow:0 10px 30px rgba(0,0,0,.25);pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => { toast.style.opacity='1'; toast.style.transform='translateX(-50%) translateY(0)'; });
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(-50%) translateY(20px)'; }, 2200);
}

function initUtilityBar(){
  // font size
  let step = parseInt(localStorage.getItem('site-fontstep') || '0', 10);
  const applyStep = () => { document.documentElement.style.fontSize = (100 + step*8) + '%'; };
  applyStep();
  document.querySelectorAll('[data-fontsize]').forEach(btn => {
    btn.addEventListener('click', () => {
      step += btn.getAttribute('data-fontsize') === 'inc' ? 1 : -1;
      step = Math.max(-2, Math.min(3, step));
      localStorage.setItem('site-fontstep', step);
      applyStep();
    });
  });

  // read aloud
  document.querySelectorAll('[data-action="read"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(!('speechSynthesis' in window)){ showToast('Leitura em voz alta não suportada neste navegador.'); return; }
      if(speechSynthesis.speaking){ speechSynthesis.cancel(); btn.classList.remove('is-saved'); return; }
      const target = document.querySelector('main') || document.body;
      const text = target.innerText.slice(0, 4000);
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = document.documentElement.lang || 'pt-BR';
      speechSynthesis.speak(utter);
      showToast('Lendo conteúdo em voz alta…');
    });
  });

  // share
  document.querySelectorAll('[data-action="share"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const shareData = { title: document.title, url: location.href };
      if(navigator.share){ try{ await navigator.share(shareData); }catch(e){} }
      else if(navigator.clipboard){ await navigator.clipboard.writeText(location.href); showToast('Link copiado para a área de transferência.'); }
    });
  });

  // save / bookmark
  document.querySelectorAll('[data-action="save"]').forEach(btn => {
    const key = 'saved:' + location.pathname;
    if(localStorage.getItem(key)) btn.classList.add('is-saved');
    btn.addEventListener('click', () => {
      const saved = btn.classList.toggle('is-saved');
      if(saved){ localStorage.setItem(key, '1'); showToast('Página salva.'); }
      else { localStorage.removeItem(key); showToast('Página removida dos salvos.'); }
    });
  });

  // print
  document.querySelectorAll('[data-action="print"]').forEach(btn => {
    btn.addEventListener('click', () => window.print());
  });

  // star rating
  document.querySelectorAll('.stars').forEach(group => {
    const key = 'rating:' + location.pathname;
    const saved = parseInt(localStorage.getItem(key) || '0', 10);
    const stars = [...group.querySelectorAll('button')];
    const paint = (val, persist) => {
      stars.forEach(s => s.classList.toggle('on', parseInt(s.getAttribute('data-star'),10) <= val));
      group.classList.toggle('rated', val > 0);
      if(persist) localStorage.setItem(key, val);
    };
    paint(saved, false);
    stars.forEach(s => {
      s.addEventListener('mouseenter', () => paint(parseInt(s.getAttribute('data-star'),10), false));
      s.addEventListener('click', () => { paint(parseInt(s.getAttribute('data-star'),10), true); showToast('Obrigado pela sua avaliação!'); });
    });
    group.addEventListener('mouseleave', () => paint(parseInt(localStorage.getItem(key) || '0',10), false));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initUtilityBar();
});
