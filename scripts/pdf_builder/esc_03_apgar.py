# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_03_apgar.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="apgar",
    name="ÍNDICE DE APGAR",
    subtitle="Avaliação da Vitalidade e Adaptação Neonatal na Sala de Parto (1º, 5º e 10º minuto de vida)",
    id_row2='<tr><td class="lbl">RN de:</td><td></td><td class="lbl">Sexo / Peso:</td><td>[ ] M [ ] F &bull; ______ g</td></tr><tr><td class="lbl">Tipo Parto:</td><td>[ ] Normal [ ] Cesárea</td><td class="lbl">Data/Hora:</td><td>___/___/_____ às ___:___</td></tr>',
    criteria_title="PARÂMETROS CLÍNICOS DO ÍNDICE DE APGAR",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:24%;">Sinal Clínico</th><th style="width:24%;">0 Pontos</th><th style="width:24%;">1 Ponto</th><th style="width:20%;">2 Pontos</th><th style="width:8%;text-align:center;">1º min</th><th style="width:8%;text-align:center;">5º min</th></tr>
      <tr>
        <td><strong>Frequência Cardíaca</strong><br><small style="color:#64748B;">Ausculta pulso apical</small></td>
        <td><span class="sq"></span> Ausente (0)</td>
        <td><span class="sq"></span> < 100 batimentos/min (1)</td>
        <td><span class="sq"></span> ≥ 100 batimentos/min (2)</td>
        <td style="text-align:center;font-weight:bold;font-size:10pt;">[&nbsp;]</td>
        <td style="text-align:center;font-weight:bold;font-size:10pt;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>Esforço Respiratório</strong><br><small style="color:#64748B;">Ventilação espontânea</small></td>
        <td><span class="sq"></span> Ausente / Apneia (0)</td>
        <td><span class="sq"></span> Lento, irregular, fraco (1)</td>
        <td><span class="sq"></span> Bom, choro vigoroso (2)</td>
        <td style="text-align:center;font-weight:bold;font-size:10pt;">[&nbsp;]</td>
        <td style="text-align:center;font-weight:bold;font-size:10pt;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>Tônus Muscular</strong><br><small style="color:#64748B;">Atividade e flexão</small></td>
        <td><span class="sq"></span> Flácido, hipotônico (0)</td>
        <td><span class="sq"></span> Alguma flexão de membros (1)</td>
        <td><span class="sq"></span> Movimento ativo, boa flexão (2)</td>
        <td style="text-align:center;font-weight:bold;font-size:10pt;">[&nbsp;]</td>
        <td style="text-align:center;font-weight:bold;font-size:10pt;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>Irritabilidade Reflexa</strong><br><small style="color:#64748B;">Resposta ao estímulo</small></td>
        <td><span class="sq"></span> Sem resposta (0)</td>
        <td><span class="sq"></span> Algum movimento / caretas (1)</td>
        <td><span class="sq"></span> Tosse, espirro, choro ativo (2)</td>
        <td style="text-align:center;font-weight:bold;font-size:10pt;">[&nbsp;]</td>
        <td style="text-align:center;font-weight:bold;font-size:10pt;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>Cor da Pele</strong><br><small style="color:#64748B;">Perfusão periférica</small></td>
        <td><span class="sq"></span> Cianose central ou palidez (0)</td>
        <td><span class="sq"></span> Corpo rosado, acrocianose (1)</td>
        <td><span class="sq"></span> Completamente rosado (2)</td>
        <td style="text-align:center;font-weight:bold;font-size:10pt;">[&nbsp;]</td>
        <td style="text-align:center;font-weight:bold;font-size:10pt;">[&nbsp;]</td>
      </tr>
    </table>
    """,
    score_html="ESCORES DE APGAR: &nbsp; 1º MINUTO: [ &nbsp; &nbsp; ] / 10 &nbsp; &bull; &nbsp; 5º MINUTO: [ &nbsp; &nbsp; ] / 10 &nbsp; &bull; &nbsp; 10º MINUTO: [ &nbsp; &nbsp; ]",
    interp_title="INTERPRETAÇÃO DO GRAU DE VITALIDADE E CONDUTA NEONATAL",
    interp_cards_html="""
      <div class="interp-card">
        <div class="interp-head" style="background:#16A34A;">8 a 10 PONTOS (BOA VITALIDADE)</div>
        <div class="interp-body">Recém-nascido vigoroso, sem asfixia perinatal. Cuidados rotineiros da sala de parto, contato pele a pele e aleitamento na primeira hora.</div>
      </div>
      <div class="interp-card">
        <div class="interp-head" style="background:#F97316;">4 a 7 PONTOS (ASFIXIA LEVE A MODERADA)</div>
        <div class="interp-body">Necessidade de passos iniciais de assistência imediata: aquecer, secar, posicionar vias aéreas, aspirar se necessário e O₂/estímulo.</div>
      </div>
      <div class="interp-card">
        <div class="interp-head" style="background:#DC2626;">0 a 3 PONTOS (ASFIXIA GRAVE)</div>
        <div class="interp-body">Emergência neonatal absoluta. Iniciar imediatamente passos de reanimação cardiopulmonar (VPP c/ máscara e oxigênio conforme diretrizes SBP).</div>
      </div>
    """,
    ref="APGAR, V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg, 1953; 32(4):260-267; Diretrizes SBP de Reanimação Neonatal."
)
