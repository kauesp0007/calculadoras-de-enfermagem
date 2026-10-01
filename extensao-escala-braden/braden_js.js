(() => {
"use strict";

const embedded = location.hash === "#embedded";
const sessionUrl = new URLSearchParams(location.search).get("session");

function sendMsg(type) {
    if (embedded && typeof chrome !== "undefined" && chrome.runtime?.id) {
        chrome.runtime.sendMessage({ type, session: sessionUrl }).catch(() => {});
    }
}

document.getElementById("btnFechar").addEventListener("click", () => { sendMsg("braden:close"); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") sendMsg("braden:close"); });

if (embedded) sendMsg("braden:ready");

const ITENS_BRADEN = [
  { id: "percepcao", label: "1. Percepção Sensorial", max: 4, desc: "Reação ao desconforto por pressão.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Totalmente Limitada"}, {val:2, text:"2 - Muito Limitada"}, {val:3, text:"3 - Levemente Limitada"}, {val:4, text:"4 - Nenhuma Limitação"}] },
  { id: "umidade", label: "2. Umidade", max: 4, desc: "Exposição da pele a fluidos.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Constantemente Úmida"}, {val:2, text:"2 - Muito Úmida"}, {val:3, text:"3 - Ocasionalmente Úmida"}, {val:4, text:"4 - Raramente Úmida"}] },
  { id: "atividade", label: "3. Atividade", max: 4, desc: "Grau de atividade física.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Acamado"}, {val:2, text:"2 - Confinado à Cadeira"}, {val:3, text:"3 - Caminha Ocasionalmente"}, {val:4, text:"4 - Caminha Frequentemente"}] },
  { id: "mobilidade", label: "4. Mobilidade", max: 4, desc: "Controle da posição do corpo.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Totalmente Imóvel"}, {val:2, text:"2 - Muito Limitada"}, {val:3, text:"3 - Levemente Limitada"}, {val:4, text:"4 - Não Limitada"}] },
  { id: "nutricao", label: "5. Nutrição", max: 4, desc: "Padrão alimentar.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Muito Pobre"}, {val:2, text:"2 - Provavelmente Inadequada"}, {val:3, text:"3 - Adequada"}, {val:4, text:"4 - Excelente"}] },
  { id: "friccao", label: "6. Fricção", max: 3, desc: "Atrito ao se movimentar.", opts: [{val:"", text:"Selecione..."}, {val:1, text:"1 - Problema"}, {val:2, text:"2 - Problema Potencial"}, {val:3, text:"3 - Nenhum Problema"}] }
];

const BANCO_NANDA = [
  { codigo: "00047", diagnostico: "Risco de integridade da pele prejudicada", definicao: "Vulnerabilidade a alteração na epiderme e/ou derme, que pode comprometer a saúde." },
  { codigo: "00249", diagnostico: "Risco de úlcera por pressão", definicao: "Vulnerabilidade a dano localizado na pele e/ou tecido subjacente, geralmente sobre proeminência óssea." },
  { codigo: "00085", diagnostico: "Mobilidade física prejudicada", definicao: "Limitação no movimento físico independente e voluntário do corpo." },
  { codigo: "00002", diagnostico: "Nutrição desequilibrada: menor que as necessidades corporais", definicao: "Ingestão insuficiente de nutrientes para satisfazer as necessidades metabólicas." },
  { codigo: "00046", diagnostico: "Integridade da pele prejudicada", definicao: "Epiderme e/ou derme alterada." },
  { codigo: "00004", diagnostico: "Risco de infecção", definicao: "Vulnerabilidade a invasão e multiplicação de organismos patogênicos." }
];

