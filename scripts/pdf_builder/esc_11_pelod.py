# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_11_pelod.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="pelod",
    name="ESCORE PELOD-2",
    subtitle="Pediatric Logistic Organ Dysfunction 2 — Gravidade e Falência Orgânica em UTI Pediátrica",
    criteria_title="PARÂMETROS DE DISFUNÇÃO ORGÂNICA EM UTI PEDIÁTRICA",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:20%;">Sistema Orgânico</th><th style="width:30%;">Variável Clínica / Laboratorial</th><th style="width:40%;">Pontuação por Faixa</th><th style="width:10%;text-align:center;">Pts</th></tr>
      <tr>
        <td><strong>1. Neurológico</strong></td>
        <td>&bull; Escala de Glasgow<br>&bull; Reatividade Pupilar</td>
        <td>[ ] Glasgow 11-15 (0) &bull; [ ] 5-10 (1) &bull; [ ] 3-4 (4)<br>[ ] Ambas reativas (0) &bull; [ ] Ambas fixas (5)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>2. Cardiovascular</strong></td>
        <td>&bull; Lactato sérico (mmol/L)<br>&bull; PAM hipotensa para idade</td>
        <td>[ ] Lactato &lt; 5,0 (0) &bull; [ ] 5,0-10,9 (1) &bull; [ ] &ge; 11,0 (4)<br>[ ] PAM normal p/ idade (0) &bull; [ ] Hipotensão grave (2)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>3. Renal</strong></td>
        <td>&bull; Creatinina sérica (&mu;mol/L ou mg/dL)</td>
        <td>[ ] Normal para idade (0) &bull; [ ] Levemente elevada (1) &bull; [ ] &gt;2x limite superior normal (2)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>4. Respiratório</strong></td>
        <td>&bull; PaO₂/FiO₂ ou PaCO₂<br>&bull; Ventilação Mecânica Invasiva</td>
        <td>[ ] PaO₂/FiO₂ &ge; 400 (0) &bull; [ ] 200-399 (1) &bull; [ ] &lt; 200 (2)<br>[ ] Sem ventilação mecânica (0) &bull; [ ] Em VMI (1)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
      <tr>
        <td><strong>5. Hematológico</strong></td>
        <td>&bull; Contagem de Plaquetas<br>&bull; Leucócitos totais</td>
        <td>[ ] Plaquetas &ge; 70 x10³/mm³ (0) &bull; [ ] 35-69 (1) &bull; [ ] &lt; 35 (2)<br>[ ] Leucócitos &ge; 2,0 x10³/mm³ (0) &bull; [ ] &lt; 2,0 (2)</td>
        <td style="text-align:center;font-weight:bold;">[&nbsp;&nbsp;&nbsp;&nbsp;]</td>
      </tr>
    </table>
    """,
    score_html="ESCORE TOTAL PELOD-2 (0 a 33): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="ESTRATIFICAÇÃO PROGNÓSTICA E RISCO DE MORTALIDADE NA UTIP",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">0 a 5 PONTOS</div><div class="interp-body"><strong>Baixo Risco (&lt; 2% mortalidade):</strong> Disfunção orgânica mínima; evolução estável em terapia intensiva.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">6 a 12 PONTOS</div><div class="interp-body"><strong>Risco Moderado a Alto (10% a 35%):</strong> Disfunção de múltiplos órgãos; suporte intensivo e monitorização contínua.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&ge; 13 PONTOS</div><div class="interp-body"><strong>Gravidade Extrema (&gt; 50% de mortalidade):</strong> Falência de múltiplos órgãos; suporte avançado de vida invasivo.</div></div>
    """,
    ref="LETOURNEUR, S. et al. PELOD-2: an update of the Pediatric Logistic Organ Dysfunction score. Crit Care Med, 2013; 41(7):1761-1773."
)
