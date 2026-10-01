(() => {
"use strict";

const dataInput = document.getElementById("pacData");
if(dataInput) dataInput.value = new Date().toISOString().split("T")[0];

const ITENS_BRADEN = [
  { id: "percepcao", label: "1. Percepção Sensorial", max: 4, desc: "Reação ao desconforto por pressão.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Totalmente Limitada"}, {val:2, text:"2 - Muito Limitada"}, {val:3, text:"3 - Levemente Limitada"}, {val:4, text:"4 - Nenhuma Limitação"}] },
  { id: "umidade", label: "2. Umidade", max: 4, desc: "Exposição da pele a fluidos.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Constantemente Úmida"}, {val:2, text:"2 - Muito Úmida"}, {val:3, text:"3 - Ocasionalmente Úmida"}, {val:4, text:"4 - Raramente Úmida"}] },
  { id: "atividade", label: "3. Atividade", max: 4, desc: "Grau de atividade física.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Acamado"}, {val:2, text:"2 - Confinado à Cadeira"}, {val:3, text:"3 - Caminha Ocasionalmente"}, {val:4, text:"4 - Caminha Frequentemente"}] },
  { id: "mobilidade", label: "4. Mobilidade", max: 4, desc: "Controle da posição do corpo.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Totalmente Imóvel"}, {val:2, text:"2 - Muito Limitada"}, {val:3, text:"3 - Levemente Limitada"}, {val:4, text:"4 - Não Limitada"}] },
  { id: "nutricao", label: "5. Nutrição", max: 4, desc: "Padrão alimentar.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Muito Pobre"}, {val:2, text:"2 - Provavelmente Inadequada"}, {val:3, text:"3 - Adequada"}, {val:4, text:"4 - Excelente"}] },
  { id: "friccao", label: "6. Fricção e Cisalhamento", max: 3, desc: "Atrito ao se movimentar.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Problema"}, {val:2, text:"2 - Problema Potencial"}, {val:3, text:"3 - Nenhum Problema"}] }
];

function renderizarItens() {
  const container = document.getElementById("bradenForm");
  ITENS_BRADEN.forEach((item) => {
    let optsHtml = item.opts.map(op => `<option value="${op.val}" ${op.val === "" ? "disabled selected" : ""}>${op.text}</option>`).join("");
    const div = document.createElement("div");
    div.className = "item-card";
    div.id = `card_${item.id}`;
    div.innerHTML = `
      <div class="flex items-start justify-between mb-2 gap-2">
        <div>
          <label class="text-xs font-black text-slate-800 leading-snug">${item.label}</label>
          <p class="text-xs text-slate-600 mt-1 m-0 font-bold">${item.desc}</p>
        </div>
        <span id="badge_${item.id}" class="item-badge shrink-0">--/${item.max}</span>
      </div>
      <select id="${item.id}" class="item-select">${optsHtml}</select>
      <div class="mini-bar-wrap"><div id="bar_${item.id}" class="mini-bar-fill" style="width: 0%;"></div></div>
    `;
    container.appendChild(div);

    document.getElementById(item.id).addEventListener("change", () => {
      document.getElementById(`card_${item.id}`).classList.remove("error");
      document.getElementById("msgValidacaoErro").style.display = "none";
      atualizarCardIndividual(item.id, item.max);
    });
  });
}

function atualizarCardIndividual(id, max) {
  const select = document.getElementById(id);
  if (select.value === "") return;
  const val = parseInt(select.value);
  const pct = (val / max) * 100;

  const badge = document.getElementById(`badge_${id}`);
  const bar = document.getElementById(`bar_${id}`);
  badge.textContent = `${val}/${max}`;
  bar.style.width = `${pct}%`;

  let cor = "#eab308";
  if (val === 1) cor = "#e11d48";
  else if (val === 2) cor = "#ea580c";
  else if (val === 3 && max === 4) cor = "#16a34a";
  else if (val === 4) cor = "#16a34a";
  if(max === 3 && val === 3) cor = "#16a34a";

  bar.style.backgroundColor = cor;
  badge.style.backgroundColor = `${cor}20`;
  badge.style.color = cor;
  badge.style.borderColor = `${cor}40`;
  atualizarBarraGlobal();
}

function atualizarBarraGlobal() {
  let preenchidos = ITENS_BRADEN.filter(i => document.getElementById(i.id).value !== "").length;
  document.getElementById("contadorPreenchidos").textContent = preenchidos;
}

