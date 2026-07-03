/* ======================================================================
   layout.js — Header, Footer e sprite de ícones compartilhados
   Injeta em <div id="site-header"></div> e <div id="site-footer"></div>
   Página atual é lida de <body data-page="...">
   ====================================================================== */

const ICON_SPRITE = `
<svg style="display:none" aria-hidden="true"><defs>
  <symbol id="i-cross" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v9M7.5 12h9"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></symbol>
  <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></symbol>
  <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20.5 13.9A8.5 8.5 0 1 1 10.1 3.5a7 7 0 0 0 10.4 10.4z"/></symbol>
  <symbol id="i-file" viewBox="0 0 24 24"><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M15 3v4h4"/><line x1="8.5" y1="12" x2="15.5" y2="12"/><line x1="8.5" y1="15.5" x2="15.5" y2="15.5"/><line x1="8.5" y1="8.5" x2="11" y2="8.5"/></symbol>
  <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.3 2.5-5.8 5.5-5.8s5.5 2.5 5.5 5.8"/><circle cx="17.5" cy="9" r="2.4"/><path d="M15.7 14.5c2.4.3 4.3 2.4 4.3 5"/></symbol>
  <symbol id="i-trend" viewBox="0 0 24 24"><polyline points="3 17 9.5 10.5 13.5 14.5 21 6.5"/><polyline points="15 6.5 21 6.5 21 12.5"/></symbol>
  <symbol id="i-leaf" viewBox="0 0 24 24"><path d="M5 21c0-9.5 6.5-16 16-16 0 9.5-6.5 16-16 16z"/><path d="M5 21c3.2-3.2 6.3-6.5 9-11"/></symbol>
  <symbol id="i-rocket" viewBox="0 0 24 24"><path d="M12 2.5c3 2 5 6 5 10.3 0 2-.9 3.9-2 5.2l-3 3-3-3c-1.1-1.3-2-3.2-2-5.2 0-4.3 2-8.3 5-10.3z"/><circle cx="12" cy="11" r="1.8"/><path d="M8 17l-2.5 4.5M16 17l2.5 4.5"/></symbol>
  <symbol id="i-book" viewBox="0 0 24 24"><path d="M12 6.2c-2-1.6-5-2.1-8-1.6v13.6c3-.5 6 0 8 1.6 2-1.6 5-2.1 8-1.6V4.6c-3-.5-6 0-8 1.6z"/><line x1="12" y1="6.2" x2="12" y2="19.8"/></symbol>
  <symbol id="i-brain" viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="11" rx="2.5"/><circle cx="9.2" cy="13.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.8" cy="13.2" r="1.1" fill="currentColor" stroke="none"/><line x1="12" y1="4" x2="12" y2="8"/><circle cx="12" cy="3.4" r="1.2" fill="currentColor" stroke="none"/><line x1="2" y1="12.5" x2="5" y2="12.5"/><line x1="19" y1="12.5" x2="22" y2="12.5"/></symbol>
  <symbol id="i-cloud" viewBox="0 0 24 24"><path d="M6.5 18.5h11a4 4 0 0 0 0-8 6.2 6.2 0 0 0-11.8 1.6A3.6 3.6 0 0 0 6.5 18.5z"/></symbol>
  <symbol id="i-monitor" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16.5" x2="12" y2="20"/></symbol>
  <symbol id="i-gauge" viewBox="0 0 24 24"><circle cx="12" cy="12.5" r="8.5"/><line x1="12" y1="12.5" x2="15.5" y2="9"/><circle cx="12" cy="12.5" r="1" fill="currentColor" stroke="none"/><line x1="12" y1="4.3" x2="12" y2="5.8"/></symbol>
  <symbol id="i-sliders" viewBox="0 0 24 24"><line x1="6" y1="4" x2="6" y2="20"/><circle cx="6" cy="9.5" r="2" fill="#fff"/><line x1="12" y1="4" x2="12" y2="20"/><circle cx="12" cy="15.5" r="2" fill="#fff"/><line x1="18" y1="4" x2="18" y2="20"/><circle cx="18" cy="7.5" r="2" fill="#fff"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="8 12.5 10.8 15.3 16 9.3"/></symbol>
  <symbol id="i-bars" viewBox="0 0 24 24"><line x1="6" y1="20" x2="6" y2="12.5" stroke-width="2.6"/><line x1="12" y1="20" x2="12" y2="6" stroke-width="2.6"/><line x1="18" y1="20" x2="18" y2="15.5" stroke-width="2.6"/></symbol>
  <symbol id="i-access" viewBox="0 0 24 24"><circle cx="12" cy="4.3" r="1.8" fill="currentColor" stroke="none"/><path d="M4.5 9h15M12 9v5.5l-4.2 7.2M12 13.8l4.2 6.9"/></symbol>
  <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 5-3 8.2-7 9.2-4-1-7-4.2-7-9.2V6l7-3z"/></symbol>
  <symbol id="i-shieldcheck" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 5-3 8.2-7 9.2-4-1-7-4.2-7-9.2V6l7-3z"/><polyline points="9 12 11 14 15.5 9"/></symbol>
  <symbol id="i-bulb" viewBox="0 0 24 24"><path d="M9.5 18.5h5M10.3 21h3.4M12 3.2a6.2 6.2 0 0 0-3.2 11.5c1 .8 1.2 1.6 1.2 2.3h4c0-.7.2-1.5 1.2-2.3A6.2 6.2 0 0 0 12 3.2z"/></symbol>
  <symbol id="i-cookie" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9.5" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="8.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="9.5" cy="15" r="1" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-clipboard" viewBox="0 0 24 24"><rect x="5.5" y="4.5" width="13" height="16.5" rx="2"/><rect x="9" y="2.5" width="6" height="3.5" rx="1"/><line x1="8.5" y1="11.5" x2="15.5" y2="11.5"/><line x1="8.5" y1="15.5" x2="15.5" y2="15.5"/></symbol>
  <symbol id="i-clipcheck" viewBox="0 0 24 24"><rect x="5.5" y="4.5" width="13" height="16.5" rx="2"/><rect x="9" y="2.5" width="6" height="3.5" rx="1"/><polyline points="9 13 11 15 15 10.5"/></symbol>
  <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12.5M7 11.5l5 5 5-5"/><line x1="5" y1="20.5" x2="19" y2="20.5"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></symbol>
  <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2.2 4.8 13.5h5.8l-1 8.3 8.4-11.3h-5.8l1-8.3z"/></symbol>
  <symbol id="i-refresh" viewBox="0 0 24 24"><path d="M21.5 4v6h-6"/><path d="M2.5 20v-6h6"/><path d="M4 10a8 8 0 0 1 13.4-3.6L21.5 10"/><path d="M20 14a8 8 0 0 1-13.4 3.6L2.5 14"/></symbol>
  <symbol id="i-pulse" viewBox="0 0 24 24"><polyline points="2.5 13 7.5 13 9.5 6 13.5 19 16 13 21.5 13"/></symbol>
  <symbol id="i-headphone" viewBox="0 0 24 24"><path d="M4 14a8 8 0 0 1 16 0"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></symbol>
  <symbol id="i-share" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><line x1="8" y1="11" x2="16" y2="7"/><line x1="8" y1="13" x2="16" y2="17"/></symbol>
  <symbol id="i-bookmark" viewBox="0 0 24 24"><path d="M6 3.5h12v17l-6-4-6 4z"/></symbol>
  <symbol id="i-printer" viewBox="0 0 24 24"><rect x="6" y="9" width="12" height="7" rx="1.5"/><path d="M7 9V4.5h10V9"/><path d="M7 16v3.5h10V16"/><circle cx="16" cy="12" r="0.6" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z"/></symbol>
  <symbol id="i-warning" viewBox="0 0 24 24"><path d="M12 3.5l10 17.5H2z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="17.7" r="0.7" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-headset" viewBox="0 0 24 24"><path d="M4 14a8 8 0 0 1 16 0v4"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M20 18a3 3 0 0 1-3 3h-2"/></symbol>
  <symbol id="i-play" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M10 8.3l6 3.7-6 3.7z" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-handshake" viewBox="0 0 24 24"><path d="M2 12l4-3 3 2 3-2 3 2 3-2 4 3"/><path d="M7 11l3 6M14 11l-3 6"/></symbol>
  <symbol id="i-building" viewBox="0 0 24 24"><rect x="4" y="3" width="10" height="18" rx="1"/><rect x="14" y="9" width="6" height="12" rx="1"/><line x1="7" y1="7" x2="7.01" y2="7"/><line x1="11" y1="7" x2="11.01" y2="7"/><line x1="7" y1="11" x2="7.01" y2="11"/><line x1="11" y1="11" x2="11.01" y2="11"/><line x1="7" y1="15" x2="7.01" y2="15"/><line x1="11" y1="15" x2="11.01" y2="15"/></symbol>
  <symbol id="i-briefcase" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="3" y1="13" x2="21" y2="13"/></symbol>
  <symbol id="i-flask" viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 9V3"/><line x1="8" y1="15" x2="16" y2="15"/></symbol>
  <symbol id="i-stetho" viewBox="0 0 24 24"><path d="M5 3v5a3 3 0 0 0 6 0V3"/><path d="M8 11v2.5a6 6 0 0 0 12 0v-1.5"/><circle cx="20" cy="10.5" r="2.2"/></symbol>
  <symbol id="i-cap" viewBox="0 0 24 24"><path d="M12 4.5 2 9l10 4.5L22 9z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/><line x1="22" y1="9" x2="22" y2="15"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></symbol>
  <symbol id="i-person" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/></symbol>
  <symbol id="i-facebook" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M14 8.5h-1.5c-.8 0-1 .4-1 1.1V11h2.5l-.4 2.5h-2.1V20h-2.5v-6.5H9V11h1.9V9.2c0-1.9 1.1-3 3-3H14z" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-instagram" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="0.7" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-linkedin" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><line x1="7.5" y1="10" x2="7.5" y2="17"/><circle cx="7.5" cy="7" r="0.8" fill="currentColor" stroke="none"/><path d="M11.5 17v-4a2.3 2.3 0 0 1 4.6 0v4M11.5 10v7"/></symbol>
  <symbol id="i-youtube" viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="4"/><path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/></symbol>
  <symbol id="i-network" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M12 7.2v5M10.5 13.5 6.5 16M13.5 13.5l4 2.5"/></symbol>
</defs></svg>`;

