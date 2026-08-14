(function(){
"use strict";
var SK_AVISOS = "cc_avisos_v1";
var SK_STATUS = "cc_status_v1";
var currentStep = 0;

// ==================== NAVIGATION ====================
window.goStep = function(n){
  document.querySelectorAll('.step-panel').forEach(function(p,i){ p.classList.toggle('active', i===n); });
  document.querySelectorAll('.step-btn').forEach(function(b){ b.classList.toggle('active', parseInt(b.dataset.step)===n); });
  currentStep = n;
  if(n===4) renderMapa();
  if(n===5) renderPainel();
  if(n===7) renderStatusSalas();
  if(n===9) renderRelatorios();
  if(n===0) renderAgendamentos();
  if(n===3) carregarSelectsPreparo();
  if(n===6) carregarSelectsOms();
  if(n===8) carregarSelectsPos();
  if(n===10) initOmsChecklist();
  if(n===11) cmeInit();
  if(n===12) initIndicadores();
  if(n===13) saepInit();
  window.scrollTo({top:0,behavior:'smooth'});
};

// ==================== HELPERS: NOME PACIENTE (iniciais) ====================
function toInitials(raw){
  if(!raw) return '';
  try{
    var s = String(raw).trim();
    // ignore suffix after em-dash
    var left = s.split('—')[0].trim();
    if(!left) return '';
    // If already looks like initials (e.g. A.S.N. or A.S.N), normalize dots
    var compact = left.replace(/\s+/g,'');
    if(/^([A-Za-zÀ-ÖØ-öø-ÿ]\.?)+$/.test(compact)){
      // insert dots where missing and uppercase
      var letters = compact.replace(/\./g,'').split('');
      return letters.map(function(c){ return c.toUpperCase(); }).join('.') + '.';
    };

    // ==================== SANITIZAÇÃO / ANONIMIZAÇÃO
    function toInitials(raw){
      if(raw===null||raw===undefined) return '';
      var s=String(raw).trim();
      if(!s) return '';
      if(/^[A-ZÀ-Ý\.\s]{1,20}$/.test(s.replace(/\s+/g,''))){
        return s.toUpperCase();
      }
      var parts=s.split(/\s+/).filter(Boolean);
      var stopwords=/^(da|de|do|dos|das|e|y|la|el)$/i;
      var filtered=parts.filter(function(p){return !stopwords.test(p);});
      if(!filtered.length) filtered=parts;
      var initials=filtered.map(function(p){return p.charAt(0).toUpperCase();}).join('.');
      return initials? initials + '.' : '';
    }

    function neutralizeOrgNames(text){
      if(text===null||text===undefined) return '';
      var out=String(text);
      var map={
        'bradesco saude':'Plano de Saúde',
        'bradesco saúde':'Plano de Saúde',
        'sulamerica':'Plano de Saúde',
        'sulamérica':'Plano de Saúde',
        'unimed':'Plano de Saúde',
        'amil':'Plano de Saúde',
        'allianz':'Plano de Saúde',
        'porto seguro':'Plano de Saúde',
        'hospital particular':'Hospital Particular',
        'hospital sus':'Hospital SUS',
        'hospital convênio':'Hospital Convênio',
        'hospital convenio':'Hospital Convênio',
        'sterrad':'Autoclave',
        'ster rad':'Autoclave'
      };
      Object.keys(map).forEach(function(k){
        var re=new RegExp(k.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'),'ig');
        out=out.replace(re,map[k]);
      });
      return out;
    }

    function maskNamesInText(text){
      if(text===null||text===undefined) return '';
      var out=String(text);
      out = out.replace(/\b([A-ZÀ-Ý][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ-]+)+)\b/g, function(m){
        return toInitials(m);
      });
      return out;
    }

    function sanitizeFieldForExport(text){
      if(text===null||text===undefined) return '';
      var s=String(text);
      s = neutralizeOrgNames(s);
      s = maskNamesInText(s);
      return s.trim();
    }

    function sanitizeResponsavelField(raw){
      if(raw===null||raw===undefined) return '';
      return toInitials(raw);
    }

    // ==================== GLOBAL: IMPRIMIR / EXCEL / ZERAR
    if(parts.length===0){ // fallback: take first letter
      var ch = left.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g,'').charAt(0) || '';
      return ch ? ch.toUpperCase()+'.' : '';
    }
    var initials = parts.map(function(p){ return p.charAt(0).toUpperCase(); }).join('.') + '.';
    return initials;
  }catch(e){ return ''; }
}

function sanitizePacienteNome(raw){
  if(!raw) return '';
  var s = String(raw).trim();
  var parts = s.split('—');
  var left = parts[0].trim();
  var suffix = parts.length>1 ? ' — ' + parts.slice(1).join('—').trim() : '';
  var initials = toInitials(left);
  return (initials || left) + suffix;
}

// ==================== ETAPA NAV HELPERS ====================
window.stepNavScroll = function(dir){
  var inner = document.getElementById('stepNavInner') || document.querySelector('.step-nav-inner');
  if(!inner) return;
  try{
    var amount = Math.round(inner.clientWidth * 0.6) * dir;
    inner.scrollBy({left: amount, behavior: 'smooth'});
  }catch(e){}
};

window.toggleStepNavExpand = function(){
  var nav = document.getElementById('stepNav'); if(!nav) return;
  var btn = document.getElementById('btnToggleEtapas');
  nav.classList.toggle('expanded');
  var expanded = nav.classList.contains('expanded');
  if(btn) btn.textContent = expanded ? 'Ocultar etapas' : 'Exibir todas as etapas';
  if(btn) btn.setAttribute('aria-pressed', expanded ? 'true' : 'false');
  if(expanded){ try{ nav.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){} }
};


// ==================== ETAPA 1: AGENDAMENTO ====================
window.setAutorizacao = function(status){
  var box = document.getElementById('agd-motivo-rejeicao');
  if(status === 'rejeitada' || status === 'perdida'){ box.style.display = 'block'; } else { box.style.display = 'none'; }
  var alertBox = document.getElementById('agd-alertas-box');
  var alertList = document.getElementById('agd-alertas-lista');
  var alerts = [];
  var convenio = document.getElementById('agd-convenio').value;
  if(status === 'rejeitada') alerts.push('Cirurgia rejeitada — motivo deve ser registrado para reprogramação.');
  if(status === 'perdida') alerts.push('Cirurgia perdida — verificar possibilidade de remarcação com o convênio.');
  if(convenio && convenio !== 'SUS' && convenio !== 'Particular') alerts.push('Verificar prazo de autorização do convênio ' + convenio + '.');
  if(alerts.length > 0){ alertList.innerHTML = alerts.map(function(a){ return '<li>' + a + '</li>'; }).join(''); alertBox.style.display = 'block'; } else { alertBox.style.display = 'none'; }
};

window.salvarAgendamento = function(){
  var origem = document.getElementById('agd-origem').value;
  var convenio = document.getElementById('agd-convenio').value;
  if(!origem || !convenio){ showToast('Preencha origem e convênio.'); return; }
  var data = { origem: origem, convenio: convenio, procedimento: document.getElementById('agd-procedimento').value, codsus: document.getElementById('agd-codsus').value, medico: document.getElementById('agd-medico').value, crm: document.getElementById('agd-crm').value, data: document.getElementById('agd-data').value, hora: document.getElementById('agd-hora').value, hospital: document.getElementById('agd-hospital').value, leito: document.getElementById('agd-leito').value, status: 'autorizada', motivo: '' };
  var motivoBox = document.getElementById('agd-motivo-rejeicao');
  if(motivoBox.style.display === 'block'){ data.status = (document.getElementById('agd-motivo').value) ? 'rejeitada' : 'perdida'; data.motivo = document.getElementById('agd-motivo').value; }
  try { var arr = JSON.parse(localStorage.getItem('cc_agendamentos') || '[]'); arr.push(data); localStorage.setItem('cc_agendamentos', JSON.stringify(arr)); renderAgendamentos(); limparAgendamento(); showToast('Agendamento salvo com sucesso.'); } catch(e){ showToast('Erro ao salvar agendamento.'); }
};

window.limparAgendamento = function(){
  ['agd-origem','agd-convenio','agd-procedimento','agd-codsus','agd-medico','agd-crm','agd-data','agd-hora','agd-hospital','agd-leito','agd-motivo'].forEach(function(id){ var el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('agd-motivo-rejeicao').style.display = 'none';
  document.getElementById('agd-alertas-box').style.display = 'none';
};

window.limparAgendamentos = function(){ if(confirm('Apagar todos os agendamentos?')){ localStorage.removeItem('cc_agendamentos'); renderAgendamentos(); } };

window.renderAgendamentos = function(){
  var tb = document.getElementById('body-agendamentos');
  if(!tb) return;
  try { var arr = JSON.parse(localStorage.getItem('cc_agendamentos') || '[]');
    if(arr.length === 0){ tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--slate-400);padding:20px">Nenhum agendamento salvo.</td></tr>'; return; }
    tb.innerHTML = arr.map(function(a){ var cor = a.status === 'autorizada' ? 'var(--green)' : 'var(--red)'; return '<tr><td>' + (a.origem||'—') + '</td><td>' + (a.convenio||'—') + '</td><td>' + (a.procedimento||'—') + '</td><td>' + (a.medico||'—') + '</td><td>' + (a.data||'—') + '</td><td>' + (a.hora||'—') + '</td><td style="color:' + cor + ';font-weight:700">' + a.status + '</td></tr>'; }).join('');
  } catch(e){}
};

// ==================== ETAPA 4: PREPARO DE MATERIAIS ====================
window.toggleOpme = function(){ document.getElementById('prep-opme-tipo-group').style.display = document.getElementById('prep-opme').value === 'sim' ? 'block' : 'none'; };
window.toggleConsignacao = function(){ document.getElementById('prep-nfe-group').style.display = document.getElementById('prep-consignado').value === 'sim' ? 'block' : 'none'; };
window.toggleChecklist = function(el){ el.classList.toggle('done'); };

window.carregarSelectsPreparo = function(){
  var sel = document.getElementById('prep-cirurgia'); if(!sel) return;
  try { var arr = JSON.parse(localStorage.getItem('cc_agendamentos') || '[]'); var autorizadas = arr.filter(function(a){ return a.status === 'autorizada'; });
    sel.innerHTML = '<option value="">Selecione um agendamento...</option>' + autorizadas.map(function(a, i){ return '<option value="' + i + '">' + (a.procedimento||'Cirurgia') + ' — ' + (a.data||'') + ' ' + (a.medico||'') + '</option>'; }).join('');
  } catch(e){}
};

window.salvarPreparo = function(){
  var cirurgia = document.getElementById('prep-cirurgia').value; var kit = document.getElementById('prep-kit').value;
  if(!cirurgia){ showToast('Selecione a cirurgia vinculada.'); return; }
  var checks = document.querySelectorAll('#prep-checklist .checklist-item.done').length; var total = document.querySelectorAll('#prep-checklist .checklist-item').length;
  var prep = { cirurgiaIdx: cirurgia, kit: kit, opme: document.getElementById('prep-opme').value, opmeTipo: document.getElementById('prep-opme-tipo').value, consignado: document.getElementById('prep-consignado').value, nfe: document.getElementById('prep-nfe').value, checklist: checks + '/' + total, data: new Date().toLocaleDateString('pt-BR') };
  try { var arr = JSON.parse(localStorage.getItem('cc_preparos') || '[]'); arr.push(prep); localStorage.setItem('cc_preparos', JSON.stringify(arr)); showToast('Preparo salvo. Checklist: ' + checks + '/' + total + ' itens conferidos.'); } catch(e){ showToast('Erro ao salvar preparo.'); }
};

// ==================== ETAPA 7: CIRURGIA SEGURA OMS ====================
window.carregarSelectsOms = function(){
  var sel = document.getElementById('oms-cirurgia'); if(!sel) return;
  try { var arr = JSON.parse(localStorage.getItem('cc_agendamentos') || '[]'); var autorizadas = arr.filter(function(a){ return a.status === 'autorizada'; });
    sel.innerHTML = '<option value="">Selecione a cirurgia...</option>' + autorizadas.map(function(a, i){ return '<option value="' + i + '">' + (a.procedimento||'Cirurgia') + ' — ' + (a.data||'') + '</option>'; }).join('');
  } catch(e){}
};

window.salvarCirurgiaSegura = function(){
  var cirurgia = document.getElementById('oms-cirurgia').value; if(!cirurgia){ showToast('Selecione a cirurgia.'); return; }
  var allChecks = document.querySelectorAll('#panel-cirurgia-segura .checklist-item'); var done = document.querySelectorAll('#panel-cirurgia-segura .checklist-item.done');
  if(done.length < allChecks.length){ if(!confirm('Existem ' + (allChecks.length - done.length) + ' itens não conferidos. Salvar mesmo assim?')) return; }
  var oms = { cirurgiaIdx: cirurgia, itensConferidos: done.length + '/' + allChecks.length, sign_in: document.querySelectorAll('.oms-phase.sign-in .checklist-item.done').length + '/' + document.querySelectorAll('.oms-phase.sign-in .checklist-item').length, time_out: document.querySelectorAll('.oms-phase.time-out .checklist-item.done').length + '/' + document.querySelectorAll('.oms-phase.time-out .checklist-item').length, sign_out: document.querySelectorAll('.oms-phase.sign-out .checklist-item.done').length + '/' + document.querySelectorAll('.oms-phase.sign-out .checklist-item').length, data: new Date().toLocaleString('pt-BR') };
  try { var arr = JSON.parse(localStorage.getItem('cc_oms') || '[]'); arr.push(oms); localStorage.setItem('cc_oms', JSON.stringify(arr)); showToast('Checklist OMS salvo: ' + done.length + '/' + allChecks.length + ' itens conferidos.'); } catch(e){ showToast('Erro ao salvar checklist.'); }
};

// ==================== ETAPA 9: PÓS-CIRÚRGICO ====================
window.carregarSelectsPos = function(){
  var sel = document.getElementById('pos-cirurgia'); if(!sel) return;
  try { var arr = JSON.parse(localStorage.getItem('cc_agendamentos') || '[]'); var autorizadas = arr.filter(function(a){ return a.status === 'autorizada'; });
    sel.innerHTML = '<option value="">Selecione a cirurgia...</option>' + autorizadas.map(function(a, i){ return '<option value="' + i + '">' + (a.procedimento||'Cirurgia') + ' — ' + (a.data||'') + '</option>'; }).join('');
  } catch(e){}
};

window.registrarConsumo = function(idx){ var input = document.getElementById('cons-' + idx); if(!input || !input.value){ showToast('Informe a quantidade consumida.'); return; } input.style.borderColor = 'var(--green)'; input.style.backgroundColor = 'var(--green-bg)'; showToast('Consumo registrado: ' + input.value + ' unidades.'); };

window.adicionarMaterialConsumo = function(){ var lista = document.getElementById('pos-consumo-lista'); if(!lista) return; var idx = lista.children.length; var div = document.createElement('div'); div.className = 'consumo-row'; div.innerHTML = '<input type="text" placeholder="Nome do material"/><input type="number" value="0" style="text-align:center"/><input type="number" id="cons-' + idx + '" placeholder="0" style="text-align:center"/><button class="btn btn-ghost btn-sm" onclick="registrarConsumo(' + idx + ')">Registrar</button>'; lista.appendChild(div); };

window.salvarPosCirurgico = function(){
  var cirurgia = document.getElementById('pos-cirurgia').value; if(!cirurgia){ showToast('Selecione a cirurgia.'); return; }
  var checks = document.querySelectorAll('#panel-pos-cirurgico .checklist-item.done').length; var total = document.querySelectorAll('#panel-pos-cirurgico .checklist-item').length;
  var pos = { cirurgiaIdx: cirurgia, destino: document.getElementById('pos-destino').value, tempo: document.getElementById('pos-tempo').value, tempoAnest: document.getElementById('pos-tempo-anest').value, intercorrencias: document.getElementById('pos-intercorrencias').value, obs: document.getElementById('pos-obs').value, altaChecklist: checks + '/' + total, data: new Date().toLocaleString('pt-BR') };
  try { var arr = JSON.parse(localStorage.getItem('cc_pos') || '[]'); arr.push(pos); localStorage.setItem('cc_pos', JSON.stringify(arr)); showToast('Relatório pós-cirúrgico salvo. Alta checklist: ' + checks + '/' + total + '.'); } catch(e){ showToast('Erro ao salvar relatório.'); }
};

// ==================== TABS ====================
window.switchTab = function(tabId, groupId, btn){
  var tab = document.getElementById(tabId);
  if(!tab) return;
  var parent = tab.parentElement;
  parent.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
  // localizar o container de abas dentro do mesmo parent, fallback para document-wide
  var tabsContainer = parent.querySelector('.tabs') || document.querySelector('.tabs');
  var tabBtns = tabsContainer ? tabsContainer.querySelectorAll('.tab-btn') : document.querySelectorAll('.tab-btn');
  tabBtns.forEach(function(b){ b.classList.remove('active'); });
  tab.classList.add('active');
  // se foi passado o elemento (this) ou o event, usa-o; senão procura o botão cujo onclick referencia o tabId
  if(btn && btn.nodeType === 1){ btn.classList.add('active'); return; }
  for(var i=0;i<tabBtns.length;i++){
    var b = tabBtns[i];
    var onclickAttr = b.getAttribute('onclick') || '';
    if(onclickAttr.indexOf("'" + tabId + "'") !== -1 || onclickAttr.indexOf('"' + tabId + '"') !== -1){
      b.classList.add('active'); break;
    }
  }
};

// ==================== AVISO DE CIRURGIA ====================
function getAvisos(){
  try{
    var raw = JSON.parse(localStorage.getItem(SK_AVISOS)||"[]");
    if(!Array.isArray(raw)) raw = [];
    var changed = false;
    var norm = raw.map(function(a){
      try{
        var copy = Object.assign({}, a);
        var newNome = sanitizePacienteNome(copy.nome || '');
        if(newNome !== (copy.nome || '')){ copy.nome = newNome; changed = true; }
        return copy;
      }catch(e){ return a; }
    });
    if(changed){ try{ localStorage.setItem(SK_AVISOS, JSON.stringify(norm)); }catch(e){} }
    return norm;
  }catch(e){ return []; }
}
function setAvisos(a){ try{ localStorage.setItem(SK_AVISOS, JSON.stringify(a)); }catch(e){} }

window.salvarAviso = function(){
  var nome = document.getElementById('av-nome').value.trim();
  var proc = document.getElementById('av-procedimento').value.trim();
  var cirurgiao = document.getElementById('av-cirurgiao').value.trim();
  if(!nome || !proc || !cirurgiao){
    showToast('Preencha Iniciais do paciente, Procedimento e Cirurgião para salvar.','warning'); return;
  }
  // Garantir que apenas iniciais sejam salvas no campo nome
  nome = sanitizePacienteNome(nome);
  var avisos = getAvisos();
  var aviso = {
    id: Date.now(),
    nome: nome,
    dn: document.getElementById('av-dn').value,
    sexo: document.getElementById('av-sexo').value,
    prontuario: document.getElementById('av-prontuario').value,
    leito: document.getElementById('av-leito').value,
    convenio: document.getElementById('av-convenio').value,
    peso: document.getElementById('av-peso').value,
    procedimento: proc,
    tuss: document.getElementById('av-tuss').value,
    lateralidade: document.getElementById('av-lateral').value,
    carater: document.getElementById('av-carater').value,
    data: document.getElementById('av-data').value,
    hora: document.getElementById('av-hora').value,
    duracao: document.getElementById('av-duracao').value,
    sala: document.getElementById('av-sala').value || 'A definir',
    anestesia: document.getElementById('av-anestesia').value,
    posicao: document.getElementById('av-posicao').value,
    cirurgiao: cirurgiao,
    aux1: document.getElementById('av-aux1').value,
    anestesista: document.getElementById('av-anestesista').value,
    enfermeiro: document.getElementById('av-enfermeiro').value,
    instrumentador: document.getElementById('av-instrumentador').value,
    obs: document.getElementById('av-obs').value,
    latex: document.getElementById('av-latex').value,
    hm: document.getElementById('av-hm').value,
    vad: document.getElementById('av-vad').value,
    munro: document.getElementById('av-munro').value,
    precaucao: document.getElementById('av-precaucao').value,
    sangue: document.getElementById('av-sangue').value,
    statusMapa: 'agendada',
    statusSala: 'livre'
  };
  avisos.push(aviso);
  setAvisos(avisos);
  carregarAvisos();
  showToast('Aviso de cirurgia salvo com sucesso!','success');
  limparAviso();
};

window.limparAviso = function(){
  ['av-nome','av-dn','av-prontuario','av-leito','av-peso','av-procedimento','av-tuss','av-cirurgiao','av-aux1','av-anestesista','av-enfermeiro','av-instrumentador','av-obs'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.value='';
  });
};

window.carregarAvisos = function(){
  var avisos = getAvisos();
  var tb = document.getElementById('body-avisos');
  var tbAl = document.getElementById('body-alocacao');
  if(!avisos.length){
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--slate-400);padding:30px">Nenhum aviso registrado.</td></tr>';
    tbAl.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--slate-400);padding:30px">Nenhum aviso encontrado.</td></tr>';
    return;
  }
  var statusLabels = {agendada:'Agendada',confirmada:'Confirmada',cancelada:'Cancelada',em_curso:'Em curso',concluida:'Concluída'};
  var statusClasses = {agendada:'badge-blue',confirmada:'badge-green',cancelada:'badge-red',em_curso:'badge-amber',concluida:'badge-slate'};
  var caraterColors = {eletiva:'badge-blue',urgencia:'badge-amber',emergencia:'badge-red'};
  tb.innerHTML = avisos.map(function(a, i){
    var nomeSan = sanitizePacienteNome(a.nome || '');
    var nomeFormatado = nomeSan.length > 28 ? nomeSan.substring(0,25)+'...' : nomeSan;
    var procFormatado = a.procedimento.length > 35 ? a.procedimento.substring(0,32)+'...' : a.procedimento;
    return '<tr>' +
      '<td><strong style="color:var(--navy)">#'+(i+1)+'</strong></td>' +
      '<td><strong>'+(a.data||'—')+'</strong><br><span style="color:var(--slate-500);font-size:11px">'+(a.hora||'—')+'</span></td>' +
      '<td title="'+nomeSan+'">'+nomeFormatado+'</td>' +
      '<td title="'+a.procedimento+'" style="font-size:12px">'+procFormatado+'</td>' +
      '<td>'+a.cirurgiao+'</td>' +
      '<td>'+(a.convenio||'—')+'</td>' +
      '<td><span class="badge '+caraterColors[a.carater]+'">'+a.carater+'</span></td>' +
      '<td><span class="badge '+(statusClasses[a.statusMapa]||'badge-slate')+'">'+(statusLabels[a.statusMapa]||a.statusMapa)+'</span></td>' +
      '<td><button class="btn btn-ghost btn-sm" onclick="confirmarAviso('+a.id+')" style="margin-right:4px">Confirmar</button><button class="btn btn-danger btn-sm" onclick="excluirAviso('+a.id+')">X</button></td>' +
    '</tr>';
  }).join('');

  tbAl.innerHTML = avisos.map(function(a){
    var bateClass = a.statusMapa === 'confirmada' ? 'badge-green' : 'badge-amber';
    var bateLabel = a.statusMapa === 'confirmada' ? 'Confirmado' : 'Pendente';
    return '<tr>' +
      '<td><strong style="color:var(--navy);font-size:16px">'+(a.sala||'?')+'</strong></td>' +
      '<td><strong>'+(a.hora||'—')+'</strong></td>' +
      '<td>'+sanitizePacienteNome(a.nome)+'</td>' +
      '<td style="font-size:11.5px">'+a.procedimento+'</td>' +
      '<td>'+a.cirurgiao+'</td>' +
      '<td style="font-size:12px">'+a.anestesia+'</td>' +
      '<td><span class="badge '+bateClass+'">'+bateLabel+'</span></td>' +
      '<td><button class="btn btn-success btn-sm" onclick="confirmarAviso('+a.id+')">Confirmar</button></td>' +
    '</tr>';
  }).join('');
};