function calcular() {
  let incompleto = false, somaTotal = 0;

  ITENS_BRADEN.forEach((item) => {
    const valStr = document.getElementById(item.id).value;
    if (valStr === "") {
      incompleto = true;
      document.getElementById(`card_${item.id}`).classList.add("error");
    } else {
      somaTotal += parseInt(valStr);
    }
  });

  if (incompleto) {
    document.getElementById("msgValidacaoErro").style.display = "block";
    return;
  }

  let classe = "", bgPill = "", recomendacao = "";
  if (somaTotal <= 9) { classe = "Risco Muito Alto"; bgPill = "#dc2626"; recomendacao = "Atenção máxima. Protocolo rigoroso de prevenção de LPP, mudança de decúbito frequente, superfícies de alívio."; }
  else if (somaTotal <= 12) { classe = "Risco Alto"; bgPill = "#ea580c"; recomendacao = "Mudança de decúbito regular, controle estrito de umidade e fricção."; }
  else if (somaTotal <= 14) { classe = "Risco Moderado"; bgPill = "#eab308"; recomendacao = "Monitoramento diário. Cronograma de reposicionamento, proteger proeminências ósseas."; }
  else if (somaTotal <= 18) { classe = "Risco Baixo"; bgPill = "#65a30d"; recomendacao = "Manter cuidados básicos de enfermagem, hidratação da pele e mobilização."; }
  else { classe = "Sem Risco Aparente"; bgPill = "#16a34a"; recomendacao = "Paciente não apresenta risco significativo no momento."; }

  document.getElementById("scoreValor").textContent = somaTotal;
  document.getElementById("statusPill").textContent = classe;
  document.getElementById("statusPill").style.backgroundColor = bgPill;
  document.getElementById("resultadoMensagem").innerHTML = `Recomendação: ${recomendacao}`;

  const resSection = document.getElementById("resultado-section");
  resSection.classList.remove("hidden");
  
  setTimeout(() => {
    const scrollContainer = document.getElementById("scroll-container");
    scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
  }, 100);
}

function limpar() {
  ITENS_BRADEN.forEach(item => {
    document.getElementById(item.id).value = "";
    document.getElementById(`card_${item.id}`).classList.remove("error");
    document.getElementById(`badge_${item.id}`).textContent = `--/${item.max}`;
    document.getElementById(`badge_${item.id}`).style = "";
    const bar = document.getElementById(`bar_${item.id}`);
    bar.style.width = `0%`; bar.style.backgroundColor = "#cbd5e1";
  });
  document.getElementById("pacNome").value = "";
  document.getElementById("pacDataNasc").value = "";
  document.getElementById("pacMae").value = "";
  document.getElementById("pacAtendimento").value = "";
  document.getElementById("pacQuarto").value = "";
  document.getElementById("pacLeito").value = "";
  document.getElementById("pacSetor").value = "";
  document.getElementById("msgValidacaoErro").style.display = "none";
  document.getElementById("resultado-section").classList.add("hidden");
  atualizarBarraGlobal();
  
  document.getElementById("scroll-container").scrollTo({ top: 0, behavior: 'smooth' });
}

function gerarImpressao() {
  let soma = 0;
  ITENS_BRADEN.forEach((i) => { const v = document.getElementById(i.id).value; soma += v ? parseInt(v) : 0; });
  
  let classe = "Sem Risco Aparente", pillColor = "#16a34a";
  if (soma <= 9) { classe = "Risco Muito Alto"; pillColor = "#dc2626"; }
  else if (soma <= 12) { classe = "Risco Alto"; pillColor = "#ea580c"; }
  else if (soma <= 14) { classe = "Risco Moderado"; pillColor = "#eab308"; }
  else if (soma <= 18) { classe = "Risco Baixo"; pillColor = "#65a30d"; }

  const camposPaciente = {
      nome: document.getElementById("pacNome").value,
      data: document.getElementById("pacData").value ? document.getElementById("pacData").value.split("-").reverse().join("/") : "",
      dataNasc: document.getElementById("pacDataNasc").value ? document.getElementById("pacDataNasc").value.split("-").reverse().join("/") : "",
      mae: document.getElementById("pacMae").value,
      atend: document.getElementById("pacAtendimento").value,
      quarto: document.getElementById("pacQuarto").value,
      leito: document.getElementById("pacLeito").value,
      setor: document.getElementById("pacSetor").value
  };

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
  <div class="secao"><div class="sec-titulo">Dados Assistenciais</div>
    <div class="grid-dados">
      ${camposPaciente.nome ? `<div><strong>Nome:</strong> ${camposPaciente.nome}</div>` : ""}
      ${camposPaciente.data ? `<div><strong>Data:</strong> ${camposPaciente.data}</div>` : ""}
      ${camposPaciente.dataNasc ? `<div><strong>Data Nasc.:</strong> ${camposPaciente.dataNasc}</div>` : ""}
      ${camposPaciente.mae ? `<div><strong>Nome da Mãe:</strong> ${camposPaciente.mae}</div>` : ""}
      ${camposPaciente.atend ? `<div><strong>Nº Atendimento:</strong> ${camposPaciente.atend}</div>` : ""}
      ${camposPaciente.quarto ? `<div><strong>Quarto:</strong> ${camposPaciente.quarto}</div>` : ""}
      ${camposPaciente.leito ? `<div><strong>Leito:</strong> ${camposPaciente.leito}</div>` : ""}
      ${camposPaciente.setor ? `<div><strong>Setor:</strong> ${camposPaciente.setor}</div>` : ""}
    </div>
  </div>
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

// Bloqueia comportamento padrão do form (substitui o onsubmit do HTML)
document.getElementById("bradenForm").addEventListener("submit", (e) => e.preventDefault());

// Mapeia botões
document.getElementById("btnCalcular").addEventListener("click", calcular);
document.getElementById("btnLimpar").addEventListener("click", limpar);
document.getElementById("btnImprimir").addEventListener("click", gerarImpressao);
document.getElementById("btnGerarPDF").addEventListener("click", gerarImpressao);

renderizarItens();
atualizarBarraGlobal();
})();