function headerHTML(active){
  const nav = (key, label, href) => `<a href="${href}" class="${active===key?'active':''}">${label}</a>`;
  return `
  <div class="nav-wrap">
    <div class="brand">
      <a href="institucional.html" style="display:flex; align-items:center; gap:10px;">
        <div class="brand-mark"><svg class="icon"><use href="#i-cross"/></svg></div>
        <div class="brand-text">
          <div class="l1">Calculadoras de<br>Enfermagem</div>
          <div class="l2">Global Platform</div>
        </div>
      </a>
    </div>
    <nav class="links">
      ${nav('inicio','Início','institucional.html')}
      <div class="navlink"><a>Ferramentas <span class="caret">▾</span></a>
        <div class="dropdown-panel">
          <a href="institucional.html#ecossistema">Ecossistema de soluções</a>
          <a href="institucional.html#ecossistema">Calculadoras clínicas</a>
          <a href="institucional.html#ecossistema">Escalas de avaliação</a>
        </div>
      </div>
      <div class="navlink"><a>Educação <span class="caret">▾</span></a>
        <div class="dropdown-panel">
          <a href="institucional.html#pilares">Trilhas e certificações</a>
          <a href="institucional.html#pilares">Biblioteca</a>
        </div>
      </div>
      <div class="navlink"><a>Gestão <span class="caret">▾</span></a>
        <div class="dropdown-panel">
          <a href="sustentabilidade-digital.html">Governança responsável</a>
          <a href="institucional.html#pilares">Indicadores e KPIs</a>
        </div>
      </div>
      <div class="navlink"><a>Recursos <span class="caret">▾</span></a>
        <div class="dropdown-panel">
          <a href="sustentabilidade-digital.html">Sustentabilidade digital</a>
          <a href="privacidade.html">Central de privacidade</a>
        </div>
      </div>
      <div class="navlink"><a class="${active==='institucional'?'active':''}">Institucional <span class="caret">▾</span></a>
        <div class="dropdown-panel">
          <a href="institucional.html">Sobre a plataforma</a>
          <a href="sustentabilidade-digital.html">Sustentabilidade digital</a>
          <a href="privacidade.html">Central de privacidade</a>
        </div>
      </div>
    </nav>
    <div class="nav-right">
      <button class="icon-btn" aria-label="Buscar"><svg class="icon icon-lg"><use href="#i-search"/></svg></button>
      <div class="lang-wrap" id="lang-wrap">
        <button class="lang" id="lang-toggle"><svg class="icon icon-sm"><use href="#i-globe"/></svg> <span id="lang-current">PT</span> ▾</button>
        <div class="lang-menu" id="lang-menu"></div>
      </div>
      <button class="icon-btn" aria-label="Alternar tema"><svg class="icon icon-lg"><use href="#i-moon"/></svg></button>
      <a class="btn btn-outline-navy" href="#">Entrar</a>
      <a class="btn btn-green" href="#">Criar conta</a>
      <button class="icon-btn menu-toggle" id="menu-toggle" aria-label="Menu"><svg class="icon icon-lg"><use href="#i-menu"/></svg></button>
    </div>
  </div>`;
}

