# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_14_qsofa.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="qsofa",
    name="ESCORE QSOFA (QUICK SOFA)",
    subtitle="Triagem Rápida à Beira do Leito para Risco de Deterioração Clínica em Pacientes com Infecção",
    criteria_title="CRITÉRIOS CLÍNICOS DE TRIAGEM RÁPIDA DE SEPSE (MARCAR SE PRESENTE)",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:25%;">Critério Clínico</th><th style="width:48%;">Definição Operacional e Método de Verificação</th><th style="width:17%;">Ponto de Corte</th><th style="width:10%;text-align:center;">Pontos</th></tr>
      <tr>
        <td><strong>1. Frequência Respiratória</strong><br><small style="color:#64748B;">Taquipneia aguda</small></td>
        <td>Contagem de incursões respiratórias completas por 60 segundos com o tórax do paciente em repouso.</td>
        <td><strong>FR &ge; 22 rpm</strong></td>
        <td style="text-align:center;font-weight:bold;">[ ] 1 ponto</td>
      </tr>
      <tr>
        <td><strong>2. Estado Mental</strong><br><small style="color:#64748B;">Alteração aguda do sensório</small></td>
        <td>Qualquer rebaixamento ou alteração do estado cognitivo prévio basal (Glasgow &lt; 15).</td>
        <td><strong>Glasgow &lt; 15</strong></td>
        <td style="text-align:center;font-weight:bold;">[ ] 1 ponto</td>
      </tr>
      <tr>
        <td><strong>3. Pressão Arterial</strong><br><small style="color:#64748B;">Hipotensão sistólica</small></td>
        <td>Aferição pressórica por método auscultatório com manguito calibrado ou PAI.</td>
        <td><strong>PAS &le; 100 mmHg</strong></td>
        <td style="text-align:center;font-weight:bold;">[ ] 1 ponto</td>
      </tr>
    </table>

    <div class="section-bar" style="margin-top:8px;">PACOTE DE RESPOSTA IMEDIATA NA SUSPEITA DE SEPSE (1ª HORA)</div>
    <div style="font-size:8pt;border:1px solid #CBD5E1;background:#F8FAFC;padding:6px 10px;border-radius:3px;">
      <div class="opt"><span class="sq"></span> Coleta imediata de lactato arterial/venoso e reavaliação seriada se &ge; 2 mmol/L.</div>
      <div class="opt"><span class="sq"></span> Coleta de pelo menos 2 pares de hemoculturas de sítios distintos antes de iniciar antimicrobianos.</div>
      <div class="opt"><span class="sq"></span> Administração precoce de antibióticos de amplo espectro prescritos na primeira hora.</div>
      <div class="opt"><span class="sq"></span> Expansão volêmica rápida (30 mL/kg cristaloide) se hipotensão (PAM &lt; 65 ou PAS &le; 100) ou lactato &ge; 4.</div>
    </div>
    """,
    score_html="ESCORE QSOFA TOTAL (0 a 3 PONTOS): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]",
    interp_title="INTERPRETAÇÃO DO ESCORE E CONDUTA IMEDIATA",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">0 a 1 PONTO (NEGATIVO)</div><div class="interp-body"><strong>Baixo Risco Imediato pelo qSOFA:</strong> Manter vigilância clínica e reavaliação de sinais vitais a cada 4 horas.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&ge; 2 PONTOS (POSITIVO)</div><div class="interp-body"><strong>Alto Risco de Sepse Grave:</strong> Acionar imediatamente o Código de Sepse institucional e o Time de Resposta Rápida (TRR).</div></div>
    """,
    ref="SINGER, M. et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA, 2016; 315(8):801-810; Protocolo ILAS."
)
