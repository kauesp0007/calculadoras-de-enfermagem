(() => {
  "use strict";

  const htmlLang = String(document.documentElement.lang || "pt-BR").toLowerCase();
  const lang = htmlLang.startsWith("en") ? "en" : htmlLang.startsWith("es") ? "es" : "pt";

  const T = {
    pt: {
      alturaMeia: "Meia altura",
      alturaCheia: "Altura completa",
      gotas: "gotas/min",
      microgotas: "microgotas/min",
      gResumo: (vol, tempo, unid, equipoTexto, arred, tipo) =>
        `Para <strong>${vol} ml</strong> em <strong>${tempo} ${unid}</strong> com equipo <strong>${equipoTexto}</strong>, o apoio matemático é <strong>${arred} ${tipo} por minuto</strong>. Confira prescrição, equipo e protocolo institucional.`,
      gP1Horas: (t, m) => `Converter o tempo para minutos: ${t} horas × 60 = ${m} minutos.`,
      gP1Min: (t) => `O tempo informado já está em minutos (${t} min).`,
      gP2: "Aplicar a fórmula",
      gP2Formula: (fator) => `G = (Volume × ${fator}) ÷ Tempo em minutos`,
      gP3: (arred, tipo) => `Como não é possível fracionar a gota, o valor foi arredondado para o inteiro mais próximo: <strong>${arred} ${tipo}/minuto</strong>. O arredondamento deve ser conferido conforme prescrição, protocolo e dispositivo.`,
      mResumo: (presc, disp, vol, res) =>
        `Para prescrição de <strong>${presc}</strong>, com <strong>${disp}</strong> disponíveis em <strong>${vol} ml</strong>, administrar <strong>${res} ml</strong>. Confirme prescrição, diluição, via e realize dupla checagem.`,
      mP1: (disp, vol, presc) => `Regra de três: se ${disp} está para ${vol} ml, então ${presc} está para X ml.`,
      mP2: "Montar a equação",
      mP2Formula: (presc, vol, disp) => `X = (${presc} × ${vol}) ÷ ${disp}`,
      mP3: (res) => `Resultado: <strong>${res} ml</strong> a administrar. Valide com a prescrição, os certos da medicação e dupla checagem profissional.`,
      mav: "Medicação de Alta Vigilância (MAV): dupla checagem e protocolo institucional são obrigatórios.",
      errVolume: "Informe um volume válido, maior que zero.",
      errTempo: "Informe um tempo válido, maior que zero.",
      errPresc: "Informe a dose prescrita, maior que zero.",
      errDisp: "Informe a dose disponível, maior que zero.",
      errVolDisp: "Informe o volume disponível, maior que zero."
    },
    en: {
      alturaMeia: "Half height",
      alturaCheia: "Full height",
      gotas: "drops/min",
      microgotas: "microdrops/min",
      gResumo: (vol, tempo, unid, equipoTexto, arred, tipo) =>
        `For <strong>${vol} ml</strong> over <strong>${tempo} ${unid}</strong> with <strong>${equipoTexto}</strong>, the mathematical support result is <strong>${arred} ${tipo} per minute</strong>. Confirm prescription, tubing set and institutional protocol.`,
      gP1Horas: (t, m) => `Convert time to minutes: ${t} hours × 60 = ${m} minutes.`,
      gP1Min: (t) => `The given time is already in minutes (${t} min).`,
      gP2: "Apply the formula",
      gP2Formula: (fator) => `G = (Volume × ${fator}) ÷ Time in minutes`,
      gP3: (arred, tipo) => `Since a drop cannot be split, the value was rounded to the nearest whole number: <strong>${arred} ${tipo}/minute</strong>. Rounding must be checked against the prescription, protocol and device.`,
      mResumo: (presc, disp, vol, res) =>
        `For a prescription of <strong>${presc}</strong>, with <strong>${disp}</strong> available in <strong>${vol} ml</strong>, administer <strong>${res} ml</strong>. Confirm prescription, dilution, route and perform double-checking.`,
      mP1: (disp, vol, presc) => `Rule of three: if ${disp} corresponds to ${vol} ml, then ${presc} corresponds to X ml.`,
      mP2: "Set up the equation",
      mP2Formula: (presc, vol, disp) => `X = (${presc} × ${vol}) ÷ ${disp}`,
      mP3: (res) => `Result: <strong>${res} ml</strong> to administer. Validate with the prescription, medication rights and professional double-checking.`,
      mav: "High-Alert Medication: double-checking and institutional protocol are mandatory.",
      errVolume: "Enter a valid volume greater than zero.",
      errTempo: "Enter a valid time greater than zero.",
      errPresc: "Enter the prescribed dose greater than zero.",
      errDisp: "Enter the available dose greater than zero.",
      errVolDisp: "Enter the available volume greater than zero."
    },
    es: {
      alturaMeia: "Media altura",
      alturaCheia: "Altura completa",
      gotas: "gotas/min",
      microgotas: "microgotas/min",
      gResumo: (vol, tempo, unid, equipoTexto, arred, tipo) =>
        `Para <strong>${vol} ml</strong> en <strong>${tempo} ${unid}</strong> con equipo <strong>${equipoTexto}</strong>, el apoyo matemático es <strong>${arred} ${tipo} por minuto</strong>. Confirme prescripción, equipo y protocolo institucional.`,
      gP1Horas: (t, m) => `Convertir el tiempo a minutos: ${t} horas × 60 = ${m} minutos.`,
      gP1Min: (t) => `El tiempo informado ya está en minutos (${t} min).`,
      gP2: "Aplicar la fórmula",
      gP2Formula: (fator) => `G = (Volumen × ${fator}) ÷ Tiempo en minutos`,
      gP3: (arred, tipo) => `Como no es posible fraccionar la gota, el valor se redondeó al entero más cercano: <strong>${arred} ${tipo}/minuto</strong>. El redondeo debe verificarse según prescripción, protocolo y dispositivo.`,
      mResumo: (presc, disp, vol, res) =>
        `Para una prescripción de <strong>${presc}</strong>, con <strong>${disp}</strong> disponibles en <strong>${vol} ml</strong>, administrar <strong>${res} ml</strong>. Confirme prescripción, dilución, vía y realice doble verificación.`,
      mP1: (disp, vol, presc) => `Regla de tres: si ${disp} corresponde a ${vol} ml, entonces ${presc} corresponde a X ml.`,
      mP2: "Plantear la ecuación",
      mP2Formula: (presc, vol, disp) => `X = (${presc} × ${vol}) ÷ ${disp}`,
      mP3: (res) => `Resultado: <strong>${res} ml</strong> a administrar. Valide con la prescripción, los correctos de la medicación y doble verificación profesional.`,
      mav: "Medicamento de Alto Riesgo: la doble verificación y el protocolo institucional son obligatorios.",
      errVolume: "Ingrese un volumen válido mayor que cero.",
      errTempo: "Ingrese un tiempo válido mayor que cero.",
      errPresc: "Ingrese la dosis prescrita mayor que cero.",
      errDisp: "Ingrese la dosis disponible mayor que cero.",
      errVolDisp: "Ingrese el volumen disponible mayor que cero."
    }
  }[lang];

  const fmt = (n) => {
    const s = Number(n);
    if (Number.isFinite(s) && Number.isInteger(s)) return String(s);
    return Number.isFinite(s) ? String(Math.round(s * 100) / 100) : "";
  };

  /* ---------- Elementos ---------- */
  const shell = document.getElementById("calculator-shell");
  const btnAltura = document.getElementById("btnAltura");
  const alturaLabel = document.getElementById("altura-label");

  function setAltura(mode) {
    shell.dataset.height = mode;
    btnAltura.setAttribute("aria-pressed", String(mode === "half"));
    alturaLabel.textContent = mode === "half" ? T.alturaCheia : T.alturaMeia;
    btnAltura.setAttribute("aria-label", mode === "half" ? T.alturaCheia : T.alturaMeia);
    btnAltura.title = mode === "half" ? T.alturaCheia : T.alturaMeia;
  }

  btnAltura.addEventListener("click", () => {
    setAltura(shell.dataset.height === "half" ? "full" : "half");
  });

  /* ---------- Gotejamento ---------- */
  const gErro = document.getElementById("gotejamento-erro");
  const gResult = document.getElementById("gotejamento-resultado");
  const gSteps = document.getElementById("gotejamento-steps");

  function calcGotejamento() {
    gErro.hidden = true;
    const volume = parseFloat(document.getElementById("volume").value);
    const tempo = parseFloat(document.getElementById("tempo").value);
    const unidade = document.getElementById("unidadeTempo").value;
    const equipo = document.getElementById("equipo").value;

    if (isNaN(volume) || volume <= 0) { gErro.textContent = T.errVolume; gErro.hidden = false; gResult.hidden = true; return; }
    if (isNaN(tempo) || tempo <= 0) { gErro.textContent = T.errTempo; gErro.hidden = false; gResult.hidden = true; return; }

    const fator = equipo === "macrogotas" ? 20 : 60;
    const tipo = equipo === "macrogotas" ? "gotas" : "microgotas";
    const tempoMin = unidade === "horas" ? tempo * 60 : tempo;
    const gotas = (volume * fator) / tempoMin;
    const arred = Math.round(gotas);

    document.getElementById("gotejamento-score").textContent = arred;
    document.getElementById("gotejamento-unit").textContent = tipo === "gotas" ? T.gotas : T.microgotas;
    document.getElementById("gotejamento-resumo").innerHTML =
      T.gResumo(volume, tempo, unidade === "horas" ? "h" : "min", equipo === "macrogotas" ? "macrogotas (20 gts/ml)" : "microgotas (60 gts/ml)", arred, tipo);

    gSteps.innerHTML =
      `<p class="passo"><strong>1.</strong> ${unidade === "horas" ? T.gP1Horas(tempo, tempoMin) : T.gP1Min(tempo)}</p>` +
      `<p class="passo"><strong>2.</strong> ${T.gP2}:</p>` +
      `<div class="formula">${T.gP2Formula(fator)}<br>G = (${volume} × ${fator}) ÷ ${tempoMin}<br>G = ${(volume * fator).toFixed(2)} ÷ ${tempoMin}<br>G = ${gotas.toFixed(2)}</div>` +
      `<p class="passo"><strong>3.</strong> ${T.gP3(arred, tipo)}</p>`;

    gResult.hidden = false;
    gSteps.closest("details").open = true;
  }

  function limparGotejamento() {
    document.getElementById("volume").value = "";
    document.getElementById("tempo").value = "";
    document.getElementById("unidadeTempo").value = "horas";
    document.getElementById("equipo").value = "macrogotas";
    gErro.hidden = true;
    gResult.hidden = true;
    gSteps.innerHTML = "";
    gSteps.closest("details").open = false;
  }

  /* ---------- Medicamentos ---------- */
  const mErro = document.getElementById("medicamentos-erro");
  const mResult = document.getElementById("medicamentos-resultado");
  const mSteps = document.getElementById("medicamentos-steps");
  const mavAlert = document.getElementById("mav-alert");

  function calcMedicamentos() {
    mErro.hidden = true;
    const presc = parseFloat(document.getElementById("prescricao").value);
    const disp = parseFloat(document.getElementById("disponivel").value);
    const vol = parseFloat(document.getElementById("volumeDisponivel").value);
    const mav = document.getElementById("mav").checked;

    if (isNaN(presc) || presc <= 0) { mErro.textContent = T.errPresc; mErro.hidden = false; mResult.hidden = true; return; }
    if (isNaN(disp) || disp <= 0) { mErro.textContent = T.errDisp; mErro.hidden = false; mResult.hidden = true; return; }
    if (isNaN(vol) || vol <= 0) { mErro.textContent = T.errVolDisp; mErro.hidden = false; mResult.hidden = true; return; }

    const resultado = (presc * vol) / disp;
    const res = fmt(resultado);

    document.getElementById("medicamentos-score").textContent = res;
    document.getElementById("medicamentos-unit").textContent = "ml";
    document.getElementById("medicamentos-resumo").innerHTML = T.mResumo(presc, disp, vol, res);

    mSteps.innerHTML =
      `<p class="passo"><strong>1.</strong> ${T.mP1(disp, vol, presc)}</p>` +
      `<p class="passo"><strong>2.</strong> ${T.mP2}:</p>` +
      `<div class="formula">${T.mP2Formula(presc, vol, disp)}<br>X = (${presc} × ${vol}) ÷ ${disp}<br>X = ${(presc * vol).toFixed(2)} ÷ ${disp}<br>X = ${res} ml</div>` +
      `<p class="passo"><strong>3.</strong> ${T.mP3(res)}</p>`;

    mResult.hidden = false;
    mSteps.closest("details").open = true;

    if (mav) {
      mavAlert.textContent = T.mav;
      mavAlert.hidden = false;
    } else {
      mavAlert.hidden = true;
    }
  }

  function limparMedicamentos() {
    document.getElementById("prescricao").value = "";
    document.getElementById("disponivel").value = "";
    document.getElementById("volumeDisponivel").value = "";
    document.getElementById("mav").checked = false;
    mErro.hidden = true;
    mResult.hidden = true;
    mavAlert.hidden = true;
    mSteps.innerHTML = "";
    mSteps.closest("details").open = false;
  }

  /* ---------- Fechar / altura / Esc ---------- */
  function resetar() {
    limparGotejamento();
    limparMedicamentos();
    setAltura("full");
  }

  async function fechar() {
    resetar();
    try {
      if (typeof chrome === "undefined" || !chrome.sidePanel?.close) throw new Error("preview");
      const current = await chrome.windows.getCurrent();
      await chrome.sidePanel.close({ windowId: current.id });
    } catch (_) { /* painel controlado pelo Chrome */ }
  }

  let ownWindowId = null;
  async function updateNativeContext() {
    if (typeof chrome === "undefined" || !chrome.windows?.getCurrent) return;
    try { const current = await chrome.windows.getCurrent(); ownWindowId = current.id; } catch (_) { }
  }
  function onNativeMessage(message, sender, sendResponse) {
    if (sender.id !== chrome.runtime.id || message?.type !== "gotejamento:panel-closed" ||
      !Number.isInteger(message.windowId) || message.windowId !== ownWindowId) return false;
    resetar();
    sendResponse({ ok: true });
    return false;
  }

  document.getElementById("btnCalcularGotejamento").addEventListener("click", calcGotejamento);
  document.getElementById("btnLimparGotejamento").addEventListener("click", limparGotejamento);
  document.getElementById("btnCalcularMedicamentos").addEventListener("click", calcMedicamentos);
  document.getElementById("btnLimparMedicamentos").addEventListener("click", limparMedicamentos);
  document.getElementById("btnFechar").addEventListener("click", fechar);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); fechar(); } });

  // Bloqueia scroll acidental nos inputs numéricos (evita alterar valores com a roda)
  document.querySelectorAll('input[type="number"]').forEach((input) => {
    input.addEventListener("wheel", (e) => { e.preventDefault(); input.blur(); });
  });

  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    chrome.runtime.onMessage.addListener(onNativeMessage);
    updateNativeContext();
  }

  setAltura("full");
})();
