/* ======================================================================
   i18n.js — Motor de internacionalização
   Suporta 30 idiomas no seletor. Traduções completas para os elementos
   marcados com [data-i18n] em pt-BR (padrão), en e es (demonstração
   funcional do motor). Demais idiomas ficam prontos na lista do seletor
   e herdam o texto-fonte em pt-BR até que o dicionário seja preenchido —
   basta adicionar a chave do idioma em TRANSLATIONS para ativá-lo.
   ====================================================================== */

const LANGUAGES = [
  { code:'pt-BR', native:'Português (Brasil)' },
  { code:'en',    native:'English' },
  { code:'es',    native:'Español' },
  { code:'fr',    native:'Français' },
  { code:'de',    native:'Deutsch' },
  { code:'it',    native:'Italiano' },
  { code:'nl',    native:'Nederlands' },
  { code:'pl',    native:'Polski' },
  { code:'ru',    native:'Русский' },
  { code:'tr',    native:'Türkçe' },
  { code:'ar',    native:'العربية' },
  { code:'he',    native:'עברית' },
  { code:'hi',    native:'हिन्दी' },
  { code:'bn',    native:'বাংলা' },
  { code:'zh-CN', native:'中文（简体）' },
  { code:'zh-TW', native:'中文（繁體）' },
  { code:'ja',    native:'日本語' },
  { code:'ko',    native:'한국어' },
  { code:'vi',    native:'Tiếng Việt' },
  { code:'th',    native:'ไทย' },
  { code:'id',    native:'Bahasa Indonesia' },
  { code:'ms',    native:'Bahasa Melayu' },
  { code:'tl',    native:'Filipino' },
  { code:'sw',    native:'Kiswahili' },
  { code:'am',    native:'አማርኛ' },
  { code:'el',    native:'Ελληνικά' },
  { code:'ro',    native:'Română' },
  { code:'hu',    native:'Magyar' },
  { code:'cs',    native:'Čeština' },
  { code:'sv',    native:'Svenska' },
];

const TRANSLATIONS = {
  en: {
    'nav.inicio':'Home', 'nav.ferramentas':'Tools', 'nav.educacao':'Education', 'nav.gestao':'Management',
    'nav.recursos':'Resources', 'nav.institucional':'Institutional',
    'nav.entrar':'Log in', 'nav.criar':'Create account',
    'util.leitura':'Read aloud', 'util.compartilhar':'Share', 'util.salvar':'Save', 'util.imprimir':'Print',
    'util.avalie':'Rate this content',
    'footer.institucional':'Institutional', 'footer.recursos':'Resources', 'footer.suporte':'Support', 'footer.newsletter':'Newsletter',
    'footer.quemsomos':'About us', 'footer.missao':'Mission, Vision & Values', 'footer.historia':'Our History',
    'footer.carreiras':'Careers', 'footer.imprensa':'Press',
    'footer.blog':'Blog', 'footer.dicas':'Tip of the day', 'footer.webinars':'Webinars', 'footer.biblioteca':'Library', 'footer.news':'Newsletter',
    'footer.ajuda':'Help Center', 'footer.fale':'Contact Us', 'footer.tutoriais':'Tutorials', 'footer.termos':'Terms of Use', 'footer.privacidade':'Privacy Policy',
    'footer.newsletter-desc':'Get exclusive content on nursing, management and health.',
    'footer.email-ph':'Your email', 'footer.inscrever':'Subscribe',
    'footer.rights':'All rights reserved.',
    'idx.hero.title1':'Our Commitment to', 'idx.hero.title2':'Digital Sustainability',
    'idx.hero.desc':'We build a platform that uses technology, data and innovation to expand access to nursing knowledge with social, environmental and technological responsibility.',
    'idx.hero.btn1':'See our strategy', 'idx.hero.btn2':'View impact report',
    'idx.tab1':'Digital Sustainability', 'idx.tab2':'Green Technology', 'idx.tab3':'Impact Report', 'idx.tab4':'Responsible Governance',
    'inst.hero.title':'Transforming Nursing with Clinical Intelligence and Global Management',
    'inst.hero.desc':'The most complete educational, care and governance platform for students, professionals and institutions.',
    'inst.hero.btn1':'Explore Tools', 'inst.hero.btn2':'Start Learning',
    'priv.hero.title':'Privacy Center',
    'priv.hero.sub':'Transparency, trust and respect for your privacy.',
    'priv.hero.desc':'Learn how we collect, use and protect your information when you use the Nursing Calculators Global Platform.',
  },
  es: {
    'nav.inicio':'Inicio', 'nav.ferramentas':'Herramientas', 'nav.educacao':'Educación', 'nav.gestao':'Gestión',
    'nav.recursos':'Recursos', 'nav.institucional':'Institucional',
    'nav.entrar':'Iniciar sesión', 'nav.criar':'Crear cuenta',
    'util.leitura':'Leer en voz alta', 'util.compartilhar':'Compartir', 'util.salvar':'Guardar', 'util.imprimir':'Imprimir',
    'util.avalie':'Valora este contenido',
    'footer.institucional':'Institucional', 'footer.recursos':'Recursos', 'footer.suporte':'Soporte', 'footer.newsletter':'Boletín',
    'footer.quemsomos':'Quiénes somos', 'footer.missao':'Misión, Visión y Valores', 'footer.historia':'Nuestra Historia',
    'footer.carreiras':'Carreras', 'footer.imprensa':'Prensa',
    'footer.blog':'Blog', 'footer.dicas':'Consejo del día', 'footer.webinars':'Webinars', 'footer.biblioteca':'Biblioteca', 'footer.news':'Boletín',
    'footer.ajuda':'Centro de Ayuda', 'footer.fale':'Contáctenos', 'footer.tutoriais':'Tutoriales', 'footer.termos':'Términos de Uso', 'footer.privacidade':'Política de Privacidad',
    'footer.newsletter-desc':'Recibe contenido exclusivo sobre enfermería, gestión y salud.',
    'footer.email-ph':'Tu correo', 'footer.inscrever':'Suscribirse',
    'footer.rights':'Todos los derechos reservados.',
    'idx.hero.title1':'Nuestro Compromiso con la', 'idx.hero.title2':'Sostenibilidad Digital',
    'idx.hero.desc':'Construimos una plataforma que utiliza tecnología, datos e innovación para ampliar el acceso al conocimiento en enfermería con responsabilidad social, ambiental y tecnológica.',
    'idx.hero.btn1':'Conoce nuestra estrategia', 'idx.hero.btn2':'Ver informe de impacto',
    'idx.tab1':'Sostenibilidad Digital', 'idx.tab2':'Tecnología Verde', 'idx.tab3':'Informe de Impacto', 'idx.tab4':'Gobernanza Responsable',
    'inst.hero.title':'Transformando la Enfermería con Inteligencia Clínica y Gestión Global',
    'inst.hero.desc':'La plataforma educativa, asistencial y de gobernanza más completa para estudiantes, profesionales e instituciones.',
    'inst.hero.btn1':'Explorar Herramientas', 'inst.hero.btn2':'Comenzar Aprendizaje',
    'priv.hero.title':'Centro de Privacidad',
    'priv.hero.sub':'Transparencia, confianza y respeto por tu privacidad.',
    'priv.hero.desc':'Descubre cómo recopilamos, usamos y protegemos tu información al utilizar Calculadoras de Enfermagem Global Platform.',
  }
};

