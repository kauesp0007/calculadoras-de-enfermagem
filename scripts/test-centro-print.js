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

    let printedHtml = null;
    let openedCount = 0;

    const dom = new JSDOM(rawHtml, {
      runScripts: 'dangerously',
      resources: 'usable',
      beforeParse(win){
        win.showToast = () => {};
        win.alert = () => true;
        win.confirm = () => true;
        win.scrollTo = () => {};
        win.Chart = function(){ return function(){}; };
        // stub window.open: captura o HTML escrito na "janela de impressão"
        win.open = () => {
          openedCount++;
          return {
            document: {
              _buf: '',
              write(html){ this._buf += String(html); },
              close(){ printedHtml = this._buf; }
            },
            focus: () => {}
          };
        };
        win.fetch = (url, opts) => Promise.resolve({ ok: true, text: async () => '', json: async () => ({}), arrayBuffer: async () => Buffer.from('') });
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
        try{ if(win.location && typeof win.location.replace === 'function') win.location.replace = () => {}; }catch(e){}
        win.sanitizeFieldForExport = (v) => (v === undefined || v === null ? '' : String(v));
        win.toInitials = (s) => (typeof s === 'string' ? s.split(/\s+/).map(p => p[0] || '').join('').toUpperCase() : '');
        win.sanitizePacienteNome = (s) => win.toInitials(s);
        win.neutralizeOrgNames = (s) => s;
        win.maskNamesInText = (s) => s;
        win.sanitizeResponsavelField = function(v){ return win.toInitials(v); };
      },
      url: 'file://' + htmlPath
    });

    await new Promise((resolve)=>{
      dom.window.addEventListener('load', function(){ setTimeout(resolve, 150); });
      setTimeout(resolve, 2500);
    });

    const w = dom.window; const d = w.document;
    const results = [];
    function ok(msg){ console.log('\u2714', msg); results.push({ok:true, msg}); }
    function fail(msg){ console.error('\u2716', msg); results.push({ok:false, msg}); }
    function setVal(id, val){ try{ const el = d.getElementById(id); if(!el) return false; el.value = val; return true; }catch(e){ return false; } }

    // ---- ESTRUTURA STICKY (barra flutuante) ----
    try{
      const zone = d.querySelector('.sticky-zone');
      if(!zone){ fail('sticky-zone wrapper nao encontrado'); }
      else{
        const navInside = zone.querySelector('#stepNav');
        const gaInside = zone.querySelector('.global-actions');
        if(navInside && gaInside) ok('sticky-zone envolve stepNav + global-actions');
        else fail('sticky-zone deve conter stepNav e global-actions');
      }
      const cssSticky = /\.sticky-zone\{position:sticky;top:0;z-index:900/.test(rawHtml);
      const cssNavGlass = /\.step-nav\{background:rgba\(224,240,255,\.62\)/.test(rawHtml);
      if(cssSticky) ok('CSS .sticky-zone{position:sticky;top:0} presente');
      else fail('CSS sticky-zone ausente');
      if(cssNavGlass) ok('CSS barra de etapas com efeito vidro azul presente');
      else fail('CSS vidro da barra ausente');
      // global-actions nao deve ser mais sticky própria
      const gaCss = /\.global-actions\{[^}]*position:sticky/.test(rawHtml);
      if(!gaCss) ok('global-actions deixou de ser sticky própria (evita sobreposição)');
      else fail('global-actions ainda é sticky (conflito)');
    }catch(e){ fail('sticky check exception: '+e.message); }

    // ---- HERO ALINHADO ----
    try{
      const heroMax1200 = /\.page-header\{[^}]*max-width:1200px/.test(rawHtml);
      const heroMargin16 = /\.page-header\{[^}]*margin:18px 16px 0/.test(rawHtml);
      const heroMedia32 = /@media\(min-width:640px\)\{\.page-header\{margin:18px 32px 0\}\}/.test(rawHtml);
      if(!heroMax1200 && heroMargin16 && heroMedia32) ok('hero sem max-width fixo e com margens 16/32px (alinhado ao conteúdo do main)');
      else fail('hero não alinhado (max-width 1200 ainda presente ou margens erradas)');
    }catch(e){ fail('hero check exception: '+e.message); }

    // ---- MODELO ANTIGO EXCLUÍDO ----
    try{
      if(typeof w._cc_printHtml === 'undefined') ok('modelo antigo removido (_cc_printHtml ausente)');
      else fail('_cc_printHtml ainda existe');
      if(!d.getElementById('global-print-styles')) ok('template global-print-styles removido do HTML');
      else fail('template global-print-styles ainda presente');
    }catch(e){ fail('modelo antigo check exception: '+e.message); }

    // ---- NOVO MODELO: imprimirEtapaAtual (etapa 1 ativa) ----
    try{
      setVal('agd-nome','J.S.S.');
      setVal('agd-convenio','SUS');
      if(typeof w.imprimirEtapaAtual !== 'function'){ fail('imprimirEtapaAtual não definida'); }
      else{
        printedHtml = null;
        w.imprimirEtapaAtual();
        if(printedHtml === null){ fail('window.open não foi chamado pela impressão'); }
        else{
          const temHdr = printedHtml.indexOf('<div class="hdr">') !== -1;
          const temData = /DATA:\s*\d{1,2}\/\d{1,2}\/\d{4}/.test(printedHtml);
          const temBodyPad = printedHtml.indexOf('body{font-family:Arial,sans-serif;font-size:10pt;color:#1E293B;padding:24px 32px}') !== -1;
          const temSvgPequeno = printedHtml.indexOf('svg{width:14px;height:14px;max-width:14px;max-height:14px}') !== -1;
          const temFooter = printedHtml.indexOf('class="footer"') !== -1;
          const temPrintAuto = printedHtml.indexOf('window.onload=function(){window.print()}') !== -1;
          const semBotoes = printedHtml.indexOf('class="btn') === -1 && printedHtml.indexOf('btn-primary') === -1;
          const semInputs = printedHtml.indexOf('<input') === -1 && printedHtml.indexOf('<select') === -1;
          const valorPreenchido = printedHtml.indexOf('J.S.S.') !== -1;
          if(temHdr) ok('janela de impressão com cabeçalho .hdr (modelo integracoes)'); else fail('falta .hdr');
          if(temData) ok('cabeçalho com DATA'); else fail('falta DATA');
          if(temBodyPad) ok('CSS body com padding 24px 32px (idêntico ao modelo)'); else fail('CSS body divergente do modelo');
          if(temSvgPequeno) ok('ícones limitados a 14px (corrige ícones gigantes)'); else fail('falta regra svg 14px');
          if(temFooter) ok('rodapé .footer presente'); else fail('falta .footer');
          if(temPrintAuto) ok('window.onload print automático presente'); else fail('falta print automático');
          if(semBotoes) ok('botões removidos da impressão'); else fail('botões ainda no HTML de impressão');
          if(semInputs) ok('inputs substituídos por texto'); else fail('inputs ainda presentes');
          if(valorPreenchido) ok('valores preenchidos aparecem como texto (J.S.S.)'); else fail('valores preenchidos não aparecem');
        }
      }
    }catch(e){ fail('imprimirEtapaAtual exception: '+e.message); }

    // ---- NOVO MODELO: imprimirMapa ----
    try{
      if(typeof w.imprimirMapa !== 'function'){ fail('imprimirMapa não definida'); }
      else{
        printedHtml = null;
        w.imprimirMapa();
        if(printedHtml === null){ fail('imprimirMapa: window.open não chamado'); }
        else{
          const tituloMapa = printedHtml.indexOf('Mapa Cirúrgico — Documento Oficial') !== -1;
          const temHdr = printedHtml.indexOf('<div class="hdr">') !== -1;
          const temPrintAuto = printedHtml.indexOf('window.onload=function(){window.print()}') !== -1;
          if(tituloMapa) ok('imprimirMapa com título "Mapa Cirúrgico — Documento Oficial"'); else fail('título do mapa ausente');
          if(temHdr && temPrintAuto) ok('imprimirMapa usa o novo modelo (hdr + print automático)'); else fail('imprimirMapa sem hdr/print');
        }
      }
    }catch(e){ fail('imprimirMapa exception: '+e.message); }

    // ---- NOVO MODELO: SAEP (concatenado) ----
    try{
      // ativa etapa SAEP
      const panelSaep = d.getElementById('panel-saep');
      if(panelSaep){
        d.querySelectorAll('.step-panel').forEach(p=>p.classList.remove('active'));
        panelSaep.classList.add('active');
        printedHtml = null;
        w.imprimirEtapaAtual();
        if(printedHtml === null){ fail('SAEP: window.open não chamado'); }
        else{
          const tituloSaep = printedHtml.indexOf('SAEP — Sistematização da Assistência de Enfermagem Perioperatória') !== -1;
          const temPrintAuto = printedHtml.indexOf('window.onload=function(){window.print()}') !== -1;
          if(tituloSaep) ok('SAEP concatena painéis com título correto'); else fail('título SAEP ausente');
          if(temPrintAuto) ok('SAEP com print automático'); else fail('SAEP sem print automático');
        }
      } else { fail('painel SAEP não encontrado'); }
    }catch(e){ fail('SAEP print exception: '+e.message); }

    // ---- NOVO MODELO: Painel de Salas (etapa 6) — impressão sem máscara e com CSS claro ----
    try{
      const panelSalas = d.getElementById('panel-3');
      if(panelSalas){
        d.querySelectorAll('.step-panel').forEach(p=>p.classList.remove('active'));
        panelSalas.classList.add('active');
        if(typeof w.adicionarExemplos === 'function') w.adicionarExemplos();
        if(typeof w.renderPainel === 'function') w.renderPainel();
        printedHtml = null;
        w.imprimirEtapaAtual();
        if(printedHtml === null){ fail('Painel de Salas: window.open não chamado'); }
        else{
          const textoIntegral = printedHtml.indexOf('Painel Cirúrgico') !== -1;
          const semMascara = printedHtml.indexOf('P.C.') === -1;
          const painelClaro = printedHtml.indexOf('.painel-tv{background:#fff!important') !== -1;
          const cardClaro = printedHtml.indexOf('.painel-tv .sala-card{background:#fff!important') !== -1;
          const gridPrint = printedHtml.indexOf('.painel-tv .mapa-grid{display:grid') !== -1;
          if(textoIntegral) ok('Painel de Salas: texto integral "Painel Cirúrgico" preservado (sem máscara antiga)'); else fail('texto do painel foi mascarado/corrompido');
          if(semMascara) ok('sem conversão para iniciais (sanitização antiga ausente)'); else fail('sanitização antiga de iniciais ainda presente');
          if(painelClaro) ok('painel TV impresso com fundo branco (CSS claro)'); else fail('painel TV sem regra de fundo claro');
          if(cardClaro) ok('cards de sala impressos com fundo branco e borda'); else fail('cards de sala sem regra de impressão clara');
          if(gridPrint) ok('cards em grade 2 colunas na impressão'); else fail('grid de impressão do painel ausente');
        }
      } else { fail('painel de salas não encontrado'); }
    }catch(e){ fail('Painel de Salas print exception: '+e.message); }

    // ---- SEQUÊNCIA DAS ETAPAS (Checklist OMS na posição 6) ----
    try{
      const botoes = [...d.querySelectorAll('#stepNavInner .step-btn')];
      const labels = botoes.map(b => b.textContent.trim().replace(/^\d+/, '').trim());
      const esperado = ['Agendamento','Aviso de Cirurgia','Preparo de Materiais','Bate-Mapa','Mapa Cirúrgico','Checklist OMS','Painel de Salas','Cirurgia Segura','Status da Cirurgia','Pós-Cirúrgico','Relatórios e Alta','Rastreabilidade CME','Indicadores','SAEP'];
      const ordemOk = JSON.stringify(labels) === JSON.stringify(esperado);
      if(ordemOk) ok('barra de etapas na nova ordem (Checklist OMS em 6º, Painel de Salas em 7º)');
      else fail('ordem dos botões errada: ' + labels.join(', '));
      const stepsOk = botoes.every((b, i) => parseInt(b.dataset.step, 10) === i);
      if(stepsOk) ok('data-step reindexado 0..13 corretamente');
      else fail('data-step incorreto');
      // goStep(5) deve ativar o checklist OMS
      if(typeof w.goStep === 'function'){
        w.goStep(5);
        const omsAtivo = d.getElementById('panel-checklist-oms').classList.contains('active');
        w.goStep(6);
        const painelAtivo = d.getElementById('panel-3').classList.contains('active');
        if(omsAtivo) ok('goStep(5) ativa o Checklist OMS'); else fail('goStep(5) não ativa o Checklist OMS');
        if(painelAtivo) ok('goStep(6) ativa o Painel de Salas'); else fail('goStep(6) não ativa o Painel de Salas');
        w.goStep(0);
      }
      // botão do aviso deve avançar para preparo
      const btnAvancar = [...d.querySelectorAll('#panel-0 button')].find(b => b.textContent.includes('Preparo de Materiais'));
      if(btnAvancar) ok('botão do Aviso avançando para "Preparo de Materiais"'); else fail('botão de avanço do Aviso não encontrado/apontando errado');
      const btnAvancarBate = [...d.querySelectorAll('#panel-0 button')].some(b => b.textContent.includes('Bate-Mapa'));
      if(!btnAvancarBate) ok('Aviso não avança mais direto para o Bate-Mapa'); else fail('Aviso ainda avança direto para o Bate-Mapa');
    }catch(e){ fail('sequência exception: '+e.message); }

    // ---- ACESSIBILIDADE & CORE WEB VITALS ----
    try{
      // meta description + theme-color
      const desc = d.querySelector('meta[name="description"]');
      if(desc && desc.content.length > 60) ok('meta description presente'); else fail('meta description ausente/curta');
      // chart.js com defer (não bloqueia render) — verificado no arquivo original
      const rawOriginal = fs.readFileSync(htmlPath, 'utf8');
      if(/chart\.umd\.min\.js" defer/.test(rawOriginal)) ok('chart.js com defer (não bloqueia o render)'); else fail('chart.js ainda é render-blocking');
      // toast com role status e aria-live
      const toast = d.getElementById('toast');
      if(toast && toast.getAttribute('role') === 'status' && toast.getAttribute('aria-live') === 'polite') ok('toast com role=status + aria-live'); else fail('toast sem role/aria-live');
      // modal dialog acessível
      const modal = d.getElementById('modal-sala');
      if(modal && modal.getAttribute('role') === 'dialog' && modal.getAttribute('aria-modal') === 'true' && modal.getAttribute('aria-labelledby') === 'modal-title') ok('modal com role=dialog/aria-modal/aria-labelledby'); else fail('modal sem atributos de acessibilidade');
      // nav de etapas com aria-label
      const navEtapas = d.getElementById('stepNav');
      if(navEtapas && navEtapas.getAttribute('aria-label')) ok('barra de etapas com aria-label'); else fail('barra de etapas sem aria-label');
      // foco visível definido no CSS
      if(/:focus-visible\{outline:3px solid #2563EB/.test(rawHtml)) ok('focus visível (:focus-visible) configurado'); else fail('sem :focus-visible');
      // prefers-reduced-motion
      if(/prefers-reduced-motion:reduce/.test(rawHtml)) ok('suporte a prefers-reduced-motion'); else fail('sem prefers-reduced-motion');
      // inputs 16px no mobile (evita zoom automático iOS)
      if(/input,select,textarea\{font-size:16px!important\}/.test(rawHtml)) ok('inputs 16px no mobile'); else fail('inputs mobile menores que 16px');
      // botões com alvo de toque mínimo
      if(/\.btn\{min-height:44px\}/.test(rawHtml)) ok('alvo de toque mínimo de 44px'); else fail('sem alvo de toque mínimo');
      // labels associadas aos controles (JS de acessibilidade)
      const semForAntes = rawHtml.match(/<label>/g) ? rawHtml.match(/<label>/g).length : 0;
      const comFor = [...d.querySelectorAll('.form-group label')].filter(l => l.getAttribute('for')).length;
      const totalLabels = d.querySelectorAll('.form-group label').length;
      if(totalLabels > 0 && comFor >= totalLabels) ok('todos os labels de formulário associados (for=' + comFor + ')'); else fail('labels sem associação: ' + (totalLabels - comFor));
      // svgs decorativos marcados aria-hidden
      const svgsSem = [...d.querySelectorAll('svg:not([aria-hidden])')].length;
      if(svgsSem === 0) ok('svgs decorativos com aria-hidden'); else fail('svgs sem aria-hidden: ' + svgsSem);
    }catch(e){ fail('acessibilidade check exception: '+e.message); }

    const fails = results.filter(r=>!r.ok).length;
    console.log('\nTEST SUMMARY:');
    results.forEach(r=>console.log((r.ok?'\u2714':'\u2716'), r.msg));
    console.log('\nTotal checks:', results.length, 'Failures:', fails);
    process.exit(fails>0?1:0);
  }catch(e){
    console.error('FATAL:', e);
    process.exit(1);
  }
})();
