# -*- coding: utf-8 -*-
# scripts/pdf_builder/esc_22_tinetti.py
import sys, os
sys.path.append(os.path.dirname(__file__))
from render_engine import compile_scale_pdf

compile_scale_pdf(
    slug="tinetti",
    name="ESCALA DE TINETTI (POMA)",
    subtitle="Performance-Oriented Mobility Assessment — Avaliação do Risco de Queda por Equilíbrio e Marcha",
    criteria_title="AVALIAÇÃO DE EQUILÍBRIO (16 PTS) E MARCHA (12 PTS)",
    criteria_html="""
    <div class="grid-2col">
      <div>
        <div style="font-weight:bold;color:#1A3E74;margin-bottom:3px;font-size:8pt;">1. Equilíbrio Estático e Dinâmico (0 a 16 pts):</div>
        <div class="item-box"><span class="item-box-title">Equilíbrio sentado:</span> [ ] Escorrega (0) &bull; [ ] Firme/Seguro (1)</div>
        <div class="item-box"><span class="item-box-title">Levantar da cadeira:</span> [ ] Incapaz (0) &bull; [ ] Usa braços (1) &bull; [ ] Sem braços (2)</div>
        <div class="item-box"><span class="item-box-title">Tentativas de levantar:</span> [ ] >1 tentativa (0) &bull; [ ] Consegue em 1x (1)</div>
        <div class="item-box"><span class="item-box-title">Equilíbrio em pé imediato (5s):</span> [ ] Instável (0) &bull; [ ] Firme (2)</div>
        <div class="item-box"><span class="item-box-title">Equilíbrio em pé mantido:</span> [ ] Instável (0) &bull; [ ] Base firme (2)</div>
        <div class="item-box"><span class="item-box-title">Estímulo no esterno (3x):</span> [ ] Começa a cair (0) &bull; [ ] Firme (2)</div>
        <div class="item-box"><span class="item-box-title">Olhos fechados em pé:</span> [ ] Instável (0) &bull; [ ] Estável (1)</div>
        <div class="item-box"><span class="item-box-title">Girar 360 graus:</span> [ ] Passos descontínuos (0/1) &bull; [ ] Instável (0/1)</div>
        <div class="item-box"><span class="item-box-title">Sentar-se:</span> [ ] Inseguro/cai (0) &bull; [ ] Usa braços (1) &bull; [ ] Suave (2)</div>
      </div>
      <div>
        <div style="font-weight:bold;color:#1A3E74;margin-bottom:3px;font-size:8pt;">2. Avaliação da Marcha (0 a 12 pts):</div>
        <div class="item-box"><span class="item-box-title">Início da marcha:</span> [ ] Hesitação (0) &bull; [ ] Sem hesitação (1)</div>
        <div class="item-box"><span class="item-box-title">Comprimento do passo:</span> [ ] Não ultrapassa pé apoio (0) &bull; [ ] Ultrapassa (1)</div>
        <div class="item-box"><span class="item-box-title">Altura do passo:</span> [ ] Arrasta o pé (0) &bull; [ ] Eleva o pé totalmente (1)</div>
        <div class="item-box"><span class="item-box-title">Simetria do passo:</span> [ ] Passos desiguais (0) &bull; [ ] Passos simétricos (1)</div>
        <div class="item-box"><span class="item-box-title">Continuidade da marcha:</span> [ ] Para entre passos (0) &bull; [ ] Fluida/contínua (1)</div>
        <div class="item-box"><span class="item-box-title">Trajetória (linha reta):</span> [ ] Desvio (0) &bull; [ ] Reta firme (2)</div>
        <div class="item-box"><span class="item-box-title">Tronco na marcha:</span> [ ] Oscilação (0) &bull; [ ] Firme sem apoio (2)</div>
        <div class="item-box"><span class="item-box-title">Base de apoio na marcha:</span> [ ] Calcanhares separados (0) &bull; [ ] Quase tocam (1)</div>
      </div>
    </div>
    """,
    score_html="ESCORE TOTAL TINETTI: &nbsp; [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] / 28 &nbsp; (Equilíbrio: /16 &bull; Marcha: /12)",
    interp_title="ESTRATIFICAÇÃO DO RISCO DE QUEDA EM IDOSOS",
    interp_cards_html="""
      <div class="interp-card"><div class="interp-head" style="background:#DC2626;">&lt; 19 PONTOS (ALTO RISCO)</div><div class="interp-body">Equilíbrio e marcha gravemente comprometidos; alto risco de quedas repetidas. Uso de andador e supervisão.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#F97316;">19 a 23 PONTOS (RISCO MODERADO)</div><div class="interp-body">Instabilidade presente em manobras de giro ou levantar; instituir plano institucional de prevenção de quedas.</div></div>
      <div class="interp-card"><div class="interp-head" style="background:#16A34A;">24 a 28 PONTOS (BAIXO RISCO)</div><div class="interp-body">Marcha funcional e equilíbrio preservados; paciente independente para deslocamentos na enfermaria.</div></div>
    """,
    ref="TINETTI, M. E. Performance-oriented assessment of mobility problems in elderly patients. J Am Geriatr Soc, 1986; 34(2):119-126."
)
