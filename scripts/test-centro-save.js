const { JSDOM } = require('jsdom');
const path = require('path');

(async function(){
  try{
    const htmlPath = path.resolve(__dirname, '..', 'centro-cirurgico.html');
    console.log('Loading HTML:', htmlPath);
    const fs = require('fs');
    var rawHtml = fs.readFileSync(htmlPath,'utf8');
    // remove problematic global scripts that perform navigation or external fetches
    rawHtml = rawHtml.replace(/<script[^>]*src="global-scripts\.js"[^>]*><\/script>/gi, '');
    rawHtml = rawHtml.replace(/<script[^>]*src="lang-selector\.js"[^>]*><\/script>/gi, '');
    rawHtml = rawHtml.replace(/<script[^>]*src="https?:\/\/cdn\.jsdelivr\.net\/[^"]*chart[^\"]*\"[^>]*><\/script>/gi, '');
    // create JSDOM from sanitized HTML to avoid navigation/location.replace errors
    const dom = new JSDOM(rawHtml, {
      runScripts: 'dangerously',
      resources: 'usable',
      beforeParse(win){
        // Stubs to avoid dialogs and missing libs
        win.showToast = () => {};
        win.alert = () => true;
        win.confirm = () => true;
        win.Chart = function(){ return function(){}; };
        // stub window.open so print helpers don't throw
        win.open = () => ({ document: { write: () => {}, close: () => {} }, focus: () => {}, close: () => {} });
        // stub fetch to avoid network calls during jsdom run
        win.fetch = (url, opts) => Promise.resolve({ ok: true, text: async () => '', json: async () => ({}), arrayBuffer: async () => Buffer.from('') });
        // simple localStorage polyfill (define as non-configurable to prevent overwrite)
        (function(){
          const _store = {};
          const poly = {
            getItem(key){ return Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null; },
            setItem(key, val){ _store[key] = String(val); },
            removeItem(key){ delete _store[key]; },
            clear(){ Object.keys(_store).forEach(k=>delete _store[k]); }
          };
          try{ Object.defineProperty(win, 'localStorage', { value: poly, writable: false, configurable: false, enumerable: true }); }catch(e){ win.localStorage = poly; }
        })();
        // prevent navigation errors (Location.replace calls)
        try{ if(win.location && typeof win.location.replace === 'function') win.location.replace = () => {}; }catch(e){}
        // minimal sanitizers used by the app (noop/safe implementations)
        win.sanitizeFieldForExport = (v) => (v === undefined || v === null ? '' : String(v));
        win.toInitials = (s) => (typeof s === 'string' ? s.split(/\s+/).map(p => p[0] || '').join('').toUpperCase() : '');
        win.sanitizePacienteNome = (s) => win.toInitials(s);
        win.neutralizeOrgNames = (s) => s;
        win.maskNamesInText = (s) => s;
        win.sanitizeResponsavelField = function(v){ return win.toInitials(v); };
      },
      url: 'file://' + htmlPath
    });

    // Ensure localStorage polyfill exists on the window (some scripts may remove/override it)
    try{
      const _store = {};
      const poly = {
        getItem(key){ return Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null; },
        setItem(key, val){ _store[key] = String(val); },
        removeItem(key){ delete _store[key]; },
        clear(){ Object.keys(_store).forEach(k=>delete _store[k]); }
      };
      try{ Object.defineProperty(dom.window, 'localStorage', { value: poly, writable: false, configurable: false, enumerable: true }); }catch(e){ dom.window.localStorage = poly; }
    }catch(e){}

    await new Promise((resolve)=>{
      dom.window.addEventListener('load', function(){ setTimeout(resolve, 120); });
      // safety timeout
      setTimeout(resolve, 2000);
    });

    const w = dom.window; const d = w.document;
    const results = [];

    // Debug: verificar se localStorage e sanitizadores estão disponíveis
    try{ console.log('DEBUG: window.localStorage present?', !!w.localStorage, 'getItem type:', typeof (w.localStorage && w.localStorage.getItem)); }catch(e){ console.log('DEBUG: error checking localStorage', e.message); }
    try{ console.log('DEBUG: sanitizeFieldForExport type:', typeof w.sanitizeFieldForExport, 'sanitizePacienteNome type:', typeof w.sanitizePacienteNome); }catch(e){}

    function ok(msg){ console.log('\u2714', msg); results.push({ok:true, msg}); }
    function fail(msg){ console.error('\u2716', msg); results.push({ok:false, msg}); }

    // Helper to safe-get element
    function setVal(id, val){ try{ const el = d.getElementById(id); if(!el) { return false; } el.value = val; return true; }catch(e){ return false; } }

    // Test 1: salvarAgendamento
    try{
      setVal('agd-origem','Ambulatorial'); setVal('agd-convenio','SUS'); setVal('agd-nome','J.S.'); setVal('agd-procedimento','APENDICECTOMIA'); setVal('agd-medico','Dr. Teste'); setVal('agd-data','2026-08-14'); setVal('agd-hora','08:00'); setVal('agd-hospital','Hospital Teste'); setVal('agd-leito','UTI 1');
      if(typeof w.salvarAgendamento === 'function') {
        w.salvarAgendamento();
        const ags = JSON.parse(w.localStorage.getItem('cc_agendamentos')||'[]');
        if(ags.length>0) ok('salvarAgendamento -> cc_agendamentos written ('+ags.length+')'); else fail('salvarAgendamento did not write cc_agendamentos');
      } else fail('salvarAgendamento() not defined');
    }catch(e){ fail('salvarAgendamento exception: '+e.message); }

    // Test 2: salvarAviso
    try{
      setVal('av-nome','J.S.'); setVal('av-procedimento','COLECISTECTOMIA'); setVal('av-cirurgiao','Dr. Cirurgiao'); setVal('av-dn','1980-01-01'); setVal('av-hora','09:00');
      if(typeof w.salvarAviso === 'function'){
        w.salvarAviso();
        const avis = JSON.parse(w.localStorage.getItem('cc_avisos_v1')||'[]');
        if(avis.length>0) ok('salvarAviso -> cc_avisos_v1 written ('+avis.length+')'); else fail('salvarAviso did not write cc_avisos_v1');
      } else fail('salvarAviso() not defined');
    }catch(e){ fail('salvarAviso exception: '+e.message); }

    // Test 3: salvarPreparo
    try{
      if(typeof w.carregarSelectsPreparo === 'function') w.carregarSelectsPreparo();
      // set first option if exists
      const selPrep = d.getElementById('prep-cirurgia'); if(selPrep && selPrep.options && selPrep.options.length>1){ selPrep.value = selPrep.options[1].value; }
      setVal('prep-kit','KIT-TEST'); setVal('prep-opme','nao');
      if(typeof w.salvarPreparo === 'function'){
        w.salvarPreparo();
        const preps = JSON.parse(w.localStorage.getItem('cc_preparos')||'[]');
        if(preps.length>0) ok('salvarPreparo -> cc_preparos written ('+preps.length+')'); else fail('salvarPreparo did not write cc_preparos');
      } else fail('salvarPreparo() not defined');
    }catch(e){ fail('salvarPreparo exception: '+e.message); }

    // Test 4: salvarCirurgiaSegura (OMS)
    try{
      if(typeof w.carregarSelectsOms === 'function') w.carregarSelectsOms();
      const selOms = d.getElementById('oms-cirurgia'); if(selOms && selOms.options && selOms.options.length>1){ selOms.value = selOms.options[1].value; }
      // mark all checklist items as done
      d.querySelectorAll('#panel-cirurgia-segura .checklist-item').forEach(function(el){ el.classList.add('done'); });
      if(typeof w.salvarCirurgiaSegura === 'function'){
        w.salvarCirurgiaSegura();
        const oms = JSON.parse(w.localStorage.getItem('cc_oms')||'[]');
        if(oms.length>0) ok('salvarCirurgiaSegura -> cc_oms written ('+oms.length+')'); else fail('salvarCirurgiaSegura did not write cc_oms');
      } else fail('salvarCirurgiaSegura() not defined');
    }catch(e){ fail('salvarCirurgiaSegura exception: '+e.message); }

    // Test 5: salvarPosCirurgico
    try{
      if(typeof w.carregarSelectsPos === 'function') w.carregarSelectsPos();
      const selPos = d.getElementById('pos-cirurgia'); if(selPos && selPos.options && selPos.options.length>1){ selPos.value = selPos.options[1].value; }
      setVal('pos-destino','Enfermaria'); setVal('pos-tempo','30min'); setVal('pos-tempo-anest','40min'); setVal('pos-intercorrencias','Nenhuma'); setVal('pos-obs','OK');
      if(typeof w.salvarPosCirurgico === 'function'){
        w.salvarPosCirurgico();
        const pos = JSON.parse(w.localStorage.getItem('cc_pos')||'[]');
        if(pos.length>0) ok('salvarPosCirurgico -> cc_pos written ('+pos.length+')'); else fail('salvarPosCirurgico did not write cc_pos');
      } else fail('salvarPosCirurgico() not defined');
    }catch(e){ fail('salvarPosCirurgico exception: '+e.message); }

    // Test 6: CME salvar movimento e lote
    try{
      setVal('cme-etapa','expurgo'); setVal('cme-caixa','CX-TEST-01'); setVal('cme-esp','Cirurgia Geral'); setVal('cme-resp','E.S.'); setVal('cme-obs','OK'); setVal('cme-dh','2026-08-14T10:00');
      if(typeof w.cmeSalvarMov === 'function'){ w.cmeSalvarMov(); const hist = JSON.parse(w.localStorage.getItem('cc_cme_hist')||'[]'); if(hist.length>0) ok('cmeSalvarMov -> cc_cme_hist written ('+hist.length+')'); else fail('cmeSalvarMov did not write cc_cme_hist'); } else fail('cmeSalvarMov() not defined');

      setVal('cme-lote-num','LOTE-TEST-01'); setVal('cme-lote-met','Autoclave Vapor 121\u00B0C'); setVal('cme-lote-eq','Auto-1'); setVal('cme-lote-dh','2026-08-14T09:00'); setVal('cme-lote-val','2026-12-31'); setVal('cme-lote-resp','E.S.');
      const indq = d.getElementById('cme-ind-q'); if(indq) indq.checked = true; const indb = d.getElementById('cme-ind-b'); if(indb) indb.checked = false;
      if(typeof w.cmeSalvarLote === 'function'){ w.cmeSalvarLote(); const lotes = JSON.parse(w.localStorage.getItem('cc_cme_lotes')||'[]'); if(lotes.length>0) ok('cmeSalvarLote -> cc_cme_lotes written ('+lotes.length+')'); else fail('cmeSalvarLote did not write cc_cme_lotes'); } else fail('cmeSalvarLote() not defined');
    }catch(e){ fail('CME tests exception: '+e.message); }

    // Test 7: SAEP salvar estado
    try{
      setVal('saep-pac-iniciais','J.S.'); setVal('saep-pac-convenio','SUS'); setVal('saep-pac-proc','PROC SAEP');
      // toggle a few checkboxes
      const firstCheck = d.querySelector('#panel-saep .saep-check-item input'); if(firstCheck) firstCheck.checked = true;
      if(typeof w.saepSalvar === 'function'){ w.saepSalvar(); const saep = JSON.parse(w.localStorage.getItem('cc_saep')||'{}'); if(Object.keys(saep).length>0) ok('saepSalvar -> cc_saep written (keys:'+Object.keys(saep).length+')'); else fail('saepSalvar did not write cc_saep'); } else fail('saepSalvar() not defined');
    }catch(e){ fail('saepSalvar exception: '+e.message); }

    // Test 8: Aldrete
    try{
      setVal('saep-ev-dh', '2026-08-14T11:00'); setVal('saep-ev-fase','Pós-op'); setVal('saep-ald-atividade','2'); setVal('saep-ald-resp','2'); setVal('saep-ald-circ','2'); setVal('saep-ald-consci','2'); setVal('saep-ald-oxig','2'); setVal('saep-ev-obs','OK');
      if(typeof w.saepAldreteSalvar === 'function'){ w.saepAldreteSalvar(); const ald = JSON.parse(w.localStorage.getItem('cc_saep_aldrete')||'[]'); if(ald.length>0) ok('saepAldreteSalvar -> cc_saep_aldrete written ('+ald.length+')'); else fail('saepAldreteSalvar did not write cc_saep_aldrete'); } else fail('saepAldreteSalvar() not defined');
    }catch(e){ fail('saepAldreteSalvar exception: '+e.message); }

    // Summary
    console.log('\nTEST SUMMARY:'); results.forEach(function(r){ console.log((r.ok? '\u2714':'\u2716') + ' ' + r.msg); });
    const failed = results.filter(r=>!r.ok).length;
    console.log('\nTotal checks:', results.length, 'Failures:', failed);
    process.exit(failed>0?2:0);

  }catch(err){ console.error('Fatal error in test runner:', err); process.exit(3); }
})();
