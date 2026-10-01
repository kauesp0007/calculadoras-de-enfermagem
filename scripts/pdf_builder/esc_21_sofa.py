# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_21_sofa.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="sofa",
    name="ESCORE SOFA",
    subtitle="Sequential Organ Failure Assessment — Avaliação Sequencial de Falência Orgânica em Sepse e UTI",
    criteria_title="6 SISTEMAS ORGÂNICOS AVALIADOS (0 A 4 PONTOS POR SISTEMA)",
    criteria_html="""
    <table class="table-data" style="font-size:7.5pt;">
      <tr><th style="width:18%;">Sistema Orgânico</th><th style="width:16%;">0 Pontos</th><th style="width:18%;">1 Ponto</th><th style="width:18%;">2 Pontos</th><th style="width:24%;">3 a 4 Pontos</th><th style="width:6%;text-align:center;">Pts</th></tr>
      <tr>
        <td><strong>1. Respiração</strong><br>PaO₂/FiO₂ (mmHg)</td>
        <td>&ge; 400</td>
        <td>&lt; 400</td>
        <td>&lt; 300</td>
        <td>&lt; 200 c/ VM (3) &bull; &lt; 100 c/ VM (4)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>2. Coagulação</strong><br>Plaquetas (x10³/mm³)</td>
        <td>&ge; 150</td>
        <td>&lt; 150</td>
        <td>&lt; 100</td>
        <td>&lt; 50 (3) &bull; &lt; 20 (4)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>3. Fígado</strong><br>Bilirrubina (mg/dL)</td>
        <td>&lt; 1,2</td>
        <td>1,2 &ndash; 1,9</td>
        <td>2,0 &ndash; 5,9</td>
        <td>6,0 &ndash; 11,9 (3) &bull; &ge; 12,0 (4)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>4. Cardiovascular</strong><br>PAM e Aminas</td>
        <td>PAM &ge; 70</td>
        <td>PAM &lt; 70</td>
        <td>Dopamina &le;5 ou Dobuta</td>
        <td>Dopa >5 ou Nora &le;0,1 (3) &bull; Nora >0,1 (4)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>5. SNC</strong><br>Escala de Glasgow</td>
        <td>15</td>
        <td>13 &ndash; 14</td>
        <td>10 &ndash; 12</td>
        <td>6 &ndash; 9 (3) &bull; &lt; 6 (4)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>6. Renal</strong><br>Creatinina ou Diurese</td>
        <td>&lt; 1,2</td>
        <td>1,2 &ndash; 1,9</td>
        <td>2,0 &ndash; 3,4</td>
        <td>3,5-4,9 ou <500mL/d (3) &bull; ≥5,0 ou <200mL/d (4)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;]</td>
      </tr>
    </table>
    """,
    score_html="ESCORE TOTAL SOFA (0 a 24): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="DIAGNÓSTICO DE SEPSE (SEPSIS-3) E MORTALIDADE ESTIMADA",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">AUMENTO &ge; 2 PONTOS</div><div class="interp-body">Define disfunção orgânica ameaçadora à vida secundária à infecção (Critério diagnóstico de <strong>Sepse</strong>).</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#2563EB;">0 a 6 PONTOS</div><div class="interp-body">Mortalidade estimada &lt; 10%. Disfunção orgânica incipiente; manter suporte e tratamento da infecção.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">7 a 14 PONTOS</div><div class="interp-body">Mortalidade estimada de 15% a 50%. Necessidade frequente de aminas vasoativas e ventilação mecânica.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&ge; 15 PONTOS</div><div class="interp-body">Mortalidade estimada &gt; 80%. Falência de múltiplos órgãos refratária em UTI.</div></div>
    """,
    ref="VINCENT, J. L. et al. The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. Intensive Care Med, 1996; 22(7):707-710."
)
