# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_25_downes.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="downes",
    name="ESCORE DE WOOD-DOWNES",
    subtitle="Avaliação da Gravidade do Desconforto Respiratório e Bronquiolite em Pediatria",
    criteria_title="6 PARÂMETROS CLÍNICOS DE AVALIAÇÃO RESPIRATÓRIA PEDIÁTRICA",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:24%;">Sinal Clínico</th><th style="width:25%;">0 Pontos</th><th style="width:25%;">1 Ponto</th><th style="width:20%;">2 Pontos</th><th style="width:6%;text-align:center;">Pts</th></tr>
      <tr>
        <td><strong>1. Cianose</strong></td>
        <td><span class="sq"></span> Ausente em ar ambiente</td>
        <td><span class="sq"></span> Presente em ar ambiente</td>
        <td><span class="sq"></span> Presente com O₂ (FiO₂ > 40%)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>2. Tiragens</strong></td>
        <td><span class="sq"></span> Ausente</td>
        <td><span class="sq"></span> Subcostal / Intercostal leve</td>
        <td><span class="sq"></span> Universal / Batimento de asa</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>3. Frequência Respiratória</strong></td>
        <td><span class="sq"></span> &lt; 30 rpm (normal p/ idade)</td>
        <td><span class="sq"></span> 31 a 60 rpm</td>
        <td><span class="sq"></span> &gt; 60 rpm (taquipneia grave)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>4. Murmúrio Vesicular</strong></td>
        <td><span class="sq"></span> Simétrico e bem distribuído</td>
        <td><span class="sq"></span> Diminuição localizada</td>
        <td><span class="sq"></span> Muito diminuído / inaudível</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>5. Sibilos</strong></td>
        <td><span class="sq"></span> Ausentes</td>
        <td><span class="sq"></span> Expiratórios discretos</td>
        <td><span class="sq"></span> Insp. e expiratórios / Silêncio</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>6. Sensório / Consciência</strong></td>
        <td><span class="sq"></span> Alerta, calmo, responsivo</td>
        <td><span class="sq"></span> Agitado, irritável, ansioso</td>
        <td><span class="sq"></span> Letárgico, sonolento, torporoso</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
    </table>
    """,
    score_html="ESCORE TOTAL WOOD-DOWNES (0 a 12): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="ESTRATIFICAÇÃO DA GRAVIDADE RESPIRATÓRIA E CONDUTA",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">1 a 3 PONTOS (LEVE)</div><div class="interp-body">Crise leve. Inalação broncodilatadora prescrita, hidratação e vigilância oximétrica ambulatorial/enfermaria.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">4 a 7 PONTOS (MODERADO)</div><div class="interp-body">Desconforto moderado. Oxigenoterapia em máscara, corticoterapia sistêmica e reavaliação médica seriada.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&ge; 8 PONTOS (GRAVE / FADIGA)</div><div class="interp-body">Iminência de falência respiratória. Suporte ventilatório (VNI/IOT) e internação urgente em UTI pediátrica.</div></div>
    """,
    ref="DOWNES, J. J. et al. Respiratory failure in status asthmaticus in children. Crit Care Med, 1972; 1:44-49; WOOD, D. W. et al. Am J Dis Child, 1972."
)
