# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_05_ballard.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="ballard",
    name="NOVO ESCORE DE BALLARD",
    subtitle="Avaliação Somatoneurológica da Idade Gestacional Neonatal (20 a 44 semanas de gestação)",
    id_row2='<tr><td class="lbl">RN de:</td><td></td><td class="lbl">Sexo / Peso:</td><td>[ ] M [ ] F &bull; ______ g</td></tr><tr><td class="lbl">Data Nasc:</td><td>___/___/_____ às ___:___</td><td class="lbl">Exame em:</td><td>___/___/_____ às ___:___</td></tr>',
    criteria_title="PARÂMETROS DE MATURIDADE NEUROMUSCULAR E FÍSICA",
    criteria_html="""
    <div class="grid-2col">
      <div>
        <div style="font-weight:bold;color:#1A3E74;margin-bottom:4px;font-size:8.2pt;">Maturidade Neuromuscular (Pontuar de -1 a 4/5):</div>
        <table class="table-data" style="font-size:7.5pt;">
          <tr><td><strong>Postura</strong></td><td>[ ] 0 (flácido) &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4 (flexão total)</td><td style="width:12%;text-align:center;">[&nbsp;]</td></tr>
          <tr><td><strong>Janela Quadrada</strong></td><td>[ ] >90° (-1) &bull; [ ] 90° (0) &bull; [ ] 60° (1) &bull; [ ] 45° (2) &bull; [ ] 30° (3) &bull; [ ] 0° (4)</td><td style="text-align:center;">[&nbsp;]</td></tr>
          <tr><td><strong>Recuo do Braço</strong></td><td>[ ] 180° (0) &bull; [ ] 140-180° (1) &bull; [ ] 110-140° (2) &bull; [ ] 90-110° (3) &bull; [ ] <90° (4)</td><td style="text-align:center;">[&nbsp;]</td></tr>
          <tr><td><strong>Ângulo Poplíteo</strong></td><td>[ ] 180° (-1) &bull; [ ] 160° (0) &bull; [ ] 140° (1) &bull; [ ] 120° (2) &bull; [ ] 100° (3) &bull; [ ] 90° (4) &bull; [ ] <90° (5)</td><td style="text-align:center;">[&nbsp;]</td></tr>
          <tr><td><strong>Sinal do Xale</strong></td><td>[ ] Passa linha axilar (-1) &bull; [ ] Axila oposta (0) &bull; [ ] Esterno (1) &bull; [ ] Rígido (2/3)</td><td style="text-align:center;">[&nbsp;]</td></tr>
          <tr><td><strong>Calcanhar à Orelha</strong></td><td>[ ] Toca orelha (-1) &bull; [ ] Quase toca (0) &bull; [ ] Leve resistência (1) &bull; [ ] Difícil (2/3)</td><td style="text-align:center;">[&nbsp;]</td></tr>
        </table>
      </div>
      <div>
        <div style="font-weight:bold;color:#1A3E74;margin-bottom:4px;font-size:8.2pt;">Maturidade Física (Pontuar de -1 a 4/5):</div>
        <table class="table-data" style="font-size:7.5pt;">
          <tr><td><strong>Pele</strong></td><td>[ ] Gelatinosa (-1) &bull; [ ] Lisa/vasos (0) &bull; [ ] Raras veias (1) &bull; [ ] Descamação (2) &bull; [ ] Couro (3/4)</td><td style="width:12%;text-align:center;">[&nbsp;]</td></tr>
          <tr><td><strong>Lanugem</strong></td><td>[ ] Ausente (-1) &bull; [ ] Rara (0) &bull; [ ] Abundante (1) &bull; [ ] Adelgaçando (2) &bull; [ ] Nula (3/4)</td><td style="text-align:center;">[&nbsp;]</td></tr>
          <tr><td><strong>Superfície Plantar</strong></td><td>[ ] Sem pregas (-1) &bull; [ ] Linhas tênues (0) &bull; [ ] Pregas ant. (1) &bull; [ ] Sulcos totais (2/3)</td><td style="text-align:center;">[&nbsp;]</td></tr>
          <tr><td><strong>Mamas</strong></td><td>[ ] Imperceptível (-1) &bull; [ ] Plana (0) &bull; [ ] 1-2mm (1) &bull; [ ] 3-4mm (2) &bull; [ ] Completa 5-10mm (3)</td><td style="text-align:center;">[&nbsp;]</td></tr>
          <tr><td><strong>Olhos / Orelhas</strong></td><td>[ ] Pálpebras fundidas (-1/0) &bull; [ ] Recuo lento (1) &bull; [ ] Recuo pronto (2) &bull; [ ] Cartilagem firme (3)</td><td style="text-align:center;">[&nbsp;]</td></tr>
          <tr><td><strong>Genitália</strong></td><td><strong>M:</strong> [ ] Plana (-1/0) &bull; [ ] Testículos descendo (1/2) &bull; [ ] Pêndulo c/ rugas (3)<br><strong>F:</strong> [ ] Clitóris prom. (-1/0) &bull; [ ] Lábios iguais (1) &bull; [ ] Gdes cobrem (2/3)</td><td style="text-align:center;">[&nbsp;]</td></tr>
        </table>
      </div>
    </div>
    """,
    score_html="ESCORE TOTAL BALLARD: &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] / 50 &nbsp; &bull; &nbsp; IDADE GESTACIONAL ESTIMADA: &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] SEMANAS",
    interp_title="CONVERSÃO DO ESCORE EM IDADE GESTACIONAL (SEMANAS) E CLASSIFICAÇÃO",
    interp_cards_html="""
      <div class="interp-card">
        <div class="interp-head" style="background:#DC2626;">PRÉ-TERMO EXTREMO E MODERADO</div>
        <div class="interp-body"><strong>-10:</strong> 20 sem &bull; <strong>-5:</strong> 22 sem &bull; <strong>0:</strong> 24 sem &bull; <strong>5:</strong> 26 sem &bull; <strong>10:</strong> 28 sem &bull; <strong>15:</strong> 30 sem &bull; <strong>20:</strong> 32 sem &bull; <strong>25:</strong> 34 sem.</div>
      </div>
      <div class="interp-card">
        <div class="interp-head" style="background:#16A34A;">A TERMO (37 A 41 SEMANAS)</div>
        <div class="interp-body"><strong>30 pts:</strong> 36 sem &bull; <strong>35 pts:</strong> 38 sem &bull; <strong>40 pts:</strong> 40 sem. Adaptação fisiológica madura.</div>
      </div>
      <div class="interp-card">
        <div class="interp-head" style="background:#F97316;">PÓS-TERMO (≥ 42 SEMANAS)</div>
        <div class="interp-body"><strong>45 pts:</strong> 42 sem &bull; <strong>50 pts:</strong> 44 sem. Vigilância para mecônio, hipoglicemia e descamação avançada.</div>
      </div>
    """,
    ref="BALLARD, J. L. et al. New Ballard Score, expanded to include extremely premature infants. J Pediatr, 1991; 119(3):417-423."
)