function footerHTML(){
  return `
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="institucional.html" style="display:flex; align-items:center; gap:10px;">
          <div class="brand-mark"><svg class="icon"><use href="#i-cross"/></svg></div>
          <div class="brand-text">
            <div class="l1">Calculadoras de<br>Enfermagem</div>
            <div class="l2">Global Platform</div>
          </div>
        </a>
        <p>Plataforma global de assistência, educação e gestão para a enfermagem — presente em 195+ países e 30 idiomas.</p>
        <div class="social-row">
          <a href="#" aria-label="Facebook"><svg class="icon icon-sm"><use href="#i-facebook"/></svg></a>
          <a href="#" aria-label="Instagram"><svg class="icon icon-sm"><use href="#i-instagram"/></svg></a>
          <a href="#" aria-label="LinkedIn"><svg class="icon icon-sm"><use href="#i-linkedin"/></svg></a>
          <a href="#" aria-label="YouTube"><svg class="icon icon-sm"><use href="#i-youtube"/></svg></a>
        </div>
      </div>
      <div class="footer-col">
        <h5>Institucional</h5>
        <a href="institucional.html">Quem somos</a>
        <a href="institucional.html#pilares">Missão, Visão e Valores</a>
        <a href="institucional.html">Nossa História</a>
        <a href="#">Carreiras</a>
        <a href="#">Imprensa</a>
      </div>
      <div class="footer-col">
        <h5>Recursos</h5>
        <a href="#">Blog</a>
        <a href="#">Dicas do dia</a>
        <a href="#">Webinars</a>
        <a href="#">Biblioteca</a>
        <a href="#">Newsletter</a>
      </div>
      <div class="footer-col">
        <h5>Suporte</h5>
        <a href="#">Central de Ajuda</a>
        <a href="#">Fale Conosco</a>
        <a href="#">Tutoriais</a>
        <a href="privacidade.html">Termos de Uso</a>
        <a href="privacidade.html">Política de Privacidade</a>
      </div>
      <div class="footer-col">
        <h5>Newsletter</h5>
        <p style="font-size:12.5px; color:var(--muted); line-height:1.6;">Receba conteúdos exclusivos sobre enfermagem, gestão e saúde.</p>
        <form class="newsletter-form" onsubmit="return false;">
          <input type="email" placeholder="Seu e-mail" required>
          <button type="submit">Inscrever-se</button>
        </form>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© <span id="footer-year"></span> Calculadoras de Enfermagem Global Platform. Todos os direitos reservados.</div>
      <div class="lang-wrap">
        <button class="lang" id="lang-toggle-2">Idioma: <span id="lang-current-2">Português (Brasil)</span> ▾</button>
        <div class="lang-menu" id="lang-menu-2" style="right:0; left:auto;"></div>
      </div>
    </div>
  </div>`;
}

function mountLayout(){
  document.body.insertAdjacentHTML('afterbegin', ICON_SPRITE);
  const page = document.body.getAttribute('data-page') || '';
  const headerMount = document.getElementById('site-header');
  const footerMount = document.getElementById('site-footer');
  if(headerMount){ headerMount.innerHTML = headerHTML(page); }
  if(footerMount){ footerMount.innerHTML = footerHTML(); }
  const yearEl = document.getElementById('footer-year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // mobile nav toggle
  const menuToggle = document.getElementById('menu-toggle');
  const links = document.querySelector('nav.links');
  if(menuToggle && links){
    menuToggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  if(window.initLanguageSwitcher) window.initLanguageSwitcher();
}

document.addEventListener('DOMContentLoaded', mountLayout);