window.confirmarAviso = function(id){
  var avisos = getAvisos();
  avisos = avisos.map(function(a){ if(a.id===id) a.statusMapa='confirmada'; return a; });
  setAvisos(avisos);
  carregarAvisos();
  showToast('Aviso confirmado no bate-mapa!','success');
};

window.excluirAviso = function(id){
  if(!confirm('Excluir este aviso de cirurgia?')) return;
  var avisos = getAvisos().filter(function(a){ return a.id!==id; });
  setAvisos(avisos);
  carregarAvisos();
  showToast('Aviso excluído.');
};

// ==================== CHECKLIST BATE-MAPA ====================
window.toggleCheck = function(el){
  var cb = el.querySelector('input[type=checkbox]');
  cb.checked = !cb.checked;
  el.classList.toggle('checked', cb.checked);
  atualizarContador();
};

window.resetChecklist = function(){
  document.querySelectorAll('.cl-item').forEach(function(el){
    el.classList.remove('checked');
    el.querySelector('input').checked = false;
  });
  atualizarContador();
};

function atualizarContador(){
  var total = document.querySelectorAll('.cl-item').length;
  var done = document.querySelectorAll('.cl-item.checked').length;
  document.getElementById('checklist-counter').textContent = done+'/'+total+' concluídos';
}