function currentLang(){ return localStorage.getItem('site-lang') || 'pt-BR'; }

function applyLanguage(code){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if(!el.dataset.i18nOriginal) el.dataset.i18nOriginal = el.innerHTML;
    const key = el.getAttribute('data-i18n');
    const dict = TRANSLATIONS[code];
    if(code === 'pt-BR' || !dict || !dict[key]){
      el.innerHTML = el.dataset.i18nOriginal;
    } else {
      el.innerHTML = dict[key];
    }
  });
  localStorage.setItem('site-lang', code);
  const lang = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
  document.querySelectorAll('#lang-current').forEach(el => el.textContent = lang.code.split('-')[0].toUpperCase());
  document.querySelectorAll('#lang-current-2').forEach(el => el.textContent = lang.native);
  document.documentElement.lang = code;
  document.querySelectorAll('.lang-menu button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-code') === code);
  });
}

function buildLangMenu(menuEl){
  if(!menuEl) return;
  const supported = new Set(['pt-BR', ...Object.keys(TRANSLATIONS)]);
  menuEl.innerHTML = LANGUAGES.map(l => `
    <button data-code="${l.code}" class="${currentLang()===l.code?'active':''}">
      <span>${l.native}</span>
      ${supported.has(l.code) ? '' : '<span style="font-size:9px;color:var(--muted)">em breve</span>'}
    </button>`).join('') +
    `<div class="lang-note">Motor de tradução ativo para 3 idiomas (pt-BR, en, es). Estrutura pronta para os 30 idiomas do seletor — novos dicionários podem ser adicionados a qualquer momento.</div>`;
  menuEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLanguage(btn.getAttribute('data-code'));
      menuEl.classList.remove('open');
    });
  });
}

window.initLanguageSwitcher = function(){
  const menu1 = document.getElementById('lang-menu');
  const menu2 = document.getElementById('lang-menu-2');
  buildLangMenu(menu1);
  buildLangMenu(menu2);
  const toggle1 = document.getElementById('lang-toggle');
  const toggle2 = document.getElementById('lang-toggle-2');
  if(toggle1) toggle1.addEventListener('click', (e) => { e.stopPropagation(); menu1.classList.toggle('open'); menu2 && menu2.classList.remove('open'); });
  if(toggle2) toggle2.addEventListener('click', (e) => { e.stopPropagation(); menu2.classList.toggle('open'); menu1 && menu1.classList.remove('open'); });
  document.addEventListener('click', () => { menu1 && menu1.classList.remove('open'); menu2 && menu2.classList.remove('open'); });
  applyLanguage(currentLang());
};
