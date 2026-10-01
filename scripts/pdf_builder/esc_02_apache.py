# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_02_apache.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="apache",
    name="ESCORE APACHE II",
    subtitle="Acute Physiology and Chronic Health Evaluation II — Gravidade Clínica em Terapia Intensiva",
    criteria_title="PARÂMETROS FISIOLÓGICOS AGUDOS (PIORES VALORES NAS PRIMEIRAS 24H DE UTI)",
    criteria_html="""
    <table class="table-data" style="font-size:7.4pt;">
      <tr><th style="width:25%;">Variável Fisiológica</th><th style="width:65%;">Faixas de Pontuação (+1 a +4 pts) e Valores Normais (0 pts)</th><th style="width:10%;text-align:center;">Pts</th></tr>
      <tr><td><strong>Temperatura Central</strong></td><td>[ ] 36,0-38,4°C (0) &bull; [ ] 38,5-38,9°C (1) &bull; [ ] 39-40,9°C (3) &bull; [ ] ≥41°C (4) &bull; [ ] 34-35,9°C (1) &bull; [ ] ≤33,9°C (2/4)</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Pressão Média (PAM)</strong></td><td>[ ] 70-109 mmHg (0) &bull; [ ] 110-129 (2) &bull; [ ] 130-159 (3) &bull; [ ] ≥160 (4) &bull; [ ] 50-69 (2) &bull; [ ] ≤49 (4)</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Frequência Cardíaca</strong></td><td>[ ] 70-109 bpm (0) &bull; [ ] 110-139 (2) &bull; [ ] 140-179 (3) &bull; [ ] ≥180 (4) &bull; [ ] 55-69 (2) &bull; [ ] ≤54 (3/4)</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Frequência Respiratória</strong></td><td>[ ] 12-24 rpm (0) &bull; [ ] 25-34 (1) &bull; [ ] 35-49 (3) &bull; [ ] ≥50 (4) &bull; [ ] 10-11 (1) &bull; [ ] ≤9 (2/4)</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Oxigenação</strong></td><td>[ ] PaO₂ >70 (0) &bull; [ ] 61-70 (1) &bull; [ ] 55-60 (3) &bull; [ ] <55 (4) &bull; (Se FiO₂≥0.5: A-aDO₂ 200-349 (2), ≥350 (3/4))</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>pH Arterial</strong></td><td>[ ] pH 7,33-7,49 (0) &bull; [ ] 7,50-7,59 (1) &bull; [ ] ≥7,70 (4) &bull; [ ] 7,25-7,32 (2) &bull; [ ] 7,15-7,24 (3) &bull; [ ] <7,15 (4)</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Sódio (Na⁺) / Potássio (K⁺)</strong></td><td>[ ] Na 130-149 / K 3,5-5,4 (0) &bull; [ ] Na ≥150 ou ≤129 (1 a 4) &bull; [ ] K ≥5,5 ou ≤3,4 (1 a 4)</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Creatinina / Hematócrito</strong></td><td>[ ] Creat 0,6-1,4 (0) &bull; [ ] Creat ≥1,5 (2 a 4) &bull; [ ] Ht 30-45,9% (0) &bull; [ ] Ht alterado (1 a 4)</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Leucócitos / Glasgow</strong></td><td>[ ] Leuc 3-14,9 (0) &bull; [ ] Leuc alterado (1 a 4) &bull; [ ] Glasgow: 15 menos pontuação real</td><td style="text-align:center;">[&nbsp;]</td></tr>
    </table>
    <div class="grid-2col" style="margin-top:2px;">
      <div class="item-box"><span class="item-box-title">Pontos por Idade:</span> [ ] ≤44 (0) &bull; [ ] 45-54 (2) &bull; [ ] 55-64 (3) &bull; [ ] 65-74 (5) &bull; [ ] ≥75 anos (6)</div>
      <div class="item-box"><span class="item-box-title">Doença Crônica Grave:</span> [ ] Nenhuma (0) &bull; [ ] Cirurgia Eletiva (+2) &bull; [ ] Não-cirúrgico / Emergência (+5)</div>
    </div>
    """,
    score_html="ESCORE TOTAL APACHE II (0 a 71): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]",
    interp_title="ESTRATIFICAÇÃO PROGNÓSTICA E TAXA DE MORTALIDADE ESTIMADA",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">0 a 9 PONTOS</div><div class="interp-body">Mortalidade estimada ~4% a 8%. Gravidade fisiológica baixa.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#2563EB;">10 a 19 PONTOS</div><div class="interp-body">Mortalidade estimada ~15% a 25%. Gravidade intermediária na UTI.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">20 a 29 PONTOS</div><div class="interp-body">Mortalidade estimada ~40% a 55%. Alto risco de disfunção múltipla.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">≥ 30 PONTOS</div><div class="interp-body">Mortalidade estimada > 75% a 85%. Gravidade extrema em UTI.</div></div>
    """,
    ref="KNAUS, W. A. et al. APACHE II: a severity of disease classification system. Crit Care Med, 1985; 13(10):818-829."
)
