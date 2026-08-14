// ==================== TESTE DA VERSÃO OFUSCADA ====================
// Carrega o centro-cirurgico.min.html (ou o HTML com o .min.js injetado)
// e valida que o JS ofuscado + trava de domínio continuam funcionando.
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

(async function(){
  try{
    const root = path.resolve(__dirname, '..');
    const minJs = path.join(root, 'centro-cirurgico-script.min.js');
    const minHtml = path.join(root, 'centro-cirurgico.min.html');

    if(!fs.existsSync(minJs)){ console.error('✖ centro-cirurgico-script.min.js não existe. Rode primeiro: node scripts/build-obfuscate.js'); process.exit(1); }
    if(!fs.existsSync(minHtml)){ console.error('✖ centro-cirurgico.min.html não existe. Rode primeiro: node scripts/build-obfuscate.js'); process.exit(1); }

    let rawHtml = fs.readFileSync(minHtml, 'utf8');
    rawHtml = rawHtml.replace(/<script[^>]*src="global-scripts\.js"[^>]*><\/script>/gi, '');
    rawHtml = rawHtml.replace(/<script[^>]*src="lang-selector\.js"[^>]*><\/script>/gi, '');
    rawHtml = rawHtml.replace(/<script[^>]*src="https?:\/\/cdn\.jsdelivr\.net[^"]*chart[^\"]*"[^>]*><\/script>/gi, '');

    let printed = null;
    const dom = new JSDOM(rawHtml, {
      runScripts: 'dangerously',
      resources: 'usable',
      beforeParse(win){
        win.showToast = () => {};
        win.alert = () => true;
        win.confirm = () => true;
        win.scrollTo = () => {};
        win.Chart = function(){ return function(){}; };
        win.open = () => ({
          document: { _b:'', write(h){ this._b += String(h); }, close(){ printed = this._b; } },
          focus: () => {}
        });
        win.fetch = () => Promise.resolve({ ok: true, text: async () => '', json: async () => ({}), arrayBuffer: async () => Buffer.from('') });
        (function(){
          const _store = {};
          const poly = {
            getItem(k){ return Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null; },
            setItem(k, v){ _store[k] = String(v); },
            removeItem(k){ delete _store[k]; },
            clear(){ Object.keys(_store).forEach(k => delete _store[k]); }
          };
          try{ Object.defineProperty(win, 'localStorage', { value: poly, writable:false, configurable:false }); }catch(e){ win.localStorage = poly; }
        })();
        try{ if(win.location && typeof win.location.replace === 'function') win.location.replace = () => {}; }catch(e){}
        win.sanitizeFieldForExport = (v) => (v === undefined || v === null ? '' : String(v));
        win.toInitials = (s) => (typeof s === 'string' ? s.split(/\s+/).map(p => p[0] || '').join('').toUpperCase() : '');
        win.sanitizePacienteNome = (s) => win.toInitials(s);
        win.neutralizeOrgNames = (s) => s;
        win.maskNamesInText = (s) => s;
        win.sanitizeResponsavelField = function(v){ return win.toInitials(v); };
      },
      url: 'file://' + minHtml
    });

    await new Promise(resolve => {
      dom.window.addEventListener('load', () => setTimeout(resolve, 200));
      setTimeout(resolve, 4000);
    });

    const w = dom.window, d = w.document;
    const results = [];
    const ok = (m) => { console.log('\u2714', m); results.push({ok:true, msg:m}); };
    const fail = (m) => { console.error('\u2716', m); results.push({ok:false, msg:m}); };
    const setVal = (id, v) => { const el = d.getElementById(id); if(!el) return false; el.value = v; return true; };

    // Trava de domínio: file:// deve estar liberado (funções registradas)
    try{
      if(typeof w.goStep === 'function') ok('trava liberada em file:// (goStep definido)');
      else fail('trava bloqueou indevidamente em file://');
    }catch(e){ fail('trava check exception: '+e.message); }

    // Funções globais preservadas pelo ofuscador (chamadas pelo HTML via onclick)
    const globals = ['goStep','salvarAgendamento','salvarAviso','salvarPreparo','salvarBateMapa','renderPainel','simularDiaCirurgico','imprimirMapa','avancarPreparo','avancarBateMapa','salvarCirurgiaSegura','saepSalvar'];
    const ausentes = globals.filter(fn => typeof w[fn] !== 'function');
    if(!ausentes.length) ok('todas as funções globais preservadas após ofuscação (' + globals.length + ')');
    else fail('funções ausentes na versão ofuscada: ' + ausentes.join(', '));

    // Navegação na ordem correta
    try{
      w.goStep(5);
      const oms = d.getElementById('panel-checklist-oms').classList.contains('active');
      w.goStep(6);
      const painel = d.getElementById('panel-3').classList.contains('active');
      if(oms) ok('goStep(5) ativa Checklist OMS (ofuscado)'); else fail('goStep(5) falhou');
      if(painel) ok('goStep(6) ativa Painel de Salas (ofuscado)'); else fail('goStep(6) falhou');
      w.goStep(0);
    }catch(e){ fail('goStep ofuscado exception: '+e.message); }

    // Salvamento de agendamento
    try{
      setVal('agd-origem','Ambulatorial'); setVal('agd-convenio','SUS'); setVal('agd-nome','J.S.S.');
      setVal('agd-procedimento','APENDICECTOMIA'); setVal('agd-medico','Dr. Teste');
      setVal('agd-data','2026-08-14'); setVal('agd-hora','08:00');
      w.salvarAgendamento();
      const ags = JSON.parse(w.localStorage.getItem('cc_agendamentos') || '[]');
      if(ags.length > 0) ok('salvarAgendamento ofuscado escreve no localStorage');
      else fail('salvarAgendamento ofuscado não gravou');
    }catch(e){ fail('salvarAgendamento ofuscado exception: '+e.message); }

    // Impressão (novo modelo) na versão ofuscada
    try{
      printed = null;
      if(typeof w.imprimirEtapaAtual === 'function'){
        w.imprimirEtapaAtual();
        if(printed && printed.indexOf('<div class="hdr">') !== -1 && printed.indexOf('window.onload=function(){window.print()}') !== -1){
          ok('impressão funciona na versão ofuscada (.hdr + print automático)');
        } else fail('impressão ofuscada sem .hdr/print automático');
      } else fail('imprimirEtapaAtual não definida');
    }catch(e){ fail('impressão ofuscada exception: '+e.message); }

    // ---- Trava de domínio: domínio NÃO autorizado deve bloquear ----
    try{
      const { pathToFileURL } = require('url');
      let raw2 = fs.readFileSync(minHtml, 'utf8');
      raw2 = raw2.replace(/<script[^>]*src="global-scripts\.js"[^>]*><\/script>/gi, '');
      raw2 = raw2.replace(/<script[^>]*src="lang-selector\.js"[^>]*><\/script>/gi, '');
      raw2 = raw2.replace(/<script[^>]*src="https?:\/\/cdn\.jsdelivr\.net[^"]*chart[^\"]*"[^>]*><\/script>/gi, '');
      // remove folhas de estilo externas (irrelevantes no teste do domínio fake)
      raw2 = raw2.replace(/<link[^>]+rel="stylesheet"[^>]*>/gi, '');
      // carrega o JS ofuscado do disco, mantendo o domínio falso na URL do documento
      raw2 = raw2.replace(/<script src="centro-cirurgico-script\.min\.js" defer><\/script>/g, '<script src="' + pathToFileURL(minJs).href + '" defer></script>');
      const domFake = new JSDOM(raw2, {
        runScripts: 'dangerously',
        resources: 'usable',
        beforeParse(win){
          win.showToast = () => {}; win.alert = () => true; win.confirm = () => true;
          win.scrollTo = () => {};
          win.fetch = () => Promise.resolve({ ok: true, text: async () => '', json: async () => ({}), arrayBuffer: async () => Buffer.from('') });
          (function(){
            const _store = {};
            const poly = { getItem(k){ return _store[k] ?? null; }, setItem(k,v){ _store[k]=String(v); }, removeItem(k){ delete _store[k]; }, clear(){} };
            try{ Object.defineProperty(win, 'localStorage', { value: poly, writable:false, configurable:false }); }catch(e){ win.localStorage = poly; }
          })();
          try{ if(win.location && typeof win.location.replace === 'function') win.location.replace = () => {}; }catch(e){}
          win.sanitizeFieldForExport = (v) => String(v == null ? '' : v);
          win.sanitizePacienteNome = (s) => s;
          win.sanitizeResponsavelField = (v) => v;
        },
        url: 'http://site-copiado-exemplo.com/centro-cirurgico.min.html'
      });
      await new Promise(resolve => {
        domFake.window.addEventListener('load', () => setTimeout(resolve, 200));
        setTimeout(resolve, 4000);
      });
      const wf = domFake.window, df = wf.document;
      // dispara DOMContentLoaded do overlay (jsdom já disparou no load, mas garante)
      try{ df.dispatchEvent(new wf.Event('DOMContentLoaded')); }catch(e){}
      await new Promise(r => setTimeout(r, 100));
      const bloqueado = typeof wf.goStep !== 'function' && typeof wf.salvarAgendamento !== 'function';
      const overlay = df.body && df.body.textContent.includes('Cópia não autorizada');
      if(bloqueado) ok('trava bloqueia as funções em domínio não autorizado');
      else fail('trava não bloqueou em domínio não autorizado');
      if(overlay) ok('overlay "Cópia não autorizada" exibido no domínio pirata');
      else fail('overlay de aviso não exibido');
      domFake.window.close();
    }catch(e){ fail('trava bloqueio exception: '+e.message); }

    const fails = results.filter(r => !r.ok).length;
    console.log('\nTEST SUMMARY (versão ofuscada):');
    results.forEach(r => console.log((r.ok ? '\u2714' : '\u2716'), r.msg));
    console.log('\nTotal checks:', results.length, 'Failures:', fails);
    process.exit(fails > 0 ? 1 : 0);
  }catch(e){
    console.error('FATAL:', e);
    process.exit(1);
  }
})();
