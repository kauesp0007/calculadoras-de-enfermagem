/*
  scripts/localstorage-cme-tool.js
  Pequeno utilitário para semear e limpar dados de teste no localStorage (origem: http://127.0.0.1:8080)

  Uso (abra o console da página e cole/execute):
    seedCmeTests();   // insere dados de teste (AUTOTEST...)
    cleanupCmeTests(); // remove apenas entradas que contenham 'AUTOTEST'

  O script favorece chaves compatíveis entre páginas: cc_cme_hist <-> cme_historico e cc_cme_lotes <-> cme_lotes
*/

function seedCmeTests(){
  try{
    var hist = JSON.parse(localStorage.getItem('cme_historico')||localStorage.getItem('cc_cme_hist')||'[]');
    hist.unshift({id:Date.now(),etapa:'expurgo',caixa:'AUTOTEST-CX-SEED',esp:'Teste',resp:'SEED',obs:'seed',dh:new Date().toISOString()});
    localStorage.setItem('cme_historico', JSON.stringify(hist));
    localStorage.setItem('cc_cme_hist', JSON.stringify(hist));
  }catch(e){console.error('seed hist error', e);}  
  try{
    var lotes = JSON.parse(localStorage.getItem('cme_lotes')||localStorage.getItem('cc_cme_lotes')||'[]');
    lotes.unshift({numero:'AUTOTEST-LOTE-SEED',metodo:'Autoclave 121',eq:'SEED-01',dh:new Date().toISOString(),val:null,resp:'SEED',indQ:true});
    localStorage.setItem('cme_lotes', JSON.stringify(lotes));
    localStorage.setItem('cc_cme_lotes', JSON.stringify(lotes));
  }catch(e){console.error('seed lotes error', e);}  
  console.info('Seed de teste inserido: AUTOTEST-CX-SEED / AUTOTEST-LOTE-SEED');
}

function cleanupCmeTests(){
  var keys = ['cme_historico','cc_cme_hist','cme_lotes','cc_cme_lotes','cks_atual','cks_hist'];
  keys.forEach(function(k){
    try{
      var raw = localStorage.getItem(k);
      if(!raw) return;
      try{
        var arr = JSON.parse(raw);
        if(Array.isArray(arr)){
          var filtered = arr.filter(function(item){ try{return !JSON.stringify(item).toUpperCase().includes('AUTOTEST'); }catch(e){return true;} });
          if(filtered.length!==arr.length){ localStorage.setItem(k, JSON.stringify(filtered)); console.info('Removed', arr.length-filtered.length, 'entries from', k); }
        }
      }catch(e){ if(String(raw).toUpperCase().includes('AUTOTEST')){ localStorage.removeItem(k); console.info('Removed whole key', k); } }
    }catch(e){ console.error('cleanup error for '+k, e); }
  });
  console.info('Cleanup de testes executado.');
}

// Export minimal helpers para uso em Node/Eval via ferramentas de automação
if(typeof module !== 'undefined' && module.exports){ module.exports = { seedCmeTests, cleanupCmeTests }; }
