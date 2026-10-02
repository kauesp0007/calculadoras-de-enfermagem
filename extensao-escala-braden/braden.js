(() => {
  "use strict";

  const ITENS_BRADEN = [
    { id: "percepcao", label: "1. Percepção Sensorial", max: 4, desc: "Reação ao desconforto por pressão.", opts: [{ val: "", text: "Selecione..." }, { val: 1, text: "1 - Totalmente Limitada" }, { val: 2, text: "2 - Muito Limitada" }, { val: 3, text: "3 - Levemente Limitada" }, { val: 4, text: "4 - Nenhuma Limitação" }] },
    { id: "umidade", label: "2. Umidade", max: 4, desc: "Exposição da pele a fluidos.", opts: [{ val: "", text: "Selecione..." }, { val: 1, text: "1 - Constantemente Úmida" }, { val: 2, text: "2 - Muito Úmida" }, { val: 3, text: "3 - Ocasionalmente Úmida" }, { val: 4, text: "4 - Raramente Úmida" }] },
    { id: "atividade", label: "3. Atividade", max: 4, desc: "Grau de atividade física.", opts: [{ val: "", text: "Selecione..." }, { val: 1, text: "1 - Acamado" }, { val: 2, text: "2 - Confinado à Cadeira" }, { val: 3, text: "3 - Caminha Ocasionalmente" }, { val: 4, text: "4 - Caminha Frequentemente" }] },
    { id: "mobilidade", label: "4. Mobilidade", max: 4, desc: "Controle da posição do corpo.", opts: [{ val: "", text: "Selecione..." }, { val: 1, text: "1 - Totalmente Imóvel" }, { val: 2, text: "2 - Muito Limitada" }, { val: 3, text: "3 - Levemente Limitada" }, { val: 4, text: "4 - Não Limitada" }] },
    { id: "nutricao", label: "5. Nutrição", max: 4, desc: "Padrão alimentar.", opts: [{ val: "", text: "Selecione..." }, { val: 1, text: "1 - Muito Pobre" }, { val: 2, text: "2 - Provavelmente Inadequada" }, { val: 3, text: "3 - Adequada" }, { val: 4, text: "4 - Excelente" }] },
    { id: "friccao", label: "6. Fricção e Cisalhamento", max: 3, desc: "Atrito ao se movimentar.", opts: [{ val: "", text: "Selecione..." }, { val: 1, text: "1 - Problema" }, { val: 2, text: "2 - Problema Potencial" }, { val: 3, text: "3 - Nenhum Problema" }] }
  ];

  function renderizarItens() {
    const container = document.getElementById("itensBraden");
    ITENS_BRADEN.forEach((item) => {
      const optsHtml = item.opts.map(op => `<option value="${op.val}" ${op.val === "" ? "disabled selected" : ""}>${op.text}</option>`).join("");
      const div = document.createElement("div");
      div.className = "item-card";
      div.id = `card_${item.id}`;
      div.innerHTML = `
      <div class="item-head">
        <div class="item-copy">
          <span class="item-label">${item.label}</span>
          <span class="item-desc">${item.desc}</span>
        </div>
        <span id="badge_${item.id}" class="item-badge" data-tone="empty">--/${item.max}</span>
      </div>
      <select id="${item.id}" class="item-select" aria-label="${item.label}">${optsHtml}</select>
      <div class="mini-bar-wrap"><div id="bar_${item.id}" class="mini-bar-fill" data-tone="empty" style="width: 0%;"></div></div>
    `;
      container.appendChild(div);

      document.getElementById(item.id).addEventListener("change", () => {
        div.classList.remove("error");
        document.getElementById("msgValidacaoErro").hidden = true;
        atualizarCardIndividual(item.id, item.max);
      });
    });
  }

  const TONES = { 1: "one", 2: "two", 3: "three", 4: "four" };

  function atualizarCardIndividual(id, max) {
    const select = document.getElementById(id);
    if (select.value === "") return;
    const val = parseInt(select.value, 10);
    const pct = (val / max) * 100;

    const badge = document.getElementById(`badge_${id}`);
    const bar = document.getElementById(`bar_${id}`);
    badge.textContent = `${val}/${max}`;
    badge.dataset.tone = TONES[val] || "empty";
    bar.style.width = `${pct}%`;
    bar.dataset.tone = TONES[val] || "empty";
    atualizarBarraGlobal();
  }

  function atualizarBarraGlobal() {
    const preenchidos = ITENS_BRADEN.filter(i => document.getElementById(i.id).value !== "").length;
    document.getElementById("contadorPreenchidos").textContent = preenchidos;
    document.getElementById("progressFill").style.width = `${(preenchidos / ITENS_BRADEN.length) * 100}%`;
  }

  function classificar(soma) {
    if (soma <= 9) return { classe: "Risco Muito Alto", tone: "veryhigh", recomendacao: "Atenção máxima. Protocolo rigoroso de prevenção de LPP, mudança de decúbito frequente e superfícies de alívio." };
    if (soma <= 12) return { classe: "Risco Alto", tone: "high", recomendacao: "Mudança de decúbito regular, controle estrito de umidade e fricção." };
    if (soma <= 14) return { classe: "Risco Moderado", tone: "moderate", recomendacao: "Monitoramento diário. Cronograma de reposicionamento e proteção das proeminências ósseas." };
    if (soma <= 18) return { classe: "Risco Baixo", tone: "low", recomendacao: "Manter cuidados básicos de enfermagem, hidratação da pele e mobilização." };
    return { classe: "Sem Risco Aparente", tone: "none", recomendacao: "Paciente não apresenta risco significativo no momento." };
  }

  function calcular() {
    let incompleto = false, somaTotal = 0;

    ITENS_BRADEN.forEach((item) => {
      const valStr = document.getElementById(item.id).value;
      if (valStr === "") {
        incompleto = true;
        document.getElementById(`card_${item.id}`).classList.add("error");
      } else {
        somaTotal += parseInt(valStr, 10);
      }
    });

    if (incompleto) {
      document.getElementById("msgValidacaoErro").hidden = false;
      return;
    }

    const { classe, tone, recomendacao } = classificar(somaTotal);

    document.getElementById("scoreTexto").textContent = `${somaTotal} / 23`;
    document.getElementById("statusPill").textContent = classe;
    document.getElementById("statusPill").dataset.tone = tone;
    document.getElementById("resultadoMensagem").textContent = recomendacao;

    const resSection = document.getElementById("resultado-section");
    resSection.hidden = false;

    setTimeout(() => {
      const main = document.getElementById("main-content");
      main.scrollTo({ top: main.scrollHeight, behavior: "smooth" });
    }, 100);
  }

  function limpar() {
    ITENS_BRADEN.forEach(item => {
      document.getElementById(item.id).value = "";
      document.getElementById(`card_${item.id}`).classList.remove("error");
      const badge = document.getElementById(`badge_${item.id}`);
      badge.textContent = `--/${item.max}`;
      badge.dataset.tone = "empty";
      const bar = document.getElementById(`bar_${item.id}`);
      bar.style.width = "0%";
      bar.dataset.tone = "empty";
    });
    document.getElementById("msgValidacaoErro").hidden = true;
    document.getElementById("resultado-section").hidden = true;
    atualizarBarraGlobal();

    document.getElementById("main-content").scrollTo({ top: 0, behavior: "smooth" });
  }

  function gerarImpressao() {
    let soma = 0;
    ITENS_BRADEN.forEach((i) => { const v = document.getElementById(i.id).value; soma += v ? parseInt(v) : 0; });

    let classe = "Sem Risco Aparente", pillColor = "#16a34a";
    if (soma <= 9) { classe = "Risco Muito Alto"; pillColor = "#dc2626"; }
    else if (soma <= 12) { classe = "Risco Alto"; pillColor = "#ea580c"; }
    else if (soma <= 14) { classe = "Risco Moderado"; pillColor = "#eab308"; }
    else if (soma <= 18) { classe = "Risco Baixo"; pillColor = "#65a30d"; }

    const linhas = ITENS_BRADEN.map(i => {
      const val = parseInt(document.getElementById(i.id).value) || 0;
      return `<tr><td>${i.label.replace(/^\d+\.\s*/, "")}</td><td style="text-align:center;font-weight:900">${val}</td><td style="text-align:center">${i.max}</td></tr>`;
    }).join("");

    // HTML SEGURO (Sem tags <script> dentro da string)
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Laudo Braden</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:10pt;color:#1E293B;padding:24px 32px}
    .hdr{background:#1A3E74;color:white;padding:14px;border-radius:8px;}
    .secao{margin-bottom:14px; margin-top:20px;}
    .sec-titulo{font-size:8pt;font-weight:900;text-transform:uppercase;color:#1A3E74;background:#EFF6FF;padding:6px;border-radius:4px;margin-bottom:10px}
    .res-box{border:2px solid #1A3E74;border-radius:8px;padding:14px;text-align:center;background:#F8FAFC}
    table{width:100%;border-collapse:collapse;}
    th{background:#1A3E74;color:white;font-size:8pt;padding:8px;text-align:left}
    td{font-size:9pt;padding:8px;border-bottom:1px solid #E2E8F0}
    tfoot td{background:#EFF6FF;font-weight:900;color:#1A3E74;border-top:2px solid #1A3E74}
    .grid-dados{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:9pt;}
  </style></head><body>
  <div class="hdr"><h2>Escala de Braden</h2></div>
  <div class="secao"><div class="res-box"><h1 style="color:#1A3E74;margin:0;font-size:36pt">${soma} / 23</h1><div style="background:${pillColor};color:white;display:inline-block;padding:6px 16px;border-radius:20px;margin-top:10px;font-weight:900;text-transform:uppercase;">${classe}</div></div></div>
  <div class="secao"><div class="sec-titulo">Memória da Avaliação Clínica</div><table><thead><tr><th>Fator</th><th style="text-align:center">Obtido</th><th style="text-align:center">Máx</th></tr></thead><tbody>${linhas}</tbody><tfoot><tr><td>TOTAL</td><td style="text-align:center">${soma}</td><td style="text-align:center">23</td></tr></tfoot></table></div>
  <div style="margin-top:40px;text-align:center;font-size:8pt;color:#64748b;border-top:1px solid #ccc;padding-top:10px">Assinatura do Profissional<br><br>www.calculadorasdeenfermagem.com.br</div>
  </body></html>`;

    const janela = window.open("", "_blank");
    janela.document.write(html);
    janela.document.close();
    janela.focus();

    // Imprime de forma segura contornando o erro de CSP
    setTimeout(() => {
      janela.print();
    }, 500);
  }

  async function fechar() {
    limpar();
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
    if (sender.id !== chrome.runtime.id || message?.type !== "braden:panel-closed" ||
      !Number.isInteger(message.windowId) || message.windowId !== ownWindowId) return false;
    limpar();
    sendResponse({ ok: true });
    return false;
  }

  // Bloqueia comportamento padrão do form e calcula
  document.getElementById("bradenForm").addEventListener("submit", (e) => { e.preventDefault(); calcular(); });

  // Mapeia botões
  document.getElementById("btnLimpar").addEventListener("click", limpar);
  document.getElementById("btnImprimir").addEventListener("click", gerarImpressao);
  document.getElementById("btnGerarPDF").addEventListener("click", gerarImpressao);
  document.getElementById("btnFechar").addEventListener("click", fechar);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); fechar(); } });

  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    chrome.runtime.onMessage.addListener(onNativeMessage);
    updateNativeContext();
  }

  renderizarItens();
  atualizarBarraGlobal();
})();