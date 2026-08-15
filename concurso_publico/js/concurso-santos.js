(() => {
  'use strict';
  const data = window.SANTOS_DATA;
  if (!data) return;

  const STORAGE_KEY = 'cko.santos.74.2026.progress.v1';
  const NOTES_KEY = 'cko.santos.74.2026.notes.v1';
  const STATUS = ['novo','estudando','revisado','dominado'];
  const STATUS_LABEL = {novo:'Não iniciado', estudando:'Em estudo', revisado:'Revisado', dominado:'Dominado'};
  const AREA_LABEL = Object.fromEntries(data.exam.areas.map(a => [a.id,a.label]));
  const AREA_SHORT = {portugues:'Português', legislacao:'Legislação', sus:'Saúde e SUS', especificos:'Específicos'};
  const AREA_COLOR = {portugues:'#5d7fa9', legislacao:'#8059b0', sus:'#db8a24', especificos:'#d14e61'};

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const icon = (id, cls='icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"></use></svg>`;

  let saved = loadState();
  let filters = {area:'all', priority:'all', status:'all', search:'', unfinished:false, highYield:false};
  let toastTimer;

  function loadState(){
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {topics: raw.topics || {}};
    } catch { return {topics:{}}; }
  }
  function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }
  function topicState(id){
    return saved.topics[id] || {status:'novo', favorite:false, updatedAt:null};
  }
  function setTopicState(id, patch){
    saved.topics[id] = {...topicState(id), ...patch, updatedAt:new Date().toISOString()};
    persist();
    renderAllStateful();
  }
  function toast(msg){
    const el = $('#toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2300);
  }

  function renderWeightGrid(){
    $('#weightGrid').innerHTML = data.exam.areas.map(a => `
      <article class="weight-card" style="--bar:${AREA_COLOR[a.id]}">
        <div class="weight-score"><div><small>valor na prova</small><b>${a.maxPoints} pts</b></div><small>${a.share}%</small></div>
        <h4>${esc(a.label)}</h4>
        <div class="weight-meta">${a.questions} questões × peso ${a.weight}</div>
        <div class="weight-bar"><span style="width:${a.share}%"></span></div>
      </article>`).join('');
  }

  function renderSidebarAreas(){
    const total = data.topics.length;
    const items = [{id:'all', label:'Todas as áreas', weight:'100'}].concat(data.exam.areas.map(a => ({id:a.id,label:AREA_SHORT[a.id],weight:a.maxPoints})));
    $('#sidebarAreaFilters').innerHTML = items.map(a => {
      const count = a.id === 'all' ? total : data.topics.filter(t => t.area === a.id).length;
      return `<button class="filter-option ${filters.area===a.id?'active':''}" data-area-filter="${a.id}" type="button"><span>${esc(a.label)}</span><span>${a.id==='all'?count:a.weight+' pts'}</span></button>`;
    }).join('');
    $$('[data-area-filter]').forEach(btn => btn.addEventListener('click', () => {
      filters.area = btn.dataset.areaFilter; $('#areaSelect').value = filters.area; renderFilters();
    }));
  }

  function topicMatches(t){
    const st = topicState(t.id);
    if (filters.highYield && !['sus','especificos'].includes(t.area)) return false;
    if (filters.area !== 'all' && t.area !== filters.area) return false;
    if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
    if (filters.status === 'favoritos' && !st.favorite) return false;
    if (filters.status !== 'all' && filters.status !== 'favoritos' && st.status !== filters.status) return false;
    if (filters.unfinished && ['revisado','dominado'].includes(st.status)) return false;
    if (filters.search){
      const q = filters.search.toLocaleLowerCase('pt-BR');
      const hay = [t.id,t.title,t.summary,...t.flags,...t.subtopics,AREA_LABEL[t.area]].join(' ').toLocaleLowerCase('pt-BR');
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function renderTopics(){
    const list = data.topics.filter(topicMatches);
    $('#visibleCount').textContent = `${list.length} ${list.length===1?'tópico':'tópicos'}`;
    $('#mapResultText').textContent = filters.highYield ? `Foco SUS + Específicos: ${list.length} tópicos · 84 pontos` : (list.length === data.topics.length ? 'Mostrando todos os tópicos' : `Mostrando ${list.length} de ${data.topics.length} tópicos`);
    const grid = $('#topicGrid');
    if (!list.length){
      grid.innerHTML = `<div class="topic-empty">${icon('search','icon lg')}<br><strong>Nenhum tópico corresponde aos filtros.</strong><br>Limpe a busca ou altere os filtros.</div>`;
      return;
    }
    grid.innerHTML = list.map(t => {
      const st = topicState(t.id);
      const next = STATUS[(STATUS.indexOf(st.status)+1)%STATUS.length];
      return `<article class="topic-card" data-topic="${t.id}">
        <div class="topic-top"><span class="topic-code">${t.id} · ${esc(AREA_SHORT[t.area])}</span><span class="topic-priority ${t.priority}">${t.priority}</span></div>
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.summary)}</p>
        <div class="tag-row">${t.flags.slice(0,4).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
        <div class="topic-footer">
          <button class="status-btn ${st.status}" type="button" data-status-id="${t.id}" title="Clique para avançar para ${STATUS_LABEL[next]}">${icon(st.status==='novo'?'clock':'check')} ${STATUS_LABEL[st.status]}</button>
          <button class="icon-btn ${st.favorite?'active':''}" type="button" data-fav-id="${t.id}" aria-label="${st.favorite?'Remover dos favoritos':'Favoritar'}">${icon('star')}</button>
          <button class="icon-btn" type="button" data-open-id="${t.id}" aria-label="Abrir roteiro de ${esc(t.title)}">${icon('chevron')}</button>
        </div>
      </article>`;
    }).join('');
    $$('[data-status-id]',grid).forEach(btn => btn.addEventListener('click', () => cycleStatus(btn.dataset.statusId)));
    $$('[data-fav-id]',grid).forEach(btn => btn.addEventListener('click', () => {
      const id=btn.dataset.favId, st=topicState(id); setTopicState(id,{favorite:!st.favorite}); toast(!st.favorite?'Adicionado aos favoritos':'Removido dos favoritos');
    }));
    $$('[data-open-id]',grid).forEach(btn => btn.addEventListener('click', () => openTopic(btn.dataset.openId)));
  }

  function cycleStatus(id){
    const st=topicState(id); const next=STATUS[(STATUS.indexOf(st.status)+1)%STATUS.length];
    setTopicState(id,{status:next}); toast(`${id}: ${STATUS_LABEL[next]}`);
  }

  function counts(){
    const c={novo:0,estudando:0,revisado:0,dominado:0,favoritos:0};
    data.topics.forEach(t => {const st=topicState(t.id); c[st.status]++; if(st.favorite)c.favoritos++;});
    return c;
  }
  function renderProgress(){
    const c=counts(); const done=c.revisado+c.dominado; const pct=Math.round(done/data.topics.length*100);
    $('#progressPercent').textContent=pct+'%'; $('#progressLabel').textContent=`${done} de ${data.topics.length} tópicos`; $('#progressFill').style.width=pct+'%';
    $('#statusAllCount').textContent=data.topics.length; $('#statusNovoCount').textContent=c.novo; $('#statusEstudandoCount').textContent=c.estudando; $('#statusRevisadoCount').textContent=c.revisado; $('#statusDominadoCount').textContent=c.dominado; $('#statusFavCount').textContent=c.favoritos;
    $('#revNovo').textContent=c.novo; $('#revEstudando').textContent=c.estudando; $('#revRevisado').textContent=c.revisado; $('#revDominado').textContent=c.dominado;
    $('#areaProgressList').innerHTML=data.exam.areas.map(a => {
      const topics=data.topics.filter(t=>t.area===a.id); const d=topics.filter(t=>['revisado','dominado'].includes(topicState(t.id).status)).length; const p=Math.round(d/topics.length*100);
      return `<div class="area-progress"><b>${esc(a.label)}</b><div class="track"><div class="fill" style="width:${p}%"></div></div><span>${p}%</span></div>`;
    }).join('');
  }
  function renderStatusFilterActive(){
    $$('[data-status-filter]').forEach(b=>b.classList.toggle('active',b.dataset.statusFilter===filters.status));
  }
  function renderFilters(){
    renderSidebarAreas(); renderStatusFilterActive(); renderTopics();
  }
  function renderAllStateful(){ renderProgress(); renderFilters(); }

  function renderPlan(){
    const byId=Object.fromEntries(data.topics.map(t=>[t.id,t]));
    $('#planList').innerHTML=data.studyPlan.map(w=>{
      const focus=(w.topics||[]).map(id=>byId[id]).filter(Boolean);
      const maint=(w.maintenance||[]).map(id=>byId[id]).filter(Boolean);
      return `<article class="week-card">
        <div class="week-num"><div><span>semana</span><b>${w.week}</b></div></div>
        <div class="week-body"><h4>${esc(w.focus)}</h4><div class="week-topics">${focus.length?focus.map(t=>`<span class="week-chip">${t.id} · ${esc(t.title)}</span>`).join(''):'<span class="week-chip">Simulado de 40 questões + revisão do caderno de erros</span>'}</div><div class="week-maint"><strong>Manutenção:</strong> ${maint.map(t=>t.id+' · '+t.title).join(' · ')}</div></div>
        <span class="week-badge">${w.simulation?'simulado':'ciclo'}</span>
      </article>`;
    }).join('');
  }

  function renderScore(){
    $('#scoreForm').innerHTML=data.exam.areas.map(a=>`<div class="score-row">
      <label for="score-${a.id}">${esc(a.label)}</label>
      <input id="score-${a.id}" data-score-area="${a.id}" type="number" min="0" max="${a.questions}" step="1" value="0" inputmode="numeric">
      <small>× ${a.weight}</small>
      <output id="score-out-${a.id}">0 pts</output>
    </div>`).join('');
    $$('[data-score-area]').forEach(inp=>inp.addEventListener('input',calculateScore)); calculateScore();
  }
  function calculateScore(){
    let total=0;
    data.exam.areas.forEach(a=>{
      const inp=$(`#score-${a.id}`); if(!inp)return;
      let n=Math.max(0,Math.min(a.questions,parseInt(inp.value||'0',10)||0));
      if(String(n)!==inp.value && inp.value!=='') inp.value=n;
      const pts=n*a.weight; total+=pts; $(`#score-out-${a.id}`).textContent=`${pts} pts`;
    });
    $('#scoreNumber').textContent=total; $('#scoreMeter').style.width=Math.min(100,total)+'%';
    if(total===0){$('#scoreStatus').textContent='Preencha seus acertos'; $('#scoreHelp').textContent='O mínimo formal é 50% do total de pontos e a habilitação também depende da margem prevista no Anexo II.';}
    else if(total<50){$('#scoreStatus').textContent=`Faltam ${50-total} pontos para o mínimo formal`; $('#scoreHelp').textContent='Priorize os erros em Específicos e SUS: cada acerto nesses blocos vale 4 e 3 pontos, respectivamente.';}
    else if(total<70){$('#scoreStatus').textContent='Mínimo formal atingido'; $('#scoreHelp').textContent='A nota alcança 50/100, mas habilitação e classificação dependem da margem, empates e desempenho dos demais candidatos.';}
    else if(total<85){$('#scoreStatus').textContent='Faixa de desempenho forte'; $('#scoreHelp').textContent='Use o caderno de erros para transformar lacunas restantes em pontos e proteja os blocos de maior peso.';}
    else{$('#scoreStatus').textContent='Faixa de alto desempenho'; $('#scoreHelp').textContent='Mantenha consistência em simulados completos e revise legislação/normas sem abandonar os blocos críticos.';}
  }

  function renderTimeline(){
    const rows=[
      ['17/07/2026','Publicação do Edital 74/2026','Abertura do concurso e definição do conteúdo programático.',false],
      ['22/07/2026','Início das inscrições','Inscrição online no portal do IBAM.',false],
      ['20/08/2026','Fim das inscrições','Último dia do período informado na página oficial.',true],
      ['21/08/2026','Vencimento dos boletos','Prazo informado pelo IBAM para pagamento.',false],
      ['09/10/2026','Edital de Convocação previsto','Deve confirmar data, horário e locais da prova.',true],
      ['18/10/2026','Prova objetiva','40 questões · 3h30 · pesos de 1 a 4.',true],
      ['Após habilitação','Prova de Títulos','Convocação específica para envio dos documentos dos candidatos habilitados.',false]
    ];
    $('#timeline').innerHTML=rows.map(r=>`<div class="date-row ${r[3]?'important':''}"><div class="date-dot">${icon(r[3]?'calendar':'check')}</div><div class="date-value">${r[0]}</div><div class="date-info"><b>${r[1]}</b><span>${r[2]}</span></div></div>`).join('');
  }

  function renderSources(){
    const typeLabel={official:'Edital/IBAM',primary:'Fonte primária',municipal:'Fonte municipal'};
    $('#sourceGrid').innerHTML=data.sources.map(s=>`<a class="source-card" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span class="source-icon">${icon(s.type==='official'?'file':s.type==='municipal'?'book':'shield','icon lg')}</span><span><b>${esc(s.label)}</b><span>${esc(typeLabel[s.type]||s.type)}</span></span>${icon('external')}</a>`).join('');
  }

  function renderCountdown(){
    const now=new Date(); const exam=new Date(data.dates.objectiveExam+'T00:00:00');
    const day=86400000; const diff=Math.ceil((exam-now)/day); const el=$('#countdownValue');
    el.innerHTML=diff>0?`${diff} <span>${diff===1?'dia':'dias'}</span>`:'<span>data da prova alcançada</span>';
    const appEnd=new Date(data.dates.applicationEnd+'T23:59:59'); const pill=$('#applicationPill');
    if(now<=appEnd){const d=Math.max(0,Math.ceil((appEnd-now)/day)); pill.innerHTML=`${icon('calendar')}Inscrições: ${d===0?'último dia':d+' dias restantes'}`;}
    else pill.innerHTML=`${icon('calendar')}Inscrições encerradas`;
  }

  function renderGuideVig(g){
    const pillars = g.hero.pillars.map(p=>`<div class="vig-pillar"><b>${esc(p.t)}</b><span>${esc(p.d)}</span></div>`).join('');
    const sections = g.sections.map(s=>`<div class="vig-section"><div class="vig-section-head"><span class="vig-num">${esc(s.num)}</span><h3>${esc(s.title)}</h3></div><p class="vig-intro">${esc(s.intro)}</p><div class="vig-body"><div class="vig-items">${s.items.map(it=>`<div class="vig-item"><b>${esc(it.t)}</b><span>${esc(it.d)}</span></div>`).join('')}</div><img class="vig-img" src="${esc(s.image)}" alt="${esc(s.imageAlt)}" loading="lazy" decoding="async"></div></div>`).join('');
    const steps = g.flow.steps.map((st,i)=>`<div class="vig-step"><span class="vig-step-num">${i+1}</span><div><b>${esc(st.t)}</b><span>${esc(st.d)}</span></div></div>`).join('');
    const practice = g.practice.items.map(it=>`<div class="vig-item"><b>${esc(it.t)}</b><span>${esc(it.d)}</span></div>`).join('');
    const refs = g.references.map(r=>`<a class="vig-ref" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><span class="vig-ref-label">${esc(r.label)}</span><b>${esc(r.text)}</b><span class="vig-ref-arrow" aria-hidden="true">↗</span></a>`).join('');
    const keywords = g.keywords.map(k=>`<span class="keyword">${esc(k)}</span>`).join('');
    return `<div class="guide-vig">
      <div class="vig-hero"><span class="vig-kicker">${esc(g.hero.kicker)}</span><h3>${esc(g.hero.title)}</h3><p>${esc(g.hero.text)}</p><div class="vig-pillars">${pillars}</div></div>
      ${sections}
      <div class="vig-flow"><h3>${esc(g.flow.title)}</h3><div class="vig-steps">${steps}</div></div>
      <div class="vig-section"><div class="vig-section-head"><span class="vig-num">+</span><h3>${esc(g.practice.title)}</h3></div><div class="vig-items">${practice}</div></div>
      <div class="vig-section"><div class="vig-section-head"><span class="vig-num">↗</span><h3>Referências</h3></div><div class="vig-refs">${refs}</div></div>
      <div class="guide-keywords"><span class="keywords-label">Palavras-chave</span>${keywords}</div>
    </div>`;
  }

  function renderGuideAps(g){
    const badges = g.hero.badges.map(b=>`<span class="aps-badge">${esc(b)}</span>`).join('');
    const principles = g.principles.items.map(p=>`<div class="aps-prin"><b>${esc(p.t)}</b><span>${esc(p.d)}</span></div>`).join('');
    const directives = g.directives.items.map(d=>`<div class="aps-dir"><b>${esc(d.t)}</b><span>${esc(d.d)}</span></div>`).join('');
    const where = g.where.items.map(w=>`<span class="aps-chip">${esc(w)}</span>`).join('');
    const team = g.team.items.map(t=>`<div class="aps-team"><b>${esc(t)}</b></div>`).join('');
    const nursing = g.nursing.items.map(n=>`<div class="aps-dir"><b>${esc(n.t)}</b><span>${esc(n.d)}</span></div>`).join('');
    const determinants = g.determinants.items.map(d=>`<span class="aps-chip">${esc(d)}</span>`).join('');
    const keywords = g.keywords.map(k=>`<span class="keyword">${esc(k)}</span>`).join('');
    return `<div class="guide-aps">
      <div class="aps-hero"><span class="aps-kicker">${esc(g.hero.kicker)}</span><h3>${esc(g.hero.title)}</h3><p>${esc(g.hero.text)}</p><div class="aps-badges">${badges}</div></div>
      <div class="aps-section"><h3>${esc(g.principles.title)}</h3><div class="aps-prin-grid">${principles}</div></div>
      <div class="aps-section"><h3>${esc(g.directives.title)}</h3><div class="aps-dir-wrap"><img class="aps-dir-img" src="${esc(g.directives.image)}" alt="${esc(g.directives.imageAlt)}" loading="lazy" decoding="async"><div class="aps-dir-list">${directives}</div></div></div>
      <div class="aps-section"><h3>${esc(g.where.title)}</h3><div class="aps-chips">${where}</div></div>
      <div class="aps-section"><h3>${esc(g.team.title)}</h3><p class="aps-lead">${esc(g.team.text)}</p><div class="aps-team-grid">${team}</div></div>
      <div class="aps-note"><b>${esc(g.population.title)}</b><p>${esc(g.population.text)}</p></div>
      <div class="aps-section"><h3>${esc(g.nursing.title)}</h3><div class="aps-dir-list">${nursing}</div></div>
      <div class="aps-section"><h3>${esc(g.determinants.title)}</h3><p class="aps-lead">${esc(g.determinants.text)}</p><div class="aps-chips">${determinants}</div></div>
      <div class="guide-keywords"><span class="keywords-label">Palavras-chave</span>${keywords}</div>
    </div>`;
  }

  function renderGuideLei(g){
    const tln = g.timeline.map(s=>`<div class="tl-step"><span class="tl-year">${esc(s.t)}</span><p>${esc(s.d)}</p></div>`).join('');
    const groups = g.principles.groups.map(gr=>`<div class="prin-group"><div class="prin-head"><span>${esc(gr.label)}</span><b class="mnemonic">${esc(gr.mnemonic)}</b></div>${gr.items.map(it=>`<div class="prin-item"><b>${esc(it.t)}</b><span>${esc(it.d)}</span></div>`).join('')}</div>`).join('');
    const pyramid = g.pyramid.levels.map(l=>`<div class="pyr-level"><b>${esc(l.t)}</b><span>${esc(l.d)}</span></div>`).join('');
    const commCards = g.commissions.cards.map(c=>`<div class="comm-card"><b>${esc(c.t)}</b><span>${esc(c.d)}</span></div>`).join('');
    const fieldCards = g.fields.cards.map(c=>`<div class="comm-card field"><b>${esc(c.t)}</b><span>${esc(c.d)}</span></div>`).join('');
    const keywords = g.keywords.map(k=>`<span class="keyword">${esc(k)}</span>`).join('');
    return `<div class="guide-lei">
      <div class="gl-hero"><div class="gl-hero-txt"><span class="gl-kicker">${esc(g.hero.kicker)}</span><h3>${esc(g.hero.title)}</h3><p>${esc(g.hero.text)}</p></div><img class="gl-hero-img" src="${esc(g.hero.image)}" alt="${esc(g.hero.imageAlt)}" loading="lazy" decoding="async"></div>
      <div class="gl-timeline">${tln}</div>
      <div class="gl-section"><h3>${esc(g.principles.title)}</h3><div class="prin-grid">${groups}</div></div>
      <div class="gl-section"><h3>${esc(g.pyramid.title)}</h3><div class="pyr">${pyramid}</div></div>
      <div class="gl-note gl-note-primary"><b>${esc(g.primary.title)}</b><p>${esc(g.primary.text)}</p></div>
      <div class="gl-section"><h3>${esc(g.commissions.title)}</h3><p class="gl-lead">${esc(g.commissions.text)}</p><div class="comm-grid">${commCards}</div></div>
      <div class="gl-note"><b>${esc(g.financing.title)}</b><p>${esc(g.financing.text)}</p></div>
      <div class="gl-section"><h3>${esc(g.fields.title)}</h3><p class="gl-lead">${esc(g.fields.text)}</p><div class="comm-grid">${fieldCards}</div></div>
      <div class="gl-note"><b>${esc(g.private.title)}</b><p>${esc(g.private.text)}</p></div>
      <div class="gl-alert"><b>${esc(g.pegadinha.title)}</b><p>${esc(g.pegadinha.text)}</p></div>
      <a class="gl-ref" href="${esc(g.reference.url)}" target="_blank" rel="noopener noreferrer"><span class="gl-ref-label">${esc(g.reference.label)}</span><b>${esc(g.reference.text)}</b><span class="gl-ref-arrow" aria-hidden="true">↗</span></a>
      <div class="guide-keywords"><span class="keywords-label">Palavras-chave e mnemônicos</span>${keywords}</div>
    </div>`;
  }

  function renderGuide(g){
    if(!g) return '';
    const flowCol = (col, side) => `<div class="flow-col ${side}"><div class="flow-label">${esc(col.label)}</div>${col.items.map((it,i)=>`<div class="flow-node"><b>${esc(it.t)}</b><span>${esc(it.d)}</span></div>${i<col.items.length-1?'<div class="flow-arrow" aria-hidden="true">↓</div>':''}`).join('')}</div>`;
    const miniCards = g.articles.map(a=>`<div class="mini-card"><span class="mini-n">${esc(a.n)}</span><div><b>${esc(a.t)}</b><p>${esc(a.d)}</p></div></div>`).join('');
    const guarantees = g.guarantees ? `<div class="guide-guarantees"><h3>${esc(g.guarantees.title)}</h3><div class="guarantee-list">${g.guarantees.items.map(it=>`<div class="guarantee-item"><b>${esc(it.t)}</b><span>${esc(it.d)}</span></div>`).join('')}</div></div>` : '';
    const ref = g.reference ? `<div class="guide-ref"><span class="guide-ref-label">${esc(g.reference.label)}</span><p>${esc(g.reference.text)} Disponível em: <a href="${esc(g.reference.url)}" target="_blank" rel="noopener noreferrer">${esc(g.reference.url)}</a>. ${esc(g.reference.access)}</p></div>` : '';
    const keywords = g.keywords.map(k=>`<span class="keyword">${esc(k)}</span>`).join('');
    return `<div class="guide">
      <div class="guide-intro">${g.intro.map(p=>`<p>${esc(p)}</p>`).join('')}</div>
      <div class="flow-wrap"><div class="flow-title">${esc(g.flowTitle)}</div><div class="flow">${flowCol(g.flowBefore,'before')}<div class="flow-sep" aria-hidden="true">→</div>${flowCol(g.flowAfter,'after')}</div></div>
      <figure class="guide-figure"><img src="${esc(g.figure.src)}" alt="${esc(g.figure.alt)}" loading="lazy" decoding="async"><figcaption>${esc(g.figure.caption)}</figcaption></figure>
      ${guarantees}
      <div class="guide-articles"><h3>${esc(g.articlesTitle)}</h3><div class="mini-grid">${miniCards}</div></div>
      ${ref}
      <div class="guide-keywords"><span class="keywords-label">Palavras-chave</span>${keywords}</div>
    </div>`;
  }

  function openTopic(id){
    const t=data.topics.find(x=>x.id===id); if(!t)return;
    $('#modalKicker').textContent=`${t.id} · ${AREA_LABEL[t.area]} · prioridade ${t.priority}`; $('#modalTitle').textContent=t.title;
    let guideHtml='';
    if(t.guide){
      try { const R={lei:renderGuideLei,aps:renderGuideAps,vig:renderGuideVig}; guideHtml = t.guide.layout&&R[t.guide.layout] ? R[t.guide.layout](t.guide) : renderGuide(t.guide); }
      catch(e) { guideHtml=''; }
    }
    const gridHtml = t.guide ? '' : `<div class="modal-grid"><div class="modal-box"><h3>O que revisar neste núcleo</h3><ul class="bullet-list">${t.subtopics.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div><div class="modal-box"><h3>Contrato editorial — 10 capítulos</h3><div class="chapter-list">${data.articleContract.chapters.map((c,i)=>`<div class="chapter"><b>${i+1}</b><span>${esc(c.replace(/^\d+\.\s*/,''))}</span></div>`).join('')}</div></div></div>`;
    $('#modalBody').innerHTML=`<div class="notice" style="margin-bottom:14px">${icon('info','icon lg')}<div><strong>Escopo:</strong> ${esc(t.summary)}</div></div>${guideHtml}${gridHtml}`;
    $('#topicModal').classList.add('open'); document.body.classList.add('no-scroll'); $('#closeModal').focus();
  }
  function closeTopic(){ $('#topicModal').classList.remove('open'); document.body.classList.remove('no-scroll'); }

  function switchTab(id, updateHash=true){
    const panel=$(`[data-panel="${id}"]`); if(!panel)return;
    $$('.panel').forEach(p=>p.classList.toggle('active',p===panel)); $$('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
    if(updateHash) history.replaceState(null,'','#'+id);
    if(id==='mapa') setTimeout(()=>$('#topicSearch')?.focus({preventScroll:true}),50);
    window.scrollTo({top:Math.max(0,$('.study-tabs').offsetTop-66),behavior:'smooth'});
  }

  function bindTabs(){
    $$('.tab-btn').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
    $$('[data-quick-tab]').forEach(b=>b.addEventListener('click',()=>{
      const area=b.dataset.quickArea; if(area){filters.area=area; $('#areaSelect').value=area; renderFilters();} switchTab(b.dataset.quickTab);
    }));
    $('#focusMapBtn').addEventListener('click',()=>switchTab('mapa'));
    const hash=location.hash.replace('#',''); if($(`[data-panel="${hash}"]`)) switchTab(hash,false);
  }

  function bindFilters(){
    $('#topicSearch').addEventListener('input',e=>{filters.search=e.target.value.trim(); filters.highYield=false; if(filters.search) switchTab('mapa'); renderTopics();});
    $('#areaSelect').addEventListener('change',e=>{filters.area=e.target.value; filters.highYield=false; renderFilters();});
    $('#prioritySelect').addEventListener('change',e=>{filters.priority=e.target.value; filters.highYield=false; renderFilters();});
    $$('[data-status-filter]').forEach(b=>b.addEventListener('click',()=>{filters.status=b.dataset.statusFilter; renderFilters();}));
    $('#highYieldBtn').addEventListener('click',()=>{filters.area='all';filters.priority='all';filters.status='all';filters.search='';filters.unfinished=false;filters.highYield=true;$('#areaSelect').value='all';$('#prioritySelect').value='all';$('#topicSearch').value='';switchTab('mapa');renderFilters();});
    $('#criticalBtn').addEventListener('click',()=>{filters.priority='critica';filters.highYield=false;$('#prioritySelect').value='critica';switchTab('mapa');renderFilters();});
    $('#clearFilters').addEventListener('click',clearFilters);
    $('#showUnfinished').addEventListener('click',()=>{filters.unfinished=!filters.unfinished;$('#showUnfinished').classList.toggle('primary',filters.unfinished);renderTopics();});
  }
  function clearFilters(){
    filters={area:'all',priority:'all',status:'all',search:'',unfinished:false,highYield:false}; $('#areaSelect').value='all'; $('#prioritySelect').value='all'; $('#topicSearch').value=''; $('#showUnfinished').classList.remove('primary'); renderFilters(); toast('Filtros limpos');
  }

  function bindSidebarMobile(){
    const side=$('#sidebar'), ov=$('#overlay');
    const open=()=>{side.classList.add('open');ov.classList.add('open');document.body.classList.add('no-scroll')};
    const close=()=>{side.classList.remove('open');ov.classList.remove('open');document.body.classList.remove('no-scroll')};
    $('#openFilters').addEventListener('click',open); $('#closeFilters').addEventListener('click',close); ov.addEventListener('click',close);
  }

  function bindNotes(){
    const ta=$('#studyNotes'); ta.value=localStorage.getItem(NOTES_KEY)||'';
    let t; ta.addEventListener('input',()=>{clearTimeout(t);$('#notesStatus').textContent='Salvando…';t=setTimeout(()=>{localStorage.setItem(NOTES_KEY,ta.value);$('#notesStatus').textContent='Salvo localmente.';},350)});
    $('#copyNotes').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(ta.value);toast('Notas copiadas');}catch{ta.select();document.execCommand('copy');toast('Notas copiadas');}});
  }

  let timerSeconds=25*60, timerId=null;
  function timerRender(){const m=Math.floor(timerSeconds/60),s=timerSeconds%60;$('#timerValue').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;document.title=timerId?`${$('#timerValue').textContent} · Santos Enfermeiro`:'Concurso Santos 2026 — Enfermeiro: Guia do Edital 74/2026';}
  function bindTimer(){
    $('#timerStart').addEventListener('click',()=>{if(timerId)return;timerId=setInterval(()=>{timerSeconds--;timerRender();if(timerSeconds<=0){clearInterval(timerId);timerId=null;timerSeconds=25*60;timerRender();toast('Sessão concluída — registre o que aprendeu e seus erros.');}},1000)});
    $('#timerPause').addEventListener('click',()=>{clearInterval(timerId);timerId=null;timerRender()});
    $('#timerReset').addEventListener('click',()=>{clearInterval(timerId);timerId=null;timerSeconds=25*60;timerRender()}); timerRender();
  }

  function bindActions(){
    $('#printBtn').addEventListener('click',()=>window.print());
    $('#exportBtn').addEventListener('click',()=>{
      const payload={schemaVersion:'1.0.0',examId:data.id,exportedAt:new Date().toISOString(),progress:saved,notes:localStorage.getItem(NOTES_KEY)||''};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='progresso-concurso-santos-enfermeiro-2026.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500); toast('Progresso exportado');
    });
    $('#resetProgress').addEventListener('click',()=>{if(confirm('Apagar todo o progresso e favoritos deste concurso neste navegador?')){saved={topics:{}};persist();renderAllStateful();toast('Progresso reiniciado');}});
    $('#closeModal').addEventListener('click',closeTopic); $('#topicModal').addEventListener('click',e=>{if(e.target.id==='topicModal')closeTopic()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeTopic();$('#sidebar').classList.remove('open');$('#overlay').classList.remove('open');document.body.classList.remove('no-scroll')}});
  }

  function init(){
    renderWeightGrid(); renderPlan(); renderScore(); renderTimeline(); renderSources(); renderCountdown(); renderAllStateful(); bindTabs(); bindFilters(); bindSidebarMobile(); bindNotes(); bindTimer(); bindActions();
  }
  init();
})();