function renderizarItens() {
  const container = document.getElementById("bradenForm");
  ITENS_BRADEN.forEach((item) => {
    let optsHtml = item.opts.map(op => `<option value="${op.val}" ${op.val === "" ? "disabled selected" : ""}>${op.text}</option>`).join("");
    const div = document.createElement("div");
    div.className = "item-card";
    div.id = `card_${item.id}`;
    div.innerHTML = `
      <div class="flex items-start justify-between mb-1 gap-2">
        <div>
          <label class="text-[11px] font-bold text-slate-800 leading-snug">${item.label}</label>
          <p class="text-[9px] text-slate-500 mt-0.5 m-0 leading-tight">${item.desc}</p>
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
  else if (val === 2) cor = "#f97316";
  else if (val === 3 && max === 4) cor = "#16a34a";
  else if (val === 4) cor = "#16a34a";
  if(max === 3 && val === 3) cor = "#16a34a";

  bar.style.backgroundColor = cor;
  badge.style.backgroundColor = `${cor}15`;
  badge.style.color = cor;
  badge.style.borderColor = `${cor}30`;
  atualizarBarraGlobal();
}

function atualizarBarraGlobal() {
  let preenchidos = ITENS_BRADEN.filter(i => document.getElementById(i.id).value !== "").length;
  document.getElementById("progress-bar-global").style.width = `${(preenchidos / 6) * 100}%`;
  document.getElementById("contadorPreenchidos").textContent = preenchidos;
}

document.getElementById("btnToggleDados").addEventListener("click", function () {
  const body = document.getElementById("dadosBody");
  const chevron = document.getElementById("dadosChevron");
  body.classList.toggle("open");
  chevron.style.transform = body.classList.contains("open") ? "rotate(180deg)" : "rotate(0deg)";
});

const dataInput = document.getElementById("pacData");
if(dataInput) dataInput.value = new Date().toISOString().split("T")[0];

function calcular() {
  let incompleto = false, somaTotal = 0, dominiosValores = [];
  let keywords = ["pele", "pressão", "risco"];

  ITENS_BRADEN.forEach((item) => {
    const valStr = document.getElementById(item.id).value;
    if (valStr === "") {
      incompleto = true;
      document.getElementById(`card_${item.id}`).classList.add("error");
    } else {
      const val = parseInt(valStr);
      somaTotal += val;
      dominiosValores.push({ nome: item.label.replace(/^\d+\.\s*/, ""), obtido: val, max: item.max });
      if (val <= 2) {
        if (item.id === "atividade" || item.id === "mobilidade") keywords.push("mobilidade");
        if (item.id === "nutricao") keywords.push("nutrição");
        if (item.id === "umidade") keywords.push("infecção");
      }
    }
  });

  if (incompleto) {
    document.getElementById("msgValidacaoErro").style.display = "block";
    return;
  }

  let classe = "", bgPill = "", recomendacao = "";
  if (somaTotal <= 9) { classe = "Risco Muito Alto"; bgPill = "#e11d48"; recomendacao = "Atenção máxima. Protocolo rigoroso de prevenção de LPP, mudança de decúbito frequente, superfícies de alívio."; }
  else if (somaTotal <= 12) { classe = "Risco Alto"; bgPill = "#ea580c"; recomendacao = "Mudança de decúbito regular, controle estrito de umidade e fricção."; }
  else if (somaTotal <= 14) { classe = "Risco Moderado"; bgPill = "#eab308"; recomendacao = "Monitoramento diário. Cronograma de reposicionamento, proteger proeminências ósseas."; }
  else if (somaTotal <= 18) { classe = "Risco Baixo"; bgPill = "#84cc16"; recomendacao = "Manter cuidados básicos de enfermagem, hidratação da pele e mobilização."; }
  else { classe = "Sem Risco Aparente"; bgPill = "#16a34a"; recomendacao = "Paciente não apresenta risco significativo no momento."; }

  document.getElementById("scoreValor").textContent = somaTotal;
  document.getElementById("statusPill").textContent = classe;
  document.getElementById("statusPill").style.backgroundColor = bgPill;
  document.getElementById("resultadoMensagem").innerHTML = `Escore: <strong>${somaTotal} pts</strong>.<br><strong>Recomendação:</strong> ${recomendacao}`;

  const tbody = document.getElementById("tabelaDominios");
  tbody.innerHTML = "";
  dominiosValores.forEach(dom => {
    const pct = Math.round((dom.obtido / dom.max) * 100);
    let cor = "#16a34a";
    if (dom.obtido === 1) cor = "#e11d48";
    else if (dom.obtido === 2) cor = "#ea580c";
    else if (dom.obtido === 3 && dom.max === 4) cor = "#eab308";

    tbody.innerHTML += `<tr>
      <td class="text-[11px] text-slate-700">${dom.nome}</td>
      <td class="text-center font-bold" style="color: ${cor}">${dom.obtido}</td>
      <td class="text-center text-slate-400 text-[10px]">${dom.max}</td>
      <td>
        <div class="flex items-center gap-2">
          <div class="flex-1 h-1.5 bg-slate-200 rounded-full"><div style="width:${pct}%; background:${cor};" class="h-full rounded-full"></div></div>
        </div>
      </td>
    </tr>`;
  });

  document.getElementById("resultado-section").classList.add("visible");
  setTimeout(() => document.getElementById("resultado-section").scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  processarNanda(keywords);
}

function processarNanda(keywords) {
  const lista = document.getElementById("lista-nanda");
  const pontuados = BANCO_NANDA.map(diag => {
    let matchScore = 0;
    const txt = (diag.diagnostico + " " + diag.definicao).toLowerCase();
    keywords.forEach(kw => { if (txt.includes(kw.toLowerCase())) matchScore++; });
    return { ...diag, matchScore };
  }).filter(d => d.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);

  lista.innerHTML = pontuados.length ? pontuados.map(d => `
    <li class="bg-slate-50 border border-slate-100 p-2 rounded-lg flex items-start gap-2">
      <span class="bg-blue-100 text-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded shrink-0">${d.codigo}</span>
      <div><h5 class="text-[11px] font-bold text-slate-800 m-0 leading-tight">${d.diagnostico}</h5><p class="text-[9px] text-slate-500 m-0 leading-snug">${d.definicao}</p></div>
    </li>
  `).join("") : `<li class="text-[10px] text-slate-500 text-center">Nenhum diagnóstico direto associado.</li>`;
}

function limpar() {
  ITENS_BRADEN.forEach(item => {
    document.getElementById(item.id).value = "";
    document.getElementById(`card_${item.id}`).classList.remove("error");
    document.getElementById(`badge_${item.id}`).textContent = `--/${item.max}`;
    document.getElementById(`badge_${item.id}`).style = "";
    const bar = document.getElementById(`bar_${item.id}`);
    bar.style.width = `0%`; bar.style.backgroundColor = "transparent";
  });
  document.getElementById("pacNome").value = "";
  document.getElementById("pacIdade").value = "";
  document.getElementById("pacSetor").value = "";
  document.getElementById("msgValidacaoErro").style.display = "none";
  document.getElementById("resultado-section").classList.remove("visible");
  atualizarBarraGlobal();
}

function gerarImpressao() {
  let soma = 0;
  ITENS_BRADEN.forEach((i) => { const v = document.getElementById(i.id).value; soma += v ? parseInt(v) : 0; });
  let classe = "Sem Risco Aparente", pillColor = "#16a34a";
  if (soma <= 9) { classe = "Risco Muito Alto"; pillColor = "#e11d48"; }
  else if (soma <= 12) { classe = "Risco Alto"; pillColor = "#ea580c"; }
  else if (soma <= 14) { classe = "Risco Moderado"; pillColor = "#eab308"; }
  else if (soma <= 18) { classe = "Risco Baixo"; pillColor = "#84cc16"; }

  const n = document.getElementById("pacNome").value, id = document.getElementById("pacIdade").value, s = document.getElementById("pacSetor").value;
  const linhas = ITENS_BRADEN.map(i => {
    const val = parseInt(document.getElementById(i.id).value) || 0;
    return `<tr><td>${i.label.replace(/^\d+\.\s*/, "")}</td><td style="text-align:center;font-weight:bold">${val}</td><td style="text-align:center">${i.max}</td></tr>`;
  }).join("");

  const nandaHtml = document.getElementById("lista-nanda").innerHTML;
  
  // HTML estatico injetado numa nova janela para bypass de seguranca (permite download/print nativo)
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Laudo Braden</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:10pt;color:#1E293B;padding:24px 32px}
    .hdr{background:#1A3E74;color:white;padding:14px;border-radius:8px;}
    .secao{margin-bottom:14px; margin-top:20px;}
    .sec-titulo{font-size:8pt;font-weight:700;text-transform:uppercase;color:#1A3E74;background:#EFF6FF;padding:5px;border-radius:4px;margin-bottom:8px}
    .res-box{border:2px solid #1A3E74;border-radius:8px;padding:14px;text-align:center;background:#F8FAFC}
    table{width:100%;border-collapse:collapse;}
    th{background:#1A3E74;color:white;font-size:8pt;padding:6px;text-align:left}
    td{font-size:9pt;padding:5px;border-bottom:1px solid #F1F5F9}
    tfoot td{background:#EFF6FF;font-weight:700;color:#1A3E74;border-top:2px solid #1A3E74}
    .nanda-box{border:1px solid #E2E8F0;border-radius:8px;padding:12px;font-size:9pt}
    ul{list-style:none;padding:0} li{border-bottom:1px solid #f1f5f9;padding:6px 0}
  </style></head><body>
  <div class="hdr"><h2>Escala de Braden</h2></div>
  ${n || id || s ? `<div class="secao"><div class="sec-titulo">Paciente</div><p>Nome: ${n} | Idade: ${id} | Setor: ${s}</p></div>` : ""}
  <div class="secao"><div class="res-box"><h1 style="color:#1A3E74;margin:0;font-size:30pt">${soma} / 23</h1><div style="background:${pillColor};color:white;display:inline-block;padding:4px 12px;border-radius:12px;margin-top:10px;font-weight:bold">${classe}</div></div></div>
  <div class="secao"><div class="sec-titulo">Memória</div><table><thead><tr><th>Fator</th><th style="text-align:center">Obtido</th><th style="text-align:center">Máx</th></tr></thead><tbody>${linhas}</tbody><tfoot><tr><td>TOTAL</td><td style="text-align:center">${soma}</td><td style="text-align:center">23</td></tr></tfoot></table></div>
  <div class="secao"><div class="sec-titulo">Diagnósticos NANDA Sugeridos</div><div class="nanda-box"><ul>${nandaHtml}</ul></div></div>
  <div style="margin-top:40px;text-align:center;font-size:8pt;color:#64748b;border-top:1px solid #ccc;padding-top:10px">Assinatura do Profissional<br><br>www.calculadorasdeenfermagem.com.br</div>
  <script>window.onload=function(){window.print();}<\/script></body></html>`;
  
  const janela = window.open("", "_blank");
  janela.document.write(html);
  janela.document.close();
}

document.getElementById("btnCalcular").addEventListener("click", calcular);
document.getElementById("btnLimpar").addEventListener("click", limpar);
document.getElementById("btnImprimir").addEventListener("click", gerarImpressao);
document.getElementById("btnGerarPDF").addEventListener("click", gerarImpressao);

renderizarItens();
atualizarBarraGlobal();
})();