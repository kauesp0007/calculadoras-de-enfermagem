(function () {
  'use strict';
  const card = document.getElementById('escalaTutorial');
  const launch = document.getElementById('escalaTutorialAbrir');
  if (!card || !launch) return;
  const title = document.getElementById('escalaTutorialTitulo');
  const text = document.getElementById('escalaTutorialTexto');
  const progress = document.getElementById('escalaTutorialPasso');
  const previous = document.getElementById('escalaTutorialAnterior');
  const next = document.getElementById('escalaTutorialProximo');
  const seenKey = 'escala12x36:tutorial:v1:fechado';
  const steps = [
    ['#configMes', '1. Configure o período', 'No card 1, escolha o mês, o ano, a data, o setor e informe a instituição. Os cabeçalhos e o calendário das tabelas acompanham essas configurações.'],
    ['#escalaEquipes', '2. Escolha as equipes', 'Marque as equipes que deseja visualizar: Dia Par, Dia Ímpar, Noite Par e Noite Ímpar. As tabelas aparecem abaixo do card 3, mesmo antes de cadastrar colaboradores.'],
    ['#staffNome', '3. Informe o colaborador', 'No card 2, preencha nome, função e COREN. Escolha o turno diurno ou noturno e o plantão par ou ímpar para definir a tabela desse colaborador.'],
    ['#staffQtdFolgas', '4. Defina as folgas', 'Selecione a quantidade de folgas e informe os dias do mês nos campos que aparecem. Confira se os dias correspondem ao mês e ao plantão do colaborador.'],
    ['#escalaAfastamentos', '5. Registre afastamentos', 'Se houver férias, auxílio doença ou licença maternidade no mês, marque a opção correspondente. Caso contrário, mantenha Nenhum.'],
    ['#btnAddStaff', '6. Adicione à equipe', 'Clique em ADICIONAR para cadastrar. O colaborador aparecerá somente na tabela do turno e do plantão escolhidos. Repita para cada pessoa. LIMPAR remove o último cadastro.'],
    ['#unidadeLeitos', '7. Preencha a ocupação', 'No card 3, informe o total de leitos e os pacientes internados para atualizar a taxa de ocupação. Esses campos não mudam a equipe dos colaboradores.'],
    ['#escalasContainer', '8. Confira as tabelas', 'As tabelas ficam logo abaixo do card 3. Confira cada equipe, os dias e as folgas; use a rolagem horizontal para visualizar todo o mês em telas menores. Consulte a legenda abaixo.'],
    ['#btnGerarPDF', '9. Finalize a escala', 'Revise os dados e use os botões de PDF ou impressão conforme o acesso da sua conta. Você pode fechar este tutorial a qualquer momento e reabri-lo em Tutorial da escala.']
  ];
  let index = 0;
  let open = false;
  let highlighted = null;
  let returnFocus = null;
  let frame = 0;

  function topLimit() {
    let top = 12;
    document.querySelectorAll('header, #barraAcessibilidade').forEach(el => {
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (r.height && style.visibility !== 'hidden' && style.display !== 'none' && r.top <= 100) {
        top = Math.max(top, r.bottom + 12);
      }
    });
    return Math.min(top, Math.max(12, window.innerHeight - 180));
  }

  function currentTarget() {
    return document.querySelector(steps[index][0]);
  }

  function positionCard() {
    if (!open) return;
    const target = currentTarget();
    if (!target) return;
    const top = topLimit();
    card.style.maxHeight = Math.max(120, window.innerHeight - top - 12) + 'px';
    const r = target.getBoundingClientRect();
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const gap = 12;
    let x;
    let y;
    if (r.right + gap + w <= window.innerWidth - gap) {
      x = r.right + gap;
      y = r.top;
    } else if (r.left - gap - w >= gap) {
      x = r.left - gap - w;
      y = r.top;
    } else {
      x = r.left;
      y = r.bottom + gap;
      if (y + h > window.innerHeight - gap) y = r.top - gap - h;
    }
    card.style.left = Math.max(gap, Math.min(x, window.innerWidth - w - gap)) + 'px';
    card.style.top = Math.max(top, Math.min(y, window.innerHeight - h - gap)) + 'px';
  }

  function schedulePosition() {
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      positionCard();
    });
  }

  function showStep(stepIndex) {
    if (highlighted) highlighted.classList.remove('escala-tour-target');
    index = stepIndex;
    const target = currentTarget();
    card.hidden = true;
    title.textContent = steps[index][1];
    text.textContent = steps[index][2];
    progress.textContent = 'Passo ' + (index + 1) + ' de ' + steps.length;
    previous.disabled = index === 0;
    next.textContent = index === steps.length - 1 ? 'Concluir' : 'Próximo';
    highlighted = target;
    if (target) {
      target.classList.add('escala-tour-target');
      target.scrollIntoView({ behavior: 'auto', block: steps[index][0] === '#escalasContainer' ? 'start' : 'center', inline: 'nearest' });
    }
    card.hidden = false;
    positionCard();
    card.focus({ preventScroll: true });
    schedulePosition();
  }

  function closeTutorial() {
    open = false;
    card.hidden = true;
    launch.hidden = false;
    launch.setAttribute('aria-expanded', 'false');
    if (highlighted) highlighted.classList.remove('escala-tour-target');
    highlighted = null;
    window.removeEventListener('resize', schedulePosition);
    window.removeEventListener('scroll', schedulePosition, true);
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    try { window.localStorage.setItem(seenKey, '1'); } catch (_) { /* Storage is optional. */ }
    const focusTarget = returnFocus && returnFocus.isConnected && returnFocus !== document.body ? returnFocus : launch;
    focusTarget.focus({ preventScroll: true });
  }

  function openTutorial() {
    if (open) return;
    returnFocus = document.activeElement;
    open = true;
    launch.hidden = true;
    launch.setAttribute('aria-expanded', 'true');
    window.addEventListener('resize', schedulePosition);
    window.addEventListener('scroll', schedulePosition, { passive: true, capture: true });
    showStep(0);
  }

  launch.addEventListener('click', openTutorial);
  document.getElementById('escalaTutorialFechar').addEventListener('click', closeTutorial);
  previous.addEventListener('click', function () { if (index > 0) showStep(index - 1); });
  next.addEventListener('click', function () {
    if (index === steps.length - 1) closeTutorial();
    else showStep(index + 1);
  });
  document.addEventListener('keydown', function (event) {
    if (open && event.key === 'Escape') closeTutorial();
  });
  let seen = false;
  try { seen = window.localStorage.getItem(seenKey) === '1'; } catch (_) { /* Storage is optional. */ }
  if (!seen) openTutorial();
})();
