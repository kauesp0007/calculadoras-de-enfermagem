# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_18_saps.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="saps",
    name="ESCORE SAPS 3 (SIMPLIFIED ACUTE PHYSIOLOGY SCORE 3)",
    subtitle="Índice Prognóstico e Predição de Mortalidade Hospitalar na Admissão em UTI",
    criteria_title="COMPONENTES DO ESCORE SAPS 3 (PRIMEIRA HORA DE ADMISSÃO NA UTI)",
    criteria_html="""
    <div class="grid-2col">
      <div>
        <div class="item-box"><span class="item-box-title">1. Dados do Paciente e Comorbidades:</span><br>
          &bull; Idade: [ ] <40 (0) &bull; [ ] 40-59 (5) &bull; [ ] 60-69 (9) &bull; [ ] 70-74 (13) &bull; [ ] 75-79 (16) &bull; [ ] ≥80 (18)<br>
          &bull; Doenças prévias: [ ] Câncer hematológico (6) &bull; [ ] Cirrose (8) &bull; [ ] ICC IV (6) &bull; [ ] Metástases (11)<br>
          &bull; Tempo internação pré-UTI: [ ] <14 dias (0) &bull; [ ] 14-27 dias (6) &bull; [ ] ≥28 dias (7)
        </div>
        <div class="item-box"><span class="item-box-title">2. Circunstâncias de Admissão:</span><br>
          &bull; Origem: [ ] Emergência (0) &bull; [ ] Enfermaria (5) &bull; [ ] Outra UTI (7)<br>
          &bull; Tipo cirúrgico: [ ] Eletiva (0) &bull; [ ] Não cirúrgico (5) &bull; [ ] Emergência (11)<br>
          &bull; Infecção nosocomial: [ ] Não (0) &bull; [ ] Sim (+4)
        </div>
      </div>
      <div>
        <div class="item-box"><span class="item-box-title">3. Parâmetros Fisiológicos na 1ª Hora:</span><br>
          &bull; Glasgow: [ ] ≥13 (0) &bull; [ ] 7-12 (7) &bull; [ ] 3-6 (15)<br>
          &bull; PAS mais baixa: [ ] ≥120 (0) &bull; [ ] 80-119 (3) &bull; [ ] 40-79 (8) &bull; [ ] <40 (11)<br>
          &bull; FC mais alta: [ ] <120 (0) &bull; [ ] 120-159 (5) &bull; [ ] ≥160 (7)<br>
          &bull; PaO₂/FiO₂: [ ] ≥250 (0) &bull; [ ] 100-249 (7) &bull; [ ] <100 (11)<br>
          &bull; Plaquetas: [ ] ≥100 (0) &bull; [ ] 50-99 (5) &bull; [ ] <50 (8)<br>
          &bull; Creatinina: [ ] Normal (0) &bull; [ ] 1,2-2,0 (2) &bull; [ ] >2,0 (7)
        </div>
      </div>
    </div>
    """,
    score_html="ESCORE TOTAL SAPS 3: &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="ESTRATIFICAÇÃO PROGNÓSTICA E RISCO DE MORTALIDADE",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">SAPS 3 &lt; 40</div><div class="interp-body">Mortalidade hospitalar estimada &le; 10%. Gravidade fisiológica inicial reduzida.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#2563EB;">SAPS 3 40 a 55</div><div class="interp-body">Mortalidade estimada entre 15% a 35%. Risco intermediário em terapia intensiva.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">SAPS 3 56 a 70</div><div class="interp-body">Mortalidade estimada entre 40% a 65%. Alto risco de complicações e disfunção.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">SAPS 3 &gt; 70</div><div class="interp-body">Mortalidade estimada &gt; 70% na UTI. Gravidade fisiológica extrema.</div></div>
    """,
    ref="MORENO, R. P. et al. SAPS 3 - From evaluation of the patient to evaluation of the intensive care unit. Intensive Care Med, 2005; 31(10):1336-1344."
)
