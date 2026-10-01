# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_08_braden.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="braden",
    name="ESCALA DE BRADEN",
    subtitle="Avaliação do Risco de Desenvolvimento de Lesão por Pressão (LPP) em Pacientes Hospitalizados",
    criteria_title="6 SUBESCALAS DE AVALIAÇÃO DE RISCO PARA LESÃO POR PRESSÃO",
    criteria_html="""
    <table class="table-data">
      <tr><th style="width:20%;">Subescala</th><th style="width:20%;">1 Ponto</th><th style="width:20%;">2 Pontos</th><th style="width:20%;">3 Pontos</th><th style="width:14%;">4 Pontos</th><th style="width:6%;text-align:center;">Pts</th></tr>
      <tr><td><strong>Percepção Sensorial</strong></td><td>[ ] Totalmente limitada</td><td>[ ] Muito limitada</td><td>[ ] Levemente limitada</td><td>[ ] Nenhuma limitação</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Umidade da Pele</strong></td><td>[ ] Constante/úmida</td><td>[ ] Muito úmida</td><td>[ ] Ocasionalmente úmida</td><td>[ ] Raramente úmida</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Atividade Física</strong></td><td>[ ] Confinado ao leito</td><td>[ ] Confinado à cadeira</td><td>[ ] Deambula ocasional</td><td>[ ] Deambula frequente</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Mobilidade no Leito</strong></td><td>[ ] Totalmente imóvel</td><td>[ ] Muito limitada</td><td>[ ] Levemente limitada</td><td>[ ] Nenhuma limitação</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Nutrição / Ingesta</strong></td><td>[ ] Muito pobre (&lt;1/3)</td><td>[ ] Provavelm. inadequada</td><td>[ ] Adequada (&gt;1/2 refeição)</td><td>[ ] Excelente / Completa</td><td style="text-align:center;">[&nbsp;]</td></tr>
      <tr><td><strong>Fricção e Cisalhamento</strong></td><td>[ ] Problema significat.</td><td>[ ] Problema potencial</td><td>[ ] Sem problema aparente</td><td style="background:#e2e8f0;text-align:center;">&mdash;</td><td style="text-align:center;">[&nbsp;]</td></tr>
    </table>
    """,
    score_html="ESCORE TOTAL DE BRADEN (6 a 23): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="ESTRATIFICAÇÃO DE RISCO E CONDUTAS PREVENTIVAS DE ENFERMAGEM",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#7F1D1D;">&le; 9 PONTOS</div><div class="interp-body"><strong>Risco Muito Alto:</strong> Colchão dinâmico, mudança decúbito a cada 2h, placas hidrocoloides/espuma em sacro/calcâneo.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">10 a 12 PONTOS</div><div class="interp-body"><strong>Risco Alto:</strong> Hidratação cutânea rigorosa com AGE, manejo estrito de umidade e suporte nutricional hiperproteico.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">13 a 14 PONTOS</div><div class="interp-body"><strong>Risco Moderado:</strong> Protocolo de reposicionamento regular, proteção de proeminências ósseas e barreira cutânea.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">15 a 23 PONTOS</div><div class="interp-body"><strong>Risco Baixo / Ausente:</strong> Vigilância diária da integridade da pele no banho e orientações de mobilidade ativa.</div></div>
    """,
    ref="BERGSTROM, N. et al. The Braden Scale for Predicting Pressure Sore Risk. Nursing Research, 1987; 36(4):205-210."
)
