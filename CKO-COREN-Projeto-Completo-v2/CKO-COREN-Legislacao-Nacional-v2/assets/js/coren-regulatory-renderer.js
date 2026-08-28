/**
 * coren-regulatory-renderer (browser) — v2.0.0
 *
 * Papel: RENDERER PURO / hidratacao. O conteudo ja chega pre-renderizado do
 * build. Este modulo:
 *   - le o ValidatedProjectionDTO embutido na pagina;
 *   - liga interacoes (busca, favoritos, leitura em voz, impressao);
 *   - aplica o contrato de privacidade do estado local.
 *
 * O que este modulo NAO faz (movido para engines/validators no build):
 *   - resolver estado temporal, relacoes ou aplicabilidade;
 *   - decidir elegibilidade de projecao;
 *   - montar conteudo normativo;
 *   - buscar canonico, catalogo ou registries em runtime.
 */
const VERSION = '2.0.0';

/** Contrato de estado local — espelha contracts/user-state-privacy.contract.json */
const PRIVACY = {
  prefix: 'cko:coren:v1:',
  retentionDays: 180,
  purposes: { fav: 'favorito local', review: 'marcado para revisao local' },
};

const store = {
  key: (fn) => `${PRIVACY.prefix}${fn}:${location.pathname}`,
  read(fn) {
    try {
      const raw = localStorage.getItem(store.key(fn));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  write(fn, on) {
    try {
      if (!on) return localStorage.removeItem(store.key(fn));
      localStorage.setItem(store.key(fn), JSON.stringify({
        v: 1, on: true, purpose: PRIVACY.purposes[fn], last_touch: Date.now(),
      }));
    } catch { /* armazenamento indisponivel: funcionalidade degrada em silencio */ }
  },
  purge() {
    try {
      const limit = Date.now() - PRIVACY.retentionDays * 864e5;
      for (const k of Object.keys(localStorage)) {
        if (!k.startsWith(PRIVACY.prefix)) continue;
        let rec = null;
        try { rec = JSON.parse(localStorage.getItem(k)); } catch { /* registro corrompido */ }
        if (!rec || !rec.last_touch || rec.last_touch < limit) localStorage.removeItem(k);
      }
    } catch { /* noop */ }
  },
  clearAll() {
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith(PRIVACY.prefix)) localStorage.removeItem(k);
    } catch { /* noop */ }
  },
};

function readDto() {
  const el = document.getElementById('projection-dto');
  if (!el) return null;
  try { return JSON.parse(el.textContent); } catch { return null; }
}

function announce(msg) {
  const live = document.getElementById('cko-live');
  if (live) live.textContent = msg;
}

function wireActions() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'print') { window.print(); return; }

    if (action === 'share') {
      navigator.clipboard?.writeText(location.href)
        .then(() => announce('Link copiado para a área de transferência.'))
        .catch(() => announce('Não foi possível copiar o link.'));
      return;
    }

    if (action === 'listen') {
      if (!('speechSynthesis' in window)) return announce('Leitura em voz não suportada neste navegador.');
      const speaking = speechSynthesis.speaking;
      speechSynthesis.cancel();
      if (speaking) return announce('Leitura interrompida.');
      const u = new SpeechSynthesisUtterance(document.getElementById('mount')?.innerText || '');
      u.lang = 'pt-BR';
      speechSynthesis.speak(u);
      announce('Iniciando leitura da página.');
      return;
    }

    if (action === 'fav' || action === 'review') {
      const on = !!store.read(action)?.on;
      store.write(action, !on);
      btn.setAttribute('aria-pressed', String(!on));
      btn.classList.toggle('active', !on);
      announce(!on ? 'Marcado neste dispositivo.' : 'Marcação removida.');
      return;
    }

    if (action === 'clear-local') {
      store.clearAll();
      document.querySelectorAll('[data-action="fav"],[data-action="review"]').forEach((b) => {
        b.setAttribute('aria-pressed', 'false');
        b.classList.remove('active');
      });
      announce('Dados locais deste módulo foram apagados.');
    }
  });
}

function restoreState() {
  for (const fn of ['fav', 'review']) {
    if (!store.read(fn)?.on) continue;
    const b = document.querySelector(`[data-action="${fn}"]`);
    if (b) { b.setAttribute('aria-pressed', 'true'); b.classList.add('active'); }
  }
}

function wireSearch() {
  const input = document.getElementById('actSearch');
  const grid = document.getElementById('actGrid');
  const count = document.getElementById('actCount');
  if (!input || !grid) return;
  const items = [...grid.children];
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let n = 0;
    for (const li of items) {
      const hit = !q || li.textContent.toLowerCase().includes(q);
      li.hidden = !hit;
      if (hit) n++;
    }
    if (count) count.textContent = `${n} ato(s)`;
  });
}

function mountLiveRegion() {
  if (document.getElementById('cko-live')) return;
  const live = document.createElement('p');
  live.id = 'cko-live';
  live.className = 'visually-hidden';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);
}

function init() {
  const dto = readDto();
  document.documentElement.dataset.ckoRenderer = VERSION;
  if (dto) {
    document.documentElement.dataset.ckoProjection = dto.projection_id || '';
    document.documentElement.dataset.ckoEligible = String(!!dto.eligibility?.eligible);
  }
  mountLiveRegion();
  store.purge();
  restoreState();
  wireActions();
  wireSearch();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export { VERSION, PRIVACY, readDto };
