/**
 * cko-production-shell-loader — v2.0.0 (E-002)
 * Carrega os modulos reais do shell de producao por fetch, com health check,
 * timeout, fallback controlado e sinalizacao de estado para auditoria.
 *
 * Regra: falha de modulo do shell NUNCA pode quebrar o conteudo da pagina nem
 * esconder a navegacao essencial. Quando um modulo nao responde, o loader
 * publica um fallback minimo acessivel e marca data-module-state=fallback.
 */
(function () {
  'use strict';
  var VERSION = '2.0.0';
  var TIMEOUT_MS = 4000;
  var MODULES = [
    { id: 'accessibility-placeholder', url: '/accessibility.html', label: 'Acessibilidade' },
    { id: 'global-header-container', url: '/header.html', label: 'Cabeçalho' },
    { id: 'language-selector-placeholder', url: '/language-selector.html', label: 'Idioma' },
    { id: 'footer-placeholder', url: '/footer.html', label: 'Rodapé' }
  ];
  var SCRIPTS = ['/global-scripts.js', '/lang-selector.js'];
  var health = { version: VERSION, modules: {}, scripts: {}, started_at: new Date().toISOString() };

  function fallback(mod) {
    if (mod.id === 'global-header-container') {
      return '<nav class="shell-fallback" aria-label="Navegação essencial">' +
             '<a href="/">Início</a> <a href="/legislacao/coren/">Legislação COREN</a></nav>';
    }
    if (mod.id === 'footer-placeholder') {
      return '<p class="shell-fallback">Módulo de rodapé indisponível no momento. ' +
             '<a href="/">Voltar ao início</a></p>';
    }
    return '';
  }

  function fetchInto(mod) {
    var el = document.getElementById(mod.id);
    if (!el) { health.modules[mod.id] = 'missing-mount'; return Promise.resolve(); }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;

    return fetch(mod.url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
        if (!html || !html.trim()) throw new Error('empty');
        el.innerHTML = html;
        el.dataset.moduleState = 'loaded';
        health.modules[mod.id] = 'loaded';
      })
      .catch(function (err) {
        el.innerHTML = fallback(mod);
        el.dataset.moduleState = el.innerHTML ? 'fallback' : 'unavailable';
        health.modules[mod.id] = el.dataset.moduleState + ':' + (err && err.message ? err.message : 'error');
      })
      .then(function () { if (timer) clearTimeout(timer); });
  }

  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src; s.defer = true;
      s.onload = function () { health.scripts[src] = 'loaded'; resolve(); };
      s.onerror = function () { health.scripts[src] = 'failed'; resolve(); };
      document.head.appendChild(s);
    });
  }

  function start() {
    Promise.all(MODULES.map(fetchInto))
      .then(function () { return Promise.all(SCRIPTS.map(loadScript)); })
      .then(function () {
        health.finished_at = new Date().toISOString();
        var degraded = Object.keys(health.modules).some(function (k) {
          return health.modules[k].indexOf('loaded') !== 0;
        });
        health.status = degraded ? 'DEGRADED' : 'OK';
        document.documentElement.dataset.shellHealth = health.status;
        window.CKO_SHELL_HEALTH = health;
        document.dispatchEvent(new CustomEvent('cko:shell-health', { detail: health }));
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
