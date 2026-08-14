(function(){
"use strict";
var SK_AVISOS = "cc_avisos_v1";
var SK_STATUS = "cc_status_v1";
var currentStep = 0;

// ==================== NAVIGATION ====================
var PANEL_ORDER = ['panel-agendamento','panel-0','panel-preparo','panel-1','panel-2','panel-3','panel-cirurgia-segura','panel-4','panel-pos-cirurgico','panel-5','panel-checklist-oms','panel-rastreabilidade','panel-indicadores','panel-saep'];
window.goStep = function(n){
  var panelId = PANEL_ORDER[n] || '';
  document.querySelectorAll('.step-panel').forEach(function(p){ p.classList.toggle('active', panelId ? p.id===panelId : false); });
  document.querySelectorAll('.step-btn').forEach(function(b){ b.classList.toggle('active', parseInt(b.dataset.step)===n); });
  currentStep = n;
  if(n===4) renderMapa();
  if(n===5) renderPainel();
  if(n===7) renderStatusSalas();
  if(n===9) renderRelatorios();
  if(n===0) renderAgendamentos();
  if(n===1) carregarSelectAvPacientes();
  if(n===2){ carregarSelectsPreparo(); renderPreBateMapa(); }
  if(n===3){ carregarSelectBatePacientes(); renderChecklistBate(); }
  if(n===6) carregarSelectsOms();
  if(n===8) carregarSelectsPos();
  if(n===10) initOmsChecklist();
  if(n===11) cmeInit();
  if(n===12) initIndicadores();
  if(n===13) saepInit();
  window.scrollTo({top:0,behavior:'smooth'});
};

// ==================== CATÁLOGO DE PROCEDIMENTOS CIRÚRGICOS ====================
var PROCEDIMENTOS = [
  {g:'Pequeno porte — Cirurgia Geral', itens:['Apendicectomia','Colecistectomia','Herniorrafia inguinal','Herniorrafia umbilical','Herniorrafia epigástrica','Herniorrafia incisional','Hemorroidectomia','Fissurectomia anal','Drenagem de abscesso','Exérese de cisto','Exérese de lipoma','Biópsia de pele','Biópsia de tecido subcutâneo','Laparotomia exploradora','Tratamento cirúrgico de ferimentos']},
  {g:'Pequeno porte — Proctologia', itens:['Hemorroidectomia','Fistulotomia anal','Fissurectomia','Drenagem de abscesso perianal','Exérese de lesões anais']},
  {g:'Pequeno porte — Ginecologia', itens:['Curetagem uterina','Histeroscopia diagnóstica','Histeroscopia cirúrgica simples','Laqueadura tubária','Conização do colo uterino','Exérese de cistos vulvares','Drenagem de abscesso de glândula de Bartholin']},
  {g:'Pequeno porte — Obstetrícia', itens:['Parto cesáreo','Curetagem pós-abortamento','Tratamento cirúrgico de complicações obstétricas selecionadas']},
  {g:'Pequeno porte — Urologia', itens:['Postectomia','Vasectomia','Orquiectomia simples','Circuncisão','Tratamento cirúrgico de hidrocele','Tratamento cirúrgico de varicocele','Cistoscopia','Procedimentos urológicos endoscópicos simples']},
  {g:'Pequeno porte — Ortopedia', itens:['Tratamento cirúrgico de fraturas simples','Osteossíntese de fraturas selecionadas','Redução e fixação de fraturas','Tratamento cirúrgico de luxações','Drenagem de infecção osteoarticular selecionada','Retirada de material de síntese','Tenorrafia','Sutura de tendão']},
  {g:'Pequeno porte — Otorrinolaringologia', itens:['Amigdalectomia','Adenoidectomia','Amigdalectomia + adenoidectomia','Septoplastia','Turbinectomia','Drenagem de abscesso peritonsilar','Timpanoplastia em casos selecionados']},
  {g:'Pequeno porte — Oftalmologia', itens:['Cirurgia de catarata','Pterígio','Calázio','Biópsias oculares selecionadas','Procedimentos palpebrais simples']},
  {g:'Pequeno porte — Cirurgia Vascular', itens:['Tratamento cirúrgico de varizes','Flebectomia','Ligadura de veias','Tratamento de pequenas lesões vasculares']},
  {g:'Pequeno porte — Cirurgia Plástica', itens:['Exérese de lesões cutâneas','Reconstrução de pequenas lesões','Enxerto de pele em casos selecionados','Tratamento cirúrgico de cicatrizes']},
  {g:'Pequeno porte — Dermatologia cirúrgica', itens:['Exérese de nevos','Exérese de cistos','Exérese de lipomas','Biópsia de pele','Tratamento cirúrgico de lesões benignas']},
  {g:'Médio porte — Cirurgia Geral', itens:['Apendicectomia laparoscópica','Colecistectomia laparoscópica','Hernioplastia laparoscópica','Laparotomia exploradora','Ressecções intestinais','Enterectomia','Colectomia segmentar','Tratamento cirúrgico de obstrução intestinal','Tratamento de perfuração intestinal','Gastrostomia','Jejunostomia','Esplenectomia','Drenagem de coleções intra-abdominais']},
  {g:'Médio porte — Coloproctologia', itens:['Hemorroidectomia','Fistulotomia','Fistulectomia','Esfincterotomia','Colectomia','Ressecção de tumores colorretais selecionados','Tratamento cirúrgico de doença diverticular','Cirurgia para doença inflamatória intestinal selecionada']},
  {g:'Médio porte — Ginecologia', itens:['Histerectomia abdominal','Histerectomia vaginal','Histerectomia laparoscópica','Miomectomia','Ooforectomia','Salpingectomia','Cistectomia ovariana','Endometriose cirúrgica','Histeroscopia cirúrgica','Tratamento cirúrgico de prolapsos']},
  {g:'Médio porte — Obstetrícia', itens:['Cesárea','Cesárea de emergência','Cesárea com procedimentos associados','Tratamento cirúrgico de hemorragias obstétricas','Histerectomia obstétrica em casos selecionados']},
  {g:'Médio porte — Ortopedia e Traumatologia', itens:['Osteossíntese de fraturas complexas','Fixação interna de fraturas','Fixação externa','Artroscopia de joelho','Artroscopia de ombro','Reconstrução de ligamentos','Meniscectomia','Sutura meniscal','Tratamento de lesões tendíneas','Artroplastia selecionada','Cirurgia de mão','Cirurgia de pé e tornozelo']},
  {g:'Médio porte — Urologia', itens:['Ressecção transuretral de próstata (RTU)','Ressecção transuretral de tumores vesicais','Ureteroscopia','Litotripsia','Nefrolitotomia em casos selecionados','Nefrectomia','Prostatectomia','Cirurgia de estenose uretral','Tratamento cirúrgico de cálculos urinários']},
  {g:'Médio porte — Otorrinolaringologia', itens:['Septoplastia','Rinoplastia funcional','Turbinectomia','Cirurgia endoscópica nasal','Sinusectomia endoscópica','Amigdalectomia','Adenoidectomia','Timpanoplastia','Mastoidectomia em casos selecionados']},
  {g:'Médio porte — Oftalmologia', itens:['Facectomia com implante de lente intraocular','Cirurgia de catarata','Cirurgia de glaucoma','Vitrectomia em centros habilitados','Cirurgias de retina selecionadas','Cirurgia de pterígio','Cirurgias palpebrais']},
  {g:'Médio porte — Vascular', itens:['Cirurgia de varizes','Safenectomia','Flebectomia','Trombectomia em casos selecionados','Tratamento cirúrgico de doença arterial periférica','Confecção de acesso vascular para hemodiálise']},
  {g:'Médio porte — Neurocirurgia', itens:['Drenagem de hematoma intracraniano','Craniotomia selecionada','Derivação ventricular','Tratamento cirúrgico de hidrocefalia','Cirurgia de coluna selecionada']},
  {g:'Grande porte — Cirurgia Cardíaca', itens:['Revascularização do miocárdio','Troca de válvula cardíaca','Plastia valvar','Cirurgia da aorta','Correção de aneurisma de aorta','Cirurgias cardíacas congênitas','Correção de defeitos cardíacos','Implante cirúrgico de dispositivos cardíacos selecionados']},
  {g:'Grande porte — Cirurgia Vascular', itens:['Cirurgia de aneurisma de aorta','Endarterectomia de carótida','Revascularização arterial','Bypass arterial','Cirurgia de doença arterial periférica complexa','Tratamento de isquemia crítica','Cirurgia vascular de emergência']},
  {g:'Grande porte — Neurocirurgia', itens:['Craniotomia','Ressecção de tumores cerebrais','Cirurgia de aneurisma cerebral','Cirurgia de malformações vasculares','Derivação ventricular','Cirurgia de hidrocefalia','Cirurgia complexa da coluna','Artrodese de coluna','Descompressão medular','Tratamento cirúrgico de traumatismos cranianos complexos']},
  {g:'Grande porte — Cirurgia Oncológica', itens:['Gastrectomia oncológica','Colectomia oncológica','Retossigmoidectomia','Esofagectomia','Pancreatectomia','Duodenopancreatectomia','Hepatectomia','Nefrectomia oncológica','Cistectomia radical','Prostatectomia radical','Mastectomia','Cirurgia conservadora da mama','Esvaziamento linfonodal','Ressecção de tumores de cabeça e pescoço']},
  {g:'Grande porte — Hepatobiliopancreática', itens:['Hepatectomia','Segmentectomia hepática','Ressecção de tumores hepáticos','Pancreatectomia distal','Duodenopancreatectomia','Cirurgia das vias biliares','Reconstruções biliares','Transplante hepático']},
  {g:'Grande porte — Cirurgia Torácica', itens:['Lobectomia pulmonar','Pneumonectomia','Segmentectomia pulmonar','Ressecção de tumores pulmonares','Decorticação pulmonar','Pleurectomia','Mediastinoscopia','Cirurgia de tumores mediastinais','Cirurgia toracoscópica']},
  {g:'Grande porte — Aparelho Digestivo', itens:['Esofagectomia','Gastrectomia','Colectomia','Retossigmoidectomia','Amputação abdominoperineal','Cirurgias complexas de intestino delgado','Cirurgia bariátrica','Cirurgia de refluxo gastroesofágico','Cirurgia de hérnias complexas']},
  {g:'Grande porte — Transplantes', itens:['Transplante renal','Transplante hepático','Transplante cardíaco','Transplante pulmonar','Transplante de pâncreas','Transplantes combinados em centros especializados']},
  {g:'Grande porte — Cirurgia Pediátrica', itens:['Correção de hérnias','Apendicectomia','Correção de malformações congênitas','Cirurgia neonatal','Atresia intestinal','Gastrosquise','Onfalocele','Atresia de esôfago','Estenose hipertrófica do piloro','Correção de malformações urológicas','Cirurgias pediátricas oncológicas']},
  {g:'Grande porte — Cirurgia Plástica Reconstrutiva', itens:['Reconstrução mamária','Enxertos de pele','Retalhos cutâneos','Retalhos musculares','Retalhos microcirúrgicos','Reconstrução de membros','Reconstrução após grandes traumas','Tratamento cirúrgico de queimaduras extensas']},
  {g:'Grande porte — Queimados', itens:['Desbridamento cirúrgico','Escarectomia','Enxertia de pele','Reconstrução de áreas queimadas','Tratamento cirúrgico de sequelas de queimaduras']},
  {g:'Grande porte — Bucomaxilofacial', itens:['Tratamento de fraturas faciais','Fixação de fraturas mandibulares','Fixação de fraturas maxilares','Cirurgia ortognática','Ressecção de tumores maxilofaciais','Reconstrução facial','Tratamento de deformidades craniofaciais']}
];

window.carregarSelectProcedimentos = function(){
  var html = '<option value="">Selecione o procedimento...</option>';
  PROCEDIMENTOS.forEach(function(gr){
    html += '<optgroup label="'+esc(gr.g.toUpperCase())+'">' + gr.itens.map(function(i){ var up = i.toUpperCase(); return '<option value="'+esc(up)+'">'+esc(up)+'</option>'; }).join('') + '</optgroup>';
  });
  html += '<optgroup label="OUTROS"><option value="__outro__">OUTROS (DIGITAR O NOME DA CIRURGIA)</option></optgroup>';
  ['agd-procedimento','av-procedimento'].forEach(function(id){
    var el = document.getElementById(id);
    if(el){ el.innerHTML = html; }
  });
};

window.procedimentoChange = function(sel){
  var outro = document.getElementById(sel.id + '-outro');
  if(outro) outro.style.display = sel.value === '__outro__' ? 'block' : 'none';
};

window.obterProcedimento = function(selId){
  var sel = document.getElementById(selId);
  if(!sel) return '';
  if(sel.value === '__outro__'){
    var outro = document.getElementById(selId + '-outro');
    return outro ? outro.value.trim() : '';
  }
  return sel.value;
};

// ==================== ESPECIALIDADES CIRÚRGICAS ====================
var ESPECIALIDADES = ['Ortopedia','Cirurgia Geral','Vascular','Obstetrícia','Urologia','Neurocirurgia','Oftalmologia','Dermatologia','Cirurgia Plástica','Cabeça e Pescoço','Ginecologia','Otorrino','Cirurgia Pediátrica','Cardíaca','Cirurgia de Tórax'];

window.carregarSelectEspecialidades = function(){
  var html = '<option value="">Selecione a especialidade...</option>' + ESPECIALIDADES.map(function(e){ var up = e.toUpperCase(); return '<option value="'+esc(up)+'">'+esc(up)+'</option>'; }).join('') + '<option value="__outro__">OUTROS (DIGITAR A ESPECIALIDADE)</option>';
  ['agd-especialidade','av-especialidade'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.innerHTML = html;
  });
};

window.especialidadeChange = function(sel){
  var outro = document.getElementById(sel.id + '-outro');
  if(outro) outro.style.display = sel.value === '__outro__' ? 'block' : 'none';
};

window.obterEspecialidade = function(selId){
  var sel = document.getElementById(selId);
  if(!sel) return '';
  if(sel.value === '__outro__'){
    var outro = document.getElementById(selId + '-outro');
    return outro ? outro.value.trim() : '';
  }
  return sel.value;
};

// ==================== HELPERS: NOME PACIENTE (iniciais) ====================
function toInitials(raw){
  if(raw===null||raw===undefined) return '';
  var s=String(raw).trim();
  if(!s) return '';
  if(/^[A-ZÀ-Ý\.\s]{1,20}$/.test(s.replace(/\s+/g,''))) return s.toUpperCase();
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
  var s=String(raw).trim();
  if(!s) return '';
  var m = s.match(/^(Dr\.?a?|Enf\.?a?|Inst\.?|Tec\.?)\s+(.+)$/i);
  if(m){
    var iniciais = toInitials(m[2]);
    return (m[1].replace(/\./g,'') + (iniciais ? ' ' + iniciais : ''));
  }
  return toInitials(s);
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

// Expor aliases e funções utilitárias para código inline/outsider
try{
  window.sanitizeForExport = sanitizeFieldForExport;
  window.sanitizeFieldForExport = sanitizeFieldForExport;
  window.neutralizeOrgNames = neutralizeOrgNames;
  window.maskNamesInText = maskNamesInText;
  window.sanitizeResponsavelField = sanitizeResponsavelField;
  window.sanitizePacienteNome = sanitizePacienteNome;
}catch(e){}

// Renderizador de convênio/hospital neutro para exibição no HTML.
// Produz rótulos padronizados (SUS, Particular, Convênio) com tooltip didático.
try{
  window.renderConvenioLabel = function(text){
    try{
      var s = String(text||'').trim(); if(!s) return '—';
      var low = s.toLowerCase();
      if(low === 'sus') return '<span title="Sistema Único de Saúde (SUS)">SUS</span>';
      if(low === 'particular') return '<span title="Paciente Particular (pagamento direto)">Particular</span>';
      // heurística: provedores conhecidos -> Convênio
      var providers = ['bradesco','sul américa','sulamerica','allianz','unimed','amil','porto seguro','sompo','bradesco saúde','seguro','saude','saúde'];
      for(var i=0;i<providers.length;i++){ if(low.indexOf(providers[i])!==-1) return '<span title="Convênio de saúde (nome ocultado)">Convênio</span>'; }
      if(low.indexOf('hospital')!==-1) return '<span title="Instituição de saúde (nome ocultado)">Hospital</span>';
      return '<span title="Convênio / Instituição (nome ocultado)">Convênio</span>';
    }catch(e){ return 'Convênio'; }
  };

  window.neutralizeConvenioText = function(text){
    try{
      var s = String(text||'').trim().toLowerCase(); if(!s) return '—';
      if(s === 'sus') return 'SUS';
      if(s === 'particular') return 'Particular';
      return 'Convênio';
    }catch(e){ return 'Convênio'; }
  };
}catch(e){}

// ==================== FULL-DISPLAY LOGIC (nomes/convênio completos) ====================
// Exibe nomes/convênios completos apenas quando a cirurgia estiver documentada
// em todas as etapas principais (agendamento -> preparo -> OMS -> pós).
function findAgendamentoIndexByAviso(aviso){
  try{
    if(!aviso) return -1;
    var ags = JSON.parse(localStorage.getItem('cc_agendamentos')||'[]');
    for(var i=0;i<ags.length;i++){
      var a = ags[i]||{};
      if((a.procedimento||'').trim() && (aviso.procedimento||'').trim() && a.procedimento.trim()===aviso.procedimento.trim()){
        // prefer strict date+hora match when available
        if(a.data && aviso.data && a.hora && aviso.hora){ if(a.data===aviso.data && a.hora===aviso.hora) return i; }
        // fallback: match by procedimento+data
        if(a.data && aviso.data && a.data===aviso.data) return i;
      }
      // fallback: match by prontuario when present
      if(a.prontuario && aviso.prontuario && String(a.prontuario)===String(aviso.prontuario)) return i;
    }
    return -1;
  }catch(e){ return -1; }
}

function isFullyDocumentedForAgendamentoIndex(idx){
  try{
    if(idx===null||idx===undefined||idx<0) return false;
    var preps = JSON.parse(localStorage.getItem('cc_preparos')||'[]');
    var oms = JSON.parse(localStorage.getItem('cc_oms')||'[]');
    var pos = JSON.parse(localStorage.getItem('cc_pos')||'[]');
    var prepOK = preps.some(function(p){ return String(p.cirurgiaIdx) === String(idx); });
    var omsOK = oms.some(function(o){ return String(o.cirurgiaIdx) === String(idx); });
    var posOK = pos.some(function(p){ return String(p.cirurgiaIdx) === String(idx); });
    return !!(prepOK && omsOK && posOK);
  }catch(e){ return false; }
}

function isFullyDocumentedForAviso(aviso){
  try{
    if(!aviso) return false;
    if(!aviso.nome || !aviso.convenio) return false;
    var idx = findAgendamentoIndexByAviso(aviso);
    if(idx===-1) return false;
    return isFullyDocumentedForAgendamentoIndex(idx);
  }catch(e){ return false; }
}

// Helpers para exibição (usar onde apropriado)
function displayPacienteName(aviso){
  try{
    var ehExemplo = !!(aviso && (aviso.isExemplo || (aviso.id>=1000 && aviso.id<2000)));
    return (aviso && !ehExemplo && aviso.nome) ? aviso.nome : sanitizePacienteNome(aviso?aviso.nome:'');
  }catch(e){ return sanitizePacienteNome(aviso?aviso.nome:''); }
}
function displayConvenio(aviso){
  try{ if(isFullyDocumentedForAviso(aviso) && aviso && aviso.convenio) return '<span title="'+(aviso.convenio||'')+'">'+(aviso.convenio||'')+'</span>'; return (typeof renderConvenioLabel === 'function') ? renderConvenioLabel(aviso.convenio||'—') : (aviso.convenio||'—'); }catch(e){ return (typeof renderConvenioLabel === 'function') ? renderConvenioLabel(aviso.convenio||'—') : (aviso.convenio||'—'); }
}
try{ window.isFullyDocumentedForAviso = isFullyDocumentedForAviso; window.displayPacienteName = displayPacienteName; window.displayConvenio = displayConvenio; }catch(e){}

// Auditoria / Logs locais (gravados em localStorage 'cc_logs')
function logEventLocal(action, details){
  try{
    var arr = JSON.parse(localStorage.getItem('cc_logs') || '[]');
    var entry = { id: Date.now(), ts: new Date().toISOString(), action: action, details: details || {} };
    arr.unshift(entry);
    // manter apenas últimas 200 entradas para evitar uso excessivo de storage
    if(arr.length>200) arr = arr.slice(0,200);
    localStorage.setItem('cc_logs', JSON.stringify(arr));
  }catch(e){}
}
window.logEvent = logEventLocal;
window.getLogs = function(){ try{ return JSON.parse(localStorage.getItem('cc_logs')||'[]'); }catch(e){ return []; } };
window.exportLogs = function(){ try{ var logs = window.getLogs(); if(!logs.length){ if(window.showToast) showToast('Nenhum log para exportar.'); return; } var csv='"ts","action","details"\n'; logs.forEach(function(l){ csv += '"'+(l.ts||'')+'","'+(l.action||'')+'","'+JSON.stringify(l.details||{}).replace(/"/g,'""')+'"\n'; }); var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='cc_logs_'+(new Date().toISOString().slice(0,10))+'.csv'; a.click(); URL.revokeObjectURL(a.href); if(window.showToast) showToast('Logs exportados.'); }catch(e){ if(window.showToast) showToast('Erro ao exportar logs.'); } };

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
  if(convenio && convenio !== 'SUS' && convenio !== 'Particular') alerts.push('Verificar prazo de autorização do convênio.');
  if(alerts.length > 0){ alertList.innerHTML = alerts.map(function(a){ return '<li>' + a + '</li>'; }).join(''); alertBox.style.display = 'block'; } else { alertBox.style.display = 'none'; }
};

window.salvarAgendamento = function(){
  try{
    var origemEl = document.getElementById('agd-origem');
    var convenioEl = document.getElementById('agd-convenio');
    var origem = origemEl ? origemEl.value : '';
    var convenio = convenioEl ? convenioEl.value : '';
    if(!origem || !convenio){ showToast('Preencha origem e convênio.'); return; }
    var agdNomeEl = document.getElementById('agd-nome');
    var procedimentoEl = document.getElementById('agd-procedimento');
    var codsusEl = document.getElementById('agd-codsus');
    var medicoEl = document.getElementById('agd-medico');
    var crmEl = document.getElementById('agd-crm');
    var dataEl = document.getElementById('agd-data');
    var horaEl = document.getElementById('agd-hora');
    var hospitalEl = document.getElementById('agd-hospital');
    var leitoEl = document.getElementById('agd-leito');
    var motivoEl = document.getElementById('agd-motivo');
    var motivoBox = document.getElementById('agd-motivo-rejeicao');

    var nomeRaw = agdNomeEl ? agdNomeEl.value.trim() : '';
    var nomeSan = nomeRaw.toUpperCase();
    var dnEl = document.getElementById('agd-dn');
    var dn = dnEl ? dnEl.value : '';
    var proc = (typeof obterProcedimento==='function') ? obterProcedimento('agd-procedimento') : (procedimentoEl?procedimentoEl.value:'');

    var data = {
      origem: origem,
      nome: nomeSan,
      dn: dn,
      idade: calcIdade(dn),
      convenio: convenio,
      especialidade: (typeof obterEspecialidade==='function') ? obterEspecialidade('agd-especialidade') : '',
      procedimento: proc,
      codsus: (codsusEl?codsusEl.value:''),
      medico: (medicoEl?medicoEl.value:''),
      crm: (crmEl?crmEl.value:''),
      data: (dataEl?dataEl.value:''),
      hora: (horaEl?horaEl.value:''),
      hospital: (hospitalEl?hospitalEl.value:''),
      leito: (leitoEl?leitoEl.value:''),
      status: 'autorizada',
      motivo: ''
    };
    if(motivoBox && motivoBox.style.display === 'block'){ data.status = (motivoEl && motivoEl.value) ? 'rejeitada' : 'perdida'; data.motivo = motivoEl ? motivoEl.value : ''; }

    var arr = JSON.parse(localStorage.getItem('cc_agendamentos') || '[]'); arr.push(data); localStorage.setItem('cc_agendamentos', JSON.stringify(arr)); renderAgendamentos(); limparAgendamento();
    try{ logEventLocal('agendamento_saved', { origem: data.origem, nome: data.nome, convenio: (typeof neutralizeConvenioText==='function'?neutralizeConvenioText(data.convenio):(data.convenio||'')), procedimento: (typeof sanitizeFieldForExport==='function'?sanitizeFieldForExport(data.procedimento):data.procedimento), dataCirurgia: data.data, hora: data.hora, medico: (typeof sanitizeResponsavelField==='function'?sanitizeResponsavelField(data.medico):data.medico) }); }catch(e){}
    showToast('Agendamento salvo com sucesso.');
  }catch(e){ showToast('Erro ao salvar agendamento.'); }
};

window.limparAgendamento = function(){
  ['agd-origem','agd-convenio','agd-nome','agd-dn','agd-procedimento','agd-procedimento-outro','agd-especialidade','agd-especialidade-outro','agd-codsus','agd-medico','agd-crm','agd-data','agd-hora','agd-hospital','agd-leito','agd-motivo'].forEach(function(id){ var el = document.getElementById(id); if(el) el.value = ''; });
  var pOut = document.getElementById('agd-procedimento-outro'); if(pOut) pOut.style.display = 'none';
  var eOut = document.getElementById('agd-especialidade-outro'); if(eOut) eOut.style.display = 'none';
  var motivoRej = document.getElementById('agd-motivo-rejeicao'); if(motivoRej) motivoRej.style.display = 'none';
  var alertBox = document.getElementById('agd-alertas-box'); if(alertBox) alertBox.style.display = 'none';
};

window.limparAgendamentos = function(){ if(confirm('Apagar todos os agendamentos?')){ localStorage.removeItem('cc_agendamentos'); renderAgendamentos(); } };

window.renderAgendamentos = function(){
  var tb = document.getElementById('body-agendamentos');
  if(!tb) return;
  try { var arr = JSON.parse(localStorage.getItem('cc_agendamentos') || '[]');
    if(arr.length === 0){ tb.innerHTML = '<tr><td colspan="11" style="text-align:center;color:var(--slate-400);padding:20px">Nenhum agendamento salvo.</td></tr>'; return; }
    tb.innerHTML = arr.map(function(a){
      var cor = a.status === 'autorizada' ? 'var(--green)' : 'var(--red)';
      var convenioDisplay = (typeof renderConvenioLabel === 'function') ? renderConvenioLabel(a.convenio||'—') : (a.convenio||'—');
      var procedimentoDisplay = (typeof sanitizeFieldForExport === 'function') ? sanitizeFieldForExport(a.procedimento||'—') : (a.procedimento||'—');
      var pacienteDisplay = a.nome ? esc(a.nome) : '—';
      var medicoDisplay = a.medico ? esc(a.medico) : '—';
      return '<tr><td>' + (a.origem||'—') + '</td><td>' + pacienteDisplay + '</td><td>' + esc(a.idade||'—') + '</td><td>' + esc(a.dn||'—') + '</td><td>' + convenioDisplay + '</td><td>' + esc(a.especialidade||'—') + '</td><td>' + (procedimentoDisplay||'—') + '</td><td>' + medicoDisplay + '</td><td>' + (a.data||'—') + '</td><td>' + (a.hora||'—') + '</td><td style="color:' + cor + ';font-weight:700">' + a.status + '</td></tr>';
    }).join('');
  } catch(e){}
};

// ==================== ETAPA 4: PREPARO DE MATERIAIS ====================
window.toggleOpme = function(){ document.getElementById('prep-opme-tipo-group').style.display = document.getElementById('prep-opme').value === 'sim' ? 'block' : 'none'; };
window.toggleConsignacao = function(){ document.getElementById('prep-nfe-group').style.display = document.getElementById('prep-consignado').value === 'sim' ? 'block' : 'none'; };
window.toggleChecklist = function(el){ el.classList.toggle('done'); };

window.carregarSelectsPreparo = function(){
  var sel = document.getElementById('prep-cirurgia');
  if(sel){
    try { var arr = JSON.parse(localStorage.getItem('cc_agendamentos') || '[]'); var autorizadas = arr.filter(function(a){ return a.status === 'autorizada'; });
      sel.innerHTML = '<option value="">Selecione um agendamento...</option>' + autorizadas.map(function(a, i){
        var medicoText = (typeof sanitizeResponsavelField === 'function') ? sanitizeResponsavelField(a.medico||'') : (a.medico||'');
        var procText = (typeof sanitizeFieldForExport === 'function') ? sanitizeFieldForExport(a.procedimento||'Cirurgia') : (a.procedimento||'Cirurgia');
        return '<option value="' + i + '">' + procText + ' — ' + (a.data||'') + ' ' + medicoText + '</option>';
      }).join('');
    } catch(e){}
  }
  var selPac = document.getElementById('prep-paciente');
  if(selPac){
    try{
      var avisos = getAvisos();
      selPac.innerHTML = '<option value="">Selecione o paciente...</option>' + avisos.map(function(a, i){
        var nome = (typeof displayPacienteName==='function')?displayPacienteName(a):sanitizePacienteNome(a.nome||'');
        return '<option value="' + a.id + '">#' + (i+1) + ' — ' + esc(nome) + '</option>';
      }).join('');
      try{ prepPacienteChange(); }catch(e){}
    }catch(e){}
  }
};

window.prepPacienteChange = function(){
  var sel = document.getElementById('prep-paciente');
  if(!sel) return;
  var a = getAvisos().find(function(x){ return String(x.id)===String(sel.value); });
  if(!a) return;
  var opmeEl = document.getElementById('prep-opme');
  var consEl = document.getElementById('prep-consignado');
  var fornEl = document.getElementById('prep-fornecedor');
  if(opmeEl && (a.opme==='sim'||a.opme==='nao')) opmeEl.value = a.opme;
  if(consEl && (a.consignado==='sim'||a.consignado==='nao')) consEl.value = a.consignado;
  if(fornEl) fornEl.value = a.fornecedor || '';
  try{ toggleOpme(); toggleConsignacao(); }catch(e){}
};

window.renderPreBateMapa = function(){
  var tb = document.getElementById('body-pre-bate');
  if(!tb) return;
  var avisos = getAvisos();
  if(!avisos.length){
    tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--slate-400);padding:20px">Nenhum aviso registrado na lista de avisos.</td></tr>';
    return;
  }
  tb.innerHTML = avisos.map(function(a){
    var nome = (typeof displayPacienteName==='function')?displayPacienteName(a):sanitizePacienteNome(a.nome||'');
    var opme = a.opme==='sim'?'<span class="badge badge-green">Sim</span>':(a.opme==='nao'?'Não':'—');
    var cons = a.consignado==='sim'?'<span class="badge badge-blue">Sim</span>':(a.consignado==='nao'?'Não':'—');
    return '<tr>' +
      '<td><strong style="color:var(--navy)">'+esc(nome)+'</strong></td>' +
      '<td>'+esc(a.idade||'—')+'</td>' +
      '<td style="font-size:12px">'+esc(a.dn||'—')+'</td>' +
      '<td>'+esc(a.especialidade||'—')+'</td>' +
      '<td style="font-size:12px">'+esc(a.procedimento||'—')+'</td>' +
      '<td class="center">'+opme+'</td>' +
      '<td class="center">'+cons+'</td>' +
      '<td>'+esc(a.fornecedor||'—')+'</td>' +
    '</tr>';
  }).join('');
};

window.salvarPreparo = function(){
  var cirurgiaEl = document.getElementById('prep-cirurgia');
  var kitEl = document.getElementById('prep-kit');
  var pacSel = document.getElementById('prep-paciente');
  var cirurgia = cirurgiaEl ? cirurgiaEl.value : '';
  var kit = kitEl ? kitEl.value : '';
  if(!cirurgia && !(pacSel && pacSel.value)){ showToast('Selecione a cirurgia vinculada ou o paciente.'); return; }
  var opmeEl = document.getElementById('prep-opme');
  var consEl = document.getElementById('prep-consignado');
  var fornEl = document.getElementById('prep-fornecedor');
  var opme = opmeEl ? opmeEl.value : '';
  var consignado = consEl ? consEl.value : '';
  var fornecedor = fornEl ? fornEl.value.trim() : '';
  var checks = document.querySelectorAll('#prep-checklist .checklist-item.done').length; var total = document.querySelectorAll('#prep-checklist .checklist-item').length;
  var prep = { cirurgiaIdx: cirurgia, kit: kit, opme: opme, opmeTipo: document.getElementById('prep-opme-tipo').value, consignado: consignado, nfe: document.getElementById('prep-nfe').value, fornecedor: fornecedor, checklist: checks + '/' + total, data: new Date().toLocaleDateString('pt-BR') };
  if(pacSel && pacSel.value){
    var avisos = getAvisos();
    var a = avisos.find(function(x){ return String(x.id)===String(pacSel.value); });
    if(a){
      a.opme = opme; a.consignado = consignado; a.fornecedor = fornecedor;
      setAvisos(avisos);
      renderPreBateMapa();
      try{ carregarAvisos(); }catch(e){}
      try{ logEventLocal('prep_opme_saved',{id:a.id, opme:opme, consignado:consignado, fornecedor:fornecedor}); }catch(e){}
    }
  }
  try {
    var arr = JSON.parse(localStorage.getItem('cc_preparos') || '[]'); arr.push(prep); localStorage.setItem('cc_preparos', JSON.stringify(arr));
    try{ logEventLocal('preparo_saved', { cirurgiaIdx: prep.cirurgiaIdx, kit: prep.kit, checklist: prep.checklist }); }catch(e){}
    showToast('Preparo salvo. Checklist: ' + checks + '/' + total + ' itens conferidos.');
  } catch(e){ showToast('Erro ao salvar preparo.'); }
  try{ renderPreBateMapa(); }catch(e){}
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
  try {
    var arr = JSON.parse(localStorage.getItem('cc_oms') || '[]'); arr.push(oms); localStorage.setItem('cc_oms', JSON.stringify(arr));
    try{ logEventLocal('oms_saved', { cirurgiaIdx: oms.cirurgiaIdx, itensConferidos: oms.itensConferidos }); }catch(e){}
    showToast('Checklist OMS salvo: ' + done.length + '/' + allChecks.length + ' itens conferidos.');
  } catch(e){ showToast('Erro ao salvar checklist.'); }
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
  try {
    var arr = JSON.parse(localStorage.getItem('cc_pos') || '[]'); arr.push(pos); localStorage.setItem('cc_pos', JSON.stringify(arr));
    try{ logEventLocal('pos_save', { cirurgiaIdx: pos.cirurgiaIdx, destino: pos.destino, altaChecklist: pos.altaChecklist }); }catch(e){}
    showToast('Relatório pós-cirúrgico salvo. Alta checklist: ' + checks + '/' + total + '.');
  } catch(e){ showToast('Erro ao salvar relatório.'); }
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
function esc(s){ try{ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }catch(e){ return ''; } }

function calcIdade(dn){
  try{
    if(!dn) return '';
    var parts = String(dn).split('-');
    if(parts.length!==3) return '';
    var d = new Date(+parts[0], +parts[1]-1, +parts[2]);
    var hoje = new Date();
    var idade = hoje.getFullYear() - d.getFullYear();
    var m = hoje.getMonth() - d.getMonth();
    if(m<0 || (m===0 && hoje.getDate() < d.getDate())) idade--;
    return (idade>0 ? idade : 0) + ' anos';
  }catch(e){ return ''; }
}

// Profissionais: completos para cadastros do usuário, apenas iniciais para exemplos
function displayProfissional(aviso, val){
  try{
    var v = val || '';
    var ehExemplo = !!(aviso && (aviso.isExemplo || (aviso.id>=1000 && aviso.id<2000)));
    if(!ehExemplo && v) return v;
    return (typeof sanitizeResponsavelField==='function') ? sanitizeResponsavelField(v) : v;
  }catch(e){ return val || ''; }
}

function getAvisos(){
  try{
    var raw = JSON.parse(localStorage.getItem(SK_AVISOS)||"[]");
    if(!Array.isArray(raw)) raw = [];
    return raw;
  }catch(e){ return []; }
}
function setAvisos(a){ try{ localStorage.setItem(SK_AVISOS, JSON.stringify(a)); }catch(e){} }

window.salvarAviso = function(){
  var nomeEl = document.getElementById('av-nome');
  var procEl = document.getElementById('av-procedimento');
  var cirEl = document.getElementById('av-cirurgiao');
  if(!nomeEl || !procEl || !cirEl) return;
  var nome = nomeEl.value.trim();
  var proc = (typeof obterProcedimento==='function') ? obterProcedimento('av-procedimento') : procEl.value.trim();
  var cirurgiao = cirEl.value.trim();
  if(!nome || !proc || !cirurgiao){
    showToast('Preencha Nome do Usuário, Procedimento e Cirurgião para salvar.','warning'); return;
  }
  var dnEl = document.getElementById('av-dn');
  var dn = dnEl ? dnEl.value : '';
  var avisos = getAvisos();
  var aviso = {
    id: Date.now(),
    isExemplo: false,
    nome: nome,
    dn: dn,
    idade: calcIdade(dn),
    sexo: document.getElementById('av-sexo').value,
    especialidade: (typeof obterEspecialidade==='function') ? obterEspecialidade('av-especialidade') : '',
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
  ['av-nome','av-dn','av-prontuario','av-leito','av-peso','av-procedimento','av-procedimento-outro','av-especialidade','av-especialidade-outro','av-tuss','av-cirurgiao','av-aux1','av-anestesista','av-enfermeiro','av-instrumentador','av-obs'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.value='';
  });
  var aOut = document.getElementById('av-procedimento-outro'); if(aOut) aOut.style.display = 'none';
  var eOut = document.getElementById('av-especialidade-outro'); if(eOut) eOut.style.display = 'none';
};

// Paciente do Agendamento: reaproveita dados da etapa anterior no Aviso de Cirurgia
window.carregarSelectAvPacientes = function(){
  var sel = document.getElementById('av-paciente');
  if(!sel) return;
  try{
    var arr = JSON.parse(localStorage.getItem('cc_agendamentos')||'[]');
    sel.innerHTML = '<option value="">Selecione o paciente...</option>' + arr.map(function(a,i){
      return '<option value="'+i+'">#'+(i+1)+' — '+esc(a.nome||'')+'</option>';
    }).join('');
  }catch(e){}
};

window.avPacienteChange = function(){
  var sel = document.getElementById('av-paciente');
  if(!sel || sel.value === '' || sel.value === null) return;
  try{
    var arr = JSON.parse(localStorage.getItem('cc_agendamentos')||'[]');
    var a = arr[Number(sel.value)];
    if(!a) return;
    var set = function(id,v){ var el=document.getElementById(id); if(el) el.value = v||''; };
    set('av-nome', a.nome||'');
    set('av-dn', a.dn||'');
    set('av-convenio', a.convenio||'');
    set('av-data', a.data||'');
    set('av-hora', a.hora||'');
    set('av-cirurgiao', a.medico||'');
    set('av-leito', a.hospital||a.leito||'');
    var procSel = document.getElementById('av-procedimento');
    var procOut = document.getElementById('av-procedimento-outro');
    if(procSel){
      var v = a.procedimento||'';
      var existe = false;
      for(var i=0;i<procSel.options.length;i++){ if(procSel.options[i].value===v){ existe=true; break; } }
      if(existe){ procSel.value = v; }
      else if(v){ procSel.value = '__outro__'; if(procOut) procOut.value = v; }
      procedimentoChange(procSel);
    }
    var espSel = document.getElementById('av-especialidade');
    var espOut = document.getElementById('av-especialidade-outro');
    if(espSel){
      var ev = (a.especialidade||'').toUpperCase();
      var existe2 = false;
      for(var j=0;j<espSel.options.length;j++){ if(espSel.options[j].value===ev){ existe2=true; break; } }
      if(existe2){ espSel.value = ev; }
      else if(ev){ espSel.value = '__outro__'; if(espOut) espOut.value = ev; }
      especialidadeChange(espSel);
    }
  }catch(e){}
};

window.carregarAvisos = function(){
  var avisos = getAvisos();
  var tb = document.getElementById('body-avisos');
  var tbAl = document.getElementById('body-alocacao');
  if(!avisos.length){
    tb.innerHTML = '<tr><td colspan="12" style="text-align:center;color:var(--slate-400);padding:30px">Nenhum aviso registrado.</td></tr>';
    tbAl.innerHTML = '<tr><td colspan="16" style="text-align:center;color:var(--slate-400);padding:30px">Nenhum aviso encontrado.</td></tr>';
    return;
  }
  var statusLabels = {agendada:'Agendada',confirmada:'Confirmada',cancelada:'Cancelada',em_curso:'Em curso',concluida:'Concluída'};
  var statusClasses = {agendada:'badge-blue',confirmada:'badge-green',cancelada:'badge-red',em_curso:'badge-amber',concluida:'badge-slate'};
  var caraterColors = {eletiva:'badge-blue',urgencia:'badge-amber',emergencia:'badge-red'};
  tb.innerHTML = avisos.map(function(a, i){
    var nomeSan = (typeof displayPacienteName === 'function') ? displayPacienteName(a) : sanitizePacienteNome(a.nome || '');
    var nomeFormatado = nomeSan.length > 28 ? nomeSan.substring(0,25)+'...' : nomeSan;
    var procFormatado = a.procedimento.length > 35 ? a.procedimento.substring(0,32)+'...' : a.procedimento;
    var cirurgiaoDisplay = displayProfissional(a, a.cirurgiao||'—');
    var convenioDisplay = (typeof displayConvenio === 'function') ? displayConvenio(a) : ((typeof renderConvenioLabel === 'function') ? renderConvenioLabel(a.convenio||'—') : (a.convenio||'—'));
    var idadeDisplay = a.idade || (a.dn ? calcIdade(a.dn) : '—');
    return '<tr>' +
      '<td><strong style="color:var(--navy)">#'+(i+1)+'</strong></td>' +
      '<td><strong>'+(a.data||'—')+'</strong><br><span style="color:var(--slate-500);font-size:11px">'+(a.hora||'—')+'</span></td>' +
      '<td title="'+esc(nomeSan)+'">'+esc(nomeFormatado)+'</td>' +
      '<td>'+esc(idadeDisplay)+'</td>' +
      '<td style="font-size:12px">'+esc(a.dn||'—')+'</td>' +
      '<td>'+esc(a.especialidade||'—')+'</td>' +
      '<td title="'+esc(a.procedimento)+'" style="font-size:12px">'+esc(procFormatado)+'</td>' +
      '<td>'+esc(cirurgiaoDisplay)+'</td>' +
      '<td>'+convenioDisplay+'</td>' +
      '<td><span class="badge '+caraterColors[a.carater]+'">'+esc(a.carater)+'</span></td>' +
      '<td><span class="badge '+(statusClasses[a.statusMapa]||'badge-slate')+'">'+(statusLabels[a.statusMapa]||esc(a.statusMapa))+'</span></td>' +
      '<td><button class="btn btn-ghost btn-sm" onclick="confirmarAviso('+a.id+')" style="margin-right:4px">Confirmar</button><button class="btn btn-danger btn-sm" onclick="excluirAviso('+a.id+')">X</button></td>' +
    '</tr>';
  }).join('');

  tbAl.innerHTML = avisos.map(function(a){
    var bateClass = a.statusMapa === 'confirmada' ? 'badge-green' : 'badge-amber';
    var bateLabel = a.statusMapa === 'confirmada' ? 'Confirmado' : 'Pendente';
    return '<tr>' +
      '<td><strong style="color:var(--navy);font-size:16px">'+(a.sala||'?')+'</strong></td>' +
      '<td><strong>'+(a.hora||'—')+'</strong></td>' +
      '<td>' + esc((typeof displayPacienteName === 'function') ? displayPacienteName(a) : sanitizePacienteNome(a.nome)) + '</td>' +
      '<td>'+esc(a.idade||'—')+'</td>' +
      '<td style="font-size:11.5px">'+esc(a.dn||'—')+'</td>' +
      '<td>'+esc(a.especialidade||'—')+'</td>' +
      '<td style="font-size:11.5px">'+esc(sanitizeFieldForExport(a.procedimento||'—'))+'</td>' +
      '<td>'+esc(displayProfissional(a, a.cirurgiao||'—'))+'</td>' +
      '<td style="font-size:12px">'+esc(a.anestesia||'')+'</td>' +
      '<td class="center">'+(a.hemoderivados==='sim'?'<span title="Reserva de hemoderivados" style="font-size:15px">🩸</span>':(a.hemoderivados==='nao'?'Não':'—'))+'</td>' +
      '<td class="center">'+(a.retaguardaUti==='sim'?'Sim':(a.retaguardaUti==='nao'?'Não':'—'))+'</td>' +
      '<td class="center">'+(a.opme==='sim'?'<span class="badge badge-green">Sim</span>':(a.opme==='nao'?'Não':'—'))+'</td>' +
      '<td class="center">'+(a.consignado==='sim'?'<span class="badge badge-blue">Sim</span>':(a.consignado==='nao'?'Não':'—'))+'</td>' +
      '<td style="font-size:11.5px">'+esc(a.fornecedor||'—')+'</td>' +
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

window.limparExemplosAvisos = function(){
  if(!confirm('Remover todos os registros de exemplo da lista de avisos? Os cadastros feitos por você serão mantidos.')) return;
  var avisos = getAvisos().filter(function(a){ return !(a.isExemplo || (a.id>=1000 && a.id<2000)); });
  setAvisos(avisos);
  carregarAvisos();
  try{ renderMapa(); renderPainel(); renderStatusSalas(); }catch(e){}
  try{ logEventLocal('avisos_exemplos_cleared',{restantes: avisos.length}); }catch(e){}
  showToast('Lista de exemplo removida. Apenas seus cadastros permanecem.','success');
};

window.salvarListaAvisos = function(){
  var avisos = getAvisos();
  setAvisos(avisos);
  carregarAvisos();
  try{ logEventLocal('avisos_list_saved',{count: avisos.length}); }catch(e){}
  showToast('Lista de avisos salva localmente ('+avisos.length+' registro(s)).','success');
};

window.avancarBateMapa = function(){
  carregarAvisos();
  try{ renderMapa(); }catch(e){}
  goStep(3);
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
    var cb = el.querySelector('input[type=checkbox]');
    if(cb) cb.checked = false;
    var sl = el.querySelector('select');
    if(sl) sl.value='';
  });
  atualizarContador();
};

function atualizarContador(){
  var total = document.querySelectorAll('.cl-item').length;
  var done = document.querySelectorAll('.cl-item.checked').length;
  document.getElementById('checklist-counter').textContent = done+'/'+total+' concluídos';
}

window.confirmarBateMapa = function(){ salvarBateMapa(); };

// ==================== BATE-MAPA: PACIENTE + CHECKLIST ====================
function parseIdadeAviso(a){
  try{
    var m = String(a.idade||'').match(/(\d+)/);
    if(m) return parseInt(m[1],10);
    var dn = String(a.dn||'');
    if(!dn) return null;
    var d;
    if(dn.indexOf('-')!==-1){ var p=dn.split('-'); d=new Date(+p[0], +p[1]-1, +p[2]); }
    else { var q=dn.split('/'); d=new Date(+q[2], +q[1]-1, +q[0]); }
    if(isNaN(d)) return null;
    var hoje=new Date();
    var idade=hoje.getFullYear()-d.getFullYear();
    var mm=hoje.getMonth()-d.getMonth();
    if(mm<0||(mm===0&&hoje.getDate()<d.getDate())) idade--;
    return idade;
  }catch(e){ return null; }
}

window.marcarItemSelect = function(sel, item){
  if(!item) return;
  item.classList.toggle('checked', !!sel.value);
  atualizarContador();
};

window.carregarSelectBatePacientes = function(){
  var sel = document.getElementById('bate-paciente');
  if(!sel) return;
  var avisos = getAvisos();
  var html = '<option value="">Selecione o paciente...</option>';
  avisos.forEach(function(a,i){
    var nome = (typeof displayPacienteName==='function')?displayPacienteName(a):sanitizePacienteNome(a.nome||'');
    html += '<option value="'+a.id+'">#'+(i+1)+' — '+esc(nome)+'</option>';
  });
  sel.innerHTML = html;
  try{ batePacienteChange(); }catch(e){}
};

window.batePacienteChange = function(){
  var sel = document.getElementById('bate-paciente');
  var selHemo = document.getElementById('bate-hemoderivados');
  var selUti = document.getElementById('bate-uti');
  if(!sel || !selHemo || !selUti) return;
  var id = sel.value;
  var a = getAvisos().find(function(x){ return String(x.id)===String(id); });
  if(!a){ selHemo.value=''; selUti.value=''; marcarItemSelect(selHemo, selHemo.closest('.cl-item')); marcarItemSelect(selUti, selUti.closest('.cl-item')); return; }
  var idade = parseIdadeAviso(a);
  selHemo.value = (a.hemoderivados==='sim'||a.hemoderivados==='nao') ? a.hemoderivados : ((idade!==null && idade>75) ? 'sim' : '');
  selUti.value = (a.retaguardaUti==='sim'||a.retaguardaUti==='nao') ? a.retaguardaUti : '';
  marcarItemSelect(selHemo, selHemo.closest('.cl-item'));
  marcarItemSelect(selUti, selUti.closest('.cl-item'));
};

window.salvarBateMapa = function(){
  var sel = document.getElementById('bate-paciente');
  if(!sel || !sel.value){ showToast('Selecione o paciente do aviso de cirurgia antes de salvar.','warning'); return; }
  var selHemo = document.getElementById('bate-hemoderivados');
  var selUti = document.getElementById('bate-uti');
  var avisos = getAvisos();
  var a = avisos.find(function(x){ return String(x.id)===String(sel.value); });
  if(!a){ showToast('Paciente não encontrado na lista de avisos.','warning'); return; }
  var idade = parseIdadeAviso(a);
  var hemo = selHemo ? selHemo.value : '';
  if(!hemo && idade!==null && idade>75) hemo = 'sim';
  if(selHemo && idade!==null && idade>75 && !selHemo.value) selHemo.value = 'sim';
  var uti = selUti ? selUti.value : '';
  var itens = [];
  document.querySelectorAll('.cl-item').forEach(function(el){
    if(el.classList.contains('checked')){
      var lb = el.querySelector('label');
      if(lb) itens.push(lb.textContent.trim());
    }
  });
  a.hemoderivados = hemo || 'nao';
  a.retaguardaUti = uti || 'nao';
  a.bateItens = itens;
  a.bateSalvoEm = new Date().toLocaleString('pt-BR');
  setAvisos(avisos);
  carregarAvisos();
  renderChecklistBate();
  renderMapa();
  try{ logEventLocal('batemapa_saved',{id:a.id, hemoderivados:a.hemoderivados, retaguardaUti:a.retaguardaUti, itens: itens.length}); }catch(e){}
  showToast('Bate-mapa salvo! Mapa cirúrgico atualizado.','success');
  setTimeout(function(){ goStep(4); }, 1000);
};

window.renderChecklistBate = function(){
  var tb = document.getElementById('body-checklist-bate');
  if(!tb) return;
  var avisos = getAvisos().filter(function(a){ return a.bateSalvoEm; });
  if(!avisos.length){
    tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--slate-400);padding:20px">Nenhum paciente salvo no bate-mapa ainda.</td></tr>';
    return;
  }
  var total = document.querySelectorAll('.cl-item').length;
  tb.innerHTML = avisos.map(function(a){
    var nome = (typeof displayPacienteName==='function')?displayPacienteName(a):sanitizePacienteNome(a.nome||'');
    var feitos = (a.bateItens||[]).length;
    var ok = feitos >= total;
    var hemo = a.hemoderivados==='sim' ? '<span style="font-size:15px" title="Reserva de hemoderivados">🩸</span>' : (a.hemoderivados==='nao'?'Não':'—');
    var uti = a.retaguardaUti==='sim' ? 'Sim' : (a.retaguardaUti==='nao'?'Não':'—');
    return '<tr>' +
      '<td><strong style="color:var(--navy)">'+esc(nome)+'</strong></td>' +
      '<td>'+esc(a.idade||'—')+'</td>' +
      '<td style="font-size:12px">'+esc(a.dn||'—')+'</td>' +
      '<td>'+esc(a.especialidade||'—')+'</td>' +
      '<td>'+(ok?'<span style="font-size:15px">✅</span>':'<span style="font-size:15px">✔️</span>')+' '+feitos+'/'+total+' itens</td>' +
      '<td class="center">'+hemo+'</td>' +
      '<td class="center">'+uti+'</td>' +
      '<td style="color:var(--slate-500);font-size:12px">'+esc(a.bateSalvoEm)+'</td>' +
    '</tr>';
  }).join('');
};

window.limparChecklistBate = function(){
  if(!confirm('Remover os registros salvos do bate-mapa?')) return;
  var avisos = getAvisos().map(function(a){
    delete a.bateItens; delete a.bateSalvoEm; a.hemoderivados=''; a.retaguardaUti='';
    return a;
  });
  setAvisos(avisos);
  renderChecklistBate();
  carregarAvisos();
  showToast('Registros do bate-mapa removidos.');
};

// ==================== MAPA CIRÚRGICO ====================
var EXEMPLOS = [
  {id:1001,isExemplo:true,nome:'A.S.N.',dn:'10/06/1940',idade:'80 anos',prontuario:'287098',procedimento:'IMPLANTE DE DESFIBRILADOR',lateralidade:'Não se aplica',cirurgiao:'Dr. A.C.',anestesista:'Dr. V.B.',convenio:'Sul América Saúde',leito:'Semi Intensiva 622',sangue:'S',uti:'Sim',enfermeiro:'M.G.',statusSala:'inicio_cirurgia',statusMapa:'em_curso',sala:'Sala 01',hora:'08:00',duracao:'2h',data:'',carater:'eletiva',sexo:'Masculino',latex:'nao',hm:'nao',vad:'nao',munro:'moderado',precaucao:'nenhuma',anestesia:'Geral inalatória (IOT)',posicao:'Supino (dorsal)',progresso:68},
  {id:1002,isExemplo:true,nome:'M.C.B.A.',dn:'',idade:'48 anos',prontuario:'287273',procedimento:'COLOCAÇÃO URETEROSCÓPICA DE DUPLO J',lateralidade:'Não se aplica',cirurgiao:'Dr. A.C.',anestesista:'',convenio:'Allianz Saúde',leito:'',sangue:'Não',uti:'Não',enfermeiro:'M.G.',statusSala:'inicio_cirurgia',statusMapa:'em_curso',sala:'Sala 02',hora:'11:20',duracao:'1h',data:'',carater:'eletiva',sexo:'Feminino',latex:'nao',hm:'nao',vad:'nao',munro:'baixo',precaucao:'nenhuma',anestesia:'Raquidiana / Subaracnóidea',posicao:'Litotomia',progresso:45},
  {id:1003,isExemplo:true,nome:'C.C.O.Z.',dn:'',idade:'25 anos',prontuario:'287280',procedimento:'COLECISTECTOMIA COM COLANGIOGRAFIA POR VÍDEO',lateralidade:'Não se aplica',cirurgiao:'Dr. A.C.',anestesista:'Dr. V.B.',convenio:'Sul América Saúde',leito:'',sangue:'Não',uti:'Não',enfermeiro:'M.G.',statusSala:'inicio_cirurgia',statusMapa:'em_curso',sala:'Sala 03',hora:'13:30',duracao:'2h',data:'',carater:'eletiva',sexo:'Feminino',latex:'nao',hm:'nao',vad:'nao',munro:'baixo',precaucao:'nenhuma',anestesia:'Geral inalatória (IOT)',posicao:'Supino (dorsal)',progresso:22},
  {id:1004,isExemplo:true,nome:'P.R.P.R.',dn:'',idade:'46 anos',prontuario:'287372',procedimento:'COLOCAÇÃO DE SHUNT DEFINITIVO',lateralidade:'Não se aplica',cirurgiao:'Dr. A.C.',anestesista:'',convenio:'Seguros Unimed',leito:'',sangue:'Não',uti:'Não',enfermeiro:'M.G.',statusSala:'paciente_sala',statusMapa:'confirmada',sala:'Sala 04',hora:'14:00',duracao:'3h',data:'',carater:'eletiva',sexo:'Masculino',latex:'nao',hm:'nao',vad:'suspeita',munro:'moderado',precaucao:'nenhuma',anestesia:'Geral TIVA (via venosa)',posicao:'Supino (dorsal)',progresso:0},
  {id:1005,isExemplo:true,nome:'G.L.P.A.',dn:'',idade:'23 anos',prontuario:'287271',procedimento:'SEPTO NASAL — SEPTOPLASTIA',lateralidade:'Não se aplica',cirurgiao:'Dr. A.C.',anestesista:'',convenio:'Bradesco Saúde',leito:'',sangue:'Não',uti:'Não',enfermeiro:'M.G.',statusSala:'inicio_anestesia',statusMapa:'confirmada',sala:'Sala 06',hora:'10:20',duracao:'1h',data:'',carater:'eletiva',sexo:'Feminino',latex:'sim',hm:'nao',vad:'nao',munro:'baixo',precaucao:'nenhuma',anestesia:'Geral inalatória (IOT)',posicao:'Supino (dorsal)',progresso:0},
  {id:1006,isExemplo:true,nome:'L.C.A.D.S.G.',dn:'',idade:'53 anos',prontuario:'287310',procedimento:'COLECISTECTOMIA COM COLANGIOGRAFIA POR VÍDEO',lateralidade:'Não se aplica',cirurgiao:'Dr. E.M.',anestesista:'',convenio:'Sompo Saúde',leito:'',sangue:'S',uti:'Não',enfermeiro:'M.G.',statusSala:'inicio_cirurgia',statusMapa:'em_curso',sala:'Sala 08',hora:'11:45',duracao:'2h',data:'',carater:'eletiva',sexo:'Feminino',latex:'nao',hm:'sim',vad:'nao',munro:'alto',precaucao:'contato',anestesia:'Geral inalatória (IOT)',posicao:'Supino (dorsal)',progresso:55},
  {id:1007,isExemplo:true,nome:'I.X.D.R.',dn:'',idade:'67 anos',prontuario:'287283',procedimento:'VARIZES — TRATAMENTO CIRÚRGICO BILATERAL',lateralidade:'Bilateral',cirurgiao:'Dr. A.C.',anestesista:'',convenio:'Particular',leito:'',sangue:'Não',uti:'Não',enfermeiro:'M.G.',statusSala:'agendada',statusMapa:'agendada',sala:'Sala 10',hora:'09:00',duracao:'2h',data:'',carater:'eletiva',sexo:'Feminino',latex:'nao',hm:'nao',vad:'nao',munro:'moderado',precaucao:'nenhuma',anestesia:'Raquidiana / Subaracnóidea',posicao:'Supino (dorsal)',progresso:0}
];

window.adicionarExemplos = function(){
  var today = new Date().toISOString().split('T')[0];
  EXEMPLOS.forEach(function(e){ e.data = today; });
  var avisos = getAvisos();
  EXEMPLOS.forEach(function(ex){
    ex.isExemplo = true;
    if(!ex.idade && ex.dn) ex.idade = calcIdade(ex.dn);
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
    tb.innerHTML = '<tr><td colspan="19" style="text-align:center;color:var(--slate-400);padding:40px">Nenhuma cirurgia encontrada. Ajuste os filtros ou adicione exemplos.</td></tr>';
    return;
  }
  tb.innerHTML = avisos.map(function(a){
    var cor = STATUS_CORES[a.statusSala]||STATUS_CORES[a.statusMapa]||'#94A3B8';
    var label = STATUS_LABELS[a.statusSala]||STATUS_LABELS[a.statusMapa]||'—';
    var cirurgiaoDisplay = displayProfissional(a, a.cirurgiao||'—');
    var anestesistaDisplay = displayProfissional(a, a.anestesista||'—');
    var convenioDisplay = (typeof displayConvenio === 'function') ? displayConvenio(a) : ((typeof renderConvenioLabel === 'function') ? renderConvenioLabel(a.convenio||'—') : (a.convenio||'—'));
    var latexIcon = a.latex==='sim'?' <span title="Látex-free" style="font-size:13px">⚠️</span>':'';
    var hmIcon = a.hm==='confirmado'||a.hm==='suspeita'?' <span title="Hipertermia Maligna" style="font-size:13px">🔥</span>':'';
    var vadIcon = a.vad==='sim'||a.vad==='suspeita'?' <span title="Via Aérea Difícil" style="font-size:13px">🩺</span>':'';
    return '<tr>' +
      '<td><strong style="font-size:16px;color:var(--navy)">'+a.sala+'</strong></td>' +
      '<td><strong>'+a.hora+'</strong><br><span style="font-size:10px;color:var(--slate-400)">'+a.prontuario+'</span></td>' +
      '<td><strong>'+((typeof displayPacienteName === 'function') ? displayPacienteName(a) : sanitizePacienteNome(a.nome)).split('—')[0].trim()+'</strong>'+latexIcon+hmIcon+vadIcon+'</td>' +
      '<td class="center">'+esc(a.idade || (a.dn ? calcIdade(a.dn) : '—'))+'</td>' +
      '<td style="font-size:11px">'+esc(a.dn||'—')+'</td>' +
      '<td>'+esc(a.especialidade||'—')+'</td>' +
      '<td style="font-size:12px">'+(a.procedimento||'—')+'</td>' +
      '<td style="font-size:12px">'+esc(a.lateralidade||'—')+'</td>' +
      '<td style="font-size:12px">'+cirurgiaoDisplay+'</td>' +
      '<td style="font-size:12px">'+anestesistaDisplay+'</td>' +
      '<td style="font-size:12px">'+convenioDisplay+'</td>' +
      '<td style="font-size:11px;color:var(--slate-500)">'+(a.leito||'—')+'</td>' +
      '<td class="center">'+(a.hemoderivados==='sim'?'<span title="Reserva de hemoderivados" style="font-size:14px">🩸</span>':(a.hemoderivados==='nao'?'Não':'—'))+'</td>' +
      '<td class="center">'+(a.retaguardaUti==='sim'?'Sim':(a.retaguardaUti==='nao'?'Não':'—'))+'</td>' +
      '<td class="center">'+(a.opme==='sim'?'<span class="badge badge-green">Sim</span>':(a.opme==='nao'?'Não':'—'))+'</td>' +
      '<td class="center">'+(a.consignado==='sim'?'<span class="badge badge-blue">Sim</span>':(a.consignado==='nao'?'Não':'—'))+'</td>' +
      '<td style="font-size:11.5px">'+esc(a.fornecedor||'—')+'</td>' +
      '<td style="font-size:12px">'+esc(displayProfissional(a, a.enfermeiro||'—'))+'</td>' +
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
var painelDiaFiltro = '';

window.simularDiaCirurgico = function(){
  var inp = document.getElementById('painel-dia');
  painelDiaFiltro = (inp && inp.value) ? inp.value : '';
  var btn = document.getElementById('btn-limpar-dia');
  if(btn) btn.style.display = painelDiaFiltro ? 'inline-flex' : 'none';
  try{ if(painelDiaFiltro){ localStorage.setItem('cc_painel_dia', painelDiaFiltro); } else { localStorage.removeItem('cc_painel_dia'); } }catch(e){}
  renderPainel();
  if(painelDiaFiltro){
    try{
      var diaTexto = new Date(painelDiaFiltro+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
      showToast('Painel simulado para: '+diaTexto,'success');
    }catch(e){}
  }
};

window.limparDiaPainel = function(){
  var inp = document.getElementById('painel-dia');
  if(inp) inp.value = '';
  painelDiaFiltro = '';
  try{ localStorage.removeItem('cc_painel_dia'); }catch(e){}
  var btn = document.getElementById('btn-limpar-dia');
  if(btn) btn.style.display = 'none';
  renderPainel();
};

window.renderPainel = function(){
  var avisos = getAvisos();
  var grid = document.getElementById('painel-grid');
  var ultimaAttEl = document.getElementById('ultima-att');
  var tvDiaEl = document.getElementById('painel-tv-dia');
  var tvHoraEl = document.getElementById('painel-tv-hora');
  var tvTituloEl = document.getElementById('painel-tv-titulo');
  if(ultimaAttEl) ultimaAttEl.textContent = new Date().toLocaleTimeString('pt-BR');
  if(tvHoraEl) tvHoraEl.textContent = new Date().toLocaleTimeString('pt-BR');
  var filtroAtivo = !!painelDiaFiltro;
  var diaTexto = '';
  if(filtroAtivo){
    try{ diaTexto = new Date(painelDiaFiltro+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}); }catch(e){ diaTexto = painelDiaFiltro; }
    avisos = avisos.filter(function(a){ return a.data===painelDiaFiltro; });
  }
  if(tvTituloEl) tvTituloEl.textContent = filtroAtivo ? 'Simulação de dia cirúrgico' : 'Programação geral';
  if(tvDiaEl) tvDiaEl.textContent = filtroAtivo ? diaTexto : 'Todos os dias';
  if(!grid) return;
  if(!avisos.length){
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:rgba(147,197,253,.75)"><p>' + (filtroAtivo ? ('Nenhuma cirurgia cadastrada para <strong>'+diaTexto+'</strong>. Use "Limpar dia" para ver a programação geral.') : 'Nenhuma cirurgia carregada. Use "Carregar Painel com Exemplos".') + '</p></div>';
    return;
  }
  grid.innerHTML = avisos.map(function(a){
    var cor = STATUS_CORES[a.statusSala]||STATUS_CORES[a.statusMapa]||'#94A3B8';
    var label = STATUS_LABELS[a.statusSala]||STATUS_LABELS[a.statusMapa]||'—';
    var livre = a.statusSala==='livre'||a.statusSala==='agendada'||!a.statusSala;
    var pct = a.progresso||0;
    var barClass = pct>=100?'sc-bar-fill red':'sc-bar-fill';
    var idadeTxt = a.idade || (a.dn ? calcIdade(a.dn) : '');
    var nomeTxt = ((typeof displayPacienteName === 'function') ? displayPacienteName(a) : sanitizePacienteNome(a.nome));
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
          '<span style="display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:800;padding:3px 10px;border-radius:999px;background:'+cor+';color:#fff;border:1px solid '+cor+';box-shadow:0 0 14px '+cor+'70">'+
          '<span style="width:7px;height:7px;border-radius:50%;background:#fff;display:inline-block"></span>'+label+'</span>' +
        '</div>' +
      '</div>' +
      '<div class="sc-body">' +
        '<p class="sc-pac">'+esc(nomeTxt)+(idadeTxt?' <span class="sc-idade">'+esc(idadeTxt)+'</span>':'')+'</p>' +
        '<p class="sc-proc">'+esc(sanitizeFieldForExport(a.procedimento))+'</p>' +
        '<div class="sc-team">' +
          (a.cirurgiao?'<span class="member">+ '+esc(displayProfissional(a, a.cirurgiao))+'</span>':'')+
          (a.anestesista?'<span class="member">A '+esc(displayProfissional(a, a.anestesista))+'</span>':'')+
          (a.enfermeiro?'<span class="member">C '+esc(displayProfissional(a, a.enfermeiro))+'</span>':'')+
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
          '<div><strong style="font-size:18px;color:var(--navy)">'+a.sala+'</strong><br><span style="font-size:12px;color:var(--slate-500)">' + ((typeof displayPacienteName === 'function') ? displayPacienteName(a).split('—')[0].trim() : sanitizePacienteNome(a.nome).split('—')[0].trim()) + '</span></div>' +
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
  if(modalTitleEl) modalTitleEl.textContent = a.sala+' — '+((typeof displayPacienteName === 'function') ? displayPacienteName(a) : sanitizePacienteNome(a.nome));
  var cor = STATUS_CORES[a.statusSala]||'#94A3B8';
  var label = STATUS_LABELS[a.statusSala]||'—';
  if(modalBodyEl){
    var procedimento = sanitizeFieldForExport(a.procedimento||'—');
    var convenio = (typeof displayConvenio === 'function') ? displayConvenio(a) : (neutralizeOrgNames(sanitizeFieldForExport(a.convenio||'—'))||'—');
    var cirurgiao = displayProfissional(a, a.cirurgiao||'—')||'—';
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
    var paciente = (typeof displayPacienteName === 'function') ? displayPacienteName(a) : sanitizePacienteNome(a.nome);
    var prontuario = sanitizeFieldForExport(a.prontuario);
    var procedimento = sanitizeFieldForExport(a.procedimento);
    var lateralidade = sanitizeFieldForExport(a.lateralidade);
    var cirurgiao = sanitizeResponsavelField(a.cirurgiao);
    var anestesista = sanitizeResponsavelField(a.anestesista);
    var convenio = (isFullyDocumentedForAviso(a) && a.convenio) ? (function(){ try{ logEventLocal('export_expose_convenio',{id: a.id}); }catch(e){} return a.convenio; })() : neutralizeOrgNames(sanitizeFieldForExport(a.convenio||''));
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
  try{ logEventLocal('export_map',{count: avisos.length}); }catch(e){}
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

// ==================== MAIÚSCULAS AUTOMÁTICAS (texto/textarea, independente do Caps Lock) ====================
document.addEventListener('input', function(e){
  try{
    var t = e.target;
    if(!t || !t.tagName) return;
    var tag = t.tagName.toLowerCase();
    var type = String(t.type||'').toLowerCase();
    var ok = (tag==='input' && (!type || ['text','search','tel','email','url'].indexOf(type)!==-1)) || tag==='textarea';
    if(!ok) return;
    var pos = (typeof t.selectionStart === 'number') ? t.selectionStart : null;
    var v = String(t.value||'').toUpperCase();
    if(v !== t.value){ t.value = v; if(pos!==null){ try{ t.setSelectionRange(pos,pos); }catch(err){} } }
  }catch(e){}
});

// ==================== INIT ====================
document.getElementById('av-data').value = new Date().toISOString().split('T')[0];
document.getElementById('filtro-data-mapa') && (document.getElementById('filtro-data-mapa').value = new Date().toISOString().split('T')[0]);
carregarSelectProcedimentos();
carregarSelectEspecialidades();
carregarSelectAvPacientes();
carregarAvisos();
renderIndicadoresVazios();

// Restaura o dia simulado do painel de salas (persistido em cache local)
(function(){
  try{
    var dia = localStorage.getItem('cc_painel_dia');
    if(dia){
      painelDiaFiltro = dia;
      var inp = document.getElementById('painel-dia'); if(inp) inp.value = dia;
      var btn = document.getElementById('btn-limpar-dia'); if(btn) btn.style.display = 'inline-flex';
    }
  }catch(e){}
})();

// Campo Nome do Usuário: aceita nome completo sem conversão automática para iniciais

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
    try{ logEventLocal('cme_mov', reg); }catch(e){}
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
    try{ logEventLocal('cme_lote_saved', lote); }catch(e){}
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
// helper: impressão resiliente (tenta window.open, fallback para iframe)
window._cc_printHtml = function(html, name){
  try{
    var w = null;
    try{ w = window.open('','_blank'); }catch(e){ w = null; }
    if(w && w.document){
      w.document.write(html);
      w.document.close();
      try{ w.focus(); }catch(e){}
      return w;
    }
    // fallback: create hidden iframe
    var iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden'; iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width='0'; iframe.style.height='0'; iframe.setAttribute('aria-hidden','true');
    document.body.appendChild(iframe);
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    iframe.onload = function(){
      try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }catch(e){ if(window.showToast) showToast('Erro ao imprimir. Permita pop-ups no navegador.','warning'); }
      setTimeout(function(){ try{ document.body.removeChild(iframe); }catch(e){} },1500);
    };
    return iframe;
  }catch(e){ try{ if(window.showToast) showToast('Erro ao preparar impressão.'); }catch(x){} }
};

window.imprimirEtapaAtual=function(){
  var active=document.querySelector('.step-panel.active');if(!active){showToast('Nenhuma etapa ativa.');return;}
  var panels=document.querySelectorAll('.step-panel'),stepNum=-1;
  panels.forEach(function(p,i){if(p===active)stepNum=i;});
  var stepBtn=document.querySelector('.step-btn[data-step="'+stepNum+'"]');
  var stepName=stepBtn?stepBtn.textContent.trim().replace(/^\d+/,'').trim():'Etapa '+(stepNum+1);
    // Special-case: when SAEP step (multi-tab), print all SAEP panels concatenated
    if(active.id === 'panel-saep'){
      try{ if(typeof window.imprimirSaepCompleto === 'function'){ window.imprimirSaepCompleto(); return; } }catch(e){}
    }
    var content=active.cloneNode(true);
  function sanitizeCloneForPrint(root){
    try{
      // remove action buttons and no-print elements
      root.querySelectorAll('.btn-row,.btn,.no-print,.tip,.step-actions,.modal-overlay').forEach(function(el){ el.remove(); });
      // replace form controls with sanitized spans
      root.querySelectorAll('input,select,textarea').forEach(function(el){
        try{
          var span = document.createElement('span'); span.style.cssText = 'font-weight:600';
          var tag = el.tagName.toLowerCase();
          if(tag==='input' && el.type==='checkbox'){
            // keep label next to checkbox; replace input with checkmark
            span.textContent = el.checked ? 'Sim' : 'Não';
            el.parentNode.replaceChild(span, el);
            return;
          }
          if(tag==='select'){
            var txt = (el.options && el.options[el.selectedIndex]) ? el.options[el.selectedIndex].textContent : '';
            // special-case convenio select to produce neutral label
            if(el.id && el.id.toLowerCase().indexOf('conveni')!==-1 && typeof neutralizeConvenioText==='function') txt = neutralizeConvenioText(txt);
            else if(typeof sanitizeFieldForExport==='function') txt = sanitizeFieldForExport(txt);
            span.textContent = txt || '—';
            el.parentNode.replaceChild(span, el);
            return;
          }
          // other inputs / textarea
          var v = el.value || '';
          if(typeof sanitizeFieldForExport==='function') v = sanitizeFieldForExport(v);
          span.textContent = v || '—';
          el.parentNode.replaceChild(span, el);
        }catch(e){}
      });

      // sanitize remaining text nodes
      try{
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        var tn;
        while(tn = walker.nextNode()){
          if(!tn.nodeValue || !tn.nodeValue.trim()) continue;
          var parent = tn.parentNode && tn.parentNode.nodeName;
          if(parent==='SCRIPT' || parent==='STYLE') continue;
          tn.nodeValue = maskNamesInText(neutralizeOrgNames(tn.nodeValue));
        }
      }catch(e){}
    }catch(e){}
  }

  // Print all SAEP panels concatenated and sanitized
  window.imprimirSaepCompleto = function(){
    try{
      var panelIds = ['saep-anamnese','saep-exame','saep-nanda','saep-prescricao','saep-evolucao'];
      var parts = [];
      panelIds.forEach(function(id){
        var el = document.getElementById(id);
        if(!el) return;
        var clone = el.cloneNode(true);
        sanitizeCloneForPrint(clone);
        // Extract heading if available
        var heading = (clone.querySelector('.card-head h3')&&clone.querySelector('.card-head h3').textContent) ? clone.querySelector('.card-head h3').textContent.trim() : id;
        parts.push('<div class="card" style="margin-bottom:14px"><div class="card-head">'+heading+'</div><div class="card-body">'+clone.querySelector('.card-body')?.innerHTML+'</div></div>');
      });
      if(!parts.length){ showToast('Nenhum painel SAEP encontrado para impressão.','warning'); return; }
      var bodyHtml = parts.join('\n');
      var title = 'SAEP — Centro Cirúrgico';
      var globalStyles = (function(){
        try{ var el = document.getElementById('global-print-styles'); if(el) return el.innerHTML; }catch(e){}
        return '*{margin:0;padding:0;box-sizing:border-box} body{font-family:Arial,sans-serif;font-size:10pt;color:#1E293B;padding:20px 28px} '+
               '.hdr{background:#1A3E74;color:#fff;padding:14px 20px;border-radius:8px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center} '+
               '.hdr h1{font-size:13pt;font-weight:900}.hdr p{font-size:8pt;opacity:.8;margin-top:3px} '+
               '.card{border:1px solid #E2E8F0;border-radius:8px;margin-bottom:14px;overflow:hidden} '+
               '.card-head{background:#F8FAFC;padding:10px 16px;border-bottom:1px solid #E2E8F0;font-weight:700;font-size:11pt;color:#1A3E74} '+
               '.card-body{padding:14px 16px} .tbl{width:100%;border-collapse:collapse;font-size:9pt}.tbl th{background:#1A3E74;color:#fff;padding:6px 8px;text-align:left;font-size:8pt}.tbl td{padding:5px 8px;border-bottom:1px solid #F1F5F9} '+
               '.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px}.form-group{margin-bottom:8px}.form-group label{font-size:8pt;font-weight:700;color:#475569;display:block;margin-bottom:2px} '+
               '.footer-print{text-align:center;font-size:7.5pt;color:#94A3B8;margin-top:20px;border-top:1px solid #E2E8F0;padding-top:8px}';
      })();
      var html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>'+title+'</title><style>'+globalStyles+'</style></head><body>'+
        '<div class="hdr"><div><h1>SAEP — Sistematização da Assistência de Enfermagem Perioperatória</h1><p>Centro Cirúrgico — Calculadoras de Enfermagem</p></div><div style="text-align:right;font-size:8.5pt"><strong>Data:</strong> '+new Date().toLocaleDateString('pt-BR')+'</div></div>'+
        bodyHtml + '<div class="footer-print">Ferramenta educacional — Dados fictícios armazenados localmente (LGPD) — calculadorasdeenfermagem.com.br</div>'+
        '<script>window.onload=function(){window.print();}<'+'/script></body></html>';
      window._cc_printHtml(html, title);
      try{ logEventLocal('print_saep_all', {count: parts.length}); }catch(e){}
    }catch(e){ showToast('Erro ao gerar impressão SAEP.'); }
  };
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
  var globalStyles = (function(){
    try{ var el = document.getElementById('global-print-styles'); if(el) return el.innerHTML; }catch(e){}
    return '*{margin:0;padding:0;box-sizing:border-box} '+
           'body{font-family:Arial,sans-serif;font-size:10pt;color:#1E293B;padding:20px 28px} '+
           '.hdr{background:#1A3E74;color:#fff;padding:14px 20px;border-radius:8px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center} '+
           '.hdr h1{font-size:13pt;font-weight:900}.hdr p{font-size:8pt;opacity:.8;margin-top:3px} '+
           '.card{border:1px solid #E2E8F0;border-radius:8px;margin-bottom:14px;overflow:hidden} '+
           '.card-head{background:#F8FAFC;padding:10px 16px;border-bottom:1px solid #E2E8F0;font-weight:700;font-size:11pt;color:#1A3E74} '+
           '.card-body{padding:14px 16px} '+
           '.tbl{width:100%;border-collapse:collapse;font-size:9pt}.tbl th{background:#1A3E74;color:#fff;padding:6px 8px;text-align:left;font-size:8pt}.tbl td{padding:5px 8px;border-bottom:1px solid #F1F5F9} '+
           '.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px}.form-group{margin-bottom:8px}.form-group label{font-size:8pt;font-weight:700;color:#475569;display:block;margin-bottom:2px} '+
           '.explainer{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin-bottom:14px}.explainer h3{font-size:11pt;color:#1A3E74;margin-bottom:6px}.explainer p{font-size:9pt;color:#475569;line-height:1.5} '+
           '.alert{padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:9pt}.alert-blue{background:#EFF6FF;border:1px solid #BFDBFE;color:#1E40AF}.alert-amber{background:#FFFBEB;border:1px solid #FDE68A;color:#92400E} '+
           '.sec-div{margin:14px 0 10px}.sec-div h3{font-size:10pt;font-weight:800;color:#1A3E74} '+
           '.checklist-item{display:flex;align-items:center;gap:8px;padding:5px 8px;font-size:9pt} '+
           '.oms3-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.oms3-col{border:2px solid;border-radius:8px;overflow:hidden}.oms3-col-head{padding:8px 12px;color:#fff;font-weight:700;font-size:10pt}.col-green .oms3-col-head{background:#2E7D32}.col-green{border-color:#66BB6A}.col-grey .oms3-col-head{background:#455A64}.col-grey{border-color:#90A4AE}.col-blue .oms3-col-head{background:#1565C0}.col-blue{border-color:#42A5F5}.oms3-body{padding:10px 12px}.oms3-item{padding:4px 6px;font-size:8.5pt}.oms3-item.done{text-decoration:line-through;color:#999} '+
           '.cme-flow{display:flex;gap:6px;margin-bottom:14px}.cme-fs{flex:1;text-align:center;padding:8px;border:1px solid #E2E8F0;border-radius:6px} '+
           '.ind-kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:12px}.ind-kpi{border:1px solid #E2E8F0;border-radius:6px;padding:10px;text-align:center}.ind-kpi-val{font-size:18pt;font-weight:900} '+
           '.saep-check-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.saep-check-item{padding:5px 8px;font-size:8.5pt;border:1px solid #E2E8F0;border-radius:4px} '+
           '.footer-print{text-align:center;font-size:7.5pt;color:#94A3B8;margin-top:20px;border-top:1px solid #E2E8F0;padding-top:8px}';
  })();
  var html='<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>'+stepName+' - Centro Cirúrgico</title><style>'+globalStyles+'</style></head><body>'+
    '<div class="hdr"><div><h1>Simulador de Centro Cirúrgico</h1><p>'+stepName+' — Calculadoras de Enfermagem</p></div><div style="text-align:right;font-size:8.5pt"><strong>Data:</strong> '+new Date().toLocaleDateString('pt-BR')+'</div></div>'+
    content.innerHTML+
    '<div class="footer-print">Ferramenta educacional — Dados fictícios armazenados localmente (LGPD)<br>Baseado nas diretrizes SOBECC, OMS e ANVISA RDC 36/2013 | Calculadoras de Enfermagem — www.calculadorasdeenfermagem.com.br</div>'+
    '<script>window.onload=function(){window.print();}<'+'/script></body></html>';
  try{ logEventLocal('print_step',{step: stepName}); }catch(e){}
  window._cc_printHtml(html, stepName);
};

window.exportarExcelEtapaAtual=function(){
  var active=document.querySelector('.step-panel.active');if(!active){showToast('Nenhuma etapa ativa.');return;}
  var panels=document.querySelectorAll('.step-panel'),stepNum=-1;
  panels.forEach(function(p,i){if(p===active)stepNum=i;});
  var stepBtn=document.querySelector('.step-btn[data-step="'+stepNum+'"]');
  var stepName=stepBtn?stepBtn.textContent.trim().replace(/^\d+/,'').trim():'Etapa'+(stepNum+1);
  var tables=active.querySelectorAll('table.tbl,table.cme-lote-tbl,table.cme-cores-tbl');
  if(!tables.length){
    // fallback: export form fields (inputs/selects/textarea) as CSV
    var inputs = active.querySelectorAll('input,select,textarea');
    if(!inputs.length){ showToast('Não há tabelas nem campos para exportar nesta etapa.'); return; }
    var csv='\uFEFF"Campo";"Valor"\n';
    inputs.forEach(function(el){
      try{
        var fg = el.closest && el.closest('.form-group');
        var labelEl = fg ? fg.querySelector('label') : null;
        var label = labelEl ? labelEl.textContent.trim().replace(/\n/g,' ') : (el.getAttribute('data-label')|| el.placeholder || el.id || 'Campo');
        var tag = el.tagName.toLowerCase();
        var val = '';
        if(tag==='select'){
          val = el.options[el.selectedIndex] ? el.options[el.selectedIndex].textContent : '';
          if(el.id && el.id.toLowerCase().indexOf('conveni')!==-1 && typeof neutralizeConvenioText==='function') val = neutralizeConvenioText(val);
          else if(typeof sanitizeFieldForExport==='function') val = sanitizeFieldForExport(val);
        } else if(tag==='input' && el.type==='checkbox'){
          val = el.checked ? 'Sim' : 'Não';
        } else {
          val = typeof sanitizeFieldForExport==='function' ? sanitizeFieldForExport(el.value||'') : (el.value||'');
        }
        csv += '"'+String(label).replace(/"/g,'""')+'";"'+String(val).replace(/"/g,'""')+'"\n';
      }catch(e){}
    });
    var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url; a.download='centro-cirurgico-'+stepName.replace(/\s+/g,'-').toLowerCase()+'-'+new Date().toISOString().slice(0,10)+'.csv'; a.click(); URL.revokeObjectURL(url);
    try{ logEventLocal('export_step',{step: stepName, fields: inputs.length}); }catch(e){}
    showToast('Planilha exportada.');
    return;
  }
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
  try{ logEventLocal('export_step',{step: stepName}); }catch(e){}
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
  try{ var saved = JSON.parse(localStorage.getItem('cc_saep')||'{}'); logEventLocal('saep_saved',{fields: Object.keys(saved||{}).length}); }catch(e){}
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

// ==================== ALDRETE: persistência, render, export ====================
function getAldreteEntries(){ try{ return JSON.parse(localStorage.getItem('cc_saep_aldrete')||'[]'); }catch(e){ return []; } }
function setAldreteEntries(arr){ try{ localStorage.setItem('cc_saep_aldrete', JSON.stringify(arr)); }catch(e){} }

window.renderAldreteEntries = function(){
  var tb = document.querySelector('#saep-aldrete-table tbody'); if(!tb) return; var arr = getAldreteEntries(); if(!arr.length){ tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--slate-400);padding:12px">Nenhuma avaliação registrada.</td></tr>'; return; }
  tb.innerHTML = arr.map(function(e,i){
    return '<tr>' +
      '<td>'+ (sanitizeFieldForExport(e.dh||'') ) + '</td>' +
      '<td>'+ (sanitizeFieldForExport(e.fase||'')) + '</td>' +
      '<td style="font-weight:700">'+ (e.score!=null? e.score : '') + '</td>' +
      '<td>'+ (sanitizeFieldForExport(e.obs||'')) + '</td>' +
      '<td><button class="btn btn-ghost btn-sm" onclick="saepAldreteDelete('+i+')">Excluir</button></td>' +
    '</tr>';
  }).join('');
};

window.saepAldreteSalvar = function(){
  var dh = document.getElementById('saep-ev-dh') ? document.getElementById('saep-ev-dh').value : new Date().toLocaleString('pt-BR'); if(!dh) dh=new Date().toLocaleString('pt-BR');
  var fase = document.getElementById('saep-ev-fase') ? document.getElementById('saep-ev-fase').value : '';
  var atividade = Number(document.getElementById('saep-ald-atividade').value) || 0;
  var resp = Number(document.getElementById('saep-ald-resp').value) || 0;
  var circ = Number(document.getElementById('saep-ald-circ').value) || 0;
  var cons = Number(document.getElementById('saep-ald-consci').value) || 0;
  var ox = Number(document.getElementById('saep-ald-oxig').value) || 0;
  var score = atividade + resp + circ + cons + ox;
  var obs = document.getElementById('saep-ev-obs') ? document.getElementById('saep-ev-obs').value : '';
  // tentar vincular à cirurgia selecionada em preparo (se houver)
  var cirurgiaIdx = (document.getElementById('prep-cirurgia') && document.getElementById('prep-cirurgia').value) ? document.getElementById('prep-cirurgia').value : null;
  var agendamento = null;
  try{ if(cirurgiaIdx !== null && cirurgiaIdx !== ''){ var ags = JSON.parse(localStorage.getItem('cc_agendamentos')||'[]'); var ag = ags[Number(cirurgiaIdx)]; if(ag) agendamento = {procedimento: ag.procedimento, data: ag.data, medico: ag.medico}; } }catch(e){}
  var entry = { dh: dh, fase: fase, atividade: atividade, resp: resp, circ: circ, cons: cons, ox: ox, score: score, obs: obs, cirurgiaIdx: cirurgiaIdx, agendamento: agendamento };
  var arr = getAldreteEntries(); arr.push(entry); setAldreteEntries(arr); renderAldreteEntries();
  try{ logEventLocal('aldrete_saved', { score: score, cirurgiaIdx: cirurgiaIdx, agendamento: agendamento }); }catch(e){}
  if(window.showToast) showToast('Avaliação Aldrete salva localmente. Score: ' + score, 'success'); else alert('Avaliação salva. Score: ' + score);
};

window.saepAldreteDelete = function(i){ var arr = getAldreteEntries(); if(!arr[i]) return; if(!confirm('Excluir avaliação registrada em ' + (arr[i].dh||'?') + '?')) return; var removed = arr.splice(i,1)[0]; setAldreteEntries(arr); renderAldreteEntries(); try{ logEventLocal('aldrete_deleted',{dh: removed.dh, score: removed.score, cirurgiaIdx: removed.cirurgiaIdx}); }catch(e){} };

window.saepAldreteLimpar = function(){ ['saep-ald-atividade','saep-ald-resp','saep-ald-circ','saep-ald-consci','saep-ald-oxig'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; }); };

window.saepAldreteExport = function(){ var arr=getAldreteEntries(); if(!arr.length){ if(window.showToast) showToast('Nenhuma avaliação para exportar.'); else alert('Nenhuma avaliação para exportar.'); return; } var csv='\uFEFF"Data/Hora";"Fase";"Atividade";"Respiração";"Circulação";"Consciência";"Oxigenação";"Score";"Observações"\n'; arr.forEach(function(e){ csv += '"'+sanitizeFieldForExport(e.dh||'')+'";"'+sanitizeFieldForExport(e.fase||'')+'";"'+(e.atividade||'')+'";"'+(e.resp||'')+'";"'+(e.circ||'')+'";"'+(e.cons||'')+'";"'+(e.ox||'')+'";"'+(e.score||'')+'";"'+sanitizeFieldForExport(e.obs||'')+'"\n'; }); var blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='centro-cirurgico-aldrete-'+new Date().toISOString().slice(0,10)+'.csv'; a.click(); URL.revokeObjectURL(url); try{ logEventLocal('aldrete_export',{count: arr.length}); }catch(e){} if(window.showToast) showToast('Planilha Aldrete exportada.'); else alert('Exportado.'); };

// garantir renderização ao carregar a página
document.addEventListener('DOMContentLoaded', function(){ try{ renderAldreteEntries(); }catch(e){} });

// Injetar botões de ação nas etapas
document.addEventListener('DOMContentLoaded',injetarBotoesAcao);

})();
