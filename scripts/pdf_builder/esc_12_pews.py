# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_12_pews.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="pews",
    name="ESCORE PEWS (PEDIATRIC EARLY WARNING SCORE)",
    subtitle="Identificação Precoce de Deterioração Clínica em Pacientes Pediátricos Hospitalizados",
    criteria_title="PARÂMETROS DE ALERTA PRECOCE PEDIÁTRICO (BRIGHTON PEWS)",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:22%;">Domínio</th><th style="width:19%;">0 Pontos</th><th style="width:21%;">1 Ponto</th><th style="width:21%;">2 Pontos</th><th style="width:17%;">3 Pontos</th></tr>
      <tr>
        <td><strong>Comportamento / Neurológico</strong></td>
        <td><span class="sq"></span> Brincando / Apropriado</td>
        <td><span class="sq"></span> Sonolento / Consolável</td>
        <td><span class="sq"></span> Irritável / Difícil consolo</td>
        <td><span class="sq"></span> Letárgico / Redução resposta à dor</td>
      </tr>
      <tr>
        <td><strong>Cardiovascular (Cor e Perfusão)</strong></td>
        <td><span class="sq"></span> Rosado / TEC 1-2s</td>
        <td><span class="sq"></span> Pálido / TEC 3s</td>
        <td><span class="sq"></span> Moteado / TEC 4s / Taquicardia +20</td>
        <td><span class="sq"></span> Cinzento / TEC &ge;5s / Bradicardia</td>
      </tr>
      <tr>
        <td><strong>Respiratório (Esforço e FR)</strong></td>
        <td><span class="sq"></span> FR normal / Sem tiragem</td>
        <td><span class="sq"></span> FR +10 acima / Tiragem leve</td>
        <td><span class="sq"></span> FR +20 acima / FiO₂ &gt; 30%</td>
        <td><span class="sq"></span> FR +30 acima ou bradipneia / FiO₂ &ge; 40%</td>
      </tr>
    </table>
    <div style="font-size:7.5pt;background:#EFF6FF;border:1px solid #BFDBFE;padding:4px 8px;border-radius:3px;margin-top:4px;">
      <strong>Critérios Adicionais (+2 Pontos):</strong>
      <span style="margin-left:10px;"><span class="sq"></span> Nebulização contínua de resgate (+2)</span>
      <span style="margin-left:14px;"><span class="sq"></span> Vômitos pós-operatórios incoercíveis (+2)</span>
    </div>
    """,
    score_html="ESCORE TOTAL PEWS (0 a 11): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="ESTRATIFICAÇÃO DE RISCO CLÍNICO E PROTOCOLO DE ACIONAMENTO",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">0 a 2 PONTOS (VERDE)</div><div class="interp-body"><strong>Baixo Risco:</strong> Conduta de rotina. Monitorização habitual de sinais vitais a cada 4 a 6 horas.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#EAB308;">3 a 4 PONTOS (AMARELO)</div><div class="interp-body"><strong>Risco Moderado:</strong> Notificar enfermeiro responsável e médico assistente. Reavaliação seriada a cada 1-2h.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&ge; 5 PONTOS (VERMELHO)</div><div class="interp-body"><strong>Alto Risco / Emergência:</strong> Acionar imediatamente o Time de Resposta Rápida (TRR) ou médico intensivista.</div></div>
    """,
    ref="MONAGHAN, A. Detecting and managing deterioration in children. Paediatr Nurs, 2005; 17(1):32-35; DUNCAN, H. et al. Brighton PEWS, 2006."
)
