# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_19_silverman.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="silverman",
    name="BOLETIM DE SILVERMAN-ANDERSEN",
    subtitle="Avaliação da Gravidade do Desconforto Respiratório no Recém-Nascido (SDRN)",
    id_row2='<tr><td class="lbl">RN de:</td><td></td><td class="lbl">Sexo / Peso:</td><td>[ ] M [ ] F &bull; ______ g</td></tr><tr><td class="lbl">Idade / Horas:</td><td></td><td class="lbl">Data/Hora:</td><td>___/___/_____ às ___:___</td></tr>',
    criteria_title="5 PARÂMETROS CLÍNICOS DE DESCONFORTO RESPIRATÓRIO NEONATAL",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:25%;">Sinal Clínico Avaliado</th><th style="width:25%;">0 Pontos</th><th style="width:25%;">1 Ponto</th><th style="width:19%;">2 Pontos</th><th style="width:6%;text-align:center;">Pts</th></tr>
      <tr>
        <td><strong>1. Movimentos Toracoabdominais</strong></td>
        <td><span class="sq"></span> Síncronos (tórax e abdome sobem juntos)</td>
        <td><span class="sq"></span> Atraso na inspiração torácica</td>
        <td><span class="sq"></span> Respiração em gangorra (paradoxal)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>2. Tiragem Intercostal</strong></td>
        <td><span class="sq"></span> Ausente</td>
        <td><span class="sq"></span> Discreta (apenas visível)</td>
        <td><span class="sq"></span> Acentuada (afundamento nítido)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>3. Retração Xifoide</strong></td>
        <td><span class="sq"></span> Ausente</td>
        <td><span class="sq"></span> Discreta</td>
        <td><span class="sq"></span> Acentuada</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>4. Batimento de Asas Nasais</strong></td>
        <td><span class="sq"></span> Ausente</td>
        <td><span class="sq"></span> Discreto</td>
        <td><span class="sq"></span> Intenso / Acentuado</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>5. Gemido Expiratório</strong></td>
        <td><span class="sq"></span> Ausente</td>
        <td><span class="sq"></span> Audível com estetoscópio</td>
        <td><span class="sq"></span> Audível a distância sem esteto</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
    </table>
    """,
    score_html="ESCORE TOTAL SILVERMAN-ANDERSEN (0 a 10): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]",
    interp_title="CLASSIFICAÇÃO DO DESCONFORTO RESPIRATÓRIO E CONDUTA",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">0 PONTOS (SEM DESCONFORTO)</div><div class="interp-body">Padrão respiratório fisiológico normal. Manter observação e estímulo ao aleitamento materno.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#EAB308;">1 a 3 PONTOS (DESCONFORTO LEVE)</div><div class="interp-body">Oxigenoterapia inalatória se SpO₂ reduzida, desobstrução das narinas e monitorização seriada.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">4 a 6 PONTOS (MODERADO)</div><div class="interp-body">Indicação frequente de suporte ventilatório não invasivo (CPAP nasal) em UTI neonatal.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&ge; 7 PONTOS (GRAVE / EXAUSTÃO)</div><div class="interp-body">Insuficiência respiratória aguda grave. Preparar intubação orotraqueal e ventilação mecânica.</div></div>
    """,
    ref="SILVERMAN, W. A.; ANDERSEN, D. H. A controlled clinical trial of effects of water mist on respiratory distress syndrome. Pediatrics, 1956; 17(1):1-10."
)
