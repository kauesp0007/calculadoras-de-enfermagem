# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_23_zarit.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="zarit",
    name="ESCALA DE SOBRECARGA DO CUIDADOR DE ZARIT (ZBI)",
    subtitle="Avaliação do Nível de Sobrecarga Emocional, Física e Social do Cuidador Familiar",
    criteria_title="QUESTIONÁRIO DO CUIDADOR (0=NUNCA, 1=RARAMENTE, 2=ÀS VEZES, 3=FREQUENTEMENTE, 4=SEMPRE)",
    criteria_html="""
    <div class="grid-2col">
      <div>
        <div class="item-box"><span class="item-box-title">1. Sente que ele pede mais ajuda do que precisa?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">2. Sente que não tem tempo suficiente para si?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">3. Sente-se estressado entre cuidar e outras tarefas?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">4. Sente-se constrangido com o comportamento dele?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">5. Sente-se irritado quando está perto dele?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">6. Sente que ele afeta seus relacionamentos?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">7. Tem receio pelo futuro do seu familiar?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
      </div>
      <div>
        <div class="item-box"><span class="item-box-title">8. Sente que ele depende excessivamente de você?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">9. Sente-se tenso ou ansioso ao lado dele?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">10. Sente que sua saúde foi afetada pelo cuidar?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">11. Sente falta de privacidade em sua própria casa?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">12. Sente que sua vida social foi prejudicada?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">13. Gostaria de transferir o cuidado para outro?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
        <div class="item-box"><span class="item-box-title">14. No geral, quão sobrecarregado você se sente?</span><br>[ ] 0 &bull; [ ] 1 &bull; [ ] 2 &bull; [ ] 3 &bull; [ ] 4</div>
      </div>
    </div>
    """,
    score_html="ESCORE TOTAL ZARIT (0 a 56): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="ESTRATIFICAÇÃO DA SOBRECARGA E APOIO PSICOSSOCIAL",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">&le; 20 PONTOS</div><div class="interp-body"><strong>Sobrecarga Ausente ou Mínima:</strong> Cuidador com boa capacidade adaptativa e suporte familiar equilibrado.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">21 a 40 PONTOS</div><div class="interp-body"><strong>Sobrecarga Leve a Moderada:</strong> Necessidade de divisão de rotinas de cuidado e orientações de autocuidado.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&gt; 40 PONTOS</div><div class="interp-body"><strong>Sobrecarga Moderada a Grave / Burnout:</strong> Suporte psicológico urgente, grupos de apoio e assistência social.</div></div>
    """,
    ref="ZARIT, S. H. et al. Relatives of the impaired elderly: correlates of feelings of burden. The Gerontologist, 1980; 20(6):649-655."
)
