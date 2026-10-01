# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_15_ramsay.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="ramsay",
    name="ESCALA DE SEDAÇÃO DE RAMSAY",
    subtitle="Monitorização do Nível de Sedação e Agitação em Terapia Intensiva e Procedimentos",
    criteria_title="NÍVEIS CLÍNICOS DE SEDAÇÃO DE RAMSAY (MARCAR O NÍVEL CORRESPONDENTE)",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:14%;">Nível</th><th style="width:58%;">Descrição do Comportamento e Resposta a Estímulos</th><th style="width:20%;">Classificação</th><th style="width:8%;text-align:center;">Seleção</th></tr>
      <tr>
        <td><strong>Nível 1</strong></td>
        <td>Paciente ansioso, agitado, inquieto, combativo ou que luta contra o ventilador mecânico.</td>
        <td>Sedação Insuficiente</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td><strong>Nível 2</strong></td>
        <td>Paciente cooperativo, orientado, tranquilo e calmo; aceita ventilação sem esforço.</td>
        <td>Sedação Ideal / Alvo</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td><strong>Nível 3</strong></td>
        <td>Paciente sonolento, responde prontamente a comandos verbais simples.</td>
        <td>Sedação Leve</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td><strong>Nível 4</strong></td>
        <td>Paciente dormindo, apresenta resposta rápida e viva a leve estímulo tátil ou sonoro.</td>
        <td>Sedação Moderada</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td><strong>Nível 5</strong></td>
        <td>Paciente dormindo, apresenta resposta lenta e arrastada a estímulo tátil ou doloroso.</td>
        <td>Sedação Muito Profunda</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
      <tr>
        <td><strong>Nível 6</strong></td>
        <td>Paciente dormindo, não apresenta qualquer resposta a estímulos físicos ou sonoros.</td>
        <td>Sedação Excessiva / Coma</td>
        <td style="text-align:center;"><span class="sq"></span></td>
      </tr>
    </table>
    """,
    score_html="NÍVEL DE SEDAÇÃO ATRIBUÍDO: &nbsp; [ &nbsp; Nível &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] (1 a 6)",
    interp_title="DIRETRIZES CLÍNICAS E TITULAÇÃO DE SEDATIVOS NA UTI",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">NÍVEIS 2 e 3 (FAIXA ALVO IDEAL)</div><div class="interp-body">Paciente calmo, colaborativo e sincrônico com a ventilação; viabiliza cuidados de enfermagem e desmame ventilatório seguro.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">NÍVEL 1 (SUB-SEDAÇÃO)</div><div class="interp-body">Sedação insuficiente ou dor não controlada. Investigar causas reversíveis (hipóxia, retenção urinária) antes de aumentar sedativos.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">NÍVEIS 4 a 6 (SUPER-SEDAÇÃO)</div><div class="interp-body">Sedação excessiva. Aumenta risco de PAV, delirium e tempo de UTI. Realizar protocolo de despertar diário da sedação.</div></div>
    """,
    ref="RAMSAY, M. A. et al. Controlled sedation with alphaxalone-alphadolone. British Medical Journal, 1974; 2(5920):656-659."
)
