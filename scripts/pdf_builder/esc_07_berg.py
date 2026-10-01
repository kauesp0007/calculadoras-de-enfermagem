# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_07_berg.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="berg",
    name="ESCALA DE EQUILÍBRIO DE BERG (BBS)",
    subtitle="Avaliação do Equilíbrio Estático e Dinâmico e Predição do Risco de Quedas em Idosos",
    criteria_title="14 TAREFAS FUNCIONAIS DE EQUILÍBRIO (PONTUAR DE 0 A 4 POR TAREFA)",
    criteria_html="""
    <div class="grid-2col">
      <div>
        <div class="item-box"><span class="item-box-title">1. Sentado para de pé:</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">2. Em pé sem apoio (2 min):</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">3. Sentado sem apoio (2 min):</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">4. De pé para sentado:</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">5. Transferências leito &harr; cadeira:</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">6. Em pé de olhos fechados (10s):</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">7. Em pé com pés juntos (1 min):</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
      </div>
      <div>
        <div class="item-box"><span class="item-box-title">8. Alcançar à frente c/ braço esticado:</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">9. Pegar objeto no chão:</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">10. Girar o tronco / olhar para trás:</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">11. Girar 360 graus:</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">12. Alternar pés no degrau (8x):</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">13. Em pé com um pé à frente (tandem):</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
        <div class="item-box"><span class="item-box-title">14. Em pé sobre uma perna (unipodal):</span> [ ] 4 &bull; [ ] 3 &bull; [ ] 2 &bull; [ ] 1 &bull; [ ] 0</div>
      </div>
    </div>
    """,
    score_html="ESCORE TOTAL DE BERG (0 a 56): &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] PONTOS",
    interp_title="ESTRATIFICAÇÃO DO RISCO DE QUEDAS E NÍVEL DE MOBILIDADE",
    interp_cards_html="""
      <div class="interp-card">
        <div class="interp-head" style="background:#DC2626;">0 a 20 PONTOS (ALTO RISCO)</div>
        <div class="interp-body">Equilíbrio severamente prejudicado. Risco iminente de queda; locomoção em cadeira de rodas ou auxílio físico total.</div>
      </div>
      <div class="interp-card">
        <div class="interp-head" style="background:#F97316;">21 a 40 PONTOS (RISCO MODERADO)</div>
        <div class="interp-body">Deambulação dependente de dispositivo auxiliar (andador/bengala) ou supervisão direta. Protocolo preventivo rigoroso.</div>
      </div>
      <div class="interp-card">
        <div class="interp-head" style="background:#16A34A;">41 a 56 PONTOS (BAIXO RISCO)</div>
        <div class="interp-body">Boa estabilidade e independência na marcha. Manter estímulo a exercícios físicos e monitorização periódica.</div>
      </div>
    """,
    ref="BERG, K. O. et al. Measuring balance in the elderly: preliminary development of an instrument. Physiotherapy Canada, 1989; 41(6):304-311."
)
