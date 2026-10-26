/* Calculadoras de Enfermagem — Matriz de Risco 5x5
   Pontuação ilustrativa de priorização, NÃO uma fórmula exigida pela ISO 31000.
   Os dados ficam no navegador; nenhum dado de paciente deve ser registrado. */
(function () {
  'use strict';
  const KEY = 'calculadoras_enfermagem_matriz_risco_v1';
  const PROB = ['', 'Rara', 'Improvável', 'Possível', 'Provável', 'Quase certa'];
  const IMPACT = ['', 'Insignificante', 'Pequeno', 'Moderado', 'Grave', 'Catastrófico'];
  const LEVELS = {
    baixo: { label: 'Baixo', priority: 'Monitorar e manter controles' },
    medio: { label: 'Médio', priority: 'Planejar melhorias e acompanhar' },
    alto: { label: 'Alto', priority: 'Priorizar tratamento e definir responsáveis' },
    critico: { label: 'Crítico', priority: 'Prioridade máxima; avaliar medidas imediatas' }
  };
  const $ = id => document.getElementById(id);
  let risks = [];
  let activeFilter = 'all';
  let selectedCell = null;
  let editingId = null;
  let lastFocus = null;

  const scoreOf = r => Number(r.probability) * Number(r.impact);
  function levelOf(score) {
    if (score <= 4) return 'baixo';
    if (score <= 9) return 'medio';
    if (score <= 16) return 'alto';
    return 'critico';
  }
  function uid() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'risco-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }
  function validDate(v) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '';
  }
  function normalise(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const p = Number(raw.probability), i = Number(raw.impact);
    const title = String(raw.title || '').trim().slice(0, 120);
    if (!title || !Number.isInteger(p) || p < 1 || p > 5 || !Number.isInteger(i) || i < 1 || i > 5) return null;
    return {
      id: String(raw.id || uid()).slice(0, 120),
      title,
      category: String(raw.category || 'Outros').slice(0, 70),
      probability: p,
      impact: i,
      description: String(raw.description || '').slice(0, 1000),
      actions: String(raw.actions || '').slice(0, 1000),
      owner: String(raw.owner || '').slice(0, 100),
      dueDate: validDate(raw.dueDate),
      status: ['Identificado', 'Em tratamento', 'Monitorado', 'Controlado'].includes(raw.status) ? raw.status : 'Identificado',
      createdAt: String(raw.createdAt || new Date().toISOString()).slice(0, 32)
    };
  }
  function toast(message, kind) {
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || 'success');
    el.textContent = message;
    el.setAttribute('role', 'status');
    $('toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 4400);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ version: 1, risks })); return true; }
    catch (error) { toast('Não foi possível salvar no navegador. Exporte seus dados para não perdê-los.', 'error'); return false; }
  }
  function load() {
    try {
      const payload = JSON.parse(localStorage.getItem(KEY) || 'null');
      const arr = Array.isArray(payload) ? payload : payload && payload.risks;
      if (Array.isArray(arr)) risks = arr.slice(0, 500).map(normalise).filter(Boolean);
    } catch (error) { risks = []; toast('Os dados salvos não puderam ser lidos. Nenhum registro foi apagado.', 'warning'); }
  }
  function elt(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function append(parent, tag, cls, text) {
    const child = elt(tag, cls, text);
    parent.appendChild(child);
    return child;
  }
  function badge(label, cls) {
    return elt('span', 'risk-badge ' + cls, label);
  }
  function scoreLabels(r) {
    return 'Probabilidade ' + r.probability + ' (' + PROB[r.probability] + ') × impacto ' + r.impact + ' (' + IMPACT[r.impact] + ')';
  }
  function makeMedioStat() {
    if ($('statMedio')) return;
    const card = elt('div', 'stat-card');
    const icon = append(card, 'div', 'stat-icon yellow', '●');
    icon.setAttribute('aria-hidden', 'true');
    const val = append(card, 'div', 'stat-value', '0');
    val.id = 'statMedio';
    append(card, 'div', 'stat-label', 'Riscos Médios');
    const total = $('statsGrid');
    total.insertBefore(card, total.children[2] || null);
  }
  function renderStats() {
    const counts = { baixo: 0, medio: 0, alto: 0, critico: 0 };
    risks.forEach(r => { counts[levelOf(scoreOf(r))]++; });
    $('statTotal').textContent = risks.length;
    $('statBaixo').textContent = counts.baixo;
    $('statMedio').textContent = counts.medio;
    $('statAlto').textContent = counts.alto;
    $('statCritico').textContent = counts.critico;
  }
  function matrix() {
    const box = $('matrixContainer');
    box.replaceChildren();
    const first = elt('div', 'axis-label-cell matrix-corner', 'Impacto ↓');
    first.title = 'A probabilidade aumenta da esquerda para a direita; o impacto aumenta de baixo para cima.';
    box.appendChild(first);
    for (let p = 1; p <= 5; p++) {
      const item = elt('div', 'axis-label-cell prob-label');
      append(item, 'span', 'num', p);
      append(item, 'span', 'txt', PROB[p]);
      box.appendChild(item);
    }
    for (let i = 5; i >= 1; i--) {
      const axis = elt('div', 'axis-label-cell sev-label');
      append(axis, 'span', 'num', i);
      append(axis, 'span', 'txt', IMPACT[i]);
      box.appendChild(axis);
      for (let p = 1; p <= 5; p++) {
        const score = i * p, lv = levelOf(score);
        const count = risks.filter(r => r.probability === p && r.impact === i).length;
        const isSelected = !!selectedCell && selectedCell.probability === p && selectedCell.impact === i;
        const cell = elt('button', 'matrix-cell level-' + lv + (isSelected ? ' selected' : ''));
        cell.type = 'button';
        cell.setAttribute('aria-pressed', String(isSelected));
        cell.setAttribute('aria-label', 'Probabilidade ' + p + ' (' + PROB[p] + '), impacto ' + i + ' (' + IMPACT[i] + '), pontuação ' + score + ', nível ' + LEVELS[lv].label + ', ' + count + ' riscos. ' + (isSelected ? 'Desativar filtro' : 'Filtrar esta célula'));
        append(cell, 'span', 'cell-score', score);
        append(cell, 'span', 'cell-level', LEVELS[lv].label);
        if (count) append(cell, 'span', 'cell-count', count);
        cell.addEventListener('click', () => {
          selectedCell = isSelected ? null : { probability: p, impact: i };
          render();
        });
        box.appendChild(cell);
      }
    }
    const clear = $('clearMatrixSelection');
    if (clear) {
      const active = selectedCell !== null;
      clear.hidden = !active;
      clear.textContent = active ? 'Limpar seleção da matriz (' + selectedCell.probability + ' × ' + selectedCell.impact + ')' : 'Limpar seleção';
    }
  }
  function selectedRisks() {
    let list = risks.slice();
    if (activeFilter !== 'all') list = list.filter(r => levelOf(scoreOf(r)) === activeFilter);
    if (selectedCell) list = list.filter(r => r.probability === selectedCell.probability && r.impact === selectedCell.impact);
    return list.sort((a, b) => scoreOf(b) - scoreOf(a) || String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  function displayDate(date) {
    if (!date) return '';
    const parts = date.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }
  function riskCard(r) {
    const lv = levelOf(scoreOf(r));
    const article = elt('article', 'risk-item risk-' + lv);
    const header = append(article, 'div', 'risk-item-header');
    const info = append(header, 'div', 'risk-heading');
    append(info, 'h3', 'risk-item-title', r.title);
    const meta = append(info, 'div', 'risk-item-meta');
    append(meta, 'span', '', r.category);
    append(meta, 'span', '', scoreLabels(r));
    header.appendChild(badge(LEVELS[lv].label, lv));
    const body = append(article, 'div', 'risk-item-body');
    if (r.description) append(body, 'p', 'risk-description', r.description);
    append(body, 'p', 'risk-guidance', 'Prioridade: ' + LEVELS[lv].priority + '.');
    if (r.actions) append(body, 'p', 'risk-actions-text', 'Plano de ação: ' + r.actions);
    const detail = append(body, 'p', 'risk-detail', 'Situação: ' + r.status +
      (r.owner ? ' · Responsável: ' + r.owner : '') +
      (r.dueDate ? ' · Prazo: ' + displayDate(r.dueDate) : ''));
    detail.setAttribute('aria-label', detail.textContent);
    const foot = append(article, 'div', 'risk-item-footer');
    const score = append(foot, 'div', 'risk-score-display');
    const circle = append(score, 'span', 'score-circle ' + lv, scoreOf(r));
    circle.setAttribute('aria-label', 'Pontuação de risco ' + scoreOf(r));
    const tools = append(foot, 'div', 'risk-tools');
    const edit = append(tools, 'button', 'btn btn-secondary btn-sm', 'Editar');
    edit.type = 'button';
    edit.setAttribute('aria-label', 'Editar risco ' + r.title);
    edit.addEventListener('click', () => openEditor(r.id));
    const del = append(tools, 'button', 'btn btn-danger btn-sm', 'Excluir');
    del.type = 'button';
    del.setAttribute('aria-label', 'Excluir risco ' + r.title);
    del.addEventListener('click', () => {
      if (!confirm('Excluir o risco "' + r.title + '"?')) return;
      risks = risks.filter(item => item.id !== r.id);
      save(); render(); toast('Risco excluído.');
    });
    return article;
  }
  function renderList() {
    const list = selectedRisks(), root = $('riskList');
    root.replaceChildren();
    list.forEach(r => root.appendChild(riskCard(r)));
    $('emptyState').style.display = list.length ? 'none' : 'block';
    const emptyTitle = $('emptyState').querySelector('h3');
    const emptyMsg = $('emptyState').querySelector('p');
    emptyTitle.textContent = risks.length ? 'Nenhum risco corresponde aos filtros' : 'Nenhum risco cadastrado';
    emptyMsg.textContent = risks.length ? 'Escolha outro nível ou limpe a seleção da matriz.' : 'Clique em “Adicionar risco” para começar.';
    const info = $('riskCountText');
    if (info) info.textContent = 'Exibindo ' + list.length + ' de ' + risks.length + ' riscos, por ordem decrescente de pontuação.';
    document.querySelectorAll('[data-filter]').forEach(btn => {
      const active = btn.dataset.filter === activeFilter;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }
  function renderSummary() {
    const body = $('summaryTableBody');
    body.replaceChildren();
    const groups = new Map();
    risks.forEach(r => {
      const key = r.category.trim() || 'Outros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });
    if (groups.size === 0) {
      const row = append(body, 'tr');
      const td = append(row, 'td', '', 'Cadastre um risco para visualizar o resumo.');
      td.colSpan = 7;
      return;
    }
    Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(name => {
      const items = groups.get(name);
      const count = lv => items.filter(r => levelOf(scoreOf(r)) === lv).length;
      const row = append(body, 'tr');
      [name, items.length, count('baixo'), count('medio'), count('alto'), count('critico'), Math.max(...items.map(scoreOf))].forEach(value => append(row, 'td', '', value));
    });
  }
  function render() { renderStats(); matrix(); renderList(); renderSummary(); }
  function editorHtml() {
    return '<form id="riskForm" class="risk-form">' +
      '<div class="form-group"><label class="form-label" for="riskTitle">Risco identificado *</label><input class="form-input" id="riskTitle" maxlength="120" required placeholder="Ex.: Falha na identificação do paciente"></div>' +
      '<div class="form-row"><div class="form-group"><label class="form-label" for="riskCategory">Categoria *</label><select class="form-select" id="riskCategory" required><option>Segurança do paciente</option><option>Medicamentos</option><option>Assistência</option><option>Processos</option><option>Infraestrutura</option><option>Saúde do trabalhador</option><option>Tecnologia</option><option>Outros</option></select></div>' +
      '<div class="form-group"><label class="form-label" for="riskStatus">Situação</label><select class="form-select" id="riskStatus"><option>Identificado</option><option>Em tratamento</option><option>Monitorado</option><option>Controlado</option></select></div></div>' +
      '<div class="form-row"><div class="form-group"><label class="form-label" for="riskProbability">Probabilidade (1–5) *</label><select class="form-select" id="riskProbability" required>' +
      PROB.slice(1).map((label, n) => '<option value="' + (n + 1) + '">' + (n + 1) + ' — ' + label + '</option>').join('') + '</select></div>' +
      '<div class="form-group"><label class="form-label" for="riskImpact">Impacto (1–5) *</label><select class="form-select" id="riskImpact" required>' +
      IMPACT.slice(1).map((label, n) => '<option value="' + (n + 1) + '">' + (n + 1) + ' — ' + label + '</option>').join('') + '</select></div></div>' +
      '<p id="previewScore" class="score-preview" role="status" aria-live="polite"></p>' +
      '<div class="form-group"><label class="form-label" for="riskDescription">Descrição e possíveis consequências</label><textarea class="form-textarea" id="riskDescription" maxlength="1000" placeholder="Descreva o evento, sua causa e os efeitos possíveis. Não insira dados pessoais."></textarea></div>' +
      '<div class="form-group"><label class="form-label" for="riskActions">Medidas de controle / plano de ação</label><textarea class="form-textarea" id="riskActions" maxlength="1000" placeholder="Defina medidas preventivas ou de mitigação e como acompanhar o resultado."></textarea></div>' +
      '<div class="form-row"><div class="form-group"><label class="form-label" for="riskOwner">Responsável (função ou setor)</label><input class="form-input" id="riskOwner" maxlength="100" placeholder="Ex.: Coordenação de enfermagem"></div>' +
      '<div class="form-group"><label class="form-label" for="riskDueDate">Prazo para revisão</label><input class="form-input" id="riskDueDate" type="date"></div></div>' +
      '<p class="form-hint">A pontuação é uma prioridade ilustrativa, não uma probabilidade percentual nem uma validação clínica.</p></form>';
  }
  function preview() {
    const p = Number($('riskProbability').value), i = Number($('riskImpact').value);
    const score = p * i, lv = levelOf(score);
    const el = $('previewScore');
    el.textContent = 'Pontuação: ' + p + ' × ' + i + ' = ' + score + ' · ' + LEVELS[lv].label + ' — ' + LEVELS[lv].priority;
    el.className = 'score-preview risk-' + lv;
  }
  function closeEditor() {
    $('modalOverlay').classList.remove('active');
    $('modalOverlay').setAttribute('aria-hidden', 'true');
    document.body.classList.remove('risk-modal-open');
    editingId = null;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function openEditor(id) {
    editingId = id || null;
    const risk = risks.find(r => r.id === editingId);
    lastFocus = document.activeElement;
    $('modalTitle').textContent = risk ? 'Editar risco' : 'Adicionar risco';
    $('modalSaveBtn').lastChild.textContent = risk ? ' Salvar alterações' : ' Salvar risco';
    $('modalBody').innerHTML = editorHtml();
    if (risk) {
      const fields = { riskTitle: 'title', riskCategory: 'category', riskStatus: 'status', riskProbability: 'probability', riskImpact: 'impact', riskDescription: 'description', riskActions: 'actions', riskOwner: 'owner', riskDueDate: 'dueDate' };
      Object.keys(fields).forEach(key => { $(key).value = risk[fields[key]] || ''; });
    } else {
      $('riskProbability').value = '1';
      $('riskImpact').value = '1';
    }
    $('riskProbability').addEventListener('change', preview);
    $('riskImpact').addEventListener('change', preview);
    $('riskForm').addEventListener('submit', e => { e.preventDefault(); submitEditor(); });
    preview();
    $('modalOverlay').classList.add('active');
    $('modalOverlay').setAttribute('aria-hidden', 'false');
    document.body.classList.add('risk-modal-open');
    $('riskTitle').focus();
  }
  function submitEditor() {
    const form = $('riskForm');
    if (!form.reportValidity()) return;
    const old = risks.find(r => r.id === editingId);
    const record = normalise({
      id: old ? old.id : uid(),
      title: $('riskTitle').value,
      category: $('riskCategory').value,
      status: $('riskStatus').value,
      probability: Number($('riskProbability').value),
      impact: Number($('riskImpact').value),
      description: $('riskDescription').value,
      actions: $('riskActions').value,
      owner: $('riskOwner').value,
      dueDate: $('riskDueDate').value,
      createdAt: old ? old.createdAt : new Date().toISOString()
    });
    if (!record) { toast('Confira o título e as escalas de 1 a 5.', 'error'); return; }
    if (old) risks = risks.map(r => r.id === old.id ? record : r);
    else risks.push(record);
    save();
    closeEditor();
    render();
    toast(old ? 'Risco atualizado.' : 'Risco cadastrado.');
  }
  function csvCell(value) {
    let v = String(value === null || value === undefined ? '' : value);
    if (/^\s*[=+\-@\t\r]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  }
  function download(filename, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function exportJSON() {
    const data = { version: 1, exportedAt: new Date().toISOString(), methodology: 'Probabilidade (1-5) × Impacto (1-5); faixas ilustrativas', risks };
    download('matriz-de-risco.json', 'application/json;charset=utf-8', JSON.stringify(data, null, 2));
    toast('Arquivo JSON preparado.');
  }
  function exportCSV() {
    const fields = [
      ['title', 'Risco'], ['category', 'Categoria'], ['probability', 'Probabilidade (1-5)'],
      ['impact', 'Impacto (1-5)'], ['score', 'Pontuação'], ['level', 'Classificação'],
      ['status', 'Situação'], ['description', 'Descrição'], ['actions', 'Plano de ação'],
      ['owner', 'Responsável'], ['dueDate', 'Prazo']
    ];
    const rows = [fields.map(x => csvCell(x[1])).join(';')];
    risks.forEach(r => {
      rows.push(fields.map(f => {
        const v = f[0] === 'score' ? scoreOf(r) : f[0] === 'level' ? LEVELS[levelOf(scoreOf(r))].label : r[f[0]];
        return csvCell(v);
      }).join(';'));
    });
    download('matriz-de-risco.csv', 'text/csv;charset=utf-8', '\uFEFF' + rows.join('\r\n'));
    toast('Arquivo CSV preparado.');
  }
  async function importJSON(event) {
    const input = event.target, file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) { toast('Arquivo grande demais (máximo 1 MB).', 'error'); return; }
    try {
      const decoded = JSON.parse(await file.text());
      const records = Array.isArray(decoded) ? decoded : decoded && decoded.risks;
      if (!Array.isArray(records) || records.length > 500) throw Error('Formato ou quantidade inválidos');
      const clean = records.map(normalise);
      if (clean.some(x => x === null)) throw Error('Há registros inválidos (probabilidade/impacto devem ser de 1 a 5)');
      const unique = new Set();
      clean.forEach(r => { if (unique.has(r.id)) r.id = uid(); unique.add(r.id); });
      if (!confirm('Substituir os ' + risks.length + ' riscos locais pelos ' + clean.length + ' registros deste arquivo? Exporte um backup antes se necessário.')) return;
      risks = clean;
      activeFilter = 'all'; selectedCell = null;
      save(); render(); toast('Arquivo importado com sucesso.');
    } catch (e) { toast('Importação cancelada: ' + e.message, 'error'); }
  }
  function init() {
    const necessary = ['matrixContainer','statsGrid','riskList','summaryTableBody','modalOverlay','modalBody','modalSaveBtn','btnAddRisk','filterBar','btnExportCsv','btnExportJson','btnClearAll'];
    if (necessary.some(id => !$(id))) { console.error('Matriz de risco: elementos obrigatórios ausentes.'); return; }
    makeMedioStat();
    load();
    $('btnAddRisk').addEventListener('click', () => openEditor());
    $('modalCloseBtn').addEventListener('click', closeEditor);
    $('modalCancelBtn').addEventListener('click', closeEditor);
    $('modalSaveBtn').addEventListener('click', submitEditor);
    $('modalOverlay').addEventListener('click', e => { if (e.target === $('modalOverlay')) closeEditor(); });
    document.addEventListener('keydown', e => {
      if (!$('modalOverlay').classList.contains('active')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeEditor(); }
      if (e.key === 'Tab') {
        const tabbable = Array.from($('modalOverlay').querySelectorAll('button,input,select,textarea')).filter(el => !el.disabled && el.offsetParent !== null);
        if (!tabbable.length) return;
        const first = tabbable[0], last = tabbable[tabbable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    $('filterBar').addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      activeFilter = btn.dataset.filter; render();
    });
    $('btnClearAll').addEventListener('click', () => {
      if (!risks.length) { toast('Não existem riscos cadastrados.', 'warning'); return; }
      if (!confirm('Excluir TODOS os riscos cadastrados neste navegador? A ação não pode ser desfeita sem um backup.')) return;
      risks = []; selectedCell = null; activeFilter = 'all'; save(); render(); toast('Matriz limpa.');
    });
    $('btnExportCsv').addEventListener('click', exportCSV);
    $('btnExportJson').addEventListener('click', exportJSON);
    if ($('btnImportJson') && $('importRiskFile')) {
      $('btnImportJson').addEventListener('click', () => $('importRiskFile').click());
      $('importRiskFile').addEventListener('change', importJSON);
    }
    if ($('clearMatrixSelection')) $('clearMatrixSelection').addEventListener('click', () => { selectedCell = null; render(); });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