window.confirmarBateMapa = function(){
  var done = document.querySelectorAll('.cl-item.checked').length;
  var total = document.querySelectorAll('.cl-item').length;
  if(done < total * 0.7){
    showToast('Complete pelo menos 70% do checklist antes de confirmar.','warning'); return;
  }
  showToast('Bate-mapa confirmado! Mapa cirúrgico gerado.','success');
  setTimeout(function(){ goStep(2); }, 1200);
};

// ==================== MAPA CIRÚRGICO ====================
var EXEMPLOS = [
  {id:1001,nome:'A.S.N. — 10/06/1940 (80 anos)',prontuario:'287098',procedimento:'IMPLANTE DE DESFIBRILADOR',lateralidade:'Não se aplica',cirurgiao:'Dr. Adolpho Carvalho',anestesista:'Dr. Victor Branco',convenio:'Sul América Saúde',leito:'Semi Intensiva 622',sangue:'S',uti:'Sim',enfermeiro:'Marcelo Guimarães',statusSala:'inicio_cirurgia',statusMapa:'em_curso',sala:'Sala 01',hora:'08:00',duracao:'2h',data:'',carater:'eletiva',sexo:'Masculino',latex:'nao',hm:'nao',vad:'nao',munro:'moderado',precaucao:'nenhuma',anestesia:'Geral inalatória (IOT)',posicao:'Supino (dorsal)',progresso:68},
  {id:1002,nome:'M.C.B.A. — 48 anos',prontuario:'287273',procedimento:'COLOCAÇÃO URETEROSCÓPICA DE DUPLO J',lateralidade:'Não se aplica',cirurgiao:'Dr. Adolpho Carvalho',anestesista:'',convenio:'Allianz Saúde',leito:'',sangue:'Não',uti:'Não',enfermeiro:'Marcelo Guimarães',statusSala:'inicio_cirurgia',statusMapa:'em_curso',sala:'Sala 02',hora:'11:20',duracao:'1h',data:'',carater:'eletiva',sexo:'Feminino',latex:'nao',hm:'nao',vad:'nao',munro:'baixo',precaucao:'nenhuma',anestesia:'Raquidiana / Subaracnóidea',posicao:'Litotomia',progresso:45},
  {id:1003,nome:'C.C.O.Z. — 25 anos',prontuario:'287280',procedimento:'COLECISTECTOMIA COM COLANGIOGRAFIA POR VÍDEO',lateralidade:'Não se aplica',cirurgiao:'Dr. Adolpho Carvalho',anestesista:'Dr. Victor Branco',convenio:'Sul América Saúde',leito:'',sangue:'Não',uti:'Não',enfermeiro:'Marcelo Guimarães',statusSala:'inicio_cirurgia',statusMapa:'em_curso',sala:'Sala 03',hora:'13:30',duracao:'2h',data:'',carater:'eletiva',sexo:'Feminino',latex:'nao',hm:'nao',vad:'nao',munro:'baixo',precaucao:'nenhuma',anestesia:'Geral inalatória (IOT)',posicao:'Supino (dorsal)',progresso:22},
  {id:1004,nome:'P.R.P.R. — 46 anos',prontuario:'287372',procedimento:'COLOCAÇÃO DE SHUNT DEFINITIVO',lateralidade:'Não se aplica',cirurgiao:'Dr. Adolpho Carvalho',anestesista:'',convenio:'Seguros Unimed',leito:'',sangue:'Não',uti:'Não',enfermeiro:'Marcelo Guimarães',statusSala:'paciente_sala',statusMapa:'confirmada',sala:'Sala 04',hora:'14:00',duracao:'3h',data:'',carater:'eletiva',sexo:'Masculino',latex:'nao',hm:'nao',vad:'suspeita',munro:'moderado',precaucao:'nenhuma',anestesia:'Geral TIVA (via venosa)',posicao:'Supino (dorsal)',progresso:0},
  {id:1005,nome:'G.L.P.A. — 23 anos',prontuario:'287271',procedimento:'SEPTO NASAL — SEPTOPLASTIA',lateralidade:'Não se aplica',cirurgiao:'Dr. Adolpho Carvalho',anestesista:'',convenio:'Bradesco Saúde',leito:'',sangue:'Não',uti:'Não',enfermeiro:'Marcelo Guimarães',statusSala:'inicio_anestesia',statusMapa:'confirmada',sala:'Sala 06',hora:'10:20',duracao:'1h',data:'',carater:'eletiva',sexo:'Feminino',latex:'sim',hm:'nao',vad:'nao',munro:'baixo',precaucao:'nenhuma',anestesia:'Geral inalatória (IOT)',posicao:'Supino (dorsal)',progresso:0},
  {id:1006,nome:'L.C.A.D.S.G. — 53 anos',prontuario:'287310',procedimento:'COLECISTECTOMIA COM COLANGIOGRAFIA POR VÍDEO',lateralidade:'Não se aplica',cirurgiao:'Dr. Esther Maria',anestesista:'',convenio:'Sompo Saúde',leito:'',sangue:'S',uti:'Não',enfermeiro:'Marcelo Guimarães',statusSala:'inicio_cirurgia',statusMapa:'em_curso',sala:'Sala 08',hora:'11:45',duracao:'2h',data:'',carater:'eletiva',sexo:'Feminino',latex:'nao',hm:'sim',vad:'nao',munro:'alto',precaucao:'contato',anestesia:'Geral inalatória (IOT)',posicao:'Supino (dorsal)',progresso:55},
  {id:1007,nome:'I.X.D.R. — 67 anos',prontuario:'287283',procedimento:'VARIZES — TRATAMENTO CIRÚRGICO BILATERAL',lateralidade:'Bilateral',cirurgiao:'Dr. Adolpho Carvalho',anestesista:'',convenio:'Particular',leito:'',sangue:'Não',uti:'Não',enfermeiro:'Marcelo Guimarães',statusSala:'agendada',statusMapa:'agendada',sala:'Sala 10',hora:'09:00',duracao:'2h',data:'',carater:'eletiva',sexo:'Feminino',latex:'nao',hm:'nao',vad:'nao',munro:'moderado',precaucao:'nenhuma',anestesia:'Raquidiana / Subaracnóidea',posicao:'Supino (dorsal)',progresso:0}
];

window.adicionarExemplos = function(){
  var today = new Date().toISOString().split('T')[0];
  EXEMPLOS.forEach(function(e){ e.data = today; });
  var avisos = getAvisos();
  EXEMPLOS.forEach(function(ex){
    if(!avisos.find(function(a){ return a.id===ex.id; })){
      avisos.push(ex);
    }
  });
  setAvisos(avisos);
  carregarAvisos();
  renderMapa();
  showToast('Dados de exemplo carregados!','success');
};

var STATUS_LABELS = {
  livre:'Sala Livre', agendada:'Agendada', confirmada:'Confirmada',
  paciente_sala:'Paciente em Sala', inicio_anestesia:'Início de Anestesia',
  inicio_cirurgia:'Início de Cirurgia', termino_cirurgia:'Término de Cirurgia',
  termino_anestesia:'Término de Anestesia', fora_sala:'Paciente Fora da Sala',
  limpeza:'Limpeza', interditada:'Sala Interditada', em_curso:'Em Curso', concluida:'Concluída'
};
var STATUS_CORES = {
  livre:'#10B981', agendada:'#93C5FD', confirmada:'#60A5FA',
  paciente_sala:'#F59E0B', inicio_anestesia:'#60A5FA',
  inicio_cirurgia:'#EF4444', termino_cirurgia:'#8B5CF6',
  termino_anestesia:'#0D9488', fora_sala:'#F97316',
  limpeza:'#94A3B8', interditada:'#1E293B', em_curso:'#EF4444', concluida:'#10B981'
};

