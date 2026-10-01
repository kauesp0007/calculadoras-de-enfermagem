# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_20_sistema_sinbad.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="sistema_sinbad",
    name="SISTEMA SINBAD (PÉ DIABÉTICO)",
    subtitle="Sistema Padronizado para Classificação e Risco de Amputação em Úlceras do Pé Diabético",
    criteria_title="PARÂMETROS DE AVALIAÇÃO DA ÚLCERA (SINBAD - 0 A 6 PONTOS)",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:25%;">Categoria Clínica</th><th style="width:40%;">0 Pontos</th><th style="width:25%;">1 Ponto</th><th style="width:10%;text-align:center;">Pontos</th></tr>
      <tr>
        <td><strong>S &mdash; Site (Localização)</strong></td>
        <td><span class="sq"></span> Antepé (dedos / cabeça metatarsos)</td>
        <td><span class="sq"></span> Médiopé ou Retropé (calcanhar)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>I &mdash; Ischemia (Isquemia)</strong></td>
        <td><span class="sq"></span> Pulsos pediosos/tibiais palpáveis e normais</td>
        <td><span class="sq"></span> Pelo menos um pulso ausente / DAOP</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>N &mdash; Neuropathy (Neuropatia)</strong></td>
        <td><span class="sq"></span> Sensibilidade protetora preservada</td>
        <td><span class="sq"></span> Perda de sensibilidade (Monofilamento)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>B &mdash; Bacterial Infection</strong></td>
        <td><span class="sq"></span> Ausência de sinais de infecção clínica</td>
        <td><span class="sq"></span> Infecção presente (eritema/secreção)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>A &mdash; Area (Extensão)</strong></td>
        <td><span class="sq"></span> Área superficial da úlcera &lt; 1 cm²</td>
        <td><span class="sq"></span> Área superficial da úlcera &ge; 1 cm²</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>D &mdash; Depth (Profundidade)</strong></td>
        <td><span class="sq"></span> Úlcera superficial restrita à pele/subcutâneo</td>
        <td><span class="sq"></span> Úlcera profunda atingindo tendão/osso</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
    </table>
    """,
    score_html="ESCORE TOTAL SINBAD (0 a 6): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="ESTRATIFICAÇÃO DE RISCO E CONDUTA ASSISTENCIAL",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">0 a 2 PONTOS</div><div class="interp-body"><strong>Baixo Risco de Amputação:</strong> Alta probabilidade de cicatrização com desbridamento conservador e alívio de pressão.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">3 a 4 PONTOS</div><div class="interp-body"><strong>Risco Moderado:</strong> Lesão com complicação vascular ou infecciosa; avaliação médica especializada e comitê de feridas.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">5 a 6 PONTOS</div><div class="interp-body"><strong>Alto Risco de Amputação:</strong> Internamento urgente, arteriografia, antibioticoterapia endovenosa e cirurgia vascular.</div></div>
    """,
    ref="INCE, P. et al. Use of the SINBAD classification system and score in comparing outcome of foot ulcer management on three continents. Diabetes Care, 2008; 31(5):964-967; IWGDF Guidelines."
)
