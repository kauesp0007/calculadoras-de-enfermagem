# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_13_prism.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="prism",
    name="ESCORE PRISM (PEDIATRIC RISK OF MORTALITY)",
    subtitle="Predição de Mortalidade Pediátrica e Gravidade Fisiológica em Cuidados Intensivos",
    criteria_title="PARÂMETROS CLÍNICOS E LABORATORIAIS PEDIÁTRICOS (PRISM III)",
    criteria_html="""
    <div class="grid-2col">
      <div>
        <div class="item-box"><span class="item-box-title">1. Pressão Sistólica (PAS):</span><br>[ ] Normal p/ idade (0) &bull; [ ] Hipotensão moderada (3) &bull; [ ] Hipotensão grave (7)</div>
        <div class="item-box"><span class="item-box-title">2. Frequência Cardíaca (FC):</span><br>[ ] Normal p/ idade (0) &bull; [ ] Taquicardia moderada (3) &bull; [ ] Taquicardia grave / Bradicardia (4)</div>
        <div class="item-box"><span class="item-box-title">3. Temperatura Central:</span><br>[ ] 36,0 - 38,4°C (0) &bull; [ ] > 40°C ou < 33°C (3)</div>
        <div class="item-box"><span class="item-box-title">4. Reação Pupilar:</span><br>[ ] Ambas reativas (0) &bull; [ ] Uma fixa (4) &bull; [ ] Ambas fixas/midriáticas (10)</div>
        <div class="item-box"><span class="item-box-title">5. Escala de Glasgow (ECG):</span><br>[ ] ECG &ge; 8 (0) &bull; [ ] ECG &lt; 8 (6)</div>
      </div>
      <div>
        <div class="item-box"><span class="item-box-title">6. Acidose / pH Arterial:</span><br>[ ] pH 7,28 - 7,48 (0) &bull; [ ] pH 7,00 - 7,27 (2) &bull; [ ] pH &lt; 7,00 (6)</div>
        <div class="item-box"><span class="item-box-title">7. Oxigenação (PaO₂ / PaCO₂):</span><br>[ ] PaO₂ >50 / PaCO₂ &le;50 (0) &bull; [ ] Alterado moderado (2) &bull; [ ] PaO₂ &lt;40 ou PaCO₂ &gt;65 (6)</div>
        <div class="item-box"><span class="item-box-title">8. Coagulação (TP / TTPa):</span><br>[ ] RNI normal (0) &bull; [ ] RNI 1,5 - 2,0 (2) &bull; [ ] RNI &gt; 2,0 ou TTPa alargado (4)</div>
        <div class="item-box"><span class="item-box-title">9. Potássio Sérico (K⁺):</span><br>[ ] 3,0 - 5,5 mEq/L (0) &bull; [ ] &lt; 3,0 ou &gt; 5,5 mEq/L (3)</div>
        <div class="item-box"><span class="item-box-title">10. Glicemia / Creatinina:</span><br>[ ] Normais (0) &bull; [ ] Glicemia &gt; 200 mg/dL ou Creatinina &gt;2x limite (2)</div>
      </div>
    </div>
    """,
    score_html="ESCORE TOTAL PRISM: &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="ESTRATIFICAÇÃO DO RISCO DE MORTALIDADE NA UTI PEDIÁTRICA",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">&lt; 10 PONTOS</div><div class="interp-body"><strong>Baixo Risco (&lt; 5% mortalidade):</strong> Resposta satisfatória à terapêutica intensiva inicial.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">10 a 19 PONTOS</div><div class="interp-body"><strong>Risco Moderado a Alto (10% a 30%):</strong> Disfunções orgânicas em progressão; suporte avançado.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&ge; 20 PONTOS</div><div class="interp-body"><strong>Risco Muito Alto (&gt; 50% de mortalidade):</strong> Falência de múltiplos órgãos; suporte invasivo pleno.</div></div>
    """,
    ref="POLLACK, M. M. et al. PRISM III: an updated Pediatric Risk of Mortality score. Crit Care Med, 1996; 24(5):743-752."
)