window.renderMapa = function(){
  var avisos = getAvisos();
  var filtroStatus = document.getElementById('filtro-status')?.value||'';
  var filtroSala = document.getElementById('filtro-sala')?.value||'';
  var filtroData = document.getElementById('filtro-data-mapa')?.value||'';
  if(filtroStatus) avisos = avisos.filter(function(a){ return a.statusMapa===filtroStatus||a.statusSala===filtroStatus; });
  if(filtroSala) avisos = avisos.filter(function(a){ return a.sala===filtroSala; });
  if(filtroData) avisos = avisos.filter(function(a){ return a.data===filtroData; });
  var tb = document.getElementById('body-mapa');
  var totalEl = document.getElementById('total-cirurgias');
  if(totalEl) totalEl.textContent = avisos.length;
  if(!tb) return;
  if(!avisos.length){
    tb.innerHTML = '<tr><td colspan="13" style="text-align:center;color:var(--slate-400);padding:40px">Nenhuma cirurgia encontrada. Ajuste os filtros ou adicione exemplos.</td></tr>';
    return;
  }
  tb.innerHTML = avisos.map(function(a){
    var cor = STATUS_CORES[a.statusSala]||STATUS_CORES[a.statusMapa]||'#94A3B8';
    var label = STATUS_LABELS[a.statusSala]||STATUS_LABELS[a.statusMapa]||'—';
    var sangueDisplay = a.sangue==='S'?'<span class="badge badge-red">S</span>':a.sangue==='R'?'<span class="badge badge-red">R</span>':'Não';
    var utiDisplay = a.uti==='Sim'?'<span class="badge badge-amber">Sim</span>':'Não';
    var latexIcon = a.latex==='sim'?' <span title="Látex-free" style="font-size:13px">⚠️</span>':'';
    var hmIcon = a.hm==='confirmado'||a.hm==='suspeita'?' <span title="Hipertermia Maligna" style="font-size:13px">🔥</span>':'';
    var vadIcon = a.vad==='sim'||a.vad==='suspeita'?' <span title="Via Aérea Difícil" style="font-size:13px">🩺</span>':'';
    var latIcon = a.lateralidade!=='Não se aplica'&&a.lateralidade!=='nao_se_aplica'?' <span title="Lateralidade marcada" style="font-size:13px">🎯</span>':'';
    return '<tr>' +
      '<td><strong style="font-size:16px;color:var(--navy)">'+a.sala+'</strong></td>' +
      '<td><strong>'+a.hora+'</strong><br><span style="font-size:10px;color:var(--slate-400)">'+a.prontuario+'</span></td>' +
      '<td><strong>'+sanitizePacienteNome(a.nome).split('—')[0].trim()+'</strong>'+latexIcon+hmIcon+vadIcon+'</td>' +
      '<td style="font-size:12px">'+a.procedimento+'</td>' +
      '<td style="font-size:12px">'+(a.lateralidade||'—')+latIcon+'</td>' +
      '<td style="font-size:12px">'+a.cirurgiao+'</td>' +
      '<td style="font-size:12px">'+(a.anestesista||'—')+'</td>' +
      '<td style="font-size:12px">'+(a.convenio||'—')+'</td>' +
      '<td style="font-size:11px;color:var(--slate-500)">'+(a.leito||'—')+'</td>' +
      '<td class="center">'+sangueDisplay+'</td>' +
      '<td class="center">'+utiDisplay+'</td>' +
      '<td style="font-size:12px">'+(a.enfermeiro||'—')+'</td>' +
      '<td><span onclick="alterarStatus('+a.id+')" style="display:inline-flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px;background:'+cor+'20;color:'+cor+';border:1px solid '+cor+'50">'+
      '<span style="width:8px;height:8px;border-radius:50%;background:'+cor+';display:inline-block"></span>'+label+'</span></td>' +
    '</tr>';
  }).join('');
};

window.alterarStatus = function(id){
  var opcoes = ['paciente_sala','inicio_anestesia','inicio_cirurgia','termino_cirurgia','termino_anestesia','fora_sala','limpeza','livre'];
  var avisos = getAvisos();
  var av = avisos.find(function(a){ return a.id===id; });
  if(!av) return;
  var idx = opcoes.indexOf(av.statusSala);
  var next = opcoes[(idx+1)%opcoes.length];
  av.statusSala = next;
  if(next==='inicio_cirurgia') av.statusMapa='em_curso';
  if(next==='livre') av.statusMapa='concluida';
  setAvisos(avisos);
  renderMapa();
  renderPainel();
  renderStatusSalas();
  showToast('Status atualizado: '+STATUS_LABELS[next],'success');
};

// ==================== PAINEL DE SALAS ====================
window.renderPainel = function(){
  var avisos = getAvisos();
  var grid = document.getElementById('painel-grid');
  var ultimaAttEl = document.getElementById('ultima-att');
  if(ultimaAttEl) ultimaAttEl.textContent = new Date().toLocaleTimeString('pt-BR');
  if(!grid) return;
  if(!avisos.length){
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--slate-400)"><p>Nenhuma cirurgia carregada. Use "+ Exemplos".</p></div>';
    return;
  }
  grid.innerHTML = avisos.map(function(a){
    var cor = STATUS_CORES[a.statusSala]||STATUS_CORES[a.statusMapa]||'#94A3B8';
    var label = STATUS_LABELS[a.statusSala]||STATUS_LABELS[a.statusMapa]||'—';
    var livre = a.statusSala==='livre'||a.statusSala==='agendada'||!a.statusSala;
    var pct = a.progresso||0;
    var barClass = pct>=100?'sc-bar-fill red':'sc-bar-fill';
    var icons = '';
    if(a.latex==='sim') icons+='<span title="Látex-free" style="font-size:16px">⚠️</span>';
    if(a.hm==='confirmado'||a.hm==='suspeita') icons+='<span title="Hipertermia Maligna" style="font-size:16px">🔥</span>';
    if(a.vad==='sim'||a.vad==='suspeita') icons+='<span title="Via Aérea Difícil" style="font-size:16px">🩺</span>';
    if(a.sangue==='S'||a.sangue==='R') icons+='<span title="Hemocomponente" style="font-size:16px">🩸</span>';
    if(a.lateralidade&&a.lateralidade!=='Não se aplica'&&a.lateralidade!=='nao_se_aplica') icons+='<span title="Demarcação de lateralidade" style="font-size:16px">🎯</span>';
    if(a.precaucao&&a.precaucao!=='nenhuma') icons+='<span title="Isolamento: '+a.precaucao+'" style="font-size:16px">🛡️</span>';
    var munroBadge = a.munro&&a.munro!=='baixo'?'<span class="badge '+(a.munro==='alto'?'badge-red':'badge-amber')+'" style="font-size:10px">Munro: '+a.munro+'</span>':'';
    return '<div class="sala-card'+(livre?' livre':'')+'" onclick="abrirModal('+a.id+')">' +
      '<div class="sc-head">' +
        '<span class="sc-sala">'+a.sala+'</span>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span class="sc-hora">'+a.hora+'</span>' +
          '<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;background:'+cor+'20;color:'+cor+';border:1px solid '+cor+'50">'+
          '<span style="width:7px;height:7px;border-radius:50%;background:'+cor+';display:inline-block"></span>'+label+'</span>' +
        '</div>' +
      '</div>' +
      '<div class="sc-body">' +
        '<p class="sc-pac">'+sanitizePacienteNome(a.nome)+'</p>' +
        '<p class="sc-proc">'+a.procedimento+'</p>' +
        '<div class="sc-team">' +
          (a.cirurgiao?'<span class="member">+ '+a.cirurgiao+'</span>':'')+
          (a.anestesista?'<span class="member">A '+a.anestesista+'</span>':'')+
          (a.enfermeiro?'<span class="member">C '+a.enfermeiro+'</span>':'')+
        '</div>' +
        (icons?'<div class="sc-icons">'+icons+'</div>':'')+
        (munroBadge?'<div style="margin-bottom:8px">'+munroBadge+'</div>':'')+
        (pct>0?'<div class="sc-bar-wrap"><div class="'+barClass+'" style="width:'+Math.min(pct,100)+'%"></div></div>':'') +
      '</div>' +
      '<div class="sc-foot">' +
        '<span class="destino">Destino: '+(a.leito||'—')+'</span>' +
        '<span class="duracao">'+a.duracao+'</span>' +
      '</div>' +
    '</div>';
  }).join('');
};

// ==================== STATUS SALAS ====================
window.renderStatusSalas = function(){
  var avisos = getAvisos();
  var grid = document.getElementById('status-salas-grid');
  if(!grid) return;
  if(!avisos.length){
    grid.innerHTML = '<div style="color:var(--slate-400);padding:20px;text-align:center">Carregue exemplos ou salve avisos para ver as salas.</div>';
    return;
  }
  var statusOpts = ['agendada','confirmada','paciente_sala','inicio_anestesia','inicio_cirurgia','termino_cirurgia','termino_anestesia','fora_sala','limpeza','livre'];
  grid.innerHTML = avisos.map(function(a){
    var cor = STATUS_CORES[a.statusSala]||'#94A3B8';
    return '<div class="card" style="border-top:3px solid '+cor+'">' +
      '<div class="card-body" style="padding:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">' +
          '<div><strong style="font-size:18px;color:var(--navy)">'+a.sala+'</strong><br><span style="font-size:12px;color:var(--slate-500)">'+sanitizePacienteNome(a.nome).split('—')[0].trim()+'</span></div>' +
          '<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:'+cor+';box-shadow:0 0 0 3px '+cor+'30"></span>' +
        '</div>' +
        '<p style="font-size:12px;color:var(--slate-500);margin-bottom:10px">'+a.procedimento.substring(0,45)+(a.procedimento.length>45?'...':'')+'</p>' +
        '<select onchange="setStatusSala('+a.id+',this.value)" style="width:100%;padding:8px 10px;border:1.5px solid var(--slate-200);border-radius:9px;font-size:13px;font-weight:600;color:var(--ink);background:#fff;outline:none">' +
        statusOpts.map(function(s){ return '<option value="'+s+'"'+(s===a.statusSala?' selected':'')+'>'+STATUS_LABELS[s]+'</option>'; }).join('') +
        '</select>' +
        '<div style="margin-top:8px;font-size:11px;color:var(--slate-400);display:flex;justify-content:space-between">' +
          '<span>'+a.hora+' | '+a.duracao+'</span>' +
          '<span style="color:'+cor+';font-weight:700">'+STATUS_LABELS[a.statusSala]+'</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
};

window.setStatusSala = function(id, status){
  var avisos = getAvisos();
  avisos = avisos.map(function(a){
    if(a.id===id){
      a.statusSala = status;
      if(status==='inicio_cirurgia') a.statusMapa='em_curso';
      if(status==='livre') a.statusMapa='concluida';
    }
    return a;
  });
  setAvisos(avisos);
  renderPainel();
  showToast('Status atualizado: '+STATUS_LABELS[status],'success');
};

// ==================== RELATÓRIOS ====================
window.renderRelatorios = function(){
  var avisos = getAvisos();
  var grid = document.getElementById('indicadores-grid');
  if(!grid) return;
  var total = avisos.length;
  var concluidas = avisos.filter(function(a){ return a.statusMapa==='concluida'||a.statusSala==='livre'; }).length;
  var em_curso = avisos.filter(function(a){ return a.statusMapa==='em_curso'||a.statusSala==='inicio_cirurgia'; }).length;
  var canceladas = avisos.filter(function(a){ return a.statusMapa==='cancelada'; }).length;
  var salas = [...new Set(avisos.map(function(a){ return a.sala; }))].length;

  function indicador(label,valor,cor,sub){
    return '<div class="card"><div class="card-body" style="text-align:center;padding:20px">' +
      '<p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--slate-500);margin-bottom:8px">'+label+'</p>' +
      '<p style="font-size:36px;font-weight:900;color:'+cor+';line-height:1">'+valor+'</p>' +
      (sub?'<p style="font-size:11.5px;color:var(--slate-400);margin-top:6px">'+sub+'</p>':'')+
    '</div></div>';
  }

  grid.innerHTML =
    indicador('Total de Cirurgias', total, 'var(--navy)', 'no mapa do dia') +
    indicador('Em Curso', em_curso, 'var(--red)', 'salas ativas agora') +
    indicador('Concluídas', concluidas, 'var(--green)', 'procedimentos finalizados') +
    indicador('Canceladas', canceladas, 'var(--amber)', 'meta: < 5%') +
    indicador('Salas em Uso', salas, 'var(--blue)', 'salas diferentes') +
    indicador('Taxa de Conclusão', total>0?Math.round((concluidas/total)*100)+'%':'—', 'var(--teal)', 'concluídas / agendadas');

  var tb = document.getElementById('body-relatorio');
  if(!tb) return;
  var porSala = {};
  avisos.forEach(function(a){
    if(!porSala[a.sala]) porSala[a.sala]={sala:a.sala,n:0,concluidas:0};
    porSala[a.sala].n++;
    if(a.statusMapa==='concluida') porSala[a.sala].concluidas++;
  });
  var salas = Object.values(porSala);
  if(!salas.length){
    tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--slate-400);padding:30px">Sem dados.</td></tr>';
    return;
  }
  tb.innerHTML = salas.map(function(s){
    var taxa = Math.round((s.concluidas/s.n)*100);
    return '<tr>' +
      '<td><strong style="color:var(--navy)">'+s.sala+'</strong></td>' +
      '<td class="center"><strong>'+s.n+'</strong></td>' +
      '<td style="color:var(--slate-500)">—</td>' +
      '<td style="color:var(--slate-500)">—</td>' +
      '<td class="center"><strong style="color:'+(taxa>=80?'var(--green)':taxa>=60?'var(--amber)':'var(--red)')+'">'+taxa+'%</strong></td>' +
      '<td class="center" style="color:var(--slate-500)">~20 min</td>' +
      '<td><span class="badge '+(taxa>=80?'badge-green':taxa>=60?'badge-amber':'badge-red')+'">'+(taxa>=80?'Meta atingida':taxa>=60?'Atenção':'Abaixo da meta')+'</span></td>' +
    '</tr>';
  }).join('');
};

// ==================== MODAL ====================
window.abrirModal = function(id){
  var avisos = getAvisos();
  var a = avisos.find(function(x){ return x.id===id; });
  if(!a) return;
  var modalTitleEl = document.getElementById('modal-title');
  var modalBodyEl = document.getElementById('modal-body');
  var modalSalaEl = document.getElementById('modal-sala');
  if(modalTitleEl) modalTitleEl.textContent = a.sala+' — '+sanitizePacienteNome(a.nome);
  var cor = STATUS_CORES[a.statusSala]||'#94A3B8';
  var label = STATUS_LABELS[a.statusSala]||'—';
  if(modalBodyEl){
    var procedimento = sanitizeFieldForExport(a.procedimento||'—');
    var convenio = neutralizeOrgNames(sanitizeFieldForExport(a.convenio||'—'))||'—';
    var cirurgiao = sanitizeResponsavelField(a.cirurgiao||'—')||'—';
    var anestesia = sanitizeFieldForExport(a.anestesia||'—')||'—';
    var posicao = sanitizeFieldForExport(a.posicao||'—')||'—';
    var lateralidade = sanitizeFieldForExport(a.lateralidade||'—')||'—';
    var hmBadge = (a.hm && a.hm!=='nao')? '<span class="badge badge-red">🔥 '+sanitizeFieldForExport(a.hm)+'</span>':'';
    var vadBadge = (a.vad && a.vad!=='nao')? '<span class="badge badge-amber">🩺 '+sanitizeFieldForExport(a.vad)+'</span>':'';
    var sangueBadge = (a.sangue && a.sangue!=='nao')? '<span class="badge badge-red">🩸 '+sanitizeFieldForExport(a.sangue)+'</span>':'';
    modalBodyEl.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">' +
        '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--slate-400)">Procedimento</p><p style="font-weight:600">'+procedimento+'</p></div>' +
        '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--slate-400)">Convênio</p><p>'+(convenio||'—')+'</p></div>' +
        '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--slate-400)">Cirurgião</p><p>'+(cirurgiao||'—')+'</p></div>' +
        '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--slate-400)">Anestesia</p><p>'+(anestesia||'—')+'</p></div>' +
        '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--slate-400)">Posição</p><p>'+(posicao||'—')+'</p></div>' +
        '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--slate-400)">Lateralidade</p><p>'+(lateralidade||'—')+'</p></div>' +
      '</div>' +
      '<div style="background:'+cor+'15;border:1px solid '+cor+'50;border-radius:10px;padding:12px;text-align:center;margin-bottom:16px">' +
        '<p style="font-size:11px;color:var(--slate-500);margin-bottom:4px">Status atual</p>' +
        '<p style="font-size:16px;font-weight:800;color:'+cor+'">'+label+'</p>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">' +
        (a.latex==='sim'?'<span class="badge badge-red">⚠️ Látex-free</span>':'')+
        (hmBadge)+
        (vadBadge)+
        (sangueBadge)+
        (a.uti==='Sim'?'<span class="badge badge-amber">🏥 UTI reservada</span>':'')+
        (a.precaucao && a.precaucao!=='nenhuma'?'<span class="badge badge-purple">🛡️ '+sanitizeFieldForExport(a.precaucao)+'</span>':'')+
      '</div>' +
      '<button class="btn btn-ghost" style="width:100%" onclick="fecharModal()">Fechar</button>';
  }
  if(modalSalaEl) modalSalaEl.classList.add('open');
};

window.fecharModal = function(){
  var modalSalaEl = document.getElementById('modal-sala');
  if(modalSalaEl) modalSalaEl.classList.remove('open');
};

var modalSalaClickEl = document.getElementById('modal-sala');
if(modalSalaClickEl) modalSalaClickEl.addEventListener('click', function(e){
  if(e.target===this) fecharModal();
});

// ==================== EXPORT ====================
window.exportarExcel = function(){
  var avisos = getAvisos();
  if(!avisos.length){ showToast('Nenhum dado para exportar.','warning'); return; }
  var sep = '\t';
  var nl = '\n';
  var headers = ['Sala','Horário','Paciente','Prontuário','Procedimento','Lateralidade','Cirurgião','Anestesista','Convênio','Leito','Sangue','UTI','Circulante','Anestesia','Posição','Látex','HM','VAD','Munro','Status'];
  var rows = avisos.map(function(a){
    var sala = sanitizeFieldForExport(a.sala);
    var hora = sanitizeFieldForExport(a.hora);
    var paciente = sanitizePacienteNome(a.nome);
    var prontuario = sanitizeFieldForExport(a.prontuario);
    var procedimento = sanitizeFieldForExport(a.procedimento);
    var lateralidade = sanitizeFieldForExport(a.lateralidade);
    var cirurgiao = sanitizeResponsavelField(a.cirurgiao);
    var anestesista = sanitizeResponsavelField(a.anestesista);
    var convenio = neutralizeOrgNames(sanitizeFieldForExport(a.convenio));
    var leito = sanitizeFieldForExport(a.leito);
    var sangue = sanitizeFieldForExport(a.sangue);
    var uti = sanitizeFieldForExport(a.uti);
    var enfermeiro = sanitizeResponsavelField(a.enfermeiro);
    var anestesia = sanitizeFieldForExport(a.anestesia);
    var posicao = sanitizeFieldForExport(a.posicao);
    var latex = sanitizeFieldForExport(a.latex);
    var hm = sanitizeFieldForExport(a.hm);
    var vad = sanitizeFieldForExport(a.vad);
    var munro = sanitizeFieldForExport(a.munro);
    var status = sanitizeFieldForExport(STATUS_LABELS[a.statusMapa]||a.statusMapa);
    return [sala,hora,paciente,prontuario,procedimento,lateralidade,cirurgiao,anestesista,convenio,leito,sangue,uti,enfermeiro,anestesia,posicao,latex,hm,vad,munro,status].join(sep);
  });
  var csv = headers.join(sep)+nl+rows.join(nl);
  var blob = new Blob(['\ufeff'+csv],{type:'text/tab-separated-values;charset=utf-8'});
  var a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='mapa-cirurgico-'+new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')+'.xls';
  a.click(); URL.revokeObjectURL(a.href);
  showToast('Arquivo Excel exportado!','success');
};

window.imprimirMapa = function(){ window.print(); };

// ==================== TOAST ====================
var toastEl = document.getElementById('toast'), tt;
window.showToast = function(m,type){
  toastEl.textContent=m;
  toastEl.className='toast'+(type?' '+type:'');
  toastEl.classList.add('show');
  clearTimeout(tt);
  tt=setTimeout(function(){ toastEl.classList.remove('show'); },3000);
};

// ==================== INIT ====================
document.getElementById('av-data').value = new Date().toISOString().split('T')[0];
document.getElementById('filtro-data-mapa') && (document.getElementById('filtro-data-mapa').value = new Date().toISOString().split('T')[0]);
carregarAvisos();
renderIndicadoresVazios();

// Normalizar campo de Iniciais do Paciente: uppercase e conversão para iniciais ao sair do campo
(function(){
  var el = document.getElementById('av-nome');
  if(!el) return;
  el.addEventListener('input', function(){ this.value = this.value.toUpperCase(); });
  el.addEventListener('blur', function(){
    var v = (this.value||'').trim(); if(!v) return;
    var newV = toInitials(v.split('—')[0].trim());
    if(newV && newV !== v){ this.value = newV; showToast('Iniciais ajustadas: '+newV,'info'); }
  });
})();

function renderIndicadoresVazios(){
  var grid=document.getElementById('indicadores-grid');
  if(grid) grid.innerHTML='<div class="card"><div class="card-body" style="text-align:center;padding:20px;color:var(--slate-400)">Carregue cirurgias nas etapas anteriores para ver indicadores.</div></div>';
}

// ==================== ETAPA 11: CHECKLIST OMS 3 COLUNAS ====================
var omsEstado={si:{},to:{},so:{}};
var omsTotais={si:11,to:9,so:8};

window.toggleOms=function(el,pausa){
  var id=el.getAttribute('data-id');
  el.classList.toggle('done');
  omsEstado[pausa][id]=el.classList.contains('done');
  omsAtualizarProg(pausa);
  try{localStorage.setItem('cc_oms',JSON.stringify(omsEstado));}catch(e){}
};
window.omsAtualizarProg=function(pausa){
  var feitos=Object.values(omsEstado[pausa]).filter(Boolean).length;
  var total=omsTotais[pausa];
  var pct=Math.round((feitos/total)*100);
  var fill=document.getElementById('fill-'+pausa);
  var txt=document.getElementById('txt-'+pausa);
  if(fill)fill.style.width=pct+'%';
  if(txt)txt.textContent=feitos+'/'+total;
};
window.omsAtualizarTodos=function(){['si','to','so'].forEach(omsAtualizarProg);};
window.finalizarOms=function(){
  var tf=0,ti=0;
  ['si','to','so'].forEach(function(p){tf+=Object.values(omsEstado[p]).filter(Boolean).length;ti+=omsTotais[p];});
  var pct=Math.round((tf/ti)*100);
  var div=document.getElementById('oms-result');
  var cl,titulo,msg;
  if(pct===100){cl='green';titulo='Checklist 100% Concluído';msg='Todos os '+ti+' itens das 3 pausas foram verificados. Checklist completo conforme protocolo OMS.';}
  else if(pct>=80){cl='amber';titulo='Checklist Incompleto — '+pct+'%';msg=tf+'/'+ti+' itens verificados. Revise os itens pendentes.';}
  else{cl='red';titulo='Atenção — Pendências Críticas';msg=tf+'/'+ti+' itens ('+pct+'%). Verifique os itens críticos não conferidos.';}
  div.className='oms3-result show '+cl;
  div.innerHTML='<h3>'+titulo+'</h3><p>'+msg+'</p>';
  div.scrollIntoView({behavior:'smooth',block:'center'});
  showToast(pct===100?'Checklist finalizado!':'Itens pendentes: '+(ti-tf));
};
window.resetOms=function(){
  if(!confirm('Resetar checklist OMS?'))return;
  omsEstado={si:{},to:{},so:{}};
  localStorage.removeItem('cc_oms');
  document.querySelectorAll('#panel-checklist-oms .oms3-item').forEach(function(el){el.classList.remove('done');});
  document.getElementById('oms-result').className='oms3-result';
  omsAtualizarTodos();
  showToast('Checklist resetado.');
};
window.initOmsChecklist=function(){
  try{
    var saved=JSON.parse(localStorage.getItem('cc_oms'));
    if(saved){omsEstado=saved;
      ['si','to','so'].forEach(function(p){
        document.querySelectorAll('#panel-checklist-oms [data-id^="'+p+'"]').forEach(function(el){
          var id=el.getAttribute('data-id');
          if(omsEstado[p]&&omsEstado[p][id])el.classList.add('done');
        });
      });
    }
  }catch(e){}
  omsAtualizarTodos();
};

// ==================== ETAPA 12: RASTREABILIDADE CME ====================
// Compatibilidade de chaves: mantém em sincronia 'cc_cme_hist' <-> 'cme_historico' e
// 'cc_cme_lotes' <-> 'cme_lotes'. Use estas funções para ler/gravar/remover.
function readCmeHist(){
  try{
    var a = JSON.parse(localStorage.getItem('cc_cme_hist') || localStorage.getItem('cme_historico') || '[]');
    // Se existia apenas a chave antiga/nova, escreva a outra para garantir compatibilidade
    if(!localStorage.getItem('cc_cme_hist') && localStorage.getItem('cme_historico')){
      try{ localStorage.setItem('cc_cme_hist', JSON.stringify(a)); }catch(e){}
    }
    if(!localStorage.getItem('cme_historico') && (a && a.length)){
      try{ localStorage.setItem('cme_historico', JSON.stringify(a)); }catch(e){}
    }
    return Array.isArray(a) ? a : [];
  }catch(e){ return []; }
}
function writeCmeHist(arr){
  try{ localStorage.setItem('cc_cme_hist', JSON.stringify(arr)); }catch(e){}
  try{ localStorage.setItem('cme_historico', JSON.stringify(arr)); }catch(e){}
}
function removeCmeHist(){ try{ localStorage.removeItem('cc_cme_hist'); }catch(e){} try{ localStorage.removeItem('cme_historico'); }catch(e){} }

function readCmeLotes(){
  try{
    var a = JSON.parse(localStorage.getItem('cc_cme_lotes') || localStorage.getItem('cme_lotes') || '[]');
    if(!localStorage.getItem('cc_cme_lotes') && localStorage.getItem('cme_lotes')){
      try{ localStorage.setItem('cc_cme_lotes', JSON.stringify(a)); }catch(e){}
    }
    if(!localStorage.getItem('cme_lotes') && (a && a.length)){
      try{ localStorage.setItem('cme_lotes', JSON.stringify(a)); }catch(e){}
    }
    return Array.isArray(a) ? a : [];
  }catch(e){ return []; }
}
function writeCmeLotes(arr){ try{ localStorage.setItem('cc_cme_lotes', JSON.stringify(arr)); }catch(e){} try{ localStorage.setItem('cme_lotes', JSON.stringify(arr)); }catch(e){} }
function removeCmeLotes(){ try{ localStorage.removeItem('cc_cme_lotes'); }catch(e){} try{ localStorage.removeItem('cme_lotes'); }catch(e){} }

// Migração canônica: mescla 'cc_cme_*' e 'cme_*' para usar 'cc_cme_*' como canonical,
// cria backup e remove as chaves antigas ('cme_historico' e 'cme_lotes').
function migrateCmeKeysIfNeeded(){
  try{
    if(localStorage.getItem('cc_cme_migrated_v1')) return;
    var aHist = JSON.parse(localStorage.getItem('cc_cme_hist')||'[]');
    var bHist = JSON.parse(localStorage.getItem('cme_historico')||'[]');
    aHist = Array.isArray(aHist)?aHist:[]; bHist = Array.isArray(bHist)?bHist:[];
    // merge by id (preserve object; bHist overrides aHist on same id)
    var map = {};
    aHist.forEach(function(it){ if(it && it.id) map[it.id]=it; else map['a_'+Math.random()]=it; });
    bHist.forEach(function(it){ if(it && it.id) map[it.id]=it; else map['b_'+Math.random()]=it; });
    var mergedHist = Object.keys(map).map(function(k){ return map[k]; });
    // lotes: merge by numero
    var aL = JSON.parse(localStorage.getItem('cc_cme_lotes')||'[]');
    var bL = JSON.parse(localStorage.getItem('cme_lotes')||'[]');
    aL = Array.isArray(aL)?aL:[]; bL = Array.isArray(bL)?bL:[];
    var mapL = {};
    aL.forEach(function(l){ if(l && l.numero) mapL[l.numero]=l; else mapL['a_'+Math.random()]=l; });
    bL.forEach(function(l){ if(l && l.numero) mapL[l.numero]=l; else mapL['b_'+Math.random()]=l; });
    var mergedLotes = Object.keys(mapL).map(function(k){ return mapL[k]; });
    // backups (keep original cme_* in backup keys before removal)
    try{ if(bHist && bHist.length) localStorage.setItem('cme_historico_backup_v1', JSON.stringify(bHist)); }catch(e){}
    try{ if(bL && bL.length) localStorage.setItem('cme_lotes_backup_v1', JSON.stringify(bL)); }catch(e){}
    // write canonical keys
    try{ writeCmeHist(mergedHist); }catch(e){}
    try{ writeCmeLotes(mergedLotes); }catch(e){}
    // remove old keys
    try{ localStorage.removeItem('cme_historico'); localStorage.removeItem('cme_lotes'); }catch(e){}
    try{ localStorage.setItem('cc_cme_migrated_v1', '1'); }catch(e){}
    try{ if(typeof showToast==='function') showToast('Migração CME concluída — chaves antigas removidas.','success'); }
    catch(e){}
  }catch(e){ console.error('Erro na migração CME', e); }
}

window.cmeSetEtapa=function(etapa){
  var sel=document.getElementById('cme-etapa');
  if(sel)sel.value=etapa;
  var now=new Date(),pad=function(n){return String(n).padStart(2,'0');};
  var dh=document.getElementById('cme-dh');
  if(dh)dh.value=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+'T'+pad(now.getHours())+':'+pad(now.getMinutes());
};
window.cmeSalvarMov=function(){
  var etapa=document.getElementById('cme-etapa').value;
  var caixa=document.getElementById('cme-caixa').value.trim();
  if(!etapa||!caixa){showToast('Selecione a etapa e informe a caixa.');return;}
  var reg={
    id:Date.now(),
    etapa:etapa,
    caixa:sanitizeFieldForExport(caixa).toUpperCase(),
    esp:sanitizeFieldForExport(document.getElementById('cme-esp').value),
    resp:sanitizeResponsavelField(document.getElementById('cme-resp').value),
    obs:sanitizeFieldForExport(document.getElementById('cme-obs').value),
    dh:sanitizeFieldForExport(document.getElementById('cme-dh').value||new Date().toLocaleDateString('pt-BR'))
  };
  try{
    var arr = readCmeHist();
    arr.unshift(reg);
    writeCmeHist(arr);
    cmeAtualizarContadores();cmeRenderHist();cmeLimparForm();
    showToast('Movimentação registrada: '+etapa+' — '+caixa);
  }catch(e){showToast('Erro ao salvar.');}
};
window.cmeLimparForm=function(){
  ['cme-etapa','cme-caixa','cme-esp','cme-resp','cme-obs','cme-dh'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
};
window.cmeSalvarLote=function(){
  var num=document.getElementById('cme-lote-num').value.trim().toUpperCase();
  var met=document.getElementById('cme-lote-met').value;
  if(!num||!met){showToast('Preencha nº do lote e método.');return;}
  var lote={
    numero:sanitizeFieldForExport(num),
    metodo:sanitizeFieldForExport(met),
    eq:sanitizeFieldForExport(document.getElementById('cme-lote-eq').value),
    dh:sanitizeFieldForExport(document.getElementById('cme-lote-dh').value),
    val:sanitizeFieldForExport(document.getElementById('cme-lote-val').value),
    resp:sanitizeResponsavelField(document.getElementById('cme-lote-resp').value),
    indQ:document.getElementById('cme-ind-q').checked,
    indB:document.getElementById('cme-ind-b').checked,
    indBD:document.getElementById('cme-ind-bd').checked,
    indImp:document.getElementById('cme-ind-imp').checked
  };
  try{
    var arr = readCmeLotes();
    arr.unshift(lote);
    writeCmeLotes(arr);
    cmeRenderLotes();
    showToast('Lote '+num+' salvo.');
  }catch(e){showToast('Erro ao salvar lote.');}
};
window.cmeLimparLotes=function(){if(confirm('Apagar todos os lotes?')){removeCmeLotes();cmeRenderLotes();}};
window.cmeLimparHist=function(){if(confirm('Apagar todo o histórico?')){removeCmeHist();cmeRenderHist();cmeAtualizarContadores();}};
window.cmeExportar=function(){
  try{
    var arr = readCmeHist();
    if(!arr.length){showToast('Nenhum dado.');return;}
    var csv='Data/Hora,Etapa,Caixa,Especialidade,Resp,Obs\n';
    arr.forEach(function(h){
      var dh = sanitizeFieldForExport(h.dh||'');
      var etapa = sanitizeFieldForExport(h.etapa||'');
      var caixa = sanitizeFieldForExport(h.caixa||'');
      var esp = sanitizeFieldForExport(h.esp||'');
      var resp = sanitizeResponsavelField(h.resp||'');
      var obs = sanitizeFieldForExport(h.obs||'');
      csv += '"'+dh+'","'+etapa+'","'+caixa+'","'+esp+'","'+resp+'","'+obs+'"\n';
    });
    var a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('\uFEFF'+csv);
    a.download='rastreabilidade-cme.csv';a.click();
    showToast('CSV exportado.');
  }catch(e){showToast('Erro ao exportar.');}
};
window.cmeAtualizarContadores=function(){
  var etapas=['expurgo','lavagem','inspecao','preparo','esterilizacao','armazenamento'];
  try{
    var hist = readCmeHist();
    etapas.forEach(function(e){var cnt=hist.filter(function(h){return h.etapa===e;}).length;var el=document.getElementById('cnt-'+e);if(el)el.textContent=cnt;});
  }catch(e){}
};
window.cmeRenderLotes=function(){
  var tb=document.getElementById('cme-body-lotes');if(!tb)return;
  try{
    var arr = readCmeLotes();
    if(!arr.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--slate-400);padding:20px">Nenhum lote registrado.</td></tr>';return;}
    tb.innerHTML=arr.map(function(l){
      var inds=[];
      if(l.indQ)inds.push('<span class="badge badge-green">Q</span>');
      if(l.indB)inds.push('<span class="badge badge-blue">B</span>');
      if(l.indBD)inds.push('<span class="badge badge-teal">BD</span>');
      if(l.indImp)inds.push('<span class="badge badge-amber">Imp</span>');
      var numero = sanitizeFieldForExport(l.numero||'');
      var metodo = sanitizeFieldForExport(l.metodo||'');
      var eq = sanitizeFieldForExport(l.eq||'');
      var dh = sanitizeFieldForExport(l.dh||'');
      var val = sanitizeFieldForExport(l.val||'');
      var resp = sanitizeResponsavelField(l.resp||'');
      return '<tr><td style="font-weight:800;color:var(--navy)'> + numero + '</td><td>' + metodo + '</td><td>' + (eq||'—') + '</td><td>' + (dh||'—') + '</td><td>' + (val||'—') + '</td><td>' + (resp||'—') + '</td><td>' + (inds.length?inds.join(' '):'—') + '</td></tr>';
    }).join('');
  }catch(e){}
};
window.cmeRenderHist=function(){
  var tb=document.getElementById('cme-body-hist');if(!tb)return;
  try{
    var arr = readCmeHist();
    if(!arr.length){tb.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--slate-400);padding:20px">Nenhuma movimentação.</td></tr>';return;}
    var cores={'expurgo':'badge-red','lavagem':'badge-blue','inspecao':'badge-gray','preparo':'badge-amber','esterilizacao':'badge-teal','armazenamento':'badge-green'};
    var labels={'expurgo':'Expurgo','lavagem':'Lavagem','inspecao':'Inspeção','preparo':'Preparo','esterilizacao':'Esterilização','armazenamento':'Distribuição'};
    tb.innerHTML=arr.map(function(h){
      var dh = sanitizeFieldForExport(h.dh||'');
      var etapaLabel = sanitizeFieldForExport(labels[h.etapa]||h.etapa||'');
      var caixa = sanitizeFieldForExport(h.caixa||'');
      var esp = sanitizeFieldForExport(h.esp||'');
      var resp = sanitizeResponsavelField(h.resp||'');
      var obs = sanitizeFieldForExport(h.obs||'');
      return '<tr><td style="font-size:11px;white-space:nowrap">'+dh+'</td><td><span class="badge '+(cores[h.etapa]||'badge-gray')+'">'+etapaLabel+'</span></td><td style="font-weight:700">'+caixa+'</td><td>'+(esp||'—')+'</td><td>'+(resp||'—')+'</td><td style="font-size:11px;color:var(--slate-600)">'+(obs||'—')+'</td></tr>';
    }).join('');
  }catch(e){}
};
window.cmeInit=function(){
  try{ if(typeof migrateCmeKeysIfNeeded==='function') migrateCmeKeysIfNeeded(); }catch(e){}
  cmeAtualizarContadores();cmeRenderLotes();cmeRenderHist();
  var now=new Date(),pad=function(n){return String(n).padStart(2,'0');};
  var dh=document.getElementById('cme-dh');if(dh&&!dh.value)dh.value=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+'T'+pad(now.getHours())+':'+pad(now.getMinutes());
  var ld=document.getElementById('cme-lote-dh');if(ld&&!ld.value)ld.value=dh.value;
  var lv=document.getElementById('cme-lote-val');if(lv&&!lv.value){var f=new Date(now.getTime()+180*24*60*60*1000);lv.value=f.getFullYear()+'-'+pad(f.getMonth()+1)+'-'+pad(f.getDate());}
};

// ==================== ETAPA 13: INDICADORES (CHART.JS) ====================
var indCharts={};
var indChartsInit=false;

window.indShowTab=function(id, btn){
  var panel = document.getElementById(id);
  if(!panel) return;
  document.querySelectorAll('.ind-panel').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.ind-tab').forEach(function(t){t.classList.remove('active');});
  panel.classList.add('active');
  if(btn && btn.nodeType===1){ btn.classList.add('active'); return; }
  var tabs = document.querySelectorAll('.ind-tab');
  for(var i=0;i<tabs.length;i++){
    var b = tabs[i];
    var onclickAttr = b.getAttribute('onclick') || '';
    if(onclickAttr.indexOf("'" + id + "'") !== -1 || onclickAttr.indexOf('\"' + id + '\"') !== -1){
      b.classList.add('active');
      break;
    }
  }
};

function barLabelPlugin(){
  return{id:'barLabels',afterDatasetsDraw:function(chart){
    var ctx=chart.ctx;
    chart.data.datasets.forEach(function(ds,di){
      var meta=chart.getDatasetMeta(di);
      meta.data.forEach(function(bar,bi){
        var val=ds.data[bi];if(val===null||val===undefined||val===0)return;
        ctx.save();ctx.fillStyle=ds.barLabelColor||'#475569';ctx.font='600 11px Inter';
        if(chart.config.options.indexAxis==='y'){ctx.textAlign='left';ctx.fillText(val,bar.x+6,bar.y+4);}
        else{ctx.textAlign='center';ctx.fillText(val,bar.x,bar.y-6);}
        ctx.restore();
      });
    });
  }};
}

window.initIndicadores=function(){
  if(indChartsInit||typeof Chart==='undefined')return;
  indChartsInit=true;
  Chart.defaults.font.family="'Inter',sans-serif";Chart.defaults.font.size=11;Chart.defaults.color='#64748B';
  var barP=barLabelPlugin();
  indCharts.evolCancel=new Chart(document.getElementById('cnv-evol-cancel'),{type:'bar',data:{labels:['01/22','02/22','03/22','04/22','05/22','06/22','07/22','08/22','09/22','10/22','11/22','12/22'],datasets:[{data:[28,35,42,31,38,45,33,40,36,44,39,55],backgroundColor:'#3b5a83',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#F1F5F9'}}},plugins:[barP]}});
  indCharts.porte=new Chart(document.getElementById('cnv-porte'),{type:'pie',data:{labels:['Pequeno','Médio','Grande'],datasets:[{data:[210,168,88],backgroundColor:['#3b5a83','#d34e80','#46b8b8'],borderColor:'#fff',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}});
  indCharts.diaSemana=new Chart(document.getElementById('cnv-dia-semana'),{type:'bar',data:{labels:['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],datasets:[{data:[12,78,82,95,88,79,32],backgroundColor:'#3b5a83',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#F1F5F9'}}},plugins:[barP]}});
  indCharts.espec=new Chart(document.getElementById('cnv-especialidade'),{type:'bar',data:{labels:['NÃO INFORMADO','Cirurgia Geral','Ortopedia','Ginecologia','Urologia','Oftalmologia','Otorrino','Neuro'],datasets:[{data:[463,12,8,6,4,3,2,1],backgroundColor:['#d34e80','#3b5a83','#3b5a83','#3b5a83','#3b5a83','#3b5a83','#3b5a83','#3b5a83'],borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,grid:{color:'#F1F5F9'}}},plugins:[barP]}});
  indCharts.motivoCancel=new Chart(document.getElementById('cnv-motivo-cancel'),{type:'bar',data:{labels:['A PEDIDO MEDICO','A PEDIDO PACIENTE','FALTA MATERIAL','CONDIÇÃO CLÍNICA','JEJUM','CADASTRO DUP.','OUTROS'],datasets:[{data:[155,98,72,58,32,18,33],backgroundColor:'#a6396f',borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,grid:{color:'#F1F5F9'}}},plugins:[barP]}});
  indCharts.avisosMes=new Chart(document.getElementById('cnv-avisos-mes'),{type:'bar',data:{labels:['08/22','09/22','10/22','11/22','12/22','01/23','02/23'],datasets:[{data:[395,389,338,389,345,307,228],backgroundColor:'#A4C639',borderRadius:4,barPercentage:.6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#F1F5F9'}}},plugins:[barP]}});
  indCharts.avisosAgend=new Chart(document.getElementById('cnv-avisos-agend'),{type:'doughnut',data:{labels:['SIM','NÃO'],datasets:[{data:[916,564],backgroundColor:['#27AE60','#C0392B'],borderColor:'#fff',borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom'}},plugins:[{id:'centerText',afterDraw:function(chart){var ctx=chart.ctx;var t=chart.data.datasets[0].data.reduce(function(a,b){return a+b;},0);var pct=((chart.data.datasets[0].data[0]/t)*100).toFixed(2);ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';var cx=chart.width/2,cy=chart.height/2;ctx.font='700 12px Inter';ctx.fillStyle='#64748B';ctx.fillText('Total',cx,cy-18);ctx.font='900 20px Inter';ctx.fillStyle='#1E293B';ctx.fillText(t.toLocaleString('pt-BR'),cx,cy+2);ctx.font='700 12px Inter';ctx.fillStyle='#27AE60';ctx.fillText(pct+'%',cx,cy+22);ctx.restore();}}]}});
  indCharts.avisosSala=new Chart(document.getElementById('cnv-avisos-sala'),{type:'bar',data:{labels:['GAM','PROCED','S1','S2','S3','S4','S5','S6'],datasets:[{data:[180,220,310,295,280,260,240,210],backgroundColor:'#2980B9',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#F1F5F9'}}},plugins:[barP]}});
  indCharts.avisosMot=new Chart(document.getElementById('cnv-avisos-mot'),{type:'bar',data:{labels:['A PEDIDO MEDICO','A PEDIDO PACIENTE','CADASTRO DUP.','FALTA MATERIAL','CONDIÇÃO CLÍN.','JEJUM','OUTROS'],datasets:[{data:[116,72,28,18,14,8,6],backgroundColor:'#D35400',borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,grid:{color:'#F1F5F9'}}},plugins:[barP]}});
  indCharts.ocioMes=new Chart(document.getElementById('cnv-ocio-mes'),{type:'bar',data:{labels:['01/22','02/22','03/22'],datasets:[{data:[58.2,54.8,53.3],backgroundColor:'#45a897',borderRadius:4,barPercentage:.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#F1F5F9'},ticks:{callback:function(v){return v+'%'}}}},plugins:[barP]}});
  indCharts.ocioSala=new Chart(document.getElementById('cnv-ocio-sala'),{type:'bar',data:{labels:['SALA 1','SALA 2','SALA 3','SALA 4','SALA 5','SALA 6'],datasets:[{data:[52.1,48.5,61.2,55.8,49.3,65.4],backgroundColor:'#45a897',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#F1F5F9'},ticks:{callback:function(v){return v+'%'}}}},plugins:[barP]}});
  indCharts.ocioHoras=new Chart(document.getElementById('cnv-ocio-horas'),{type:'bar',data:{labels:['01/22','02/22','03/22'],datasets:[{label:'Hr Disponível',data:[1200,1100,1198],backgroundColor:'#5b9bd5',borderRadius:3},{label:'Hr Ociosa',data:[680,620,638],backgroundColor:'#ed7d31',borderRadius:3},{label:'Hr Ocupada',data:[520,480,559],backgroundColor:'#4472c4',borderRadius:3},{label:'Hr Interditada',data:[0,0,0],backgroundColor:'#94A3B8',borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true,grid:{color:'#F1F5F9'}}}}});
  indCharts.ocioDia=new Chart(document.getElementById('cnv-ocio-dia'),{type:'bar',data:{labels:['SEG','TER','QUA','QUI','SEX'],datasets:[{data:[52.3,54.1,56.8,53.2,60.7],backgroundColor:'#45a897',borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,grid:{color:'#F1F5F9'},ticks:{callback:function(v){return v+'%'}}}},plugins:[barP]}});
  indCharts.reopEvol=new Chart(document.getElementById('cnv-reop-evol'),{type:'bar',data:{labels:['08/22','09/22','10/22','11/22','12/22','01/23','02/23'],datasets:[{label:'Total',data:[8,9,7,8,9,8,7],backgroundColor:'#1f77b4',borderRadius:3},{label:'Não Reop.',data:[7,8,6,7,8,7,7],backgroundColor:'#2ca02c',borderRadius:3},{label:'Reop.',data:[1,1,1,1,1,1,0],backgroundColor:'#d62728',borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true,grid:{color:'#F1F5F9'}}}}});
  indCharts.reopPer=new Chart(document.getElementById('cnv-reop-per'),{type:'bar',data:{labels:['08/22','09/22','10/22','11/22','12/22','01/23','02/23'],datasets:[{data:[12.5,11.1,14.3,12.5,11.1,12.5,0],backgroundColor:'#d62728',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#F1F5F9'},ticks:{callback:function(v){return v+'%'}}}},plugins:[barP]}});
  indCharts.reopEsp=new Chart(document.getElementById('cnv-reop-esp'),{type:'bar',data:{labels:['CIRURGIA CARDIOVASCULAR','NEUROCIRURGIA','CIRURGIA GERAL','ORTOPEDIA','UROLOGIA','GINECOLOGIA','OFTALMOLOGIA','OTORRINO'],datasets:[{data:[25.0,16.7,12.5,8.3,6.7,4.2,2.1,1.4],backgroundColor:['#2ca02c','#d62728','#d62728','#d62728','#d62728','#d62728','#d62728','#d62728'],borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return c.parsed.x+'%'}}}},scales:{x:{beginAtZero:true,grid:{color:'#F1F5F9'},ticks:{callback:function(v){return v+'%'}}}},plugins:[barP]}});
};

// ==================== GLOBAL: IMPRIMIR / EXCEL / ZERAR ====================
window.imprimirEtapaAtual=function(){
  var active=document.querySelector('.step-panel.active');if(!active){showToast('Nenhuma etapa ativa.');return;}
  var panels=document.querySelectorAll('.step-panel'),stepNum=-1;
  panels.forEach(function(p,i){if(p===active)stepNum=i;});
  var stepBtn=document.querySelector('.step-btn[data-step="'+stepNum+'"]');
  var stepName=stepBtn?stepBtn.textContent.trim().replace(/^\d+/,'').trim():'Etapa '+(stepNum+1);
  var content=active.cloneNode(true);
  content.querySelectorAll('.btn-row,.btn,.no-print,.tip,.step-actions,.modal-overlay').forEach(function(el){el.remove();});
  content.querySelectorAll('input,select,textarea').forEach(function(el){
    if(el.tagName==='SELECT'){
      var txt=el.options[el.selectedIndex]?el.options[el.selectedIndex].textContent:'—';
      var span=document.createElement('span');
      span.textContent=sanitizeFieldForExport(txt)||'—';
      span.style.cssText='font-weight:600';el.parentNode.replaceChild(span,el);
    }
    else if(el.type==='checkbox'){
      if(el.checked) el.setAttribute('checked','checked');
    }
    else{
      var v=el.value;
      if(v){
        var span=document.createElement('span');
        span.textContent=sanitizeFieldForExport(v)||'—';
        span.style.cssText='font-weight:600';el.parentNode.replaceChild(span,el);
      }
    }
  });
  // Sanitizar nós de texto restantes (neutraliza nomes de organizações e converte nomes próprios em iniciais)
  try{
    var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null, false);
    var tn; while(tn = walker.nextNode()){
      if(!tn.nodeValue || !tn.nodeValue.trim()) continue;
      var parent = tn.parentNode && tn.parentNode.nodeName;
      if(parent==='SCRIPT' || parent==='STYLE') continue;
      tn.nodeValue = maskNamesInText(neutralizeOrgNames(tn.nodeValue));
    }
  }catch(e){}
  var html='<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>'+stepName+' - Centro Cirúrgico</title><style>'+
    '*{margin:0;padding:0;box-sizing:border-box}'+
    'body{font-family:Arial,sans-serif;font-size:10pt;color:#1E293B;padding:20px 28px}'+
    '.hdr{background:#1A3E74;color:#fff;padding:14px 20px;border-radius:8px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}'+
    '.hdr h1{font-size:13pt;font-weight:900}.hdr p{font-size:8pt;opacity:.8;margin-top:3px}'+
    '.card{border:1px solid #E2E8F0;border-radius:8px;margin-bottom:14px;overflow:hidden}'+
    '.card-head{background:#F8FAFC;padding:10px 16px;border-bottom:1px solid #E2E8F0;font-weight:700;font-size:11pt;color:#1A3E74}'+
    '.card-body{padding:14px 16px}'+
    '.tbl{width:100%;border-collapse:collapse;font-size:9pt}.tbl th{background:#1A3E74;color:#fff;padding:6px 8px;text-align:left;font-size:8pt}.tbl td{padding:5px 8px;border-bottom:1px solid #F1F5F9}'+
    '.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px}.form-group{margin-bottom:8px}.form-group label{font-size:8pt;font-weight:700;color:#475569;display:block;margin-bottom:2px}'+
    '.explainer{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin-bottom:14px}.explainer h3{font-size:11pt;color:#1A3E74;margin-bottom:6px}.explainer p{font-size:9pt;color:#475569;line-height:1.5}'+
    '.alert{padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:9pt}.alert-blue{background:#EFF6FF;border:1px solid #BFDBFE;color:#1E40AF}.alert-amber{background:#FFFBEB;border:1px solid #FDE68A;color:#92400E}'+
    '.sec-div{margin:14px 0 10px}.sec-div h3{font-size:10pt;font-weight:800;color:#1A3E74}'+
    '.checklist-item{display:flex;align-items:center;gap:8px;padding:5px 8px;font-size:9pt}'+
    '.oms3-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.oms3-col{border:2px solid;border-radius:8px;overflow:hidden}.oms3-col-head{padding:8px 12px;color:#fff;font-weight:700;font-size:10pt}.col-green .oms3-col-head{background:#2E7D32}.col-green{border-color:#66BB6A}.col-grey .oms3-col-head{background:#455A64}.col-grey{border-color:#90A4AE}.col-blue .oms3-col-head{background:#1565C0}.col-blue{border-color:#42A5F5}.oms3-body{padding:10px 12px}.oms3-item{padding:4px 6px;font-size:8.5pt}.oms3-item.done{text-decoration:line-through;color:#999}'+
    '.cme-flow{display:flex;gap:6px;margin-bottom:14px}.cme-fs{flex:1;text-align:center;padding:8px;border:1px solid #E2E8F0;border-radius:6px}'+
    '.ind-kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:12px}.ind-kpi{border:1px solid #E2E8F0;border-radius:6px;padding:10px;text-align:center}.ind-kpi-val{font-size:18pt;font-weight:900}'+
    '.saep-check-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.saep-check-item{padding:5px 8px;font-size:8.5pt;border:1px solid #E2E8F0;border-radius:4px}'+
    '.footer-print{text-align:center;font-size:7.5pt;color:#94A3B8;margin-top:20px;border-top:1px solid #E2E8F0;padding-top:8px}'+
    '</style></head><body>'+
    '<div class="hdr"><div><h1>Simulador de Centro Cirúrgico</h1><p>'+stepName+' — Calculadoras de Enfermagem</p></div><div style="text-align:right;font-size:8.5pt"><strong>Data:</strong> '+new Date().toLocaleDateString('pt-BR')+'</div></div>'+
    content.innerHTML+
    '<div class="footer-print">Ferramenta educacional — Dados fictícios armazenados localmente (LGPD)<br>Baseado nas diretrizes SOBECC, OMS e ANVISA RDC 36/2013 | Calculadoras de Enfermagem — www.calculadorasdeenfermagem.com.br</div>'+
    '<script>window.onload=function(){window.print();}<\/script></body></html>';
  var janela=window.open('','_blank');janela.document.write(html);janela.document.close();
};

window.exportarExcelEtapaAtual=function(){
  var active=document.querySelector('.step-panel.active');if(!active){showToast('Nenhuma etapa ativa.');return;}
  var panels=document.querySelectorAll('.step-panel'),stepNum=-1;
  panels.forEach(function(p,i){if(p===active)stepNum=i;});
  var stepBtn=document.querySelector('.step-btn[data-step="'+stepNum+'"]');
  var stepName=stepBtn?stepBtn.textContent.trim().replace(/^\d+/,'').trim():'Etapa'+(stepNum+1);
  var tables=active.querySelectorAll('table.tbl,table.cme-lote-tbl,table.cme-cores-tbl');
  if(!tables.length){showToast('Não há tabelas para exportar nesta etapa.');return;}
  var csv='\uFEFF';
  tables.forEach(function(tbl,ti){
    var caption=tbl.closest('.card');
    if(caption&&caption.querySelector('.card-head h3'))csv+='\n'+caption.querySelector('.card-head h3').textContent.trim()+'\n';
    var rows=tbl.querySelectorAll('tr');
    rows.forEach(function(row){
        var cells=row.querySelectorAll('th,td');
        var rowData=[];
        cells.forEach(function(cell){
          var txt=cell.textContent.trim().replace(/\n/g,' ').replace(/"/g,'""');
          txt = sanitizeFieldForExport(txt);
          rowData.push('"'+txt+'"');
        });
      csv+=rowData.join(';')+'\n';
    });
    csv+='\n';
  });
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='centro-cirurgico-'+stepName.replace(/\s+/g,'-').toLowerCase()+'-'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();URL.revokeObjectURL(url);
  showToast('Planilha exportada.');
};

window.zerarTudo=function(){
  if(!confirm('ATENÇÃO: Isso irá apagar TODOS os dados salvos localmente (avisos, agendamentos, checklist, CME, SAEP, etc.).\n\nDeseja continuar?'))return;
  var keys=Object.keys(localStorage).filter(function(k){return k.indexOf('cc_')===0;});
  keys.forEach(function(k){localStorage.removeItem(k);});
  location.reload();
};

window.injetarBotoesAcao=function(){
  document.querySelectorAll('.step-panel').forEach(function(panel){
    if(panel.querySelector('.step-actions'))return;
    var div=document.createElement('div');
    div.className='step-actions';
    div.innerHTML='<button class="ga-btn" onclick="imprimirEtapaAtual()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>Imprimir</button>'+
      '<button class="ga-btn success" onclick="exportarExcelEtapaAtual()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8"/></svg>Exportar Excel</button>';
    panel.appendChild(div);
  });
};

// ==================== ETAPA 14: SAEP — FORMS DIGITAIS ====================
window.saepShowTab=function(id,ev){
  document.querySelectorAll('.saep-panel').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.saep-tab').forEach(function(t){t.classList.remove('active');});
  document.getElementById(id).classList.add('active');
  if(ev)ev.currentTarget.classList.add('active');
};
window.saepToggleCheck=function(el){
  el.classList.toggle('checked');
  var cb=el.querySelector('input');if(cb)cb.checked=el.classList.contains('checked');
  saepSalvarEstado();
};
window.saepSalvarEstado=function(){
  var dados={};
  document.querySelectorAll('#panel-saep .saep-check-item').forEach(function(el){
    var id=el.getAttribute('data-id');
    if(id)dados[id]=el.classList.contains('checked');
  });
  document.querySelectorAll('#panel-saep input[type="text"],#panel-saep input[type="date"],#panel-saep input[type="time"],#panel-saep textarea,#panel-saep select').forEach(function(el){
    if(el.id)dados[el.id]=el.value;
  });
  try{localStorage.setItem('cc_saep',JSON.stringify(dados));}catch(e){}
};
window.saepCarregarEstado=function(){
  try{
    var dados=JSON.parse(localStorage.getItem('cc_saep')||'{}');
    Object.keys(dados).forEach(function(key){
      var el=document.getElementById(key);
      if(el){el.value=dados[key];}
      var checkEl=document.querySelector('#panel-saep .saep-check-item[data-id="'+key+'"]');
      if(checkEl&&dados[key]){checkEl.classList.add('checked');var cb=checkEl.querySelector('input');if(cb)cb.checked=true;}
    });
  }catch(e){}
};
window.saepSalvar=function(){
  saepSalvarEstado();
  showToast('Formulário SAEP salvo localmente.');
};
window.saepLimpar=function(){
  if(!confirm('Limpar todos os campos do formulário SAEP?'))return;
  document.querySelectorAll('#panel-saep .saep-check-item').forEach(function(el){el.classList.remove('checked');var cb=el.querySelector('input');if(cb)cb.checked=false;});
  document.querySelectorAll('#panel-saep input[type="text"],#panel-saep input[type="date"],#panel-saep input[type="time"],#panel-saep textarea,#panel-saep select').forEach(function(el){el.value='';});
  localStorage.removeItem('cc_saep');
  showToast('Formulário limpo.');
};
window.saepInit=function(){
  saepCarregarEstado();
  document.querySelectorAll('#panel-saep .saep-check-item').forEach(function(el){
    el.addEventListener('click',function(){saepToggleCheck(el);});
  });
  document.querySelectorAll('#panel-saep input[type="text"],#panel-saep input[type="date"],#panel-saep input[type="time"],#panel-saep textarea,#panel-saep select').forEach(function(el){
    el.addEventListener('change',saepSalvarEstado);
    el.addEventListener('input',saepSalvarEstado);
  });
};

// Injetar botões de ação nas etapas
document.addEventListener('DOMContentLoaded',injetarBotoesAcao);

})();
